---
type: infrastructure
date: 2026-07-18
status: active
---

# RecipeBridge 24/7 클라우드 상시 가동 인프라 아키텍처 가이드

이 문서는 로컬 개발 환경(Obsidian PC)을 넘어, 6인의 AI 에이전트 및 텔레그램 브리지가 24시간 끊김 없이 작동하기 위해 클라우드 VPS에 구축해야 하는 인프라 환경 명세 및 설정 가이드입니다.

---

## 1. 인프라 아키텍처 개요

로컬 PC의 전원이 꺼져도 클라우드 상의 텔레그램 봇 및 스케줄러가 항시 살아있도록 구성하며, 변경된 산출물은 Git을 통해 자동으로 상호 동기화(양방향 싱크)됩니다.

```
┌────────────────────────┐              ┌────────────────────────┐
│   로컬 PC (Obsidian)    │ <─── Git ──> │   클라우드 VPS 서버    │
│  - 개발 및 디자인 시안  │  (Auto Push) │  - 텔레그램 봇 브리지  │
│  - 로컬 테스트 실행     │ <─── sync ── │  - 24시간 스케줄러(cron)│
└────────────────────────┘              └────────────────────────┘
```

---

## 2. 클라우드 VPS 서버 사양 (추천)

* **제공업체**: Vultr, AWS LightSail, 혹은 DigitalOcean
* **OS**: Ubuntu 22.04 LTS (x64)
* **최소 사양**: 1 vCPU, 1GB RAM, 25GB SSD (월 $5 내외의 가상 서버로 가볍게 기동 가능)
* **필수 런타임**:
  - Python 3.10+
  - Node.js 18+ (PM2 프로세스 매니저 및 템플릿 배포 런타임용)
  - Git

---

## 3. 24시간 백그라운드 데몬 가동 설정 (PM2)

파이썬 기반의 텔레그램 봇 브리지가 오류로 꺼지더라도 자동으로 재실행하고 모니터링할 수 있도록 **PM2(Process Manager 2)** 또는 **systemd** 서비스로 구동합니다.

### PM2를 활용한 24시간 구동 명령어
```bash
# PM2 글로벌 설치
npm install -g pm2

# 텔레그램 브리지 스크립트를 백그라운드 서비스로 기동
pm2 start 05_Meta/scripts/telegram_bridge.py --name "recipebridge-tg-bridge" --interpreter python3

# 서버 재부팅 시에도 PM2 서비스가 자동 시작되도록 셋팅
pm2 startup
pm2 save
```

### PM2 로그 확인 및 상태 점검
```bash
# 실행 상태 확인
pm2 status

# 실시간 에러 및 출력 로그 모니터링
pm2 logs recipebridge-tg-bridge
```

---

## 4. Git 양방향 동기화 파이프라인 (Auto Git Sync)

클라우드 VPS 에이전트들이 생성한 산출물(예: `tasks/`, `log.md`)과 로컬 PC에서 사장님이 편집한 Wiki의 최신 상태를 실시간 결합하기 위해 10분 주기 크론탭(Cron)을 세팅합니다.

### VPS 서버용 Git 자동 동기화 쉘 스크립트 (`git-sync.sh`)
```bash
#!/bin/bash
cd /root/AI_1person_company  # 프로젝트 경로

# 로컬 변경점 커밋
git add .
git commit -m "auto: 24/7 agent sync from cloud VPS"

# 원격 저장소 최신 상태 pull (rebase로 히스토리 병합)
git pull --rebase origin main

# 원격 저장소로 push
git push origin main
```

### 크론 스케줄링 설정 (`crontab -e`)
```bash
# 매 10분마다 git-sync.sh를 실행하여 코드 동기화
*/10 * * * * /bin/bash /root/AI_1person_company/05_Meta/scripts/git-sync.sh > /dev/null 2>&1
```
*(주의: 로컬 PC의 Obsidian에서도 이와 유사한 자동 Git Commit & Push 플러그인(Obsidian Git)을 셋업해 두면 실시간 양방향 싱크가 완성됩니다.)*
