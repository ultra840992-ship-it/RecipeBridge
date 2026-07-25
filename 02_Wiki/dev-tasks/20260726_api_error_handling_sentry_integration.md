// filepath: 02_Wiki/dev-tasks/20260726_api_error_handling_sentry_integration.md
### [Critical] [Lv4] 결제/매칭 API 예외 처리 강화 및 실시간 에러 로그 센트리(Sentry) 연동 및 실서버 배포

**목표:** 결제/매칭 API의 안정성을 높이고, 실시간 에러 모니터링을 위해 Sentry를 연동, 실서버에 배포한다. 군더더기 없이 핵심만 처리.

**작업 내용:**

1.  **결제/매칭 API 예외 처리 강화 (`live_server.py`):**
    *   결제 및 매칭 관련 핵심 로직에 `try-except` 블록을 명확하게 적용.
    *   `ValueError`, `KeyError` 등 예상 가능한 파이썬 내장 예외와, 결제 실패, 매칭 불가 등 비즈니스 로직에 특화된 커스텀 예외(`PaymentError`, `MatchingError` 등)를 정의하여 구분 처리.
    *   각 예외 발생 시 적절한 HTTP 상태 코드와 메시지를 반환하도록 구현.
    *   예상치 못한 모든 `Exception`은 일반적인 서버 오류로 처리하고 Sentry에 보고.

    