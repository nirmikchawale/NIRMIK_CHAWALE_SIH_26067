"""Fetch a bounded, genuine INCOIS ocean-colour chlorophyll subset for OceanTwin.

The source is the official INCOIS ERDDAP IRS P4 OCM chlorophyll grid. This is a
surface satellite product: no depth coordinate is invented. Several genuine source
timestamps are retained when finite data are available, allowing honest time browsing
on the geographic view while Water Column 3D remains disabled for this source.
"""
from __future__ import annotations

import argparse
import csv
from datetime import datetime, timezone
import hashlib
import io
import json
import math
from pathlib import Path
import socket
import ssl
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

DATASET_ID = "IRS_chlorophyll_datasets"
BASE = f"https://erddap.incois.gov.in/erddap/griddap/{DATASET_ID}.csv"
EXPECTED_CERT_SHA256 = "431214acb138abeb8b2a076121d973fcd459c9d044e339beb1ad0f4429b3fcac"

# Use the final seven genuine source timesteps (dataset has 97 time coordinates).
# Spatial bounds overlap OceanTwin's Indian Ocean study area; strides keep the
# static payload compact without altering retained provider values.
TIME_START_INDEX = 90
TIME_END_INDEX = 96
LAT_START = 12.0
LAT_END = 14.0
LAT_STRIDE = 20
LON_START = 67.0
LON_END = 70.0
LON_STRIDE = 20


def _peer_cert_sha256(host: str = "erddap.incois.gov.in", port: int = 443) -> str:
    context = ssl._create_unverified_context()
    with socket.create_connection((host, port), timeout=20) as raw:
        with context.wrap_socket(raw, server_hostname=host) as tls:
            der = tls.getpeercert(binary_form=True)
    if not der:
        raise RuntimeError("INCOIS TLS peer did not present a certificate")
    return hashlib.sha256(der).hexdigest()


def _open_request(request: Request, timeout: int):
    try:
        return urlopen(request, timeout=timeout), True, None
    except URLError as exc:
        reason = getattr(exc, "reason", None)
        if not isinstance(reason, ssl.SSLCertVerificationError):
            raise
        fingerprint = _peer_cert_sha256()
        if fingerprint.lower() != EXPECTED_CERT_SHA256.lower():
            raise RuntimeError(
                "INCOIS TLS certificate fingerprint changed; refusing chlorophyll download. "
                f"expected={EXPECTED_CERT_SHA256} observed={fingerprint}"
            ) from exc
        context = ssl._create_unverified_context()
        return urlopen(request, timeout=timeout, context=context), False, fingerprint


def build_url() -> str:
    query = (
        f"CHLOROPHYLL[{TIME_START_INDEX}:1:{TIME_END_INDEX}]"
        f"[({LAT_START:g}):{LAT_STRIDE}:({LAT_END:g})]"
        f"[({LON_START:g}):{LON_STRIDE}:({LON_END:g})]"
    )
    return BASE + "?" + quote(query, safe=",:.-")


def _finite(text: str | None) -> float | None:
    try:
        value = float(str(text).strip())
    except (TypeError, ValueError):
        return None
    return value if math.isfinite(value) else None


def fetch(timeout: int = 90) -> dict:
    url = build_url()
    request = Request(
        url,
        headers={
            "User-Agent": "OceanTwin-SIH26067/1.0 (+https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL)",
            "Accept": "text/csv,*/*;q=0.8",
        },
    )
    try:
        response_handle, transport_verified, cert_fingerprint = _open_request(request, timeout)
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"INCOIS chlorophyll query failed with HTTP {exc.code}. URL={url} BODY={body[:2000]}"
        ) from exc

    with response_handle as response:
        if response.status != 200:
            raise RuntimeError(f"INCOIS chlorophyll ERDDAP returned HTTP {response.status}")
        text = response.read().decode("utf-8")

    records: list[dict] = []
    reader = csv.DictReader(io.StringIO(text))
    for raw in reader:
        time_text = str(raw.get("time", "")).strip()
        if not time_text.endswith("Z"):
            # ERDDAP CSV contains a units row directly below the header.
            continue
        value = _finite(raw.get("CHLOROPHYLL"))
        latitude = _finite(raw.get("latitude"))
        longitude = _finite(raw.get("longitude"))
        if value is None or latitude is None or longitude is None:
            continue
        if value < 0:
            continue
        timestamp = datetime.fromisoformat(time_text.replace("Z", "+00:00"))
        if timestamp.tzinfo is None:
            raise ValueError("INCOIS chlorophyll timestamp lacks timezone")
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 360):
            raise ValueError("INCOIS chlorophyll coordinate outside geographic bounds")
        records.append(
            {
                "time": timestamp.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
                "latitude": latitude,
                "longitude": longitude,
                "chlorophyll_mg_m3": value,
            }
        )

    if not records:
        raise RuntimeError("INCOIS chlorophyll subset returned no finite provider values")

    times = sorted({row["time"] for row in records})
    if len(times) < 2:
        raise RuntimeError(
            f"Expected at least two genuine INCOIS chlorophyll timestamps; received {len(times)}"
        )

    latitudes = sorted({row["latitude"] for row in records})
    longitudes = sorted({row["longitude"] for row in records})
    values = [row["chlorophyll_mg_m3"] for row in records]

    return {
        "schema": "oceantwin-incois-chlorophyll-v1",
        "source": {
            "provider": "INCOIS",
            "dataset_id": DATASET_ID,
            "title": "IRS P4 OCM-Chlorophyll",
            "service": "ERDDAP griddap",
            "query_url": url,
            "official_metadata": f"https://erddap.incois.gov.in/erddap/info/{DATASET_ID}/index.html",
            "conventions": ["CF-1.6", "COARDS", "ACDD-1.3"],
            "runtime_policy": "fetched and validated at build time; static at browser runtime",
            "transport_tls_ca_verified": transport_verified,
            "transport_leaf_cert_sha256": cert_fingerprint,
        },
        "coverage": {
            "times": times,
            "latitudes": latitudes,
            "longitudes": longitudes,
            "surface_only": True,
        },
        "variable": {
            "source_name": "CHLOROPHYLL",
            "label": "Chlorophyll-a",
            "standard_name": "concentration_of_chlorophyll_in_sea_water",
            "units": "mg/m^3",
            "minimum": min(values),
            "maximum": max(values),
        },
        "records": records,
        "record_count": len(records),
        "integrity": {
            "genuine_time_count": len(times),
            "surface_only": True,
            "synthetic_timestamps": False,
            "synthetic_depths": False,
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
        "Verified INCOIS chlorophyll snapshot:",
        payload["record_count"],
        "records;",
        payload["integrity"]["genuine_time_count"],
        "genuine times;",
        payload["variable"]["minimum"],
        "to",
        payload["variable"]["maximum"],
        payload["variable"]["units"],
    )


if __name__ == "__main__":
    main()
