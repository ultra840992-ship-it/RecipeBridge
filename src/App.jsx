// filepath: src/App.jsx
import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Bitz 실시간 대시보드</h1>
        <p>
          Vite + React 기반 UI 퍼블리싱 완료.
        </p>
        <button onClick={() => setCount((c) => c + 1)}>
          클릭 카운트: {count}
        </button>
        <p>
          군더더기 없는 클린 코드로 시작.
        </p>
      </header>
    </div>
  );
}

export default App;
