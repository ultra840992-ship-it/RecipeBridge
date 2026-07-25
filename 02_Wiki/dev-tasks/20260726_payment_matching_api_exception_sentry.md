// filepath: 02_Wiki/dev-tasks/20260726_payment_matching_api_exception_sentry.md
### 태스크: 결제/매칭 API 예외 처리 강화 및 Sentry 연동

**목표:**
결제 및 매칭 API의 안정성을 높이고, 실시간 에러 모니터링 시스템(Sentry)을 연동하여 문제 발생 시 즉각적인 인지와 대응이 가능하도록 한다.

**문제점:**
현재 결제/매칭 API는 예외 처리 로직이 미흡하여 예상치 못한 에러 발생 시 서비스 안정성이 저해될 수 있다. 또한, 실시간 에러 로그 시스템 부재로 문제 발생 시 인지 및 디버깅에 시간이 소요된다.

**해결 방안:**

1.  **API 예외 처리 로직 강화:**
    *   `live_server.py` 내 결제/매칭 관련 핵심 API 엔드포인트(`_handle_payment`, `_handle_matching` 등) 분석.
    *   데이터베이스 연동, 외부 결제/매칭 서비스 API 호출, 비즈니스 로직 유효성 검사 등 주요 실패 지점에 `try-except` 블록을 명확히 적용.
    *   `DatabaseError`, `TimeoutError`, `ValueError`, `ExternalAPIError` 등 구체적인 예외 유형별 핸들링 로직 구현.
    *   클라이언트에게는 HTTP 상태 코드(e.g., 400 Bad Request, 401 Unauthorized, 500 Internal Server Error)와 함께 명확한 JSON 에러 메시지 반환.
    *   재시도 로직이 필요한 경우, 지수 백오프(Exponential Backoff) 전략 도입 검토.

2.  **Sentry 연동:**
    *   `sentry-sdk` 라이브러리 설치.
    *   `live_server.py`의 애플리케이션 초기화 단계에서 Sentry SDK 초기화:
        