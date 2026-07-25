// filepath: 02_Wiki/dev-tasks/20260726_payment_matching_api_exception_sentry.md
# [Critical] [Lv4] 결제/매칭 API 예외 처리 강화 및 실시간 에러 로그 센트리(Sentry) 연동 및 실서버 배포

## 1. 개요
현재 운영 중인 `live_server.py`의 결제 및 매칭 API 안정성 확보를 위해 예외 처리 로직을 강화하고, Sentry를 연동하여 실시간 에러 모니터링 시스템을 구축한다. 최종적으로 실서버에 배포하여 서비스 안정성을 극대화한다.

## 2. 목표
*   결제/매칭 핵심 API 엔드포인트에 견고한 예외 처리 로직 적용.
*   Sentry SDK를 `live_server.py`에 연동, 모든 uncaught exception 및 주요 비즈니스 로직 에러를 Sentry로 전송.
*   배포 전 `python -m py_compile` 린터 PASS 확인.
*   강화된 코드 실서버 배포 및 Sentry 연동 검증.

## 3. 작업 상세
### 3.1. 영향 범위
*   `live_server.py` 내 결제 및 매칭 관련 모든 API 라우트 및 내부 함수.

### 3.2. 예외 처리 강화 (Payment/Matching API)
*   **`try-except` 블록 적용**: 데이터베이스 오류, 외부 API 통신 실패, 입력값 유효성 검증 실패 등 발생 가능한 모든 예외 상황을 명시적으로 처리.
*   **에러 응답 표준화**: 각 예외 유형에 따라 적절한 HTTP 상태 코드(e.g., 400, 500)와 일관된 JSON 에러 메시지 반환.

### 3.3. Sentry 연동
*   **SDK 설치**: `pip install sentry-sdk`
*   **초기화**: `sentry_sdk.init(dsn="YOUR_SENTRY_DSN", environment="production")`
    *   `YOUR_SENTRY_DSN`은 사장님께 발급 요청 또는 확인 필요.
*   **에러 캡처**:
    *   Uncaught Exception은 Sentry SDK가 자동으로 캡처.
    *   특정 비즈니스 로직 에러는 `sentry_sdk.capture_exception(e)` 또는 `sentry_sdk.capture_message("...")`로 명시적 전송.
*   **컨텍스트 추가**: `sentry_sdk.set_user({"id": user_id, "email": user_email})` 등을 활용, 에러 발생 시 사용자 정보 추적 용이하게 구성.

### 3.4. 배포 및 검증
*   **코드 검증**: 변경된 `live_server.py`에 대해 `python -m py_compile` 실행, PASS 확인.
*   **Git 연동**: 변경 사항 커밋 및 푸시.
*   **실서버 배포**: CI/CD 파이프라인 또는 수동 배포 절차에 따라 배포.
*   **Sentry 모니터링**: 배포 후 Sentry 대시보드에서 에러 로그가 정상적으로 수집되는지 확인.

## 4. 필요 리소스
*   Sentry DSN
*   `live_server.py` 소스 코드

## 5. 예상 완료일
2026-07-26

## 6. 진행 상태
*   [ ] 결제 API 예외 처리 강화
*   [ ] 매칭 API 예외 처리 강화
*   [ ] Sentry SDK 설치 및 초기화
*   [ ] Sentry로 에러 이벤트 전송 로직 구현
*   [ ] `python -m py_compile` 검증 완료
*   [ ] 실서버 배포
