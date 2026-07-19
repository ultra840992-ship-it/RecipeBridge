// filepath: dashboard-ui/src/App.jsx
import React from 'react';
import './App.css'; // App.css는 기본 생성되지만, index.css에 통합할 예정

function App() {
  const handleLaunch = () => {
    alert('대시보드 런처를 가동합니다.');
    // 여기 API 연동 로직 추가 예정
  };

  const handleShutdown = () => {
    alert('대시보드 런처를 종료합니다.');
    // 여기 API 연동 로직 추가 예정
  };

  return (
    <div className="container">
      <h1 className="title">Bitz Realtime Dashboard Launcher</h1>
      <p className="description">원클릭으로 실시간 대시보드를 가동하고 종료합니다.</p>
      <div className="button-group">
        <button className="button primary" onClick={handleLaunch}>
          ⚡ 대시보드 가동
        </button>
        <button className="button secondary" onClick={handleShutdown}>
          ⛔ 대시보드 종료
        </button>
      </div>
      <footer className="footer">
        <p>&copy; 2024 Bitz Solutions. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
