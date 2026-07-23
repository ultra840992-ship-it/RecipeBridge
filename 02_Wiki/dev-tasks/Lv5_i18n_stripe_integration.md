// filepath: 02_Wiki/dev-tasks/Lv5_i18n_stripe_integration.md
# [Lv5] i18n 라이브러리 연동 및 글로벌 결제 모듈(Stripe API) 프론트/백엔드 연동

## 개발 태스크 카드

### 1. i18n 라이브러리 연동 (프론트엔드)
- **목표**: 다국어 지원을 위한 프론트엔드 i18n 라이브러리 통합.
- **세부 계획**:
    - `react-i18next` (또는 해당 프레임워크에 맞는 라이브러리) 설치 및 설정.
    - `locales` 디렉토리에 `en.json`, `ko.json` 등 언어별 번역 파일 생성 및 관리.
    - 사용자 언어 선택 UI 컴포넌트 구현 및 상태 관리 연동.
    - `t()` 함수를 이용한 텍스트 번역 적용.

### 2. 글로벌 결제 모듈 (Stripe API) 연동

#### 2.1. 프론트엔드 연동 (Stripe.js)
- **목표**: Stripe.js를 이용한 안전한 결제 정보 수집 및 `PaymentIntent` 처리.
- **세부 계획**:
    - `Stripe.js` 라이브러리 로드 및 초기화.
    - `Elements` 프로바이더로 결제 UI 감싸기.
    - `CardElement` 또는 `PaymentElement` 컴포넌트 사용하여 카드 정보 입력 필드 렌더링.
    - `PaymentIntent` 생성 API 호출 후 반환된 `client_secret`를 사용하여 `stripe.confirmCardPayment()`로 결제 확정 로직 구현.
    - 결제 성공/실패 피드백 UI 처리.

#### 2.2. 백엔드 연동 (live_server.py)
- **목표**: Stripe API를 통해 결제 처리 및 웹훅 이벤트 핸들링.
- **세부 계획**:
    - `live_server.py`에 `stripe` 파이썬 라이브러리 설치 및 임포트.
    - 환경 변수 (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) 설정 및 로드.
    - **`/api/create-payment-intent` 엔드포인트 구현**:
        - 요청 바디에서 `amount`, `currency` 등 결제 정보 수신.
        - `stripe.PaymentIntent.create()` 호출하여 `PaymentIntent` 생성.
        - 생성된 `PaymentIntent`의 `client_secret`를 프론트엔드로 반환.
        - 에러 발생 시 적절한 HTTP 상태 코드 및 메시지 반환.
    - **`/api/stripe-webhook` 엔드포인트 구현**:
        - Stripe 웹훅 이벤트 수신 및 처리.
        - `stripe.Webhook.construct_event()`를 사용하여 웹훅 시그니처 검증 및 이벤트 객체 생성 (보안 필수).
        - `payment_intent.succeeded`, `payment_intent.payment_failed` 등 주요 이벤트 타입에 따라 비즈니스 로직 (예: 주문 상태 업데이트, 사용자에게 알림) 구현.
        - 웹훅 처리 성공 시 `200 OK` 응답.

### 3. 검증 및 배포
- **프론트엔드**: 개발 서버에서 i18n 및 Stripe UI/UX 테스트.
- **백엔드**: `python -m py_compile`로 문법 오류 체크. Postman/cURL로 API 엔드포인트 테스트.
- **통합 테스트**: 프론트엔드-백엔드 연동 테스트 (샌드박스 환경).
- **CI/CD**: 테스트 통과 후 개발/스테이징/운영 환경 배포.

---
**Bitz 코멘트**:
i18n은 프론트에서 번역 리소스 구조 잡고, Stripe는 백엔드에서 `PaymentIntent` 생성과 웹훅 처리만 깔끔하게 가면 된다. 보안(`client_secret` 사용, 웹훅 시그니처 검증) 놓치지 마라.
