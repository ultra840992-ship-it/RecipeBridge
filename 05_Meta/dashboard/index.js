// ══════════════════════════════════════════════════════════
//  RecipeBridge Aetheris Dashboard — JS (Rebuild)
//  새 HTML 구조(3컬럼) 기반 에이전트 라우팅 및 MIT Reflection 렌더링
// ══════════════════════════════════════════════════════════

const AGENTS = {
  aegis: {
    name: "Aegis (이지스)",
    role: "Master Coordinator",
    avatar: "aegis_avatar.jpg",
    welcome: "안녕하십니까, 사장님. 마스터 Aegis입니다. 금일 예정된 개발 진척 상황이나 과제 기획 검수를 진행할까요?"
  },
  nova: {
    name: "Nova (노바)",
    role: "Service Planner",
    avatar: "nova_avatar.jpg",
    welcome: "사장님, 안녕하세요! Nova입니다. 오늘 새로운 취업 시장 고통 댓글 분석 결과와 레시피 빌더 템플릿 스펙을 다듬었는데 확인해보시겠어요?"
  },
  vivid: {
    name: "Vivid (비비드)",
    role: "UI/UX Designer",
    avatar: "vivid_avatar.jpg",
    welcome: "디자이너 Vivid 등장! 사장님, Stitch Aetheric Sand 디자인 시스템 반영 완료했습니다. 어떠신가요?"
  },
  bitz: {
    name: "Bitz (비츠)",
    role: "Lead Developer",
    avatar: "bitz_avatar.jpg",
    welcome: "코드 빌드 대기 중인 개발자 Bitz입니다. 사장님, 대시보드 리빌드 완료했습니다. 바로 확인해보시죠!"
  },
  echo: {
    name: "Echo (에코)",
    role: "Growth Marketer",
    avatar: "echo_avatar.jpg",
    welcome: "트래픽 확보 대기 중! Echo입니다. 오늘 아침 구글 서치 콘솔 SEO 유입 검색어 정리 다 끝냈어요. SNS 자동 카드뉴스 시안 보여드릴게요!"
  },
  carey: {
    name: "Carey (케리)",
    role: "Customer Success",
    avatar: "carey_avatar.jpg",
    welcome: "CS 담당 Carey입니다. 사장님, 어제 베타 사이트 가입 페이지 이탈 지표 확인해봤는데, 피드백 정리한 티켓 발행해 두었습니다."
  },
  group: {
    name: "Group Meeting",
    role: "6-Agent Collaboration Chain",
    avatar: null,
    welcome: "[Aegis] 사장님 입장하셨습니다. 금일 마일스톤 회의 및 MIT Reflection 루프 가동을 위해 각 부서 현황 공유하겠습니다."
  }
};

const BACKEND_URL = "http://localhost:8000";

// ── DOM Refs ──
const activeAgentPic  = document.getElementById("activeAgentPic");
const activeAgentName = document.getElementById("activeAgentName");
const activeAgentRole = document.getElementById("activeAgentRole");
const sessionMeta     = document.getElementById("sessionMeta");
const messagesArea    = document.getElementById("messagesArea");
const chatInput       = document.getElementById("chatInput");
const sendBtn         = document.getElementById("sendBtn");
const offlineBanner   = document.getElementById("offlineBanner");
const groupRoomBtn    = document.getElementById("groupRoomBtn");
const networkStatus   = document.getElementById("networkStatus");
const networkLabel    = document.getElementById("networkLabel");

// 우측 패널 에이전트 아이템 DOM 캐싱
const agentPanelItems = {};
Object.keys(AGENTS).forEach(key => {
  if (key === "group") return;
  agentPanelItems[key] = {
    item:    document.getElementById(`panel-${key}`),
    status:  document.getElementById(`status-${key}`),
    talkBar: document.getElementById(`bar-${key}`)
  };
});

let currentAgent   = null;
let isServerOnline = false;
let isRelayRunning = false;

// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════
async function init() {
  await checkServerStatus();

  // 우측 패널 에이전트 클릭 리스너
  document.querySelectorAll(".agent-item__btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (isRelayRunning) return;
      selectAgent(btn.getAttribute("data-agent"));
    });
  });

  // 협업방(Group Meeting) 버튼 — 선택 후 자동으로 회의 지시 전송
  groupRoomBtn.addEventListener("click", async () => {
    if (isRelayRunning) return;
    if (!isServerOnline) {
      alert("API 서버가 오프라인입니다. run_dashboard.bat 를 실행하세요.");
      return;
    }
    selectAgent("group");
    // 약간의 딜레이 후 자동으로 회의 킥오프 메시지 전송
    await new Promise(r => setTimeout(r, 300));
    chatInput.value = "지금 바로 6인 전체 회의를 시작해 주세요. RecipeBridge 현황 점검 및 MIT Reflection 루프 가동.";
    sendMessage();
  });

  // 전송
  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });

  // 탭 버튼 (시각 전환만)
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("tab-btn--active"));
      btn.classList.add("tab-btn--active");
    });
  });

  // 기동 시 Aegis 자동 선택
  setTimeout(() => selectAgent("aegis"), 400);
}

// ══════════════════════════════════════════════════════════
//  SERVER STATUS CHECK
// ══════════════════════════════════════════════════════════
async function checkServerStatus() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/status`);
    if (!res.ok) throw new Error();
    isServerOnline = true;
    offlineBanner.classList.add("hidden");
    chatInput.disabled = false;
    sendBtn.disabled   = false;
    chatInput.placeholder = "Command the agents...";

    // 네트워크 패널 업데이트
    const dot = networkStatus.querySelector(".network-dot");
    dot.className = "network-dot network-dot--green";
    networkLabel.textContent = "Optimal Performance";
  } catch {
    isServerOnline = false;
    offlineBanner.classList.remove("hidden");
    chatInput.disabled = true;
    sendBtn.disabled   = true;
    chatInput.placeholder = "⚠️ API 서버 오프라인 — run_dashboard.bat 실행 필요";

    const dot = networkStatus.querySelector(".network-dot");
    dot.className = "network-dot network-dot--red";
    networkLabel.textContent = "Server Offline";
  }
}

// ══════════════════════════════════════════════════════════
//  SELECT AGENT
// ══════════════════════════════════════════════════════════
function selectAgent(agentKey) {
  currentAgent = agentKey;
  const data   = AGENTS[agentKey];

  // 헤더 업데이트
  activeAgentName.textContent = data.name;
  activeAgentRole.textContent = data.role;

  if (data.avatar) {
    activeAgentPic.src = data.avatar;
    activeAgentPic.style.display = "block";
  } else {
    activeAgentPic.style.display = "none";
  }

  sessionMeta.textContent = agentKey === "group"
    ? "6 Agents Active in Session"
    : `${data.name} · ${data.role}`;

  if (isServerOnline) {
    chatInput.placeholder = agentKey === "group"
      ? "Command the agents..."
      : `Message ${data.name}...`;
  }

  // 우측 패널 활성 에이전트 강조
  Object.entries(agentPanelItems).forEach(([key, refs]) => {
    if (!refs.item) return;
    if (key === agentKey) {
      refs.item.classList.add("agent-item--active");
    } else {
      refs.item.classList.remove("agent-item--active");
    }
  });

  // 메시지 초기화 & 웰컴
  messagesArea.innerHTML = "";
  addMessage(agentKey === "group" ? "aegis" : agentKey, data.welcome, false);
}

// ══════════════════════════════════════════════════════════
//  ADD MESSAGE
// ══════════════════════════════════════════════════════════
function addMessage(senderKey, text, isOwner = false, isGroupRoom = false) {
  const row = document.createElement("div");
  row.className = `msg-row${isOwner ? " owner-msg" : ""}`;

  // 아바타
  if (!isOwner && senderKey !== "group") {
    const avatarImg = document.createElement("img");
    avatarImg.className = "msg-avatar";
    avatarImg.src = AGENTS[senderKey]?.avatar || "";
    avatarImg.alt = AGENTS[senderKey]?.name || senderKey;
    row.appendChild(avatarImg);
  }

  const container = document.createElement("div");
  container.className = "msg-bubble-container";

  // 이름 레이블
  const nameLbl = document.createElement("span");
  nameLbl.className = "sender-name-lbl";
  nameLbl.textContent = isOwner ? "사장님 (대표)" : (AGENTS[senderKey]?.name || senderKey);
  container.appendChild(nameLbl);

  // 버블
  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";

  // 크리틱 강조
  if (text.startsWith("[마스터 크리틱]")) {
    bubble.classList.add("bubble--critic");
  }
  // Nova 발언 하이라이트
  if (senderKey === "nova" && isGroupRoom) {
    bubble.classList.add("bubble--highlight");
  }

  // 협업방 태그
  if (isGroupRoom && !isOwner) {
    const tag = document.createElement("span");
    tag.className = `tag-badge tag-${senderKey}`;
    tag.textContent = senderKey.toUpperCase();
    bubble.appendChild(tag);
  }

  // 텍스트 (줄바꿈 + 코드블록 처리)
  const formattedText = text
    .replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${escapeHTML(code.trim())}</code></pre>`)
    .replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHTML(code)}</code>`)
    .replace(/\n/g, "<br>");

  const textNode = document.createElement("span");
  textNode.innerHTML = formattedText;
  bubble.appendChild(textNode);

  container.appendChild(bubble);
  row.appendChild(container);
  messagesArea.appendChild(row);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function escapeHTML(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ══════════════════════════════════════════════════════════
//  TALKING SPEAKER — 우측 패널 상태 업데이트
// ══════════════════════════════════════════════════════════
function setTalkingSpeaker(speakerKey) {
  const data = AGENTS[speakerKey];

  // 헤더 실시간 전환
  if (data) {
    activeAgentName.textContent = data.name;
    activeAgentRole.textContent = data.role;
    if (data.avatar) {
      activeAgentPic.src = data.avatar;
      activeAgentPic.style.display = "block";
    } else {
      activeAgentPic.style.display = "none";
    }
  }

  // 우측 패널 — 발언 중 에이전트 강조
  Object.entries(agentPanelItems).forEach(([key, refs]) => {
    if (!refs.item) return;
    const isTalking = (key === speakerKey);
    refs.item.classList.toggle("agent-item--talking", isTalking);

    // 상태 텍스트
    if (isTalking) {
      refs.status.textContent = "Generating";
      refs.status.className   = "agent-item__status agent-status--generating";
      refs.talkBar.classList.remove("hidden");
    } else {
      refs.status.textContent = "Idle";
      refs.status.className   = "agent-item__status agent-status--idle";
      refs.talkBar.classList.add("hidden");
    }
  });
}

function clearTalkingState() {
  Object.entries(agentPanelItems).forEach(([key, refs]) => {
    if (!refs.item) return;
    refs.item.classList.remove("agent-item--talking");
    refs.talkBar.classList.add("hidden");
    refs.status.textContent = key === currentAgent ? "Monitoring" : "Idle";
    refs.status.className   = key === currentAgent
      ? "agent-item__status agent-status--monitoring"
      : "agent-item__status agent-status--idle";
  });

  isRelayRunning = false;
  chatInput.disabled = false;
  sendBtn.disabled   = false;
  chatInput.placeholder = currentAgent === "group"
    ? "Command the agents..."
    : `Message ${AGENTS[currentAgent]?.name || ""}...`;

  // 헤더 복구
  const data = AGENTS[currentAgent];
  if (data) {
    activeAgentName.textContent = data.name;
    activeAgentRole.textContent = data.role;
    if (data.avatar) { activeAgentPic.src = data.avatar; activeAgentPic.style.display = "block"; }
    else { activeAgentPic.style.display = "none"; }
  }
}

// ══════════════════════════════════════════════════════════
//  SEND MESSAGE
// ══════════════════════════════════════════════════════════
async function sendMessage() {
  if (!isServerOnline) {
    alert("API 서버가 오프라인입니다. run_dashboard.bat 를 실행하세요.");
    return;
  }
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = "";
  addMessage(currentAgent, text, true);

  isRelayRunning     = true;
  chatInput.disabled = true;
  sendBtn.disabled   = true;
  chatInput.placeholder = "에이전트들이 처리 중입니다...";

  const firstSpeaker = currentAgent === "group" ? "aegis" : currentAgent;
  setTalkingSpeaker(firstSpeaker);
  showTypingIndicator(firstSpeaker);

  // 그룹 회의는 Gemini를 9회 순차 호출 → 최대 5분 타임아웃 설정
  const timeoutMs = currentAgent === "group" ? 5 * 60 * 1000 : 60 * 1000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // 그룹 회의 시 진행 상황 안내 토스트 표시
  let progressToast = null;
  if (currentAgent === "group") {
    progressToast = showProgressToast();
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ agent: currentAgent, message: text }),
      signal:  controller.signal
    });
    clearTimeout(timer);
    hideTypingIndicator();
    if (progressToast) progressToast.remove();

    if (response.ok) {
      const result  = await response.json();
      const replies = result.replies || [];
      renderRepliesQueue(replies, currentAgent === "group");
    } else {
      const errBody = await response.text().catch(() => "");
      addMessage(currentAgent, `[Error] 서버 응답 오류 (HTTP ${response.status})\n${errBody}`, false);
      clearTalkingState();
    }
  } catch (err) {
    clearTimeout(timer);
    hideTypingIndicator();
    if (progressToast) progressToast.remove();
    const msg = err.name === "AbortError"
      ? "[Timeout] 서버 응답이 너무 오래 걸렸습니다. 서버를 재기동하거나 1:1 대화를 시도해보세요."
      : `[Error] 서버와의 통신 중 예외 발생: ${err.message}`;
    addMessage(currentAgent, msg, false);
    clearTalkingState();
  }
}

// ══════════════════════════════════════════════════════════
//  RENDER REPLIES QUEUE (Auto-Handoff + Reflection)
// ══════════════════════════════════════════════════════════
function renderRepliesQueue(queue, isGroupRoom) {
  if (queue.length === 0) {
    clearTalkingState();
    return;
  }

  const reply     = queue.shift();
  const speaker   = reply.agent;
  const replyText = reply.text;

  setTalkingSpeaker(speaker);
  showTypingIndicator(speaker);

  setTimeout(() => {
    hideTypingIndicator();
    addMessage(speaker, replyText, false, isGroupRoom);
    renderRepliesQueue(queue, isGroupRoom);
  }, 2500);
}

// ══════════════════════════════════════════════════════════
//  TYPING INDICATOR
// ══════════════════════════════════════════════════════════
function showTypingIndicator(speakerKey) {
  hideTypingIndicator();

  const row = document.createElement("div");
  row.id        = "typingIndicator";
  row.className = "msg-row";

  if (speakerKey !== "group" && AGENTS[speakerKey]?.avatar) {
    const img = document.createElement("img");
    img.className = "msg-avatar";
    img.src = AGENTS[speakerKey].avatar;
    img.alt = AGENTS[speakerKey].name;
    row.appendChild(img);
  }

  const container = document.createElement("div");
  container.className = "msg-bubble-container";

  const nameLbl = document.createElement("span");
  nameLbl.className   = "sender-name-lbl";
  nameLbl.textContent = AGENTS[speakerKey]?.name || speakerKey;
  container.appendChild(nameLbl);

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble typing-bubble";
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("div");
    dot.className = "typing-dot";
    bubble.appendChild(dot);
  }

  container.appendChild(bubble);
  row.appendChild(container);
  messagesArea.appendChild(row);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function hideTypingIndicator() {
  document.getElementById("typingIndicator")?.remove();
}

// ══════════════════════════════════════════════════════════
//  PROGRESS TOAST — 그룹 회의 처리 중 안내
// ══════════════════════════════════════════════════════════
function showProgressToast() {
  // 기존 토스트 제거
  document.getElementById("progressToast")?.remove();

  const toast = document.createElement("div");
  toast.id = "progressToast";
  toast.style.cssText = `
    position: fixed;
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(28,28,25,0.92);
    color: #ffe08a;
    font-family: 'Hanken Grotesk', sans-serif;
    font-size: 13px;
    font-weight: 600;
    padding: 12px 22px;
    border-radius: 9999px;
    border: 1px solid rgba(212,175,55,0.35);
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: toastIn 0.3s cubic-bezier(0.16,1,0.3,1) both;
    white-space: nowrap;
  `;

  // 스피너
  const spinner = document.createElement("div");
  spinner.style.cssText = `
    width: 14px; height: 14px;
    border: 2px solid rgba(212,175,55,0.3);
    border-top-color: #d4af37;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  `;

  // 카운터 텍스트
  const label = document.createElement("span");
  label.id = "toastLabel";
  label.textContent = "6인 AI 회의 진행 중 (Gemini 순차 호출)...";

  toast.appendChild(spinner);
  toast.appendChild(label);

  // 스타일 삽입 (한 번만)
  if (!document.getElementById("toastStyles")) {
    const style = document.createElement("style");
    style.id = "toastStyles";
    style.textContent = `
      @keyframes toastIn {
        from { opacity: 0; transform: translateX(-50%) translateY(12px); }
        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // 경과 시간 카운터 업데이트
  let elapsed = 0;
  const steps = ["Aegis 소집...", "Nova 기획...", "Vivid 디자인...", "Bitz 1차 개발...", "Aegis 크리틱...", "Bitz 2차 반영...", "Echo 마케팅...", "Carey CS...", "Aegis 최종 요약..."];
  let stepIdx = 0;
  const interval = setInterval(() => {
    elapsed++;
    if (stepIdx < steps.length) {
      label.textContent = `[${elapsed}s] ${steps[stepIdx]} (총 9단계 중 ${stepIdx + 1}단계)`;
      if (elapsed % 20 === 0) stepIdx++;
    } else {
      label.textContent = `[${elapsed}s] Aegis 최종 보고 작성 중...`;
    }
    if (!document.getElementById("progressToast")) clearInterval(interval);
  }, 1000);

  toast._interval = interval;
  return toast;
}

// ── 실행 ──
window.onload = init;
