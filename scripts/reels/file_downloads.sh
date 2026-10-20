#!/usr/bin/env bash
# Move browser downloads named sqr-reel-<code>.mp4 (from indown.js) into research/media/<code>/video.mp4,
# and candidate exports sqr-candidates-*.json into research/media/exports/.
set -euo pipefail
DL="$HOME/Downloads"; REPO="$(cd "$(dirname "$0")/../.." && pwd)"; M="$REPO/research/media"
shopt -s nullglob
for f in "$DL"/sqr-reel-*.mp4; do
  code=$(basename "$f" .mp4); code=${code#sqr-reel-}
  [[ "$code" =~ ^[A-Za-z0-9_-]+$ ]] || continue
  mkdir -p "$M/$code"; mv -f "$f" "$M/$code/video.mp4"; echo "filed $code"
done
mkdir -p "$M/exports"
for f in "$DL"/sqr-candidates-*.json; do mv -f "$f" "$M/exports/"; echo "export $(basename "$f")"; done
