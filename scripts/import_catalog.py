#!/usr/bin/env python3
"""
Полный импорт каталога из Google Sheets прайса поставщика.
Заменяет products.json и catalog-data.js целиком.

  python3 scripts/import_catalog.py              # сухой прогон
  python3 scripts/import_catalog.py --apply      # применить
"""
from __future__ import annotations

import csv
import io
import json
import re
import sys
import urllib.request
import urllib.parse
from pathlib import Path

SPREADSHEET_ID = "1fbsEb0koJz_kbaWIdILEtjT8r7it0ZVtNp9Zws_gnYk"
ROOT = Path(__file__).resolve().parent.parent
PRODUCTS_JSON = ROOT / "web" / "products.json"

MARGINS = {
    "iphone": 3000,
    "macbook": 4000,
}

# ── Tabs config ──────────────────────────────────────────────────────────

TABS = [
    {"sheet": "Apple(iPhone, Watch)", "parser": "apple_iphone_watch"},
    {"sheet": "Apple (iPad, Macbook)", "parser": "apple_ipad_macbook"},
    {"sheet": "Уцененный товар", "parser": "discount"},
    {"sheet": "Аксессуары и гаджеты в наличии", "parser": "accessories_stock"},
    {"sheet": "Гаджеты и МБТ", "parser": "gadgets"},
    {"sheet": "МБТ Xiaomi", "parser": "mbt_xiaomi"},
    {"sheet": "Audio, приставки, умные колонки", "parser": "audio"},
    {"sheet": "Dyson", "parser": "dyson"},
    {"sheet": "Ноутбуки (нал)", "parser": "laptops_cash"},
    {"sheet": "Ноутбуки", "parser": "laptops_preorder"},
    {"sheet": "Ноутбуки (2)", "parser": "laptops_preorder"},
    # {"sheet": "Предзаказ аксессуары(от 150)", "parser": "preorder_150"},
    # {"sheet": "Предзаказ аксессуары и ТВ", "parser": "preorder_tv"},
]

# ── Network helpers ──────────────────────────────────────────────────────

def fetch_csv_export(gid: str) -> str:
    url = (
        f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}"
        f"/export?format=csv&gid={gid}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def fetch_csv_gviz(sheet_name: str) -> str:
    enc = urllib.parse.quote(sheet_name)
    url = (
        f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}"
        f"/gviz/tq?tqx=out:csv&sheet={enc}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def parse_price(raw: str) -> int | None:
    if not raw:
        return None
    cleaned = re.sub(r"[^\d]", "", raw.strip())
    return int(cleaned) if cleaned and int(cleaned) > 0 else None


# ── Product classification ───────────────────────────────────────────────

def classify(name: str, tab: str = "", section: str = "") -> tuple[str, str, str]:
    """Return (brand, family, category) based on product name."""
    low = name.lower()

    # Apple
    if "iphone" in low:
        return ("apple", "iphone", "iPhone")
    if "macbook" in low:
        return ("apple", "macbook", "MacBook")
    if "imac" in low:
        return ("apple", "imac", "iMac")
    if "mac mini" in low:
        return ("apple", "mac_mini", "Mac Mini")
    if "mac pro" in low or "mac studio" in low:
        return ("apple", "mac_pro", "Mac Pro")
    if "ipad" in low:
        return ("apple", "ipad", "iPad")
    if "airpods" in low:
        return ("apple", "airpods", "AirPods")
    if "apple watch" in low or ("watch" in low and "apple" in tab.lower()):
        return ("apple", "apple_watch", "Apple Watch")
    if "apple pencil" in low or "magic keyboard" in low or "apple tv" in low:
        return ("apple", "apple_acc", "Apple Аксессуары")
    if "homepod" in low:
        return ("apple", "apple_acc", "HomePod")

    # Samsung
    if "samsung" in low or "galaxy" in low:
        if "watch" in low or "fit" in low:
            return ("samsung", "samsung_watch", "Galaxy Watch")
        if "buds" in low:
            return ("samsung", "samsung_audio", "Galaxy Buds")
        if "tab" in low:
            return ("samsung", "samsung_tablet", "Galaxy Tab")
        return ("samsung", "samsung_phone", "Galaxy")

    # Google
    if "pixel" in low:
        if "buds" in low:
            return ("google", "pixel_audio", "Pixel Buds")
        if "watch" in low:
            return ("google", "pixel_watch", "Pixel Watch")
        if "tablet" in low or "tab" in low:
            return ("google", "pixel_tablet", "Pixel Tablet")
        return ("google", "pixel_phone", "Pixel")

    # Xiaomi / Redmi / POCO
    if "redmi" in low:
        if "buds" in low or "наушники" in low:
            return ("xiaomi", "xiaomi_audio", "Xiaomi Audio")
        if "pad" in low or "tab" in low:
            return ("xiaomi", "xiaomi_tablet", "Redmi Pad")
        if "watch" in low or "band" in low:
            return ("xiaomi", "xiaomi_watch", "Xiaomi Watch")
        return ("xiaomi", "xm_redmi", "Redmi")
    if "poco" in low:
        return ("xiaomi", "xm_poco", "POCO")
    if "xiaomi" in low:
        if "tv" in low or "телевизор" in low:
            return ("xiaomi", "xiaomi_tv", "Xiaomi TV")
        if "watch" in low or "band" in low:
            return ("xiaomi", "xiaomi_watch", "Xiaomi Watch")
        if "buds" in low or "наушники" in low:
            return ("xiaomi", "xiaomi_audio", "Xiaomi Audio")
        if "robot" in low or "пылесос" in low:
            return ("xiaomi", "xiaomi_home", "Xiaomi Дом")
        if "pad" in low:
            return ("xiaomi", "xiaomi_tablet", "Xiaomi Pad")
        if "mi 1" in low or "mi 2" in low:
            return ("xiaomi", "xm_mi", "Xiaomi")
        return ("xiaomi", "xm_mi", "Xiaomi")

    # Honor
    if "honor" in low:
        if "watch" in low or "band" in low:
            return ("honor", "honor_watch", "Honor Watch")
        if "pad" in low:
            return ("honor", "honor_tablet", "Honor Pad")
        if "buds" in low or "earbuds" in low:
            return ("honor", "honor_audio", "Honor Audio")
        if "magicbook" in low or "book" in low:
            return ("honor", "honor_laptop", "Honor Ноутбуки")
        return ("honor", "honor_phone", "Honor")

    # Huawei
    if "huawei" in low:
        if "watch" in low or "band" in low:
            return ("huawei", "huawei_watch", "Huawei Watch")
        if "matepad" in low or "pad" in low:
            return ("huawei", "huawei_tablet", "Huawei Pad")
        if "buds" in low or "freebuds" in low:
            return ("huawei", "huawei_audio", "Huawei Audio")
        if "matebook" in low or "book" in low:
            return ("huawei", "huawei_laptop", "Huawei Ноутбуки")
        return ("huawei", "huawei_phone", "Huawei")

    # Nothing
    if "nothing" in low:
        if "ear" in low or "buds" in low:
            return ("nothing", "nothing_audio", "Nothing Audio")
        return ("nothing", "nothing_phone", "Nothing")

    # Realme
    if "realme" in low:
        if "buds" in low:
            return ("realme", "realme_audio", "Realme Audio")
        return ("realme", "realme_phone", "Realme")

    # Infinix / Tecno / Itel
    if "infinix" in low:
        return ("infinix", "infinix_phone", "Infinix")
    if "tecno" in low:
        return ("tecno", "tecno_phone", "Tecno")
    if "itel" in low:
        return ("itel", "itel_phone", "Itel")

    # Dyson
    if "dyson" in low or "dyson" in tab.lower():
        return ("dyson", "dyson", "Dyson")

    # Audio brands
    if "jbl" in low:
        return ("audio", "audio_jbl", "JBL")
    if "marshall" in low:
        return ("audio", "marshall_speakers", "Marshall")
    if "harman" in low:
        return ("audio", "audio_harman", "Harman/Kardon")
    if "sony" in low:
        if "dualsense" in low or "ps5" in low or "playstation" in low:
            return ("gaming", "gaming_item", "PlayStation")
        return ("audio", "audio_sony", "Sony")
    if "beats" in low:
        return ("audio", "audio_beats", "Beats")
    if "bose" in low:
        return ("audio", "audio_bose", "Bose")
    if "bang" in low and "olufsen" in low:
        return ("audio", "audio_bo", "Bang & Olufsen")
    if "sennheiser" in low:
        return ("audio", "audio_sennheiser", "Sennheiser")
    if "beyerdynamic" in low:
        return ("audio", "audio_beyerdynamic", "Beyerdynamic")

    # Yandex
    if "яндекс" in low or "yandex" in low:
        return ("audio", "audio_yandex", "Яндекс")

    # Gaming / VR
    if "meta quest" in low:
        return ("vr_meta", "vr_meta_quest", "Meta Quest")
    if "ray-ban" in low or "rayban" in low:
        return ("vr_meta", "vr_meta_rayban", "Ray-Ban Meta")
    if "nintendo" in low:
        return ("gaming", "gaming_nintendo", "Nintendo")
    if "ps5" in low or "playstation" in low or "dualsense" in low:
        return ("gaming", "gaming_item", "PlayStation")
    if "xbox" in low:
        return ("gaming", "gaming_xbox", "Xbox")

    # Networking
    if any(x in low for x in ["keenetic", "tp-link", "mercusys", "mikrotik", "cudy", "asus rt-"]):
        return ("home_office", "home_office_network", "Сетевое оборудование")

    # DJI / GoPro / Insta360
    if "dji" in low:
        return ("photo_video", "photo_video_dji", "DJI")
    if "gopro" in low:
        return ("photo_video", "photo_video_gopro", "GoPro")
    if "insta360" in low:
        return ("photo_video", "photo_video_insta360", "Insta360")

    # Garmin
    if "garmin" in low:
        return ("garmin", "garmin_watch", "Garmin")

    # Laptops by brand
    if "ноутбук" in tab.lower() or "laptop" in tab.lower():
        brand_low = low.split()[0] if low else ""
        for b in ["acer", "asus", "lenovo", "hp", "dell", "msi", "thunderobot", "maibenben", "chuwi", "acd"]:
            if b in low:
                return ("laptops", f"laptop_{b}", f"Ноутбуки {b.title()}")
        return ("laptops", "laptop_other", "Ноутбуки")

    # Fallback by tab
    if "audio" in tab.lower():
        return ("audio", "audio_other", "Audio")
    if "аксессуар" in tab.lower() or "гаджет" in tab.lower():
        return ("gadgets", "gadgets", section or "Гаджеты")
    if "уценен" in tab.lower():
        return ("discount", "discount", "Уценка")

    return ("other", "other", section or "Другое")


# ── Tab parsers ──────────────────────────────────────────────────────────

def _rows(csv_text: str) -> list[list[str]]:
    return list(csv.reader(io.StringIO(csv_text)))


def _is_section_header(row: list[str]) -> str | None:
    """Return section name if this row is a category/section header, else None."""
    filled = [c.strip() for c in row if c.strip()]
    if not filled:
        return None
    name = filled[0]
    has_price = any(parse_price(c) for c in row[1:6] if c.strip())
    if not has_price and len(name) > 3 and not name[0].isdigit():
        return name
    return None


def parse_apple_iphone_watch(csv_text: str) -> list[dict]:
    """A=SKU, B=Name, C=Country, D=Price. Section headers have ':' suffix."""
    products = []
    for row in _rows(csv_text):
        if len(row) < 4:
            continue
        name, country, price_raw = row[1].strip(), row[2].strip(), row[3]
        if not name:
            continue
        price = parse_price(price_raw)
        if not price:
            continue
        brand, family, cat = classify(name, "Apple(iPhone, Watch)")
        products.append({"name": name, "country": country, "price": price,
                         "brand": brand, "family": family, "category": cat})
    return products


def parse_apple_ipad_macbook(csv_text: str) -> list[dict]:
    """A=Name, B=Details(color,country), C=Price."""
    products = []
    for row in _rows(csv_text):
        if len(row) < 3:
            continue
        name, details, price_raw = row[0].strip(), row[1].strip(), row[2]
        if not name:
            continue
        price = parse_price(price_raw)
        if not price:
            continue
        country = ""
        if details:
            parts = [p.strip() for p in details.split(",")]
            countries = [p for p in parts if p in (
                "США", "Индия", "Китай", "Гонконг", "Россия", "ОАЭ",
                "ЕС", "Австралия", "Япония", "Тайвань", "Корея")]
            country = ", ".join(countries)
        brand, family, cat = classify(name, "Apple (iPad, Macbook)")
        products.append({"name": name, "country": country, "price": price,
                         "brand": brand, "family": family, "category": cat})
    return products


def parse_discount(csv_text: str) -> list[dict]:
    """A=Code, B=Name, C=Note, D=Price."""
    products = []
    for row in _rows(csv_text):
        if len(row) < 4:
            continue
        name, price_raw = row[1].strip(), row[3]
        if not name:
            continue
        price = parse_price(price_raw)
        if not price:
            continue
        brand, family, cat = classify(name, "Уцененный товар")
        products.append({"name": name, "country": "", "price": price,
                         "brand": brand, "family": family, "category": cat})
    return products


def parse_accessories_stock(csv_text: str) -> list[dict]:
    """A=SKU, B=Name, C=qty, D=Price(cash)."""
    products = []
    section = ""
    for row in _rows(csv_text):
        if len(row) < 4:
            continue
        sec = _is_section_header(row)
        if sec:
            section = sec.split("/")[-1].strip()
            continue
        name, price_raw = row[1].strip(), row[3]
        if not name:
            continue
        price = parse_price(price_raw)
        if not price:
            continue
        brand, family, cat = classify(name, "Аксессуары и гаджеты", section)
        products.append({"name": name, "country": "", "price": price,
                         "brand": brand, "family": family, "category": cat})
    return products


def parse_gadgets(csv_text: str) -> list[dict]:
    """A=Code, B=Name, C=Price."""
    products = []
    section = ""
    for row in _rows(csv_text):
        if len(row) < 3:
            continue
        sec = _is_section_header(row)
        if sec:
            section = sec.split("/")[-1].strip()
            continue
        name, price_raw = row[1].strip(), row[2]
        if not name:
            continue
        price = parse_price(price_raw)
        if not price:
            continue
        brand, family, cat = classify(name, "Гаджеты и МБТ", section)
        products.append({"name": name, "country": "", "price": price,
                         "brand": brand, "family": family, "category": cat})
    return products


def parse_mbt_xiaomi(csv_text: str) -> list[dict]:
    """A=SKU, B=Name, C=Price(cash)."""
    products = []
    section = ""
    for row in _rows(csv_text):
        if len(row) < 3:
            continue
        sec = _is_section_header(row)
        if sec:
            section = sec.split("/")[-1].strip()
            continue
        name, price_raw = row[1].strip(), row[2]
        if not name:
            continue
        price = parse_price(price_raw)
        if not price:
            continue
        brand, family, cat = classify(name, "МБТ Xiaomi", section)
        products.append({"name": name, "country": "", "price": price,
                         "brand": brand, "family": family, "category": cat})
    return products


def parse_audio(csv_text: str) -> list[dict]:
    """A=Name, B=Color/details, C=Price."""
    products = []
    section = ""
    for row in _rows(csv_text):
        if len(row) < 3:
            continue
        sec = _is_section_header(row)
        if sec:
            section = sec
            continue
        name, price_raw = row[0].strip(), row[2]
        if not name:
            continue
        price = parse_price(price_raw)
        if not price:
            continue
        brand, family, cat = classify(name, "Audio, приставки", section)
        products.append({"name": name, "country": "", "price": price,
                         "brand": brand, "family": family, "category": cat})
    return products


def parse_dyson(csv_text: str) -> list[dict]:
    """A=Name, B=Color/country, C=Price."""
    products = []
    for row in _rows(csv_text):
        if len(row) < 3:
            continue
        name, details, price_raw = row[0].strip(), row[1].strip(), row[2]
        if not name:
            continue
        price = parse_price(price_raw)
        if not price:
            continue
        country = ""
        if details:
            parts = [p.strip() for p in details.split(",")]
            countries = [p for p in parts if p in (
                "США", "Индия", "Китай", "Россия", "ОАЭ", "ЕС", "Австралия")]
            country = ", ".join(countries)
        brand, family, cat = classify(name, "Dyson")
        products.append({"name": name, "country": country, "price": price,
                         "brand": brand, "family": family, "category": cat})
    return products


def parse_laptops_cash(csv_text: str) -> list[dict]:
    """A=Brand, B=Name, C=Price."""
    products = []
    for row in _rows(csv_text):
        if len(row) < 3:
            continue
        name, price_raw = row[1].strip(), row[2]
        if not name:
            continue
        price = parse_price(price_raw)
        if not price:
            continue
        brand, family, cat = classify(name, "Ноутбуки (нал)")
        products.append({"name": name, "country": "", "price": price,
                         "brand": brand, "family": family, "category": cat})
    return products


def parse_laptops_preorder(csv_text: str) -> list[dict]:
    """A=Brand, B=Name, C=VendorCode, D=Notes, E=Price(base)."""
    products = []
    for row in _rows(csv_text):
        if len(row) < 5:
            continue
        name, price_raw = row[1].strip(), row[4]
        if not name:
            continue
        price = parse_price(price_raw)
        if not price:
            continue
        brand, family, cat = classify(name, "Ноутбуки")
        products.append({"name": name, "country": "", "price": price,
                         "brand": brand, "family": family, "category": cat})
    return products


def parse_preorder_150(csv_text: str) -> list[dict]:
    """A=Category, B=Brand, C=SKU, D=Name, E=Price(base)."""
    products = []
    for row in _rows(csv_text):
        if len(row) < 5:
            continue
        sheet_cat, name, price_raw = row[0].strip(), row[3].strip(), row[4]
        if not name or len(name) < 5:
            continue
        if _is_tv(name, sheet_cat):
            continue
        price = parse_price(price_raw)
        if not price:
            continue
        brand, family, cat = classify(name, "Предзаказ аксессуары", sheet_cat)
        products.append({"name": name, "country": "", "price": price,
                         "brand": brand, "family": family, "category": cat})
    return products


def parse_preorder_tv(csv_text: str) -> list[dict]:
    """A=Cat1, B=Cat2, C=Code, D=Name, E=Price(base). Filter out TVs."""
    products = []
    for row in _rows(csv_text):
        if len(row) < 5:
            continue
        cat1, cat2, name, price_raw = row[0].strip(), row[1].strip(), row[3].strip(), row[4]
        if not name or len(name) < 5:
            continue
        if _is_tv(name, f"{cat1} {cat2}"):
            continue
        price = parse_price(price_raw)
        if not price:
            continue
        brand, family, cat = classify(name, "Предзаказ аксессуары и ТВ", cat2 or cat1)
        products.append({"name": name, "country": "", "price": price,
                         "brand": brand, "family": family, "category": cat})
    return products


def _is_tv(name: str, context: str = "") -> bool:
    low = name.lower()
    ctx = context.lower()
    tv_kw = ["телевизор", " tv ", "телевиз", "qled", "oled tv", "smart tv"]
    if any(k in low for k in tv_kw):
        return True
    if any(k in ctx for k in ["телевизор", "телевиз"]):
        if "приставк" not in low and "stick" not in low:
            return True
    return False


# ── Parser dispatch ──────────────────────────────────────────────────────

PARSERS = {
    "apple_iphone_watch": parse_apple_iphone_watch,
    "apple_ipad_macbook": parse_apple_ipad_macbook,
    "discount": parse_discount,
    "accessories_stock": parse_accessories_stock,
    "gadgets": parse_gadgets,
    "mbt_xiaomi": parse_mbt_xiaomi,
    "audio": parse_audio,
    "dyson": parse_dyson,
    "laptops_cash": parse_laptops_cash,
    "laptops_preorder": parse_laptops_preorder,
    "preorder_150": parse_preorder_150,
    "preorder_tv": parse_preorder_tv,
}


# ── Main ─────────────────────────────────────────────────────────────────

def apply_margin(product: dict) -> dict:
    margin = MARGINS.get(product["family"], 0)
    if margin:
        product["price"] += margin
    return product


def strip_sim_suffix(name: str) -> str:
    return re.sub(r"\s+(1sim|2sim|esim)\s*$", "", name, flags=re.IGNORECASE).strip()


def main():
    apply = "--apply" in sys.argv
    all_products = []
    seen_keys = set()

    for tab in TABS:
        sheet = tab["sheet"]
        parser_name = tab["parser"]
        print(f"\n  Загрузка: {sheet} ...")

        try:
            csv_text = fetch_csv_gviz(sheet)
        except Exception as e:
            print(f"   ОШИБКА: {e}")
            continue

        parser_fn = PARSERS[parser_name]
        products = parser_fn(csv_text)

        added = 0
        for p in products:
            p["name"] = strip_sim_suffix(p["name"])
            p = apply_margin(p)
            key = (p["name"].lower(), p.get("country", "").lower(), p["price"])
            if key in seen_keys:
                continue
            seen_keys.add(key)
            all_products.append(p)
            added += 1

        print(f"   Найдено: {len(products)}, добавлено (без дублей): {added}")

    # Assign IDs
    family_counters: dict[str, int] = {}
    for p in all_products:
        fam = p["family"]
        family_counters[fam] = family_counters.get(fam, 0) + 1
        p["id"] = f"{fam}-{family_counters[fam]}"
        p["sku"] = ""

    catalog = [
        {
            "id": p["id"],
            "brand": p["brand"],
            "family": p["family"],
            "category": p["category"],
            "sku": "",
            "name": p["name"],
            "country": p.get("country", ""),
            "price": p["price"],
        }
        for p in all_products
    ]

    # Stats
    cats = {}
    for p in catalog:
        cats[p["category"]] = cats.get(p["category"], 0) + 1

    print(f"\n{'=' * 60}")
    print(f"  Итого: {len(catalog)} товаров в {len(cats)} категориях")
    print(f"{'=' * 60}")
    for cat, cnt in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {cnt}")

    if apply:
        with open(PRODUCTS_JSON, "w", encoding="utf-8") as f:
            json.dump(catalog, f, ensure_ascii=False, indent=2)
        js_path = PRODUCTS_JSON.with_name("catalog-data.js")
        with open(js_path, "w", encoding="utf-8") as f:
            f.write("window.__SHOP_CATALOG__ = ")
            json.dump(catalog, f, ensure_ascii=False, separators=(",", ":"))
            f.write(";\n")
        print(f"\n  Записано в {PRODUCTS_JSON.name} и {js_path.name}")
    else:
        print(f"\n  Сухой прогон. Для применения: python3 scripts/import_catalog.py --apply")


if __name__ == "__main__":
    main()
