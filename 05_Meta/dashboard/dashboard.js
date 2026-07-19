// ══════════════════════════════════════════════════════════
//  RecipeBridge Portal Dashboard — JavaScript v2
//  간트차트, Aegis 보고 위젯, Chart.js, 실시간 로그 피드
// ══════════════════════════════════════════════════════════

const BACKEND_URL = "http://localhost:8000";

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
//  간트차트 정적 데이터 (action_plan.md 4주 로드맵 기반)
//  startWeek/endWeek: 1~4, ownerColor: CSS 변수에서 가져온 색상
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const GANTT_DATA = [
  {
    agent: "Aegis (이지스)",
    key: "aegis",
    color: "#735c00",
    tasks: [
      { label: "기획·디자인 산출물 검수 및 승인", start: 1, end: 1, status: "planned" },
      { label: "포트폴리오 AI 검증 프롬프트 설계", start: 1, end: 2, status: "planned" },
      { label: "Bitz PR 코드 검수 및 배포 승인", start: 2, end: 3, status: "planned" },
      { label: "전체 시스템 QA 검수 및 최종 승인", start: 4, end: 4, status: "planned" }
    ]
  },
  {
    agent: "Nova (노바)",
    key: "nova",
    color: "#2a5d80",
    tasks: [
      { label: "블라인드 프로젝트 기여 인증 프로필 UI 기획", start: 1, end: 1, status: "planned" },
      { label: "스타트업 과제 스펙 세부 기획 (마이크로 프로젝트)", start: 1, end: 2, status: "planned" },
      { label: "레시피 팩 3종 프롬프트 패키징 완료", start: 2, end: 2, status: "planned" }
    ]
  },
  {
    agent: "Vivid (비비드)",
    key: "vivid",
    color: "#6a3080",
    tasks: [
      { label: "피그마 와이어프레임 완성", start: 1, end: 1, status: "planned" },
      { label: "HSL 컬러 & 타이포 CSS 변수 배포", start: 1, end: 1, status: "planned" },
      { label: "반응형 레이아웃 & UX 가이드라인 공급", start: 2, end: 2, status: "planned" }
    ]
  },
  {
    agent: "Bitz (비츠)",
    key: "bitz",
    color: "#1d6840",
    tasks: [
      { label: "Vite + React 레포 구성 및 UI 퍼블리싱", start: 2, end: 2, status: "planned" },
      { label: "Notion API 연동 (과제 DB 실시간 뷰)", start: 2, end: 2, status: "planned" },
      { label: "AI 레시피 샌드박스 렌더러 구현", start: 2, end: 3, status: "planned" },
      { label: "VPS 백업·복원 스크립트 및 텔레그램 봇", start: 3, end: 3, status: "planned" }
    ]
  },
  {
    agent: "Echo (에코)",
    key: "echo",
    color: "#8a2800",
    tasks: [
      { label: "SEO 랜딩 페이지 최적화", start: 3, end: 3, status: "planned" },
      { label: "SNS 카드뉴스 자동화 크론 연동", start: 3, end: 3, status: "planned" },
      { label: "구글 서치 콘솔 색인 등록 루틴 테스트", start: 3, end: 4, status: "planned" }
    ]
  },
  {
    agent: "Carey (케리)",
    key: "carey",
    color: "#2a3880",
    tasks: [
      { label: "GA4 이벤트 트래킹 태그 설계", start: 2, end: 2, status: "planned" },
      { label: "베타 테스터 설문 및 Pain Index 분류기", start: 4, end: 4, status: "planned" },
      { label: "고객 불만 피드백 채널 개설", start: 4, end: 4, status: "planned" }
    ]
  }
];

// 오늘 날짜 기준 진도 계산
const PROJECT_START = new Date("2026-07-19");
const PROJECT_END   = new Date("2026-08-15");
const TODAY         = new Date();

function calcWeekProgress() {
  const totalMs = PROJECT_END - PROJECT_START;
  const elapsedMs = Math.max(0, Math.min(TODAY - PROJECT_START, totalMs));
  return elapsedMs / totalMs; // 0~1
}

function todayWeekFraction() {
  // 오늘이 전체 4주 중 몇 %인지
  const startMs = PROJECT_START.getTime();
  const endMs   = PROJECT_END.getTime();
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

    // 4주 배경 구분선
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
      `;
      barEl.title = task.label;

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

    renderGantt(data.action_plan);
    renderAgentProgress(data.action_plan);
    renderLogsDoughnut(data.log_stats);
    renderActivityFeed(data.logs);
    renderProjects(data.projects);

  } catch {
    if (serverStatusDot) { serverStatusDot.className = "offline-dot"; serverStatusDot.title = "API Server Offline"; }
    if (activityFeed) activityFeed.innerHTML = `<li class="loading-item" style="color:#ba1a1a">⚠️ API 서버 오프라인 — run_dashboard.bat 재실행 필요</li>`;
    if (projectWikiList) projectWikiList.innerHTML = `<li class="loading-item">프로젝트 정보를 가져올 수 없습니다.</li>`;
    // 오프라인이어도 간트차트는 정적 데이터로 렌더링
    renderGantt({});
  }
}

// ── 에이전트 프로그레스 바 ──
function renderAgentProgress(actionPlan) {
  const agents = ["aegis","nova","vivid","bitz","echo","carey"];
  const data = [], labels = ["Aegis","Nova","Vivid","Bitz","Echo","Carey"];
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
  const labels = Object.keys(logStats).map(l => l.toUpperCase());
  const vals   = Object.values(logStats);
  if (!labels.length) { labels.push("NO DATA"); vals.push(1); }
  const ctx = document.getElementById("logsDoughnutChart")?.getContext("2d");
  if (!ctx) return;
  if (logsDoughnutChart) { logsDoughnutChart.data.labels=labels; logsDoughnutChart.data.datasets[0].data=vals; logsDoughnutChart.update(); return; }
  logsDoughnutChart = new Chart(ctx, {
    type:"doughnut",
    data:{ labels, datasets:[{ data:vals, backgroundColor:["#d4af37","#4a7a96","#3f8c5b","#7f7663","#ba1a1a"], borderWidth:2, borderColor:"#ffffff" }] },
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
  meeting: { left: 46, top: 44 },
  lounge:  { left: 76, top: 74 },
};

// Wander sub-positions within desk areas (slight offsets)
const WANDER_OFFSETS = [
  { dl: 2, dt: 3 }, { dl: -2, dt: 2 }, { dl: 3, dt: -2 }, { dl: -3, dt: -3 },
  { dl: 0, dt: 4 }, { dl: 4, dt: 0 },
];

const AGENTS = ['aegis', 'nova', 'vivid', 'bitz', 'echo', 'carey'];

// State: which room each agent is in
const agentRooms   = { aegis: 'aegis', nova: 'nova', vivid: 'vivid', bitz: 'bitz', echo: 'echo', carey: 'carey' };
const agentBubbles = { aegis: 'idle 🛡️', nova: 'idle 💡', vivid: 'idle 🎨', bitz: 'idle 💻', echo: 'idle 📢', carey: 'idle 🎧' };

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
    renderGantt(data.action_plan);
    renderAgentProgress(data.action_plan);
    renderLogsDoughnut(data.log_stats);
    renderActivityFeed(data.logs);
    renderProjects(data.projects);
    if (data.settings) renderPauseStatus(data.settings);
  } catch {
    if (serverStatusDot) { serverStatusDot.className = "offline-dot"; serverStatusDot.title = "API Server Offline"; }
    if (activityFeed) activityFeed.innerHTML = `<li class="loading-item" style="color:#ba1a1a">⚠️ API 서버 오프라인 — run_dashboard.bat 재실행 필요</li>`;
    if (projectWikiList) projectWikiList.innerHTML = `<li class="loading-item">프로젝트 정보를 가져올 수 없습니다.</li>`;
    renderGantt({});
    renderPauseStatus({ paused: false });
  }
}
