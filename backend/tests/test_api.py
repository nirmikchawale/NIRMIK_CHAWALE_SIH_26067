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


def test_currents_volume_preserves_depth_resolved_horizontal_uv_without_inventing_w():
    response = client.get(
        "/api/currents-volume",
        params={"time_index": 0, "horizontal_stride": 6, "depth_stride": 1},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["variable"] == "currents"
    assert payload["units"] == "m s-1"
    assert payload["components"] == ["uo", "vo"]
    assert payload["vertical_component_available"] is False
    assert len(payload["depths_m"]) == 31
    assert payload["vectors"]
    lon, lat, depth, u, v, speed = payload["vectors"][0]
    assert isinstance(lon, float)
    assert isinstance(lat, float)
    assert depth >= 0
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



def test_telemetry_uses_full_grid_and_never_synthesizes_time():
    catalog = client.get("/api/catalog").json()
    response = client.get(
        "/api/telemetry",
        params={"variable": "thetao", "time_index": 0, "depth_index": 18},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["variable"] == "thetao"
    assert len(payload["depth_stats"]) == len(catalog["coordinates"]["depth"])
    assert len(payload["time_stats"]) == len(catalog["coordinates"]["time"])
    assert payload["time_series_available"] == (len(payload["time_stats"]) > 1)
    assert payload["selected_depth_m"] == catalog["coordinates"]["depth"][18]
    assert payload["depth_positive"] == "down"
    assert payload["depth_stats"][18]["count"] > 0
    assert payload["depth_stats"][18]["minimum"] <= payload["depth_stats"][18]["p10"]
    assert payload["depth_stats"][18]["p10"] <= payload["depth_stats"][18]["p50"]
    assert payload["depth_stats"][18]["p50"] <= payload["depth_stats"][18]["p90"]
    assert payload["depth_stats"][18]["p90"] <= payload["depth_stats"][18]["maximum"]
    assert payload["current_summary"]["count"] > 0
    assert payload["current_summary"]["maximum_speed"] >= payload["current_summary"]["mean_speed"]
    assert "No temporal or vertical samples are synthesized" in payload["statistic_definition"]



def test_anomaly_screen_is_robust_explainable_and_never_invents_temporal_evidence():
    catalog = client.get("/api/catalog").json()
    response = client.get(
        "/api/anomalies",
        params={"variable": "thetao", "time_index": 0, "depth_index": 18},
    )
    assert response.status_code == 200
    payload = response.json()

    assert payload["method"]["absolute_threshold"] == 3.5
    assert payload["method"]["formula"] == "0.67448975 × (x − median) / MAD"
    assert payload["spatial_screen"]["sample_count"] > 0
    assert payload["residual_screen"]["profiles_screened"] == 2
    assert payload["residual_screen"]["temperature_only"] is True
    assert payload["residual_screen"]["flagged_count"] > 0
    assert all(abs(item["robust_z"]) >= 3.5 for item in payload["residual_screen"]["flags"])

    assert payload["temporal_screen"]["available"] is False
    assert payload["temporal_screen"]["status"] == "locked"
    assert payload["temporal_screen"]["genuine_time_count"] == len(catalog["coordinates"]["time"])
    assert "genuine timestamp" in payload["temporal_screen"]["reason"]
    assert "not proof of an ocean event" in payload["interpretation"]
