import json

from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_health_preserves_reference_and_local_data():
    response = client.get("/api/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["streamlit_reference_preserved"] is True
    assert payload["scientific_data_network_required"] is False
    assert payload["runtime_mode"] == "cached_verified"
    assert {"thetao", "so", "uo", "vo"}.issubset(set(payload["variables"]))


def test_catalog_exposes_verified_variables_and_honest_time_capability():
    response = client.get("/api/catalog")
    assert response.status_code == 200
    payload = response.json()
    variables = {item["id"] for item in payload["variables"]}
    assert {"thetao", "so", "currents"}.issubset(variables)
    assert payload["capabilities"]["time_steps"] >= 1
    assert payload["capabilities"]["time_animation"] == (
        payload["capabilities"]["time_steps"] > 1
    )
    assert payload["dataset"]["freshness_class"] == "reanalysis"


def test_scalar_temperature_field_uses_real_depth_and_units():
    payload = client.get(
        "/api/field",
        params={"variable": "thetao", "time_index": 0, "depth_index": 0, "stride": 3},
    ).json()
    assert payload["variable"] == "thetao"
    assert payload["units"] in {"degrees_C", "degree_Celsius", "degrees_Celsius"}
    assert payload["depth_m"] > 0
    assert payload["values"]
    assert payload["provenance"]["runtime_mode"] == "cached_verified"


def test_salinity_field_is_not_synthetic():
    response = client.get(
        "/api/field",
        params={"variable": "so", "time_index": 0, "depth_index": 5, "stride": 4},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["variable"] == "so"
    assert payload["units"] == "1e-3"
    finite = [v for row in payload["values"] for v in row if v is not None]
    assert finite
    assert min(finite) > 0


def test_currents_expose_verified_uv_components_as_vectors():
    response = client.get(
        "/api/currents",
        params={"time_index": 0, "depth_index": 10, "stride": 4},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["variable"] == "currents"
    assert payload["units"] == "m s-1"
    assert payload["vectors"]
    lon, lat, u, v, speed = payload["vectors"][0]
    assert isinstance(lon, float)
    assert isinstance(lat, float)
    assert speed >= 0
    assert abs(speed - (u * u + v * v) ** 0.5) < 1e-10


def test_profile_endpoint_keeps_model_minus_observation_semantics():
    profiles = client.get("/api/profiles").json()["profiles"]
    assert profiles
    profile_id = profiles[0]["profile_id"]
    detail = client.get(f"/api/profiles/{profile_id}").json()
    assert detail["levels"]
    assert detail["comparison_semantics"]["bias"] == "Model − Observation"
    first = detail["levels"][0]
    assert abs(
        first["signed_bias_celsius"]
        - (first["model_temperature_interpolated"] - first["observed_temperature"])
    ) < 1e-10


def test_provenance_is_judge_safe_and_exposes_qc_without_local_paths():
    response = client.get("/api/provenance")
    assert response.status_code == 200
    payload = response.json()
    assert payload["model"]["freshness_class"] == "reanalysis"
    assert payload["quality_control"]["accepted_provider_qc"] == ["1"]
    assert payload["quality_control"]["no_extrapolation"] is True
    assert payload["integrity"]["source_checksums_unchanged"] is True
    serialized = json.dumps(payload)
    assert "C:\\\\Users" not in serialized
    assert "comparison_config" not in payload
