// filepath: 02_Wiki/dev-tasks/20260726_payment_matching_api_exception_sentry.md
# [Critical] [Lv4] 결제/매칭 API 예외 처리 강화 및 실시간 에러 로그 센트리(Sentry) 연동 및 실서버 배포

## 1. 개요
결제 및 매칭 API의 안정성 확보를 위해 예외 처리 로직을 강화하고, Sentry를 연동해 실시간 에러 모니터링 시스템을 구축한다.

## 2. 목표
- `live_server.py` 내 결제/매칭 API에 견고한 예외 처리 적용.
- Sentry SDK 연동 및 주요 예외 발생 시 자동 로그 전송.
- 실서버 배포 완료.

## 3. 상세 작업 내용

### 3.1. Sentry SDK 연동 및 API 예외 처리 강화 (`live_server.py` 수정)
`live_server.py`에 Sentry를 초기화하고, 결제 및 매칭 관련 엔드포인트에 `try-except` 블록을 적용하여 예외 발생 시 Sentry로 에러를 전송하도록 한다.

