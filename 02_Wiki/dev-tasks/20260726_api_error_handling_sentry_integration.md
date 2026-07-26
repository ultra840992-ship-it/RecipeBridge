// filepath: 02_Wiki/dev-tasks/20260726_api_error_handling_sentry_integration.md
### 태스크 완료: 결제/매칭 API 예외 처리 강화 및 Sentry 연동 (Lv4)

**상태**: 완료

**내용**:
요청한 대로 결제/매칭 API에 대한 예외 처리 로직을 강화하고, 실시간 에러 추적을 위해 Sentry 연동을 완료했다. `live_server.py`의 핵심 API 엔드포인트에 `try-except` 블록을 적용하여 예상치 못한 오류 발생 시 Sentry로 즉시 전송되도록 처리했다. 이는 서비스 안정성 확보와 빠른 문제 해결에 필수적이다.

**구현 상세**:
*   `sentry_sdk` 라이브러리 추가 및 DSN 환경 설정.
*   `live_server.py` 내 `/api/payment` 및 `/api/match` 엔드포인트에 전역 및 특정 예외 처리 로직 적용.
*   모든 예외는 `sentry_sdk.capture_exception()`을 통해 Sentry로 보고.
*   클라이언트에게는 HTTP 상태 코드와 함께 표준화된 에러 메시지를 반환하도록 구현.
*   코드 수정 후 `python -m py_compile` 린터 검사를 통과했다.
*   실서버 배포 완료.

**영향 파일**:
*   `live_server.py`

**결과**:
결제 및 매칭 관련 API에서 발생하는 모든 오류가 Sentry 대시보드에서 실시간으로 모니터링 가능하다.
