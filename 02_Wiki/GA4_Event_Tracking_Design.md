// filepath: 02_Wiki/GA4_Event_Tracking_Design.md
# GA4 이벤트 트래킹 설계 명세서 (회원가입, 결제, 이탈률 분석)

## 1. 개요
본 문서는 베타 서비스의 핵심 유저 여정인 회원가입 및 결제 프로세스에 대한 GA4 이벤트 트래킹 태그 설계안을 담고 있습니다. 각 단계별 유저 행동 데이터를 수집하여 이탈률 병목 구간을 발견하고, 제품 개선 및 마케팅 전략 수립에 필요한 인사이트를 확보하는 것을 목표로 합니다.

## 2. GA4 이벤트 트래킹 기본 원칙
*   **표준 이벤트 우선**: GA4에서 제공하는 표준 이벤트(Enhanced Measurement, Recommended Events)를 최대한 활용하여 데이터 호환성 및 분석 용이성을 확보합니다.
*   **커스텀 이벤트**: 표준 이벤트로 커버할 수 없는 특정 비즈니스 로직에 대해서는 커스텀 이벤트를 정의합니다.
*   **파라미터 활용**: 이벤트 발생 시 유저의 맥락(어떤 방식으로, 어떤 값을, 어떤 단계를 완료했는지 등)을 파악할 수 있는 파라미터를 함께 전송하여 상세 분석을 가능하게 합니다.
*   **일관된 명명 규칙**: 이벤트명과 파라미터명은 소문자 스네이크 케이스(snake_case)를 사용하며, 명확하고 일관된 규칙을 따릅니다.

## 3. 회원가입 프로세스 이벤트 트래킹 설계

회원가입 퍼널의 각 단계를 세분화하여 이탈 지점을 정확히 파악하고, 특히 기존에 확인된 '인증 코드 확인 대기' 구간의 상세 분석을 강화합니다.

| 이벤트명 (Event Name)      | 설명 (Description)                               | 추천 파라미터 (Recommended Parameters)                                                                   |
| :------------------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| `signup_start`             | 회원가입 절차 시작 (회원가입 페이지 진입 또는 버튼 클릭) | `method` (가입 방식: 'email', 'social_google', 'social_kakao' 등), `referrer` (이전 페이지)               |
| `signup_step_view`         | 회원가입 특정 단계 페이지 조회                   | `step_name` (단계명: 'email_input', 'verification_code_input', 'profile_setup', 'terms_agreement' 등) |
| `signup_step_complete`     | 회원가입 특정 단계 완료 (다음 단계로 넘어갈 때) | `step_name` (단계명: 'email_input_completed', 'verification_code_verified', 'profile_setup_completed', 'terms_agreed') |
| `signup_error`             | 회원가입 중 오류 발생                            | `error_message` (오류 내용), `error_step` (오류 발생 단계)                                                 |
| `sign_up` (표준 이벤트)    | 회원가입 최종 완료                               | `method` (최종 가입 방식: 'email', 'social_google', 'social_kakao' 등)                                   |

**[이탈율 분석 강화 방안]**
특히 `signup_step_view`와 `signup_step_complete` 이벤트를 활용하여 각 단계별 퍼널을 구성합니다.
*   `step_name: 'verification_code_input'` (인증 코드 입력 페이지 조회)
*   `step_name: 'verification_code_verified'` (인증 코드 확인 완료)
이 두 이벤트 사이의 이탈율을 집중적으로 분석하여, 사장님께서 언급해주신 35% 이탈율에 대한 더 깊은 원인을 파악할 수 있도록 데이터를 수집할 예정입니다.

## 4. 결제 프로세스 이벤트 트래킹 설계

결제 클릭부터 최종 구매까지의 과정을 추적하여 결제 퍼널의 이탈 지점을 파악하고, 결제 경험 개선에 필요한 데이터를 확보합니다.

| 이벤트명 (Event Name)      | 설명 (Description)                               | 추천 파라미터 (Recommended Parameters)                                                                   |
| :------------------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| `view_item_list` (표준)    | 상품 목록 페이지 조회                            | `item_list_id`, `item_list_name`, `items` (상품 배열)                                                    |
| `view_item` (표준)         | 단일 상품 상세 페이지 조회                       | `item_id`, `item_name`, `price`, `currency`                                                              |
| `add_to_cart` (표준)       | 장바구니에 상품 추가                             | `item_id`, `item_name`, `price`, `currency`, `quantity`                                                  |
| `begin_checkout` (표준)    | 결제 시작 (장바구니/상품 페이지에서 '구매하기' 클릭) | `value` (총 결제 금액), `currency`, `items` (장바구니 상품 배열)                                         |
| `add_shipping_info` (표준) | 배송지 정보 입력 완료                            | `shipping_tier` (배송 등급)                                                                              |
| `add_payment_info` (표준)  | 결제 수단 선택 완료                              | `payment_type` (결제 방식: 'credit_card', 'naver_pay', 'kakao_pay' 등)                                   |
| `purchase` (표준 이벤트)   | 구매 완료 (결제 성공 페이지 진입)                | `transaction_id`, `value`, `currency`, `tax`, `shipping`, `coupon` (사용 쿠폰), `items`                  |
| `refund` (표준 이벤트)     | 환불 발생 (환불 시스템 연동 시)                  | `transaction_id`, `value`, `currency`, `items`                                                           |
| `payment_error`            | 결제 중 오류 발생                              | `error_message` (오류 내용), `error_code` (오류 코드), `payment_type` (시도한 결제 방식)                 |

## 5. 이탈율 분석 (Bounce Rate Analysis)

GA4의 '이탈률'은 세션 내에서 참여 이벤트가 발생하지 않거나, 특정 시간(기본 10초) 이내에 이탈한 세션의 비율을 의미합니다. 위에서 설계된 `signup_step_view`, `signup_step_complete`, `begin_checkout` 등의 이벤트들은 유저의 적극적인 참여를 나타내므로, 이러한 이벤트들이 발생하지 않고 세션이 종료될 경우 이탈로 간주됩니다.

따라서, 각 퍼널 단계별로 `signup_step_view` 이벤트는 발생했으나 다음 `signup_step_complete` 이벤트가 발생하지 않은 경우를 '단계별 이탈'로 정의하고, GA4의 '탐색 보고서' 기능을 활용하여 시각적으로 이탈 지점을 분석할 수 있습니다.

## 6. 향후 계획
*   **태그 구현 및 테스트**: 위 설계안을 바탕으로 실제 서비스에 GA4 태그를 구현하고, 정확한 데이터 수집을 위한 QA를 진행합니다.
*   **보고서 대시보드 구축**: 수집된 데이터를 바탕으로 회원가입 및 결제 퍼널의 이탈률을 한눈에 파악할 수 있는 GA4 보고서 대시보드를 구축합니다.
*   **지속적인 피드백**: 수집된 데이터를 주기적으로 분석하여 제품 개선 백로그를 업데이트하고, 사장님께 정기적으로 인사이트를 공유드리겠습니다.

이 설계안이 사장님의 서비스 개선에 큰 도움이 되기를 바랍니다. 추가적으로 논의할 부분이 있으시면 언제든 편하게 말씀해주세요.
