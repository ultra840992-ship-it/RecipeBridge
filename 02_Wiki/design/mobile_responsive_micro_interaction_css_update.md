// filepath: 02_Wiki/design/mobile_responsive_micro_interaction_css_update.md
/*
 * File: mobile_responsive_micro_interaction_css_update.md
 * Description: 실사용자 UI 피드백 반영 모바일 반응형 세부 컴포넌트 마이크로 인터랙션 최적화 CSS
 * Version: 1.1 (2026-07-26)
 * Author: Vivid
 *
 * 이 CSS는 모바일 환경에서 대시보드 주요 컴포넌트(예: .dashboard-card, .interactive-button)의
 * 반응형 디자인과 마이크로 인터랙션(hover/active)을 최적화하여 사용자 경험을 향상시킵니다.
 * 프리미엄 라이트(샌드 크림/샴페인 골드) 테마와 서리 낀 유리(Frosted Glassmorphism) 효과를
 * 모바일에서도 일관되게 유지합니다.
 */

:root {
    --sand-cream: #F5F5DC;
    --champagne-gold: #D4AF37;
    --text-dark: #333333;
    --text-light: #FFFFFF;
    --glass-bg-light: rgba(255, 255, 255, 0.15);
    --glass-border-light: rgba(255, 255, 255, 0.2);
    --shadow-light: rgba(0, 0, 0, 0.08);
    --shadow-hover-light: rgba(0, 0, 0, 0.15);
}

/* --------------------------------------------------- */
/* Global Reset & Base Styles for Mobile */
/* --------------------------------------------------- */
body {
    background-color: var(--sand-cream);
    color: var(--text-dark);
    font-family: 'Pretendard', sans-serif; /* 프리미엄 폰트 적용 */
    -webkit-tap-highlight-color: transparent; /* 모바일 탭 하이라이트 제거 */
}

/* --------------------------------------------------- */
/* Interactive Button Component */
/* --------------------------------------------------- */
.interactive-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    background: var(--champagne-gold);
    color: var(--text-light);
    border: none;
    box-shadow: 0 4px 10px var(--shadow-light);
    transition: all 0.2s ease-in-out; /* 부드러운 트랜지션 */
    -webkit-tap-highlight-color: rgba(0,0,0,0); /* iOS 탭 하이라이트 제거 */
    outline: none; /* 포커스 아웃라인 제거 */
}

.interactive-button:hover {
    transform: translateY(-2px); /* 살짝 떠오르는 효과 */
    box-shadow: 0 6px 15px var(--shadow-hover-light);
    background: linear-gradient(135deg, var(--champagne-gold) 0%, darken(var(--champagne-gold), 10%) 100%); /* 미세한 그라데이션 변화 */
}

.interactive-button:active {
    transform: translateY(1px); /* 눌리는 효과 */
    box-shadow: 0 2px 5px var(--shadow-light);
    background: darken(var(--champagne-gold), 5%); /* 색상 살짝 어둡게 */
    transition: all 0.1s ease-out; /* 빠른 반응 */
}

/* --------------------------------------------------- */
/* Dashboard Card Component (Glassmorphism) */
/* --------------------------------------------------- */
.dashboard-card {
    background: var(--glass-bg-light); /* 서리 낀 유리 배경 */
    backdrop-filter: blur(12px); /* 블러 효과 강화 */
    -webkit-backdrop-filter: blur(12px); /* Safari 지원 */
    border: 1px solid var(--glass-border-light);
    border-radius: 18px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 6px 20px var(--shadow-light);
    transition: all 0.3s ease-in-out;
    position: relative;
    overflow: hidden; /* 내부 요소가 넘치지 않도록 */
}

.dashboard-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%); /* 빛 반사 효과 */
    pointer-events: none; /* 클릭 이벤트 방해하지 않도록 */
}

.dashboard-card:hover {
    transform: translateY(-5px); /* 카드 살짝 떠오르는 효과 */
    box-shadow: 0 10px 30px var(--shadow-hover-light);
    border-color: rgba(255, 255, 255, 0.3); /* 테두리 살짝 강조 */
}

/* --------------------------------------------------- */
/* Mobile Responsiveness Adjustments */
/* --------------------------------------------------- */
@media (max-width: 768px) {
    .interactive-button {
        width: 100%; /* 모바일에서 버튼 너비 꽉 채우기 */
        padding: 14px 20px;
        font-size: 0.95rem;
    }

    .dashboard-card {
        padding: 15px; /* 모바일 카드 패딩 조정 */
        margin: 0 10px 15px 10px; /* 좌우 여백 추가 */
        border-radius: 15px; /* 모바일 카드 라운드니스 조정 */
    }

    /* 추가적인 모바일 특정 컴포넌트 스타일링 */
    .mobile-only-text {
        font-size: 0.85rem;
        line-height: 1.4;
    }
}

/* --------------------------------------------------- */
/* Frosted Glassmorphism Utility Class */
/* --------------------------------------------------- */
.frosted-glass {
    background: var(--glass-bg-light);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--glass-border-light);
    border-radius: 15px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}
