---
type: error
date: 2026-08-29
status: resolved
source: GLM-5.2, Claude 3.5 Sonnet, ChatGPT 4o Cross-Audits
title: 크로스 감사 3회차 결함 방지 및 안티패턴 레슨
---

# 크로스 감사 3회차 결함 방지 및 안티패턴 레슨

이 문서는 KidsEvent 개발 과정에서 3회에 걸친 크로스 감사(GLM-5.2, Claude 3.5 Sonnet, ChatGPT 4o)를 통해 발견하고 해결한 **핵심 안티패턴 및 보안/아키텍처 레슨**을 영구 보존하기 위해 작성되었습니다.

---

## 1. 보안 및 신뢰성 안티패턴 (Security Anti-Patterns)

### 🔴 1. URL 부분문자열 검증으로 인한 스푸핑 취약점
- **안티패턴**: `".go.kr" in url` 또는 `url.lower().endswith(".go.kr")` 같은 단순 문자열 매칭.
- **취약점**: `https://evil.com/fake.go.kr` 또는 `https://museum.go.kr.evil.com` 같은 피싱 사이트가 국공립 공식 인증 배지를 획득하는 치명적 결함.
- **해결책**: `urllib.parse.urlparse(url).hostname`을 추출하고, 신뢰 도메인 화이트리스트 및 정확한 서브도메인 검증(`is_subdomain_of`)을 엄격 적용.

### 🔴 2. HTTPS 미배선 (죽은 보안 코드)
- **안티패턴**: `validate_external_url()` 함수를 만들어두고 `evaluate_trust_badge()`에서 호출하지 않아 `http://` 비보안 링크가 검증을 통과하는 현상.
- **해결책**: 모든 배지 판정 경로의 최우선 가드로 `validate_external_url()`을 강제 배선하여 비-HTTPS는 즉시 `SUPPRESSED` 처리.

### 🔴 3. SUPPRESSED 및 취소/매진 행사의 소프트 감점 노출
- **안티패턴**: 스팸/신고/마감/취소된 행사를 랭킹에서 `trust=0.0`으로 가중치 감점만 처리하여, 다른 점수(시간·거리)가 높으면 상위에 노출되는 현상.
- **해결책**: `is_rankable(event)` 함수를 도입하여 `SOLD_OUT`, `CLOSED`, `CANCELLED`, `SUPPRESSED` 행사는 랭킹 루프 진입 전 100% 사전 하드 필터링.

---

## 2. 데이터 및 엔티티 해결 안티패턴 (Data & Deduplication Anti-Patterns)

### 🔴 4. 엔티티 중복제거 시 빈 장소명(`""`) 매칭 버그
- **안티패턴**: `v1 in v2` 조건에서 둘 중 하나라도 빈 문자열이면 파이썬의 `"" in "any"`가 `True`를 반환하여 전혀 다른 행사가 하나로 병합됨.
- **해결책**: `if not v1 or not v2 or len(v1) < 2 or len(v2) < 2: return False`로 빈 장소명을 엄격 차단.

### 🔴 5. 중복 병합 시 신뢰도 낮은 URL 고착화
- **안티패턴**: 블로그 등 낮은 신뢰도 소스가 먼저 수집되어 canonical이 된 후, 공식 기관 URL이 들어와도 덮어쓰지 않는 현상.
- **해결책**: 도메인 Tier(1=정부, 4=일반)를 비교하여 더 높은 권위의 `official_url`을 만나면 캐노니컬 레코드의 URL을 자동 승격.

### 🔴 6. O(N^2) 전체 선형 탐색 병목
- **안티패턴**: 대규모 수집 시 모든 행사를 선형 탐색하여 중복을 검사하는 구조.
- **해결책**: `(event_date, venue_prefix)` 기반 버킷 블로킹을 적용하여 동일 버킷 내에서만 Jaccard 유사도를 비교하도록 O(N) 최적화.

---

## 3. 안드로이드 아키텍처 및 개인정보(PII) 안티패턴

### 🔴 7. 미성년자 생년월일(DOB) 서버 전송
- **안티패턴**: 자녀의 `birthYearMonth`("2019-05")나 생년월일을 백엔드 API 요청으로 전송하는 것.
- **해결책**: 기기 로컬 `AgeCalculator.kt`에서 법정 만 나이를 연산하고, 서버에는 정수형 `age`만 전달하여 미성년자 PII 노출을 원천 차단.

### 🔴 8. UI 카드 도배 (Card Everything Slop) 및 AI 마케팅 문구
- **안티패턴**: 모든 목록 요소를 네모난 카드로 감싸고, "AI가 분석한 추천", "놓치면 후회할" 등의 수식어를 남발하는 현상.
- **해결책**: `EditorialEventRow` 플랫 리스트 + 디바이더로 전환하고, 3초 스캔 계층(**[무엇 → 언제/누구 → 어디서/거리 → 가격/출처]**)과 사실 기반 태그(`만 7세 권장`, `차로 약 18분`, `국공립 공식`)만 노출.

---

## 4. 암호화 및 무결성 보안 안티패턴 (Crypto & Key Security Anti-Patterns)

### 🔴 9. 체크섬/전자서명 보호 대상 필드 일부 누락 (부분 변조 노출)
- **안티패턴**: DTO 직렬화 시 일부 필드(`latitude`, `longitude`, `description`, `recommendationReasons` 등)를 해시 계산에서 제외.
- **취약점**: 공격자가 서명을 깨지 않고도 행사 좌표나 설명을 변조하여 사용자를 엉뚱하거나 유해한 장소로 유인할 수 있음.
- **해결책**: DTO의 **전체 23개 필드 전수**를 엄격한 파이프(`|`) 구분자로 직렬화하여 SHA-256 해시를 산출하고 ECDSA 서명을 수행.

### 🔴 10. Keystore 암호화 실패 시 평문 반환 (Fail-Open 안티패턴)
- **안티패턴**: `LocalDataCipher.encrypt()` 내부에서 예외 발생 시 `plainText`를 그대로 리턴.
- **취약점**: 키스토어 손상이나 일시적 장애 시 사용자의 자녀 정보 및 민감한 위치 데이터가 DataStore에 평문으로 저장됨.
- **해결책**: 쓰기(`encrypt`) 실패 시 무조건 `SecurityException`을 throw하여 쓰기 작업을 중단(Halt write)함으로써 평문 기록을 0%로 차단 (Strict Fail-Closed).

### 🔴 11. 테스트 코드 내 운영 비대칭 개인키(Private Key) 하드코딩
- **안티패턴**: 단위 테스트에서 서명 검증을 테스트하기 위해 운영 개인키를 `testPrivKeyB64` 상수로 코드에 포함.
- **취약점**: 오픈소스, ZIP 배포, 협업 과정에서 개인키가 유출되어 누구나 임의의 위조 피드에 유효한 서명을 달 수 있게 됨.
- **해결책**: 
  1. 운영 개인키는 프로젝트 리포지토리/ZIP/테스트 코드와 완전히 격리(CI Secret / OS Credential Store 보관).
  2. 앱에는 **공개키만** 배포.
  3. 테스트 코드에서는 `KeyPairGenerator.getInstance("EC")`로 **메모리 상에서 1회성 임시 키(Ephemeral KeyPair)**를 생성해 테스트하며, 임시 키로 서명된 피드가 운영 공식 키로 검증 시 거부되는지(Key Isolation)까지 증명.
