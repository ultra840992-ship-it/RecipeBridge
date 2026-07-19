# Dashboard & Agent Synchronization Update (2026-07-19)

## 📌 개요
RecipeBridge 대시보드의 실시간 활동 피드 오류 수정 및 신규 에이전트(Insight, Verity) 통합, 그리고 스케줄러의 유효하지 않은 파일명 생성 버그를 패치한 기록입니다.

## 🛠️ 주요 수정 사항
### 1. Dashboard UI 버그 픽스
- **API Server 주소 수정**: `dashboard.js` 내의 `BACKEND_URL`이 `""`로 비어있어 로컬 파일(`file:///`) 상태에서 API를 호출하지 못하던 버그를 `http://localhost:8000`으로 명시해 해결했습니다.
- **차트 렌더링 오타 수정**: 담당자별 태스크 완료 현황 차트를 그리는 함수명이 `renderProgressChart`이나, 실제 호출 시 `renderAgentProgress`로 잘못 적혀 있어 자바스크립트 에러가 발생하던 현상을 수정했습니다.
- **간트차트 단축 스프린트 업데이트**: 4주 로드맵으로 표현되던 메인 간트차트를 4일 단축 스프린트(`4일 단축 로드맵`)로 변경하고, 새로운 에이전트들의 태스크를 추가했습니다.

### 2. 신규 에이전트 통합 (Insight, Verity)
- R&D 트렌드 분석 담당 **Insight**, 그리고 할루시네이션 및 논리 검증 담당 **Verity**의 제어 문서(`soul.md`, `agent.md`, `memory.md`, `user.md`)를 성공적으로 구축했습니다.
- 메타버스 오피스 및 실시간 기여도(Business Impact) 통계 차트에 두 에이전트의 위치와 데이터를 동기화했습니다.

### 3. 백엔드(cron_scheduler.py) 버그 픽스
- `_extract_code_blocks` 함수가 마크다운 블록에서 파일명을 파싱할 때 `-->` 혹은 `*` 등의 특수문자가 포함된 상태로 저장하여 윈도우 환경과 Git 충돌(Invalid path)을 일으키던 문제를 해결했습니다.
- `filename.replace('-->', '').replace('*', '').strip()` 로직을 추가하여 안전한 파일명으로 저장되도록 조치했습니다.
- 서버 상에 잘못 저장되었던 쓰레기 파일들을 모두 정리하고 서버의 Background 프로세스를 안정적으로 재시동했습니다.

## 🔗 연관 파일
- `05_Meta/dashboard/dashboard.js`
- `05_Meta/dashboard/index.html`
- `05_Meta/scripts/cron_scheduler.py`
- `05_Meta/scripts/live_server.py`
