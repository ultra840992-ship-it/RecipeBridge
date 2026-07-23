---
type: dev-task
date: 2026-07-24
status: completed
author: Bitz
---

# 대시보드 정적 에셋 404 로딩 오류 및 VPS PM2 크래시 루프 복구 패치 내역 (2026-07-24)

## 1. 장애 현황 및 증상
* **발생 시각**: 2026-07-24 06:40분 경 인지
* **증상**: 클라우드 VPS 대시보드 (`http://158.180.69.24:8000/`) 접속 시 화면의 레이아웃이 완전히 깨지고 빈 화면이 출력되는 현상 발생. 
* **PM2 상태**: `recipebridge-live-server` 프로세스가 비정상적으로 계속 재시작되는 현상(Restart Count: 1,302회) 및 크래시 루프 발생.

## 2. 근본 원인 분석
* **원인**: 대시보드 메인 (`index.html`)에서 브라우저 캐시 방지를 위해 CSS와 JS를 불러올 때 `dashboard.css?v=20260723_v12` 형식을 채택하였습니다.
* **버그 지점**: `live_server.py`의 `do_GET` 함수 내에서 `self.path`를 별도의 쿼리 스트링 제거 과정 없이 그대로 파일 시스템 경로와 결합하여 검사하였습니다.
  * 기존 경로 결합 로직: `os.path.join(base_dir, "05_Meta", "dashboard", self.path.lstrip("/"))`
  * 결과: `05_Meta/dashboard/dashboard.css?v=20260723_v12` 라는 존재하지 않는 경로를 탐색하게 되며 `404 Not Found` 에러를 반환.
  * 이로 인해 클라이언트 요청 시 정적 자산 로드 실패 및 PM2 에러가 반복 누적되었습니다.

## 3. 조치 내역
* **코드 패치**:
  * [live_server.py](file:///c:/Users/ultra/AI%201%EC%9D%B8%20%EA%B8%B0%EC%97%85%ED%99%94/05_Meta/scripts/live_server.py)의 `do_GET` 시작 시점에 `clean_path = self.path.split("?", 1)[0]`을 추가하여 쿼리 스트링을 완벽하게 분리해 냈습니다.
  * 이후 경로 결합 및 API 라우팅 시 `self.path` 대신 `clean_path`를 사용하여 캐시 방지 파라미터가 포함되어도 올바른 경로 매칭이 이루어지도록 조치하였습니다.
* **로컬 검증 완료**:
  * 로컬 포트 8000번 가동 후 `http://localhost:8000/dashboard.css?v=20260723_v12` 요청 시 정상적으로 상태 코드 200 OK로 서빙됨을 확인하였습니다.
* **원격 VPS 배포 및 리스타트 완료**:
  * 변경 사항을 Github 원격 레포지토리에 커밋 & 푸시한 후, 원격 VPS 서버 (`/home/ubuntu/recipebridge`)로 SSH 접속하여 `git pull origin main`을 실행하여 코드를 업데이트하였습니다.
  * PM2를 통해 `pm2 restart recipebridge-live-server` 명령어로 서비스를 재기동하였습니다. (정상 재시작 완료)

## 4. 최종 상태 확인
* 클라우드 대시보드 `http://158.180.69.24:8000/` 및 에셋들이 정상 리턴되고 대시보드가 성공적으로 접속 및 작동하고 있음을 확인하였습니다. (Status 200 OK 교차 검증)
