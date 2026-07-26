# 🚀 Google Stitch (구글 스티치) 사업 & 웹페이지 구축 명세 프롬프트

> 본 프롬프트는 디자인 묘사를 완전히 배제하고, **RecipeBridge(레시피브릿지)**의 **사업 구조, 4대 비즈니스 모듈, 그리고 웹페이지 기능적 구축 명세**에 집중하여 구글 스티치(Google Stitch) UI 생성 AI에게 제공할 수 있도록 작성된 마스터 프롬프트입니다.
> 
> 디자인 스타일(design md)은 사장님께서 스티치에 별도 예시로 입력하시므로, 본 프롬프트는 100% 사업 및 웹 구축 명세 내용으로만 구성되어 있습니다.

---

```markdown
# GOOGLE STITCH APPLICATION SPECIFICATION PROMPT: RecipeBridge

## 1. BUSINESS ARCHITECTURE & VISION
- Service Name: RecipeBridge (레시피브릿지)
- Core Concept: A two-sided micro-project recruitment platform where entry-level job seekers solve real startup tasks using modular AI tool combinations (Recipes), earning official blockchain-verified career experience.
- Target Users:
  1. Job Seekers (Entry-level & 30s Career Starters): Seeking official work experience and proof of AI capability.
  2. Startups & Solo Entrepreneurs: Needing fast, low-risk micro-outsourcing and pre-validated talent.
- Monetization Strategy:
  - Project Matching Commission Fee (B2B)
  - AI Recipe Store Transaction Fee (C2C, B2C)
  - Verified Talent Recruitment Referral Fee (B2B)
  - Token-Optimized System Prompt Pack API Fees

---

## 2. WEB APPLICATION STRUCTURAL & FUNCTIONAL SPECIFICATION

### [Global Header & Navigation]
- Brand Wordmark: RECIPEBRIDGE
- Navigation Links:
  1. 01 / JOB BOARD (마이크로 과제 매칭)
  2. 02 / RECIPE BUILDER (AI 레시피 빌더)
  3. 03 / RECIPE STORE (레시피 마켓)
  4. 04 / CERT VERIFIER (스마트 경력 인증기)
- Action Element: "🔒 Smart Contract Certificate Trigger" button.

### [Section 01: Micro-Project Job Board]
- Purpose: Display micro-outsourcing projects requested by startups.
- Category Filter Tabs: ALL, AI MARKETING, AI DEV / AUTOMATION, UI/UX DESIGN.
- Project Card Data Fields:
  - Project ID (e.g., `proj-101`)
  - Client Company Name (e.g., "FindOne Healthcare")
  - Project Title (e.g., "AI Automated Blog Distribution Pipeline")
  - Reward Amount (e.g., "₩1,800,000")
  - Required AI Tool Tags (e.g., `CLAUDE 3.5`, `PYTHON`, `MIDJOURNEY V6`)
  - Description & Scope of Work
  - Primary Action Button: "🚀 Apply & Submit Task" (Triggers Application Modal).

### [Section 02: AI Recipe Builder & Prompt Pack]
- Purpose: Modular prompt assembly tool enabling job seekers to generate high-quality task outputs while saving up to 94.2% in token costs.
- User Input Components:
  - Task Type Selector (e.g., AI Blog Pipeline, Stitch UI Components, SQLi Code Audit, Commerce Graphics)
  - AI Model Combination Selector (e.g., Claude 3.5 + Midjourney, Gemini 1.5 + Stitch, ChatGPT-4o + Sentry)
  - Custom Directive Text Input (e.g., "Max 500 tokens, clean spec only")
- Output Terminal Display:
  - Auto-assembled System Prompt Pack with Token Optimization Savings Gauge ("94.2% Saved")
  - Primary Action Button: "📋 Copy Prompt Pack" (Copies assembled prompt to clipboard).

### [Section 03: Recipe Store Marketplace]
- Purpose: Marketplace for buying, selling, and sharing proven AI tool prompt recipes created by top performers.
- Recipe Card Data Fields:
  - Recipe ID (e.g., `rec-201`)
  - Creator Handle (e.g., `Nova_Planner`, `Vivid_Designer`)
  - Price Tag (e.g., "₩45,000", "₩38,000")
  - Total Download Counter (e.g., "142 Downloads")
  - Recipe Title & Functional Overview
  - Primary Action Button: "🛒 Purchase & Download Recipe Kit" (Triggers Payment Modal).

### [Section 04: Smart Contract Career Verifier]
- Purpose: Verification system for validating cryptographic hashes of completed micro-projects and issuing official career certificates.
- Interactive Console Components:
  - Cryptographic Hash Input Field (Default: `0x8f7a91c3e21b4a0988`)
  - Verification Trigger Button: "🔍 Verify Hash"
- Live Result Display Window:
  - Verification Status (`✅ SMART CONTRACT VERIFIED`)
  - Approved Platform Name (RecipeBridge Master)
  - Issue Date, Verified Project Name, and Skill Tokens Earned.

---

## 3. INTERACTIVE MODAL SPECIFICATIONS
- Application Modal: Prompts applicant name, email, and GitHub/Recipe URL for task submission.
- Payment Modal: Shows recipe title, final price, and payment execution button.
- Certificate Modal: Displays full digital certificate format for print/download.
```
