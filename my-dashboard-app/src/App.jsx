// filepath: my-dashboard-app/src/App.jsx
import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="card">
        <h1>Bitz Dashboard UI</h1>
        <p>
          Vite + React 기반 레포지토리 구성 완료.
        </p>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          핵심만 담은 클린 코드. 더 이상 군더더기는 없다.
        </p>
      </div>
    </>
  )
}

export default App
