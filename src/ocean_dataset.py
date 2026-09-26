"""Canonical multidimensional ocean-model adapter for the final web MVP.

This module is additive: the frozen Streamlit reference continues to use
src.data_loader.load_model unchanged. The React/FastAPI application uses this
adapter to expose all verified variables in the bundled Copernicus subset.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
import re
from typing import Any

import h5py
import numpy as np

from .comparison_loader import EvidenceError
from .data_loader import _decode_packed, _require_increasing, _scalar_attr


VARIABLE_SPECS: dict[str, dict[str, Any]] = {
    "thetao": {
        "label": "Temperature",
        "kind": "scalar",
        "standard_name": "sea_water_potential_temperature",
        "accepted_units": {"degrees_C", "degree_Celsius", "degrees_Celsius"},
    },
    "so": {
        "label": "Salinity",
        "kind": "scalar",
        "standard_name": "sea_water_salinity",
        "accepted_units": {"1e-3"},
    },
    "uo": {
        "label": "Eastward current",
        "kind": "vector_component",
        "standard_name": "eastward_sea_water_velocity",
        "accepted_units": {"m s-1"},
    },
    "vo": {
        "label": "Northward current",
        "kind": "vector_component",
        "standard_name": "northward_sea_water_velocity",
        "accepted_units": {"m s-1"},
    },
}


def _decode_cf_time(values: np.ndarray, units: str | None) -> list[str]:
    if units is None:
        return [str(float(v)) for v in values]

    match = re.match(
        r"^(seconds|minutes|hours|days) since (\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?",
        str(units).strip(),
        flags=re.IGNORECASE,
    )
    if not match:
        return [str(float(v)) for v in values]

    unit, date_part, time_part = match.groups()
    base = datetime.fromisoformat(f"{date_part}T{time_part or '00:00:00'}").replace(tzinfo=timezone.utc)
    factor = {
        "seconds": 1.0,
        "minutes": 60.0,
        "hours": 3600.0,
        "days": 86400.0,
    }[unit.lower()]
    return [
        (base + timedelta(seconds=float(value) * factor)).isoformat().replace("+00:00", "Z")
        for value in values
    ]


def load_ocean_dataset(path: Path) -> dict[str, Any]:
    """Load the verified model subset as time×depth×latitude×longitude arrays."""
    path = Path(path)
    if not path.is_file():
        raise EvidenceError(f"Missing cached Copernicus model subset: {path}")

    try:
        with h5py.File(path, "r") as handle:
            coordinate_names = ("longitude", "latitude", "depth", "time")
            missing_coords = [name for name in coordinate_names if name not in handle]
            if missing_coords:
                raise EvidenceError(
                    "Model subset is missing canonical coordinates: " + ", ".join(missing_coords)
                )

            longitude = np.asarray(handle["longitude"][...], dtype=float)
            latitude = np.asarray(handle["latitude"][...], dtype=float)
            depth = np.asarray(handle["depth"][...], dtype=float)
            time_values = np.asarray(handle["time"][...], dtype=float).reshape(-1)

            _require_increasing("longitude", longitude)
            _require_increasing("latitude", latitude)
            _require_increasing("depth", depth)

            depth_units = str(_scalar_attr(handle["depth"], "units", ""))
            depth_positive = str(_scalar_attr(handle["depth"], "positive", ""))
            if depth_units != "m" or depth_positive.lower() != "down":
                raise EvidenceError(
                    f"Unexpected model depth definition: units={depth_units!r}, positive={depth_positive!r}."
                )

            time_units = _scalar_attr(handle["time"], "units", None)
            time_calendar = _scalar_attr(handle["time"], "calendar", None)
            time_iso = _decode_cf_time(time_values, str(time_units) if time_units is not None else None)

            variables: dict[str, dict[str, Any]] = {}
            expected_shape = (len(time_values), len(depth), len(latitude), len(longitude))

            for name, spec in VARIABLE_SPECS.items():
                if name not in handle:
                    continue
                dataset = handle[name]
                standard_name = str(_scalar_attr(dataset, "standard_name", ""))
                units = str(_scalar_attr(dataset, "units", ""))
                if standard_name != spec["standard_name"]:
                    raise EvidenceError(
                        f"Unexpected {name} standard_name: {standard_name!r}; "
                        f"expected {spec['standard_name']!r}."
                    )
                if units not in spec["accepted_units"]:
                    raise EvidenceError(
                        f"Unexpected {name} units: {units!r}; expected one of "
                        f"{sorted(spec['accepted_units'])!r}."
                    )

                values = _decode_packed(dataset)
                if values.ndim == 3:
                    values = values[np.newaxis, ...]
                if values.shape != expected_shape:
                    raise EvidenceError(
                        f"Model variable {name} has shape {values.shape}; expected {expected_shape}."
                    )
                finite = values[np.isfinite(values)]
                if finite.size == 0:
                    raise EvidenceError(f"Model variable {name} contains no finite values.")

                variables[name] = {
                    "values": values,
                    "label": spec["label"],
                    "kind": spec["kind"],
                    "units": units,
                    "standard_name": standard_name,
                    "minimum": float(finite.min()),
                    "maximum": float(finite.max()),
                }

            if "thetao" not in variables:
                raise EvidenceError("The final MVP requires the verified thetao field.")
            if ("uo" in variables) != ("vo" in variables):
                raise EvidenceError("Current-vector components must be present together as uo and vo.")

            return {
                "path": path,
                "longitude": longitude,
                "latitude": latitude,
                "depth": depth,
                "depth_units": depth_units,
                "depth_positive": depth_positive,
                "time": time_values,
                "time_iso": time_iso,
                "time_units": time_units,
                "time_calendar": time_calendar,
                "variables": variables,
                "source": str(handle.attrs.get("source", "MERCATOR GLORYS12V1")),
                "title": str(handle.attrs.get("title", "Copernicus model subset")),
            }
    except EvidenceError:
        raise
    except (OSError, ValueError, KeyError) as exc:
        raise EvidenceError(f"Unable to read cached ocean model subset {path.name}: {exc}") from exc
