// ══════════════════════════════════════════════════════════
//  RecipeBridge Portal Dashboard — JavaScript v2
//  간트차트, Aegis 보고 위젯, Chart.js, 실시간 로그 피드
// ══════════════════════════════════════════════════════════

const BACKEND_URL = "";

// ── DOM Refs ──
const serverStatusDot = document.getElementById("serverStatusDot");
const projectWikiList = document.getElementById("projectWikiList");
const activityFeed    = document.getElementById("activityFeed");
const aegisMsgEl      = document.getElementById("aegisBriefingMsg");
const aegisTimeEl     = document.getElementById("aegisBriefingTime");
const aegisReqBtn     = document.getElementById("aegisRequestBtn");

let progressChart     = null;
let logsDoughnutChart = null;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  간트차트 정적 데이터 (action_plan.md 4일 스프린트 로드맵 기반)
//  startWeek/endWeek: 1~4, ownerColor: CSS 변수에서 가져온 색상
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const GANTT_DATA = [
  {
    agent: "Aegis (이지스)",
    key: "aegis",
    color: "#735c00",
    tasks: [
      { 
        label: "[Lv1] 기획·디자인 산출물 검수", start: 1, end: 1, status: "planned",
        details: [
          { name: "Day 1 기획/디자인 산출물 직접 파일 검수 및 승인", target: 1 }
        ]
      },
      { 
        label: "[Lv1] AI 마스터 검증 로직 설계", start: 2, end: 3, status: "planned",
        details: [
          { name: "구직자 코드 표절률 및 AI 대필 검증 프롬프트 설계", target: 2 },
          { name: "코드 동적 체크를 통한 인증서 발급 승인 로직", target: 3 },
          { name: "백업/복원 스크립트 고도화 (Bitz 협업)", target: 3 }
        ]
      },
      { 
        label: "[Lv1] 전체 시스템 최종 QA 승인", start: 4, end: 4, status: "planned",
        details: [
          { name: "전체 src/ 소스 코드 QA 점검 및 승인", target: 4 },
          { name: "개발팀 Bitz의 완성된 PR 코드 배포 승인", target: 4 }
        ]
      }
    ]
  },
  {
    agent: "Nova (노바)",
    key: "nova",
    color: "#2a5d80",
    tasks: [
      { 
        label: "[Lv1] 블라인드 매칭 기획", start: 1, end: 1, status: "planned",
        details: [
          { name: "블라인드 프로젝트 인증 프로필 UI/프로세스 기획", target: 1 },
          { name: "스타트업 과제 스펙 세부 기획", target: 1 },
          { name: "단기 과제 모집 양식 템플릿 기획", target: 1 }
        ]
      },
      { 
        label: "[Lv1] 레시피 팩 설계", start: 2, end: 2, status: "planned",
        details: [
          { name: "기본 웹 빌드 레시피 팩 3종 프롬프트 구성", target: 2 },
          { name: "마이크로 프로젝트 진행 인증 체인 상세 설계", target: 2 }
        ]
      }
    ]
  },
  {
    agent: "Vivid (비비드)",
    key: "vivid",
    color: "#6a3080",
    tasks: [
      { 
        label: "[Lv1] UI/UX 테마 및 가이드", start: 1, end: 1, status: "planned",
        details: [
          { name: "피그마 와이어프레임 설계 (메인/프로젝트/스토어)", target: 1 },
          { name: "프리미엄 다크 모드 톤앤매너, 컬러 토큰(HSL) 정의", target: 1 },
          { name: "반응형 레이아웃 및 UX 애니메이션 가이드라인 공급", target: 1 }
        ]
      }
    ]
  },
  {
    agent: "Bitz (비츠)",
    key: "bitz",
    color: "#1d6840",
    tasks: [
      { 
        label: "[Lv1] 핵심 앱 프론트 개발", start: 2, end: 2, status: "planned",
        details: [
          { name: "Vite + React 기반 레포 구성 및 UI 퍼블리싱", target: 2 },
          { name: "노션 API 연동: 의뢰 과제 DB 동기화", target: 2 }
        ]
      },
      { 
        label: "[Lv1] API 연동 및 인프라", start: 2, end: 3, status: "planned",
        details: [
          { name: "AI 레시피 샌드박스 렌더러 구현", target: 2 },
          { name: "VPS 상시 가동 셋팅 및 백업 스크립트 작성", target: 3 },
          { name: "텔레그램 연동 봇 백그라운드 안정화", target: 3 }
        ]
      }
    ]
  },
  {
    agent: "Echo (에코)",
    key: "echo",
    color: "#8a2800",
    tasks: [
      { 
        label: "[Lv1] 마케팅 파이프라인 구축", start: 3, end: 3, status: "planned",
        details: [
          { name: "사전 예약 신청용 SEO 랜딩 페이지 최적화", target: 3 },
          { name: "SNS 카드뉴스 자동화 크론 연동", target: 3 },
          { name: "구글 서치 콘솔 연동 및 색인 등록 테스트", target: 3 }
        ]
      }
    ]
  },
  {
    agent: "Carey (케리)",
    key: "carey",
    color: "#2a3880",
    tasks: [
      { 
        label: "[Lv1] 유저 데이터 트래킹 설계", start: 2, end: 2, status: "planned",
        details: [
          { name: "GA4 이벤트 트래킹 설계 (가입, 결제 클릭, 이탈율 분석)", target: 2 }
        ]
      },
      { 
        label: "[Lv1] 베타 서비스 피드백 채널", start: 4, end: 4, status: "planned",
        details: [
          { name: "베타 테스터 설문 및 고통 점수 분류기 탑재", target: 4 },
          { name: "불만율 피드백 수집 채널 개설", target: 4 }
        ]
      }
    ]
  },
  {
    agent: "Insight (인사이트)",
    key: "insight",
    color: "#5c3a21",
    tasks: [
      { 
        label: "[Lv1] R&D 및 시장 조사", start: 1, end: 2, status: "planned",
        details: [
          { name: "취업 커뮤니티 트렌드 분석 및 리포팅", target: 1 },
          { name: "경쟁사 플랫폼 기능 비교 분석", target: 2 }
        ]
      }
    ]
  },
  {
    agent: "Verity (베리티)",
    key: "verity",
    color: "#4a4a4a",
    tasks: [
      { 
        label: "[Lv1] 산출물 팩트체크", start: 3, end: 4, status: "planned",
        details: [
          { name: "기획서 논리 및 모순점 검증", target: 3 },
          { name: "시스템 할루시네이션 방지 모니터링 세팅", target: 4 }
        ]
      }
    ]
  }
];

const LONG_TERM_GANTT_DATA = [
  {
    agent: "비즈니스 기획",
    key: "business",
    color: "#d4af37",
    tasks: [
      { label: "중고 신입 - 스타트업 매칭 모델 확립", start: 1, end: 2 },
      { label: "블라인드 실무 과제 DB 확보 (100건)", start: 3, end: 4 }
    ]
  },
  {
    agent: "프로덕트 구축",
    key: "product",
    color: "#1d6840",
    tasks: [
      { label: "MVP 기능 배포 (레시피/DB 동기화)", start: 1, end: 2 },
      { label: "a-알파 수익화(결제 모듈) 연동 및 오픈", start: 3, end: 4 }
    ]
  }
];

// 오늘 날짜 기준 진도 계산
const PROJECT_START = new Date("2026-07-19");
const PROJECT_END   = new Date("2026-07-22");
const LT_PROJECT_START = new Date("2026-07-15");
const LT_PROJECT_END   = new Date("2026-08-11");
const TODAY         = new Date();

function calcWeekProgress() {
  const totalMs = PROJECT_END - PROJECT_START;
  const elapsedMs = Math.max(0, Math.min(TODAY - PROJECT_START, totalMs));
  return elapsedMs / totalMs; // 0~1
}

function todayWeekFraction() {
  // 오늘이 전체 4일 중 몇 %인지
  const startMs = PROJECT_START.getTime();
  const endMs   = PROJECT_END.getTime();
  const todayMs = TODAY.getTime();
  return Math.max(0, Math.min(1, (todayMs - startMs) / (endMs - startMs)));
}

function ltTodayWeekFraction() {
  const startMs = LT_PROJECT_START.getTime();
  const endMs   = LT_PROJECT_END.getTime();
  const todayMs = TODAY.getTime();
  return Math.max(0, Math.min(1, (todayMs - startMs) / (endMs - startMs)));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  간트차트 렌더러
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderGantt(actionPlan) {
  const body = document.getElementById("ganttBody");
  if (!body) return;
  body.innerHTML = "";

  GANTT_DATA.forEach(agentRow => {
    const planData = actionPlan[agentRow.key] || { total: 0, completed: 0 };
    const pct = planData.total > 0
      ? Math.round((planData.completed / planData.total) * 100)
      : 0;

    const rowEl = document.createElement("div");
    rowEl.className = "gantt-row";

    // 에이전트 레이블
    const labelEl = document.createElement("div");
    labelEl.className = "gantt-agent-label";
    labelEl.innerHTML = `
      <span class="gantt-agent-dot" style="background:${agentRow.color}"></span>
      <span class="gantt-agent-name">${agentRow.agent}</span>
      <span class="gantt-agent-pct">${pct}%</span>
    `;

    // 타임라인 그리드
    const timelineEl = document.createElement("div");
    timelineEl.className = "gantt-timeline";

    // 4일 배경 구분선
    for (let w = 1; w <= 4; w++) {
      const bg = document.createElement("div");
      bg.className = `gantt-week-bg ${w % 2 === 0 ? "gantt-week-bg--alt" : ""}`;
      timelineEl.appendChild(bg);
    }

    // 태스크 바
    agentRow.tasks.forEach((task, idx) => {
      const barEl = document.createElement("div");
      const leftPct  = ((task.start - 1) / 4) * 100;
      const widthPct = ((task.end - task.start + 1) / 4) * 100;

      // 태스크가 완료된 주 이전이면 완료 처리
      const weekFrac = todayWeekFraction();
      const taskMidFrac = ((task.start - 0.5) / 4);
      const isDone = weekFrac >= taskMidFrac && pct > 0;
      const isDelayed = weekFrac > (task.end / 4) && !isDone;

      barEl.className = `gantt-bar ${isDone ? "gantt-bar--done" : ""} ${isDelayed ? "gantt-bar--delayed" : ""}`;
      barEl.style.cssText = `
        left: ${leftPct}%;
        width: calc(${widthPct}% - 6px);
        background: ${isDone ? "#3d8f5f" : isDelayed ? "#ba1a1a" : agentRow.color};
        top: ${8 + idx * 28}px;
        cursor: pointer;
      `;
      barEl.title = task.label + " (클릭하여 세부 액션리스트 보기)";
      barEl.onclick = () => {
        const titleEl = document.getElementById("taskModalTitle");
        const bodyEl = document.getElementById("taskModalBody");
        if(titleEl) titleEl.textContent = task.label;
        if(bodyEl) {
          bodyEl.innerHTML = "";
          if (task.details && task.details.length > 0) {
            task.details.forEach(detail => {
              const li = document.createElement("li");
              li.className = "search-result-item";
              li.innerHTML = `<strong>${detail.name}</strong> <span style="float:right; font-size:11px; color:var(--ink-tertiary)">목표일정: Day ${detail.target}</span>`;
              bodyEl.appendChild(li);
            });
          } else {
            bodyEl.innerHTML = `<li class="search-result-item">세부 액션리스트가 없습니다.</li>`;
          }
        }
        openModal("taskDetailModal");
      };

      const barLabel = document.createElement("span");
      barLabel.className = "gantt-bar-label";
      barLabel.textContent = task.label;
      barEl.appendChild(barLabel);
      timelineEl.appendChild(barEl);
    });

    rowEl.appendChild(labelEl);
    rowEl.appendChild(timelineEl);

    // 행 높이: 태스크 개수에 비례
    rowEl.style.minHeight = `${Math.max(48, agentRow.tasks.length * 28 + 16)}px`;
    body.appendChild(rowEl);
  });

  // 오늘 기준선
  const line = document.getElementById("ganttTodayLine");
  if (line) {
    const frac = todayWeekFraction();
    // 에이전트 레이블 컬럼 너비를 제외한 위치 (레이블은 약 160px)
    line.style.left = `calc(160px + (100% - 160px) * ${frac})`;
    line.style.display = frac >= 0 && frac <= 1 ? "block" : "none";
    line.title = `오늘 (${TODAY.toLocaleDateString("ko-KR")})`;
  }
}

function renderLongTermGantt() {
  const body = document.getElementById("ganttLongTermBody");
  if (!body) return;
  body.innerHTML = "";

  LONG_TERM_GANTT_DATA.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "gantt-row";

    const labelEl = document.createElement("div");
    labelEl.className = "gantt-agent-label";
    labelEl.innerHTML = `
      <span class="gantt-agent-dot" style="background:${row.color}"></span>
      <span class="gantt-agent-name">${row.agent}</span>
    `;

    const timelineEl = document.createElement("div");
    timelineEl.className = "gantt-timeline";

    for (let w = 1; w <= 4; w++) {
      const bg = document.createElement("div");
      bg.className = `gantt-week-bg ${w % 2 === 0 ? "gantt-week-bg--alt" : ""}`;
      timelineEl.appendChild(bg);
    }

    row.tasks.forEach((task, idx) => {
      const barEl = document.createElement("div");
      const leftPct  = ((task.start - 1) / 4) * 100;
      const widthPct = ((task.end - task.start + 1) / 4) * 100;

      const weekFrac = ltTodayWeekFraction();
      const isDone = weekFrac > (task.end / 4);

      barEl.className = `gantt-bar ${isDone ? "gantt-bar--done" : ""}`;
      barEl.style.cssText = `
        left: ${leftPct}%;
        width: calc(${widthPct}% - 6px);
        background: ${isDone ? "#3d8f5f" : row.color};
        top: ${8 + idx * 28}px;
      `;
      const barLabel = document.createElement("span");
      barLabel.className = "gantt-bar-label";
      barLabel.textContent = task.label;
      barEl.appendChild(barLabel);
      timelineEl.appendChild(barEl);
    });

    rowEl.appendChild(labelEl);
    rowEl.appendChild(timelineEl);
    rowEl.style.minHeight = `${Math.max(48, row.tasks.length * 28 + 16)}px`;
    body.appendChild(rowEl);
  });

  const line = document.getElementById("ganttLongTermTodayLine");
  if (line) {
    const frac = ltTodayWeekFraction();
    line.style.left = `calc(160px + (100% - 160px) * ${frac})`;
    line.style.display = frac >= 0 && frac <= 1 ? "block" : "none";
    line.title = `오늘 (${TODAY.toLocaleDateString("ko-KR")})`;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Aegis 업무 보고 요청
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function requestAegisBriefing() {
  if (!aegisReqBtn) return;
  aegisReqBtn.disabled = true;
  aegisReqBtn.textContent = "Aegis 분석 중...";
  aegisMsgEl.textContent  = "Aegis가 현재 전체 업무 진행 현황을 분석하여 보고서를 작성 중입니다...";

  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent: "aegis",
        message: "사장님께 현재 RecipeBridge MVP 4주 로드맵 진행 현황을 간결하고 명확하게 보고해 주세요. 현재 Week 1이 시작 전이며, 각 담당자별 준비 상태와 이번 주 주요 마일스톤을 요약하여 공식 브리핑 형태로 작성해 주세요."
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.replies?.[0]?.text || "(응답 없음)";
      aegisMsgEl.innerHTML = text.replace(/\n/g, "<br>");
      aegisTimeEl.textContent = `보고 완료 · ${new Date().toLocaleTimeString("ko-KR")}`;
      aegisReqBtn.textContent = "✅ 보고 완료 (재요청)";
    } else {
      throw new Error("Server error");
    }
  } catch (err) {
    aegisMsgEl.textContent = err.name === "TimeoutError"
      ? "[Timeout] Aegis 응답 시간 초과. 서버를 재기동하거나 잠시 후 다시 시도해 주세요."
      : `[Error] Aegis 보고 요청 실패: ${err.message}`;
    aegisReqBtn.textContent = "⚠️ 재요청";
  } finally {
    aegisReqBtn.disabled = false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  모달 열기/닫기
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function openModal(id) {
  document.getElementById(id)?.classList.remove("hidden");
  document.addEventListener("keydown", escClose);
}
function closeModal(id) {
  document.getElementById(id)?.classList.add("hidden");
  document.removeEventListener("keydown", escClose);
}
function escClose(e) { if (e.key === "Escape") { document.querySelectorAll(".modal-overlay").forEach(m => m.classList.add("hidden")); } }

// 검색 입력 필터 (간단 위키 검색)
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("wikiSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase();
      document.querySelectorAll(".search-result-item").forEach(item => {
        item.style.display = item.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    });
  }
  // 모달 외부 클릭 닫기
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) overlay.classList.add("hidden");
    });
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  대시보드 API 데이터 로드
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function fetchDashboardData() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/dashboard`);
    if (!res.ok) throw new Error("offline");

    const data = await res.json();
    if (serverStatusDot) { serverStatusDot.className = "offline-dot online"; serverStatusDot.title = "API Server Online"; }

    renderLongTermGantt();
    renderGantt(data.action_plan);
    renderProgressChart(data.action_plan);
    renderLogsDoughnut(data.log_stats);
    renderActivityFeed(data.logs);
    renderProjects(data.projects);

  } catch {
    if (serverStatusDot) { serverStatusDot.className = "offline-dot"; serverStatusDot.title = "API Server Offline"; }
    if (activityFeed) activityFeed.innerHTML = `<li class="loading-item" style="color:#ba1a1a">⚠️ API 서버 오프라인 — run_dashboard.bat 재실행 필요</li>`;
    if (projectWikiList) projectWikiList.innerHTML = `<li class="loading-item">프로젝트 정보를 가져올 수 없습니다.</li>`;
    // 오프라인이어도 간트차트는 정적 데이터로 렌더링
    renderLongTermGantt();
    renderGantt({});
  }
}

// ── 프로그레스 차트 (R&R) ──
function renderProgressChart(actionPlan) {
  const agents = ["aegis","nova","vivid","bitz","echo","carey","insight","verity"];
  const data = [], labels = ["Aegis","Nova","Vivid","Bitz","Echo","Carey","Insight","Verity"];
  agents.forEach(a => {
    const p = actionPlan[a] || { total:0, completed:0 };
    const pct = p.total > 0 ? Math.round((p.completed/p.total)*100) : 0;
    data.push(pct);
    const pb = document.getElementById(`pb-${a}`);
    const pt = document.getElementById(`pt-${a}`);
    if (pb) pb.style.width = `${pct}%`;
    if (pt) pt.textContent = `${pct}%`;
  });
  const ctx = document.getElementById("progressChart")?.getContext("2d");
  if (!ctx) return;
  if (progressChart) { progressChart.data.datasets[0].data = data; progressChart.update(); return; }
  progressChart = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets: [{ label:"완료율(%)", data, backgroundColor:"#d4af37", borderColor:"#735c00", borderWidth:1, borderRadius:4 }] },
    options: { responsive:true, plugins:{ legend:{display:false} }, scales:{ y:{beginAtZero:true,max:100,ticks:{color:"#7f7663"}}, x:{ticks:{color:"#7f7663"}} } }
  });
}

// ── 로그 도넛 차트 ──
function renderLogsDoughnut(logStats) {
  const agentColors = {
    aegis: "#d4af37",
    nova: "#2a5d80",
    vivid: "#6a3080",
    bitz: "#1d6840",
    echo: "#8a2800",
    carey: "#2a3880",
    insight: "#5c3a21",
    verity: "#4a4a4a",
    unknown: "#7f7663"
  };
  
  const labels = Object.keys(logStats).map(l => l.toUpperCase());
  const vals   = Object.values(logStats);
  const colors = Object.keys(logStats).map(l => agentColors[l.toLowerCase()] || "#7f7663");

  if (!labels.length) { labels.push("NO DATA"); vals.push(1); colors.push("#333"); }
  const ctx = document.getElementById("logsDoughnutChart")?.getContext("2d");
  if (!ctx) return;
  if (logsDoughnutChart) { logsDoughnutChart.data.labels=labels; logsDoughnutChart.data.datasets[0].data=vals; logsDoughnutChart.data.datasets[0].backgroundColor=colors; logsDoughnutChart.update(); return; }
  logsDoughnutChart = new Chart(ctx, {
    type:"doughnut",
    data:{ labels, datasets:[{ data:vals, backgroundColor:colors, borderWidth:2, borderColor:"#ffffff" }] },
    options:{ responsive:true, plugins:{ legend:{ position:"right", labels:{boxWidth:12,color:"#4d4635"} } } }
  });
}

// ── 로그 피드 ──
function renderActivityFeed(logs) {
  if (!activityFeed) return;
  if (!logs.length) { activityFeed.innerHTML=`<li class="loading-item">실행 로그가 비어 있습니다.</li>`; return; }
  activityFeed.innerHTML = "";
  logs.slice(0,8).forEach(log => {
    const li = document.createElement("li");
    li.className = "feed-item";
    li.innerHTML = `
      <span class="feed-item__badge badge-${log.type}">${log.type}</span>
      <div class="feed-item__content">
        <div class="feed-item__summary">${parseLinks(log.summary)}</div>
        <div class="feed-item__meta"><span>${log.datetime}</span></div>
      </div>`;
    activityFeed.appendChild(li);
  });
}

// ── 프로젝트 리스트 ──
function renderProjects(projects) {
  if (!projectWikiList) return;
  projectWikiList.innerHTML = "";
  projects.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="../../02_Wiki/projects/${p.id}.md" target="_blank" class="project-wiki-item">
      <span class="project-wiki-item__name">${p.name}</span>
      <span class="project-wiki-item__status">${p.status.toUpperCase()}</span></a>`;
    projectWikiList.appendChild(li);
  });
}

function parseLinks(text) {
  return text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_,t,a) => {
    const d = a||t;
    return `<a href="../../${t}.md" target="_blank" style="color:#735c00;font-weight:600;text-decoration:underline">${d}</a>`;
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  초기화
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
window.onload = async () => {
  await fetchDashboardData();
  setInterval(fetchDashboardData, 30000);
  initMetaverseOffice();
  selectAgent('aegis');
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  🏢 RPG METAVERSE OFFICE — Avatar Positioning & Wandering
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Room center positions (% of map dimensions)
const ROOM_POSITIONS = {
  aegis:   { left: 6,  top: 10 },
  nova:    { left: 28, top: 10 },
  vivid:   { left: 50, top: 10 },
  bitz:    { left: 72, top: 10 },
  echo:    { left: 6,  top: 74 },
  carey:   { left: 28, top: 74 },
  insight: { left: 50, top: 74 },
  verity:  { left: 72, top: 74 },
  meeting: { left: 46, top: 44 },
  lounge:  { left: 88, top: 74 },
};

// Wander sub-positions within desk areas (slight offsets)
const WANDER_OFFSETS = [
  { dl: 2, dt: 3 }, { dl: -2, dt: 2 }, { dl: 3, dt: -2 }, { dl: -3, dt: -3 },
  { dl: 0, dt: 4 }, { dl: 4, dt: 0 },
];

const AGENTS = ['aegis', 'nova', 'vivid', 'bitz', 'echo', 'carey', 'insight', 'verity'];

// State: which room each agent is in
const agentRooms   = { aegis: 'aegis', nova: 'nova', vivid: 'vivid', bitz: 'bitz', echo: 'echo', carey: 'carey', insight: 'insight', verity: 'verity' };
const agentBubbles = { aegis: 'idle 🛡️', nova: 'idle 💡', vivid: 'idle 🎨', bitz: 'idle 💻', echo: 'idle 📢', carey: 'idle 🎧', insight: 'idle 📈', verity: 'idle ✔️' };

function placeToken(agent, roomKey, wanderIdx) {
  const token = document.getElementById(`token-${agent}`);
  if (!token) return;
  const pos = ROOM_POSITIONS[roomKey];
  if (!pos) return;
  const off = WANDER_OFFSETS[wanderIdx % WANDER_OFFSETS.length] || { dl:0, dt:0 };
  token.style.left = `${Math.max(1, Math.min(90, pos.left + off.dl))}%`;
  token.style.top  = `${Math.max(1, Math.min(88, pos.top  + off.dt))}%`;
  agentRooms[agent] = roomKey;
}

function setBubble(agent, text, show) {
  const bubble = document.getElementById(`bubble-${agent}`);
  if (!bubble) return;
  bubble.textContent = text;
  bubble.className = 'agent-token__bubble' + (show ? ' visible' : '');
}

function initMetaverseOffice() {
  // Initial placement
  AGENTS.forEach((agent, i) => {
    placeToken(agent, agent, i);
    setTimeout(() => setBubble(agent, agentBubbles[agent], true), 400 + i * 150);
  });

  // Start wandering loop
  setInterval(wanderAgents, 12000);
  wanderAgents(); // first wander after 12s, but kick off once for freshness
}

function wanderAgents() {
  AGENTS.forEach(agent => {
    const roll = Math.random();
    let targetRoom = agent; // default: own desk

    if (roll < 0.20) {
      // 20%: go to lounge
      targetRoom = 'lounge';
      setBubble(agent, '☕ 커피 타러 이동 중...', true);
    } else if (roll < 0.25) {
      // 5%: peek at neighbour's room
      const others = AGENTS.filter(a => a !== agent);
      targetRoom = others[Math.floor(Math.random() * others.length)];
      setBubble(agent, '🤝 동료 방문 중...', true);
    } else {
      // 75%: stay or micro-wander at desk
      const wIdx = Math.floor(Math.random() * WANDER_OFFSETS.length);
      placeToken(agent, agent, wIdx);
      setBubble(agent, agentBubbles[agent], Math.random() > 0.5);
      return;
    }

    placeToken(agent, targetRoom, Math.floor(Math.random() * WANDER_OFFSETS.length));

    // Return to desk after 8s
    setTimeout(() => {
      placeToken(agent, agent, 0);
      setBubble(agent, agentBubbles[agent], false);
    }, 8000);
  });
}

// Move all agents to meeting table (called when group chat is active)
function gatherForMeeting() {
  AGENTS.forEach((agent, i) => {
    const offsets = [
      { dl: -6, dt: -4 }, { dl: -2, dt: -4 }, { dl: 2, dt: -4 },
      { dl: 6, dt: -4 }, { dl: -4, dt: 4 }, { dl: 4, dt: 4 }
    ];
    const off = offsets[i];
    const pos = ROOM_POSITIONS.meeting;
    const token = document.getElementById(`token-${agent}`);
    if (token) {
      token.style.left = `${pos.left + off.dl}%`;
      token.style.top  = `${pos.top  + off.dt}%`;
    }
    agentRooms[agent] = 'meeting';
    setBubble(agent, '📋 회의 중!', true);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ⚡ PAUSE CONTROLLER — Token Limiter
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let _currentPausedState = false;

function renderPauseStatus(settings) {
  const paused = settings?.paused ?? false;
  _currentPausedState = paused;

  const dot   = document.getElementById('pauseStatusDot');
  const text  = document.getElementById('pauseStatusText');
  const btn   = document.getElementById('pauseToggleBtn');
  const label = document.getElementById('pauseBtnLabel');
  const rrRow = document.getElementById('pauseReasonRow');
  const rrVal = document.getElementById('pauseReasonVal');
  const atRow = document.getElementById('pauseAtRow');
  const atVal = document.getElementById('pauseAtVal');
  const lbl   = document.getElementById('officeStatusLbl');

  if (paused) {
    dot?.classList.add('paused');
    if (text) text.textContent = '🔴 에이전트 일시 중지됨 (토큰 제한 중)';
    btn?.classList.add('paused-state');
    if (label) label.textContent = '▶ 가동 재개';
    if (lbl) lbl.textContent = `🔴 PAUSED — 에이전트 가동 중지 중`;

    const reason = settings?.pause_reason;
    if (reason) {
      if (rrRow) rrRow.style.display = 'flex';
      if (rrVal) rrVal.textContent = reason;
    }
    const pausedAt = settings?.paused_at;
    if (pausedAt) {
      if (atRow) atRow.style.display = 'flex';
      if (atVal) atVal.textContent = new Date(pausedAt).toLocaleString('ko-KR');
    }
  } else {
    dot?.classList.remove('paused');
    if (text) text.textContent = '🟢 에이전트 정상 가동 중';
    btn?.classList.remove('paused-state');
    if (label) label.textContent = '⏸ 가동 중지';
    if (lbl) lbl.textContent = `🟢 ACTIVE — ${AGENTS.length}명 에이전트 업무 중`;
    if (rrRow) rrRow.style.display = 'none';
    if (atRow) atRow.style.display = 'none';
  }
}

async function togglePause() {
  const btn = document.getElementById('pauseToggleBtn');
  if (btn) btn.disabled = true;
  try {
    const newPaused = !_currentPausedState;
    const reason = newPaused ? (prompt('중지 사유를 입력하세요 (선택 사항):') || '') : '';
    const res = await fetch(`${BACKEND_URL}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paused: newPaused, reason })
    });
    if (!res.ok) throw new Error('서버 응답 오류');
    const data = await res.json();
    renderPauseStatus(data.settings);
  } catch (err) {
    alert(`⚠️ 컨트롤러 통신 오류: ${err.message}\n\nAPI 서버(run_dashboard.bat)가 실행 중인지 확인하세요.`);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  🔌 AGENT MCP & API SPEC BOARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const AGENT_SPECS = {
  aegis: {
    name: 'Aegis (이지스)',
    role: 'Master Coordinator — 전체 조율 및 QA 검수',
    avatar: 'aegis_avatar.jpg',
    mcp: [
      'oracle-oci-api-mcp-server',
      'notebooklm',
      'stitch',
    ],
    api: [
      'Gemini 2.5 Flash (AI Core)',
      'OCI REST API (인프라 제어)',
      'Telegram Bot API (사장 보고)',
    ],
    tools: [
      'view_file', 'run_command', 'write_to_file',
      'grep_search', 'list_dir', 'invoke_subagent',
    ],
  },
  nova: {
    name: 'Nova (노바)',
    role: 'Service Planner — BM 설계 및 레시피 기획',
    avatar: 'nova_avatar.jpg',
    mcp: [
      'notebooklm',
      'stitch',
    ],
    api: [
      'Gemini 2.5 Flash (AI Core)',
      'Notion API (프로젝트 DB)',
      'YouTube Data API v3 (댓글 고통 분석)',
    ],
    tools: [
      'search_web', 'read_url_content', 'write_to_file',
      'view_file', 'generate_image',
    ],
  },
  vivid: {
    name: 'Vivid (비비드)',
    role: 'UI/UX Designer — 브랜드 디자인 및 CSS 변수 배포',
    avatar: 'vivid_avatar.jpg',
    mcp: [
      'stitch',
      'notebooklm',
    ],
    api: [
      'Gemini 2.5 Flash (AI Core)',
      'Google Fonts API',
      'Figma REST API (디자인 에셋 추출)',
    ],
    tools: [
      'generate_image', 'write_to_file', 'view_file',
      'browser_subagent', 'read_url_content',
    ],
  },
  bitz: {
    name: 'Bitz (비츠)',
    role: 'Lead Developer — 코드 빌드 및 API 연동',
    avatar: 'bitz_avatar.jpg',
    mcp: [
      'oracle-oci-api-mcp-server',
      'stitch',
    ],
    api: [
      'Gemini 2.5 Flash (AI Core)',
      'GitHub REST API (PR 검수)',
      'OCI CLI (서버 배포)',
      'npm / pip (패키지 관리)',
    ],
    tools: [
      'run_command', 'write_to_file', 'multi_replace_file_content',
      'view_file', 'grep_search', 'list_dir',
    ],
  },
  echo: {
    name: 'Echo (에코)',
    role: 'Growth Marketer — SEO 최적화 및 카드뉴스 자동화',
    avatar: 'echo_avatar.jpg',
    mcp: [
      'notebooklm',
      'stitch',
    ],
    api: [
      'Gemini 2.5 Flash (AI Core)',
      'Google Search Console API',
      'Google Analytics Data API v1',
      'Canva API (카드뉴스 자동화)',
    ],
    tools: [
      'search_web', 'browser_subagent', 'write_to_file',
      'read_url_content', 'generate_image',
    ],
  },
  carey: {
    name: 'Carey (케리)',
    role: 'Customer Success — GA4 이탈 추적 및 피드백 수집',
    avatar: 'carey_avatar.jpg',
    mcp: [
      'notebooklm',
    ],
    api: [
      'Gemini 2.5 Flash (AI Core)',
      'Google Analytics 4 (GA4 API)',
      'Telegram Bot API (고객 알림)',
      'Zendesk API (티켓 관리)',
    ],
    tools: [
      'search_web', 'write_to_file', 'view_file',
      'read_url_content',
    ],
  },
  insight: {
    name: 'Insight (인사이트)',
    role: 'Trend Analyst — 취업 시장 트렌드 모니터링 및 기회 포착',
    avatar: 'insight_avatar.jpg',
    mcp: [
      'notebooklm'
    ],
    api: [
      'Gemini 2.5 Flash (AI Core)',
      'LinkedIn API (트렌드 분석)',
      'Reddit API (반응 모니터링)'
    ],
    tools: [
      'search_web', 'browser_subagent', 'read_url_content',
      'write_to_file', 'view_file'
    ],
  },
  verity: {
    name: 'Verity (베리티)',
    role: 'QA & Auditor — 할루시네이션 및 오류 방지, 논리 검증',
    avatar: 'verity_avatar.jpg',
    mcp: [
      'notebooklm'
    ],
    api: [
      'Gemini 2.5 Flash (AI Core)',
      'FactCheck API'
    ],
    tools: [
      'grep_search', 'view_file', 'invoke_subagent',
      'read_url_content'
    ],
  }
};

function selectAgent(agentKey) {
  // Update token selection
  document.querySelectorAll('.agent-token').forEach(t => t.classList.remove('selected'));
  const tok = document.getElementById(`token-${agentKey}`);
  if (tok) tok.classList.add('selected');

  // Update spec tabs
  document.querySelectorAll('.spec-tab').forEach((tab, i) => {
    const keys = ['aegis','nova','vivid','bitz','echo','carey'];
    tab.classList.toggle('active', keys[i] === agentKey);
  });

  const spec = AGENT_SPECS[agentKey];
  if (!spec) return;

  const detail = document.getElementById('specDetail');
  if (!detail) return;

  const mcpChips  = spec.mcp.map(m   => `<span class="spec-chip spec-chip--mcp">🔌 ${m}</span>`).join('');
  const apiChips  = spec.api.map(a   => `<span class="spec-chip spec-chip--api">🌐 ${a}</span>`).join('');
  const toolChips = spec.tools.map(t => `<span class="spec-chip spec-chip--tool">🛠 ${t}</span>`).join('');

  detail.innerHTML = `
    <div class="spec-agent-header">
      <img src="${spec.avatar}" alt="${spec.name}" class="spec-agent-avatar">
      <div class="spec-agent-info">
        <h4>${spec.name}</h4>
        <p>${spec.role}</p>
      </div>
    </div>
    <div class="spec-chip-group">
      <span class="spec-chip-label">MCP 서버 연동</span>
      <div class="spec-chips">${mcpChips || '<span style="font-size:11px;color:var(--ink-tertiary)">연동 없음</span>'}</div>
    </div>
    <div class="spec-chip-group">
      <span class="spec-chip-label">외부 API</span>
      <div class="spec-chips">${apiChips}</div>
    </div>
    <div class="spec-chip-group">
      <span class="spec-chip-label">사용 도구</span>
      <div class="spec-chips">${toolChips}</div>
    </div>
  `;
}

// Hook: update pause status from dashboard API response
const _origFetchDashboard = fetchDashboardData;
async function fetchDashboardData() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/dashboard`);
    if (!res.ok) throw new Error("offline");
    const data = await res.json();
    if (serverStatusDot) { serverStatusDot.className = "offline-dot online"; serverStatusDot.title = "API Server Online"; }
    renderLongTermGantt();
    renderGantt(data.action_plan);
    renderProgressChart(data.action_plan);
    renderLogsDoughnut(data.log_stats);
    renderActivityFeed(data.logs);
    renderProjects(data.projects);
    if (data.settings) renderPauseStatus(data.settings);
  } catch {
    if (serverStatusDot) { serverStatusDot.className = "offline-dot"; serverStatusDot.title = "API Server Offline"; }
    if (activityFeed) activityFeed.innerHTML = `<li class="loading-item" style="color:#ba1a1a">⚠️ API 서버 오프라인 — run_dashboard.bat 재실행 필요</li>`;
    if (projectWikiList) projectWikiList.innerHTML = `<li class="loading-item">프로젝트 정보를 가져올 수 없습니다.</li>`;
    renderLongTermGantt();
    renderGantt({});
    renderPauseStatus({ paused: false });
  }
}

// ══════════════════════════════════════════════════════════
//  세컨브레인 드로어 로직
// ══════════════════════════════════════════════════════════
let wikiSearchTimeout = null;
let wikiAllFiles = [];
let wikiDrawerOpen = false;

function openWikiDrawer() {
  const drawer = document.getElementById('wikiDrawer');
  const backdrop = document.getElementById('wikiDrawerBackdrop');
  if (!drawer) return;
  drawer.classList.add('open');
  backdrop.classList.add('active');
  wikiDrawerOpen = true;
  const inp = document.getElementById('wikiSearchInput');
  if (inp) inp.focus();
  if (wikiAllFiles.length === 0) loadWikiFileList();
}

function closeWikiDrawer() {
  const drawer = document.getElementById('wikiDrawer');
  const backdrop = document.getElementById('wikiDrawerBackdrop');
  if (drawer) drawer.classList.remove('open');
  if (backdrop) backdrop.classList.remove('active');
  wikiDrawerOpen = false;
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && wikiDrawerOpen) closeWikiDrawer();
});

async function loadWikiFileList() {
  const listEl = document.getElementById('wikiFileList');
  if (!listEl) return;
  listEl.innerHTML = `<div class="wiki-loading"><div class="wiki-loading-spinner"></div><span>문서 목록 불러오는 중...</span></div>`;
  try {
    const res = await fetch(`${BACKEND_URL}/api/search_wiki?q=`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    wikiAllFiles = data.results || [];
    renderWikiFileList(wikiAllFiles);
  } catch {
    listEl.innerHTML = `<div class="wiki-no-result">⚠️ API 서버에 연결할 수 없습니다</div>`;
  }
}

function renderWikiFileList(files) {
  const listEl = document.getElementById('wikiFileList');
  if (!listEl) return;
  if (!files.length) {
    listEl.innerHTML = `<div class="wiki-no-result">문서가 없습니다</div>`;
    return;
  }
  const groups = {};
  files.forEach(f => {
    const parts = f.path.replace(/\\/g, '/').split('/');
    const folder = parts.length > 2 ? parts[parts.length - 2] : '기타';
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(f);
  });
  const docSVG = `<svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const folderSVG = `<svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  listEl.innerHTML = Object.entries(groups).map(([folder, items]) => `
    <div class="wiki-folder-group">
      <div class="wiki-folder-label">${folderSVG} ${folder}</div>
      ${items.map(f => `
        <div class="wiki-file-item" onclick="selectWikiFile('${f.path.replace(/\\/g, '/')}', this)">
          ${docSVG}<span>${f.title}</span>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function debounceWikiSearch() {
  const val = document.getElementById('wikiSearchInput').value;
  const clearBtn = document.getElementById('wikiSearchClear');
  if (clearBtn) clearBtn.classList.toggle('visible', val.length > 0);
  clearTimeout(wikiSearchTimeout);
  wikiSearchTimeout = setTimeout(performWikiSearch, 280);
}

function clearWikiSearch() {
  const inp = document.getElementById('wikiSearchInput');
  if (inp) inp.value = '';
  const clearBtn = document.getElementById('wikiSearchClear');
  if (clearBtn) clearBtn.classList.remove('visible');
  renderWikiFileList(wikiAllFiles);
  if (inp) inp.focus();
}

async function performWikiSearch() {
  const inp = document.getElementById('wikiSearchInput');
  const listEl = document.getElementById('wikiFileList');
  if (!inp || !listEl) return;
  const query = inp.value.trim();
  if (!query) { renderWikiFileList(wikiAllFiles); return; }

  listEl.innerHTML = `<div class="wiki-loading"><div class="wiki-loading-spinner"></div><span>검색 중...</span></div>`;
  try {
    const res = await fetch(`${BACKEND_URL}/api/search_wiki?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (!data.results || !data.results.length) {
      listEl.innerHTML = `<div class="wiki-no-result">검색 결과가 없습니다</div>`; return;
    }
    listEl.innerHTML = data.results.map(r => `
      <div class="wiki-search-result-item" onclick="selectWikiFile('${r.path.replace(/\\/g, '/')}', this)">
        <strong>${r.title}</strong>
        <span>${r.snippet}</span>
      </div>
    `).join('');
  } catch {
    listEl.innerHTML = `<div class="wiki-no-result" style="color:var(--status-red)">검색 오류</div>`;
  }
}

async function selectWikiFile(path, el) {
  document.querySelectorAll('.wiki-file-item, .wiki-search-result-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  const pane = document.getElementById('wikiPreviewPane');
  if (!pane) return;
  pane.innerHTML = `<div class="wiki-preview-empty"><div class="wiki-loading-spinner"></div><p>불러오는 중...</p></div>`;
  try {
    const res = await fetch(`${BACKEND_URL}/${path}`);
    if (!res.ok) throw new Error();
    const md = await res.text();
    pane.innerHTML = renderMarkdown(md);
  } catch {
    pane.innerHTML = `<div class="wiki-preview-empty"><p style="color:var(--status-red)">문서를 불러오지 못했습니다</p></div>`;
  }
}

function renderMarkdown(md) {
  return md
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    .replace(/^---$/gim, '<hr>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`\n]+)`/gim, '<code>$1</code>')
    .replace(/\n\n/gim, '<br><br>');
}

// 호환용 alias
function openWikiModal() { openWikiDrawer(); }
function closeWikiModal() { closeWikiDrawer(); }
