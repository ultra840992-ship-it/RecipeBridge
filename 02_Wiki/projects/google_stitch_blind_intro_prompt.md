# 🚀 Google Stitch (구글 스티치) 블라인드 매칭 & 인트로 쇼케이스 UI 창 디자인 수정 프롬프트

> 본 프롬프트는 **RecipeBridge(레시피브릿지)**의 **블라인드 프로젝트 선택·지원 시스템**, **과제 수행 금액 지원**, **스타트업 저비용 외주 매칭**, 그리고 **대표 과제 & 검증 지원자 웰컴 인트로 쇼케이스**를 구글 스티치(Stitch) UI AI가 완벽한 레이아웃과 화면 구조로 수정·생성할 수 있도록 작성된 명세 프롬프트입니다.
> 
> 디자인 스타일(design md)은 사장님께서 스티치에 예시로 직접 입력하시며, 아래 [복사 영역] 전체를 스티치 창 디자인 수정 입력창에 붙여넣으시면 됩니다.

---

```markdown
# GOOGLE STITCH UI REDESIGN PROMPT: RecipeBridge Blind Matching & Intro Showcase

## 1. INTRO & VALUE PROPOSITION HERO SHOWCASE (웰컴 인트로 섹션)
- Hero Headline: "나이·스펙 0%, 오직 AI 레시피 실력으로! 블라인드 마이크로 프로젝트 매칭"
- Sub-headline: "스타트업은 합리적 비용으로 실무를 처리하고, 구직자는 과제 수행 지원금(금액 지원)을 받으며 100% 공식 경력을 입증합니다."
- Dual Value Pillar Badges:
  1. 👤 FOR JOB SEEKERS: "블라인드 과제 선택 지원 + 수행 지원금 지급 + 0x... 스마트 경력 도장 발급"
  2. 🏢 FOR STARTUPS: "저렴한 아웃소싱 비용 + AI 도구 매뉴얼 사내 자산화 + 검증된 인재 즉시 채용"
- Live Metrics Counter Strip:
  - "누적 완수 과제: 142 건"
  - "총 지급 과제 지원금: ₩48,500,000"
  - "블라인드 채용 승인율: 91.4%"

---

## 2. REPRESENTATIVE SHOWCASE SECTION (대표 과제 & 검증 지원자 쇼케이스)

### [Representative Tasks Carousel / Cards (대표 과제 쇼케이스)]
- Task Card 01: "AI 타겟 블로그 20건 자동 생성 파이프라인" (지원금: ₩1,800,000 | AI: Claude 3.5 + Python)
- Task Card 02: "Midjourney 커머스 상세페이지 시안 5종" (지원금: ₩1,500,000 | AI: Midjourney v6 + Stitch)
- Task Card 03: "SQLi/XSS 자동 코드 보안 검수 레시피" (지원금: ₩2,000,000 | AI: Verity Security Audit)

### [Verified Applicant Blind Showcase (검증 지원자 블라인드 쇼케이스)]
- Display anonymized top applicant profile cards without age, photo, or background:
  - Profile Card A: `APPLICANT #391` | AI Recipe Score: `98/100` | Completed: 4 Projects | Badges: `CLAUDE MASTER`, `STITCH UI`
  - Profile Card B: `APPLICANT #408` | AI Recipe Score: `96/100` | Completed: 3 Projects | Badges: `MIDJOURNEY PRO`, `GA4 UTM`
  - Action Element: "💼 스타트업 1:1 블라인드 스카우트 제안" button.

---

## 3. BLIND PROJECT SEARCH & APPLICATION MODULE (블라인드 과제 검색 & 지원)

### [Search & Blind Selection Control]
- Search Input: "도전할 마이크로 과제 검색 (예: 블로그 자동화, 상세페이지, 보안 검수)"
- Category Pills: `전체 (ALL)`, `AI 마케팅`, `자동화 개발`, `UI/UX 디자인`, `금액 지원 상위`
- Project Cards (Blind Mode Enabled):
  - Displays: Project Title, Reward/Stipend Amount (e.g., "과제 수행 지원금: ₩1,800,000"), Required AI Tools, Blind Status Badge (`BLIND MATCHING ACTIVE`).
  - Action Button: "🎯 블라인드 과제 지원하기" (Triggers Blind Application Modal).

---

## 4. INTERACTIVE MODAL & SPECIFICATION

### [Blind Application Modal (블라인드 지원 폼)]
- Header: "🎯 [블라인드 지원] 스펙/학벌 입력 없음 · 오직 레시피 제출"
- Form Fields:
  - Applicant Alias / Contact (Anonymized)
  - AI Tool Combo Selection (e.g., Claude + Midjourney)
  - GitHub Repository / Recipe Link URL
- Stipend Notice: "※ 과제 완수 시 스타트업 검증을 거쳐 과제 수행 지원금이 즉시 지급됩니다."
```
