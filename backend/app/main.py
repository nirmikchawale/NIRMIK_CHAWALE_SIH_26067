"""FastAPI facade over OceanTwin's verified local scientific evidence."""
from __future__ import annotations

from functools import lru_cache
import math
import os
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from config import (
    ARGO_DOI,
    ARGO_PROVIDER,
    COMPARISON_DIR,
    DATASET_ID,
    DEMO_DATE,
    DEMO_REGION,
    DISCLAIMER,
    MODEL_DOI,
    MODEL_FILE,
    MODEL_LABEL,
    PRODUCT_LABEL,
)
from src.comparison_loader import (
    EvidenceError,
    load_bundle,
    load_optional_metadata,
    select_profile,
)
from src.ocean_dataset import load_ocean_dataset
from src.source_registry import registry_payload


def _env_flag(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


RUNTIME_MODE = os.environ.get("OCEANTWIN_RUNTIME_MODE", "cached_verified")
SCIENCE_NETWORK_REQUIRED = _env_flag("OCEANTWIN_SCIENCE_NETWORK_REQUIRED", False)


app = FastAPI(
    title="OceanTwin 3D API",
    version="1.0.0-mvp",
    description=(
        "Read-only API exposing the same verified Copernicus/Argo evidence used by "
        "the frozen Streamlit scientific reference."
    ),
)

_allowed_origins = [
    item.strip()
    for item in os.environ.get(
        "OCEANTWIN_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if item.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def _dataset() -> dict[str, Any]:
    return load_ocean_dataset(MODEL_FILE)


@lru_cache(maxsize=1)
def _comparison_bundle():
    return load_bundle(COMPARISON_DIR)


def _ensure_index(name: str, index: int, size: int) -> None:
    if not 0 <= index < size:
        raise HTTPException(status_code=422, detail=f"{name} index {index} is outside 0..{size - 1}.")


def _finite_or_none(value: float) -> float | None:
    value = float(value)
    return value if math.isfinite(value) else None


def _profile_summary(profile: dict[str, Any]) -> dict[str, Any]:
    keep = {
        key: value
        for key, value in profile.items()
        if not key.startswith("_") and not isinstance(value, Path)
    }
    return keep


@app.get("/api/health")
def health() -> dict[str, Any]:
    try:
        dataset = _dataset()
        _, _, profiles = _comparison_bundle()
    except EvidenceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {
        "status": "ok",
        "model_file": MODEL_FILE.name,
        "model_file_present": MODEL_FILE.is_file(),
        "comparison_directory_present": COMPARISON_DIR.is_dir(),
        "variables": sorted(dataset["variables"].keys()),
        "time_steps": len(dataset["time"]),
        "depth_levels": len(dataset["depth"]),
        "eligible_profiles": len(profiles),
        "scientific_data_network_required": SCIENCE_NETWORK_REQUIRED,
        "runtime_mode": RUNTIME_MODE,
        "streamlit_reference_preserved": True,
    }


@app.get("/api/connectors")
def connectors() -> dict[str, Any]:
    """Discover registered model/observation/standards adapters."""
    return registry_payload()


@app.get("/api/catalog")
def catalog() -> dict[str, Any]:
    try:
        dataset = _dataset()
    except EvidenceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    variable_cards = []
    for name in ("thetao", "so"):
        if name in dataset["variables"]:
            meta = dataset["variables"][name]
            variable_cards.append(
                {
                    "id": name,
                    "label": meta["label"],
                    "kind": "scalar",
                    "units": meta["units"],
                    "standard_name": meta["standard_name"],
                    "minimum": meta["minimum"],
                    "maximum": meta["maximum"],
                }
            )

    if "uo" in dataset["variables"] and "vo" in dataset["variables"]:
        u = dataset["variables"]["uo"]["values"]
        v = dataset["variables"]["vo"]["values"]
        speed = np.sqrt(u**2 + v**2)
        finite_speed = speed[np.isfinite(speed)]
        variable_cards.append(
            {
                "id": "currents",
                "label": "Currents",
                "kind": "vector",
                "units": "m s-1",
                "components": ["uo", "vo"],
                "minimum": float(finite_speed.min()),
                "maximum": float(finite_speed.max()),
            }
        )

    return {
        "dataset": {
            "label": MODEL_LABEL,
            "product": PRODUCT_LABEL,
            "dataset_id": DATASET_ID,
            "doi": MODEL_DOI,
            "source": dataset["source"],
            "title": dataset["title"],
            "region": DEMO_REGION,
            "demo_date": DEMO_DATE,
            "freshness_class": "reanalysis",
            "runtime_mode": RUNTIME_MODE,
        },
        "coordinates": {
            "longitude": dataset["longitude"].tolist(),
            "latitude": dataset["latitude"].tolist(),
            "depth": dataset["depth"].tolist(),
            "depth_units": dataset["depth_units"],
            "depth_positive": dataset["depth_positive"],
            "time": dataset["time_iso"],
        },
        "variables": variable_cards,
        "capabilities": {
            "scalar_3d": True,
            "depth_slice": True,
            "current_vectors": "uo" in dataset["variables"] and "vo" in dataset["variables"],
            "time_steps": len(dataset["time"]),
            "time_animation": len(dataset["time"]) > 1,
            "argo_profiles": True,
            "offline_scientific_data": True,
            "streamlit_fallback": True,
        },
        "scientific_disclaimer": DISCLAIMER,
    }


@app.get("/api/field")
def scalar_field(
    variable: str = Query("thetao", pattern="^(thetao|so)$"),
    time_index: int = 0,
    depth_index: int = 0,
    stride: int = Query(1, ge=1, le=8),
) -> dict[str, Any]:
    dataset = _dataset()
    if variable not in dataset["variables"]:
        raise HTTPException(status_code=404, detail=f"Variable {variable!r} is not in the cached dataset.")

    _ensure_index("time", time_index, len(dataset["time"]))
    _ensure_index("depth", depth_index, len(dataset["depth"]))

    meta = dataset["variables"][variable]
    values = meta["values"][time_index, depth_index, ::stride, ::stride]
    latitude = dataset["latitude"][::stride]
    longitude = dataset["longitude"][::stride]

    return {
        "variable": variable,
        "label": meta["label"],
        "units": meta["units"],
        "time_index": time_index,
        "time": dataset["time_iso"][time_index],
        "depth_index": depth_index,
        "depth_m": float(dataset["depth"][depth_index]),
        "latitude": latitude.tolist(),
        "longitude": longitude.tolist(),
        "values": [[_finite_or_none(v) for v in row] for row in values],
        "minimum": meta["minimum"],
        "maximum": meta["maximum"],
        "provenance": {
            "product": PRODUCT_LABEL,
            "dataset_id": DATASET_ID,
            "freshness_class": "reanalysis",
            "runtime_mode": RUNTIME_MODE,
        },
    }


def _summary_stats(values: np.ndarray) -> dict[str, float | int]:
    finite = np.asarray(values, dtype=float)
    finite = finite[np.isfinite(finite)]
    if finite.size == 0:
        raise HTTPException(status_code=404, detail="No finite model values are available for telemetry.")
    p10, p50, p90 = np.percentile(finite, [10, 50, 90])
    return {
        "count": int(finite.size),
        "mean": float(finite.mean()),
        "minimum": float(finite.min()),
        "maximum": float(finite.max()),
        "std": float(finite.std()),
        "p10": float(p10),
        "p50": float(p50),
        "p90": float(p90),
    }


@app.get("/api/telemetry")
def scalar_telemetry(
    variable: str = Query("thetao", pattern="^(thetao|so)$"),
    time_index: int = 0,
    depth_index: int = 0,
) -> dict[str, Any]:
    dataset = _dataset()
    if variable not in dataset["variables"]:
        raise HTTPException(status_code=404, detail=f"Variable {variable!r} is not in the cached dataset.")

    _ensure_index("time", time_index, len(dataset["time"]))
    _ensure_index("depth", depth_index, len(dataset["depth"]))

    meta = dataset["variables"][variable]
    values = meta["values"]

    depth_stats = []
    for di, depth in enumerate(dataset["depth"]):
        depth_stats.append(
            {
                "depth_index": di,
                "depth_m": float(depth),
                **_summary_stats(values[time_index, di]),
            }
        )

    time_stats = []
    for ti, time_iso in enumerate(dataset["time_iso"]):
        time_stats.append(
            {
                "time_index": ti,
                "time": time_iso,
                **_summary_stats(values[ti, depth_index]),
            }
        )

    current_summary = None
    if "uo" in dataset["variables"] and "vo" in dataset["variables"]:
        u = np.asarray(dataset["variables"]["uo"]["values"][time_index, depth_index], dtype=float)
        v = np.asarray(dataset["variables"]["vo"]["values"][time_index, depth_index], dtype=float)
        keep = np.isfinite(u) & np.isfinite(v)
        if np.any(keep):
            speed = np.sqrt(u[keep] ** 2 + v[keep] ** 2)
            current_summary = {
                "count": int(speed.size),
                "mean_speed": float(speed.mean()),
                "maximum_speed": float(speed.max()),
                "mean_u": float(u[keep].mean()),
                "mean_v": float(v[keep].mean()),
                "units": "m s-1",
            }

    return {
        "variable": variable,
        "label": meta["label"],
        "units": meta["units"],
        "time_index": time_index,
        "time": dataset["time_iso"][time_index],
        "selected_depth_index": depth_index,
        "selected_depth_m": float(dataset["depth"][depth_index]),
        "depth_positive": dataset["depth_positive"],
        "depth_stats": depth_stats,
        "time_stats": time_stats,
        "time_series_available": len(dataset["time"]) > 1,
        "current_summary": current_summary,
        "spatial_grid": {
            "longitude_count": int(len(dataset["longitude"])),
            "latitude_count": int(len(dataset["latitude"])),
            "finite_cell_statistics": "unweighted finite model grid cells",
        },
        "provenance": {
            "product": PRODUCT_LABEL,
            "dataset_id": DATASET_ID,
            "freshness_class": "reanalysis",
            "runtime_mode": RUNTIME_MODE,
        },
        "statistic_definition": (
            "Depth summaries use unweighted finite model grid cells at each exact model depth "
            "for the selected genuine timestamp. Time summaries use the same statistic at the "
            "selected exact model depth for each genuine model timestamp. No temporal or vertical "
            "samples are synthesized."
        ),
    }


ROBUST_Z_THRESHOLD = 3.5
ROBUST_Z_NORMALIZER = 0.67448975


def _robust_scores(values: np.ndarray) -> tuple[np.ndarray, float, float]:
    array = np.asarray(values, dtype=float)
    finite = array[np.isfinite(array)]
    if finite.size == 0:
        raise HTTPException(status_code=404, detail="No finite values are available for anomaly screening.")
    median = float(np.median(finite))
    mad = float(np.median(np.abs(finite - median)))
    if mad <= 0:
        return np.full(array.shape, np.nan, dtype=float), median, mad
    return ROBUST_Z_NORMALIZER * (array - median) / mad, median, mad


@app.get("/api/anomalies")
def anomaly_screen(
    variable: str = Query("thetao", pattern="^(thetao|so)$"),
    time_index: int = 0,
    depth_index: int = 0,
) -> dict[str, Any]:
    dataset = _dataset()
    if variable not in dataset["variables"]:
        raise HTTPException(status_code=404, detail=f"Variable {variable!r} is not in the cached dataset.")
    _ensure_index("time", time_index, len(dataset["time"]))
    _ensure_index("depth", depth_index, len(dataset["depth"]))

    meta = dataset["variables"][variable]
    layer = np.asarray(meta["values"][time_index, depth_index], dtype=float)
    spatial_scores, spatial_median, spatial_mad = _robust_scores(layer)
    spatial_flags = []
    if spatial_mad > 0:
        for yi, lat in enumerate(dataset["latitude"]):
            for xi, lon in enumerate(dataset["longitude"]):
                value = float(layer[yi, xi])
                score = float(spatial_scores[yi, xi])
                if math.isfinite(value) and math.isfinite(score) and abs(score) >= ROBUST_Z_THRESHOLD:
                    spatial_flags.append({
                        "longitude": float(lon),
                        "latitude": float(lat),
                        "depth_m": float(dataset["depth"][depth_index]),
                        "value": value,
                        "robust_z": score,
                    })
    spatial_flags.sort(key=lambda item: abs(item["robust_z"]), reverse=True)

    try:
        _, _, profile_items = _comparison_bundle()
    except EvidenceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    residual_flags = []
    residual_profiles = []
    residual_sample_count = 0
    for profile in profile_items:
        table = profile["_table"]
        biases = np.asarray(table["signed_bias_celsius"], dtype=float)
        scores, median, mad = _robust_scores(biases)
        finite_count = int(np.isfinite(biases).sum())
        residual_sample_count += finite_count
        profile_flag_count = 0
        if mad > 0:
            for row_index, (_, row) in enumerate(table.iterrows()):
                bias = float(row["signed_bias_celsius"])
                score = float(scores[row_index])
                if math.isfinite(bias) and math.isfinite(score) and abs(score) >= ROBUST_Z_THRESHOLD:
                    profile_flag_count += 1
                    residual_flags.append({
                        "profile_id": str(profile["profile_id"]),
                        "platform_id": str(profile["platform_id"]),
                        "cycle": int(profile["cycle"]),
                        "direction": str(profile["direction"]),
                        "observation_depth_m": float(row["observation_depth_m"]),
                        "signed_bias_celsius": bias,
                        "absolute_error_celsius": float(row["absolute_error_celsius"]),
                        "robust_z": score,
                    })
        residual_profiles.append({
            "profile_id": str(profile["profile_id"]),
            "platform_id": str(profile["platform_id"]),
            "cycle": int(profile["cycle"]),
            "direction": str(profile["direction"]),
            "sample_count": finite_count,
            "median_bias_celsius": median,
            "mad_bias_celsius": mad,
            "flagged_count": profile_flag_count,
            "screen_available": mad > 0,
        })
    residual_flags.sort(key=lambda item: abs(item["robust_z"]), reverse=True)
    genuine_time_count = len(dataset["time"])

    return {
        "variable": variable,
        "label": meta["label"],
        "units": meta["units"],
        "time_index": time_index,
        "time": dataset["time_iso"][time_index],
        "depth_index": depth_index,
        "depth_m": float(dataset["depth"][depth_index]),
        "method": {
            "name": "median absolute deviation robust z-score",
            "formula": "0.67448975 × (x − median) / MAD",
            "absolute_threshold": ROBUST_Z_THRESHOLD,
            "two_sided": True,
            "zero_mad_policy": "fail closed: no robust score or flag is produced when MAD is zero",
        },
        "spatial_screen": {
            "scope": "finite model grid cells at the exact selected depth and genuine timestamp",
            "sample_count": int(np.isfinite(layer).sum()),
            "median": spatial_median,
            "mad": spatial_mad,
            "screen_available": spatial_mad > 0,
            "flagged_count": len(spatial_flags),
            "flags": spatial_flags[:60],
        },
        "residual_screen": {
            "scope": "verified Argo temperature residuals, Model − Observation, screened separately within each profile",
            "temperature_only": True,
            "profiles_screened": len(residual_profiles),
            "sample_count": residual_sample_count,
            "flagged_count": len(residual_flags),
            "profile_statistics": residual_profiles,
            "flags": residual_flags[:80],
        },
        "temporal_screen": {
            "available": False,
            "genuine_time_count": genuine_time_count,
            "status": "locked",
            "reason": (
                "Temporal anomaly screening is disabled in this MVP because the bundled model evidence "
                f"contains {genuine_time_count} genuine timestamp(s). At least three genuine timestamps "
                "would be required before a robust temporal screen is scientifically meaningful."
            ),
        },
        "provenance": {
            "product": PRODUCT_LABEL,
            "dataset_id": DATASET_ID,
            "freshness_class": "reanalysis",
            "runtime_mode": RUNTIME_MODE,
            "argo_provider": ARGO_PROVIDER,
        },
        "interpretation": (
            "Flags are explainable statistical extremes within the available evidence. They are not proof "
            "of an ocean event, sensor fault, forecast anomaly, or independent validation result."
        ),
    }


@app.get("/api/volume")
def scalar_volume(
    variable: str = Query("thetao", pattern="^(thetao|so)$"),
    time_index: int = 0,
    horizontal_stride: int = Query(2, ge=1, le=8),
    depth_stride: int = Query(2, ge=1, le=8),
) -> dict[str, Any]:
    dataset = _dataset()
    if variable not in dataset["variables"]:
        raise HTTPException(status_code=404, detail=f"Variable {variable!r} is not in the cached dataset.")
    _ensure_index("time", time_index, len(dataset["time"]))

    meta = dataset["variables"][variable]
    values = meta["values"][time_index]
    points: list[list[float]] = []
    for di in range(0, len(dataset["depth"]), depth_stride):
        depth = float(dataset["depth"][di])
        layer = values[di]
        for yi in range(0, len(dataset["latitude"]), horizontal_stride):
            lat = float(dataset["latitude"][yi])
            for xi in range(0, len(dataset["longitude"]), horizontal_stride):
                value = float(layer[yi, xi])
                if math.isfinite(value):
                    points.append([float(dataset["longitude"][xi]), lat, depth, value])

    return {
        "variable": variable,
        "label": meta["label"],
        "units": meta["units"],
        "time_index": time_index,
        "time": dataset["time_iso"][time_index],
        "points": points,
        "minimum": meta["minimum"],
        "maximum": meta["maximum"],
        "depth_positive": "down",
        "rendering_note": (
            "Depth values are scientific metres positive downward. The browser may apply "
            "visual exaggeration without changing these values."
        ),
    }


@app.get("/api/currents")
def currents(
    time_index: int = 0,
    depth_index: int = 0,
    stride: int = Query(2, ge=1, le=8),
) -> dict[str, Any]:
    dataset = _dataset()
    if "uo" not in dataset["variables"] or "vo" not in dataset["variables"]:
        raise HTTPException(status_code=404, detail="Current components uo/vo are unavailable.")

    _ensure_index("time", time_index, len(dataset["time"]))
    _ensure_index("depth", depth_index, len(dataset["depth"]))

    u = dataset["variables"]["uo"]["values"][time_index, depth_index]
    v = dataset["variables"]["vo"]["values"][time_index, depth_index]
    vectors: list[list[float]] = []
    speeds: list[float] = []

    for yi in range(0, len(dataset["latitude"]), stride):
        lat = float(dataset["latitude"][yi])
        for xi in range(0, len(dataset["longitude"]), stride):
            uu = float(u[yi, xi])
            vv = float(v[yi, xi])
            if not (math.isfinite(uu) and math.isfinite(vv)):
                continue
            speed = math.hypot(uu, vv)
            speeds.append(speed)
            vectors.append([float(dataset["longitude"][xi]), lat, uu, vv, speed])

    return {
        "variable": "currents",
        "units": "m s-1",
        "time_index": time_index,
        "time": dataset["time_iso"][time_index],
        "depth_index": depth_index,
        "depth_m": float(dataset["depth"][depth_index]),
        "vectors": vectors,
        "minimum": min(speeds) if speeds else 0.0,
        "maximum": max(speeds) if speeds else 0.0,
        "rendering_note": (
            "Vector glyphs may be projected to the visible ocean surface for readability; "
            "their values always correspond to the selected model depth."
        ),
    }


@app.get("/api/profiles")
def profiles() -> dict[str, Any]:
    try:
        _, _, profile_items = _comparison_bundle()
    except EvidenceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {
        "provider": ARGO_PROVIDER,
        "doi": ARGO_DOI,
        "profiles": [_profile_summary(item) for item in profile_items],
    }


@app.get("/api/profiles/{profile_id}")
def profile_detail(profile_id: str) -> dict[str, Any]:
    try:
        _, _, profile_items = _comparison_bundle()
        selected = select_profile(profile_items, profile_id)
    except EvidenceError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    table = selected["_table"].copy()
    rows = []
    for record in table.to_dict(orient="records"):
        rows.append(
            {
                key: (_finite_or_none(value) if isinstance(value, (float, np.floating)) else value)
                for key, value in record.items()
            }
        )
    return {
        "summary": _profile_summary(selected),
        "levels": rows,
        "comparison_semantics": {
            "bias": "Model − Observation",
            "horizontal": "nearest valid Copernicus water cell",
            "vertical": "linear interpolation between adjacent valid model depths; no extrapolation",
            "interpretation": "diagnostic consistency, not independent validation",
        },
    }


@app.get("/api/provenance")
def provenance() -> dict[str, Any]:
    try:
        config, comparison_provenance, _ = _comparison_bundle()
    except EvidenceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    metadata = load_optional_metadata(COMPARISON_DIR)
    metadata_keys = sorted(metadata.keys()) if isinstance(metadata, dict) else []
    return {
        "model": {
            "label": MODEL_LABEL,
            "product": PRODUCT_LABEL,
            "dataset_id": DATASET_ID,
            "doi": MODEL_DOI,
            "file": MODEL_FILE.name,
            "freshness_class": "reanalysis",
            "runtime_mode": "cached_verified",
        },
        "observations": {
            "provider": ARGO_PROVIDER,
            "doi": ARGO_DOI,
        },
        "quality_control": {
            "accepted_provider_qc": config.get("accepted_provider_qc", []),
            "max_cell_distance_km": config.get("max_cell_distance_km"),
            "matched_profiles": len(_comparison_bundle()[2]),
            "no_extrapolation": True,
            "metrics_weighting": config.get("metrics_weighting"),
        },
        "methodology": {
            "horizontal": config.get("horizontal_policy"),
            "depth": config.get("depth_policy"),
            "time": config.get("time_policy"),
            "temperature": config.get("temperature_policy"),
        },
        "integrity": {
            "created_utc": comparison_provenance.get("created_utc"),
            "source_checksums_unchanged": comparison_provenance.get("raw_unchanged"),
            "configuration_sha256": comparison_provenance.get("configuration_sha256"),
            "engine_sha256": comparison_provenance.get("engine_sha256"),
            "no_synthetic_measurements_in_outputs": comparison_provenance.get(
                "no_synthetic_measurements_in_outputs"
            ),
        },
        "source_metadata_available": metadata_keys,
        "scientific_disclaimer": DISCLAIMER,
    }
