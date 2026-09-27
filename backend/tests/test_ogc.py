from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient
from netCDF4 import Dataset

from backend.app.main import app


client = TestClient(app)


def test_wms_capabilities_advertise_verified_scalar_layers():
    response = client.get(
        "/ogc/wms",
        params={"service": "WMS", "request": "GetCapabilities", "version": "1.3.0"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/xml")
    text = response.text
    assert '<WMS_Capabilities version="1.3.0"' in text
    assert "<Name>thetao</Name>" in text
    assert "<Name>so</Name>" in text
    assert "<CRS>CRS:84</CRS>" in text
    assert 'name="elevation"' in text
    assert 'name="time"' in text


def test_wms_getmap_returns_real_png_and_science_headers():
    response = client.get(
        "/ogc/wms",
        params={
            "service": "WMS",
            "request": "GetMap",
            "version": "1.3.0",
            "layers": "thetao",
            "crs": "CRS:84",
            "bbox": "67,12,70,14",
            "width": 360,
            "height": 240,
            "format": "image/png",
            "time_index": 0,
            "depth_index": 18,
        },
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert response.content[:8] == b"\x89PNG\r\n\x1a\n"
    assert response.headers["x-oceantwin-layer"] == "thetao"
    assert float(response.headers["x-oceantwin-depth-m"]) > 0
    assert int(response.headers["x-oceantwin-longitude-count"]) > 1
    assert int(response.headers["x-oceantwin-latitude-count"]) > 1


def test_wcs_capabilities_and_description_are_machine_readable():
    capabilities = client.get(
        "/ogc/wcs",
        params={"service": "WCS", "request": "GetCapabilities", "version": "2.0.1"},
    )
    assert capabilities.status_code == 200
    text = capabilities.text
    assert '<wcs:Capabilities version="2.0.1"' in text
    assert "<wcs:CoverageId>thetao</wcs:CoverageId>" in text
    assert "<wcs:CoverageId>so</wcs:CoverageId>" in text
    assert "application/x-netcdf" in text

    description = client.get(
        "/ogc/wcs",
        params={
            "service": "WCS",
            "request": "DescribeCoverage",
            "version": "2.0.1",
            "coverageId": "thetao",
        },
    )
    assert description.status_code == 200
    assert "<wcs:CoverageId>thetao</wcs:CoverageId>" in description.text
    assert "CRS84" in description.text
    assert "depth positive down" in description.text


def test_wcs_getcoverage_returns_cf_style_netcdf(tmp_path: Path):
    response = client.get(
        "/ogc/wcs",
        params={
            "service": "WCS",
            "request": "GetCoverage",
            "version": "2.0.1",
            "coverageId": "so",
            "bbox": "67.5,12.5,69.5,13.5",
            "time_index": 0,
            "depth_index": 10,
            "format": "application/x-netcdf",
        },
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/x-netcdf"
    assert response.headers["x-oceantwin-wcs-profile"] == "2.0.1-compatibility"
    path = tmp_path / "coverage.nc"
    path.write_bytes(response.content)

    with Dataset(path) as dataset:
        assert dataset.getncattr("Conventions") == "CF-1.10"
        assert {"time", "depth", "latitude", "longitude", "so"} <= set(dataset.variables)
        assert dataset.variables["depth"].getncattr("positive") == "down"
        assert dataset.variables["latitude"].getncattr("units") == "degrees_north"
        assert dataset.variables["longitude"].getncattr("units") == "degrees_east"
        assert dataset.variables["so"].getncattr("units") == "1e-3"
        values = dataset.variables["so"][:]
        assert values.shape[0] == 1
        assert values.shape[1] == 1
        assert values.shape[2] > 1
        assert values.shape[3] > 1
