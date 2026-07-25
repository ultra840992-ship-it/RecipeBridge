// filepath: 02_Wiki/dev-tasks/20260726_payment_matching_api_exception_sentry.md
## [Critical] [Lv4] 결제/매칭 API 예외 처리 강화 및 실시간 에러 로그 센트리(Sentry) 연동 및 실서버 배포

### 1. 개요
결제 및 매칭 API의 안정성 확보를 위해 예외 처리 로직을 강화하고, 실시간 에러 모니터링을 위한 Sentry 연동을 완료한다.

### 2. 작업 목표
*   `live_server.py` 내 결제/매칭 API 엔드포인트 예외 처리 강화.
*   Sentry SDK 연동 및 에러 로깅 기능 구현.
*   실서버 배포 준비 및 완료.

### 3. 상세 작업 내용

#### 3.1. Sentry SDK 연동
`live_server.py`에 Sentry SDK를 초기화하여 애플리케이션 전반의 에러를 자동으로 캡처하도록 설정한다.

