#!/usr/bin/env python3
import json
import os
import socketserver
import urllib.request
import urllib.parse
import datetime
import threading
import re
from http.server import HTTPServer, BaseHTTPRequestHandler

# ──────────────────────────────────────────────────────────────
#  글로벌 설정 및 동시성 락
# ──────────────────────────────────────────────────────────────
_SETTINGS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "_shared", "settings.json")
_cache_lock = threading.Lock()

def load_settings():
    """_shared/settings.json 로드. 없으면 기본값 반환."""
    defaults = {"paused": False, "pause_reason": "", "paused_at": None,
                "max_daily_calls": 200, "calls_today": 0, "last_reset_date": None}
    try:
        if os.path.exists(_SETTINGS_PATH):
            with open(_SETTINGS_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                defaults.update(data)
    except Exception as e:
        print(f"[Settings] 로드 오류, 기본값 사용: {e}")
    return defaults

def save_settings(settings_dict):
    """_shared/settings.json에 설정 저장"""
    try:
        os.makedirs(os.path.dirname(_SETTINGS_PATH), exist_ok=True)
        with open(_SETTINGS_PATH, "w", encoding="utf-8") as f:
            json.dump(settings_dict, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"[Settings] 저장 오류: {e}")
        return False

def is_paused():
    """현재 에이전트가 일시정지 상태인지 확인"""
    return load_settings().get("paused", False)

class ThreadingHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    """멀티스레드 HTTP 서버 — 그룹 회의 중 다른 요청이 블로킹되지 않도록"""
    daemon_threads = True
    allow_reuse_address = True  # TIME_WAIT 포트 재사용 허용


# ──────────────────────────────────────────────────────────────
#  RecipeBridge Live AI Web Dashboard Backend Server (Gemini API & Multi-Profile)
# ──────────────────────────────────────────────────────────────

PORT = 8000

def parse_action_plan():
    """recipebridge_action_plan.md를 파싱하여 각 에이전트별 태스크 완료율 계산"""
    action_plan_path = os.path.join(os.path.dirname(__file__), "..", "..", "02_Wiki", "projects", "recipebridge_action_plan.md")
    stats = {}
    if not os.path.exists(action_plan_path):
        return stats
    
    current_agent = None
    AGENT_KEYS = {
        "aegis": "aegis", "이지스": "aegis",
        "nova": "nova",   "노바": "nova",
        "vivid": "vivid", "비비드": "vivid",
        "bitz": "bitz",   "비츠": "bitz",
        "echo": "echo",   "에코": "echo",
        "carey": "carey", "케리": "carey",
        "insight": "insight", "인사이트": "insight",
        "verity": "verity", "베리티": "verity"
    }
    try:
        with open(action_plan_path, "r", encoding="utf-8") as f:
            for line in f:
                line_s = line.strip()
                # 에이전트 헤더 감지: ### 로 시작하는 줄에 에이전트 이름 포함
                if line_s.startswith("##"):
                    lower_line = line_s.lower()
                    matched = None
                    for keyword, agent_key in AGENT_KEYS.items():
                        if keyword.lower() in lower_line:
                            matched = agent_key
                            break
                    if matched:
                        current_agent = matched
                        if current_agent not in stats:
                            stats[current_agent] = {"total": 0, "completed": 0, "tasks": []}
                elif current_agent and line_s.startswith("- ["):
                    completed = line_s.startswith("- [x]") or line_s.startswith("- [X]")
                    content = line_s[5:].strip() if len(line_s) > 5 else line_s
                    stats[current_agent]["total"] += 1
                    if completed:
                        stats[current_agent]["completed"] += 1
                    stats[current_agent]["tasks"].append({
                        "text": content,
                        "completed": completed
                    })
    except Exception as e:
        print(f"[Error] Failed to parse action plan: {e}")
    return stats


def parse_logs():
    """log.md 파일을 파싱하여 최근 로그와 통계 추출"""
    log_path = os.path.join(os.path.dirname(__file__), "..", "..", "log.md")
    logs = []
    agent_counts = {}
    if not os.path.exists(log_path):
        return logs, agent_counts
        
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or line.startswith("이 파일") or line.startswith("중요한") or line.startswith("형식") or line.startswith("```"):
                    continue
                if "|" not in line:
                    continue
                parts = [p.strip() for p in line.split("|")]
                if len(parts) >= 3:
                    date_time = parts[0]
                    cmd_type = parts[1]
                    summary = parts[2]
                    links = parts[3] if len(parts) > 3 else ""
                    
                    logs.append({
                        "datetime": date_time,
                        "type": cmd_type,
                        "summary": summary,
                        "links": links
                    })
                    
                    import re
                    match = re.search(r'\[([A-Za-z]+)\]', summary)
                    if match:
                        agent = match.group(1).lower()
                        agent_counts[agent] = agent_counts.get(agent, 0) + 1
                    else:
                        # Fallback for old logs
                        agent_counts["unknown"] = agent_counts.get("unknown", 0) + 1
                        
    except Exception as e:
        print(f"[Error] Failed to parse log.md: {e}")
    
    logs.reverse()  # 최신순
    return logs, agent_counts

def update_index_file(filename, title):
    index_path = os.path.join(os.path.dirname(__file__), "..", "..", "index.md")
    if not os.path.exists(index_path):
        return
    try:
        with open(index_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        meeting_link = f"- [[03_Conversations/{filename.replace('.md', '')}|{title} ({datetime.date.today().strftime('%Y-%m-%d')})]]"
        
        if "## Conversations" in content:
            lines = content.split("\n")
            for idx, line in enumerate(lines):
                if line.strip() == "## Conversations":
                    lines.insert(idx + 1, meeting_link)
                    break
            new_content = "\n".join(lines)
        else:
            decisions_section = "## Decisions"
            if decisions_section in content:
                new_content = content.replace(decisions_section, f"## Conversations\n\n{meeting_link}\n\n{decisions_section}")
            else:
                new_content = content + f"\n\n## Conversations\n\n{meeting_link}\n"
                
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(new_content)
    except Exception as e:
        print(f"[Error] Failed to update index.md: {e}")

# 에이전트 폴백 프롬프트 (제어 문서 로드 유실 대비용)
FALLBACK_SYSTEM_PROMPTS = {
  "aegis": "You are Aegis, the Master Coordinator. Speak in a strict, professional manager tone in Korean.",
  "nova": "You are Nova, the Service Planner. Speak in a smart, business-focused, trendy tone in Korean.",
  "vivid": "You are Vivid, the UI/UX Designer. Speak in a creative, aesthetics-focused designer tone in Korean.",
  "bitz": "You are Bitz, the Developer. Speak in a cool, direct, computer geek tone in Korean.",
  "echo": "You are Echo, the Growth Marketer. Speak in an energetic, growth-obsessed marketer tone in Korean.",
  "carey": "You are Carey, the CS agent. Speak in a polite, customer-centric CS tone in Korean.",
  "insight": "You are Insight, the R&D Agent. Speak in an analytical, sharp, trend-focused tone in Korean.",
  "verity": "You are Verity, the Watchdog Agent. Speak in a strict, logical, fact-checker tone in Korean.",
  "group": "You are Aegis, moderating a group session of RecipeBridge team. Act as the host in Korean."
}

def load_gemini_api_key():
    """env/환경변수에서 Gemini API Key 검색 및 로드"""
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        return api_key

    # .env 파일 폴백 로드
    env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    key, val = line.strip().split("=", 1)
                    val_cleaned = val.replace("\r", "").replace("\n", "").strip("'\" ")
                    if key == "GEMINI_API_KEY":
                        return val_cleaned
                    elif key == "TELEGRAM_BOT_TOKEN":
                        os.environ["TELEGRAM_BOT_TOKEN"] = val_cleaned
                    elif key == "TELEGRAM_ALLOWED_CHAT_ID":
                        os.environ["TELEGRAM_ALLOWED_CHAT_ID"] = val_cleaned
    return None

def load_agent_multi_profile(agent_key):
    """05_Meta/agents/{agent_key}/ 경로 아래 4대 제어 문서를 로드하여 하나의 시스템 프롬프트로 병합"""
    base_dir = os.path.join(os.path.dirname(__file__), "..", "agents", agent_key)
    
    # 그룹 협업방 등 에이전트 외 키 폴백 처리
    if not os.path.exists(base_dir):
        return FALLBACK_SYSTEM_PROMPTS.get(agent_key, FALLBACK_SYSTEM_PROMPTS["aegis"])
        
    control_files = ["soul.md", "user.md", "agent.md", "memory.md"]
    merged_prompts = []
    
    for filename in control_files:
        filepath = os.path.join(base_dir, filename)
        if os.path.exists(filepath):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        merged_prompts.append(f"=== {filename.upper()} ===\n{content}")
            except Exception as e:
                print(f"[Warn] Failed to read {filepath}: {e}")
                
    if merged_prompts:
        return (
            "You must strictly follow the character role, user context, rules, and memory provided below.\n\n"
            + "\n\n".join(merged_prompts)
            + "\n\nCRITICAL RULE: Always speak in Korean, maintaining the specified tone and character of this profile.\n"
            + "SYSTEM OPTIMIZATION: 너는 문제를 해결하기 위해 필요한 최소한의 코드 실행과 도구 호출만 수행해야 한다. "
            + "중간 과정의 불필요한 설명(Chain of Thought)은 출력하지 말고 결과 위주로 간결하게 추론해라. "
            + "또한 다음 에이전트에게 전달될 상태나 결과는 최소한의 핵심 요약 형태로만 전달해라."
        )
    else:
        return FALLBACK_SYSTEM_PROMPTS.get(agent_key, FALLBACK_SYSTEM_PROMPTS["aegis"])

class LiveChatRequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            settings = load_settings()
            self.wfile.write(json.dumps({"status": "connected", "paused": settings.get("paused", False)}).encode("utf-8"))
        elif self.path == "/api/settings":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(load_settings()).encode("utf-8"))
        elif self.path == "/api/dashboard":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            
            action_plan_data = parse_action_plan()
            logs_list, log_stats = parse_logs()
            
            # 실제 프로젝트 정보
            projects = [
                { "id": "micro_project_recipe_platform", "name": "AI 레시피 기반 마이크로 프로젝트 및 신입 경력 인증 플랫폼 사업 기획서", "status": "active" },
                { "id": "recipebridge_multi_agent_setup", "name": "RecipeBridge 멀티 에이전트 운영 설계도 (AI 5인 부서 구축안)", "status": "active" },
                { "id": "recipebridge_action_plan", "name": "RecipeBridge MVP 런칭을 위한 에이전트별 Action List 및 4주 로드맵", "status": "active" }
            ]
            
            dashboard_data = {
                "status": "connected",
                "action_plan": action_plan_data,
                "logs": logs_list,
                "log_stats": log_stats,
                "projects": projects,
                "settings": load_settings()
            }
            self.wfile.write(json.dumps(dashboard_data).encode("utf-8"))
        elif self.path.startswith("/api/search_wiki"):
            query = ""
            if "?" in self.path:
                qs = self.path.split("?", 1)[1]
                from urllib.parse import parse_qs
                parsed_qs = parse_qs(qs)
                query = parsed_qs.get("q", [""])[0].lower()
            
            base_dir = os.path.join(os.path.dirname(__file__), "..", "..")
            results = []
            
            if query:
                search_dirs = ["02_Wiki", "03_Conversations"]
                for s_dir in search_dirs:
                    dir_path = os.path.join(base_dir, s_dir)
                    if not os.path.exists(dir_path): continue
                    for root, dirs, files in os.walk(dir_path):
                        for file in files:
                            if not file.endswith(".md"): continue
                            file_path = os.path.join(root, file)
                            rel_path = os.path.relpath(file_path, base_dir).replace("\\", "/")
                            
                            matched = False
                            snippet = ""
                            if query in file.lower():
                                matched = True
                            
                            try:
                                with open(file_path, "r", encoding="utf-8") as f:
                                    content = f.read()
                                    if query in content.lower():
                                        matched = True
                                        idx = content.lower().find(query)
                                        start = max(0, idx - 40)
                                        end = min(len(content), idx + 40)
                                        snippet = content[start:end].replace("\n", " ")
                                        snippet = "..." + snippet + "..."
                            except Exception:
                                pass
                                
                            if matched:
                                results.append({
                                    "title": file.replace(".md", ""),
                                    "path": rel_path,
                                    "snippet": snippet
                                })
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"results": results}).encode("utf-8"))
        else:
            # 정적 파일 서빙 (대시보드 UI)
            base_dir = os.path.join(os.path.dirname(__file__), "..", "..")
            
            if self.path == "/" or self.path == "/index.html":
                filepath = os.path.join(base_dir, "05_Meta", "dashboard", "index.html")
            else:
                # 기본적으로 05_Meta/dashboard 에서 찾음
                filepath = os.path.join(base_dir, "05_Meta", "dashboard", self.path.lstrip("/"))
                if not os.path.exists(filepath):
                    # 없으면 프로젝트 루트에서 찾음 (아바타 이미지 등)
                    filepath = os.path.join(base_dir, self.path.lstrip("/"))
            
            filepath = os.path.abspath(filepath)
            
            # 보안: base_dir을 벗어나지 않도록 검증
            if not filepath.startswith(os.path.abspath(base_dir)):
                self.send_response(403)
                self.end_headers()
                return
                
            if os.path.exists(filepath) and os.path.isfile(filepath):
                self.send_response(200)
                if filepath.endswith(".html"):
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                elif filepath.endswith(".css"):
                    self.send_header("Content-Type", "text/css; charset=utf-8")
                elif filepath.endswith(".js"):
                    self.send_header("Content-Type", "application/javascript; charset=utf-8")
                elif filepath.endswith(".png"):
                    self.send_header("Content-Type", "image/png")
                elif filepath.endswith(".jpg") or filepath.endswith(".jpeg"):
                    self.send_header("Content-Type", "image/jpeg")
                elif filepath.endswith(".json"):
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                else:
                    self.send_header("Content-Type", "application/octet-stream")
                self.end_headers()
                
                try:
                    with open(filepath, "rb") as f:
                        self.wfile.write(f.read())
                except BrokenPipeError:
                    pass # 클라이언트 연결 끊어짐
            else:
                self.send_response(404)
                self.end_headers()

    def do_POST(self):
        if self.path == "/api/settings":
            # ── 에이전트 일시정지(Pause) 설정 API ──
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            try:
                req_data = json.loads(post_data.decode("utf-8"))
                settings = load_settings()
                if "paused" in req_data:
                    settings["paused"] = bool(req_data["paused"])
                    settings["pause_reason"] = req_data.get("reason", "")
                    settings["paused_at"] = datetime.datetime.now().isoformat() if req_data["paused"] else None
                save_settings(settings)
                status_str = "PAUSED 🔴" if settings["paused"] else "ACTIVE 🟢"
                print(f"[Settings] 에이전트 상태 변경: {status_str} | 사유: {settings.get('pause_reason', '')}")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": True, "settings": settings}).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode("utf-8"))
        elif self.path == "/api/chat":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode("utf-8"))
                agent_key = data.get("agent")
                message = data.get("message")
                
                # ★ 일시정지(Pause) 차단 게이트 — Gemini 호출 전 검사
                if is_paused():
                    settings = load_settings()
                    pause_reason = settings.get('pause_reason', '')
                    reason_txt = f" (사유: {pause_reason}" if pause_reason else ""
                    pause_msg = f"[System] 🔴 에이전트 가동이 일시 중지된 상태입니다. (토큰 사용 제한 중{reason_txt})"
                    print(f"[PAUSED] API 요청 차단됨. Agent: {agent_key}")
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(json.dumps({"replies": [{"agent": agent_key or "system", "text": pause_msg}], "paused": True}).encode("utf-8"))
                    return

                print(f"[API Request] Agent: {agent_key} | Message: {message}")
                
                # 라이브 응답 팩 생성 (싱글 대화 혹은 멀티 토론 체인)
                replies = self.generate_live_replies_pack(agent_key, message)
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"replies": replies}).encode("utf-8"))
                
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"replies": [{"agent": "aegis", "text": f"[Internal Error]: {str(e)}"}]}).encode("utf-8"))
        elif self.path == "/api/save-meeting":
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode("utf-8"))
                title = data.get("title", "6인 에이전트 리플렉션 회의록")
                content = data.get("content", "")
                
                from datetime import timezone, timedelta
                KST = timezone(timedelta(hours=9))
                now = datetime.datetime.now(KST)
                date_str = now.strftime("%Y-%m-%d")
                time_str = now.strftime("%H:%M")
                file_time_str = now.strftime("%H-%M")
                
                # 파일명 생성
                filename = f"meeting_{date_str}_{file_time_str}.md"
                filepath = os.path.join(os.path.dirname(__file__), "..", "..", "03_Conversations", filename)
                
                # 회의록 생성
                meeting_doc = f"""---
type: meeting_minutes
date: {date_str}
time: {time_str}
title: "{title}"
---

# {title}

## 회의 개요
- 일시: {date_str} {time_str}
- 참석자: Aegis (이지스), Nova (노바), Vivid (비비드), Bitz (비츠), Echo (에코), Carey (케리)

## 회의록 본문
{content}

---
*본 회의록은 RecipeBridge AI Agent OS 협업 대시보드에서 자동으로 생성 및 기록되었습니다.*
"""
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(meeting_doc)
                    
                # log.md에 추가
                log_path = os.path.join(os.path.dirname(__file__), "..", "..", "log.md")
                log_entry = f"\n{date_str} {time_str} | save | {title} 옵시디언 자동 저장 완료 | [[03_Conversations/{filename}]]"
                with open(log_path, "a", encoding="utf-8") as f:
                    f.write(log_entry)
                
                # index.md 업데이트
                update_index_file(filename, title)
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "filepath": f"03_Conversations/{filename}"}).encode("utf-8"))
                
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()


    def generate_live_replies_pack(self, agent_key, message):
        """요청 타입(1:1 혹은 group 협업)에 맞춰 라이브 응답 리스트 반환 (Orchestrator Router 반영)"""
        if agent_key != "group":
            # 1:1 대화일 때는 싱글 리플라이 팩 구성
            text = self.call_gemini_api(agent_key, message)
            return [{"agent": agent_key, "text": text}]
        else:
            # 협업방(group)일 때는 경량화된 라우터가 필수 에이전트만 호출
            print("[Group Chat] Orchestrator Router 가동 중...")
            router_prompt = (
                f"사용자의 다음 지시를 분석하여 이를 해결하기 위해 꼭 필요한 에이전트 이름(들)만 콤마로 구분해서 대답해라. "
                f"선택 가능한 에이전트: [aegis, nova, vivid, bitz, echo, carey]. "
                f"불필요한 설명 없이 이름만 출력해라. 예: aegis, bitz\n\n지시: {message}"
            )
            # 마스터(Aegis)를 라우터로 활용
            router_response = self.call_gemini_api("aegis", router_prompt)
            agents = ["aegis", "nova", "vivid", "bitz", "echo", "carey"]
            selected_agents = [x.strip().lower() for x in router_response.split(",") if x.strip().lower() in agents]
            
            if not selected_agents:
                selected_agents = ["aegis"] # fallback
            
            print(f"[Orchestrator] 선택된 에이전트: {selected_agents}")
            
            replies = []
            accumulated_context = f"사장님의 지시: {message}\n\n"
            
            for ag in selected_agents:
                prompt = f"{accumulated_context}\n위의 진행 상황을 참고하여 너의 역할을 수행하고, 다음 에이전트가 알 수 있도록 핵심 결과만 짧게(JSON 또는 불릿포인트) 요약해서 반환해라."
                reply = self.call_gemini_api(ag, prompt)
                replies.append({"agent": ag, "text": reply})
                accumulated_context += f"[{ag.upper()} 요약]\n{reply}\n\n"
            
            # 마지막 마스터(Aegis)의 총괄 보고 (선택된 에이전트들에 Aegis가 없을 경우 추가)
            if "aegis" not in selected_agents:
                summary_prompt = f"모든 토론이 종료되었습니다. 최종 요약 브리핑과 사장님 결재안을 신뢰감 있게 보고해 주세요.\n\n누적 회의록:\n{accumulated_context}"
                summary_reply = self.call_gemini_api("aegis", summary_prompt)
                replies.append({"agent": "aegis", "text": summary_reply})
            
            print(f"[Group Chat] 라우팅 기반 리플렉션 완료. 총 {len(replies)}개 발언 생성 완료.")
            return replies

    def call_gemini_api(self, agent_key, message):
        """Gemini API를 직접 호출하여 해당 에이전트의 성격으로 라이브 응답 생성"""
        api_key = load_gemini_api_key()
        
        if not api_key:
            return (
                f"[{agent_key.upper()}] 사장님, 실시간 AI 에이전트와 라이브 소통을 하려면 "
                "프로젝트 루트 디렉토리의 '.env' 파일에 GEMINI_API_KEY=\"AIzaSy...\" 를 "
                "설정하고 서버를 재기동해 주셔야 합니다."
            )
            
        # ── 실시간 프로젝트 진척도 및 로그 요약 컨텍스트 주입 ─────────────────
        live_project_context = ""
        try:
            # 1. 액션플랜 파싱 정보 요약
            plan_stats = parse_action_plan()
            if plan_stats:
                live_project_context += "\n\n[실시간 프로젝트 진척 상황 (Live Action Plan Status)]\n"
                for ag, data in plan_stats.items():
                    pct = round((data["completed"] / data["total"]) * 100) if data["total"] > 0 else 0
                    live_project_context += f"- {ag.upper()}: 완료 {data['completed']}/{data['total']}개 ({pct}%)\n"
            
            # 2. 최신 로그 12줄 주입
            log_path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "log.md"))
            if os.path.exists(log_path):
                with open(log_path, "r", encoding="utf-8") as f:
                    log_lines = [line.strip() for line in f if line.strip()]
                # 실질적인 로그 필터링
                actual_logs = [l for l in log_lines if "|" in l]
                if actual_logs:
                    live_project_context += "\n[최근 에이전트 실무 활동 로그 (최신순 12개)]\n"
                    # 최신순이므로 슬라이싱해서 최근 12개 추가
                    for l in actual_logs[-12:]:
                        live_project_context += f"  {l}\n"
        except Exception as e:
            print(f"[Live Context Injection Error] {e}")

        # 4대 제어 문서(soul/user/agent/memory) 동적 로드 및 병합
        system_instruction = load_agent_multi_profile(agent_key)
        
        # ★ 단기 기억(Context) 주입: 최근 cron 스케줄러가 보고한 내용이 있다면 프롬프트에 포함하여 맥락 유지
        recent_context = ""
        context_path = os.path.join(os.path.dirname(__file__), "..", "..", "_shared", "recent_context.md")
        if os.path.exists(context_path):
            try:
                with open(context_path, "r", encoding="utf-8") as f:
                    recent_context = f"\n\n[최근 시스템/보고 맥락 (참고용)]\n{f.read().strip()}"
            except Exception as e:
                print(f"[Context Load Error] {e}")

        full_system_prompt = f"{system_instruction}{recent_context}{live_project_context}"
        
        # ── Context Caching 적용 (최소 4000토큰/32k 제한 우회용 Fallback 포함) ──
        global CACHE_STORE
        with _cache_lock:
            if 'CACHE_STORE' not in globals():
                CACHE_STORE = {}
                
            import datetime
            now = datetime.datetime.now()
            cache_info = CACHE_STORE.get(agent_key)
            cached_name = None
            
            if cache_info and cache_info.get("expiry") > now:
                cached_name = cache_info["name"]
            elif cache_info and cache_info.get("name") == "failed_too_short":
                cached_name = None

        if not cached_name and (not cache_info or cache_info.get("name") != "failed_too_short"):
            cache_url = f"https://generativelanguage.googleapis.com/v1beta/cachedContents?key={api_key}"
            cache_payload = {
                "model": "models/gemini-1.5-flash-001",
                "contents": [{"parts": [{"text": full_system_prompt}], "role": "user"}],
                "ttl": "3600s"
            }
            try:
                cache_req = urllib.request.Request(cache_url, data=json.dumps(cache_payload).encode("utf-8"), headers={"Content-Type": "application/json"})
                with urllib.request.urlopen(cache_req, timeout=10) as c_res:
                    c_data = json.loads(c_res.read().decode("utf-8"))
                    cached_name = c_data.get("name")
                    with _cache_lock:
                        CACHE_STORE[agent_key] = {"name": cached_name, "expiry": now + datetime.timedelta(minutes=55)}
                    print(f"[Context Caching] Agent {agent_key} 캐시 생성 성공: {cached_name}")
            except urllib.error.HTTPError as e:
                # 400 Bad Request (토큰 수 미달) 방어
                with _cache_lock:
                    CACHE_STORE[agent_key] = {"name": "failed_too_short", "expiry": now + datetime.timedelta(minutes=55)}
                cached_name = None
            except Exception as e:
                print(f"[Context Caching Error] {e}")
                cached_name = None

        gen_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        if cached_name and cached_name != "failed_too_short":
            payload = {
                "cachedContent": cached_name,
                "contents": [{
                    "parts": [{"text": f"User 지시사항:\n{message}"}],
                    "role": "user"
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 4000
                }
            }
        else:
            payload = {
                "contents": [{
                    "parts": [{"text": f"{full_system_prompt}\n\nUser 지시사항:\n{message}"}],
                    "role": "user"
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 4000
                }
            }
            
        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                gen_url, data=data, headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=90) as res:
                response = json.loads(res.read().decode("utf-8"))
                
                candidates = response.get("candidates", [])
                if candidates:
                    reply_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    return resolve_view_file_calls(reply_text.strip())
                else:
                    return f"[{agent_key.upper()}] 죄송합니다, AI 응답 생성에 실패했습니다."
                    
        except Exception as e:
            return f"[{agent_key.upper()} API 에러] Gemini 호출 실패: {str(e)}"

def resolve_view_file_calls(text):
    """에이전트가 답변에 포함한 agy.view_file(...) 호출 구문을 감지해 실제 파일 내용으로 치환"""
    pattern = r'(?:agy\.)?view_file\([\'\"](.+?)[\'\"]\)'
    if not re.search(pattern, text):
        return text
        
    lines = text.split('\n')
    new_lines = []
    
    for line in lines:
        match = re.search(pattern, line)
        if match:
            filepath = match.group(1).strip()
            # Clean path
            base_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
            full_path = os.path.normpath(os.path.join(base_dir, filepath))
            
            # 보안: base_dir을 벗어나지 않도록 검증
            if not full_path.startswith(base_dir):
                content = "[접근 권한이 없는 파일 경로입니다]"
            elif os.path.exists(full_path) and os.path.isfile(full_path):
                try:
                    with open(full_path, "r", encoding="utf-8") as f:
                        content = f.read()
                except Exception as e:
                    content = f"[파일 읽기 실패: {e}]"
            else:
                content = f"[파일을 찾을 수 없습니다: {filepath}]"
            
            # 파이썬 코드 블록 껍데기가 이전 라인에 있었다면 제거 (예: ```python)
            if new_lines and new_lines[-1].strip().lower() in ['python', '```python', '```']:
                new_lines.pop()
                
            # 내용 인라인 치환
            new_lines.append(f"\n📁 **[파일 내용: {filepath}]**\n---\n{content}\n---")
            continue
            
        # 파일 내용을 인라인한 직후 닫는 백틱(```)이 오면 스킵 처리
        if line.strip() == '```' and new_lines and new_lines[-1].startswith('\n📁 **[파일 내용:'):
            continue
            
        new_lines.append(line)
        
    return '\n'.join(new_lines)

def run():
    server_address = ("", PORT)
    httpd = ThreadingHTTPServer(server_address, LiveChatRequestHandler)
    print(f"[Server Running] ThreadingHTTP Live API Server active on port {PORT} (MIT Reflection + Multi-Profile)...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Server Stopped] Live API Server closed.")
        httpd.server_close()

if __name__ == "__main__":
    run()
