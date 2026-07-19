#!/usr/bin/env python3
import json
import os
import time
import urllib.request
import urllib.parse
import concurrent.futures

# ──────────────────────────────────────────────────────────────
#  RecipeBridge 자발적 일과(Cron) 연쌍 자동화 스케줄러 (Reflection Loop Integrated)
# ──────────────────────────────────────────────────────────────

PORT = 8000
BACKEND_URL = f"http://localhost:{PORT}"
MAX_HANDOFFS = 5

def append_to_log_md(agent, cmd_type, summary, links=""):
    """log.md에 실시간 피드 항목 추가"""
    log_path = os.path.join(os.path.dirname(__file__), "..", "..", "log.md")
    now = time.localtime()
    date_str = time.strftime("%Y-%m-%d %H:%M", now)
    entry = f"{date_str} | {cmd_type} | [{agent.upper()}] {summary} | {links}\n"
    try:
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(entry)
    except Exception as e:
        print(f"[Error] Failed to write to log.md: {e}")

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
                # Clean up markdown comment ends or asterisks
                filepath = filepath.replace('-->', '').replace('*', '').strip()
                break
        if not filepath:
            filepath = f"output_{len(blocks)}.txt"
        blocks.append((filepath, content))
    return blocks

def execute_daily_routine():
    """Real Business Mode: Parallel execution for all agents."""
    print("="*60)
    print("  [Cron Routine] RecipeBridge Real Business Mode (Parallel)")
    print("="*60)
    
    os.system("git pull origin main --rebase || echo 'Git pull failed or skipped'")
    
    plan_path = os.path.join(os.path.dirname(__file__), "..", "..", "02_Wiki", "projects", "recipebridge_action_plan.md")
    if not os.path.exists(plan_path):
        print("Action plan not found.")
        return
        
    with open(plan_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    current_agent = None
    tasks_to_run = []
    agents_found = set()
    
    for i, line in enumerate(lines):
        if line.startswith("### 👤"):
            if "Aegis" in line: current_agent = "aegis"
            elif "Nova" in line: current_agent = "nova"
            elif "Vivid" in line: current_agent = "vivid"
            elif "Bitz" in line: current_agent = "bitz"
            elif "Echo" in line: current_agent = "echo"
            elif "Carey" in line: current_agent = "carey"
            elif "Insight" in line: current_agent = "insight"
            elif "Verity" in line: current_agent = "verity"
        
        if line.strip().startswith("- [ ]") and current_agent:
            if current_agent not in agents_found:
                target_task = line.strip().replace("- [ ]", "").strip()
                tasks_to_run.append((current_agent, target_task, i))
                agents_found.add(current_agent)
            
    if not tasks_to_run:
        print("모든 태스크가 완료되었습니다! (No pending tasks found)")
        return
        
    print(f"\n[Parallel Tasks Found] 총 {len(tasks_to_run)}명의 에이전트가 동시에 작업을 시작합니다.")
    for agent, task, _ in tasks_to_run:
        print(f" - {agent}: {task}")
        
    def worker(agent, task, line_idx):
        prompt = (
            f"당신의 이번 실무 태스크입니다: {task}\n\n"
            "작업을 수행하고 결과물은 반드시 ```확장자\\n...``` 형식의 코드 블록으로 감싸주세요. "
            "파일에 저장될 내용입니다. 코드 블록 첫 줄에 반드시 주석으로 파일명(예: // filepath: src/App.jsx 또는 <!-- filepath: 02_Wiki/design.md -->)을 명시해 주세요."
        )
        reply = call_agent_api(agent, prompt)
        return agent, task, line_idx, reply

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=len(tasks_to_run)) as executor:
        futures = [executor.submit(worker, a, t, idx) for a, t, idx in tasks_to_run]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    all_saved_files = []
    completed_reports = []
    
    base_dir = os.path.join(os.path.dirname(__file__), "..", "..")
    for agent, task, line_idx, reply in results:
        if _is_paused_reply(reply):
            print(f"[{agent}] 토큰 제한 중단 (Pause). 작업 스킵.")
            continue
            
        print(f" -> {agent} 작업 완료 (응답 크기: {len(reply)} 자)")
        blocks = _extract_code_blocks(reply)
        agent_saved = []
        for filepath, content in blocks:
            clean_path = filepath.strip()
            if clean_path.startswith('/'): clean_path = clean_path[1:]
            full_path = os.path.normpath(os.path.join(base_dir, clean_path))
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content)
            agent_saved.append(clean_path)
            all_saved_files.append(clean_path)
            print(f"   └─ 파일 저장 성공: {clean_path}")
            
        lines[line_idx] = lines[line_idx].replace("- [ ]", "- [x]", 1)
        completed_reports.append(f"- {agent}: {task} (파일: {', '.join(agent_saved) if agent_saved else '없음'})")
        
        # log.md에 실시간 기록 추가
        links = f"[[{agent_saved[0]}]]" if agent_saved else ""
        append_to_log_md(agent, "task", f"태스크 완료: {task}", links)
        
    with open(plan_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
        
    if not completed_reports:
        return
        
    # Aegis Report (모니터링 및 어드바이징 통합)
    aegis_prompt = (
        "다음은 현재 주기에 완료된 각 에이전트들의 태스크 결과 요약입니다:\n" +
        "\n".join(completed_reports) +
        "\n\n마스터로서 나머지 에이전트들의 수행 결과를 모니터링하고, "
        "전체 사업의 방향성에 어긋나지 않는지 어드바이징 하는 짧고 명확한 사장님 보고용(텔레그램) 브리핑 문구를 작성해 주세요."
    )
    aegis_reply = call_agent_api("aegis", aegis_prompt)
    
    creds = load_credentials()
    telegram_text = (
        f"🔔 *[RecipeBridge 실무 모드 병렬 처리 완료]*\n\n"
        f"✅ *처리된 태스크 내역*:\n" + "\n".join(completed_reports) + "\n\n"
        f"🛡️ *Aegis 총괄 브리핑*:\n{aegis_reply}"
    )
    send_telegram_message(creds["telegram_token"], creds["telegram_chat_id"], telegram_text)
    
    print("\n[Git Sync] 자동 저장 (git push)...")
    os.system("git add .")
    os.system('git commit -m "Auto-sync: Parallel agents completed tasks"')
    os.system("git push origin main || echo 'Git push failed'")
    print("[SUCCESS] Real Business Mode 병렬 루틴 완료!\n")

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
            time.sleep(10800)  # 3시간 주기로 연장 (토큰 최적화)
            execute_daily_routine()
    except KeyboardInterrupt:
        print("\n[Scheduler Stopped] 자발적 스케줄러가 종료되었습니다.")

if __name__ == "__main__":
    main()
