"""Verify real INCOIS OPeNDAP DAP2 metadata endpoints used by OceanTwin.

This is a fail-closed build-time interoperability check. It does not claim that INCOIS
provides WCS. It verifies the DAP2 DDS/DAS documents for the registered physical and
chlorophyll datasets and records hashes/provenance for the public static build.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import socket
import ssl
from urllib.error import URLError
from urllib.request import Request, urlopen

HOST = "erddap.incois.gov.in"
EXPECTED_CERT_SHA256 = "431214acb138abeb8b2a076121d973fcd459c9d044e339beb1ad0f4429b3fcac"
DATASETS = {
    "incois_argo_10d_VAM": {
        "expected_dds_tokens": ["TEMP", "SAL", "time", "ZAX", "latitude", "longitude"],
        "expected_das_tokens": ["Conventions", "INCOIS"],
    },
    "IRS_chlorophyll_datasets": {
        "expected_dds_tokens": ["CHLOROPHYLL", "time", "latitude", "longitude"],
        "expected_das_tokens": ["Conventions", "CF-1.6", "INCOIS"],
    },
}


def _peer_cert_sha256(host: str = HOST, port: int = 443) -> str:
    context = ssl._create_unverified_context()
    with socket.create_connection((host, port), timeout=20) as raw:
        with context.wrap_socket(raw, server_hostname=host) as tls:
            der = tls.getpeercert(binary_form=True)
    if not der:
        raise RuntimeError("INCOIS TLS peer did not present a certificate")
    return hashlib.sha256(der).hexdigest()


def _open(request: Request, timeout: int = 45):
    try:
        return urlopen(request, timeout=timeout), True, None
    except URLError as exc:
        reason = getattr(exc, "reason", None)
        if not isinstance(reason, ssl.SSLCertVerificationError):
            raise
        fingerprint = _peer_cert_sha256()
        if fingerprint.lower() != EXPECTED_CERT_SHA256.lower():
            raise RuntimeError(
                "INCOIS TLS certificate fingerprint changed; refusing OPeNDAP verification. "
                f"expected={EXPECTED_CERT_SHA256} observed={fingerprint}"
            ) from exc
        context = ssl._create_unverified_context()
        return urlopen(request, timeout=timeout, context=context), False, fingerprint


def _fetch_text(url: str) -> tuple[str, bool, str | None]:
    request = Request(
        url,
        headers={
            "User-Agent": "OceanTwin-SIH26067/1.0 (+https://github.com/nirmikchawale/NIRMIK_CHAWALE_SIH_PERSONAL)",
            "Accept": "text/plain,*/*;q=0.8",
        },
    )
    handle, verified, fingerprint = _open(request)
    with handle as response:
        if response.status != 200:
            raise RuntimeError(f"OPeNDAP endpoint returned HTTP {response.status}: {url}")
        return response.read().decode("utf-8", errors="strict"), verified, fingerprint


def verify() -> dict:
    sources = []
    for dataset_id, rules in DATASETS.items():
        base = f"https://{HOST}/erddap/griddap/{dataset_id}"
        dds_url = base + ".dds"
        das_url = base + ".das"
        dds, dds_tls_verified, dds_fingerprint = _fetch_text(dds_url)
        das, das_tls_verified, das_fingerprint = _fetch_text(das_url)

        if "Dataset {" not in dds:
            raise RuntimeError(f"{dataset_id} DDS is not a DAP2 Dataset document")
        for token in rules["expected_dds_tokens"]:
            if token not in dds:
                raise RuntimeError(f"{dataset_id} DDS missing expected token {token!r}")
        for token in rules["expected_das_tokens"]:
            if token not in das:
                raise RuntimeError(f"{dataset_id} DAS missing expected token {token!r}")

        sources.append(
            {
                "provider": "INCOIS",
                "dataset_id": dataset_id,
                "protocol": "OPeNDAP DAP2",
                "dds_url": dds_url,
                "das_url": das_url,
                "dds_sha256": hashlib.sha256(dds.encode("utf-8")).hexdigest(),
                "das_sha256": hashlib.sha256(das.encode("utf-8")).hexdigest(),
                "expected_dds_tokens": rules["expected_dds_tokens"],
                "expected_das_tokens": rules["expected_das_tokens"],
                "transport_tls_ca_verified": dds_tls_verified and das_tls_verified,
                "transport_leaf_cert_sha256": dds_fingerprint or das_fingerprint,
            }
        )

    return {
        "schema": "oceantwin-opendap-verification-v1",
        "verified_utc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "protocol": "OPeNDAP DAP2",
        "provider": "INCOIS",
        "sources": sources,
        "integrity": {
            "real_network_endpoints_checked": True,
            "placeholder_endpoints": False,
            "dataset_count": len(sources),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    payload = verify()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print("Verified INCOIS OPeNDAP DAP2:", ", ".join(item["dataset_id"] for item in payload["sources"]))


if __name__ == "__main__":
    main()
