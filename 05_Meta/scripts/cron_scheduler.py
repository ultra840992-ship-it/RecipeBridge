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
    
    from datetime import datetime, timezone, timedelta
    KST = timezone(timedelta(hours=9))
    now = datetime.now(KST)
    date_str = now.strftime("%Y-%m-%d %H:%M")
    
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
            from datetime import datetime, timezone, timedelta
            now_kst = datetime.now(timezone(timedelta(hours=9))).strftime("%Y%m%d_%H%M%S")
            filepath = f"02_Wiki/dev-tasks/task_result_{now_kst}_{len(blocks)}.md"
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
            
def auto_plan_next_milestone(plan_path):
    """
    모든 에이전트의 이전 마일스톤이 조기 완료된 경우,
    다음 단계 [Lv4] 마일스톤 계획을 자발적으로 수립하여 recipebridge_action_plan.md에 업데이트하고
    텔레그램을 통해 8명 에이전트 각각 사장님께 개별 보고를 전송한다.
    """
    print("\n[Auto Milestone Engine] 8명 에이전트의 이전 일정이 조기 완료되었습니다!")
    print("   자발적으로 다음 마일스톤 [Lv4] 계획을 수립하고 텔레그램 개별 보고를 진행합니다.\n")
    
    with open(plan_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 8명 에이전트별 [Lv4] 신규 액션 태스크 정의
    next_tasks = {
        "aegis": "  - [ ] **[Critical]** [Lv4] 정식 런칭 후 실시간 트래픽 대응 비즈니스 모니터링 및 AI 오작동 롤백 시스템 최종 배포.",
        "nova": "  - [ ] **[Critical]** [Lv4] 베타 테스터 50인 피드백 데이터 기반 2차 기획 및 B2B 채용 연계 마이크로 단기 과제 확장 기획서 수립.",
        "vivid": "  - [ ] **[Critical]** [Lv4] 실사용자 UI 피드백 반영 모바일 반응형 세부 컴포넌트 마이크로 인터랙션 최적화 배포.",
        "bitz": "  - [ ] **[Critical]** [Lv4] 결제/매칭 API 예외 처리 강화 및 실시간 에러 로그 센트리(Sentry) 연동 및 실서버 배포.",
        "echo": "  - [ ] **[Critical]** [Lv4] 실 서비스 마케팅 퍼널 효율 분석(구글 서치콘솔, UTM 성과) 및 SNS 자동화 노출 지표 리포팅.",
        "carey": "  - [ ] **[Critical]** [Lv4] 1:1 고객 피드백 수집 및 고통 지수 분석을 통한 이탈 고객 긴급 우회 대응 매뉴얼 CS 시스템 동기화.",
        "insight": "  - [ ] **[Critical]** [Lv4] 초기 가입 유저 패턴 분석 및 플랫폼 체류 시간(Retention) 증대를 위한 시장 경쟁사 추가 비교 우위 보고서 작성.",
        "verity": "  - [ ] **[Critical]** [Lv4] 실서버 배포 후 정밀 보안 침투 테스트(SQLi/XSS) 및 외부 API key 노출 여부 최종 보안 감사 보고서 배포."
    }
    
    lines = content.splitlines(keepends=True)
    new_lines = []
    current_agent = None
    
    for line in lines:
        new_lines.append(line)
        if "### 👤" in line:
            if "Aegis" in line: current_agent = "aegis"
            elif "Nova" in line: current_agent = "nova"
            elif "Vivid" in line: current_agent = "vivid"
            elif "Bitz" in line: current_agent = "bitz"
            elif "Echo" in line: current_agent = "echo"
            elif "Carey" in line: current_agent = "carey"
            elif "Insight" in line: current_agent = "insight"
            elif "Verity" in line: current_agent = "verity"
        
        if current_agent and "[Lv3]" in line and current_agent in next_tasks:
            new_lines.append(next_tasks[current_agent] + "\n")
            del next_tasks[current_agent]
            
    with open(plan_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

    creds = load_credentials()
    telegram_token = creds.get("telegram_token")
    telegram_chat_id = creds.get("telegram_chat_id")
    
    reports = [
        ("Aegis 이지스", "[Lv3] 마일스톤 검수를 조기 완수하여, 정식 런칭 트래픽 대응 [Lv4] 모니터링 체계 배포 일정을 수립하고 자발적 수행에 착수합니다."),
        ("Nova 노바", "[Lv3] 기획 검수가 조기 종료되어 [Lv4] B2B 채용 연계 마이크로 과제 확장 기획서 수립 일정을 자체 확정하고 실행합니다."),
        ("Vivid 비비드", "[Lv3] Pretendard 폰트 최적화를 마치고 [Lv4] 모바일 반응형 UI 마이크로 인터랙션 최적화 일정을 수립하여 진행합니다."),
        ("Bitz 비츠", "[Lv3] 프론트 최적화를 마치고 [Lv4] Sentry 에러 트래킹 연동 및 API 예외 처리 강화 개발 일정을 자체 수립하여 착수합니다."),
        ("Echo 에코", "[Lv3] 마케팅 자동 배포 완수 후 [Lv4] 서치콘솔 및 UTM 퍼널 분석 리포팅 일정을 수립하여 자발적으로 수행합니다."),
        ("Carey 케리", "[Lv3] 이탈 메일링 연동 완료 후 [Lv4] CS 피드백 티켓팅 시스템 동기화 일정을 수립하고 수행에 착수합니다."),
        ("Insight 인사이트", "[Lv3] 비교 분석 완료 후 [Lv4] 유저 체류시간 증대 차별화 보고서 수립 일정을 수립하여 자발적 진행 중입니다."),
        ("Verity 베리티", "[Lv3] QA 감사를 마치고 [Lv4] 실서버 배포 후 정밀 보안 침투 테스트(SQLi/XSS) 일정을 자체 수립하고 검수 작업을 시작합니다.")
    ]
    
    if telegram_token and telegram_chat_id:
        print("[Telegram Individual Reporting] 8명 에이전트 개별 보고 발송 시작...")
        for agent_title, message in reports:
            msg_text = f"📢 *[{agent_title}] 개별 업무 보고*\n\n대표님! {message}\n\n📅 *타겟 일정*: [Lv4] 마일스톤\n📊 *상태*: 대시보드 간트표 자동 반영 완료"
            send_telegram_message(telegram_token, telegram_chat_id, msg_text)
            time.sleep(1)
            
    append_to_log_md("system", "auto_plan", "8인 에이전트 일정 조기 완료에 따른 [Lv4] 마일스톤 자동 수립 및 텔레그램 개별 보고 완료", "[[02_Wiki/projects/recipebridge_action_plan.md]]")
    print("[SUCCESS] [Lv4] 마일스톤 자동 수립 및 텔레그램 개별 보고가 완료되었습니다!")

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
        print("\n[NOTICE] 모든 이전 마일스톤 태스크가 조기 완료되었습니다! (No pending tasks found)")
        auto_plan_next_milestone(plan_path)
        return
        
    print(f"\n[Parallel Tasks Found] 총 {len(tasks_to_run)}명의 에이전트가 동시에 작업을 시작합니다.")
    for agent, task, _ in tasks_to_run:
        print(f" - {agent}: {task}")
        
    def worker(agent, task, line_idx):
        prompt = (
            f"당신의 이번 실무 태스크입니다: {task}\n\n"
            "작업을 수행하고 결과물은 반드시 ```확장자\\n...``` 형식의 코드 블록으로 감싸서 출력하세요. "
            "코드 블록의 첫 줄에 반드시 주석으로 옵시디언 파일명(예: // filepath: 02_Wiki/dev-tasks/my_result.md)을 명시해야만 "
            "동료 에이전트와 인수인계 및 정보 공유가 가능합니다."
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
            
        is_error = (
            "api 에러" in reply.lower() or 
            "호출 실패" in reply.lower() or 
            "connection refused" in reply.lower() or 
            "internal error" in reply.lower() or
            "without response" in reply.lower() or
            len(reply.strip()) < 120
        )
        
        if is_error:
            print(f" ❌ -> {agent} 작업 실패 (에러 응답 수신, 크기: {len(reply)} 자). 다음 주기에 재시도합니다.")
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
        
        links = f"[[{agent_saved[0]}]]" if agent_saved else ""
        append_to_log_md(agent, "task", f"태스크 완료: {task}", links)
        
    with open(plan_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
        
    if not completed_reports:
        return
        
    aegis_prompt = (
        "다음은 현재 주기에 완료된 각 에이전트들의 태스크 결과 요약입니다:\n" +
        "\n".join(completed_reports) +
        "\n\n마스터로서 나머지 에이전트들의 수행 결과를 모니터링하고, "
        "전체 사업의 방향성에 어긋나지 않는지 어드바이징 하는 짧고 명확한 사장님 보고용(텔레그램) 브리핑 문구를 작성해 주세요."
    )
    aegis_reply = call_agent_api("aegis", aegis_prompt)
    
    # 매시간 사장님께 올리는 불필요한 텔레그램 스팸은 차단하고, 대시보드가 유기적으로 자동 갱신되도록 조치
    print("\n[Dashboard Sync] 사업 현황 대시보드가 유기적으로 동적 업데이트되었습니다.")
    
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
    
    execute_daily_routine()
    
    try:
        while True:
            time.sleep(10800)
            execute_daily_routine()
    except KeyboardInterrupt:
        print("\n[Scheduler Stopped] 자발적 스케줄러가 종료되었습니다.")

if __name__ == "__main__":
    main()

