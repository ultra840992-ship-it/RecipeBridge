// filepath: 02_Wiki/dev-tasks/20240722_payment_matching_api.md
# 개발 태스크: 결제 모듈 및 블라인드 매칭 API 라우팅 스크립트 구축

**담당**: Bitz
**날짜**: 2024-07-22
**상태**: 진행 중 (API 뼈대 구축 완료)

## 1. 결제 모듈 연동 기초 API 뼈대

기존 `live_server.py`에 다음 결제 관련 API 엔드포인트를 추가하여 결제 모듈 연동 기초 뼈대를 구축한다.

### 1.1 결제 시작 (Initiate Payment)
- **메서드**: `POST`
- **경로**: `/api/payment/initiate`
- **설명**: 사용자 결제 요청을 받아 PG사로 리디렉션하거나 결제창 정보를 반환.
- **요청 바디 예시**:
  