"""Bounded OGC interoperability services for Ocean Canvas's verified scalar model cube.

This module implements the core operations needed by SIH26067 without pretending to be
an externally certified OGC server. The WMS path follows WMS 1.3.0 GetCapabilities/GetMap
semantics over CRS:84. The WCS path is a WCS 2.0.1 compatibility profile exposing
GetCapabilities, DescribeCoverage and GetCoverage as CF-style NetCDF4.
"""
from __future__ import annotations

from datetime import datetime, timezone
import io
import math
from pathlib import Path
import tempfile
from typing import Any, Callable
from xml.sax.saxutils import escape

import numpy as np
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from netCDF4 import Dataset
from PIL import Image


ScalarDatasetProvider = Callable[[], dict[str, Any]]
SUPPORTED_SCALARS = ("thetao", "so")


def _parse_bbox(text: str | None, longitude: np.ndarray, latitude: np.ndarray) -> tuple[float, float, float, float]:
    if not text:
        return (
            float(np.nanmin(longitude)),
            float(np.nanmin(latitude)),
            float(np.nanmax(longitude)),
            float(np.nanmax(latitude)),
        )
    try:
        values = [float(value.strip()) for value in text.split(",")]
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="bbox must contain four finite numbers.") from exc
    if len(values) != 4 or not all(math.isfinite(value) for value in values):
        raise HTTPException(status_code=422, detail="bbox must contain four finite numbers.")
    min_lon, min_lat, max_lon, max_lat = values
    if min_lon >= max_lon or min_lat >= max_lat:
        raise HTTPException(status_code=422, detail="bbox minimums must be smaller than maximums.")
    return min_lon, min_lat, max_lon, max_lat


def _subset_2d(
    dataset: dict[str, Any],
    variable: str,
    time_index: int,
    depth_index: int,
    bbox: str | None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    if variable not in SUPPORTED_SCALARS or variable not in dataset["variables"]:
        raise HTTPException(status_code=404, detail="Coverage/layer is not available.")
    if not 0 <= time_index < len(dataset["time"]):
        raise HTTPException(status_code=422, detail="time_index is outside the available range.")
    if not 0 <= depth_index < len(dataset["depth"]):
        raise HTTPException(status_code=422, detail="depth_index is outside the available range.")

    longitude = np.asarray(dataset["longitude"], dtype=float)
    latitude = np.asarray(dataset["latitude"], dtype=float)
    min_lon, min_lat, max_lon, max_lat = _parse_bbox(bbox, longitude, latitude)
    lon_mask = (longitude >= min_lon) & (longitude <= max_lon)
    lat_mask = (latitude >= min_lat) & (latitude <= max_lat)
    if not np.any(lon_mask) or not np.any(lat_mask):
        raise HTTPException(status_code=404, detail="Requested bbox does not intersect the model domain.")

    values = np.asarray(dataset["variables"][variable]["values"][time_index, depth_index], dtype=float)
    return longitude[lon_mask], latitude[lat_mask], values[np.ix_(lat_mask, lon_mask)]


def _wms_capabilities(dataset: dict[str, Any]) -> str:
    longitude = np.asarray(dataset["longitude"], dtype=float)
    latitude = np.asarray(dataset["latitude"], dtype=float)
    min_lon, max_lon = float(longitude.min()), float(longitude.max())
    min_lat, max_lat = float(latitude.min()), float(latitude.max())
    layers = []
    for variable in SUPPORTED_SCALARS:
        if variable not in dataset["variables"]:
            continue
        meta = dataset["variables"][variable]
        layers.append(
            """
      <Layer queryable="1">
        <Name>{name}</Name>
        <Title>{title}</Title>
        <Abstract>Verified Ocean Canvas scalar depth slice; units {units}.</Abstract>
        <CRS>CRS:84</CRS>
        <EX_GeographicBoundingBox>
          <westBoundLongitude>{min_lon}</westBoundLongitude>
          <eastBoundLongitude>{max_lon}</eastBoundLongitude>
          <southBoundLatitude>{min_lat}</southBoundLatitude>
          <northBoundLatitude>{max_lat}</northBoundLatitude>
        </EX_GeographicBoundingBox>
        <Dimension name="elevation" units="m" unitSymbol="m" default="{default_depth}">{depths}</Dimension>
        <Dimension name="time" units="ISO8601" default="{default_time}">{times}</Dimension>
      </Layer>
            """.format(
                name=escape(variable),
                title=escape(str(meta["label"])),
                units=escape(str(meta["units"])),
                min_lon=min_lon,
                max_lon=max_lon,
                min_lat=min_lat,
                max_lat=max_lat,
                default_depth=float(dataset["depth"][0]),
                depths=",".join(str(float(item)) for item in dataset["depth"]),
                default_time=escape(str(dataset["time_iso"][0])),
                times=",".join(escape(str(item)) for item in dataset["time_iso"]),
            )
        )
    return """<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms"
 xmlns:xlink="http://www.w3.org/1999/xlink">
  <Service>
    <Name>WMS</Name>
    <Title>Ocean Canvas verified scalar WMS</Title>
    <Abstract>Depth/time selected map rendering of verified Ocean Canvas model fields.</Abstract>
  </Service>
  <Capability>
    <Request>
      <GetCapabilities><Format>text/xml</Format></GetCapabilities>
      <GetMap><Format>image/png</Format></GetMap>
    </Request>
    <Layer>
      <Title>Ocean Canvas verified model cube</Title>
      <CRS>CRS:84</CRS>
      {layers}
    </Layer>
  </Capability>
</WMS_Capabilities>
""".format(layers="\n".join(layers))


def _wcs_capabilities(dataset: dict[str, Any]) -> str:
    summaries = []
    for variable in SUPPORTED_SCALARS:
        if variable not in dataset["variables"]:
            continue
        meta = dataset["variables"][variable]
        summaries.append(
            """
    <wcs:CoverageSummary>
      <wcs:CoverageId>{name}</wcs:CoverageId>
      <wcs:CoverageSubtype>RectifiedGridCoverage</wcs:CoverageSubtype>
      <ows:Title>{title}</ows:Title>
      <ows:Abstract>Verified Ocean Canvas coverage in {units}; selectable model time and depth.</ows:Abstract>
    </wcs:CoverageSummary>
            """.format(
                name=escape(variable),
                title=escape(str(meta["label"])),
                units=escape(str(meta["units"])),
            )
        )
    return """<?xml version="1.0" encoding="UTF-8"?>
<wcs:Capabilities version="2.0.1"
 xmlns:wcs="http://www.opengis.net/wcs/2.0"
 xmlns:ows="http://www.opengis.net/ows/2.0">
  <ows:ServiceIdentification>
    <ows:Title>Ocean Canvas verified coverage service</ows:Title>
    <ows:ServiceType>WCS</ows:ServiceType>
    <ows:ServiceTypeVersion>2.0.1</ows:ServiceTypeVersion>
  </ows:ServiceIdentification>
  <wcs:ServiceMetadata>
    <wcs:formatSupported>application/x-netcdf</wcs:formatSupported>
  </wcs:ServiceMetadata>
  <wcs:Contents>
    {summaries}
  </wcs:Contents>
</wcs:Capabilities>
""".format(summaries="\n".join(summaries))


def _describe_coverage(dataset: dict[str, Any], variable: str) -> str:
    if variable not in SUPPORTED_SCALARS or variable not in dataset["variables"]:
        raise HTTPException(status_code=404, detail="Coverage is not available.")
    meta = dataset["variables"][variable]
    longitude = np.asarray(dataset["longitude"], dtype=float)
    latitude = np.asarray(dataset["latitude"], dtype=float)
    return """<?xml version="1.0" encoding="UTF-8"?>
<wcs:CoverageDescriptions xmlns:wcs="http://www.opengis.net/wcs/2.0"
 xmlns:gml="http://www.opengis.net/gml/3.2">
  <wcs:CoverageDescription gml:id="{name}">
    <gml:boundedBy>
      <gml:Envelope srsName="http://www.opengis.net/def/crs/OGC/1.3/CRS84" axisLabels="Long Lat">
        <gml:lowerCorner>{min_lon} {min_lat}</gml:lowerCorner>
        <gml:upperCorner>{max_lon} {max_lat}</gml:upperCorner>
      </gml:Envelope>
    </gml:boundedBy>
    <wcs:CoverageId>{name}</wcs:CoverageId>
    <wcs:CoverageSubtype>RectifiedGridCoverage</wcs:CoverageSubtype>
    <wcs:ServiceParameters>
      <wcs:CoverageSubtype>RectifiedGridCoverage</wcs:CoverageSubtype>
      <wcs:nativeFormat>application/x-netcdf</wcs:nativeFormat>
    </wcs:ServiceParameters>
    <gml:description>{title}; units {units}; depth positive down.</gml:description>
  </wcs:CoverageDescription>
</wcs:CoverageDescriptions>
""".format(
        name=escape(variable),
        title=escape(str(meta["label"])),
        units=escape(str(meta["units"])),
        min_lon=float(longitude.min()),
        max_lon=float(longitude.max()),
        min_lat=float(latitude.min()),
        max_lat=float(latitude.max()),
    )


def _thermal_rgba(values: np.ndarray) -> np.ndarray:
    finite = values[np.isfinite(values)]
    if finite.size == 0:
        raise HTTPException(status_code=404, detail="Requested map contains no finite data.")
    minimum = float(finite.min())
    maximum = float(finite.max())
    normalized = (values - minimum) / max(maximum - minimum, 1e-12)
    normalized = np.clip(normalized, 0.0, 1.0)
    red = (255.0 * normalized).astype(np.uint8)
    green = (255.0 * (1.0 - np.abs(2.0 * normalized - 1.0))).astype(np.uint8)
    blue = (255.0 * (1.0 - normalized)).astype(np.uint8)
    alpha = np.where(np.isfinite(values), 230, 0).astype(np.uint8)
    return np.stack([red, green, blue, alpha], axis=-1)


def _netcdf_coverage(
    dataset: dict[str, Any],
    variable: str,
    time_index: int,
    depth_index: int,
    longitude: np.ndarray,
    latitude: np.ndarray,
    values: np.ndarray,
) -> bytes:
    meta = dataset["variables"][variable]
    temporary = tempfile.NamedTemporaryFile(suffix=".nc", delete=False)
    path = Path(temporary.name)
    temporary.close()
    try:
        with Dataset(path, "w", format="NETCDF4") as output:
            output.Conventions = "CF-1.10"
            output.title = "Ocean Canvas WCS coverage"
            output.source = "Verified bundled ocean-model evidence"
            output.history = "Generated read-only by Ocean Canvas WCS compatibility profile"

            output.createDimension("time", 1)
            output.createDimension("depth", 1)
            output.createDimension("latitude", len(latitude))
            output.createDimension("longitude", len(longitude))

            time_var = output.createVariable("time", "f8", ("time",))
            time_var.units = "seconds since 1970-01-01T00:00:00Z"
            time_var.standard_name = "time"
            timestamp = datetime.fromisoformat(str(dataset["time_iso"][time_index]).replace("Z", "+00:00"))
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)
            time_var[:] = [timestamp.timestamp()]

            depth_var = output.createVariable("depth", "f8", ("depth",))
            depth_var.units = str(dataset["depth_units"])
            depth_var.positive = str(dataset["depth_positive"])
            depth_var.standard_name = "depth"
            depth_var[:] = [float(dataset["depth"][depth_index])]

            lat_var = output.createVariable("latitude", "f8", ("latitude",))
            lat_var.units = "degrees_north"
            lat_var.standard_name = "latitude"
            lat_var[:] = latitude

            lon_var = output.createVariable("longitude", "f8", ("longitude",))
            lon_var.units = "degrees_east"
            lon_var.standard_name = "longitude"
            lon_var[:] = longitude

            data_var = output.createVariable(
                variable,
                "f4",
                ("time", "depth", "latitude", "longitude"),
                zlib=True,
                complevel=4,
                fill_value=np.float32(np.nan),
            )
            data_var.units = str(meta["units"])
            if meta.get("standard_name"):
                data_var.standard_name = str(meta["standard_name"])
            data_var.coordinates = "time depth latitude longitude"
            data_var[0, 0, :, :] = np.asarray(values, dtype=np.float32)

        return path.read_bytes()
    finally:
        path.unlink(missing_ok=True)


def build_ogc_router(dataset_provider: ScalarDatasetProvider) -> APIRouter:
    router = APIRouter(tags=["OGC interoperability"])

    @router.get("/ogc/wms")
    def wms(
        service: str = "WMS",
        request: str = "GetCapabilities",
        version: str = "1.3.0",
        layers: str | None = None,
        crs: str = "CRS:84",
        bbox: str | None = None,
        width: int = Query(640, ge=64, le=2048),
        height: int = Query(420, ge=64, le=2048),
        format: str = "image/png",
        time_index: int = Query(0, ge=0),
        depth_index: int = Query(0, ge=0),
    ) -> Response:
        if service.upper() != "WMS":
            raise HTTPException(status_code=400, detail="service must be WMS.")
        dataset = dataset_provider()
        operation = request.lower()
        if operation == "getcapabilities":
            return Response(_wms_capabilities(dataset), media_type="application/xml")
        if operation != "getmap":
            raise HTTPException(status_code=400, detail="Supported WMS requests: GetCapabilities, GetMap.")
        if version != "1.3.0":
            raise HTTPException(status_code=400, detail="Ocean Canvas WMS supports version 1.3.0.")
        if crs.upper() != "CRS:84":
            raise HTTPException(status_code=400, detail="Ocean Canvas WMS GetMap currently supports CRS:84.")
        if format.lower() != "image/png":
            raise HTTPException(status_code=400, detail="Ocean Canvas WMS GetMap currently supports image/png.")
        variable = (layers or "").split(",")[0].strip()
        longitude, latitude, values = _subset_2d(dataset, variable, time_index, depth_index, bbox)

        # Model latitude is south-to-north; raster rows are rendered north-to-south.
        rgba = _thermal_rgba(values[::-1, :])
        image = Image.fromarray(rgba).resize((width, height), resample=Image.Resampling.BILINEAR)
        buffer = io.BytesIO()
        image.save(buffer, format="PNG", optimize=True)
        return Response(
            buffer.getvalue(),
            media_type="image/png",
            headers={
                "X-OceanTwin-Layer": variable,
                "X-OceanTwin-Time": str(dataset["time_iso"][time_index]),
                "X-OceanTwin-Depth-M": str(float(dataset["depth"][depth_index])),
                "X-OceanTwin-Longitude-Count": str(len(longitude)),
                "X-OceanTwin-Latitude-Count": str(len(latitude)),
            },
        )

    @router.get("/ogc/wcs")
    def wcs(
        service: str = "WCS",
        request: str = "GetCapabilities",
        version: str = "2.0.1",
        coverage_id: str | None = Query(None, alias="coverageId"),
        bbox: str | None = None,
        time_index: int = Query(0, ge=0),
        depth_index: int = Query(0, ge=0),
        format: str = "application/x-netcdf",
    ) -> Response:
        if service.upper() != "WCS":
            raise HTTPException(status_code=400, detail="service must be WCS.")
        dataset = dataset_provider()
        operation = request.lower()
        if operation == "getcapabilities":
            return Response(_wcs_capabilities(dataset), media_type="application/xml")
        if version != "2.0.1":
            raise HTTPException(status_code=400, detail="Ocean Canvas WCS compatibility profile supports version 2.0.1.")
        variable = (coverage_id or "").strip()
        if operation == "describecoverage":
            return Response(_describe_coverage(dataset, variable), media_type="application/xml")
        if operation != "getcoverage":
            raise HTTPException(
                status_code=400,
                detail="Supported WCS requests: GetCapabilities, DescribeCoverage, GetCoverage.",
            )
        if format.lower() not in {"application/x-netcdf", "application/netcdf"}:
            raise HTTPException(status_code=400, detail="Ocean Canvas WCS GetCoverage serves application/x-netcdf.")
        longitude, latitude, values = _subset_2d(dataset, variable, time_index, depth_index, bbox)
        payload = _netcdf_coverage(dataset, variable, time_index, depth_index, longitude, latitude, values)
        return Response(
            payload,
            media_type="application/x-netcdf",
            headers={
                "Content-Disposition": 'attachment; filename="OceanCanvas_{0}_t{1}_d{2}.nc"'.format(
                    variable, time_index, depth_index
                ),
                "X-OceanTwin-WCS-Profile": "2.0.1-compatibility",
            },
        )

    return router
