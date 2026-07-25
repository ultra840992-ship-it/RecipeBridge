// filepath: 02_Wiki/dev-tasks/20260726_api_error_handling_sentry_integration.md
# [Critical] [Lv4] 결제/매칭 API 예외 처리 강화 및 실시간 에러 로그 센트리(Sentry) 연동 및 실서버 배포

## 작업 개요
결제 및 매칭 관련 핵심 API의 안정성을 최우선으로 확보하기 위해 예외 처리 로직을 강화하고, 실시간 에러 모니터링 시스템 Sentry를 연동하여 즉각적인 문제 감지 및 대응 체계를 구축했다. 모든 변경사항은 실서버에 배포 완료.

## 상세 작업 내용

### 1. 결제/매칭 API 예외 처리 강화 (live_server.py)
*   `live_server.py` 내 `payments` 및 `matching` 관련 엔드포인트에 `try-except` 블록을 전면 적용했다.
*   외부 결제 게이트웨이 통신 실패, 데이터베이스 트랜잭션 오류, 비즈니스 로직 상의 매칭 실패 등 발생 가능한 모든 예외 상황에 대해 구체적인 에러 핸들링 로직을 추가했다.
*   클라이언트에게는 HTTP 상태 코드(예: 400 Bad Request, 403 Forbidden, 404 Not Found, 500 Internal Server Error)와 함께 명확한 JSON 형식의 에러 메시지를 반환하도록 구현했다.
    *   예: `{ "status": "error", "message": "결제 승인 실패: 잔액 부족 또는 카드 정보 오류" }`
    *   예: `{ "status": "error", "message": "매칭 실패: 적합한 파트너를 찾을 수 없습니다." }`

### 2. 실시간 에러 로그 Sentry 연동 (live_server.py)
*   `sentry-sdk` 라이브러리를 `requirements.txt`에 추가하고 설치했다.
*   `live_server.py` 애플리케이션 초기화 시 Sentry SDK를 설정했다.
    