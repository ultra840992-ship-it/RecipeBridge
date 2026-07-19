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

def execute_daily_routine():
    """24시간 상시 자동 연쇄 실무 (MIT Reflection Loop 탑재)"""
    print("\n" + "="*60)
    print("  [Cron Routine] RecipeBridge AI 에이전트 자발적 일과 연쇄 시작")
    print("  (MIT Reflection 기반 상호 비판 루프 적용)")
    print("="*60)
    
    handoff_count = 0
    work_log = []
    
    # ── [1단계] CS Carey: GA4 이탈 추적 및 개선 피드백 리포트 작성 ──
    handoff_count += 1
    print(f"\n[Handoff {handoff_count}/{MAX_HANDOFFS}] CS Carey 일과 기동...")
    carey_prompt = "금일 자발적 일과를 기동합니다. GA4 이탈률 병목 분석 보고서 초안과 가입 중단 고객 복귀를 위한 메일링 백로그 문구를 작성해 주세요."
    carey_reply = call_agent_api("carey", carey_prompt)
    print(f" -> Carey 완료 (응답 크기: {len(carey_reply)} 자)")
    work_log.append(f"### [CS] Carey 리포트\n{carey_reply}")
    if _is_paused_reply(carey_reply):
        print("\n[토큰 제한 중] Carey 무역 수신 후 시스템으로부터 Pause 신호 감지. 연쌍 일과 전체 코루틴 즉시 중단합니다.")
        return
    
    # ── [2단계] 마케터 Echo: SEO 지표 감지 및 신규 바이럴 카드뉴스 기획 ──
    handoff_count += 1
    print(f"\n[Handoff {handoff_count}/{MAX_HANDOFFS}] 마케터 Echo 일과 기동...")
    echo_prompt = f"Carey의 CS 보고서 내용을 참고하여, 신규 회원 유치를 위한 구글 서치 콘솔 최적화 키워드 선별 및 카드뉴스 SNS 문구를 구성해 주세요.\n\n참고자료:\n{carey_reply}"
    echo_reply = call_agent_api("echo", echo_prompt)
    print(f" -> Echo 완료 (응답 크기: {len(echo_reply)} 자)")
    work_log.append(f"### [마케팅] Echo 기획안\n{echo_reply}")
    if _is_paused_reply(echo_reply):
        print("\n[토큰 제한 중] Echo 무역 수신 후 Pause 신호 감지. 연쌍 업무 의시정지 수행 중단합니다.")
        return

    # ── [3단계] 기획자 Nova: 취업 연령 제한 고통 해소를 위한 블라인드 매칭 레시피 설계 ──
    handoff_count += 1
    print(f"\n[Handoff {handoff_count}/{MAX_HANDOFFS}] 기획자 Nova 일과 기동...")
    nova_prompt = f"Echo가 추출한 마케팅 핵심어와 Carey의 가입 이탈 피드백을 수용하여, 나이/학벌 필터가 없는 블라인드 매칭 명세서 기획서와 1주 단위 마이크로 프로젝트 과제 스펙을 정비해 주세요.\n\n참고자료:\n{echo_reply}"
    nova_reply = call_agent_api("nova", nova_prompt)
    print(f" -> Nova 완료 (응답 크기: {len(nova_reply)} 자)")
    work_log.append(f"### [기획] Nova 과제 명세서\n{nova_reply}")
    if _is_paused_reply(nova_reply):
        print("\n[토큰 제한 중] Nova 무역 수신 후 Pause 신호 감지. 연쌍 일과 중단합니다.")
        return

    # ── [4단계] 디자이너 Vivid: 기획안에 기반한 Frosted Glass UI 토큰 및 스타일 가이드 ──
    handoff_count += 1
    print(f"\n[Handoff {handoff_count}/{MAX_HANDOFFS}] 디자이너 Vivid 일과 기동...")
    vivid_prompt = f"Nova의 블라인드 매칭 명세를 담아낼 프론트엔드 UI 와이어프레임 설계 및 샴페인 골드 테마 디자인 가이드를 CSS 변수 구조로 빌드해 주세요.\n\n참고자료:\n{nova_reply}"
    vivid_reply = call_agent_api("vivid", vivid_prompt)
    print(f" -> Vivid 완료 (응답 크기: {len(vivid_reply)} 자)")
    work_log.append(f"### [디자인] Vivid CSS 스펙\n{vivid_reply}")
    if _is_paused_reply(vivid_reply):
        print("\n[토큰 제한 중] Vivid 무역 수신 후 Pause 신호 감지. 연쌍 일과 중단합니다.")
        return

    # ── [5단계] 개발자 Bitz: UI 가이드에 맞춘 신규 컴포넌트 마크업 1차 빌드 ──
    handoff_count += 1
    print(f"\n[Handoff {handoff_count}/{MAX_HANDOFFS}] 개발자 Bitz 1차 소스 빌드 기동...")
    bitz_prompt_1 = f"Vivid의 CSS 가이드와 Nova의 과제 기획 명세를 바탕으로, 신규 블라인드 포트폴리오 기여 인증 컴포넌트 소스 구조를 1차 작성해 주세요.\n\n참고자료:\n{vivid_reply}"
    bitz_reply_1 = call_agent_api("bitz", bitz_prompt_1)
    print(f" -> Bitz 1차 완료 (응답 크기: {len(bitz_reply_1)} 자)")
    work_log.append(f"### [개발] Bitz 1차 소스코드\n{bitz_reply_1}")
    if _is_paused_reply(bitz_reply_1):
        print("\n[토큰 제한 중] Bitz 1차 수신 후 Pause 신호 감지. 연쌍 일과 중단합니다.")
        return

    # ── ★ [MIT Reflection 루프] 마스터 Aegis의 1차 비판 및 딴지 (Critic) ──
    print("\n" + "-"*60)
    print("  [MIT Reflection] 마스터 Aegis의 Bitz 개발물에 대한 딴지/비판(Critic) 가동")
    print("-"*60)
    aegis_critique_prompt = (
        "Bitz가 제출한 1차 개발 소스코드에 대해 코너 케이스 예외 처리 미흡, 토큰 절약 최적화 부족 등의 관점에서 "
        "구체적으로 따끔하게 결점을 지적하고(Critic), 소스코드를 어떻게 보완해야 할지 2차 가이드를 상세히 내려주세요.\n\n"
        f"Bitz의 1차 개발물:\n{bitz_reply_1}"
    )
    aegis_critique = call_agent_api("aegis", aegis_critique_prompt)
    print(f" -> Aegis 크리틱 완료 (지적사항 크기: {len(aegis_critique)} 자)")
    work_log.append(f"### [마스터 크리틱] Aegis의 딴지 피드백\n{aegis_critique}")

    # ── ★ [Reflection 수정 단계] 개발자 Bitz의 2차 피드백 반영 최종 빌드 ──
    print("\n" + "-"*60)
    print("  [Reflection] Bitz의 마스터 크리틱 수용 및 2차 최종 개선 코드 빌드")
    print("-"*60)
    bitz_prompt_2 = (
        "마스터 Aegis의 따끔한 크리틱 지적사항을 수용하여, 1차 코드의 결함을 보완하고 "
        "예외 처리가 정교하게 보강된 최종 소스코드를 작성해 주세요.\n\n"
        f"Aegis의 크리틱:\n{aegis_critique}"
    )
    bitz_reply_2 = call_agent_api("bitz", bitz_prompt_2)
    print(f" -> Bitz 2차 최종 빌드 완료 (응답 크기: {len(bitz_reply_2)} 자)")
    work_log.append(f"### [개발 - 최종반영] Bitz 2차 소스코드\n{bitz_reply_2}")

    # ── [QA & 최종 승인 게이트] 마스터 Aegis: 5대 필터링 QA 및 사장님 승인용 텔레그램 연동 ──
    print("\n" + "-"*60)
    print(f"  [최종 QA 및 마스터 검수 게이트 가동]")
    print("-"*60)
    
    aegis_prompt = (
        "상호 비판(Reflection) 루프가 끝났습니다. Bitz의 2차 최종 수정본을 검수하고, "
        "사장님(대표)에게 최종 Confirm을 받기 위한 브리핑 요약문(Korean)을 신뢰감 있게 작성해 주세요. "
        "반드시 피드백 루프에서 보완된 사항을 보고에 명시해 주세요.\n\n"
        f"전체 성과물 로그:\n" + "\n\n".join(work_log)
    )
    aegis_reply = call_agent_api("aegis", aegis_prompt)
    print(f" -> Aegis 최종 검수 완료.")
    
    # 텔레그램 사장 보고
    creds = load_credentials()
    telegram_text = (
        f"🔔 *[RecipeBridge AI 에이전트 자발적 일과 보고]*\n\n"
        f"6인 협업 체인 및 MIT 리플렉션(비판-반영) 루프가 무사히 종료되었습니다.\n\n"
        f"{aegis_reply}\n\n"
        f"📥 *사장님의 Confirm(승인) 또는 추가 지시를 대기합니다.*"
    )
    
    send_telegram_message(creds["telegram_token"], creds["telegram_chat_id"], telegram_text)
    
    print("\n========================================================")
    print("  [SUCCESS] 리플렉션 루프를 거친 연쇄 업무 및 사장님 알림 발송 완료!")
    print("========================================================\n")

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
