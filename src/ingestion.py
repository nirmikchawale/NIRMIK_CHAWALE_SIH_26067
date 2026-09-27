"""Generic, fail-closed ingestion helpers for SIH26067.

These helpers validate structure and provenance without mutating the bundled verified
scientific evidence. They are intentionally conservative.
"""
from __future__ import annotations

import csv
import io
from pathlib import Path
from typing import Any

import h5py
import numpy as np

from .comparison_loader import EvidenceError


CANONICAL_OBSERVATION_FIELDS = (
    "longitude",
    "latitude",
    "depth_m",
    "timestamp",
    "variable",
    "value",
    "units",
    "source",
)


def inspect_cf_netcdf(path: Path) -> dict[str, Any]:
    """Inspect an arbitrary NetCDF4/HDF5 file for CF-style ocean coordinates and variables."""
    path = Path(path)
    if not path.is_file():
        raise EvidenceError(f"NetCDF file does not exist: {path}")

    try:
        with h5py.File(path, "r") as handle:
            variables: list[dict[str, Any]] = []
            coordinates: dict[str, dict[str, Any]] = {}
            for name, obj in handle.items():
                if not isinstance(obj, h5py.Dataset):
                    continue
                attrs = {str(k): _normalise_attr(v) for k, v in obj.attrs.items()}
                entry = {
                    "name": name,
                    "shape": list(obj.shape),
                    "dtype": str(obj.dtype),
                    "units": attrs.get("units"),
                    "standard_name": attrs.get("standard_name"),
                    "axis": attrs.get("axis"),
                    "positive": attrs.get("positive"),
                }
                standard = str(entry.get("standard_name") or "").lower()
                axis = str(entry.get("axis") or "").upper()
                if name.lower() in {"longitude", "lon", "x"} or standard == "longitude" or axis == "X":
                    coordinates["longitude"] = entry
                elif name.lower() in {"latitude", "lat", "y"} or standard == "latitude" or axis == "Y":
                    coordinates["latitude"] = entry
                elif name.lower() in {"depth", "z", "lev", "level"} or standard == "depth" or axis == "Z":
                    coordinates["depth"] = entry
                elif name.lower() in {"time", "t"} or standard == "time" or axis == "T":
                    coordinates["time"] = entry
                elif obj.ndim >= 1:
                    variables.append(entry)

            missing = [name for name in ("longitude", "latitude", "time") if name not in coordinates]
            depth = coordinates.get("depth")
            depth_ok = depth is None or str(depth.get("positive") or "").lower() in {"down", ""}
            cf_global = _normalise_attr(handle.attrs.get("Conventions", handle.attrs.get("conventions", "")))
            return {
                "filename": path.name,
                "format": "NetCDF4/HDF5",
                "conventions": cf_global,
                "coordinates": coordinates,
                "variables": variables,
                "cf_ready": not missing and depth_ok,
                "missing_required_coordinates": missing,
                "depth_positive_valid": depth_ok,
                "policy": "No file is accepted as canonical science solely from extension; coordinate metadata is inspected.",
            }
    except OSError as exc:
        raise EvidenceError(f"Unable to inspect NetCDF/HDF5 file {path.name}: {exc}") from exc


def parse_delimited_observations(text: str, delimiter: str | None = None) -> dict[str, Any]:
    """Parse CSV/TSV/ASCII observations into the canonical row contract."""
    if not text.strip():
        raise EvidenceError("Delimited observation text is empty.")

    sample = text[:4096]
    if delimiter is None:
        try:
            delimiter = csv.Sniffer().sniff(sample, delimiters=",\t;|").delimiter
        except csv.Error:
            delimiter = ","

    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    headers = [str(h or "").strip() for h in (reader.fieldnames or [])]
    missing = [field for field in CANONICAL_OBSERVATION_FIELDS if field not in headers]
    if missing:
        raise EvidenceError("Delimited observation data is missing fields: " + ", ".join(missing))

    rows: list[dict[str, Any]] = []
    for index, row in enumerate(reader, start=2):
        try:
            longitude = float(row["longitude"])
            latitude = float(row["latitude"])
            depth_m = float(row["depth_m"])
            value = float(row["value"])
        except (TypeError, ValueError) as exc:
            raise EvidenceError(f"Row {index} has invalid numeric coordinate/value data.") from exc
        if not (-180 <= longitude <= 360 and -90 <= latitude <= 90 and depth_m >= 0 and np.isfinite(value)):
            raise EvidenceError(f"Row {index} violates geographic/depth/finite-value constraints.")
        rows.append({
            **row,
            "longitude": longitude,
            "latitude": latitude,
            "depth_m": depth_m,
            "value": value,
        })

    return {
        "format": "delimited-text",
        "delimiter": delimiter,
        "record_count": len(rows),
        "fields": headers,
        "records": rows,
        "canonical_fields": list(CANONICAL_OBSERVATION_FIELDS),
    }


def _normalise_attr(value: Any) -> Any:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, np.ndarray):
        return [_normalise_attr(item) for item in value.tolist()]
    if isinstance(value, np.generic):
        return value.item()
    return value
