#!/usr/bin/env python3
"""
Синхронизация цен из Google Sheets прайса поставщика в products.json с наценкой.

Использование:
  python3 scripts/sync_prices.py              # сухой прогон — показать изменения
  python3 scripts/sync_prices.py --apply      # применить изменения
"""

from __future__ import annotations

import csv
import io
import json
import re
import sys
import urllib.request
from pathlib import Path

SPREADSHEET_ID = "1fbsEb0koJz_kbaWIdILEtjT8r7it0ZVtNp9Zws_gnYk"

SHEETS = [
    {
        "name": "Apple(iPhone, Watch)",
        "gid": "527501254",
        "family": "iphone",
        "margin": 3000,
    },
    {
        "name": "Apple (iPad, Macbook)",
        "gid": "1040846107",
        "family": "macbook",
        "margin": 4000,
    },
]

COLOR_RU_TO_EN = {
    "небесно-голубой": "blue",
    "полночь": "midnight",
    "сияние звезды": "starlight",
    "серебристый": "silver",
    "космический черный": "black",
    "космический чёрный": "black",
    "чёрный": "black",
    "черный": "black",
    "белый": "white",
    "красный": "red",
    "зелёный": "green",
    "зеленый": "green",
    "розовый": "pink",
    "голубой": "blue",
    "фиолетовый": "purple",
    "оранжевый": "orange",
    "золотой": "gold",
}

EN_COLORS = [
    "space black", "sky blue",
    "midnight", "starlight", "silver", "blue", "black", "white",
    "gold", "pink", "purple", "green", "red", "orange", "teal",
    "ultramarine", "desert", "natural",
]

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS_JSON = ROOT / "web" / "products.json"


def fetch_csv(gid: str) -> str:
    url = (
        f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}"
        f"/export?format=csv&gid={gid}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def parse_price(raw: str) -> int | None:
    if not raw:
        return None
    cleaned = re.sub(r"[^\d]", "", raw.strip())
    return int(cleaned) if cleaned else None


# ---------------------------------------------------------------------------
# iPhone matching: normalize name, match by (name, country)
# ---------------------------------------------------------------------------

def normalize_iphone(name: str) -> str:
    n = name.strip().lower()
    n = re.sub(r"^apple\s+", "", n)
    n = re.sub(r"\s+(1sim|2sim|esim)\s*$", "", n)
    return re.sub(r"\s+", " ", n).strip()


def parse_iphone_sheet(csv_text: str) -> list[dict]:
    products = []
    for row in csv.reader(io.StringIO(csv_text)):
        if len(row) < 4:
            continue
        _sku, name, country, price_raw = row[0], row[1], row[2], row[3]
        if not name or "iphone" not in name.lower():
            continue
        price = parse_price(price_raw)
        if not price:
            continue
        products.append({
            "name": name.strip(),
            "country": country.strip(),
            "price": price,
            "key": normalize_iphone(name) + "|" + country.strip().lower(),
        })
    return products


# ---------------------------------------------------------------------------
# MacBook matching: extract specs key + SKU fallback
# ---------------------------------------------------------------------------

def extract_color(text: str) -> str:
    low = text.lower()
    for ru, en in COLOR_RU_TO_EN.items():
        if ru in low:
            return en
    for c in EN_COLORS:
        if c in low:
            return "black" if c == "space black" else ("blue" if c == "sky blue" else c)
    return ""


def extract_sku_from_name(name: str) -> str:
    """Try to find Apple SKU code at end of name (e.g. MDE04, Z1H8000GS)."""
    m = re.search(r"\b([A-Z0-9]{4,12})\s*$", name.strip())
    if m:
        candidate = m.group(1)
        if re.match(r"^[A-Z][A-Z0-9]{3,11}$", candidate) and not candidate.isdigit():
            return candidate.upper()
    return ""


def extract_macbook_specs(name: str, details: str = "") -> dict | None:
    low = name.lower().replace("м", "m")  # Russian М → English M
    if "macbook" not in low:
        return None

    model_type = "pro" if "pro" in low.split("macbook")[1].split()[0:2] else "air"
    if "macbook pro" in low:
        model_type = "pro"

    size_m = re.search(r"(?:macbook\s+(?:air|pro)\s+)(\d{2})", low)
    size = size_m.group(1) if size_m else ""

    chip_m = re.search(r"\bm(\d)\b", low)
    chip = chip_m.group(1) if chip_m else ""

    chip_tier = ""
    if chip_m:
        after_chip = low[chip_m.end():]
        if re.match(r"\s+max\b", after_chip):
            chip_tier = "max"
        elif re.match(r"\s+pro\b", after_chip):
            chip_tier = "pro"

    ram, storage = "", ""

    # Format: "16/256" or "16/512" or "16/1TB" or "24/1tb"
    spec1 = re.search(r"\b(\d{1,2})/(\d+(?:tb)?)\b", low)
    if spec1:
        ram = spec1.group(1)
        storage = spec1.group(2).lower().replace("gb", "")
    else:
        # Format: "(10CPU/8GPU/16GB/256GB)" or "(M4 10-Core, GPU 10-Core, 16GB, 256GB)"
        spec2 = re.search(r"(\d{1,2})gb[,/)\s]+(\d+)(?:gb|tb)", low)
        if spec2:
            ram = spec2.group(1)
            s_val = spec2.group(2)
            after = low[spec2.end()-2:spec2.end()+1]
            storage = f"{s_val}tb" if "tb" in after else s_val
        else:
            # Format: "16GB 1TB"
            spec3 = re.search(r"(\d{1,2})\s*gb\s+(\d+)\s*tb", low)
            if spec3:
                ram = spec3.group(1)
                storage = f"{spec3.group(2)}tb"

    if not ram or not storage:
        return None

    color = extract_color(details) if details else ""
    if not color:
        color = extract_color(name)

    sku = extract_sku_from_name(name)

    return {
        "type": model_type,
        "size": size,
        "chip": chip,
        "tier": chip_tier,
        "ram": ram,
        "storage": storage,
        "color": color,
        "sku": sku,
    }


def macbook_spec_key(specs: dict) -> str:
    return (
        f"{specs['type']}|{specs['size']}|m{specs['chip']}|{specs['tier']}|"
        f"{specs['ram']}|{specs['storage']}|{specs['color']}"
    )


def parse_macbook_sheet(csv_text: str) -> list[dict]:
    products = []
    for row in csv.reader(io.StringIO(csv_text)):
        if len(row) < 3:
            continue
        name, details, price_raw = row[0], row[1], row[2]
        if not name or "macbook" not in name.lower():
            continue
        price = parse_price(price_raw)
        if not price:
            continue
        specs = extract_macbook_specs(name, details)
        if not specs:
            continue
        products.append({
            "name": name.strip(),
            "details": details.strip(),
            "price": price,
            "specs": specs,
            "spec_key": macbook_spec_key(specs),
        })
    return products


def catalog_macbook_specs(product: dict) -> dict | None:
    """Extract specs from catalog product name like 'Apple MacBook Air 13 M4 16/256 Silver'."""
    name = product["name"]
    low = name.lower()
    if "macbook" not in low:
        return None

    model_type = "pro" if "macbook pro" in low else "air"

    size_m = re.search(r"macbook\s+(?:air|pro)\s+(\d{2})", low)
    size = size_m.group(1) if size_m else ""

    chip_m = re.search(r"\bm(\d)\b", low)
    chip = chip_m.group(1) if chip_m else ""

    chip_tier = ""
    if chip_m:
        after = low[chip_m.end():]
        if re.match(r"\s+max\b", after):
            chip_tier = "max"
        elif re.match(r"\s+pro\b", after):
            chip_tier = "pro"

    spec_m = re.search(r"\b(\d{1,2})/(\d+(?:tb)?)\b", low)
    if not spec_m:
        return None
    ram = spec_m.group(1)
    storage = spec_m.group(2).lower().replace("gb", "")

    rest = low[spec_m.end():].strip()
    color = ""
    for c in EN_COLORS:
        if c in rest:
            color = "black" if c == "space black" else ("blue" if c == "sky blue" else c)
            break

    sku = product.get("sku", "").strip().upper()

    return {
        "type": model_type, "size": size, "chip": chip, "tier": chip_tier,
        "ram": ram, "storage": storage, "color": color, "sku": sku,
    }


# ---------------------------------------------------------------------------
# Matching & update logic
# ---------------------------------------------------------------------------

def find_updates(catalog: list[dict], sheet_products: list, family: str, margin: int) -> list[dict]:
    updates = []
    cat_items = [(i, p) for i, p in enumerate(catalog) if p.get("family") == family]

    if family == "iphone":
        sheet_by_key = {}
        for sp in sheet_products:
            sheet_by_key.setdefault(sp["key"], sp)

        for idx, prod in cat_items:
            key = normalize_iphone(prod["name"]) + "|" + prod.get("country", "").lower()
            sp = sheet_by_key.get(key)
            if not sp:
                continue
            new_price = sp["price"] + margin
            if prod["price"] != new_price:
                updates.append({
                    "index": idx,
                    "name": prod["name"],
                    "country": prod.get("country", ""),
                    "old_price": prod["price"],
                    "supplier_price": sp["price"],
                    "new_price": new_price,
                })

    elif family == "macbook":
        sheet_by_sku: dict[str, dict] = {}
        sheet_by_spec: dict[str, dict] = {}
        for sp in sheet_products:
            if sp["specs"]["sku"]:
                sheet_by_sku[sp["specs"]["sku"]] = sp
            sheet_by_spec.setdefault(sp["spec_key"], sp)

        for idx, prod in cat_items:
            cat_specs = catalog_macbook_specs(prod)
            if not cat_specs:
                continue

            sp = None
            if cat_specs["sku"] and cat_specs["sku"] in sheet_by_sku:
                candidate = sheet_by_sku[cat_specs["sku"]]
                if candidate["specs"]["chip"] == cat_specs["chip"]:
                    sp = candidate
            if not sp:
                cat_key = macbook_spec_key(cat_specs)
                sp = sheet_by_spec.get(cat_key)

            if not sp:
                continue
            new_price = sp["price"] + margin
            if prod["price"] != new_price:
                updates.append({
                    "index": idx,
                    "name": prod["name"],
                    "country": prod.get("country", ""),
                    "old_price": prod["price"],
                    "supplier_price": sp["price"],
                    "new_price": new_price,
                    "matched_sheet": sp["name"],
                })

    return updates


def main():
    apply = "--apply" in sys.argv

    with open(PRODUCTS_JSON, encoding="utf-8") as f:
        catalog = json.load(f)

    all_updates = []

    for cfg in SHEETS:
        family = cfg["family"]
        print(f"\n  Загрузка: {cfg['name']} ...")
        csv_text = fetch_csv(cfg["gid"])

        if family == "iphone":
            sheet_products = parse_iphone_sheet(csv_text)
        elif family == "macbook":
            sheet_products = parse_macbook_sheet(csv_text)
        else:
            continue

        cat_count = sum(1 for p in catalog if p.get("family") == family)
        print(f"   Товаров в прайсе: {len(sheet_products)}")

        updates = find_updates(catalog, sheet_products, family, cfg["margin"])
        all_updates.extend(updates)

        matched_total = 0
        if family == "iphone":
            sheet_keys = {sp["key"] for sp in sheet_products}
            matched_total = sum(
                1 for p in catalog if p.get("family") == family
                and (normalize_iphone(p["name"]) + "|" + p.get("country", "").lower()) in sheet_keys
            )
        elif family == "macbook":
            sheet_by_sku = {sp["specs"]["sku"]: sp for sp in sheet_products if sp["specs"]["sku"]}
            sheet_by_spec = {sp["spec_key"]: sp for sp in sheet_products}
            matched_total = 0
            for p in catalog:
                if p.get("family") != family:
                    continue
                cs = catalog_macbook_specs(p)
                if not cs:
                    continue
                sku_ok = (
                    cs["sku"] and cs["sku"] in sheet_by_sku
                    and sheet_by_sku[cs["sku"]]["specs"]["chip"] == cs["chip"]
                )
                if sku_ok or macbook_spec_key(cs) in sheet_by_spec:
                    matched_total += 1

        print(f"   В каталоге: {cat_count}, сопоставлено: {matched_total}, изменений цены: {len(updates)}")

    if not all_updates:
        print("\n  Цены актуальны, изменений нет.")
        return

    print(f"\n{'=' * 70}")
    print(f"  Изменения ({len(all_updates)} товаров):")
    print(f"{'=' * 70}")

    for u in all_updates:
        diff = u["new_price"] - u["old_price"]
        sign = "+" if diff > 0 else ""
        country = f" [{u['country']}]" if u.get("country") else ""
        print(f"  {u['name']}{country}")
        print(f"    {u['old_price']} -> {u['new_price']}  (поставщик: {u['supplier_price']} + маржа = {u['new_price']}, {sign}{diff})")
        if "matched_sheet" in u:
            print(f"    <- прайс: {u['matched_sheet']}")

    if apply:
        for u in all_updates:
            catalog[u["index"]]["price"] = u["new_price"]

        with open(PRODUCTS_JSON, "w", encoding="utf-8") as f:
            json.dump(catalog, f, ensure_ascii=False, indent=2)

        print(f"\n  Обновлено {len(all_updates)} цен -> {PRODUCTS_JSON.name}")
    else:
        print(f"\n  Это сухой прогон. Для применения: python3 scripts/sync_prices.py --apply")


if __name__ == "__main__":
    main()
