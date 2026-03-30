#!/usr/bin/env python3
"""Пересылает заказ из Mini App в группу (ответ на web_app_data).

Мини-приложение шлёт tg.sendData(JSON) — сюда приходит поле message.web_app_data.data.
Бот должен быть добавлен в целевую группу и иметь право писать сообщения.

Переменные окружения (или строки в .env рядом со скриптом — подставьте вручную в export):
  TELEGRAM_BOT_TOKEN
  TELEGRAM_GROUP_CHAT_ID   (например -1001234567890)

Запуск:
  export TELEGRAM_BOT_TOKEN=...
  export TELEGRAM_GROUP_CHAT_ID=...
  python3 scripts/bot_forward_webapp_orders.py

В BotFather у бота можно отключить Privacy Mode или добавить бота в группу с правом читать все сообщения
только если нужно слушать обычные сообщения; для web_app_data достаточно, чтобы пользователь нажал
«Оформить» в WebApp, привязанном к этому боту.
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent


def parse_env(path: Path) -> dict[str, str]:
    data: dict[str, str] = {}
    if not path.exists():
        return data
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        data[k.strip()] = v.strip().strip('"').strip("'")
    return data


def load_env() -> None:
    for k, v in parse_env(ROOT / ".env").items():
        if k in (
            "TELEGRAM_BOT_TOKEN",
            "TELEGRAM_GROUP_CHAT_ID",
            "BOT_DEBUG",
        ) and v and (k not in os.environ or not os.environ.get(k)):
            os.environ[k] = v


def api_call(token: str, method: str, payload: dict) -> dict:
    url = f"https://api.telegram.org/bot{token}/{method}"
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> None:
    load_env()
    token = (os.environ.get("TELEGRAM_BOT_TOKEN") or "").strip()
    group = (os.environ.get("TELEGRAM_GROUP_CHAT_ID") or "").strip()
    if not token or not group:
        print("Нужны TELEGRAM_BOT_TOKEN и TELEGRAM_GROUP_CHAT_ID.", file=sys.stderr)
        sys.exit(1)

    offset = 0
    debug = (os.environ.get("BOT_DEBUG") or "").strip() in ("1", "true", "yes")
    print("Бот слушает заказы (sendData из Mini App)… Ctrl+C — выход.", flush=True)
    if debug:
        print("DEBUG=1: в лог пишутся все входящие update.", flush=True)
    while True:
        try:
            # Без allowed_updates — иначе часть клиентов не отдаёт web_app_data в long poll
            res = api_call(
                token,
                "getUpdates",
                {"offset": offset, "timeout": 50},
            )
        except urllib.error.HTTPError as e:
            body = ""
            try:
                body = e.read().decode("utf-8", errors="replace")
            except Exception:
                pass
            if e.code == 409:
                print(
                    "409 Conflict: для этого бота уже выполняется getUpdates (long polling).\n"
                    "  Остановите вторую копию scripts/bot_forward_webapp_orders.py, другой сервер с этим токеном\n"
                    "  или подождите ~50 с, пока завершится предыдущий long-poll.",
                    file=sys.stderr,
                )
                time.sleep(5)
            else:
                print("HTTP", e.code, body[:800] or e, file=sys.stderr)
                time.sleep(3)
            continue
        except (urllib.error.URLError, TimeoutError) as e:
            print("Сеть:", e, file=sys.stderr)
            time.sleep(3)
            continue

        if not res.get("ok"):
            print("getUpdates:", res, file=sys.stderr)
            time.sleep(2)
            continue

        for upd in res.get("result", []):
            offset = upd["update_id"] + 1
            if debug:
                print("UPDATE:", json.dumps(upd, ensure_ascii=False)[:2000], flush=True)

            msg = upd.get("message") or {}
            web = msg.get("web_app_data")
            if not web:
                continue

            chat_user = msg.get("chat") or {}
            user_chat_id = chat_user.get("id")

            raw = web.get("data") or "{}"
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                data = {"text": raw}

            text = data.get("text")
            if not text:
                text = (
                    "Заказ (сырые данные):\n"
                    + json.dumps(data, ensure_ascii=False, indent=2)[:3500]
                )

            if len(text) > 4096:
                text = text[:4090] + "…"

            out = api_call(
                token,
                "sendMessage",
                {"chat_id": group, "text": text},
            )
            if not out.get("ok"):
                print("sendMessage в группу:", out, file=sys.stderr)
                if user_chat_id:
                    try:
                        api_call(
                            token,
                            "sendMessage",
                            {
                                "chat_id": user_chat_id,
                                "text": "Не удалось отправить заказ в группу. Проверьте, что бот в группе и TELEGRAM_GROUP_CHAT_ID верный.",
                            },
                        )
                    except Exception as e:
                        print("sendMessage пользователю:", e, file=sys.stderr)
            else:
                if user_chat_id:
                    try:
                        api_call(
                            token,
                            "sendMessage",
                            {
                                "chat_id": user_chat_id,
                                "text": "Заказ отправлен в рабочий чат.",
                            },
                        )
                    except Exception:
                        pass

        time.sleep(0.1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nСтоп.")
