#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
DRY="${1:-}"
STAMP="$(date +%Y%m%d-%H%M)"
BACKUP_DIR="$ROOT/deliverables/backups"
mkdir -p "$BACKUP_DIR"

echo "▸ پروژه: $ROOT"
echo "▸ زمان: $STAMP"

echo ""
echo "▸ بررسی سلامت…"
python3 tools/check_contracts.py >/dev/null 2>&1 || { echo "✖ قرارداد شکسته"; exit 1; }
echo "  ✔ قرارداد سالم"
node --test tests/*.test.mjs >/dev/null 2>&1 || { echo "✖ تست‌ها رد"; exit 1; }
echo "  ✔ تست‌ها سبز"

SNAP="$BACKUP_DIR/snow-leopard-$STAMP.tar.gz"
echo ""
echo "▸ snapshot…"
tar -czf "$SNAP" --exclude='./node_modules' --exclude='./.git' --exclude='./deliverables/backups' \
  -C "$(dirname "$ROOT")" "$(basename "$ROOT")"
echo "  ✔ $SNAP"

if [ "$DRY" = "--dry-run" ]; then
  echo ""
  echo "▸ dry-run: کامیت انجام نشد."
  exit 0
fi

echo ""
echo "▸ گیت…"
if [ -d .git ]; then
  git add -A
  if ! git diff --cached --quiet; then
    git commit -m "chore(backup): snapshot $STAMP" || true
    echo "  ✔ کامیت"
  else
    echo "  • تغییری نبود"
  fi
  git push origin HEAD 2>/dev/null && echo "  ✔ push" || echo "  ⚠ push ناموفق"
else
  echo "  • ریپوی گیت نیست"
fi
echo ""
echo "✅ بکاپ کامل شد."
