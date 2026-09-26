from pathlib import Path

import numpy as np

from config import DISCLAIMER
from oceantwin.state import default_state
from oceantwin.ui.components import build_metric_items
from oceantwin.ui.plotly_theme import apply_plotly_theme
from oceantwin.ui.tokens import (
    ARGO_AMBER,
    MODEL_CYAN,
    NEGATIVE_BLUE,
    OFFLINE_TEAL,
    POSITIVE_CORAL,
    UI_TOKEN_VERSION,
)
from oceantwin.views.evidence import download_specs, provenance_rows
from src.comparison_loader import load_bundle
from src.profile_charts import profile_figure

ROOT = Path(__file__).resolve().parents[1]
COMPARISON = ROOT / "data" / "comparison"


def _default():
    config, provenance, profiles = load_bundle(COMPARISON)
    return config, provenance, profiles[0]


def test_professional_application_hierarchy_exists():
    required = [
        ROOT / "oceantwin" / "application.py",
        ROOT / "oceantwin" / "state.py",
        ROOT / "oceantwin" / "ui" / "tokens.py",
        ROOT / "oceantwin" / "ui" / "theme.py",
        ROOT / "oceantwin" / "ui" / "components.py",
        ROOT / "oceantwin" / "ui" / "plotly_theme.py",
        ROOT / "oceantwin" / "views" / "dashboard.py",
        ROOT / "oceantwin" / "views" / "evidence.py",
        ROOT / ".streamlit" / "config.toml",
    ]
    assert all(path.is_file() for path in required)


def test_entrypoint_is_thin_and_routes_to_application_package():
    text = (ROOT / "app.py").read_text(encoding="utf-8")
    assert "from oceantwin.application import main" in text
    assert "main()" in text
    assert len(text.splitlines()) < 20


def test_versioned_semantic_design_tokens_are_distinct():
    assert UI_TOKEN_VERSION
    assert len({MODEL_CYAN, ARGO_AMBER, POSITIVE_CORAL, NEGATIVE_BLUE, OFFLINE_TEAL}) == 5


def test_default_state_is_derived_from_verified_inputs_not_scientific_constants():
    state = default_state("profile-from-loader", 7)
    assert state["selected_profile_id"] == "profile-from-loader"
    assert state["model_depth_index"] == 7
    assert state["enabled_variable"] == "Temperature"
    assert state["force_2d"] is False


def test_metric_cards_are_sourced_from_processed_default_profile():
    _, _, selected = _default()
    items = {label: value for label, value, _ in build_metric_items(selected)}
    assert items["Matched levels"] == str(int(selected["matched_level_count"]))
    assert items["Spatial separation"] == f"{float(selected['spatial_distance_km']):.3f} km"
    assert items["MAE"] == f"{float(selected['mae_celsius']):.4f} °C"
    assert items["RMSE"] == f"{float(selected['rmse_celsius']):.4f} °C"


def test_missing_metric_values_render_not_available_not_zero():
    items = {label: value for label, value, _ in build_metric_items({})}
    assert items["Matched levels"] == "Not available"
    assert items["MAE"] == "Not available"
    assert items["RMSE"] == "Not available"


def test_compact_provenance_preserves_scientific_method_contract():
    config, _, selected = _default()
    rows = dict(provenance_rows(config, selected, None))
    assert rows["Spatial method"] == "Nearest valid model water cell"
    assert rows["Vertical method"].startswith("Linear interpolation")
    assert rows["Bias convention"] == "Model − Observation"
    assert "no runtime scientific-data download" in rows["Cache status"]


def test_download_names_are_readable_and_selected_profile_specific():
    _, _, selected = _default()
    specs = download_specs(selected, COMPARISON)
    names = [filename for _, _, filename, _ in specs]
    assert any(str(selected["platform_id"]) in name for name in names)
    assert any(str(selected["cycle"]) in name for name in names)
    for _, path, _, _ in specs:
        assert path.is_file()
        assert path.stat().st_size > 0


def test_plotly_presentation_theme_does_not_change_profile_scientific_values():
    _, _, selected = _default()
    fig = profile_figure(selected["_table"])
    model_x_before = np.asarray(fig.data[0].x, float).copy()
    argo_x_before = np.asarray(fig.data[1].x, float).copy()
    themed = apply_plotly_theme(fig, kind="profile", title="test")
    assert np.allclose(np.asarray(themed.data[0].x, float), model_x_before)
    assert np.allclose(np.asarray(themed.data[1].x, float), argo_x_before)
    assert themed.data[0].line.color == MODEL_CYAN
    assert themed.data[1].line.color == ARGO_AMBER


def test_mandatory_scientific_disclaimer_is_preserved():
    required = (
        "This is a model–observation diagnostic comparison, not independent validation. "
        "The reanalysis may assimilate in-situ observations."
    )
    assert required in DISCLAIMER


def test_active_application_does_not_introduce_prohibited_architecture_or_ml_claims():
    text = (ROOT / "oceantwin" / "application.py").read_text(encoding="utf-8").lower()
    for token in ("fastapi", "react", "cesium", "machine learning", "forecasting engine", "hazard prediction"):
        assert token not in text
