#!/usr/bin/env bash
# Deploy safety net: when a live INCOIS / observation fetch fails during a
# Pages build, reuse the exact file from the currently deployed site. That file
# already passed the same integrity checks when it was deployed, keeps its own
# source timestamps/provenance, and is re-checked by the post-deploy live
# verification. Nothing is synthesised. A GitHub warning is emitted so the
# fallback is visible in the run summary.
#
# Usage: restore_last_deployed.sh <published/relative/path.json> <output path>
set -euo pipefail

rel="$1"
out="$2"
base="${LAST_GOOD_BASE_URL:?LAST_GOOD_BASE_URL must be set}"

echo "::warning title=Live data fetch failed::Reusing last deployed ${rel} from ${base}"
mkdir -p "$(dirname "$out")"
curl -fsSL --retry 3 --retry-delay 5 "${base%/}/${rel}" -o "$out"
python -c "import json, sys; payload = json.load(open(sys.argv[1])); assert payload, 'empty payload'" "$out"
echo "Restored ${rel} from last deployment."
