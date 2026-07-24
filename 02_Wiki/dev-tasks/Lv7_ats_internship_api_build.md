// filepath: 02_Wiki/dev-tasks/Lv7_ats_internship_api_build.md
# [Lv7] 기업 전용 ATS 대시보드 및 인턴십 진척 관리 API 빌드

## 1. 개요
기업 전용 ATS(Applicant Tracking System) 대시보드 프론트엔드 연동 및 인턴십 진척 관리를 위한 RESTful API를 빌드한다. 핵심은 지원자 및 인턴십 데이터를 효율적으로 조회, 생성, 업데이트하는 엔드포인트 제공이다.

## 2. API 엔드포인트 설계

### 2.1. 인턴십 지원자 관리
*   **지원자 목록 조회**
    *   `GET /api/ats/applicants`
    *   설명: 모든 인턴십 지원자 목록을 조회한다. 필터링(예: `?status=pending`, `?internship_id=123`) 및 페이지네이션 지원.
    *   응답: `200 OK`
        