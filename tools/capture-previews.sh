#!/bin/bash
# Seraphic Styler — regenerate the directory's hover-preview screenshots.
# Shoots every house with a `w:` website in js/directory-data.js using local
# headless Chrome and compresses to JPEG in previews/. The popup (fd-atelier.js)
# prefers these files — no third party, no rate limit. Rerun monthly, or after a
# shop redesigns. Incremental: existing previews/<slug>.jpg are skipped, so a
# killed run just resumes. One slow site can't stall the batch (hard timeout).
# Usage: bash tools/capture-previews.sh          (add --force to reshoot all)
set -u
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PER_SITE=35            # hard seconds per site before we give up and move on
mkdir -p previews
FORCE="${1:-}"

shoot() {
  local slug="$1" url="$2" out="previews/$slug.png" prof
  prof="$(mktemp -d)"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-first-run \
    --user-data-dir="$prof" --window-size=460,760 --virtual-time-budget=12000 \
    --screenshot="$out" "$url" >/dev/null 2>&1 &
  local pid=$!
  local n=0
  while kill -0 "$pid" 2>/dev/null; do
    sleep 1; n=$((n+1))
    if [ "$n" -ge "$PER_SITE" ]; then kill -9 "$pid" 2>/dev/null; break; fi
  done
  wait "$pid" 2>/dev/null
  rm -rf "$prof"
  if [ -s "$out" ]; then
    sips -s format jpeg -s formatOptions 72 "$out" --out "previews/$slug.jpg" >/dev/null 2>&1 && rm -f "$out"
    return 0
  fi
  rm -f "$out"; return 1
}

ok=0; skip=0; fail=0
while IFS=$'\t' read -r slug url; do
  [ -z "$slug" ] && continue
  if [ "$FORCE" != "--force" ] && [ -s "previews/$slug.jpg" ]; then
    echo "· skip $slug (already shot)"; skip=$((skip+1)); continue
  fi
  printf '→ %-26s %s\n' "$slug" "$url"
  if shoot "$slug" "$url"; then echo "  ✓ previews/$slug.jpg"; ok=$((ok+1))
  else echo "  ✗ failed — popup falls back to thum.io for this house"; fail=$((fail+1)); fi
done < <(node -e '
global.window={};eval(require("fs").readFileSync("js/directory-data.js","utf8"));
window.SS_DIRECTORY.filter(b=>b.w).forEach(b=>{
  const id=(b.h||b.n).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  console.log(id+"\t"+b.w);
});')

echo "----"
echo "shot $ok · skipped $skip · failed $fail · total on disk $(ls previews/*.jpg 2>/dev/null | wc -l | tr -d ' ')"
