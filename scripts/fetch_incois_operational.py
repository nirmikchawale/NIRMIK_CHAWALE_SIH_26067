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
import hashlib
import json
import math
import socket
import ssl
from pathlib import Path
from urllib.parse import quote
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

DATASET_ID = "incois_argo_10d_VAM"

EXPECTED_CERT_SHA256 = "431214acb138abeb8b2a076121d973fcd459c9d044e339beb1ad0f4429b3fcac"  # Observed independently in GitHub Actions; fail closed on change.


def _peer_cert_sha256(host: str = "erddap.incois.gov.in", port: int = 443) -> str:
    """Return the leaf-certificate SHA-256 without trusting the provider chain."""
    context = ssl._create_unverified_context()
    with socket.create_connection((host, port), timeout=20) as raw:
        with context.wrap_socket(raw, server_hostname=host) as tls:
            der = tls.getpeercert(binary_form=True)
    if not der:
        raise RuntimeError("INCOIS TLS peer did not present a certificate")
    return hashlib.sha256(der).hexdigest()


def _open_request(request: Request, timeout: int):
    """Use normal CA validation; only permit provider-chain bypass with an exact pinned leaf cert."""
    try:
        return urlopen(request, timeout=timeout), True, None
    except URLError as exc:
        reason = getattr(exc, "reason", None)
        if not isinstance(reason, ssl.SSLCertVerificationError):
            raise
        fingerprint = _peer_cert_sha256()
        if not EXPECTED_CERT_SHA256:
            raise RuntimeError(
                "INCOIS TLS chain is not trusted by the runner. "
                f"Observed leaf certificate SHA-256: {fingerprint}. "
                "Pin this fingerprint explicitly before allowing a provider-specific fallback."
            ) from exc
        if fingerprint.lower() != EXPECTED_CERT_SHA256.lower():
            raise RuntimeError(
                "INCOIS TLS certificate fingerprint changed; refusing download. "
                f"expected={EXPECTED_CERT_SHA256} observed={fingerprint}"
            ) from exc
        context = ssl._create_unverified_context()
        return urlopen(request, timeout=timeout, context=context), False, fingerprint

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
    return BASE + "?" + quote(query, safe=",:.-")


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
    try:
        response_handle, transport_verified, cert_fingerprint = _open_request(request, timeout)
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"INCOIS ERDDAP rejected query with HTTP {exc.code}. URL={url} BODY={body[:2000]}"
        ) from exc
    with response_handle as response:
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
            "transport_tls_ca_verified": transport_verified,
            "transport_leaf_cert_sha256": cert_fingerprint,
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
                "units": "PSU",
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
