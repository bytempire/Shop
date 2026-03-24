#!/usr/bin/env python3
"""Опциональный импорт каталога из .xlsx в web/products.json.

Основной источник данных для мини-приложения — файл web/products.json
(редактирование вручную или любой другой способ). Скрипт нужен только
если снова выгружаете прайс из Excel в том же формате, что раньше.
"""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path
from typing import Optional, Tuple

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def col_row(ref: str):
    m = re.match(r"^([A-Z]+)(\d+)$", ref)
    return m.group(1), int(m.group(2))


def load_strings(z: zipfile.ZipFile) -> list:
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    out = []
    for si in root.findall(".//m:si", NS):
        t = si.find("m:t", NS)
        if t is not None and t.text:
            out.append(t.text)
        else:
            parts = [x.text or "" for x in si.findall(".//m:t", NS)]
            out.append("".join(parts))
    return out


def classify(name: str) -> Optional[Tuple[str, str, str]]:
    """(brand, family, category_label) или None — строка не товар каталога."""
    n = name.lower()
    if "iphone" in n:
        return "apple", "iphone", "iPhone"
    if "watch" in n or "apple watch" in n:
        return "apple", "apple_watch", "Watch"
    if "samsung" in n or "galaxy" in n:
        if "watch" in n or "gear s" in n:
            return "samsung", "samsung_watch", "Galaxy Watch"
        return "samsung", "samsung_phone", "Galaxy"
    return None


def parse_products(xlsx_path: str) -> list:
    z = zipfile.ZipFile(xlsx_path)
    strings = load_strings(z)
    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows: dict = defaultdict(dict)
    for c in sheet.findall(".//m:c", NS):
        ref = c.get("r")
        if not ref:
            continue
        col, row = col_row(ref)
        t = c.get("t")
        v_el = c.find("m:v", NS)
        if v_el is None:
            continue
        val = v_el.text
        if t == "s":
            val = strings[int(val)] if val else ""
        else:
            try:
                val = int(val) if val.isdigit() else float(val)
            except (ValueError, AttributeError):
                pass
        rows[row][col] = val
    z.close()

    max_row = max(rows) if rows else 0
    products = []
    for r in range(1, max_row + 1):
        d = rows.get(r, {})
        a, b, c_, d_ = d.get("A"), d.get("B"), d.get("C"), d.get("D")
        if r <= 3:
            continue
        if b and isinstance(b, str) and b.strip().endswith(":") and not a:
            continue
        if b and d_ is not None:
            try:
                price = int(float(d_))
            except (TypeError, ValueError):
                continue
            sku = str(a).strip() if a else ""
            name = str(b).strip()
            kind = classify(name)
            if not kind:
                continue
            brand, family, cat_label = kind
            row = {
                "id": f"{sku or 'n'}-{r}",
                "brand": brand,
                "family": family,
                "category": cat_label,
                "sku": sku,
                "name": name,
                "country": str(c_).strip() if c_ else "",
                "price": price,
            }
            if "iPhone 13" in name and "iPhone 13 Pro" not in name:
                row["image"] = "images/iphone13.png"
            products.append(row)
    return products


def main():
    if len(sys.argv) < 2:
        print(
            "Импорт из Excel (по желанию):\n"
            "  python3 scripts/build_catalog.py <прайс.xlsx> [web/products.json]\n\n"
            "Пишет web/products.json и web/catalog-data.js (данные для мини-приложения).",
            file=sys.stderr,
        )
        sys.exit(1)
    path = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else "web/products.json"
    products = parse_products(path)
    out_p = Path(out)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    with open(out_p, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    js_p = out_p.with_name("catalog-data.js")
    with open(js_p, "w", encoding="utf-8") as f:
        f.write("window.__SHOP_CATALOG__ = ")
        json.dump(products, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print(f"OK: {len(products)} товаров -> {out_p} и {js_p}")


if __name__ == "__main__":
    main()
