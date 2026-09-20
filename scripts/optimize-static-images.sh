#!/usr/bin/env bash
set -euo pipefail

target_dir="${1:-dist/illustrations/services}"
max_bytes="${HERO_JPEG_MAX_BYTES:-163840}"

if [ ! -d "${target_dir}" ]; then
  echo "[image-opt] No hero directory at ${target_dir}; skipping."
  exit 0
fi

if ! command -v jpegoptim >/dev/null 2>&1; then
  echo "[image-opt] jpegoptim is required."
  exit 1
fi

found=0
failed=0

while IFS= read -r -d '' file; do
  found=1
  before="$(stat -c%s "${file}")"
  jpegoptim --strip-all --all-progressive --max=80 --quiet "${file}"
  after="$(stat -c%s "${file}")"
  printf '[image-opt] %s: %.1f KB -> %.1f KB\n'     "$(basename "${file}")"     "$((before / 1024))"     "$((after / 1024))"

  if [ "${after}" -gt "${max_bytes}" ]; then
    echo "[image-opt] ERROR: $(basename "${file}") exceeds deployed hero ceiling of $((max_bytes / 1024)) KB."
    failed=1
  fi
done < <(find "${target_dir}" -maxdepth 1 -type f -iname '*.jpg' -print0 | sort -z)

if [ "${found}" -eq 0 ]; then
  echo "[image-opt] No JPEG hero assets found."
fi

if [ "${failed}" -ne 0 ]; then
  exit 1
fi

echo "[image-opt] PASS"
