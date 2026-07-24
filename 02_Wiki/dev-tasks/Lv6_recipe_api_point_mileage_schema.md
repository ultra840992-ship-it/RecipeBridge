// filepath: 02_Wiki/dev-tasks/Lv6_recipe_api_point_mileage_schema.md
# [Lv6] 레시피 API 및 분산 포인트/마일리지 DB 스키마 설계

핵심만 간다. 레시피 등록/조회/평가 API와 분산 환경 고려한 포인트/마일리지 DB 스키마 설계안이다.

## 1. 레시피 관리 API (RESTful)

### 1.1. 레시피 등록 (POST /recipes)
- 설명: 새로운 레시피를 등록한다. `author_id`는 사용자 서비스의 UUID를 참조한다.
- 요청 바디 예시:
