import { useState } from 'react'
import { Link, Route, Routes, useParams } from 'react-router-dom'
import {
  buildAssistantPlan,
  confirmTrip,
  generateTrip,
  getHealth,
  getTrip,
  getUser,
  login,
  signup,
  updatePreferences,
} from './lib/api'

function PageShell({ title, subtitle, children }) {
  return (
    <main className="page-shell">
      <section className="panel">
        <header className="panel-header">
          <span className="eyebrow">Tripify</span>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </header>
        <nav className="top-nav">
          <Link to="/">Home</Link>
          <Link to="/signup">Signup</Link>
          <Link to="/login">Login</Link>
          <Link to="/trips/generate">Plan Trip</Link>
          <Link to="/assistant">AI Planner</Link>
          <Link to="/health">Health</Link>
        </nav>
        {children}
      </section>
    </main>
  )
}

function ResultBox({ status, data, error }) {
  return (
    <div className="response-box">
      {status === 'success' && <pre>{JSON.stringify(data, null, 2)}</pre>}
      {status === 'error' && <pre>{error}</pre>}
      {(status === 'idle' || status === 'loading') && <pre>No response yet.</pre>}
    </div>
  )
}

function HomePage() {
  return (
    <PageShell
      title="Frontend Contract Flow"
      subtitle="Build against controller routes now while backend upgrades internals behind stable endpoints."
    >
      <div className="grid">
        <article className="tile">
          <h2>1. Auth</h2>
          <p>Signup and login workflows wired to `/api/auth` routes.</p>
          <Link className="tile-link" to="/signup">
            Open signup
          </Link>
        </article>
        <article className="tile">
          <h2>2. User Profile</h2>
          <p>Load user details from `/api/users/{'{userId}'}`.</p>
          <Link className="tile-link" to="/users/1">
            Open sample profile
          </Link>
        </article>
        <article className="tile">
          <h2>3. Preferences</h2>
          <p>Submit preferences updates to `/api/users/{'{userId}'}/preferences`.</p>
          <Link className="tile-link" to="/preferences/1">
            Open sample preferences
          </Link>
        </article>
        <article className="tile">
          <h2>4. Trips</h2>
          <p>Generate, fetch, and confirm trip flows using `/api/trips` routes.</p>
          <Link className="tile-link" to="/trips/generate">
            Open trip planner
          </Link>
        </article>
        <article className="tile">
          <h2>5. AI Planner</h2>
          <p>Send planning requests to `/api/assistant/plan` through the Java backend.</p>
          <Link className="tile-link" to="/assistant">
            Open AI planner
          </Link>
        </article>
      </div>
    </PageShell>
  )
}

function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setError('')
    setData(null)

    try {
      const response = await signup({ email, password })
      setData(response)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <PageShell title="Create Account" subtitle="POST /api/auth/signup">
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />

        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create a password"
          required
        />

        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Submitting...' : 'Sign up'}
        </button>
      </form>
      <ResultBox status={status} data={data} error={error} />
    </PageShell>
  )
}

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setError('')
    setData(null)

    try {
      const response = await login({ email, password })
      setData(response)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <PageShell title="Welcome Back" subtitle="POST /api/auth/login">
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          required
        />

        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Submitting...' : 'Sign in'}
        </button>
      </form>
      <ResultBox status={status} data={data} error={error} />
    </PageShell>
  )
}

function UserProfilePage() {
  const { userId } = useParams()
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const handleFetchUser = async () => {
    setStatus('loading')
    setError('')
    setData(null)

    try {
      const response = await getUser(userId)
      setData(response)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <PageShell title="User Profile" subtitle={`GET /api/users/${userId}`}>
      <div className="stack-row">
        <button type="button" onClick={handleFetchUser} disabled={status === 'loading'}>
          {status === 'loading' ? 'Loading...' : 'Fetch user'}
        </button>
        <Link className="tile-link" to={`/preferences/${userId}`}>
          Edit preferences for this user
        </Link>
      </div>
      <ResultBox status={status} data={data} error={error} />
    </PageShell>
  )
}

function PreferencesPage() {
  const { userId } = useParams()
  const [foodPreferences, setFoodPreferences] = useState('Vegetarian-friendly')
  const [allergies, setAllergies] = useState('Nuts')
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setError('')
    setData(null)

    try {
      const response = await updatePreferences(userId, {
        foodPreferences,
        allergies,
      })
      setData(response)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <PageShell title="Preferences" subtitle={`PUT /api/users/${userId}/preferences`}>
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="pref-food">Food preferences</label>
        <input
          id="pref-food"
          type="text"
          value={foodPreferences}
          onChange={(event) => setFoodPreferences(event.target.value)}
          required
        />

        <label htmlFor="pref-allergies">Allergies</label>
        <input
          id="pref-allergies"
          type="text"
          value={allergies}
          onChange={(event) => setAllergies(event.target.value)}
          required
        />

        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Saving...' : 'Save preferences'}
        </button>
      </form>
      <ResultBox status={status} data={data} error={error} />
    </PageShell>
  )
}

function TripGeneratePage() {
  const [userId, setUserId] = useState('1')
  const [location, setLocation] = useState('Tokyo')
  const [startDate, setStartDate] = useState('2026-03-20')
  const [endDate, setEndDate] = useState('2026-03-27')
  const [budget, setBudget] = useState('1200')
  const [people, setPeople] = useState('2')
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setError('')
    setData(null)

    const start = new Date(startDate)
    const end = new Date(endDate)
    const daySpan = Math.max(
      1,
      Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())
        ? 1
        : Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    )

    try {
      const response = await generateTrip({
        userId: Number(userId),
        location,
        budget: Number(budget),
        days: daySpan,
        people: Number(people),
      })
      setData(response)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <PageShell title="Trip Planner" subtitle="POST /api/trips/generate">
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="trip-user">User ID</label>
        <input
          id="trip-user"
          type="number"
          min="1"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          required
        />

        <label htmlFor="trip-destination">Destination</label>
        <input
          id="trip-destination"
          type="text"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          required
        />

        <label htmlFor="trip-start">Start date</label>
        <input
          id="trip-start"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          required
        />

        <label htmlFor="trip-end">End date</label>
        <input
          id="trip-end"
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          required
        />

        <label htmlFor="trip-budget">Budget</label>
        <input
          id="trip-budget"
          type="number"
          min="0"
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
          required
        />

        <label htmlFor="trip-people">People</label>
        <input
          id="trip-people"
          type="number"
          min="1"
          value={people}
          onChange={(event) => setPeople(event.target.value)}
          required
        />

        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Generating...' : 'Generate trip'}
        </button>
      </form>
      <p className="hint-text">
        The backend stores `location`, `budget`, `days`, and `people`. Dates are used here only to derive
        the trip length for the demo.
      </p>
      <ResultBox status={status} data={data} error={error} />
      <p className="hint-text">If backend returns a trip id, open `/trips/{'{tripId}'}` to fetch and confirm.</p>
    </PageShell>
  )
}

function AssistantPage() {
  const [userId, setUserId] = useState('1')
  const [destination, setDestination] = useState('Chicago')
  const [budget, setBudget] = useState('1500')
  const [days, setDays] = useState('3')
  const [people, setPeople] = useState('2')
  const [prompt, setPrompt] = useState('Plan a budget-friendly food and culture trip.')
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setError('')
    setData(null)

    try {
      const response = await buildAssistantPlan({
        userId: Number(userId),
        destination,
        budget: Number(budget),
        days: Number(days),
        people: Number(people),
        prompt,
      })
      setData(response)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <PageShell title="AI Planner" subtitle="POST /api/assistant/plan">
      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="assistant-user">User ID</label>
        <input
          id="assistant-user"
          type="number"
          min="1"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          required
        />

        <label htmlFor="assistant-destination">Destination</label>
        <input
          id="assistant-destination"
          type="text"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          required
        />

        <label htmlFor="assistant-budget">Budget</label>
        <input
          id="assistant-budget"
          type="number"
          min="0"
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
          required
        />

        <label htmlFor="assistant-days">Days</label>
        <input
          id="assistant-days"
          type="number"
          min="1"
          value={days}
          onChange={(event) => setDays(event.target.value)}
          required
        />

        <label htmlFor="assistant-people">People</label>
        <input
          id="assistant-people"
          type="number"
          min="1"
          value={people}
          onChange={(event) => setPeople(event.target.value)}
          required
        />

        <label htmlFor="assistant-prompt">Prompt</label>
        <textarea
          id="assistant-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows="4"
          required
        />

        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Planning...' : 'Build plan'}
        </button>
      </form>
      <ResultBox status={status} data={data} error={error} />
    </PageShell>
  )
}

function TripDetailPage() {
  const { tripId } = useParams()
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [confirmStatus, setConfirmStatus] = useState('idle')
  const [confirmData, setConfirmData] = useState(null)
  const [confirmError, setConfirmError] = useState('')

  const handleFetchTrip = async () => {
    setStatus('loading')
    setError('')
    setData(null)

    try {
      const response = await getTrip(tripId)
      setData(response)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  const handleConfirmTrip = async () => {
    setConfirmStatus('loading')
    setConfirmError('')
    setConfirmData(null)

    try {
      const response = await confirmTrip(tripId, { confirmedBy: 1 })
      setConfirmData(response)
      setConfirmStatus('success')
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Unknown error')
      setConfirmStatus('error')
    }
  }

  return (
    <PageShell title="Trip Detail" subtitle={`GET /api/trips/${tripId} + POST /api/trips/confirm/${tripId}`}>
      <div className="stack-row">
        <button type="button" onClick={handleFetchTrip} disabled={status === 'loading'}>
          {status === 'loading' ? 'Loading...' : 'Fetch trip'}
        </button>
        <button type="button" onClick={handleConfirmTrip} disabled={confirmStatus === 'loading'}>
          {confirmStatus === 'loading' ? 'Confirming...' : 'Confirm trip'}
        </button>
      </div>

      <h3>Trip response</h3>
      <ResultBox status={status} data={data} error={error} />

      <h3>Confirm response</h3>
      <ResultBox status={confirmStatus} data={confirmData} error={confirmError} />
    </PageShell>
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
    <PageShell title="API Health" subtitle="GET /health">
      <div className="health-row">
        <button type="button" onClick={handleCheckHealth} disabled={status === 'loading'}>
          {status === 'loading' ? 'Checking...' : 'Check health'}
        </button>
        <span className={`status-pill status-${status}`}>Status: {status}</span>
      </div>
      <ResultBox status={status} data={data} error={error} />
    </PageShell>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/users/:userId" element={<UserProfilePage />} />
      <Route path="/preferences/:userId" element={<PreferencesPage />} />
      <Route path="/trips/generate" element={<TripGeneratePage />} />
      <Route path="/trips/:tripId" element={<TripDetailPage />} />
      <Route path="/assistant" element={<AssistantPage />} />
      <Route path="/health" element={<HealthPage />} />
    </Routes>
  )
}

export default App
