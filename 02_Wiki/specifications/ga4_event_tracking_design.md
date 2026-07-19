// filepath: 02_Wiki/specifications/ga4_event_tracking_design.md
# GA4 이벤트 트래킹 설계 명세서

## 1. 개요
베타 서비스의 사용자 가입 및 결제 퍼널에서 발생하는 주요 이탈 지점을 정확하게 파악하고, 사용자 경험을 개선하기 위한 GA4 이벤트 트래킹 태그 설계 명세입니다. 특히, 기존에 확인된 '인증 코드 확인 대기' 구간의 높은 이탈률을 면밀히 분석하고, 잠재적인 병목 구간을 사전에 발견하는 데 중점을 둡니다.

## 2. 이벤트 설계 원칙
*   **사용자 행동 중심**: 사용자의 주요 행동(클릭, 입력, 페이지 이동)을 중심으로 이벤트를 정의합니다.
*   **퍼널 단계 명확화**: 가입 및 결제 퍼널의 각 단계를 명확히 구분하여 이탈 지점을 세분화합니다.
*   **오류 및 성공 추적**: 각 단계에서의 성공과 실패를 모두 추적하여 문제 원인을 파악합니다.
*   **재사용성 및 일관성**: 이벤트 명명 규칙 및 파라미터 사용에 일관성을 유지합니다.

## 3. GA4 이벤트 상세 설계

### 3.1. 회원가입 퍼널 이벤트

| 이벤트명 (event_name) | 설명 | 파라미터 (event_parameters) | 비고 |
|---|---|---|---|
| `signup_start` | 회원가입 시작 페이지 진입 | `method`: 가입 방식 (e.g., 'email', 'social_kakao') | 퍼널의 첫 단계 |
| `signup_step_progress` | 회원가입 특정 단계 진행 | `step_name`: 단계 명칭 (e.g., 'email_entry', 'password_set', 'terms_agreement', 'verification_code_entry', 'profile_setup') <br> `status`: 'success' | 각 단계별 진행 성공 |
| `signup_verification_code_sent` | 인증 코드 발송 | `method`: 인증 방식 (e.g., 'email', 'sms') | 특히 인증 코드 대기 이탈률 분석에 중요 |
| `signup_verification_code_error` | 인증 코드 오류 발생 | `error_type`: 오류 유형 (e.g., 'invalid_code', 'timeout', 'resend_limit_exceeded') | 인증 코드 관련 문제 심층 분석 |
| `signup_complete` | 회원가입 완료 | `user_id`: 해시 처리된 사용자 ID (선택적) | 퍼널의 최종 단계 |
| `signup_error` | 회원가입 중 오류 발생 | `step_name`: 오류 발생 단계 <br> `error_message`: 오류 메시지 | 이탈 원인 분석 |

### 3.2. 결제 퍼널 이벤트

| 이벤트명 (event_name) | 설명 | 파라미터 (event_parameters) | 비고 |
|---|---|---|---|
| `checkout_start` | 결제 시작 (장바구니/상품 페이지에서 결제 버튼 클릭) | `item_id`: 결제 상품 ID <br> `item_name`: 결제 상품명 <br> `value`: 총 결제 금액 <br> `currency`: 통화 (e.g., 'KRW') | 결제 퍼널의 첫 단계 |
| `add_shipping_info` | 배송 정보 입력 완료 (필요시) | `item_id`, `item_name`, `value`, `currency` | 배송 정보가 필요한 서비스의 경우 |
| `add_payment_info` | 결제 정보 입력 완료 (카드 선택 등) | `payment_method`: 결제 수단 (e.g., 'credit_card', 'naver_pay', 'kakao_pay') <br> `item_id`, `item_name`, `value`, `currency` | |
| `purchase` | 결제 완료 | `transaction_id`: 거래 ID <br> `value`: 최종 결제 금액 <br> `currency`: 통화 (e.g., 'KRW') <br> `items`: 결제 상품 목록 (배열) | 퍼널의 최종 단계, 전자상거래 표준 이벤트 |
| `purchase_fail` | 결제 실패 | `transaction_id`: 거래 ID <br> `error_reason`: 실패 사유 (e.g., 'insufficient_funds', 'payment_gateway_error', 'card_declined') | 결제 실패 원인 분석 |

### 3.3. 이탈률 분석 보조 이벤트 (Engage)

| 이벤트명 (event_name) | 설명 | 파라미터 (event_parameters) | 비고 |
|---|---|---|---|
| `page_scroll` | 페이지 75% 스크롤 | `page_path`: 스크롤된 페이지 경로 | 사용자 콘텐츠 소비도 측정 |
| `time_on_page` | 특정 시간 이상 페이지 체류 | `page_path`: 체류 페이지 경로 <br> `duration_seconds`: 체류 시간 | 페이지 관심도 측정 (GA4 자동 수집 외 추가 필요 시) |
| `cta_click` | 주요 CTA (Call-to-Action) 버튼 클릭 | `button_name`: 버튼 명칭 <br> `page_path`: 클릭 발생 페이지 | 특정 액션 유도 성공률 측정 |
| `form_interaction` | 폼 필드 상호작용 (입력 시작, 변경 등) | `form_id`: 폼 ID 또는 이름 <br> `field_name`: 필드 이름 <br> `action`: 'focus', 'change' | 폼 작성 중 이탈 원인 분석 (선택적) |

## 4. 구현 가이드라인
*   **데이터 레이어 활용**: GTM(Google Tag Manager)을 사용하여 데이터 레이어에 푸시된 정보를 기반으로 이벤트를 트리거합니다.
*   **사용자 ID**: `user_id`는 개인 식별 정보가 포함되지 않도록 해시 처리 또는 익명화하여 사용합니다.
*   **테스트**: 태그 배포 전 GA4 DebugView를 통해 정확한 이벤트 발생 여부를 반드시 확인합니다.
*   **문서화**: 실제 구현 시 발생할 수 있는 특이사항이나 추가적인 이벤트 정의는 본 명세서에 지속적으로 업데이트하여 관리합니다.

## 5. 기대 효과
*   GA4 퍼널 보고서를 통해 가입 및 결제 단계별 정확한 이탈률 병목 구간을 시각적으로 파악할 수 있습니다.
*   특히, '인증 코드 확인 대기' 구간의 상세한 이탈 원인을 분석하여 제품 개선 우선순위를 설정하는 데 기여합니다.
*   고객의 실제 행동 데이터를 기반으로 서비스 개선 백로그를 더욱 정교하게 수립하고, Nova 팀에 정확한 데이터를 전달할 수 있습니다.
