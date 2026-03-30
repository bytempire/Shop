#!/usr/bin/env python3
"""Generate web/runtime-config.js from .env values."""

from pathlib import Path
import json


ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
OUT_PATH = ROOT / "web" / "runtime-config.js"


def parse_env(path: Path) -> dict:
    data = {}
    if not path.exists():
        return data
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        data[key] = value
    return data


def main():
    env = parse_env(ENV_PATH)
    payload = {
        "TELEGRAM_BOT_TOKEN": env.get("TELEGRAM_BOT_TOKEN", ""),
        "TELEGRAM_GROUP_CHAT_ID": env.get("TELEGRAM_GROUP_CHAT_ID", ""),
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        "window.__SHOP_CONFIG__ = " + json.dumps(payload, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    print(f"OK: {OUT_PATH}")


if __name__ == "__main__":
    main()
