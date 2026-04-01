#!/usr/bin/env bash
# Обновление каталога из Google Sheets.
# Запуск: crontab -e → 0 * * * * /path/to/Shop/scripts/cron_update.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"
PRODUCTS="$ROOT/web/products.json"
LOG="$ROOT/logs/update.log"

mkdir -p "$ROOT/logs"

ts() { date '+%Y-%m-%d %H:%M:%S'; }

{
  echo "--- $(ts) начало обновления ---"

  cp "$PRODUCTS" "$PRODUCTS.bak" 2>/dev/null || true

  python3 "$SCRIPT_DIR/import_catalog.py" --apply --quiet 2>&1

  if cmp -s "$PRODUCTS" "$PRODUCTS.bak"; then
    echo "$(ts) цены не изменились"
  else
    OLD=$(python3 -c "import json; print(len(json.load(open('$PRODUCTS.bak'))))" 2>/dev/null || echo "?")
    NEW=$(python3 -c "import json; print(len(json.load(open('$PRODUCTS'))))" 2>/dev/null || echo "?")
    echo "$(ts) ОБНОВЛЕНО: $OLD → $NEW товаров"
  fi

  rm -f "$PRODUCTS.bak"
  echo "--- $(ts) готово ---"
  echo ""
} >> "$LOG" 2>&1
