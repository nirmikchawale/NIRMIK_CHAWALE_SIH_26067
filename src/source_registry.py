"""Discoverable SIH26067 source/plugin registry.

The registry is deliberately data-driven: adding a source is a new specification entry,
not a rewrite of explorer logic. URLs point to official provider services.
"""
from __future__ import annotations

from copy import deepcopy
from typing import Any

CONNECTORS: list[dict[str, Any]] = [
    {
        "id": "bundled-glorys12",
        "adapter": "cf_netcdf_model",
        "kind": "model",
        "provider": "Copernicus Marine",
        "title": "GLORYS12V1 verified regional subset",
        "role": "Primary deterministic 3D model evidence for the judge-facing explorer.",
        "variables": ["thetao", "so", "uo", "vo"],
        "protocols": ["local-netcdf", "REST"],
        "standards": ["CF-style coordinate metadata"],
        "runtime": "bundled",
        "official": True,
        "source_url": "https://data.marine.copernicus.eu/product/GLOBAL_MULTIYEAR_PHY_001_030/description",
        "opendap_url": None,
        "wms_url": None,
        "wcs_url": None,
    },
    {
        "id": "bundled-argo",
        "adapter": "argo_profile",
        "kind": "observation",
        "provider": "Argo GDAC / IFREMER",
        "title": "QC-screened Argo comparison profiles",
        "role": "Depth-resolved in-situ model-observation evidence.",
        "variables": ["temperature", "salinity", "pressure", "quality flags"],
        "protocols": ["local-netcdf", "REST"],
        "standards": ["Argo reference tables", "CF-NetCDF source"],
        "runtime": "bundled",
        "official": True,
        "source_url": "https://data-argo.ifremer.fr/",
        "opendap_url": None,
        "wms_url": None,
        "wcs_url": None,
    },
    {
        "id": "incois-argo-10d-vam",
        "adapter": "erddap_grid",
        "kind": "remote_grid",
        "provider": "INCOIS",
        "title": "INCOIS ARGO 10-day Variational Analysis",
        "role": "Operational Indian Ocean multi-time, depth-resolved temperature/salinity connector.",
        "variables": ["TEMP", "TERR", "SAL", "SERR"],
        "protocols": ["ERDDAP", "OPeNDAP", "WMS", "REST"],
        "standards": ["CF", "COARDS", "OGC WMS", "OPeNDAP"],
        "runtime": "remote-optional",
        "official": True,
        "dataset_id": "incois_argo_10d_VAM",
        "source_url": "https://erddap.incois.gov.in/erddap/info/incois_argo_10d_VAM/index.html",
        "opendap_url": "https://erddap.incois.gov.in/erddap/griddap/incois_argo_10d_VAM",
        "wms_url": "https://erddap.incois.gov.in/erddap/wms/incois_argo_10d_VAM/request",
        "wcs_url": None,
        "time_count": 813,
        "depth_count": 24,
    },
    {
        "id": "incois-indian-argo",
        "adapter": "erddap_table",
        "kind": "remote_observation",
        "provider": "INCOIS",
        "title": "INDIAN ARGO Floats Data",
        "role": "INCOIS-native profile discovery and observation source.",
        "variables": ["TEMP_ADJUSTED", "PSAL_ADJUSTED", "PRES_ADJUSTED", "QC"],
        "protocols": ["ERDDAP", "OPeNDAP-tabledap", "REST"],
        "standards": ["Argo reference tables", "OPeNDAP"],
        "runtime": "remote-optional",
        "official": True,
        "dataset_id": "Indian_ARGO_Floats",
        "source_url": "https://erddap.incois.gov.in/erddap/tabledap/Indian_ARGO_Floats.html",
        "opendap_url": "https://erddap.incois.gov.in/erddap/tabledap/Indian_ARGO_Floats",
        "wms_url": None,
        "wcs_url": None,
    },
    {
        "id": "incois-chlorophyll",
        "adapter": "erddap_grid",
        "kind": "remote_grid",
        "provider": "INCOIS",
        "title": "IRS P4 OCM Chlorophyll",
        "role": "INCOIS-native biogeochemical/ocean-colour interoperability example.",
        "variables": ["CHLOROPHYLL"],
        "protocols": ["ERDDAP", "OPeNDAP", "WMS", "WCS", "REST"],
        "standards": ["CF-1.6", "COARDS", "OGC WMS", "OPeNDAP"],
        "runtime": "remote-optional",
        "official": True,
        "dataset_id": "IRS_chlorophyll_datasets",
        "source_url": "https://erddap.incois.gov.in/erddap/info/IRS_chlorophyll_datasets/index.html",
        "opendap_url": "https://erddap.incois.gov.in/erddap/griddap/IRS_chlorophyll_datasets",
        "wms_url": "https://erddap.incois.gov.in/erddap/wms/IRS_chlorophyll_datasets/request",
        "wcs_url": None,
    },
    {
        "id": "oceantwin-wms",
        "adapter": "ogc_wms_service",
        "kind": "interoperability_service",
        "provider": "OceanTwin",
        "title": "OceanTwin scalar-field Web Map Service",
        "role": "OGC WMS 1.3.0 GetCapabilities/GetMap access to bundled temperature and salinity depth slices.",
        "variables": ["thetao", "so"],
        "protocols": ["OGC WMS 1.3.0", "REST"],
        "standards": ["OGC WMS 1.3.0", "CRS:84", "CF-derived metadata"],
        "runtime": "api",
        "official": False,
        "source_url": "/ogc/wms?service=WMS&request=GetCapabilities&version=1.3.0",
        "opendap_url": None,
        "wms_url": "/ogc/wms",
        "wcs_url": None,
    },
    {
        "id": "oceantwin-wcs",
        "adapter": "ogc_wcs_service",
        "kind": "interoperability_service",
        "provider": "OceanTwin",
        "title": "OceanTwin scalar-field Web Coverage Service",
        "role": "WCS 2.0.1 compatibility profile serving depth/time-selected temperature and salinity coverage as NetCDF.",
        "variables": ["thetao", "so"],
        "protocols": ["OGC WCS 2.0.1", "REST"],
        "standards": ["OGC WCS 2.0.1 compatibility profile", "NetCDF4", "CF-style coordinates"],
        "runtime": "api",
        "official": False,
        "source_url": "/ogc/wcs?service=WCS&request=GetCapabilities&version=2.0.1",
        "opendap_url": None,
        "wms_url": None,
        "wcs_url": "/ogc/wcs",
    },
    {
        "id": "ocean-gliders-gdac",
        "adapter": "glider_profile",
        "kind": "remote_observation",
        "provider": "OceanGliders / Ifremer",
        "title": "OceanGliders GDAC profile observations",
        "role": "Autonomous glider trajectory/profile source for geospatial depth-variable overlays.",
        "variables": ["temperature", "salinity", "pressure/depth", "time", "platform metadata"],
        "protocols": ["ERDDAP", "NetCDF", "GDAC"],
        "standards": ["EGO/OG1-style NetCDF", "CF-style coordinates"],
        "runtime": "remote-optional/import",
        "official": True,
        "source_url": "https://nrt.cmems-du.eu/erddap/index.html",
        "opendap_url": "https://nrt.cmems-du.eu/erddap/",
        "wms_url": None,
        "wcs_url": None,
    },
    {
        "id": "incois-ctd-holdings",
        "adapter": "ctd_profile",
        "kind": "provider_export_observation",
        "provider": "INCOIS",
        "title": "INCOIS CTD / XCTD profile holdings",
        "role": "Sponsor-native conductivity/temperature/depth observations imported from authorised INCOIS exports.",
        "variables": ["temperature", "salinity/conductivity", "pressure/depth", "time", "station metadata"],
        "protocols": ["INCOIS portal export", "NetCDF", "ASCII/delimited text"],
        "standards": ["canonical profile contract", "CF-aware NetCDF import"],
        "runtime": "provider-export/import",
        "official": True,
        "source_url": "https://incois.gov.in/site/dataholdings.jsp",
        "opendap_url": None,
        "wms_url": None,
        "wcs_url": None,
    },
    {
        "id": "bgc-argo-gdac",
        "adapter": "bgc_argo_profile",
        "kind": "remote_observation",
        "provider": "Argo GDAC / Ifremer",
        "title": "BGC-Argo synthetic profiles",
        "role": "Biogeochemical profile pathway for chlorophyll, oxygen, nitrate, pH and optical variables.",
        "variables": ["CHLA", "DOXY", "NITRATE", "PH_IN_SITU_TOTAL", "BBP", "temperature", "salinity", "pressure"],
        "protocols": ["Argo GDAC", "NetCDF", "S-profile index"],
        "standards": ["Argo BGC S-profile", "CF-NetCDF source"],
        "runtime": "remote-optional/import",
        "official": True,
        "source_url": "https://data-argo.ifremer.fr/",
        "opendap_url": None,
        "wms_url": None,
        "wcs_url": None,
    }
]

ADAPTER_CONTRACTS: dict[str, dict[str, Any]] = {
    "cf_netcdf_model": {
        "input": ["NetCDF4/HDF5"],
        "required_coordinates": ["longitude", "latitude", "depth", "time"],
        "required_metadata": ["units", "standard_name", "depth.positive"],
        "output": "canonical time×depth×latitude×longitude scalar/vector catalog",
    },
    "argo_profile": {
        "input": ["Argo NetCDF"],
        "required_coordinates": ["longitude", "latitude", "time", "pressure/depth"],
        "required_metadata": ["provider QC", "platform id", "cycle"],
        "output": "canonical geospatial profile + depth-variable series",
    },
    "erddap_grid": {
        "input": ["ERDDAP griddap / OPeNDAP"],
        "required_coordinates": ["time", "latitude", "longitude"],
        "optional_coordinates": ["depth"],
        "output": "canonical remote grid descriptor + query template",
    },
    "erddap_table": {
        "input": ["ERDDAP tabledap / OPeNDAP"],
        "required_coordinates": ["time", "latitude", "longitude"],
        "output": "canonical remote observation table descriptor + query template",
    },
    "ogc_wms_service": {
        "input": ["canonical scalar grid"],
        "required_coordinates": ["longitude", "latitude", "depth", "time"],
        "required_metadata": ["units", "standard_name"],
        "output": "WMS 1.3.0 capabilities + PNG map render",
    },
    "ogc_wcs_service": {
        "input": ["canonical scalar grid"],
        "required_coordinates": ["longitude", "latitude", "depth", "time"],
        "required_metadata": ["units", "standard_name", "depth.positive"],
        "output": "WCS 2.0.1 compatibility capabilities/description + NetCDF coverage",
    },
    "glider_profile": {
        "input": ["OceanGliders/EGO NetCDF", "canonical delimited profile"],
        "required_coordinates": ["longitude", "latitude", "time", "pressure/depth"],
        "required_metadata": ["platform/deployment id", "units", "source provenance"],
        "output": "canonical geospatial glider profile + depth-variable series",
    },
    "ctd_profile": {
        "input": ["CTD/XCTD NetCDF", "ASCII/delimited provider export"],
        "required_coordinates": ["longitude", "latitude", "time", "pressure/depth"],
        "required_metadata": ["station/platform id", "units", "source provenance"],
        "output": "canonical geospatial CTD profile + depth-variable series",
    },
    "bgc_argo_profile": {
        "input": ["BGC-Argo S-profile NetCDF", "canonical delimited profile"],
        "required_coordinates": ["longitude", "latitude", "time", "pressure/depth"],
        "required_metadata": ["platform id", "parameter QC", "units", "source provenance"],
        "output": "canonical geospatial BGC profile + depth-variable series",
    }
}


def registry_payload() -> dict[str, Any]:
    """Return a defensive copy of the plugin/source registry."""
    _validate()
    return {
        "schema": "oceantwin-source-registry-v1",
        "plugin_contracts": deepcopy(ADAPTER_CONTRACTS),
        "connectors": deepcopy(CONNECTORS),
        "principle": (
            "Bundled evidence remains deterministic; remote connectors are explicit, optional, "
            "and must fail closed without changing verified local science."
        ),
    }


def _validate() -> None:
    ids: set[str] = set()
    for connector in CONNECTORS:
        connector_id = str(connector["id"])
        if connector_id in ids:
            raise ValueError(f"Duplicate connector id: {connector_id}")
        ids.add(connector_id)
        adapter = str(connector["adapter"])
        if adapter not in ADAPTER_CONTRACTS:
            raise ValueError(f"Unknown adapter {adapter!r} for {connector_id}")
        if not connector.get("provider") or not connector.get("title"):
            raise ValueError(f"Connector {connector_id} is missing provider/title")
        if connector.get("runtime") == "remote-optional" and not connector.get("source_url"):
            raise ValueError(f"Remote connector {connector_id} lacks a source URL")
