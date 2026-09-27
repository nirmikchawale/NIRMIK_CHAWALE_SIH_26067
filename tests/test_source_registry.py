from __future__ import annotations

from config import MODEL_FILE
from src.ingestion import inspect_cf_netcdf, parse_delimited_observations
from src.source_registry import registry_payload


def test_registry_has_unique_real_adapters_and_incois_open_standards():
    payload = registry_payload()
    connectors = payload["connectors"]
    ids = [item["id"] for item in connectors]
    assert len(ids) == len(set(ids))

    incois = [item for item in connectors if item["provider"] == "INCOIS"]
    assert incois, "At least one INCOIS connector must be registered."
    standards = {standard for item in incois for standard in item["standards"]}
    assert "OPeNDAP" in standards
    assert "OGC WMS" in standards
    assert "OGC WCS" in standards

    grid = next(item for item in incois if item["id"] == "incois-argo-10d-vam")
    assert grid["opendap_url"].startswith("https://erddap.incois.gov.in/")
    assert grid["wms_url"].startswith("https://erddap.incois.gov.in/")
    assert grid["wcs_url"].startswith("https://erddap.incois.gov.in/")
    assert grid["time_count"] > 1
    assert grid["depth_count"] > 1


def test_bundled_model_passes_generic_cf_style_inspection():
    report = inspect_cf_netcdf(MODEL_FILE)
    assert report["cf_ready"] is True
    assert not report["missing_required_coordinates"]
    assert report["depth_positive_valid"] is True
    assert {"longitude", "latitude", "depth", "time"} <= set(report["coordinates"])
    variable_names = {item["name"] for item in report["variables"]}
    assert {"thetao", "so", "uo", "vo"} <= variable_names


def test_delimited_observation_parser_accepts_tsv_contract():
    text = (
        "longitude\tlatitude\tdepth_m\ttimestamp\tvariable\tvalue\tunits\tsource\n"
        "68.25\t13.25\t10\t2024-01-02T00:00:00Z\ttemperature\t28.2\tdegree_Celsius\tverified_test\n"
    )
    report = parse_delimited_observations(text)
    assert report["delimiter"] == "\t"
    assert report["record_count"] == 1
    row = report["records"][0]
    assert row["longitude"] == 68.25
    assert row["depth_m"] == 10.0
    assert row["value"] == 28.2
