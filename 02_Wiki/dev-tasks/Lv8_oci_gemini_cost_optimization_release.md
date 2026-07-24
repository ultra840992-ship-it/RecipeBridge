// filepath: 02_Wiki/dev-tasks/Lv8_oci_gemini_cost_optimization_release.md
### [CRITICAL] OCI 클라우드 자동 확장 및 Gemini Context Cache 적용 비용 최적화 인프라 최종 릴리즈

**목표**: OCI 리소스 효율성 극대화 및 Gemini API 호출 비용 절감.

**1. OCI 자동 확장 설정 (Compute Instance Pool & Auto-scaling Configuration)**

*   **Instance Pool 생성**:
    *   애플리케이션 컨테이너 이미지(Docker) 기반 인스턴스 템플릿 정의.
    *   최소/최대 인스턴스 수 설정 (예: 최소 2, 최대 10).
    *   가용성 도메인(AD) 및 장애 도메인(FD) 분산 배치.
*   **Auto-scaling Configuration**:
    *   **정책**: 평균 CPU 사용률 (예: 60% 이상 시 확장, 30% 이하 시 축소).
    *   **메트릭**: `oci_compute_instance_cpu_utilization` 활용.
    *   **쿨다운 기간**: 확장/축소 이벤트 후 안정화 시간 설정 (예: 5분).
*   **로드 밸런서 연동**:
    *   OCI Load Balancer 생성 및 백엔드 세트로 인스턴스 풀 연결.
    *   헬스 체크 설정 (HTTP 200 OK).

**2. Gemini Context Cache 적용 (Python 기반)**

*   **캐싱 전략**:
    *   자주 사용되거나 변동 없는 Gemini 컨텍스트(프롬프트 템플릿, 시스템 메시지 등)는 로컬 캐시 또는 Redis/Memcached 활용.
    *   Python `functools.lru_cache` 또는 `cachetools` 라이브러리 사용 검토.
    *   API 호출 전 캐시 히트 여부 확인 로직 추가.
*   **구현 상세**:
    