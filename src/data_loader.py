"""Read and validate the cached Copernicus subset without mutation or downloads."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import h5py
import numpy as np

from .comparison_loader import EvidenceError


def _scalar_attr(dataset: h5py.Dataset, key: str, default=None):
    if key not in dataset.attrs:
        return default
    value = np.asarray(dataset.attrs[key]).reshape(-1)[0]
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, np.generic):
        return value.item()
    return value


def _decode_packed(dataset: h5py.Dataset) -> np.ndarray:
    raw = np.asarray(dataset[...])
    fill = _scalar_attr(dataset, "_FillValue", None)
    valid_min = _scalar_attr(dataset, "valid_min", None)
    valid_max = _scalar_attr(dataset, "valid_max", None)

    mask = np.zeros(raw.shape, dtype=bool)
    if fill is not None:
        mask |= raw == fill
    if valid_min is not None:
        mask |= raw < valid_min
    if valid_max is not None:
        mask |= raw > valid_max

    scale = float(_scalar_attr(dataset, "scale_factor", 1.0))
    offset = float(_scalar_attr(dataset, "add_offset", 0.0))
    decoded = raw.astype(np.float64) * scale + offset
    decoded[mask] = np.nan
    return decoded


def _require_increasing(name: str, values: np.ndarray) -> None:
    if values.ndim != 1 or values.size == 0:
        raise EvidenceError(f"Model coordinate {name} must be a non-empty 1D array.")
    if not np.isfinite(values).all() or not np.all(np.diff(values) > 0):
        raise EvidenceError(f"Model coordinate {name} must be finite and strictly increasing.")


def load_model(path: Path, config: dict[str, Any] | None = None) -> dict[str, Any]:
    path = Path(path)
    if not path.is_file():
        raise EvidenceError(f"Missing cached Copernicus model subset: {path}")

    config = config or {}
    variable = str(config.get("model_variable", "thetao"))
    coords = config.get("model_coordinates", {})
    lon_name = str(coords.get("longitude", "longitude"))
    lat_name = str(coords.get("latitude", "latitude"))
    depth_name = str(coords.get("depth", "depth"))
    time_name = str(coords.get("time", "time"))

    try:
        with h5py.File(path, "r") as handle:
            required = [variable, lon_name, lat_name, depth_name]
            missing = [name for name in required if name not in handle]
            if missing:
                raise EvidenceError(f"Model subset is missing required variables: {', '.join(missing)}")

            longitude = np.asarray(handle[lon_name][...], dtype=float)
            latitude = np.asarray(handle[lat_name][...], dtype=float)
            depth = np.asarray(handle[depth_name][...], dtype=float)
            _require_increasing("longitude", longitude)
            _require_increasing("latitude", latitude)
            _require_increasing("depth", depth)

            depth_units = str(_scalar_attr(handle[depth_name], "units", ""))
            depth_positive = str(_scalar_attr(handle[depth_name], "positive", ""))
            if depth_units != "m" or depth_positive.lower() != "down":
                raise EvidenceError(
                    f"Unexpected model depth definition: units={depth_units!r}, positive={depth_positive!r}."
                )

            standard_name = str(_scalar_attr(handle[variable], "standard_name", ""))
            units = str(_scalar_attr(handle[variable], "units", ""))
            if standard_name != "sea_water_potential_temperature":
                raise EvidenceError(f"Unexpected model temperature standard_name: {standard_name!r}.")
            if units not in {"degrees_C", "degree_Celsius", "degrees_Celsius"}:
                raise EvidenceError(f"Unexpected model temperature units: {units!r}.")

            temperature = _decode_packed(handle[variable])
            if temperature.ndim == 4:
                if temperature.shape[0] != 1:
                    raise EvidenceError(f"Expected one cached model time, found shape {temperature.shape}.")
                temperature = temperature[0]
            if temperature.ndim != 3:
                raise EvidenceError(f"Expected temperature as depth×latitude×longitude; got {temperature.shape}.")
            expected = (len(depth), len(latitude), len(longitude))
            if temperature.shape != expected:
                raise EvidenceError(
                    f"Model coordinate/data shape mismatch: {variable} {temperature.shape}, expected {expected}."
                )
            if not np.isfinite(temperature).any():
                raise EvidenceError("The cached model subset contains no finite temperature values.")

            time_value = None
            time_units = None
            time_calendar = None
            if time_name in handle:
                t = np.asarray(handle[time_name][...]).reshape(-1)
                if len(t) != 1:
                    raise EvidenceError(f"Expected one cached daily time value, found {len(t)}.")
                time_value = float(t[0])
                time_units = _scalar_attr(handle[time_name], "units", None)
                time_calendar = _scalar_attr(handle[time_name], "calendar", None)

            result = {
                "path": path,
                "longitude": longitude,
                "latitude": latitude,
                "depth": depth,
                "depth_units": depth_units,
                "depth_positive": depth_positive,
                "temperature": temperature,
                "temperature_units": units,
                "temperature_standard_name": standard_name,
                "time_value": time_value,
                "time_units": time_units,
                "time_calendar": time_calendar,
                "source": handle.attrs.get("source", "MERCATOR GLORYS12V1"),
                "title": handle.attrs.get("title", "Copernicus model subset"),
            }
    except EvidenceError:
        raise
    except (OSError, ValueError, KeyError) as exc:
        raise EvidenceError(f"Unable to read cached model subset {path.name}: {exc}") from exc

    finite = result["temperature"][np.isfinite(result["temperature"])]
    result["temperature_min"] = float(finite.min())
    result["temperature_max"] = float(finite.max())
    return result
