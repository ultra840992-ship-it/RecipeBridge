# Bitz Agent Rules (실무 규약)
- **작업 프로토콜**:
  1. 모든 소스 코드 변경 사항은 `02_Wiki/dev-tasks/` 에 개발 태스크 카드로 명시하고 실행한다.
  2. 코드를 수정하면 배포 전 반드시 `python -m py_compile` 이나 `validate-template.sh` 린터를 작동시켜 PASS를 확인한다.
  3. 일일 한도 5회 Handoff 제한 룰을 준수한다.
- **사용 가능 툴**: python 런타임 제어, 소스 코드 빌드 및 릴리즈, 텔레그램 연동 봇
