"""Fetch a bounded, genuine multi-time INCOIS operational subset for the static SIH demo.

The bundled GLORYS scientific baseline remains untouched. This script talks directly to
INCOIS ERDDAP, validates the returned coordinates/timestamps/values, and writes a compact
JSON snapshot that the browser can animate without runtime network dependency.
"""
from __future__ import annotations

import argparse
import csv
from datetime import datetime, timezone
import io
import json
import math
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

DATASET_ID = "incois_argo_10d_VAM"
BASE = f"https://erddap.incois.gov.in/erddap/griddap/{DATASET_ID}.csv"
TIME_START = "2026-07-10T00:00:00Z"
TIME_END = "2026-07-30T00:00:00Z"
DEPTH_START = 5.0
DEPTH_END = 20.0
LAT_START = 12.5
LAT_END = 13.5
LON_START = 67.5
LON_END = 69.5


def _constraints(variable: str) -> str:
    return (
        f"{variable}[(%s):1:(%s)][(%g):1:(%g)][(%g):1:(%g)][(%g):1:(%g)]"
        % (
            TIME_START,
            TIME_END,
            DEPTH_START,
            DEPTH_END,
            LAT_START,
            LAT_END,
            LON_START,
            LON_END,
        )
    )


def build_url() -> str:
    query = ",".join((_constraints("TEMP"), _constraints("SAL")))
    return BASE + "?" + quote(query, safe="[],():.-")


def _float(row: dict[str, str], key: str) -> float:
    value = float(row[key])
    if not math.isfinite(value):
        raise ValueError(f"Non-finite {key} returned by INCOIS")
    return value


def fetch(timeout: int = 60) -> dict:
    url = build_url()
    request = Request(
        url,
        headers={
            "User-Agent": "OceanTwin-SIH26067/1.0 (+https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL)",
            "Accept": "text/csv,*/*;q=0.8",
        },
    )
    with urlopen(request, timeout=timeout) as response:
        if response.status != 200:
            raise RuntimeError(f"INCOIS ERDDAP returned HTTP {response.status}")
        text = response.read().decode("utf-8")

    reader = csv.DictReader(io.StringIO(text))
    records = []
    for raw in reader:
        time_text = str(raw.get("time", "")).strip()
        # ERDDAP CSV inserts one units row directly below the header.
        if not time_text.endswith("Z"):
            continue
        timestamp = datetime.fromisoformat(time_text.replace("Z", "+00:00"))
        if timestamp.tzinfo is None:
            raise ValueError("INCOIS timestamp lacks timezone")
        record = {
            "time": timestamp.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
            "depth_m": _float(raw, "ZAX"),
            "latitude": _float(raw, "latitude"),
            "longitude": _float(raw, "longitude"),
            "temperature": _float(raw, "TEMP"),
            "salinity": _float(raw, "SAL"),
        }
        if not (-90 <= record["latitude"] <= 90 and -180 <= record["longitude"] <= 360):
            raise ValueError("INCOIS coordinate outside geographic bounds")
        if record["depth_m"] < 0:
            raise ValueError("INCOIS depth must be non-negative")
        records.append(record)

    times = sorted({row["time"] for row in records})
    depths = sorted({row["depth_m"] for row in records})
    latitudes = sorted({row["latitude"] for row in records})
    longitudes = sorted({row["longitude"] for row in records})
    if len(times) < 2:
        raise RuntimeError(f"Expected >=2 genuine INCOIS timestamps; received {len(times)}")
    if len(depths) < 2:
        raise RuntimeError(f"Expected >=2 genuine INCOIS depths; received {len(depths)}")
    if not records:
        raise RuntimeError("INCOIS subset returned no finite TEMP/SAL records")

    temp_values = [row["temperature"] for row in records]
    sal_values = [row["salinity"] for row in records]
    return {
        "schema": "oceantwin-incois-operational-v1",
        "source": {
            "provider": "INCOIS",
            "dataset_id": DATASET_ID,
            "title": "INCOIS ARGO 10 day data Variational Analysis Methodology",
            "service": "ERDDAP griddap",
            "query_url": url,
            "official_metadata": f"https://erddap.incois.gov.in/erddap/info/{DATASET_ID}/index.html",
            "conventions": ["CF-1.6", "COARDS", "ACDD-1.3"],
            "runtime_policy": "fetched and validated at build time; static at browser runtime",
        },
        "coverage": {
            "times": times,
            "depths_m": depths,
            "latitudes": latitudes,
            "longitudes": longitudes,
        },
        "variables": {
            "temperature": {
                "source_name": "TEMP",
                "units": "degs",
                "minimum": min(temp_values),
                "maximum": max(temp_values),
            },
            "salinity": {
                "source_name": "SAL",
                "units": "provider units",
                "minimum": min(sal_values),
                "maximum": max(sal_values),
            },
        },
        "records": records,
        "record_count": len(records),
        "integrity": {
            "genuine_time_count": len(times),
            "genuine_depth_count": len(depths),
            "synthetic_timestamps": False,
            "source_values_modified": False,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    payload = fetch()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(
        "Verified INCOIS operational snapshot:",
        payload["record_count"],
        "records;",
        payload["integrity"]["genuine_time_count"],
        "times;",
        payload["integrity"]["genuine_depth_count"],
        "depths",
    )


if __name__ == "__main__":
    main()
