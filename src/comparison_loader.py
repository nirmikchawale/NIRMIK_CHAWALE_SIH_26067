"""Load and validate the existing verified model–Argo comparison evidence."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


class EvidenceError(RuntimeError):
    """Raised when local scientific evidence is missing, malformed or inconsistent."""


SUMMARY_REQUIRED = {
    "profile_id",
    "file_id",
    "platform_id",
    "cycle",
    "direction",
    "matched_level_count",
    "mae_celsius",
    "rmse_celsius",
    "spatial_distance_km",
    "time_offset_hours",
    "time_offset_from_daily_midpoint_hours",
    "observation_time_utc",
    "observation_longitude",
    "observation_latitude",
    "model_cell_longitude",
    "model_cell_latitude",
    "shallowest_matched_depth_m",
    "deepest_matched_depth_m",
    "temperature_units",
    "temperature_basis",
    "qc_policy",
}

TABLE_REQUIRED = {
    "profile_id",
    "observation_depth_m",
    "observed_temperature",
    "model_temperature_interpolated",
    "signed_bias_celsius",
    "absolute_error_celsius",
    "pressure_qc",
    "temperature_qc",
    "salinity_auxiliary_qc",
    "position_qc",
    "time_qc",
    "qc_status",
}

NUMERIC_TABLE_COLUMNS = [
    "observation_depth_m",
    "observed_temperature",
    "observed_in_situ_temperature_celsius",
    "pressure_dbar",
    "model_temperature_interpolated",
    "signed_bias_celsius",
    "absolute_error_celsius",
    "model_lower_depth_m",
    "model_upper_depth_m",
    "spatial_distance_km",
    "time_offset_hours",
    "time_offset_from_daily_midpoint_hours",
]


def read_json(path: Path) -> dict[str, Any]:
    path = Path(path)
    if not path.is_file():
        raise EvidenceError(f"Missing local evidence file: {path}")
    try:
        with path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
    except (OSError, json.JSONDecodeError) as exc:
        raise EvidenceError(f"Malformed JSON evidence: {path.name}: {exc}") from exc
    if not isinstance(data, dict):
        raise EvidenceError(f"Expected a JSON object in {path.name}.")
    return data


def load_profile_summary(path: Path) -> dict[str, Any]:
    data = read_json(path)
    missing = sorted(SUMMARY_REQUIRED.difference(data))
    if missing:
        raise EvidenceError(
            f"Profile summary {Path(path).name} is missing required fields: {', '.join(missing)}"
        )
    return data


def load_comparison_table(path: Path) -> pd.DataFrame:
    path = Path(path)
    if not path.is_file():
        raise EvidenceError(f"Missing profile comparison table: {path}")
    try:
        frame = pd.read_csv(path)
    except Exception as exc:
        raise EvidenceError(f"Malformed comparison CSV {path.name}: {exc}") from exc

    missing = sorted(TABLE_REQUIRED.difference(frame.columns))
    if missing:
        raise EvidenceError(
            f"Comparison CSV {path.name} is missing required columns: {', '.join(missing)}"
        )
    if frame.empty:
        raise EvidenceError(f"Comparison CSV contains no matched levels: {path.name}")

    for col in NUMERIC_TABLE_COLUMNS:
        if col in frame.columns:
            frame[col] = pd.to_numeric(frame[col], errors="coerce")

    critical = [
        "observation_depth_m",
        "observed_temperature",
        "model_temperature_interpolated",
        "signed_bias_celsius",
        "absolute_error_celsius",
    ]
    if frame[critical].isna().any().any():
        raise EvidenceError(f"Comparison CSV has non-numeric/missing critical values: {path.name}")

    return frame.sort_values("observation_depth_m").reset_index(drop=True)


def _assert_close(name: str, actual: float, expected: float, atol: float = 1e-10):
    if not np.isclose(float(actual), float(expected), rtol=0.0, atol=atol):
        raise EvidenceError(
            f"Comparison evidence inconsistency for {name}: summary={expected!r}, table-derived={actual!r}."
        )


def validate_profile_consistency(summary: dict[str, Any], table: pd.DataFrame) -> None:
    """Ensure KPI cards and charts are derived from the same matched-level evidence."""
    if table["profile_id"].astype(str).nunique() != 1:
        raise EvidenceError(f"Comparison table mixes profile IDs for {summary['file_id']}.")
    if str(table["profile_id"].iloc[0]) != str(summary["profile_id"]):
        raise EvidenceError(f"Profile ID mismatch for {summary['file_id']}.")
    if len(table) != int(summary["matched_level_count"]):
        raise EvidenceError(
            f"Matched-level count mismatch for {summary['file_id']}: JSON says "
            f"{summary['matched_level_count']}, CSV has {len(table)}."
        )

    obs = table["observed_temperature"].to_numpy(float)
    model = table["model_temperature_interpolated"].to_numpy(float)
    bias = table["signed_bias_celsius"].to_numpy(float)
    absolute = table["absolute_error_celsius"].to_numpy(float)
    finite = np.isfinite(obs) & np.isfinite(model) & np.isfinite(bias) & np.isfinite(absolute)
    if not finite.all():
        raise EvidenceError(f"Non-finite matched values detected for {summary['file_id']}.")

    expected_bias = model - obs
    if not np.allclose(bias, expected_bias, rtol=0.0, atol=1e-10):
        raise EvidenceError(f"Bias sign/value mismatch for {summary['file_id']}; expected Model − Observation.")
    if not np.allclose(absolute, np.abs(expected_bias), rtol=0.0, atol=1e-10):
        raise EvidenceError(f"Absolute-error mismatch for {summary['file_id']}.")

    _assert_close("MAE", float(np.mean(np.abs(expected_bias))), float(summary["mae_celsius"]))
    _assert_close("RMSE", float(np.sqrt(np.mean(expected_bias**2))), float(summary["rmse_celsius"]))
    _assert_close("shallowest matched depth", float(table["observation_depth_m"].min()), float(summary["shallowest_matched_depth_m"]))
    _assert_close("deepest matched depth", float(table["observation_depth_m"].max()), float(summary["deepest_matched_depth_m"]))

    for field in ("spatial_distance_km", "time_offset_hours", "time_offset_from_daily_midpoint_hours"):
        if field in table.columns:
            values = table[field].to_numpy(float)
            if not np.allclose(values, float(summary[field]), rtol=0.0, atol=1e-10):
                raise EvidenceError(f"{field} differs between KPI summary and matched-level rows for {summary['file_id']}.")

    for qc_col in ("pressure_qc", "temperature_qc", "salinity_auxiliary_qc", "position_qc", "time_qc"):
        qc = table[qc_col].astype(str).str.replace(r"\.0$", "", regex=True)
        if not (qc == "1").all():
            raise EvidenceError(f"Non-QC-1 rows entered the displayed comparison: {qc_col}.")
    if not (table["qc_status"].astype(str) == "accepted_provider_flag_1").all():
        raise EvidenceError(f"Unexpected QC status in displayed comparison for {summary['file_id']}.")


def load_bundle(directory: Path):
    """Return comparison config, provenance and validated profile bundles."""
    directory = Path(directory)
    if not directory.is_dir():
        raise EvidenceError(f"Comparison evidence directory is missing: {directory}")

    config = read_json(directory / "comparison_config.json")
    provenance = read_json(directory / "comparison_provenance.json")

    summary_paths = sorted(directory.glob("profile_*_summary.json"))
    if not summary_paths:
        raise EvidenceError(f"No profile summary JSON files found in {directory}")

    profiles = []
    for summary_path in summary_paths:
        summary = load_profile_summary(summary_path)
        file_id = str(summary["file_id"])
        table_path = directory / f"profile_{file_id}_level_comparison.csv"
        table = load_comparison_table(table_path)
        validate_profile_consistency(summary, table)

        item = dict(summary)
        item["_table"] = table
        item["_summary_path"] = summary_path
        item["_csv_path"] = table_path
        profiles.append(item)

    profiles.sort(key=lambda p: (int(p.get("rank", 999)), str(p["file_id"])))
    return config, provenance, profiles


def select_profile(profiles: list[dict[str, Any]], profile_id: str) -> dict[str, Any]:
    selected = next((p for p in profiles if str(p.get("profile_id")) == str(profile_id)), None)
    if selected is None:
        raise EvidenceError(f"Selected profile is not available in verified evidence: {profile_id}")
    return selected


def load_optional_metadata(directory: Path) -> dict[str, dict[str, Any]]:
    """Load optional source metadata used by the provenance panel."""
    directory = Path(directory)
    candidates = {
        "argo_summary": directory / "source_metadata" / "argo_argo_summary.json",
        "model_inspection": directory / "source_metadata" / "model_inspection.json",
        "model_provenance": directory / "source_metadata" / "model_provenance.json",
        "argo_manifest": directory / "source_metadata" / "argo_manifest.json",
    }
    result: dict[str, dict[str, Any]] = {}
    for key, path in candidates.items():
        if path.is_file():
            try:
                result[key] = read_json(path)
            except EvidenceError:
                pass
    return result


def evidence_files(summary: dict[str, Any], comparison_dir: Path) -> dict[str, Path]:
    """Return judge-facing evidence paths without creating or mutating files."""
    directory = Path(comparison_dir)
    paths = {
        "profile_csv": Path(summary["_csv_path"]),
        "profile_json": Path(summary["_summary_path"]),
        "comparison_summary": directory / "comparison_summary.md",
        "comparison_config": directory / "comparison_config.json",
        "comparison_provenance": directory / "comparison_provenance.json",
        "verification_results": directory / "verification_results.json",
    }
    return paths
