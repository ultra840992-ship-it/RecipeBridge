# AI Agent Wiki Index

이 문서는 vault 전체의 지도입니다.

에이전트는 중요한 wiki 문서를 만들거나 갱신한 뒤 이 문서에 링크를 추가해야 합니다.

## Start Here

- [[START_HERE]]
- [[CLAUDE]]
- [[AGENTS]]
- [[README]]
- [[TEMPLATE_MANIFEST]]
- [[log]]

## Vault Structure

- `01_Raw/`: 수정하지 않는 1차 자료
- `03_Conversations/`: 세션 인수인계
- `02_Wiki/sources/`: raw 자료 요약
- `02_Wiki/concepts/`: 반복 사용 개념
- `02_Wiki/decisions/`: 의사결정
- `02_Wiki/errors/`: 실패와 리스크
- `02_Wiki/projects/`: 프로젝트 맥락
- `02_Wiki/design/`: 디자인 가이드와 IA
- `02_Wiki/dev-tasks/`: 개발 태스크
- `_shared/`: 멀티 에이전트 공유 설정 및 라우팅 규칙
- `_templates/`: 워커 브리프/결과 템플릿
- `tasks/`: 오케스트레이션 태스크 생명주기 관리

## Projects

- [[02_Wiki/projects/micro_project_recipe_platform|RecipeBridge: AI 레시피 기반 마이크로 프로젝트 및 신입 경력 인증 플랫폼 사업 기획서]]
- [[02_Wiki/projects/recipebridge_multi_agent_setup|RecipeBridge: 멀티 에이전트 운영 설계도 (AI 5인 부서 구축안)]]
- [[02_Wiki/projects/recipebridge_action_plan|RecipeBridge: 에이전트별 Action List 및 4주 로드맵 일정 계획서]]

## Conversations

- [[03_Conversations/meeting_2026-07-19_10-07|RecipeBridge AI 에이전트 6인 협업 및 리플렉션 회의록 (2026-07-19)]]

## Decisions

아직 등록된 의사결정이 없습니다.

## Sources

- [[02_Wiki/sources/employment_pain_analysis|취업 시장 고통 분석 보고서 (중고신입 및 나이 제한)]]
- [[01_Raw/episode_1_item_discovery|유튜브 실전 EP1: AI만 사용해서 1인 기업 도전하기]]
- [[01_Raw/episode_2_token_optimization|유튜브 실전 EP2: AI 레시피 조합으로 서비스 구현하기]]
- [[01_Raw/episode_3_multi_agent_setup|유튜브 실전 EP3: 클로드 AI 직원 5명 세팅법]]
- [[01_Raw/episode_4_hermes_multi_profile|유튜브 실전 EP4: Hermes 멀티 프로필 AI 협업 팀 구축법]]
- [[01_Raw/episode_5_opal_multi_agent|유튜브 실전 EP5: 논문 기반 멀티 에이전트(구글 오팔) 협업 및 콘텐츠 자동화 빌드 가이드]]

## Concepts

- [[02_Wiki/concepts/pain_index_meter|고통지수 측정기 (Pain Index Meter)]]

## Errors / Lessons

아직 등록된 error 문서가 없습니다.

## Dev-Tasks

- [[02_Wiki/dev-tasks/dashboard_and_agent_sync_20260719|대시보드 UI 및 에이전트 동기화 패치 내역 (2026-07-19)]]
- [[02_Wiki/dev-tasks/dashboard_longterm_gantt_20260719|대시보드 장기(Lv1) 간트차트 시각화 및 Advance 단계 가동 내역 (2026-07-19)]]

## Employee Manuals

- [[05_Meta/manuals/aegis_manual|Aegis (마스터) 매뉴얼]]
- [[05_Meta/manuals/nova_manual|Nova (기획) 매뉴얼]]
- [[05_Meta/manuals/vivid_manual|Vivid (디자인) 매뉴얼]]
- [[05_Meta/manuals/bitz_manual|Bitz (개발) 매뉴얼]]
- [[05_Meta/manuals/echo_manual|Echo (마케팅) 매뉴얼]]
- [[05_Meta/manuals/carey_manual|Carey (CS) 매뉴얼]]

## Prompt Library

- [[04_Prompts/first-setup]]
- [[04_Prompts/save]]
- [[04_Prompts/query]]
- [[04_Prompts/ingest]]
- [[04_Prompts/lint]]

## Orchestration Configuration

- [[_shared/backends|backends.json: 멀티 에이전트 백엔드/모델 매핑 설정]]
- [[_shared/routing|routing.md: 에이전트 라우팅 및 승인 정책]]
- [[_shared/approval-policy|approval-policy.md: 유료/외부 모델 승인 게이트 규약]]

## Infrastructure & Tools

- [[05_Meta/infrastructure_guide|infrastructure_guide.md: 24/7 가동 클라우드 인프라 설계서]]
- [[05_Meta/scripts/telegram_bridge|telegram_bridge.py: 텔레그램 봇 브리지 스크립트 소스]]
- [[05_Meta/scripts/live_server|live_server.py: 실시간 대시보드 연동 로컬 API 서버 (MIT Reflection 루프 탑재)]]
- [[05_Meta/scripts/cron_scheduler|cron_scheduler.py: 자발적 일과 연쇄 자동화 크론 스케줄러 (MIT Reflection 피드백 루프 통합)]]
- [[05_Meta/dashboard/index|index.html: PC용 플로팅 캐릭터 대화 대시보드 메인]]
- [Stitch: RecipeBridge Dashboard 피그마 디자인 프로젝트 (Aetheric Sand 디자인 시스템)](https://stitch.withgoogle.com/projects/3948981696864625229)
