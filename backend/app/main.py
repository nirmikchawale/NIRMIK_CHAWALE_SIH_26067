"""FastAPI facade over OceanTwin's verified local scientific evidence."""
from __future__ import annotations

from functools import lru_cache
import math
import os
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from config import (
    ARGO_DOI,
    ARGO_PROVIDER,
    COMPARISON_DIR,
    DATASET_ID,
    DEMO_DATE,
    DEMO_REGION,
    DISCLAIMER,
    MODEL_DOI,
    MODEL_FILE,
    MODEL_LABEL,
    PRODUCT_LABEL,
)
from src.comparison_loader import (
    EvidenceError,
    load_bundle,
    load_optional_metadata,
    select_profile,
)
from src.ocean_dataset import load_ocean_dataset


def _env_flag(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


RUNTIME_MODE = os.environ.get("OCEANTWIN_RUNTIME_MODE", "cached_verified")
SCIENCE_NETWORK_REQUIRED = _env_flag("OCEANTWIN_SCIENCE_NETWORK_REQUIRED", False)


app = FastAPI(
    title="OceanTwin 3D API",
    version="1.0.0-mvp",
    description=(
        "Read-only API exposing the same verified Copernicus/Argo evidence used by "
        "the frozen Streamlit scientific reference."
    ),
)

_allowed_origins = [
    item.strip()
    for item in os.environ.get(
        "OCEANTWIN_CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if item.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def _dataset() -> dict[str, Any]:
    return load_ocean_dataset(MODEL_FILE)


@lru_cache(maxsize=1)
def _comparison_bundle():
    return load_bundle(COMPARISON_DIR)


def _ensure_index(name: str, index: int, size: int) -> None:
    if not 0 <= index < size:
        raise HTTPException(status_code=422, detail=f"{name} index {index} is outside 0..{size - 1}.")


def _finite_or_none(value: float) -> float | None:
    value = float(value)
    return value if math.isfinite(value) else None


def _profile_summary(profile: dict[str, Any]) -> dict[str, Any]:
    keep = {
        key: value
        for key, value in profile.items()
        if not key.startswith("_") and not isinstance(value, Path)
    }
    return keep


@app.get("/api/health")
def health() -> dict[str, Any]:
    try:
        dataset = _dataset()
        _, _, profiles = _comparison_bundle()
    except EvidenceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {
        "status": "ok",
        "model_file": MODEL_FILE.name,
        "model_file_present": MODEL_FILE.is_file(),
        "comparison_directory_present": COMPARISON_DIR.is_dir(),
        "variables": sorted(dataset["variables"].keys()),
        "time_steps": len(dataset["time"]),
        "depth_levels": len(dataset["depth"]),
        "eligible_profiles": len(profiles),
        "scientific_data_network_required": SCIENCE_NETWORK_REQUIRED,
        "runtime_mode": RUNTIME_MODE,
        "streamlit_reference_preserved": True,
    }


@app.get("/api/catalog")
def catalog() -> dict[str, Any]:
    try:
        dataset = _dataset()
    except EvidenceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    variable_cards = []
    for name in ("thetao", "so"):
        if name in dataset["variables"]:
            meta = dataset["variables"][name]
            variable_cards.append(
                {
                    "id": name,
                    "label": meta["label"],
                    "kind": "scalar",
                    "units": meta["units"],
                    "standard_name": meta["standard_name"],
                    "minimum": meta["minimum"],
                    "maximum": meta["maximum"],
                }
            )

    if "uo" in dataset["variables"] and "vo" in dataset["variables"]:
        u = dataset["variables"]["uo"]["values"]
        v = dataset["variables"]["vo"]["values"]
        speed = np.sqrt(u**2 + v**2)
        finite_speed = speed[np.isfinite(speed)]
        variable_cards.append(
            {
                "id": "currents",
                "label": "Currents",
                "kind": "vector",
                "units": "m s-1",
                "components": ["uo", "vo"],
                "minimum": float(finite_speed.min()),
                "maximum": float(finite_speed.max()),
            }
        )

    return {
        "dataset": {
            "label": MODEL_LABEL,
            "product": PRODUCT_LABEL,
            "dataset_id": DATASET_ID,
            "doi": MODEL_DOI,
            "source": dataset["source"],
            "title": dataset["title"],
            "region": DEMO_REGION,
            "demo_date": DEMO_DATE,
            "freshness_class": "reanalysis",
            "runtime_mode": RUNTIME_MODE,
        },
        "coordinates": {
            "longitude": dataset["longitude"].tolist(),
            "latitude": dataset["latitude"].tolist(),
            "depth": dataset["depth"].tolist(),
            "depth_units": dataset["depth_units"],
            "depth_positive": dataset["depth_positive"],
            "time": dataset["time_iso"],
        },
        "variables": variable_cards,
        "capabilities": {
            "scalar_3d": True,
            "depth_slice": True,
            "current_vectors": "uo" in dataset["variables"] and "vo" in dataset["variables"],
            "time_steps": len(dataset["time"]),
            "time_animation": len(dataset["time"]) > 1,
            "argo_profiles": True,
            "offline_scientific_data": True,
            "streamlit_fallback": True,
        },
        "scientific_disclaimer": DISCLAIMER,
    }


@app.get("/api/field")
def scalar_field(
    variable: str = Query("thetao", pattern="^(thetao|so)$"),
    time_index: int = 0,
    depth_index: int = 0,
    stride: int = Query(1, ge=1, le=8),
) -> dict[str, Any]:
    dataset = _dataset()
    if variable not in dataset["variables"]:
        raise HTTPException(status_code=404, detail=f"Variable {variable!r} is not in the cached dataset.")

    _ensure_index("time", time_index, len(dataset["time"]))
    _ensure_index("depth", depth_index, len(dataset["depth"]))

    meta = dataset["variables"][variable]
    values = meta["values"][time_index, depth_index, ::stride, ::stride]
    latitude = dataset["latitude"][::stride]
    longitude = dataset["longitude"][::stride]

    return {
        "variable": variable,
        "label": meta["label"],
        "units": meta["units"],
        "time_index": time_index,
        "time": dataset["time_iso"][time_index],
        "depth_index": depth_index,
        "depth_m": float(dataset["depth"][depth_index]),
        "latitude": latitude.tolist(),
        "longitude": longitude.tolist(),
        "values": [[_finite_or_none(v) for v in row] for row in values],
        "minimum": meta["minimum"],
        "maximum": meta["maximum"],
        "provenance": {
            "product": PRODUCT_LABEL,
            "dataset_id": DATASET_ID,
            "freshness_class": "reanalysis",
            "runtime_mode": RUNTIME_MODE,
        },
    }


@app.get("/api/volume")
def scalar_volume(
    variable: str = Query("thetao", pattern="^(thetao|so)$"),
    time_index: int = 0,
    horizontal_stride: int = Query(2, ge=1, le=8),
    depth_stride: int = Query(2, ge=1, le=8),
) -> dict[str, Any]:
    dataset = _dataset()
    if variable not in dataset["variables"]:
        raise HTTPException(status_code=404, detail=f"Variable {variable!r} is not in the cached dataset.")
    _ensure_index("time", time_index, len(dataset["time"]))

    meta = dataset["variables"][variable]
    values = meta["values"][time_index]
    points: list[list[float]] = []
    for di in range(0, len(dataset["depth"]), depth_stride):
        depth = float(dataset["depth"][di])
        layer = values[di]
        for yi in range(0, len(dataset["latitude"]), horizontal_stride):
            lat = float(dataset["latitude"][yi])
            for xi in range(0, len(dataset["longitude"]), horizontal_stride):
                value = float(layer[yi, xi])
                if math.isfinite(value):
                    points.append([float(dataset["longitude"][xi]), lat, depth, value])

    return {
        "variable": variable,
        "label": meta["label"],
        "units": meta["units"],
        "time_index": time_index,
        "time": dataset["time_iso"][time_index],
        "points": points,
        "minimum": meta["minimum"],
        "maximum": meta["maximum"],
        "depth_positive": "down",
        "rendering_note": (
            "Depth values are scientific metres positive downward. The browser may apply "
            "visual exaggeration without changing these values."
        ),
    }


@app.get("/api/currents")
def currents(
    time_index: int = 0,
    depth_index: int = 0,
    stride: int = Query(2, ge=1, le=8),
) -> dict[str, Any]:
    dataset = _dataset()
    if "uo" not in dataset["variables"] or "vo" not in dataset["variables"]:
        raise HTTPException(status_code=404, detail="Current components uo/vo are unavailable.")

    _ensure_index("time", time_index, len(dataset["time"]))
    _ensure_index("depth", depth_index, len(dataset["depth"]))

    u = dataset["variables"]["uo"]["values"][time_index, depth_index]
    v = dataset["variables"]["vo"]["values"][time_index, depth_index]
    vectors: list[list[float]] = []
    speeds: list[float] = []

    for yi in range(0, len(dataset["latitude"]), stride):
        lat = float(dataset["latitude"][yi])
        for xi in range(0, len(dataset["longitude"]), stride):
            uu = float(u[yi, xi])
            vv = float(v[yi, xi])
            if not (math.isfinite(uu) and math.isfinite(vv)):
                continue
            speed = math.hypot(uu, vv)
            speeds.append(speed)
            vectors.append([float(dataset["longitude"][xi]), lat, uu, vv, speed])

    return {
        "variable": "currents",
        "units": "m s-1",
        "time_index": time_index,
        "time": dataset["time_iso"][time_index],
        "depth_index": depth_index,
        "depth_m": float(dataset["depth"][depth_index]),
        "vectors": vectors,
        "minimum": min(speeds) if speeds else 0.0,
        "maximum": max(speeds) if speeds else 0.0,
        "rendering_note": (
            "Vector glyphs may be projected to the visible ocean surface for readability; "
            "their values always correspond to the selected model depth."
        ),
    }


@app.get("/api/profiles")
def profiles() -> dict[str, Any]:
    try:
        _, _, profile_items = _comparison_bundle()
    except EvidenceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {
        "provider": ARGO_PROVIDER,
        "doi": ARGO_DOI,
        "profiles": [_profile_summary(item) for item in profile_items],
    }


@app.get("/api/profiles/{profile_id}")
def profile_detail(profile_id: str) -> dict[str, Any]:
    try:
        _, _, profile_items = _comparison_bundle()
        selected = select_profile(profile_items, profile_id)
    except EvidenceError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    table = selected["_table"].copy()
    rows = []
    for record in table.to_dict(orient="records"):
        rows.append(
            {
                key: (_finite_or_none(value) if isinstance(value, (float, np.floating)) else value)
                for key, value in record.items()
            }
        )
    return {
        "summary": _profile_summary(selected),
        "levels": rows,
        "comparison_semantics": {
            "bias": "Model − Observation",
            "horizontal": "nearest valid Copernicus water cell",
            "vertical": "linear interpolation between adjacent valid model depths; no extrapolation",
            "interpretation": "diagnostic consistency, not independent validation",
        },
    }


@app.get("/api/provenance")
def provenance() -> dict[str, Any]:
    try:
        config, comparison_provenance, _ = _comparison_bundle()
    except EvidenceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    metadata = load_optional_metadata(COMPARISON_DIR)
    metadata_keys = sorted(metadata.keys()) if isinstance(metadata, dict) else []
    return {
        "model": {
            "label": MODEL_LABEL,
            "product": PRODUCT_LABEL,
            "dataset_id": DATASET_ID,
            "doi": MODEL_DOI,
            "file": MODEL_FILE.name,
            "freshness_class": "reanalysis",
            "runtime_mode": "cached_verified",
        },
        "observations": {
            "provider": ARGO_PROVIDER,
            "doi": ARGO_DOI,
        },
        "quality_control": {
            "accepted_provider_qc": config.get("accepted_provider_qc", []),
            "max_cell_distance_km": config.get("max_cell_distance_km"),
            "matched_profiles": len(_comparison_bundle()[2]),
            "no_extrapolation": True,
            "metrics_weighting": config.get("metrics_weighting"),
        },
        "methodology": {
            "horizontal": config.get("horizontal_policy"),
            "depth": config.get("depth_policy"),
            "time": config.get("time_policy"),
            "temperature": config.get("temperature_policy"),
        },
        "integrity": {
            "created_utc": comparison_provenance.get("created_utc"),
            "source_checksums_unchanged": comparison_provenance.get("raw_unchanged"),
            "configuration_sha256": comparison_provenance.get("configuration_sha256"),
            "engine_sha256": comparison_provenance.get("engine_sha256"),
            "no_synthetic_measurements_in_outputs": comparison_provenance.get(
                "no_synthetic_measurements_in_outputs"
            ),
        },
        "source_metadata_available": metadata_keys,
        "scientific_disclaimer": DISCLAIMER,
    }
