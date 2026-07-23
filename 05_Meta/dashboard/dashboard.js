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
        label: "[Lv2] 스마트계약 아키텍처 해시 검증", start: 1, end: 1, status: "planned",
        details: [{ name: "결제/매칭 인증서 스마트계약 서명 체계 검증", target: 1 }]
      },
      { 
        label: "[Lv2] 기여인증 서명 최종 보안 정책 수립", start: 1, end: 2, status: "planned",
        details: [{ name: "구직자 기여인증 보안 해시 체인 및 해킹 방지 정책 확정", target: 2 }]
      },
      { 
        label: "[Lv3] 에이전트 6인 최종 릴리즈 교차 QA", start: 2, end: 3, status: "planned",
        details: [{ name: "릴리즈 코드/문서 정합성 및 배포 서명 최종 승인", target: 3 }]
      },
      {
        label: "[Lv4] 실시간 트래픽 대응 비즈니스 모니터링 & AI 롤백 배포", start: 4, end: 4, status: "planned",
        details: [{ name: "정식 런칭 후 트래픽 모니터링 및 AI 오작동 롤백 시스템 배포", target: 4 }]
      }
    ]
  },
  {
    agent: "Nova (노바)",
    key: "nova",
    color: "#2a5d80",
    tasks: [
      { 
        label: "[Lv2] 결제모듈 도입 차등수수료 기획", start: 1, end: 1, status: "planned",
        details: [{ name: "결제 도입에 따른 구간별 차등 수수료 모델 기획", target: 1 }]
      },
      { 
        label: "[Lv2] 매칭 탈락 구직자 보상 환불 정책", start: 1, end: 2, status: "planned",
        details: [{ name: "매칭 실패 시 보상 포인트 및 환불 정책 시나리오 확정", target: 2 }]
      },
      { 
        label: "[Lv3] 채용 연계 대행 비즈니스 정책 수립", start: 2, end: 2, status: "planned",
        details: [{ name: "블라인드 명세서 기반 B2B 채용 연계 프로세스 설계", target: 2 }]
      },
      {
        label: "[Lv4] 베타 피드백 반영 B2B 채용 과제 확장 기획서 수립", start: 4, end: 4, status: "planned",
        details: [{ name: "베타 테스터 50인 피드백 데이터 기반 2차 기획 및 B2B 채용 과제 확장", target: 4 }]
      }
    ]
  },
  {
    agent: "Vivid (비비드)",
    key: "vivid",
    color: "#6a3080",
    tasks: [
      { 
        label: "[Lv2] 대시보드 컴포넌트 와이어프레임", start: 1, end: 1, status: "planned",
        details: [{ name: "진행중/완료/대기 매칭 상세 뷰 와이어프레임 설계", target: 1 }]
      },
      { 
        label: "[Lv2] 실시간 매칭 상태 모달 UX 디자인", start: 1, end: 2, status: "planned",
        details: [{ name: "매칭 진행 상태 모달 UI 가이드라인 배포", target: 2 }]
      },
      { 
        label: "[Lv3] Pretendard 웹폰트 최적화 가이드", start: 2, end: 2, status: "planned",
        details: [{ name: "프론트 로딩 속도 향상을 위한 폰트 경량화 가이드라인", target: 2 }]
      },
      {
        label: "[Lv4] 실사용자 UI 피드백 반영 모바일 반응형 인터랙션 최적화", start: 4, end: 4, status: "planned",
        details: [{ name: "실사용자 UI 피드백 반영 모바일 반응형 컴포넌트 최적화 배포", target: 4 }]
      }
    ]
  },
  {
    agent: "Bitz (비츠)",
    key: "bitz",
    color: "#1d6840",
    tasks: [
      { 
        label: "[Lv2] 매칭상태 변경 DB 스키마 설계", start: 1, end: 1, status: "planned",
        details: [{ name: "실시간 상태 제어용 DB 컬럼 패치 및 연동 설계", target: 1 }]
      },
      { 
        label: "[Lv2] 백엔드 결제 라우팅 연동 테스트", start: 1, end: 2, status: "planned",
        details: [{ name: "live_server.py 기반 결제/매칭 API 샌드박스 검증", target: 2 }]
      },
      { 
        label: "[Lv3] 코드 스플리팅 및 캐시 최적화 배포", start: 2, end: 3, status: "planned",
        details: [{ name: "초기 번들 최소화 및 Cache-Control 연동 배포", target: 3 }]
      },
      {
        label: "[Lv4] 결제/매칭 API 예외 처리 강화 & Sentry 연동 실서버 배포", start: 4, end: 4, status: "planned",
        details: [{ name: "결제/매칭 API 예외 처리 강화 및 실시간 에러 로그 Sentry 연동 배포", target: 4 }]
      }
    ]
  },
  {
    agent: "Echo (에코)",
    key: "echo",
    color: "#8a2800",
    tasks: [
      { 
        label: "[Lv2] 블라인드 채용 UTM 설계", start: 1, end: 2, status: "planned",
        details: [{ name: "취업 커뮤니티 바이럴 추적용 UTM 태깅 규격 기획", target: 2 }]
      },
      { 
        label: "[Lv3] 스키마 마크업/리치 스니펫 최적화", start: 2, end: 3, status: "planned",
        details: [{ name: "구글 서치콘솔 검색 결과 노출 고도화 스키마 구현", target: 3 }]
      },
      { 
        label: "[Lv3] 런칭 바이럴 카드뉴스 크론 배포", start: 3, end: 4, status: "planned",
        details: [{ name: "SNS 자동 업로드 크론 활용 카드뉴스 배포", target: 4 }]
      },
      {
        label: "[Lv4] 실 서비스 마케팅 퍼널 분석 & UTM 성과 리포팅", start: 4, end: 4, status: "planned",
        details: [{ name: "서치콘솔 및 UTM 퍼널 성과 리포팅 자동화", target: 4 }]
      }
    ]
  },
  {
    agent: "Carey (케리)",
    key: "carey",
    color: "#2a3880",
    tasks: [
      { 
        label: "[Lv2] 챗봇 에스컬레이션 시나리오", start: 1, end: 2, status: "planned",
        details: [{ name: "FAQ 미해결 시 슬랙/이메일 브리지 에스컬레이션 구현", target: 2 }]
      },
      { 
        label: "[Lv3] 가입이탈 이메일링(CS-EB-001) 연동", start: 2, end: 3, status: "planned",
        details: [{ name: "GA4 이탈자 트래킹 기반 자동 복귀 메일링 자동화", target: 3 }]
      },
      { 
        label: "[Lv3] 고객불만 티켓 수집 채널 개설", start: 3, end: 3, status: "planned",
        details: [{ name: "피드백 수집용 CS 티켓 구조 백로그 적재", target: 3 }]
      },
      {
        label: "[Lv4] CS 피드백 티켓팅 & 이탈 긴급 대응 매뉴얼 동기화", start: 4, end: 4, status: "planned",
        details: [{ name: "1:1 피드백 수집 및 고통 지수 분석을 통한 이탈 대응 CS 동기화", target: 4 }]
      }
    ]
  },
  {
    agent: "Insight (인사이트)",
    key: "insight",
    color: "#5c3a21",
    tasks: [
      { 
        label: "[Lv2] 경쟁사 단기 매칭 BM 추이 분석", start: 1, end: 1, status: "planned",
        details: [{ name: "원티드 긱스 등 유사 플랫폼 BM 변화 비교", target: 1 }]
      },
      { 
        label: "[Lv2] 구인 스타트업 단기 예산 조사", start: 1, end: 2, status: "planned",
        details: [{ name: "개발/디자인 단기 프로젝트 평균 예산 스펙트럼 분석", target: 2 }]
      },
      { 
        label: "[Lv3] 3단계 비즈니스 차별화 강화 보고", start: 2, end: 3, status: "planned",
        details: [{ name: "경쟁사 대응 RecipeBridge 경쟁 우위 전략 보고서 작성", target: 3 }]
      },
      {
        label: "[Lv4] 가입 유저 패턴 분석 기반 리텐션 증대 차별화 보고서", start: 4, end: 4, status: "planned",
        details: [{ name: "초기 가입 유저 패턴 분석 및 체류 시간 증대 차별화 보고서 작성", target: 4 }]
      }
    ]
  },
  {
    agent: "Verity (베리티)",
    key: "verity",
    color: "#4a4a4a",
    tasks: [
      { 
        label: "[Lv2] 매칭/결제 라우팅 취약점 사전 해킹", start: 1, end: 2, status: "planned",
        details: [{ name: "Bitz의 라우팅 스크립트 SQL 인젝션 취약성 공격 시뮬레이션", target: 2 }]
      },
      { 
        label: "[Lv3] 최적화 코드 개인정보 유출 감사", start: 2, end: 3, status: "planned",
        details: [{ name: "CS-EB-001 메일링 데이터 전송 스펙 보안 감사", target: 3 }]
      },
      { 
        label: "[Lv3] 시스템 할루시네이션 방지 최종 검증", start: 3, end: 4, status: "planned",
        details: [{ name: "최종 산출물 검증 기준표 작성 및 크리틱 매뉴얼 점검", target: 4 }]
      },
      {
        label: "[Lv4] 실서버 배포 후 정밀 보안 침투 테스트(SQLi/XSS) 감사", start: 4, end: 4, status: "planned",
        details: [{ name: "실서버 배포 취약점 침투 테스트 및 외부 API key 노출 여부 최종 감사", target: 4 }]
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
const PROJECT_START = new Date("2026-07-21");
const PROJECT_END   = new Date("2026-07-24");
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

function buildDynamicGanttData(actionPlan) {
  if (!actionPlan || Object.keys(actionPlan).length === 0) return GANTT_DATA;

  const agentConfig = {
    aegis: { agent: "Aegis (이지스)", color: "#735c00" },
    nova: { agent: "Nova (노바)", color: "#2a5d80" },
    vivid: { agent: "Vivid (비비드)", color: "#6a3080" },
    bitz: { agent: "Bitz (비츠)", color: "#1d6840" },
    echo: { agent: "Echo (에코)", color: "#8a2800" },
    carey: { agent: "Carey (케리)", color: "#2a3880" },
    insight: { agent: "Insight (인사이트)", color: "#5c3a21" },
    verity: { agent: "Verity (베리티)", color: "#4a4a4a" }
  };

  const dynamicGantt = [];

  Object.keys(agentConfig).forEach(key => {
    const cfg = agentConfig[key];
    const planData = actionPlan[key];
    const staticRow = GANTT_DATA.find(r => r.key === key);
    let tasks = [];

    if (planData && planData.tasks && planData.tasks.length > 0) {
      planData.tasks.forEach(t => {
        const txt = t.text;
        let start = 1, end = 2;
        if (txt.includes("[Lv2]")) { start = 1; end = 2; }
        else if (txt.includes("[Lv3]")) { start = 2; end = 3; }
        else if (txt.includes("[Lv4]")) { start = 4; end = 4; }
        else if (txt.includes("[Advance]")) { start = 1; end = 2; }

        tasks.push({
          label: txt,
          start: start,
          end: end,
          completed: t.completed,
          details: [{ name: txt, target: end }]
        });
      });
    } else if (staticRow) {
      tasks = staticRow.tasks;
    }

    dynamicGantt.push({
      agent: cfg.agent,
      key: key,
      color: cfg.color,
      tasks: tasks
    });
  });

  return dynamicGantt;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  간트차트 렌더러
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function renderGantt(actionPlan) {
  const body = document.getElementById("ganttBody");
  if (!body) return;
  body.innerHTML = "";

  const ganttList = buildDynamicGanttData(actionPlan);

  ganttList.forEach(agentRow => {
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

      const weekFrac = todayWeekFraction();
      const taskMidFrac = ((task.start - 0.5) / 4);
      const isDone = task.completed !== undefined ? task.completed : (weekFrac >= taskMidFrac && pct > 0);
      const isDelayed = !isDone && (weekFrac > (task.end / 4));

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
    line.style.left = `calc(160px + (100% - 160px) * ${frac})`;
    line.style.display = frac >= 0 && frac <= 1 ? "block" : "none";
    line.title = `오늘 (${TODAY.toLocaleDateString("ko-KR")})`;
  }

  // ── 자동 스프린트 전환 감지 ──────────────────────────────
  checkAutoAdvanceSprint(actionPlan);
}

// 모든 에이전트가 100% 완료되면 다음 스프린트로 전환 알림 및 자동 업데이트
let _sprintAdvancedThisSession = false;

function checkAutoAdvanceSprint(actionPlan) {
  if (_sprintAdvancedThisSession) return;
  const keys = Object.keys(actionPlan);
  if (!keys.length) return;

  const allDone = keys.every(k => {
    const d = actionPlan[k];
    return d.total > 0 && d.completed >= d.total;
  });

  if (!allDone) return;
  _sprintAdvancedThisSession = true;

  // 배너 표시
  const banner = document.getElementById("sprintAdvanceBanner");
  if (banner) {
    banner.classList.remove("hidden");
    setTimeout(() => banner.classList.add("banner-visible"), 50);
  }

  // 간트 태스크 레이블 "Lv1 → Lv2"로 업데이트 (다음 스프린트 진입 표시)
  GANTT_DATA.forEach(row => {
    row.tasks.forEach(task => {
      task.label = task.label.replace("[Lv1]", "[Lv2]");
      if (task.details) {
        task.status = "planned";
      }
    });
  });
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
    renderBusinessKPIs(data.action_plan, data.wiki_count);
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

// ── 실질 사업 KPI 렌더러 ──
function renderBusinessKPIs(actionPlan, wikiCount = 0) {
  let totalTasks = 0;
  let completedTasks = 0;
  Object.values(actionPlan).forEach(p => {
    totalTasks += p.total || 0;
    completedTasks += p.completed || 0;
  });
  const globalProgress = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
  const pct = Math.round(globalProgress * 100);

  // 1. R&R 마일스톤 전체 완료율
  updateKPIDom("startups", pct, 100, "%");
  
  // 2. 누적 완료 태스크 수
  updateKPIDom("users", completedTasks, totalTasks || 40, "개");
  
  // 3. 미완성 잔여 태스크 수
  const pendingTasks = Math.max(0, totalTasks - completedTasks);
  updateKPIDom("certs", pendingTasks, totalTasks || 40, "개");
  
  // 4. Wiki 마크다운 산출물 파일 수
  updateKPIDom("matchings", wikiCount, 50, "개");
  
  // 5. 서버 가동 헬스 점수 (정상인 경우 100)
  updateKPIDom("revenue", 100, 100, "점");
}

function updateKPIDom(id, val, target, suffix = "개") {
  const textEl = document.getElementById(`kpi-${id}`);
  const pbEl   = document.getElementById(`kpi-pb-${id}`);
  if (textEl) {
    if (suffix === "%") {
      textEl.innerHTML = `<strong>${val}</strong>%`;
    } else if (suffix === "점") {
      textEl.innerHTML = `<strong>${val}</strong> / ${target}점`;
    } else {
      textEl.innerHTML = `<strong>${val}</strong> / ${target}개`;
    }
  }
  if (pbEl) {
    const pct = Math.min(100, Math.round((val / target) * 100));
    pbEl.style.width = `${pct}%`;
  }
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
    renderBusinessKPIs(data.action_plan, data.wiki_count);
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
