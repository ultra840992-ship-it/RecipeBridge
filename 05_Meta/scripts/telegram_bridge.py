#!/usr/bin/env python3
import os
import sys
import json
import time
import urllib.request
import urllib.parse

# Windows 콘솔 UTF-8 강제 설정 (cp949 인코딩 오류 방지)
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf8'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

def _print(msg):
    """Windows 콘솔 인코딩 오류를 방지하는 안전한 print 래퍼"""
    try:
        print(msg)
    except (UnicodeEncodeError, UnicodeDecodeError):
        print(msg.encode('ascii', errors='replace').decode('ascii'))

# ──────────────────────────────────────────────────────────────
#  RecipeBridge 24/7 Telegram Bot Bridge v2
#  ✅ 커맨드 지원: /start /help /status /pause /resume /aegis /nova /vivid /bitz /echo /carey /group
#  ✅ live_server.py API 연동 (실시간 Gemini 에이전트 응답)
#  ✅ Pause 상태 제어 연동
#  ✅ No external dependencies (stdlib only)
# ──────────────────────────────────────────────────────────────

# ── 설정 로드 ──
TOKEN            = os.getenv("TELEGRAM_BOT_TOKEN")
ALLOWED_CHAT_ID  = os.getenv("TELEGRAM_ALLOWED_CHAT_ID")
BACKEND_URL      = "http://localhost:8000"

env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1)
                v_clean = v.strip("'\" \r\n")
                if k == "TELEGRAM_BOT_TOKEN"            and "INSERT" not in v_clean: TOKEN           = v_clean
                elif k == "TELEGRAM_ALLOWED_CHAT_ID"   and "INSERT" not in v_clean: ALLOWED_CHAT_ID  = v_clean

if not TOKEN or "INSERT" in TOKEN:
    print("[Error] TELEGRAM_BOT_TOKEN이 .env에 설정되지 않았습니다.")
    sys.exit(1)

API_URL = f"https://api.telegram.org/bot{TOKEN}"

# ── 에이전트 키 → 이모지 매핑 ──
AGENT_LABELS = {
    "aegis": "🛡️ Aegis",
    "nova":  "💡 Nova",
    "vivid": "🎨 Vivid",
    "bitz":  "💻 Bitz",
    "echo":  "📢 Echo",
    "carey": "🎧 Carey",
    "group": "👥 전체 협업 회의",
}

# ── 도움말 텍스트 ──
HELP_TEXT = """🤖 *RecipeBridge AI Bot* — 커맨드 목록

*📋 일반*
/start — 봇 시작 및 환영 인사
/help — 이 도움말 보기
/status — 서버 및 에이전트 상태 확인

*⚡ 제어*
/pause [사유] — 에이전트 가동 일시 중지 (토큰 절약)
/resume — 에이전트 가동 재개

*💬 에이전트 대화*
/aegis [메시지] — 마스터 Aegis와 1:1 대화
/nova [메시지] — 기획자 Nova와 1:1 대화
/vivid [메시지] — 디자이너 Vivid와 1:1 대화
/bitz [메시지] — 개발자 Bitz와 1:1 대화
/echo [메시지] — 마케터 Echo와 1:1 대화
/carey [메시지] — CS Carey와 1:1 대화
/group [안건] — 6인 전체 협업 회의 소집

*💡 팁*
커맨드 없이 일반 메시지를 보내면 Aegis가 자동 응답합니다."""

# ──────────────────────────────────────────────────────────────
#  유틸리티 함수
# ──────────────────────────────────────────────────────────────

def send_message(chat_id, text, parse_mode="Markdown"):
    url = f"{API_URL}/sendMessage"
    # 텔레그램 메시지 4096자 제한 처리
    if len(text) > 4000:
        text = text[:3950] + "\n\n...*(응답이 너무 길어 잘렸습니다)*"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": parse_mode}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return json.loads(res.read().decode("utf-8"))
    except Exception as e:
        print(f"[SendError] {e}")
        return None

def send_typing(chat_id):
    try:
        urllib.request.urlopen(f"{API_URL}/sendChatAction?chat_id={chat_id}&action=typing", timeout=5)
    except Exception:
        pass

def call_agent(agent_key, message):
    """live_server.py의 /api/chat API 호출"""
    url = f"{BACKEND_URL}/api/chat"
    payload = {"agent": agent_key, "message": message}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=90) as res:
            result = json.loads(res.read().decode("utf-8"))
            replies = result.get("replies", [])
            if not replies:
                return "⚠️ 응답을 받지 못했습니다."
            # 그룹 회의는 여러 응답을 합침
            parts = []
            for r in replies:
                agent_lbl = AGENT_LABELS.get(r.get("agent", ""), r.get("agent", ""))
                txt = r.get("text", "").strip()
                if txt:
                    if len(replies) > 1:
                        parts.append(f"*{agent_lbl}*\n{txt}")
                    else:
                        parts.append(txt)
            return "\n\n---\n\n".join(parts) if parts else "⚠️ 빈 응답이 반환되었습니다."
    except Exception as e:
        return f"⚠️ API 서버 연결 실패: {e}\n\n`run_dashboard.bat`이 실행 중인지 확인하세요."

def get_server_status():
    """서버 상태 및 Pause 여부 조회"""
    try:
        with urllib.request.urlopen(f"{BACKEND_URL}/api/settings", timeout=5) as res:
            settings = json.loads(res.read().decode("utf-8"))
            paused = settings.get("paused", False)
            reason = settings.get("pause_reason", "")
            paused_at = settings.get("paused_at", "")
            if paused:
                return (False, f"🔴 *일시 중지 상태*\n사유: {reason or '없음'}\n중지 시각: {paused_at or '알 수 없음'}", settings)
            else:
                return (True, "🟢 *에이전트 정상 가동 중*", settings)
    except Exception as e:
        return (None, f"⚠️ 서버 오프라인 또는 응답 없음\n`{e}`", {})

def set_pause(paused, reason=""):
    """Pause 상태 변경"""
    url = f"{BACKEND_URL}/api/settings"
    payload = {"paused": paused, "reason": reason}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            result = json.loads(res.read().decode("utf-8"))
            return result.get("ok", False)
    except Exception as e:
        print(f"[PauseError] {e}")
        return False

# ──────────────────────────────────────────────────────────────
#  커맨드 핸들러
# ──────────────────────────────────────────────────────────────

def handle_command(chat_id, command, args):
    cmd = command.lower().split("@")[0]  # @봇이름 제거

    if cmd == "/start":
        send_message(chat_id,
            "👋 안녕하세요, 사장님!\n\n"
            "*RecipeBridge AI Bot*에 오신 것을 환영합니다.\n"
            "6인의 AI 에이전트(Aegis, Nova, Vivid, Bitz, Echo, Carey)와 직접 소통하거나 "
            "에이전트 가동을 제어할 수 있습니다.\n\n"
            "/help 로 전체 커맨드 목록을 확인하세요."
        )

    elif cmd == "/help":
        send_message(chat_id, HELP_TEXT)

    elif cmd == "/status":
        online, status_msg, settings = get_server_status()
        calls = settings.get("calls_today", 0)
        max_calls = settings.get("max_daily_calls", 200)
        msg = (
            f"📊 *RecipeBridge AI 서버 상태*\n\n"
            f"{status_msg}\n\n"
            f"📡 API 서버: {'🟢 온라인' if online is not None else '🔴 오프라인'}\n"
            f"📊 오늘 API 호출: {calls}/{max_calls}회"
        )
        send_message(chat_id, msg)

    elif cmd == "/pause":
        reason = " ".join(args) if args else "사장님 수동 중지"
        ok = set_pause(True, reason)
        if ok:
            send_message(chat_id,
                f"⏸ *에이전트 가동이 중지되었습니다.*\n\n"
                f"사유: {reason}\n\n"
                f"토큰 사용이 즉시 차단됩니다. 재개하려면 /resume 을 입력하세요."
            )
        else:
            send_message(chat_id, "⚠️ 중지 실패. `run_dashboard.bat`이 실행 중인지 확인하세요.")

    elif cmd == "/resume":
        ok = set_pause(False)
        if ok:
            send_message(chat_id,
                "▶️ *에이전트 가동이 재개되었습니다.*\n\n"
                "6인의 AI 에이전트가 다시 업무를 시작합니다! 🚀"
            )
        else:
            send_message(chat_id, "⚠️ 재개 실패. `run_dashboard.bat`이 실행 중인지 확인하세요.")

    elif cmd in ["/aegis", "/nova", "/vivid", "/bitz", "/echo", "/carey", "/group"]:
        agent_key = cmd.lstrip("/")
        if not args:
            label = AGENT_LABELS.get(agent_key, agent_key)
            send_message(chat_id, f"💬 {label}에게 전달할 메시지를 입력하세요.\n예: `{cmd} 오늘 업무 현황 알려줘`")
            return
        message = " ".join(args)
        label = AGENT_LABELS.get(agent_key, agent_key)
        send_message(chat_id, f"⏳ *{label}*에게 전달 중... (잠시만 기다려 주세요)")
        send_typing(chat_id)
        response = call_agent(agent_key, message)
        send_message(chat_id, f"*{label}의 답변:*\n\n{response}")

    else:
        send_message(chat_id, f"❓ 알 수 없는 커맨드입니다: `{command}`\n/help 로 사용 가능한 커맨드를 확인하세요.")

# ──────────────────────────────────────────────────────────────
#  메인 폴링 루프
# ──────────────────────────────────────────────────────────────

def poll_updates():
    offset = 0
    _print("=" * 60)
    _print("  RecipeBridge Telegram Bot v2 Polling Start")
    _print(f"  Bot API: {API_URL[:40]}...")
    _print(f"  Allowed Chat ID: {ALLOWED_CHAT_ID or 'any'}")
    _print("=" * 60)

    while True:
        try:
            url = f"{API_URL}/getUpdates?offset={offset}&timeout=30"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=35) as res:
                response = json.loads(res.read().decode("utf-8"))

                if not response.get("ok"):
                    time.sleep(2)
                    continue

                for update in response.get("result", []):
                    offset = update["update_id"] + 1
                    message = update.get("message")
                    if not message or "text" not in message:
                        continue

                    chat_id  = str(message["chat"]["id"])
                    user_text = message["text"].strip()
                    username = message.get("from", {}).get("username", "unknown")

                    # ── 보안: 화이트리스트 체크 ──
                    if ALLOWED_CHAT_ID and "INSERT" not in ALLOWED_CHAT_ID and chat_id != ALLOWED_CHAT_ID:
                        _print(f"[Blocked] unauthorized Chat ID: {chat_id} / @{username}")
                        send_message(chat_id, "🚫 접근 권한이 없습니다.\nRecipeBridge 사장님 전용 봇입니다.")
                        continue

                    _print(f"[Received] @{username} ({chat_id}): {user_text[:60]}")
                    send_typing(chat_id)

                    # ── 커맨드 vs 일반 메시지 분기 ──
                    if user_text.startswith("/"):
                        parts   = user_text.split()
                        command = parts[0]
                        args    = parts[1:]
                        handle_command(chat_id, command, args)
                    else:
                        # 커맨드 없는 일반 메시지 → Aegis 자동 응답
                        send_message(chat_id, "⏳ Aegis가 응답 중입니다...")
                        send_typing(chat_id)
                        response_text = call_agent("aegis", user_text)
                        send_message(chat_id, f"🛡️ *Aegis*:\n\n{response_text}")

        except urllib.error.URLError as e:
            _print(f"[Network] reconnecting in 10s: {e}")
            time.sleep(10)
        except Exception as e:
            _print(f"[Error] {e}")
            time.sleep(5)

# ──────────────────────────────────────────────────────────────
#  Chat ID 자동 확인 유틸리티
# ──────────────────────────────────────────────────────────────

def get_my_chat_id():
    """가장 최근 메시지를 보낸 사용자의 Chat ID를 출력 (최초 설정 시 활용)"""
    url = f"{API_URL}/getUpdates?limit=10"
    try:
        with urllib.request.urlopen(url, timeout=10) as res:
            result = json.loads(res.read().decode("utf-8"))
            updates = result.get("result", [])
            if updates:
                for upd in reversed(updates):
                    msg = upd.get("message")
                    if msg:
                        cid = msg["chat"]["id"]
                        uname = msg.get("from", {}).get("username", "")
                        print(f"\n✅ Chat ID 확인됨: {cid}  (@{uname})")
                        print(f"   → .env의 TELEGRAM_ALLOWED_CHAT_ID=\"{cid}\" 로 설정하세요\n")
                        return cid
            else:
                print("\n⚠️ 수신된 메시지가 없습니다.")
                print("   텔레그램에서 @RecipeBridgeBot 에게 /start 를 먼저 보내고 다시 실행하세요.\n")
    except Exception as e:
        print(f"[Error] {e}")
    return None

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--get-chat-id":
        get_my_chat_id()
        sys.exit(0)

    try:
        poll_updates()
    except KeyboardInterrupt:
        print("\n[Stopped] RecipeBridge 텔레그램 봇이 종료되었습니다.")
        sys.exit(0)
