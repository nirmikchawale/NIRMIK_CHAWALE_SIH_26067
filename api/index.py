"""Vercel entrypoint for OceanTwin's checksum-verified hosted scientific API.

Local/offline execution continues to use the repository's bundled evidence directly.
Only a hosted environment that does not contain those binary/scientific files stages
the exact immutable evidence snapshot into /tmp before importing the canonical API.
"""
from __future__ import annotations

import hashlib
import os
from pathlib import Path
import shutil
import sys
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

EVIDENCE_COMMIT = "17c9e7e7460b8f2b59172b38427b905229059517"
REPOSITORY = "nirmikchawale/NIRMIK_CHAWALE_SIH_26067"
RAW_BASE = f"https://raw.githubusercontent.com/{REPOSITORY}/{EVIDENCE_COMMIT}"
MODEL_NAME = "glorys12_20240102_67E70E_12N14N_0m500m.nc"
MODEL_SHA256 = "b306ae1e4e13595688e994456e90e1ea59d4b76f3d1326e86710cf33efcf72c1"

COMPARISON_FILES = (
    "comparison_config.json",
    "comparison_provenance.json",
    "profile_5907092_cycle012_A_summary.json",
    "profile_5907092_cycle012_A_level_comparison.csv",
    "profile_5907092_cycle013_D_summary.json",
    "profile_5907092_cycle013_D_level_comparison.csv",
)
OPTIONAL_METADATA = (
    "source_metadata/argo_argo_summary.json",
    "source_metadata/model_inspection.json",
    "source_metadata/model_provenance.json",
    "source_metadata/argo_manifest.json",
)


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _download(relative_path: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(
        f"{RAW_BASE}/{relative_path}",
        headers={"User-Agent": "OceanTwin-SIH26067/1.0"},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        with tempfile.NamedTemporaryFile(
            dir=destination.parent, delete=False, suffix=".part"
        ) as temp_handle:
            shutil.copyfileobj(response, temp_handle)
            temp_path = Path(temp_handle.name)
    temp_path.replace(destination)


def _stage_hosted_evidence() -> None:
    local_model = ROOT / "data" / MODEL_NAME
    local_comparison = ROOT / "data" / "comparison"

    # Local and CI environments retain the original fully offline behavior.
    if local_model.is_file() and local_comparison.is_dir():
        return

    stage_root = Path("/tmp/oceantwin-evidence")
    model_path = stage_root / MODEL_NAME
    comparison_dir = stage_root / "comparison"

    if not model_path.is_file() or _sha256(model_path) != MODEL_SHA256:
        _download(f"data/{MODEL_NAME}", model_path)

    actual_sha = _sha256(model_path)
    if actual_sha != MODEL_SHA256:
        model_path.unlink(missing_ok=True)
        raise RuntimeError(
            "Hosted model checksum verification failed: "
            f"expected {MODEL_SHA256}, received {actual_sha}."
        )

    for relative in COMPARISON_FILES:
        destination = comparison_dir / relative
        if not destination.is_file():
            _download(f"data/comparison/{relative}", destination)

    # These enrich the provenance drawer but are not required for core science.
    for relative in OPTIONAL_METADATA:
        destination = comparison_dir / relative
        if destination.is_file():
            continue
        try:
            _download(f"data/comparison/{relative}", destination)
        except Exception:
            # Optional metadata must never take down the hosted scientific API.
            pass

    os.environ["OCEANTWIN_MODEL_FILE"] = str(model_path)
    os.environ["OCEANTWIN_COMPARISON_DIR"] = str(comparison_dir)
    os.environ["OCEANTWIN_RUNTIME_MODE"] = "hosted_checksum_verified_staging"
    os.environ["OCEANTWIN_SCIENCE_NETWORK_REQUIRED"] = "true"


try:
    _stage_hosted_evidence()
    from backend.app.main import app
except Exception as bootstrap_error:
    from fastapi import FastAPI, HTTPException

    app = FastAPI(
        title="OceanTwin 3D API · degraded bootstrap",
        version="1.0.0-mvp",
    )
    _error_message = str(bootstrap_error)

    @app.get("/api/health")
    def degraded_health():
        raise HTTPException(
            status_code=503,
            detail={
                "status": "degraded",
                "reason": "Hosted scientific evidence staging failed.",
                "message": _error_message,
                "evidence_commit": EVIDENCE_COMMIT,
            },
        )

    @app.get("/api/{path:path}")
    def degraded_api(path: str):
        raise HTTPException(
            status_code=503,
            detail={
                "status": "degraded",
                "reason": "Scientific API unavailable until verified evidence can be staged.",
                "path": path,
            },
        )
