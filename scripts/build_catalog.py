#!/usr/bin/env python3
"""Читает Excel и пишет web/products.json для мини-приложения."""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
DEFAULT_XLSX = "/Users/user/Desktop/Apple(IPhone, Watch).xlsx"


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
    current_category = None
    products = []
    for r in range(1, max_row + 1):
        d = rows.get(r, {})
        a, b, c_, d_ = d.get("A"), d.get("B"), d.get("C"), d.get("D")
        if r <= 3:
            continue
        if b and isinstance(b, str) and b.strip().endswith(":") and not a:
            current_category = b.strip().rstrip(":").strip()
            continue
        if b and d_ is not None:
            try:
                price = int(float(d_))
            except (TypeError, ValueError):
                continue
            sku = str(a).strip() if a else ""
            products.append(
                {
                    "id": f"{sku or 'n'}-{r}",
                    "category": current_category or "Прочее",
                    "sku": sku,
                    "name": str(b).strip(),
                    "country": str(c_).strip() if c_ else "",
                    "price": price,
                }
            )
    return products


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_XLSX
    out = sys.argv[2] if len(sys.argv) > 2 else "web/products.json"
    products = parse_products(path)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    print(f"OK: {len(products)} товаров -> {out}")


if __name__ == "__main__":
    main()
