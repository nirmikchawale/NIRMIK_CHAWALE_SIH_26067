# Repository scope

This repository intentionally contains the complete local MVP needed to run and verify the SIH26067 OceanTwin 3D demonstration.

Included:
- Streamlit/Plotly application source
- tests and GitHub Actions test workflow
- documentation and SIH demo runbook
- the small verified Copernicus subset required for offline runtime
- processed Argo/model comparison evidence and provenance
- generated scientific comparison figures
- original comparison/verification scripts retained for reproducibility

Intentionally excluded:
- virtual environments and Python caches
- credentials, `.env` files, and Streamlit secrets
- machine-specific Cowork/Codex request-history files
- large provider web-page/reference snapshots not needed to run or audit the MVP
- full/raw global scientific archives
- presentation screenshots

Do not add salinity/current/glider/bilinear/cloud/ML functionality to the final judging branch unless it is separately verified and explicitly approved.
