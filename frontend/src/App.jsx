import { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { getHealth } from './lib/api'

function HomePage() {
  return (
    <main className="container">
      <h1>Tripify Frontend</h1>
      <p>Frontend scaffold is running.</p>
      <Link to="/health">Go to health check</Link>
    </main>
  )
}

function HealthPage() {
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const handleCheckHealth = async () => {
    setStatus('loading')
    setData(null)
    setError('')

    try {
      const response = await getHealth()
      setData(response)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <main className="container">
      <h1>Health Check</h1>
      <p>
        <Link to="/">Back to home</Link>
      </p>
      <button type="button" onClick={handleCheckHealth} disabled={status === 'loading'}>
        {status === 'loading' ? 'Checking...' : 'Check health'}
      </button>
      <p>
        Status: <strong>{status}</strong>
      </p>
      <div className="response-box">
        {status === 'success' && <pre>{JSON.stringify(data, null, 2)}</pre>}
        {status === 'error' && <pre>{error}</pre>}
        {status === 'idle' && <pre>No response yet.</pre>}
      </div>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/health" element={<HealthPage />} />
    </Routes>
  )
}

export default App
