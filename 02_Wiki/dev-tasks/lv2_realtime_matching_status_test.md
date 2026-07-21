// filepath: 02_Wiki/dev-tasks/lv2_realtime_matching_status_test.md
### [Lv2] 실시간 매칭 상태 변경에 따른 백엔드 DB 연동 및 프론트엔드 모달 라우팅 연동 테스트

**작업 목표**: 실시간 매칭 상태 변경 로직을 백엔드와 프론트엔드에 구현하고, DB 연동 및 모달 라우팅이 정상 작동하는지 테스트한다. 불필요한 기능 추가 없이 핵심 기능에 집중한다.

**세부 작업 계획**:

1.  **백엔드 (`live_server.py`) 수정**:
    *   **DB 스키마**: 로컬 테스트용 SQLite DB에 `matching_status` 테이블 생성. 필드는 `match_id (PK)`, `user_id_1`, `user_id_2`, `status (TEXT: pending, matched, rejected)`, `timestamp`.
    *   **API 엔드포인트**:
        *   `POST /api/match/status`: `match_id`와 `new_status`를 받아 DB 업데이트.
        *   `GET /api/match/status/<match_id>`: 특정 `match_id`의 현재 상태 조회.
    *   **DB 연동**: 위 엔드포인트에서 SQLite DB와 연동하는 최소한의 CRUD 로직 구현.

2.  **프론트엔드 (`index.js` 또는 신규 모듈) 수정**:
    *   **상태 폴링**: `setInterval`을 이용해 일정 주기(예: 3초)로 `GET /api/match/status/<match_id>` 호출.
    *   **모달 라우팅**: 폴링된 `status` 값에 따라 다른 모달 UI를 동적으로 표시.
        *   `matched`: "매칭 성공" 모달
        *   `rejected`: "매칭 실패" 모달
    *   **UI 컴포넌트**: 임시 모달 UI 및 상태 메시지 표시를 위한 HTML/CSS 추가.

3.  **통합 테스트 절차**:
    *   `live_server.py` 가동.
    *   프론트엔드 페이지 로드.
    *   Postman 또는 `curl`로 `POST /api/match/status` 호출, `match_id=123`, `new_status=matched`로 변경.
    *   프론트엔드에서 "매칭 성공" 모달이 즉시 표시되는지 확인.
    *   동일하게 `new_status=rejected`로 변경 시 "매칭 실패" 모달 확인.

**예상 결과물**:
*   `live_server.py` (DB 연동 및 신규 API)
*   `index.js` (상태 폴링 및 모달 라우팅)
*   관련 HTML/CSS (임시 모달 UI)

**린터 적용**:
*   백엔드: `python -m py_compile` 실행 및 PASS 확인.
*   프론트엔드: `validate-template.sh` (가정) 실행 및 PASS 확인.

**핵심**: "실시간"은 초기 폴링 방식으로 구현하며, 추후 요구사항에 따라 WebSocket으로 최적화 가능성을 열어둔다.
