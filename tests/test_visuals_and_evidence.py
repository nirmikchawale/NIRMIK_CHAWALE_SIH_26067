from pathlib import Path

import numpy as np
import pytest

from src.comparison_loader import EvidenceError, evidence_files, load_bundle, read_json
from src.data_loader import load_model
from src.map_view import map_figure
from src.profile_charts import bias_figure, profile_figure
from src.volume_view import slice_figure, volume_figure

ROOT = Path(__file__).resolve().parents[1]
COMPARISON = ROOT / "data" / "comparison"
MODEL = ROOT / "data" / "glorys12_20240102_67E70E_12N14N_0m500m.nc"
CONFIG = COMPARISON / "comparison_config.json"


def _default():
    config, provenance, profiles = load_bundle(COMPARISON)
    return config, provenance, profiles[0]


def test_default_profile_is_ranked_verified_demo():
    _, _, selected = _default()
    assert selected["profile_id"] == "20240102_indian_ocean_prof:23"
    assert selected["matched_level_count"] == 50
    assert selected["selected_for_first_demo"] is True


def test_profile_and_bias_figures_use_selected_rows_and_sign():
    _, _, selected = _default()
    table = selected["_table"]
    pfig = profile_figure(table)
    bfig = bias_figure(table)

    assert len(pfig.data) == 2
    assert len(pfig.data[0].x) == len(table)
    assert np.allclose(np.asarray(pfig.data[0].x, float), table["model_temperature_interpolated"].to_numpy(float))
    assert np.allclose(np.asarray(pfig.data[1].x, float), table["observed_temperature"].to_numpy(float))
    assert np.allclose(np.asarray(bfig.data[0].x, float), table["signed_bias_celsius"].to_numpy(float))


def test_map_uses_selected_observation_and_model_cell_coordinates():
    config, _, selected = _default()
    model = load_model(MODEL, config)
    fig = map_figure(model, selected)

    model_trace = next(t for t in fig.data if t.name == "Nearest Copernicus cell")
    argo_trace = next(t for t in fig.data if t.name == "Selected Argo profile")
    assert float(model_trace.x[0]) == pytest.approx(selected["model_cell_longitude"])
    assert float(model_trace.y[0]) == pytest.approx(selected["model_cell_latitude"])
    assert float(argo_trace.x[0]) == pytest.approx(selected["observation_longitude"])
    assert float(argo_trace.y[0]) == pytest.approx(selected["observation_latitude"])


def test_actual_model_3d_and_slice_construct():
    config, _, _ = _default()
    model = load_model(MODEL, config)
    fig3d = volume_figure(model, depth_index=18, vertical_exaggeration=5.0, opacity=0.5)
    fig2d = slice_figure(model, depth_index=18)
    assert len(fig3d.data) >= 2
    assert len(fig2d.data) == 1
    assert fig3d.data[0].name == "3D model temperature"


def test_invalid_depth_slice_fails_gracefully():
    config, _, _ = _default()
    model = load_model(MODEL, config)
    with pytest.raises(EvidenceError, match="outside the available depth indices"):
        slice_figure(model, len(model["depth"]) + 1)


def test_all_judge_facing_evidence_download_sources_exist_and_are_nonempty():
    _, _, selected = _default()
    paths = evidence_files(selected, COMPARISON)
    assert set(paths) == {
        "profile_csv",
        "profile_json",
        "comparison_summary",
        "comparison_config",
        "comparison_provenance",
        "verification_results",
    }
    for path in paths.values():
        assert path.is_file(), path
        assert path.stat().st_size > 0, path


def test_selected_downloads_point_to_selected_profile_only():
    _, _, profiles = load_bundle(COMPARISON)
    selected = profiles[1]
    paths = evidence_files(selected, COMPARISON)
    assert selected["file_id"] in paths["profile_csv"].name
    assert selected["file_id"] in paths["profile_json"].name


def test_judge_facing_ui_has_no_todo_fixme_or_fake_placeholder_language():
    judge_files = [ROOT / "app.py", ROOT / "src" / "ui_components.py", ROOT / "src" / "provenance_view.py"]
    forbidden = ("TODO", "FIXME", "lorem ipsum", "fake data", "dummy data")
    for path in judge_files:
        text = path.read_text(encoding="utf-8").lower()
        for token in forbidden:
            assert token.lower() not in text, f"{token} found in {path}"


def test_model_time_decodes_to_verified_2024_01_02_timestamp():
    config, _, _ = _default()
    model = load_model(MODEL, config)
    assert model["time_value"] == pytest.approx(648696.0)
    assert model["time_units"] == "hours since 1950-01-01"


def test_temperature_pipeline_uses_adjusted_argo_fields_without_raw_fallback():
    config = read_json(CONFIG)
    policy = config["temperature_policy"]
    assert policy["observed_in_situ"] == "TEMP_ADJUSTED"
    assert policy["pressure"] == "PRES_ADJUSTED"
    assert policy["salinity_auxiliary_only"] == "PSAL_ADJUSTED"
    assert config["accepted_provider_qc"] == ["1"]


def test_profile_and_bias_depth_axes_are_reversed():
    _, _, selected = _default()
    assert profile_figure(selected["_table"]).layout.yaxis.autorange == "reversed"
    assert bias_figure(selected["_table"]).layout.yaxis.autorange == "reversed"


def test_bundled_scientific_files_match_data_manifest_hashes():
    from hashlib import sha256
    import json

    manifest = json.loads((ROOT / "data_manifest.json").read_text(encoding="utf-8"))
    for rel in [
        "data/glorys12_20240102_67E70E_12N14N_0m500m.nc",
        "data/comparison/profile_5907092_cycle013_D_level_comparison.csv",
        "data/comparison/profile_5907092_cycle013_D_summary.json",
        "data/comparison/comparison_config.json",
        "data/comparison/comparison_provenance.json",
    ]:
        path = ROOT / rel
        assert sha256(path.read_bytes()).hexdigest() == manifest[rel]


def test_original_comparison_provenance_records_raw_inputs_unchanged():
    provenance = read_json(COMPARISON / "comparison_provenance.json")
    assert provenance["raw_unchanged"] is True
    assert provenance["source_checksums_before"] == provenance["source_checksums_after"]
