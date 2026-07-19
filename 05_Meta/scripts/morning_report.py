#!/usr/bin/env python3
"""
RecipeBridge 매일 아침 7:30 자동 브리핑 스크립트
- log.md + 02_Wiki/projects/ 최근 내용 읽기
- Aegis 프로필로 Gemini API 호출 → 전일 업무 요약 + 이슈 + 의사결정 필요 사항 생성
- 텔레그램 채널로 전송
"""
import sys
import io
import os
import json
import datetime
import urllib.request
import urllib.parse

# Windows UTF-8 콘솔 픽스
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf8'):
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))

# ── 자격증명 로드 ──────────────────────────────────────
def load_env():
    creds = {}
    env_path = os.path.join(PROJECT_ROOT, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    k, v = line.strip().split("=", 1)
                    creds[k] = v.strip("'\" \r\n")
    return creds

ENV = load_env()
GEMINI_API_KEY   = ENV.get("GEMINI_API_KEY", "")
TELEGRAM_TOKEN   = ENV.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = ENV.get("TELEGRAM_ALLOWED_CHAT_ID", "")

# ── 위키 컨텍스트 수집 ──────────────────────────────────
def read_file_safe(path, max_chars=3000):
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        return content[-max_chars:] if len(content) > max_chars else content
    except Exception:
        return ""

def gather_context():
    """log.md, index.md, projects 폴더에서 최신 컨텍스트 수집"""
    today = datetime.date.today()
    yesterday = today - datetime.timedelta(days=1)

    sections = []

    # 1. 로그
    log_raw = read_file_safe(os.path.join(PROJECT_ROOT, "log.md"), 4000)
    if log_raw:
        # 어제 날짜 줄만 필터
        relevant = [l for l in log_raw.split("\n")
                    if str(yesterday) in l or str(today) in l or "|" in l]
        sections.append("## 최근 Activity Log\n" + "\n".join(relevant[-30:]))

    # 2. 프로젝트 파일들
    projects_dir = os.path.join(PROJECT_ROOT, "02_Wiki", "projects")
    if os.path.exists(projects_dir):
        for fname in sorted(os.listdir(projects_dir))[-3:]:
            fp = os.path.join(projects_dir, fname)
            if fname.endswith(".md"):
                content = read_file_safe(fp, 1500)
                sections.append(f"## 프로젝트 파일: {fname}\n{content}")

    # 3. index.md 요약
    index_raw = read_file_safe(os.path.join(PROJECT_ROOT, "index.md"), 2000)
    if index_raw:
        sections.append(f"## index.md\n{index_raw}")

    return "\n\n".join(sections) if sections else "컨텍스트 없음"

# ── Aegis Gemini 호출 ───────────────────────────────────
def load_aegis_profile():
    base = os.path.join(SCRIPT_DIR, "..", "agents", "aegis")
    parts = []
    for doc in ["soul.md", "user.md", "agent.md", "memory.md"]:
        p = os.path.join(base, doc)
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    parts.append(f"[{doc}]\n{f.read()}")
            except Exception:
                pass
    return "\n\n---\n\n".join(parts) if parts else "You are Aegis, the Master Coordinator of RecipeBridge."

def call_gemini(system_prompt, user_prompt):
    if not GEMINI_API_KEY:
        return "[오류] GEMINI_API_KEY가 설정되지 않았습니다."
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    full = f"{system_prompt}\n\n---\n\n{user_prompt}"
    payload = {
        "contents": [{"parts": [{"text": full}]}],
        "generationConfig": {"temperature": 0.6, "maxOutputTokens": 3000}
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=90) as res:
            r = json.loads(res.read().decode("utf-8"))
            return r["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        return f"[Gemini 오류] {e}"

# ── 텔레그램 전송 ──────────────────────────────────────
def send_telegram(text):
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        print("[오류] 텔레그램 설정 없음")
        return False
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    # 4096자 제한 분할 전송
    chunks = [text[i:i+3900] for i in range(0, len(text), 3900)]
    for chunk in chunks:
        payload = {"chat_id": TELEGRAM_CHAT_ID, "text": chunk, "parse_mode": "Markdown"}
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=15) as res:
                r = json.loads(res.read().decode("utf-8"))
                if not r.get("ok"):
                    print(f"[TG 오류] {r}")
        except Exception as e:
            print(f"[TG 전송 실패] {e}")
            return False
    return True

# ── 메인 실행 ──────────────────────────────────────────
def main():
    today_str = datetime.date.today().strftime("%Y년 %m월 %d일")
    now_str   = datetime.datetime.now().strftime("%H:%M")
    weekdays  = ["월", "화", "수", "목", "금", "토", "일"]
    dow = weekdays[datetime.date.today().weekday()]

    print(f"[MorningReport] {today_str} ({dow}) 브리핑 생성 시작...")

    context = gather_context()
    aegis_profile = load_aegis_profile()

    prompt = f"""오늘은 {today_str} ({dow}요일) 아침 {now_str}입니다.

아래 위키/로그 컨텍스트를 기반으로, 사장님(HK CHOI)께 드리는 일일 아침 브리핑을 작성해 주세요.
반드시 아래 형식을 엄수하고, 실제 데이터에 없는 내용은 "확인 필요"로 표기하세요.

📋 브리핑 형식:
━━━━━━━━━━━━━━━━━━━━━━━━
🌅 RecipeBridge 아침 브리핑 {today_str} ({dow})
━━━━━━━━━━━━━━━━━━━━━━━━

[1] 전일 주요 업무 완료 현황
- (완료된 태스크 목록, 없으면 "기록 없음")

[2] 진행 중인 과제 및 이슈
- (현재 진행 중인 작업 + 블로커 이슈)

[3] 🔴 사장님 의사결정 필요 사항
- (즉시 결정 필요한 항목, 없으면 "없음")

[4] 오늘 예정 업무
- (각 에이전트별 오늘 할 일 요약)

[5] 메모 / 기타
- (공지, 리스크, 참고사항)

━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ Aegis 드림
━━━━━━━━━━━━━━━━━━━━━━━━

=== 위키/로그 컨텍스트 ===
{context}
"""

    print("[MorningReport] Gemini API 호출 중...")
    report = call_gemini(aegis_profile, prompt)

    print("[MorningReport] 텔레그램 전송 중...")
    ok = send_telegram(report)

    if ok:
        print("[MorningReport] 전송 완료!")
    else:
        print("[MorningReport] 전송 실패 — 로컬 저장")
        # 실패 시 로컬 파일로 저장
        out_path = os.path.join(PROJECT_ROOT, "03_Conversations",
                                f"morning_report_{datetime.date.today()}.md")
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(report)
        print(f"[MorningReport] 저장됨: {out_path}")

if __name__ == "__main__":
    main()
