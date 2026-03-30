#!/usr/bin/env python3
"""Раздаёт каталог из web/ и принимает POST /api/order (тело JSON: {"text": "..."}).

Вызывает Telegram Bot API на сервере, обходя ограничение CORS в браузере.
Переменные TELEGRAM_BOT_TOKEN и TELEGRAM_GROUP_CHAT_ID — из окружения или .env в корне проекта.

Запуск из корня репозитория:
  python3 scripts/order_api_server.py
Откройте http://127.0.0.1:8787/ — оформление заказа уйдёт в группу.

Продакшен по HTTPS: поднимите этот же обработчик POST /api/order за nginx/Caddy на том же
домене, что и статический каталог, и в .env задайте ORDER_API_URL=/api/order.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
WEB_DIR = ROOT / "web"
ENV_PATH = ROOT / ".env"
DEFAULT_PORT = 8787


def parse_env(path: Path) -> dict[str, str]:
    data: dict[str, str] = {}
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


def apply_env_file() -> None:
    for key, value in parse_env(ENV_PATH).items():
        if key not in os.environ or os.environ.get(key) == "":
            os.environ[key] = value


def telegram_send_message(token: str, chat_id: str, text: str) -> dict[str, Any]:
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    body = json.dumps(
        {"chat_id": chat_id, "text": text},
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode("utf-8")
    return json.loads(raw) if raw else {}


def make_handler(web_root: Path):
    web_str = str(web_root.resolve())

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=web_str, **kwargs)

        def log_message(self, fmt: str, *args: Any) -> None:
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

        def _path_clean(self) -> str:
            return self.path.split("?", 1)[0].rstrip("/") or "/"

        def _cors(self) -> None:
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS, GET")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")

        def end_headers(self) -> None:
            self._cors()
            super().end_headers()

        def do_OPTIONS(self) -> None:
            if self._path_clean() == "/api/order":
                self.send_response(HTTPStatus.NO_CONTENT)
                self._cors()
                self.end_headers()
            else:
                self.send_error(HTTPStatus.NOT_FOUND)

        def do_POST(self) -> None:
            if self._path_clean() != "/api/order":
                self.send_error(HTTPStatus.NOT_FOUND)
                return
            length = int(self.headers.get("Content-Length", "0") or "0")
            raw = self.rfile.read(length) if length else b"{}"
            try:
                data = json.loads(raw.decode("utf-8") or "{}")
            except json.JSONDecodeError:
                self.send_error(HTTPStatus.BAD_REQUEST, "Invalid JSON")
                return
            text = data.get("text")
            if not text or not isinstance(text, str):
                self.send_error(HTTPStatus.BAD_REQUEST, "Missing text")
                return

            token = (os.environ.get("TELEGRAM_BOT_TOKEN") or "").strip()
            chat_id = (os.environ.get("TELEGRAM_GROUP_CHAT_ID") or "").strip()
            if not token or not chat_id:
                msg = json.dumps(
                    {"ok": False, "error": "TELEGRAM_BOT_TOKEN or TELEGRAM_GROUP_CHAT_ID not set"},
                    ensure_ascii=False,
                ).encode("utf-8")
                self.send_response(HTTPStatus.INTERNAL_SERVER_ERROR)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(msg)))
                self.end_headers()
                self.wfile.write(msg)
                return

            try:
                tg_res = telegram_send_message(token, chat_id, text)
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8", errors="replace")
                msg = json.dumps(
                    {"ok": False, "error": f"telegram_http_{e.code}", "detail": err_body[:500]},
                    ensure_ascii=False,
                ).encode("utf-8")
                self.send_response(HTTPStatus.BAD_GATEWAY)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(msg)))
                self.end_headers()
                self.wfile.write(msg)
                return
            except Exception as e:
                msg = json.dumps(
                    {"ok": False, "error": str(e)},
                    ensure_ascii=False,
                ).encode("utf-8")
                self.send_response(HTTPStatus.BAD_GATEWAY)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(msg)))
                self.end_headers()
                self.wfile.write(msg)
                return

            if not tg_res.get("ok"):
                msg = json.dumps(
                    {"ok": False, "error": "telegram_api", "detail": tg_res},
                    ensure_ascii=False,
                ).encode("utf-8")
                self.send_response(HTTPStatus.BAD_GATEWAY)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(msg)))
                self.end_headers()
                self.wfile.write(msg)
                return

            ok = json.dumps({"ok": True}, ensure_ascii=False).encode("utf-8")
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(ok)))
            self.end_headers()
            self.wfile.write(ok)

    return Handler


def main() -> None:
    apply_env_file()
    if not WEB_DIR.is_dir():
        print(f"Нет папки {WEB_DIR}", file=sys.stderr)
        sys.exit(1)
    port = int(os.environ.get("PORT", str(DEFAULT_PORT)))
    handler = make_handler(WEB_DIR)
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    print(f"Каталог: http://127.0.0.1:{port}/")
    print(f"POST заказов: http://127.0.0.1:{port}/api/order")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nСтоп.")


if __name__ == "__main__":
    main()
