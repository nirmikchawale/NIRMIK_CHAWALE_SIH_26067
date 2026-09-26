from pathlib import Path

import numpy as np
import pandas as pd
import pytest

from src.comparison_loader import (
    EvidenceError,
    load_bundle,
    load_comparison_table,
    load_profile_summary,
    select_profile,
    validate_profile_consistency,
)

ROOT = Path(__file__).resolve().parents[1]
COMPARISON = ROOT / "data" / "comparison"


def test_profile_summary_loading_real_evidence():
    item = load_profile_summary(COMPARISON / "profile_5907092_cycle013_D_summary.json")
    assert item["profile_id"] == "20240102_indian_ocean_prof:23"
    assert item["matched_level_count"] == 50
    assert item["mae_celsius"] == pytest.approx(0.22538286668411817)
    assert item["qc_policy"].startswith("Provider QC 1")


def test_selected_profile_table_loading_real_evidence():
    frame = load_comparison_table(COMPARISON / "profile_5907092_cycle013_D_level_comparison.csv")
    assert len(frame) == 50
    assert frame["profile_id"].nunique() == 1
    assert frame["observation_depth_m"].min() == pytest.approx(1.3919436791479163)
    assert frame["observation_depth_m"].max() == pytest.approx(447.0244991497731)


def test_bundle_loads_both_eligible_profiles_and_default_is_verified():
    _, _, profiles = load_bundle(COMPARISON)
    assert [p["matched_level_count"] for p in profiles] == [50, 49]
    assert sum(p["matched_level_count"] for p in profiles) == 99
    assert profiles[0]["profile_id"] == "20240102_indian_ocean_prof:23"
    assert profiles[0]["matched_level_count"] > 0


def test_qc_policy_excludes_non_qc1_rows_from_displayed_evidence():
    _, _, profiles = load_bundle(COMPARISON)
    for profile in profiles:
        frame = profile["_table"]
        for col in ("pressure_qc", "temperature_qc", "salinity_auxiliary_qc", "position_qc", "time_qc"):
            normalized = frame[col].astype(str).str.replace(r"\.0$", "", regex=True)
            assert (normalized == "1").all()
        assert (frame["qc_status"].astype(str) == "accepted_provider_flag_1").all()


def test_bias_is_exactly_model_minus_observation():
    frame = load_comparison_table(COMPARISON / "profile_5907092_cycle013_D_level_comparison.csv")
    expected = frame["model_temperature_interpolated"].to_numpy(float) - frame["observed_temperature"].to_numpy(float)
    assert np.allclose(frame["signed_bias_celsius"].to_numpy(float), expected, rtol=0, atol=1e-10)


def test_profile_selection_returns_only_requested_profile():
    _, _, profiles = load_bundle(COMPARISON)
    selected = select_profile(profiles, "20240102_indian_ocean_prof:26")
    assert selected["profile_id"] == "20240102_indian_ocean_prof:26"
    assert selected["_table"]["profile_id"].nunique() == 1
    assert selected["_table"]["profile_id"].iloc[0] == "20240102_indian_ocean_prof:26"


def test_missing_profile_selection_is_explicit():
    _, _, profiles = load_bundle(COMPARISON)
    with pytest.raises(EvidenceError, match="Selected profile is not available"):
        select_profile(profiles, "not-a-real-profile")


def test_metric_consistency_rejects_tampered_bias():
    summary = load_profile_summary(COMPARISON / "profile_5907092_cycle013_D_summary.json")
    frame = load_comparison_table(COMPARISON / "profile_5907092_cycle013_D_level_comparison.csv").copy()
    frame.loc[0, "signed_bias_celsius"] += 0.1
    with pytest.raises(EvidenceError, match="Bias sign/value mismatch"):
        validate_profile_consistency(summary, frame)
