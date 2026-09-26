from hashlib import sha256
from pathlib import Path

import pytest

from src.comparison_loader import EvidenceError, load_bundle, read_json
from src.data_loader import load_model

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "data" / "glorys12_20240102_67E70E_12N14N_0m500m.nc"
CONFIG = ROOT / "data" / "comparison" / "comparison_config.json"
COMPARISON = ROOT / "data" / "comparison"


def digest(path: Path) -> str:
    return sha256(path.read_bytes()).hexdigest()


def test_missing_model_file_is_explicit(tmp_path):
    with pytest.raises(EvidenceError, match="Missing cached Copernicus model subset"):
        load_model(tmp_path / "missing.nc", {})


def test_real_model_subset_shape_depths_and_semantics():
    model = load_model(MODEL, read_json(CONFIG))
    assert model["temperature"].shape == (31, 25, 37)
    assert len(model["depth"]) == 31
    assert model["depth"][0] == pytest.approx(0.49402499198913574)
    assert model["depth"][-1] == pytest.approx(453.9377136230469)
    assert model["depth_units"] == "m"
    assert model["depth_positive"].lower() == "down"
    assert model["temperature_standard_name"] == "sea_water_potential_temperature"
    assert model["temperature_units"] == "degrees_C"
    assert model["temperature_min"] == pytest.approx(11.322214432060719)
    assert model["temperature_max"] == pytest.approx(30.338663890957832)


def test_local_loaders_do_not_modify_bundled_scientific_inputs():
    csv = COMPARISON / "profile_5907092_cycle013_D_level_comparison.csv"
    before = {MODEL: digest(MODEL), csv: digest(csv)}
    load_model(MODEL, read_json(CONFIG))
    load_bundle(COMPARISON)
    after = {MODEL: digest(MODEL), csv: digest(csv)}
    assert before == after


def test_local_loaders_work_when_network_connection_is_blocked(monkeypatch):
    import socket

    def blocked(*args, **kwargs):
        raise AssertionError("Network access attempted")

    monkeypatch.setattr(socket, "create_connection", blocked)
    model = load_model(MODEL, read_json(CONFIG))
    _, _, profiles = load_bundle(COMPARISON)
    assert model["temperature"].shape == (31, 25, 37)
    assert len(profiles) == 2
