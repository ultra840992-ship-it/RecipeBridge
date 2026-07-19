---
type: concept
date: 2026-07-18
status: active
---

# 고통지수 측정기 (Pain Index Meter)

고통지수 측정기는 사용자의 고통(Pain Points) 신호를 정량적 및 정성적으로 측정하고 분류하기 위해 설계된 개념이자 도구입니다. 유튜브 댓글, 고객 문의, 리뷰 등에서 고객이 겪는 진짜 고통을 탐지하고, 비즈니스 기회(지불 의사가 있는 핵심 고통)를 찾아내는 데 사용됩니다.

## 1. 분석 방법론 및 척도

고통지수(Pain Index)는 1점부터 10점까지의 척도로 분류됩니다.

- **1 ~ 3 (가벼움)**: 불편하지만 크게 개의치 않으며, 우회할 수 있는 방법이 있는 상태.
- **4 ~ 5 (신경 쓰임)**: 문제를 인지하고 있으나, 적당한 대체재가 있어 수용 가능한 상태.
- **6 ~ 7 (자꾸 생각남)**: 명확한 대체재가 없어 지속적으로 스트레스를 유발하고, 우회 방법이 번거로운 상태.
- **8 ~ 10 (감당 불가)**: 마감, 비용, 생계 등이 걸려 있어 즉각적인 해결책이 절실하며 삶의 질을 저하시키는 임계 상태. (지불 의사 및 절박성이 높음)

## 2. 규칙 기반 점수 계산 알고리즘

수집된 고통 신호에 대해 다음과 같은 규칙적 연산을 거쳐 최종 점수(1~10)를 산출합니다.

```javascript
function scoreSignal(s) {
  if (!s || !s.is_pain) return 0;
  const strong = s.intensity === "강함";
  const mid = s.intensity === "보통";
  const altNone = s.alternative === "없음";
  const altYes = s.alternative === "있음";
  const gap = !!s.knowledge_gap;
  const desp = s.desperation === "있음";
  const pay = !!s.willing_to_pay;
  const revenue = s.segment === "수익압박";
  let sc;

  if (strong && altNone && revenue && (pay || desp)) {
    sc = 8 + (pay ? 1 : 0) + (desp ? 1 : 0);
  } else if (strong && altNone && (gap || desp)) {
    sc = 6 + (gap && desp ? 1 : 0);
  } else if (strong && altYes) {
    sc = 4 + (gap ? 1 : 0);
  } else if (strong && altNone) {
    sc = 6;
  } else if (mid) {
    sc = altYes ? 3 : 4;
  } else {
    sc = altYes && !gap ? 1 : 2;
  }
  return Math.max(1, Math.min(10, Math.round(sc)));
}
```

---

## 3. 구현 코드 (React Component)

```tsx
import React, { useState, useMemo } from "react";

// ──────────────────────────────────────────────────────────────
//  고통지수 측정기 (Pain Index Meter)
//  댓글을 붙여넣으면 이 아티팩트 안에서 AI가 직접:
//   1) 고통 신호 추출  2) 1~10 분류(규칙)  3) 8~10 집단 정의
//  백엔드/API키 설정 없이 동작. AI 호출은 Anthropic API로 처리.
// ──────────────────────────────────────────────────────────────

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,900&family=JetBrains+Mono:wght@400;500;700&display=swap');

.pim-root{
  --bg:#15120f; --bg2:#1c1815; --surface:#221d19; --line:#352c25;
  --ink:#ece3d8; --muted:#9a8e80; --faint:#6b6157;
  --ember:#e0703a;
  --p-low:#6fb89a; --p-mid:#d9b44a; --p-high:#e0853c; --p-crit:#d44a3a;
  background:var(--bg);
  color:var(--ink);
  font-family:'Fraunces',Georgia,'Apple SD Gothic Neo','Malgun Gothic',serif;
  min-height:100%;
  padding:32px 20px 80px;
  position:relative;
}
.pim-root::before{
  content:""; position:absolute; inset:0; pointer-events:none;
  background-image:radial-gradient(circle at 18% 12%, rgba(224,112,58,.10), transparent 42%);
}
.pim-mono{ font-family:'JetBrains Mono',ui-monospace,monospace; }
.pim-wrap{ max-width:760px; margin:0 auto; position:relative; }

.pim-kicker{ font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.32em; text-transform:uppercase; color:var(--ember); margin:0 0 10px; }
.pim-title{ font-size:46px; line-height:1; font-weight:900; margin:0; letter-spacing:-.02em; }
.pim-sub{ color:var(--muted); font-size:15px; margin:14px 0 0; max-width:560px; line-height:1.55; }

.pim-card{ background:var(--surface); border:1px solid var(--line); border-radius:18px; padding:22px; margin-top:24px; }
.pim-label{ font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--faint); margin:0 0 10px; }

.pim-ta{ width:100%; min-height:170px; background:var(--bg2); border:1px solid var(--line); border-radius:12px; color:var(--ink); padding:14px; font-family:'JetBrains Mono',monospace; font-size:13px; line-height:1.6; resize:vertical; box-sizing:border-box; }
.pim-ta:focus{ outline:none; border-color:var(--ember); }
.pim-note{ font-size:13px; color:var(--muted); line-height:1.55; margin:12px 0 0; }

.pim-row{ display:flex; gap:10px; margin-top:16px; flex-wrap:wrap; }
.pim-btn{ font-family:'JetBrains Mono',monospace; font-size:13px; font-weight:500; letter-spacing:.04em; padding:12px 22px; border-radius:10px; border:1px solid var(--ember); background:var(--ember); color:#1a120c; cursor:pointer; transition:transform .12s, opacity .12s; }
.pim-btn:hover{ transform:translateY(-1px); }
.pim-btn:disabled{ opacity:.4; cursor:not-allowed; transform:none; }
.pim-btn.ghost{ background:transparent; color:var(--muted); border-color:var(--line); }
.pim-btn.ghost:hover{ color:var(--ink); border-color:var(--muted); }

.pim-stats{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:24px; }
.pim-stat{ background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:18px 16px; }
.pim-stat .v{ font-size:40px; font-weight:900; line-height:1; letter-spacing:-.02em; }
.pim-stat .k{ font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--faint); margin-top:8px; }

.pim-band{ display:flex; align-items:center; gap:14px; padding:11px 0; }
.pim-band .name{ font-family:'JetBrains Mono',monospace; font-size:12px; width:96px; flex:none; color:var(--muted); }
.pim-track{ flex:1; height:26px; background:var(--bg2); border-radius:7px; overflow:hidden; }
.pim-fill{ height:100%; border-radius:7px; transition:width .8s cubic-bezier(.2,.7,.2,1); }
.pim-band .pct{ font-family:'JetBrains Mono',monospace; font-size:13px; width:78px; text-align:right; flex:none; }

.pim-crit{ background:linear-gradient(160deg, rgba(212,74,58,.16), rgba(34,29,25,.6)); border:1px solid rgba(212,74,58,.45); border-radius:18px; padding:24px; margin-top:24px; }
.pim-crit .hd{ display:flex; align-items:baseline; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.pim-crit h3{ margin:0; font-size:22px; font-weight:900; }
.pim-conf{ font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; padding:5px 10px; border-radius:999px; border:1px solid var(--line); color:var(--muted); }
.pim-persona{ font-size:18px; line-height:1.6; margin:16px 0 0; }
.pim-evid{ display:flex; gap:18px; margin-top:18px; flex-wrap:wrap; font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--muted); }
.pim-evid b{ color:var(--p-crit); font-weight:700; }

.pim-quote{ border-left:2px solid var(--p-crit); padding:8px 0 8px 14px; margin:14px 0 0; font-size:14px; line-height:1.55; color:var(--ink); }

.pim-list{ margin-top:8px; max-height:340px; overflow:auto; }
.pim-item{ display:flex; gap:12px; align-items:flex-start; padding:11px 0; border-bottom:1px solid var(--line); }
.pim-score{ font-family:'JetBrains Mono',monospace; font-weight:700; font-size:14px; width:34px; height:34px; flex:none; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#15120f; }
.pim-itext{ font-size:14px; line-height:1.5; }
.pim-tags{ margin-top:5px; display:flex; gap:6px; flex-wrap:wrap; }
.pim-tag{ font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:.04em; padding:2px 7px; border-radius:5px; border:1px solid var(--line); color:var(--muted); }

.pim-err{ color:var(--p-crit); font-family:'JetBrains Mono',monospace; font-size:13px; margin-top:14px; }
.pim-prog{ font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--ember); margin-top:16px; display:flex; align-items:center; gap:10px; }
.pim-dot{ width:8px; height:8px; border-radius:50%; background:var(--ember); animation:pim-pulse 1s infinite; }
@keyframes pim-pulse{ 0%,100%{opacity:.25} 50%{opacity:1} }
.pim-guard{ font-size:13px; color:var(--faint); line-height:1.6; margin-top:24px; border-top:1px solid var(--line); padding-top:18px; }
.pim-pred{ background:linear-gradient(160deg, rgba(224,112,58,.12), rgba(34,29,25,.5)); border:1px solid rgba(224,112,58,.4); border-radius:18px; padding:22px; margin-top:24px; }
.pim-pred h3{ margin:0 0 4px; font-size:22px; font-weight:900; }
.pim-pred .lead{ color:var(--muted); font-size:13px; margin:0 0 14px; line-height:1.5; }
.pim-pitem{ padding:14px 0; border-top:1px solid var(--line); }
.pim-pitem .top{ display:flex; align-items:baseline; gap:10px; }
.pim-prank{ font-family:'JetBrains Mono',monospace; font-weight:700; font-size:13px; color:var(--ember); flex:none; }
.pim-ppain{ font-size:17px; font-weight:600; line-height:1.4; }
.pim-psig{ font-size:13px; color:var(--muted); line-height:1.5; margin:6px 0 0; padding-left:22px; }
.pim-pmeta{ font-family:'JetBrains Mono',monospace; font-size:11px; color:var(--faint); margin:8px 0 0; padding-left:22px; }
.pim-pmeta .ex{ color:var(--muted); }
.pim-handoff{ background:var(--surface); border:1px dashed var(--ember); border-radius:18px; padding:22px; margin-top:24px; }
.pim-handoff h3{ margin:0 0 4px; font-size:20px; font-weight:900; }
.pim-handoff .lead{ color:var(--muted); font-size:13px; line-height:1.55; margin:0 0 16px; }
`;

const MODEL = "claude-sonnet-4-20250514";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function classifyError(status, msg) {
  const m = msg || "";
  if (/reload|새로고침|session/i.test(m)) return "hard";
  if (status === 429 || /rate.?limit|too many|overloaded|quota|exceeded/i.test(m))
    return "soft";
  return "other";
}

async function callClaudeOnce(prompt) {
  const ctrl = new AbortController();
  const TIMEOUT = 30000;
  let timer;
  const timeoutP = new Promise((_, reject) => {
    timer = setTimeout(() => {
      try { ctrl.abort(); } catch (e) {}
      reject(new Error("응답 시간 초과(30초)"));
    }, TIMEOUT);
  });
  const work = (async () => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: ctrl.signal,
    });
    let data = null;
    let rawText = "";
    try {
      data = await res.clone().json();
    } catch (e) {
      try { rawText = await res.text(); } catch (e2) {}
    }
    if (!res.ok || (data && data.error)) {
      const m =
        (data && data.error ? data.error.message || data.error.type : "") ||
        rawText ||
        "응답 없음";
      const err = new Error("API 오류 HTTP " + res.status + ": " + m);
      err.status = res.status;
      err.kind = classifyError(res.status, m);
      throw err;
    }
    return (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  })();
  try {
    return await Promise.race([work, timeoutP]);
  } finally {
    clearTimeout(timer);
  }
}

async function callClaude(prompt, onWait) {
  const MAX_RETRY = 3;
  let wait = 2000;
  for (let attempt = 0; ; attempt++) {
    try {
      return await callClaudeOnce(prompt);
    } catch (e) {
      const kind = (e && e.kind) || classifyError(e && e.status, e && e.message);
      if (e) e.kind = kind;
      if (kind === "soft" && attempt < MAX_RETRY) {
        if (onWait) onWait(Math.round(wait / 1000), attempt + 1);
        await sleep(wait + Math.random() * 400);
        wait = Math.min(wait * 2, 8000);
        continue;
      }
      throw e;
    }
  }
}

function salvageObjects(t) {
  const out = [];
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === "{") { if (depth === 0) start = i; depth++; }
    else if (c === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        try { out.push(JSON.parse(t.slice(start, i + 1))); } catch (e) {}
        start = -1;
      }
    }
  }
  return out;
}

function extractJSON(text) {
  let t = (text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = t.search(/[\[{]/);
  if (start > 0) t = t.slice(start);
  try {
    return JSON.parse(t);
  } catch (e) {
    const cut = Math.max(t.lastIndexOf("]"), t.lastIndexOf("}"));
    if (cut > 0) {
      try {
        return JSON.parse(t.slice(0, cut + 1));
      } catch (e2) {}
    }
    const salv = salvageObjects(t);
    if (salv.length) return salv;
    throw new Error("JSON 파싱 실패");
  }
}

// (중략 - UI 구성 및 핵심 연산 로직)
```
