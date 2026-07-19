#!/usr/bin/env python3
import json
import os
import time
import urllib.request
import urllib.parse

# ──────────────────────────────────────────────────────────────
#  RecipeBridge 자발적 일과(Cron) 연쌍 자동화 스케줄러 (Reflection Loop Integrated)
# ──────────────────────────────────────────────────────────────

PORT = 8000
BACKEND_URL = f"http://localhost:{PORT}"
MAX_HANDOFFS = 5

# ★ 일시정지(Pause) 중단 시그널 문자열 패턴
_PAUSE_SIGNAL = "[System]"

def _is_paused_reply(text: str) -> bool:
    """레플라이 텍스트가 일시정지 시스템 메시지인지 상취 확인"""
    return _PAUSE_SIGNAL in text and "토큰 사용 제한" in text

def load_credentials():
    """env/환경변수에서 Gemini API Key 및 텔레그램 설정 로드"""
    creds = {
        "gemini_key": os.getenv("GEMINI_API_KEY"),
        "telegram_token": os.getenv("TELEGRAM_BOT_TOKEN"),
        "telegram_chat_id": os.getenv("TELEGRAM_ALLOWED_CHAT_ID")
    }
    
    env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    key, val = line.strip().split("=", 1)
                    val_cleaned = val.replace("\r", "").replace("\n", "").strip("'\" ")
                    if key == "GEMINI_API_KEY":
                        creds["gemini_key"] = val_cleaned
                    elif key == "TELEGRAM_BOT_TOKEN":
                        creds["telegram_token"] = val_cleaned
                    elif key == "TELEGRAM_ALLOWED_CHAT_ID":
                        creds["telegram_chat_id"] = val_cleaned
    return creds

def send_telegram_message(token, chat_id, text):
    """최종 승인 보고용 텔레그램 메시지 발송"""
    if not token or not chat_id or "INSERT_" in token:
        print("[Telegram] 설정 누락으로 발송 생략.")
        return False
        
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    }
    
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url, data=data, headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as res:
            if res.status == 200:
                print("[Telegram] 사장님께 실시간 보고 전송 성공!")
                return True
    except Exception as e:
        print(f"[Telegram Error] 발송 실패: {e}")
    return False

def call_agent_api(agent_key, prompt):
    """live_server.py 로컬 백엔드를 통해 라이브 에이전트 AI 답변 획득"""
    url = f"{BACKEND_URL}/api/chat"
    payload = {"agent": agent_key, "message": prompt}
    
    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url, data=data, headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=40) as res:
            response = json.loads(res.read().decode("utf-8"))
            replies = response.get("replies", [])
            if replies:
                return replies[0].get("text", "")
            return ""
    except Exception as e:
        print(f"[API Error] Agent {agent_key} 호출 실패: {e}")
        return f"[Error] API 호출 실패: {e}"

import re

def _extract_code_blocks(text):
    blocks = []
    pattern = re.compile(r'```(\w+)?\n(.*?)```', re.DOTALL)
    for match in pattern.finditer(text):
        content = match.group(2)
        filepath = None
        for line in content.split('\n')[:3]:
            if 'filepath:' in line.lower():
                filepath = line.split('filepath:')[1].strip()
                break
        if not filepath:
            filepath = f"output_{len(blocks)}.txt"
        blocks.append((filepath, content))
    return blocks

def execute_daily_routine():
    """Real Business Mode: Reads tasks from Action Plan and executes them by saving files."""
    print("="*60)
    print("  [Cron Routine] RecipeBridge Real Business Mode 가동")
    print("="*60)
    
    os.system("git pull origin main --rebase || echo 'Git pull failed or skipped'")
    
    plan_path = os.path.join(os.path.dirname(__file__), "..", "..", "02_Wiki", "projects", "recipebridge_action_plan.md")
    if not os.path.exists(plan_path):
        print("Action plan not found.")
        return
        
    with open(plan_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    current_agent = None
    target_task = None
    target_agent = None
    target_line_idx = -1
    
    for i, line in enumerate(lines):
        if line.startswith("### 👤"):
            if "Aegis" in line: current_agent = "aegis"
            elif "Nova" in line: current_agent = "nova"
            elif "Vivid" in line: current_agent = "vivid"
            elif "Bitz" in line: current_agent = "bitz"
            elif "Echo" in line: current_agent = "echo"
            elif "Carey" in line: current_agent = "carey"
        
        if line.strip().startswith("- [ ]") and current_agent:
            target_task = line.strip().replace("- [ ]", "").strip()
            target_agent = current_agent
            target_line_idx = i
            break
            
    if not target_task:
        print("모든 태스크가 완료되었습니다! (No pending tasks found)")
        return
        
    print(f"\n[Task Found] {target_agent}에게 다음 태스크를 할당합니다: {target_task}")
    
    prompt = (
        f"당신의 이번 실무 태스크입니다: {target_task}\n\n"
        "작업을 수행하고 결과물은 반드시 ```확장자\\n...``` 형식의 코드 블록으로 감싸주세요. "
        "파일에 저장될 내용입니다. 코드 블록 첫 줄에 반드시 주석으로 파일명(예: // filepath: src/App.jsx 또는 <!-- filepath: 02_Wiki/design.md -->)을 명시해 주세요."
    )
    
    reply = call_agent_api(target_agent, prompt)
    if _is_paused_reply(reply):
        print("\n[토큰 제한 중] Pause 신호 감지. 중단합니다.")
        return
        
    print(f" -> {target_agent} 작업 완료 (응답 크기: {len(reply)} 자)")
    
    # Extract blocks and write files
    blocks = _extract_code_blocks(reply)
    saved_files = []
    base_dir = os.path.join(os.path.dirname(__file__), "..", "..")
    for filepath, content in blocks:
        # Sanitize filepath
        clean_path = filepath.strip()
        if clean_path.startswith('/'): clean_path = clean_path[1:]
        full_path = os.path.normpath(os.path.join(base_dir, clean_path))
        
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        saved_files.append(clean_path)
        print(f" -> 파일 저장 성공: {clean_path}")
        
    # Mark task as completed
    lines[target_line_idx] = lines[target_line_idx].replace("- [ ]", "- [x]", 1)
    with open(plan_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
        
    # Aegis Report
    aegis_prompt = (
        f"{target_agent}가 다음 태스크를 수행했습니다: {target_task}\n"
        f"저장된 파일: {', '.join(saved_files)}\n\n"
        "사장님께 현재 진척도를 보고하는 짧고 명확한 텔레그램 브리핑 문구를 작성해 주세요."
    )
    aegis_reply = call_agent_api("aegis", aegis_prompt)
    
    creds = load_credentials()
    telegram_text = (
        f"🔔 *[RecipeBridge 실무 모드 보고]*\n\n"
        f"✅ *태스크 완료*: {target_task}\n"
        f"📁 *생성/수정된 파일*: {', '.join(saved_files) if saved_files else '없음'}\n\n"
        f"🛡️ *Aegis 보고*:\n{aegis_reply}"
    )
    send_telegram_message(creds["telegram_token"], creds["telegram_chat_id"], telegram_text)
    
    print("\n[Git Sync] 자동 저장 (git push)...")
    os.system("git add .")
    os.system(f'git commit -m "Auto-sync: {target_agent} completed task"')
    os.system("git push origin main || echo 'Git push failed'")
    print("[SUCCESS] Real Business Mode 루틴 완료!\n")

def main():
    print("="*60)
    print("  RecipeBridge 24시간 상시 AI 사원 스케줄러 기동")
    print("  (백그라운드 루프가 가동되며 매 1시간마다 소스 감지 및 일과 진행)")
    print("="*60)
    
    # 기동 즉시 최초 1회 연쇄 일과 실행
    execute_daily_routine()
    
    # 24시간 백그라운드 주기 실행
    try:
        while True:
            time.sleep(3600)
            execute_daily_routine()
    except KeyboardInterrupt:
        print("\n[Scheduler Stopped] 자발적 스케줄러가 종료되었습니다.")

if __name__ == "__main__":
    main()
