import { useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
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

function useApiAction(action) {
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const run = async (...args) => {
    setStatus('loading')
    setData(null)
    setError('')

    try {
      const response = await action(...args)
      setData(response)
      setStatus('success')
      return response
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
      return null
    }
  }

  return { status, data, error, run }
}

function AppShell({ title, subtitle, children }) {
  return (
    <div className="app-root">
      <header className="global-top">
        <p>Member prices available now. Build your trip and save more.</p>
      </header>

      <div className="page-wrap">
        <header className="main-header">
          <Link to="/" className="brand">
            <span className="brand-badge">T</span>
            <div>
              <strong>Tripify</strong>
              <small>Travel made simple</small>
            </div>
          </Link>

          <nav className="main-nav">
            <Link to="/trips/generate">Stays</Link>
            <Link to="/assistant">Packages</Link>
            <Link to="/health">Health</Link>
          </nav>

          <div className="header-actions">
            <Link className="ghost-btn" to="/signup">
              Create account
            </Link>
            <Link className="solid-btn" to="/login">
              Sign in
            </Link>
          </div>
        </header>

        <main className="surface">
          <section className="page-heading">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </section>
          {children}
        </main>
      </div>
    </div>
  )
}

function ApiResult({ status, data, error }) {
  const message =
    status === 'success'
      ? JSON.stringify(data, null, 2)
      : status === 'error'
        ? error
        : status === 'loading'
          ? 'Request in progress...'
          : 'Run an action to see API output.'

  return (
    <section className="result-card">
      <div className="result-head">
        <span className={`status-pill status-${status}`}>{status}</span>
      </div>
      <pre>{message}</pre>
    </section>
  )
}

function FormField({ label, children }) {
  return (
    <label>
      {label}
      {children}
    </label>
  )
}

function InputField({ label, ...props }) {
  return (
    <FormField label={label}>
      <input {...props} />
    </FormField>
  )
}

function SubmitButton({ status, idleText, loadingText }) {
  return (
    <button type="submit" disabled={status === 'loading'}>
      {status === 'loading' ? loadingText : idleText}
    </button>
  )
}

function DestinationCard({ city, note }) {
  return (
    <article className="destination-card">
      <h4>{city}</h4>
      <p>{note}</p>
    </article>
  )
}

function ResumeStayCard() {
  return (
    <article className="resume-stay-card">
      <img
        src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
        alt="Stay room"
      />
      <div className="resume-stay-body">
        <h3>37 Lodge La Defense Courbevoie</h3>
        <p>Courbevoie</p>
        <p>Sat, Mar 14 - Tue, Mar 17</p>
        <p>1 traveler, 1 room</p>
        <p className="rating-line">
          <span>8.2</span> Very good (253 reviews)
        </p>
        <button type="button" className="ghost-btn">
          Choose a room
        </button>
      </div>
    </article>
  )
}

function ContinueSearchCard() {
  return (
    <article className="resume-search-card">
      <div className="search-icon">⌕</div>
      <p>Continue your search for stays in Courbevoie</p>
    </article>
  )
}

function DealCard({ title, detail, image }) {
  return (
    <article className="deal-card">
      <img src={image} alt={title} />
      <div className="deal-overlay">
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
    </article>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const [location, setLocation] = useState('Chicago')
  const [budget, setBudget] = useState('1500')
  const [people, setPeople] = useState('2')
  const [days, setDays] = useState('3')

  const handleSearch = (event) => {
    event.preventDefault()
    const query = new URLSearchParams({ location, budget, people, days, userId: '1' })
    navigate(`/trips/generate?${query.toString()}`)
  }

  return (
    <AppShell
      title="Explore, save, and book with confidence"
      subtitle="Live frontend connected to your auth, profile, trip, assistant, and health backend routes."
    >
      <section className="resume-panel">
        <h2>Here&apos;s where you left off</h2>
        <div className="resume-grid">
          <ResumeStayCard />
          <ContinueSearchCard />
        </div>
      </section>

      <section className="hero-card">
        <div className="hero-media">
          <span>Find your perfect stay and build your trip in minutes</span>
        </div>
        <form className="search-module" onSubmit={handleSearch}>
          <div className="trip-tabs">
            <button type="button" className="tab-active">
              Stays
            </button>
            <button type="button">Flights</button>
            <button type="button">Packages</button>
          </div>

          <div className="form-grid form-grid-2">
            <InputField label="Destination" value={location} onChange={(e) => setLocation(e.target.value)} required />
            <InputField
              label="Budget (USD)"
              type="number"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
            <InputField
              label="Travelers"
              type="number"
              min="1"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              required
            />
            <InputField label="Nights" type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} required />
          </div>

          <button type="submit" className="search-btn">
            Search trips
          </button>
        </form>
      </section>

      <section className="cards-row">
        <article className="promo-card card-one">
          <h3>Plan with AI Assistant</h3>
          <p>Get a structured itinerary draft and compare your options before confirming.</p>
          <Link to="/assistant">Open assistant</Link>
        </article>
        <article className="promo-card card-two">
          <h3>Manage travel profile</h3>
          <p>Load user profile and update dietary preferences for better recommendations.</p>
          <div className="inline-links">
            <Link to="/users/1">User profile</Link>
            <Link to="/preferences/1">Preferences</Link>
          </div>
        </article>
        <article className="promo-card card-three">
          <h3>Book-ready workflow</h3>
          <p>Generate a trip, review details, then confirm via the existing backend contract.</p>
          <div className="inline-links">
            <Link to="/trips/generate">Generate</Link>
            <Link to="/trips/1">Trip detail</Link>
          </div>
        </article>
      </section>

      <section className="deals-section">
        <div className="deals-head">
          <div>
            <h2>Members save up to 40% on select stays</h2>
            <p>Showing deals for Mar 20 - Mar 22</p>
          </div>
          <button type="button" className="ghost-btn">
            See more deals
          </button>
        </div>

        <div className="deals-grid">
          <DealCard
            title="Arlo SoHo"
            detail="VIP Access · New York"
            image="https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80"
          />
          <DealCard
            title="Midtown Skyline"
            detail="Manhattan views"
            image="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=80"
          />
          <DealCard
            title="Modern Dining Hotel"
            detail="City center"
            image="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80"
          />
          <DealCard
            title="Sonesta Suites"
            detail="Great value"
            image="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80"
          />
        </div>
      </section>

      <section className="destination-strip">
        <h2>Popular this week</h2>
        <div className="destination-grid">
          <DestinationCard city="Barcelona" note="Tapas, beaches, and budget stays" />
          <DestinationCard city="Tokyo" note="Efficient travel with local food tours" />
          <DestinationCard city="New York" note="City breaks with value itinerary packs" />
          <DestinationCard city="Mexico City" note="Culture-heavy weekends and street food" />
        </div>
      </section>
    </AppShell>
  )
}

function AuthPage({ mode }) {
  const isSignup = mode === 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const authAction = useApiAction((payload) => (isSignup ? signup(payload) : login(payload)))

  const submit = async (event) => {
    event.preventDefault()
    await authAction.run({ email, password })
  }

  return (
    <AppShell
      title={isSignup ? 'Create your account' : 'Sign in'}
      subtitle={isSignup ? 'POST /api/auth/signup' : 'POST /api/auth/login'}
    >
      <section className="two-col">
        <form className="form-card" onSubmit={submit}>
          <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <SubmitButton
            status={authAction.status}
            loadingText="Submitting..."
            idleText={isSignup ? 'Create account' : 'Sign in'}
          />
          <p className="support-text">
            {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
            <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Sign in' : 'Create one'}</Link>
          </p>
        </form>

        <ApiResult status={authAction.status} data={authAction.data} error={authAction.error} />
      </section>
    </AppShell>
  )
}

function UserProfilePage() {
  const { userId } = useParams()
  const profileAction = useApiAction(() => getUser(userId))

  return (
    <AppShell title="Traveler profile" subtitle={`GET /api/users/${userId}`}>
      <section className="two-col">
        <div className="form-card">
          <p className="support-text">Load profile data and continue to preferences update flow.</p>
          <div className="actions-row">
            <button type="button" onClick={() => profileAction.run()} disabled={profileAction.status === 'loading'}>
              {profileAction.status === 'loading' ? 'Loading...' : 'Load profile'}
            </button>
            <Link to={`/preferences/${userId}`} className="ghost-btn">
              Edit preferences
            </Link>
          </div>
        </div>
        <ApiResult status={profileAction.status} data={profileAction.data} error={profileAction.error} />
      </section>
    </AppShell>
  )
}

function PreferencesPage() {
  const { userId } = useParams()
  const [foodPreferences, setFoodPreferences] = useState('Vegetarian-friendly')
  const [allergies, setAllergies] = useState('Nuts')
  const preferencesAction = useApiAction((payload) => updatePreferences(userId, payload))

  const savePreferences = async (event) => {
    event.preventDefault()
    await preferencesAction.run({ foodPreferences, allergies })
  }

  return (
    <AppShell title="Preferences" subtitle={`PUT /api/users/${userId}/preferences`}>
      <section className="two-col">
        <form className="form-card" onSubmit={savePreferences}>
          <InputField
            label="Food preferences"
            value={foodPreferences}
            onChange={(e) => setFoodPreferences(e.target.value)}
            required
          />
          <InputField label="Allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} required />
          <SubmitButton status={preferencesAction.status} loadingText="Saving..." idleText="Save preferences" />
        </form>

        <ApiResult
          status={preferencesAction.status}
          data={preferencesAction.data}
          error={preferencesAction.error}
        />
      </section>
    </AppShell>
  )
}

function TripGeneratePage() {
  const [searchParams] = useSearchParams()
  const [userId, setUserId] = useState(searchParams.get('userId') || '1')
  const [location, setLocation] = useState(searchParams.get('location') || 'Tokyo')
  const [budget, setBudget] = useState(searchParams.get('budget') || '1200')
  const [days, setDays] = useState(searchParams.get('days') || '4')
  const [people, setPeople] = useState(searchParams.get('people') || '2')
  const tripGenerateAction = useApiAction((payload) => generateTrip(payload))

  const generate = async (event) => {
    event.preventDefault()
    await tripGenerateAction.run({
      userId: Number(userId),
      location,
      budget: Number(budget),
      days: Number(days),
      people: Number(people),
    })
  }

  return (
    <AppShell title="Trip planner" subtitle="POST /api/trips/generate">
      <section className="two-col">
        <form className="form-card" onSubmit={generate}>
          <div className="form-grid form-grid-2">
            <InputField
              label="User ID"
              type="number"
              min="1"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
            <InputField label="Destination" value={location} onChange={(e) => setLocation(e.target.value)} required />
            <InputField
              label="Budget"
              type="number"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
            <InputField
              label="Travelers"
              type="number"
              min="1"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              required
            />
            <InputField label="Nights" type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} required />
          </div>
          <SubmitButton status={tripGenerateAction.status} loadingText="Generating..." idleText="Generate options" />
          <p className="support-text">After generation, open `/trips/&#123;tripId&#125;` to fetch and confirm.</p>
        </form>

        <ApiResult
          status={tripGenerateAction.status}
          data={tripGenerateAction.data}
          error={tripGenerateAction.error}
        />
      </section>
    </AppShell>
  )
}

function TripDetailPage() {
  const { tripId } = useParams()
  const fetchTripAction = useApiAction(() => getTrip(tripId))
  const confirmTripAction = useApiAction(() => confirmTrip(tripId))

  return (
    <AppShell title="Trip detail" subtitle={`GET /api/trips/${tripId} and POST /api/trips/confirm/${tripId}`}>
      <div className="actions-row">
        <button type="button" onClick={() => fetchTripAction.run()} disabled={fetchTripAction.status === 'loading'}>
          {fetchTripAction.status === 'loading' ? 'Loading...' : 'Fetch trip'}
        </button>
        <button type="button" onClick={() => confirmTripAction.run()} disabled={confirmTripAction.status === 'loading'}>
          {confirmTripAction.status === 'loading' ? 'Confirming...' : 'Confirm trip'}
        </button>
      </div>

      <section className="dual-grid">
        <ApiResult status={fetchTripAction.status} data={fetchTripAction.data} error={fetchTripAction.error} />
        <ApiResult status={confirmTripAction.status} data={confirmTripAction.data} error={confirmTripAction.error} />
      </section>
    </AppShell>
  )
}

function AssistantPage() {
  const [userId, setUserId] = useState('1')
  const [destination, setDestination] = useState('Chicago')
  const [budget, setBudget] = useState('1500')
  const [days, setDays] = useState('3')
  const [people, setPeople] = useState('2')
  const [prompt, setPrompt] = useState('Design a value-focused plan with food and local activities.')
  const assistantAction = useApiAction((payload) => buildAssistantPlan(payload))

  const submit = async (event) => {
    event.preventDefault()
    await assistantAction.run({
      userId: Number(userId),
      destination,
      budget: Number(budget),
      days: Number(days),
      people: Number(people),
      prompt,
    })
  }

  return (
    <AppShell title="AI itinerary assistant" subtitle="POST /api/assistant/plan">
      <section className="two-col">
        <form className="form-card" onSubmit={submit}>
          <div className="form-grid form-grid-2">
            <InputField
              label="User ID"
              type="number"
              min="1"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
            <InputField
              label="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
            <InputField
              label="Budget"
              type="number"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
            <InputField label="Nights" type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} required />
            <InputField
              label="Travelers"
              type="number"
              min="1"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              required
            />
          </div>
          <label>
            Prompt
            <textarea rows="4" value={prompt} onChange={(e) => setPrompt(e.target.value)} required />
          </label>
          <SubmitButton status={assistantAction.status} loadingText="Building..." idleText="Build plan" />
        </form>

        <ApiResult status={assistantAction.status} data={assistantAction.data} error={assistantAction.error} />
      </section>
    </AppShell>
  )
}

function HealthPage() {
  const healthAction = useApiAction(() => getHealth())

  return (
    <AppShell title="Backend health" subtitle="GET /health">
      <div className="actions-row">
        <button type="button" onClick={() => healthAction.run()} disabled={healthAction.status === 'loading'}>
          {healthAction.status === 'loading' ? 'Checking...' : 'Check health'}
        </button>
      </div>
      <ApiResult status={healthAction.status} data={healthAction.data} error={healthAction.error} />
    </AppShell>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/users/:userId" element={<UserProfilePage />} />
      <Route path="/preferences/:userId" element={<PreferencesPage />} />
      <Route path="/trips/generate" element={<TripGeneratePage />} />
      <Route path="/trips/:tripId" element={<TripDetailPage />} />
      <Route path="/assistant" element={<AssistantPage />} />
      <Route path="/health" element={<HealthPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
