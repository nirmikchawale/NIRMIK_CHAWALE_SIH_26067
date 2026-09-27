"""Fetch genuine multi-sensor observation evidence for the SIH26067 public build.

No measurements are synthesized. The script reads bounded public ERDDAP subsets from:
- IOOS Ocean Gliders: Indian Ocean ru29 glider (profile 7)
- CCHDO/NOAA PMEL: one CTD profile discovered in/near the Indian Ocean
- NOAA/AOML: one BGC-Argo profile from float 2904011

Provider values are preserved. Pressure coordinates are converted to depth metres with the
UNESCO/Saunders-Fofonoff pressure-to-depth relation and the transformation is recorded.
"""
from __future__ import annotations

import argparse
import csv
from datetime import datetime, timezone
import io
import json
import math
from pathlib import Path
import time
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

USER_AGENT = "OceanTwin-SIH26067/1.0 (+https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL)"
MAX_PROFILE_LEVELS = 48

GLIDER_DATASET = "ru29-20180812T0220"
GLIDER_PROFILE_ID = 7
GLIDER_BASE = f"https://gliders.ioos.us/erddap/tabledap/{GLIDER_DATASET}.csv"
GLIDER_INFO = f"https://gliders.ioos.us/erddap/info/{GLIDER_DATASET}/index.html"

CTD_BASE = "https://data.pmel.noaa.gov/generic/erddap/tabledap/cchdo_ctd.csv"
CTD_INFO = "https://data.pmel.noaa.gov/generic/erddap/info/cchdo_ctd/index.html"

BGC_DATASET = "2904011_0f71_8407_6ee4"
BGC_BASE = f"https://cwcgom.aoml.noaa.gov/erddap/tabledap/{BGC_DATASET}.csv"
BGC_INFO = f"https://cwcgom.aoml.noaa.gov/erddap/info/{BGC_DATASET}/index.html"
BGC_START = "2026-06-08T00:00:00Z"
BGC_END = "2026-06-15T00:00:00Z"


def _query_url(base: str, variables: Iterable[str], constraints: Iterable[str] = ()) -> str:
    first = quote(",".join(variables), safe=",._-")
    tail = "".join("&" + quote(item, safe='=<>!~"(),:._-') for item in constraints)
    return base + "?" + first + tail


def _fetch_text(url: str, attempts: int = 4, timeout: int = 60) -> str:
    last: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/csv,*/*;q=0.8"})
            with urlopen(request, timeout=timeout) as response:
                if response.status != 200:
                    raise RuntimeError(f"HTTP {response.status}")
                return response.read().decode("utf-8")
        except (HTTPError, URLError, TimeoutError, ConnectionResetError, OSError, RuntimeError) as exc:
            last = exc
            if attempt < attempts:
                time.sleep(attempt * 2)
    raise RuntimeError(f"Unable to fetch verified provider data: {url} ({last})")


def _rows(url: str) -> list[dict[str, str]]:
    text = _fetch_text(url)
    reader = csv.DictReader(io.StringIO(text))
    return [dict(row) for row in reader]


def _finite(value: str | None, *, max_abs: float = 9_000.0) -> float | None:
    try:
        number = float(str(value).strip())
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number) or abs(number) >= max_abs:
        return None
    return number


def _iso(value: str | None) -> str | None:
    text = str(value or "").strip()
    if not text or not text.endswith("Z"):
        return None
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _pressure_to_depth_m(pressure_dbar: float, latitude_deg: float) -> float:
    """UNESCO 1983/Saunders-Fofonoff pressure-to-depth approximation."""
    x = math.sin(math.radians(latitude_deg)) ** 2
    gravity = 9.780318 * (1.0 + (5.2788e-3 + 2.36e-5 * x) * x) + 1.092e-6 * pressure_dbar
    numerator = (
        (((-1.82e-15 * pressure_dbar + 2.279e-10) * pressure_dbar - 2.2512e-5)
         * pressure_dbar + 9.72659)
        * pressure_dbar
    )
    return max(0.0, numerator / gravity)


def _thin(records: list[dict[str, Any]], max_levels: int = MAX_PROFILE_LEVELS) -> list[dict[str, Any]]:
    if len(records) <= max_levels:
        return records
    indices = sorted({
        round(index * (len(records) - 1) / (max_levels - 1))
        for index in range(max_levels)
    })
    return [records[index] for index in indices]


def _canonical_profile(
    *,
    sensor_type: str,
    platform_id: str,
    latitude: float,
    longitude: float,
    timestamp: str,
    provider: str,
    source: str,
    dataset_id: str,
    source_url: str,
    query_url: str,
    records_by_variable: dict[str, tuple[str, list[tuple[float, float]]]],
    processing: list[str],
) -> dict[str, Any]:
    canonical_records: list[dict[str, Any]] = []
    for variable, (units, pairs) in records_by_variable.items():
        ordered = sorted(
            [{"depth_m": depth, "value": value} for depth, value in pairs if depth >= 0 and math.isfinite(value)],
            key=lambda item: item["depth_m"],
        )
        for item in _thin(ordered):
            canonical_records.append({
                "longitude": longitude,
                "latitude": latitude,
                "depth_m": item["depth_m"],
                "timestamp": timestamp,
                "variable": variable,
                "value": item["value"],
                "units": units,
                "source": source,
                "platform_id": platform_id,
                "sensor_type": sensor_type,
                "dataset_id": dataset_id,
            })

    variables = sorted({row["variable"] for row in canonical_records})
    depths = sorted({round(float(row["depth_m"]), 6) for row in canonical_records})
    if len(canonical_records) < 8 or len(depths) < 4:
        raise RuntimeError(f"{sensor_type} evidence is too sparse: {len(canonical_records)} rows / {len(depths)} depths")

    return {
        "id": f"verified:{sensor_type}:{platform_id}:{timestamp}",
        "platform_id": platform_id,
        "sensor_type": sensor_type,
        "longitude": longitude,
        "latitude": latitude,
        "timestamp": timestamp,
        "provider": provider,
        "source": source,
        "dataset_id": dataset_id,
        "source_url": source_url,
        "query_url": query_url,
        "evidence_class": "provider-built-in",
        "variables": variables,
        "records": canonical_records,
        "processing": processing + [
            f"Display pack is depth-thinned to at most {MAX_PROFILE_LEVELS} source samples per variable.",
            "Provider measurement values are not interpolated, smoothed, converted, or synthesized.",
        ],
    }


def fetch_glider() -> dict[str, Any]:
    variables = ["profile_id", "time", "latitude", "longitude", "depth", "temperature", "salinity"]
    url = _query_url(GLIDER_BASE, variables, [f"profile_id={GLIDER_PROFILE_ID}"])
    rows = _rows(url)
    valid: list[tuple[float, float, float, float, float, str]] = []
    for row in rows:
        depth = _finite(row.get("depth"), max_abs=20_000)
        temp = _finite(row.get("temperature"))
        sal = _finite(row.get("salinity"))
        lat = _finite(row.get("latitude"), max_abs=1000)
        lon = _finite(row.get("longitude"), max_abs=1000)
        timestamp = _iso(row.get("time"))
        if None in (depth, lat, lon) or timestamp is None or (temp is None and sal is None):
            continue
        valid.append((float(depth), float(temp) if temp is not None else math.nan,
                      float(sal) if sal is not None else math.nan, float(lat), float(lon), timestamp))
    if len(valid) < 4:
        raise RuntimeError("IOOS glider profile returned insufficient valid levels")

    latitude = sum(item[3] for item in valid) / len(valid)
    longitude = sum(item[4] for item in valid) / len(valid)
    timestamp = valid[0][5]
    temperature = [(d, t) for d, t, _, _, _, _ in valid if math.isfinite(t)]
    salinity = [(d, s) for d, _, s, _, _, _ in valid if math.isfinite(s)]
    return _canonical_profile(
        sensor_type="glider",
        platform_id=f"ru29-P{GLIDER_PROFILE_ID}",
        latitude=latitude,
        longitude=longitude,
        timestamp=timestamp,
        provider="IOOS Glider DAC · Rutgers / University of Western Australia",
        source="IOOS OceanGliders ERDDAP",
        dataset_id=GLIDER_DATASET,
        source_url=GLIDER_INFO,
        query_url=url,
        records_by_variable={
            "temperature": ("degree_Celsius", temperature),
            "salinity": ("1", salinity),
        },
        processing=["Provider depth coordinate is metres positive downward."],
    )


def _discover_ctd_profile() -> tuple[str, str]:
    regions = [
        (12.0, 14.0, 67.0, 70.0, "SIH study-region"),
        (-20.0, 25.0, 40.0, 100.0, "broader Indian Ocean"),
    ]
    for lat_min, lat_max, lon_min, lon_max, label in regions:
        url = _query_url(
            CTD_BASE,
            ["profile_id", "time", "latitude", "longitude"],
            [
                f"latitude>={lat_min}", f"latitude<={lat_max}",
                f"longitude>={lon_min}", f"longitude<={lon_max}",
                "distinct()",
            ],
        )
        candidates = []
        for row in _rows(url):
            profile_id = str(row.get("profile_id") or "").strip()
            timestamp = _iso(row.get("time"))
            lat = _finite(row.get("latitude"), max_abs=1000)
            lon = _finite(row.get("longitude"), max_abs=1000)
            if profile_id and timestamp and lat is not None and lon is not None:
                candidates.append((timestamp, profile_id))
        if candidates:
            candidates.sort(reverse=True)
            return candidates[0][1], label
    raise RuntimeError("CCHDO did not return a CTD profile in the configured Indian Ocean search windows")


def fetch_ctd() -> dict[str, Any]:
    profile_id, discovery_scope = _discover_ctd_profile()
    variables = [
        "profile_id", "time", "latitude", "longitude", "pressure",
        "ctd_temperature", "ctd_salinity",
    ]
    url = _query_url(CTD_BASE, variables, [f'profile_id="{profile_id}"'])
    rows = _rows(url)
    valid = []
    for row in rows:
        pressure = _finite(row.get("pressure"), max_abs=20_000)
        temp = _finite(row.get("ctd_temperature"))
        sal = _finite(row.get("ctd_salinity"))
        lat = _finite(row.get("latitude"), max_abs=1000)
        lon = _finite(row.get("longitude"), max_abs=1000)
        timestamp = _iso(row.get("time"))
        if None in (pressure, lat, lon) or timestamp is None or (temp is None and sal is None):
            continue
        # Reject known fill/outlier values rather than silently presenting them as ocean measurements.
        if temp is not None and not (-3 <= temp <= 45):
            temp = None
        if sal is not None and not (0 <= sal <= 50):
            sal = None
        if temp is None and sal is None:
            continue
        depth = _pressure_to_depth_m(float(pressure), float(lat))
        valid.append((depth, temp, sal, float(lat), float(lon), timestamp))
    if len(valid) < 4:
        raise RuntimeError(f"CCHDO profile {profile_id} returned insufficient valid levels")

    latitude = sum(item[3] for item in valid) / len(valid)
    longitude = sum(item[4] for item in valid) / len(valid)
    timestamp = valid[0][5]
    temperature = [(d, float(t)) for d, t, _, _, _, _ in valid if t is not None]
    salinity = [(d, float(s)) for d, _, s, _, _, _ in valid if s is not None]
    return _canonical_profile(
        sensor_type="ctd",
        platform_id=f"CCHDO-{profile_id}",
        latitude=latitude,
        longitude=longitude,
        timestamp=timestamp,
        provider="CCHDO · NOAA PMEL ERDDAP",
        source="CCHDO GO-SHIP CTD",
        dataset_id="cchdo_ctd",
        source_url=CTD_INFO,
        query_url=url,
        records_by_variable={
            "temperature": ("degree_C", temperature),
            "salinity": ("1", salinity),
        },
        processing=[
            f"Profile was discovered from the {discovery_scope} provider subset.",
            "Observed sea-water pressure (dbar) is converted to depth (m) with the UNESCO 1983/Saunders-Fofonoff relation using profile latitude.",
        ],
    )


def fetch_bgc() -> dict[str, Any]:
    variables = ["time", "latitude", "longitude", "CYCLE_NUMBER", "PRES", "TEMP", "PSAL", "DOXY", "CHLA"]
    url = _query_url(
        BGC_BASE,
        variables,
        [f"time>={BGC_START}", f"time<={BGC_END}"],
    )
    grouped: dict[tuple[str, float, float, str], list[dict[str, Any]]] = {}
    for row in _rows(url):
        timestamp = _iso(row.get("time"))
        lat = _finite(row.get("latitude"), max_abs=1000)
        lon = _finite(row.get("longitude"), max_abs=1000)
        pressure = _finite(row.get("PRES"), max_abs=20_000)
        if timestamp is None or lat is None or lon is None or pressure is None:
            continue
        cycle = str(row.get("CYCLE_NUMBER") or "").strip() or "unknown"
        values = {
            "TEMP": _finite(row.get("TEMP")),
            "PSAL": _finite(row.get("PSAL")),
            "DOXY": _finite(row.get("DOXY")),
            "CHLA": _finite(row.get("CHLA")),
        }
        if not any(value is not None for value in values.values()):
            continue
        depth = _pressure_to_depth_m(float(pressure), float(lat))
        key = (timestamp, float(lat), float(lon), cycle)
        grouped.setdefault(key, []).append({"depth": depth, **values})

    if not grouped:
        raise RuntimeError("NOAA/AOML BGC-Argo query returned no valid profile rows")

    # Prefer the profile with the strongest genuine BGC coverage.
    key, rows = max(
        grouped.items(),
        key=lambda item: (
            sum(row["CHLA"] is not None for row in item[1]) +
            sum(row["DOXY"] is not None for row in item[1]),
            len(item[1]),
        ),
    )
    timestamp, latitude, longitude, cycle = key
    mapping = {
        "temperature": ("degree_Celsius", "TEMP"),
        "salinity": ("psu", "PSAL"),
        "dissolved_oxygen": ("micromole/kg", "DOXY"),
        "chlorophyll_a": ("mg/m3", "CHLA"),
    }
    records: dict[str, tuple[str, list[tuple[float, float]]]] = {}
    for variable, (units, source_name) in mapping.items():
        pairs = [(float(row["depth"]), float(row[source_name])) for row in rows if row[source_name] is not None]
        if pairs:
            records[variable] = (units, pairs)

    if "chlorophyll_a" not in records or "dissolved_oxygen" not in records:
        raise RuntimeError("BGC-Argo evidence lacks required CHLA/DOXY measurements")

    return _canonical_profile(
        sensor_type="bgc",
        platform_id=f"Argo-BGC-2904011-C{cycle}",
        latitude=latitude,
        longitude=longitude,
        timestamp=timestamp,
        provider="NOAA/AOML · Argo GDAC",
        source="Argo BGC AOML vertical profile",
        dataset_id=BGC_DATASET,
        source_url=BGC_INFO,
        query_url=url,
        records_by_variable=records,
        processing=[
            "Observed PRES (dbar) is converted to depth (m) with the UNESCO 1983/Saunders-Fofonoff relation using profile latitude.",
            "BGC profile selection maximizes genuine CHLA + DOXY level coverage within the fixed source time window.",
        ],
    )


def build_snapshot() -> dict[str, Any]:
    profiles = [fetch_glider(), fetch_ctd(), fetch_bgc()]
    by_sensor = {profile["sensor_type"]: profile for profile in profiles}
    required = {"glider", "ctd", "bgc"}
    if set(by_sensor) != required:
        raise RuntimeError(f"Expected exactly {sorted(required)} sensors, got {sorted(by_sensor)}")
    for profile in profiles:
        if profile["evidence_class"] != "provider-built-in":
            raise RuntimeError("Unexpected evidence class")
        if not profile["source_url"].startswith("https://") or not profile["query_url"].startswith("https://"):
            raise RuntimeError("Every built-in profile must have public source/query provenance")

    return {
        "schema": "oceantwin-multisensor-observations-v1",
        "generated_utc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "profiles": profiles,
        "integrity": {
            "sensor_types": sorted(by_sensor),
            "profile_count": len(profiles),
            "synthetic_measurements": False,
            "provider_values_modified": False,
            "pressure_to_depth_is_derived_coordinate": True,
            "runtime_network_required": False,
        },
        "purpose": (
            "Build-verified evidence that OceanTwin's generic observation plugin can co-visualize "
            "genuine Glider, CTD and BGC profiles without sensor-specific renderer rewrites."
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    payload = build_snapshot()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(
        "Verified multi-sensor evidence:",
        ", ".join(
            f'{profile["sensor_type"]}={profile["platform_id"]}({len(profile["records"])} rows)'
            for profile in payload["profiles"]
        ),
    )


if __name__ == "__main__":
    main()
