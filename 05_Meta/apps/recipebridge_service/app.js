/* ==========================================================================
   RECIPEBRIDGE COMMERCIAL SERVICE APP — INTERACTIVE JAVASCRIPT (BÉCANE)
   Reflecting 02_Wiki Philosophies & 01_Raw/design md Style
   ========================================================================== */

// 1. DATA SOURCES (02_Wiki Fact-based Items)
const PROJECTS = [
  {
    id: "proj-101",
    category: "dev",
    title: "AI 타겟 블로그 포스팅 자동 배포 파이프라인 구축",
    company: "파인드원 헬스케어 (스타트업)",
    reward: "180 만원",
    tags: ["CLAUDE 3.5", "PYTHON", "AUTOMATION"],
    desc: "Claude 3.5 및 워드프레스 REST API를 연동하여 특정 타겟 대상 건강 칼럼 20건을 AI로 자동 생성 및 배포하는 레시피 개발 과제."
  },
  {
    id: "proj-102",
    category: "design",
    title: "Midjourney 커머스 상세페이지 메인 시안 5종 개발",
    company: "스마트스토어 오아시스",
    reward: "150 만원",
    tags: ["MIDJOURNEY V6", "STITCH UI", "COMMERCE"],
    desc: "미드저니 파라미터 조합으로 화장품 브랜드 커머스 상세페이지 메인 그래픽 5종을 도출하고 Stitch 디자인 토큰에 맞춰 조립."
  },
  {
    id: "proj-103",
    category: "marketing",
    title: "구글 서치콘솔 UTM 성과 자동 리포팅 시스템",
    company: "넥스트랩스",
    reward: "220 만원",
    tags: ["GA4", "UTM TAGGING", "PYTHON"],
    desc: "블라인드 취업 커뮤니티 바이럴 유입 파이프라인의 UTM 태깅 자동화 및 GA4 이탈율 추적 통합 자동 리포팅."
  },
  {
    id: "proj-104",
    category: "dev",
    title: "SQLi/XSS 자동 코드 보안 모의 침투 분석",
    company: "보안인텔리전스 (1인기업)",
    reward: "200 만원",
    tags: ["SECURITY", "AUDIT", "VERITY CORE"],
    desc: "Verity 감사 규약에 따라 결제 및 경력 인증서 라우팅 코드의 SQL 인젝션 및 외부 API 키 노출 모의 테스트 레시피 구축."
  }
];

const RECIPES = [
  {
    id: "rec-201",
    title: "Runway + Midjourney + Claude 애니메이션 제작 팩",
    author: "Nova_Planner",
    price: "45,000 원",
    downloads: "142 회",
    desc: "비전문가도 30분 만에 4K 숏폼 애니메이션 초안을 도출하는 토큰 절감형 프롬프트 밀키트."
  },
  {
    id: "rec-202",
    title: "Stitch UI Token + Tailwind 10분 모듈러 조립 팩",
    author: "Vivid_Designer",
    price: "38,000 원",
    downloads: "98 회",
    desc: "Google Stitch 디자인 시스템 토큰을 100% 이식하여 에디토리얼 UI 컴포넌트를 조립하는 프롬프트."
  },
  {
    id: "rec-203",
    title: "GA4 이탈율 5% 미만 방어 CS 챗봇 에스컬레이션 팩",
    author: "Carey_CS",
    price: "52,000 원",
    downloads: "210 회",
    desc: "고객 문의 실패 시 슬랙/이메일로 자동 이관하고 이탈 지수를 분석하는 CS 프롬프트 시나리오."
  }
];

// 2. DOM INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  renderJobGrid(PROJECTS);
  renderStoreGrid(RECIPES);
  generateRecipePrompt();
});

// 3. JOB BOARD RENDERER
function renderJobGrid(items) {
  const container = document.getElementById("jobGrid");
  if (!container) return;
  container.innerHTML = "";

  items.forEach(p => {
    const card = document.createElement("div");
    card.className = "becane-card";
    const tagHtml = p.tags.map(t => `<span class="becane-card-tag">${t}</span>`).join(" ");

    card.innerHTML = `
      <div>
        <div class="becane-card-tag-row">
          <div>${tagHtml}</div>
          <span class="becane-card-price">보상: ${p.reward}</span>
        </div>
        <h3 class="becane-card-title">${p.title}</h3>
        <p style="font-size:9px; font-weight:700; color:var(--color-muted-grey); margin-bottom:6px;">의뢰 기업: ${p.company}</p>
        <p class="becane-card-desc">${p.desc}</p>
      </div>
      <div class="becane-card-footer">
        <span style="font-size:8px; font-weight:700; color:var(--color-muted-grey);">ID: ${p.id}</span>
        <button class="becane-action-btn" onclick="applyJobModal('${p.id}', '${p.title}')">🚀 과제 지원하기</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// 4. STORE RENDERER
function renderStoreGrid(items) {
  const container = document.getElementById("storeGrid");
  if (!container) return;
  container.innerHTML = "";

  items.forEach(r => {
    const card = document.createElement("div");
    card.className = "becane-card";
    card.innerHTML = `
      <div>
        <div class="becane-card-tag-row">
          <span class="becane-card-tag">CREATOR: ${r.author.toUpperCase()}</span>
          <span class="becane-card-price">${r.price}</span>
        </div>
        <h3 class="becane-card-title">${r.title}</h3>
        <p class="becane-card-desc">${r.desc}</p>
      </div>
      <div class="becane-card-footer">
        <span style="font-size:8px; font-weight:700; color:var(--color-muted-grey);">📥 다운로드: ${r.downloads}</span>
        <button class="becane-action-btn-outline" onclick="buyRecipeModal('${r.title}', '${r.price}')">🛒 레시피 구매</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// 5. CATEGORY FILTERING
function filterCategory(cat) {
  document.querySelectorAll(".becane-filter-btn").forEach(btn => btn.classList.remove("active"));
  const activeTab = document.getElementById(`tab-${cat}`);
  if (activeTab) activeTab.classList.add("active");

  if (cat === "all") {
    renderJobGrid(PROJECTS);
  } else {
    const filtered = PROJECTS.filter(p => p.category === cat);
    renderJobGrid(filtered);
  }
}

// 6. AI RECIPE BUILDER PROMPT GENERATOR
function generateRecipePrompt() {
  const taskType = document.getElementById("builderTaskType")?.value || "marketing_blog";
  const modelCombo = document.getElementById("builderModelCombo")?.value || "combo1";
  const customInput = document.getElementById("builderCustomInput")?.value || "";

  let prompt = `[RECIPEBRIDGE SYSTEM PROMPT PACK — TOKEN OPTIMIZATION: 94.2%]\n\n`;
  prompt += `ROLE: World-class AI Specialist & Recipe Builder\n`;
  prompt += `TARGET TASK: ${taskType.toUpperCase()}\n`;
  prompt += `MODEL ARCHITECTURE: ${modelCombo.toUpperCase()}\n`;
  prompt += `DIRECTIVES: ${customInput || "Max token efficiency, no conversational filler, output clean code/spec only."}\n\n`;
  prompt += `--- STEPS ---\n`;
  prompt += `1. Analyze task requirements against 02_Wiki specifications.\n`;
  prompt += `2. Enforce 01_Raw/design md Bécane design token standard (0px radius, #f6f6f6, #0a0a0a).\n`;
  prompt += `3. Execute execution flow and generate certified output hash.`;

  const preview = document.getElementById("promptPreview");
  if (preview) preview.textContent = prompt;
}

function copyRecipePrompt() {
  const preview = document.getElementById("promptPreview");
  if (!preview) return;
  navigator.clipboard.writeText(preview.textContent).then(() => {
    alert("📋 AI 레시피 프롬프트 팩이 클립보드에 복사되었습니다!");
  });
}

// 7. CERTIFICATE HASH VERIFIER
function verifyCertHash() {
  const hash = document.getElementById("certHashInput")?.value || "";
  const resultBox = document.getElementById("certResultBox");
  if (!resultBox) return;

  if (hash.startsWith("0x") && hash.length >= 10) {
    resultBox.innerHTML = `
      <div style="color:var(--color-off-black); font-weight:700;">✅ SMART CONTRACT VERIFIED</div>
      <div style="margin-top:6px; color:#333;">
        · 인증 해시: <code>${hash}</code><br>
        · 승인 플랫폼: RecipeBridge Official Master (Aegis Verified)<br>
        · 발급 일자: 2026-07-26<br>
        · 직무 경력: [Lv4] AI 레시피 연동 마이크로 과제 100% 완수<br>
        · 상태: 블록체인 스마트 계약에 영구 기록됨 (수수료 정상 정산 완료)
      </div>
    `;
  } else {
    resultBox.innerHTML = `<span style="color:var(--color-signal-red);">❌ 유효하지 않은 암호화 해시 형식입니다. (0x로 시작하는 해시를 입력하세요)</span>`;
  }
}

// 8. MODAL LOGIC
function openAppModal(title, bodyHtml) {
  const backdrop = document.getElementById("appModalBackdrop");
  const titleEl = document.getElementById("modalTitle");
  const bodyEl = document.getElementById("modalBody");

  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.innerHTML = bodyHtml;
  if (backdrop) backdrop.classList.remove("hidden");
}

function closeAppModal() {
  const backdrop = document.getElementById("appModalBackdrop");
  if (backdrop) backdrop.classList.add("hidden");
}

function applyJobModal(id, title) {
  const html = `
    <div style="margin-bottom:16px;">
      <p style="font-size:11px; margin-bottom:8px;">지원 과제: <strong>${title}</strong> (${id})</p>
      <div class="becane-form-group">
        <label class="becane-form-label">구직자 성명 / 이메일</label>
        <input type="text" class="becane-input" placeholder="홍길동 (applicant@email.com)">
      </div>
      <div class="becane-form-group">
        <label class="becane-form-label">GitHub 레포지토리 또는 레시피 URL</label>
        <input type="text" class="becane-input" placeholder="https://github.com/username/recipe-repo">
      </div>
    </div>
    <div style="display:flex; justify-content:flex-end; gap:10px;">
      <button class="becane-action-btn-outline" onclick="closeAppModal()">취소</button>
      <button class="becane-action-btn" onclick="submitJobApplication('${id}')">🚀 과제 최종 제출</button>
    </div>
  `;
  openAppModal("🎯 마이크로 과제 제출 및 지원", html);
}

function submitJobApplication(id) {
  alert(`✅ 과제 [${id}] 지원 및 레시피 제출이 완수되었습니다!\n인증 해시(0x8f7a...)가 생성되어 검증 시스템에 등록됩니다.`);
  closeAppModal();
}

function buyRecipeModal(title, price) {
  const html = `
    <div style="margin-bottom:16px;">
      <p style="font-size:11px; margin-bottom:8px;">구매 레시피: <strong>${title}</strong></p>
      <p style="font-size:12px; font-weight:700; color:var(--color-signal-red); margin-bottom:12px;">결제 금액: ${price}</p>
      <p style="font-size:10px; color:var(--color-muted-grey);">* 결제 시 프롬프트 밀키트 파이프라인 다운로드 링크 및 사내 이관 매뉴얼이 즉시 포함됩니다.</p>
    </div>
    <div style="display:flex; justify-content:flex-end; gap:10px;">
      <button class="becane-action-btn-outline" onclick="closeAppModal()">취소</button>
      <button class="becane-action-btn" onclick="confirmBuyRecipe('${title}')">💳 결제 진행하기</button>
    </div>
  `;
  openAppModal("🛒 AI 레시피 구매 결제", html);
}

function confirmBuyRecipe(title) {
  alert(`💳 레시피 [${title}] 구매 결제가 완료되었습니다!\n마이페이지에서 프롬프트 팩을 다운로드할 수 있습니다.`);
  closeAppModal();
}

function openCertModal(hash) {
  const input = document.getElementById("certHashInput");
  if (input) input.value = hash;
  verifyCertHash();
  const section = document.getElementById("section-verifier");
  if (section) section.scrollIntoView({ behavior: "smooth" });
}

function switchSection(secId) {
  const target = document.getElementById(`section-${secId}`);
  if (target) target.scrollIntoView({ behavior: "smooth" });
}
