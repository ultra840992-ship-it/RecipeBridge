// filepath: 02_Wiki/dev-tasks/Lv6_recipe_api_point_mileage_schema_design.md
### [Lv6] 레시피 등록/조회/평가 API 구축 및 분산 포인트/마일리지 DB 스키마 설계

**레시피 API 명세:**

*   **레시피 등록 (POST /recipes)**
    *   요청: `{ "title": "...", "description": "...", "ingredients": [], "instructions": [], "image_url": "..." }`
    *   응답: `{ "recipe_id": "...", "message": "Recipe registered successfully." }`
    *   설명: 새 레시피를 등록한다. 등록 시 사용자에게 포인트 지급 로직 연동.

*   **레시피 조회 (GET /recipes/{recipe_id})**
    *   요청: (없음)
    *   응답: `{ "recipe_id": "...", "title": "...", "description": "...", "ingredients": [], "instructions": [], "image_url": "...", "average_rating": 4.5, "ratings_count": 10 }`
    *   설명: 특정 레시피의 상세 정보를 조회한다.

*   **레시피 목록 조회 (GET /recipes)**
    *   요청: `?page=1&limit=10&sort_by=created_at&order=desc`
    *   응답: `[ { "recipe_id": "...", "title": "...", "image_url": "...", "average_rating": 4.0 }, ... ]`
    *   설명: 레시피 목록을 페이지네이션 및 정렬하여 조회한다.

*   **레시피 평가 (POST /recipes/{recipe_id}/ratings)**
    *   요청: `{ "score": 4, "comment": "Great recipe!" }`
    *   응답: `{ "rating_id": "...", "message": "Recipe rated successfully." }`
    *   설명: 특정 레시피에 평점과 코멘트를 등록한다. 평가 시 사용자에게 마일리지 지급 로직 연동.

**분산 포인트/마일리지 DB 스키마 설계:**

포인트 및 마일리지는 분산 시스템 환경을 고려하여, 각각 별도의 서비스 또는 데이터베이스로 관리하는 것을 전제로 스키마를 설계한다. 트랜잭션의 정합성 유지를 위해 이벤트 기반 아키텍처 또는 사가 패턴을 고려할 수 있다.

**1. Recipe DB Schema (예시: PostgreSQL)**

