import { useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  buildAssistantPlan,
  confirmTrip,
  generateTrip,
  getAssistantPlansByTrip,
  getAssistantPlansByUser,
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
  const location = useLocation()
  const navItems = [
    { to: '/trips/generate', label: 'Trips' },
    { to: '/assistant', label: 'Planner' },
    { to: '/health', label: 'Status' },
  ]

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

          <div className="top-right-nav">
            <nav className="main-nav gooey-nav">
              <svg aria-hidden="true" width="0" height="0">
                <defs>
                  <filter id="goo">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
                    <feColorMatrix
                      in="blur"
                      mode="matrix"
                      values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
                      result="goo"
                    />
                    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                  </filter>
                </defs>
              </svg>
              {navItems.map((item) => {
                const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
                return (
                  <Link key={item.to} to={item.to} className={isActive ? 'is-active' : ''}>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="header-actions">
              <Link className="ghost-btn" to="/signup">
                Create account
              </Link>
              <Link className="solid-btn" to="/login">
                Login
              </Link>
            </div>
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

function MasonryBackground({ columnsCount = 4, className = '' }) {
  const columns = [
    [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1493244040629-496f6d136cc3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    ],
    [
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1521292270410-a8c4d716d518?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=800&q=80',
    ],
  ]

  return (
    <div className={`masonry-bg ${className}`.trim()} aria-hidden="true">
      {columns.slice(0, columnsCount).map((column, index) => (
        <div className="masonry-col" key={`col-${index}`}>
          {column.map((image, tileIndex) => (
            <img
              className={`masonry-tile tile-${(tileIndex % 4) + 1}`}
              key={`tile-${index}-${tileIndex}`}
              src={image}
              alt=""
              loading="lazy"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

const presetTrips = [
  {
    slug: 'kyoto-temple-trails',
    title: 'Kyoto Temple Trails',
    subtitle: 'Japan - 5 nights',
    price: '$1,380',
    baseBudget: 1380,
    days: 5,
    location: 'Kyoto',
    image:
      'https://images.unsplash.com/photo-1526481280695-3c4691f2f038?auto=format&fit=crop&w=1400&q=80',
    blurb: 'Tea houses, lantern districts, and a calm temple loop.',
  },
  {
    slug: 'lisbon-food-week',
    title: 'Lisbon Food Week',
    subtitle: 'Portugal - 4 nights',
    price: '$980',
    baseBudget: 980,
    days: 4,
    location: 'Lisbon',
    image:
      'https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1400&q=80',
    blurb: 'Coastal viewpoints and budget-friendly tasting routes.',
  },
  {
    slug: 'banff-alpine-escape',
    title: 'Banff Alpine Escape',
    subtitle: 'Canada - 6 nights',
    price: '$1,740',
    baseBudget: 1740,
    days: 6,
    location: 'Banff',
    image:
      'https://images.unsplash.com/photo-1601758123927-196ac4f7d7d3?auto=format&fit=crop&w=1400&q=80',
    blurb: 'Lake hikes, glacier roads, and mountain-lodge evenings.',
  },
  {
    slug: 'medellin-city-nature',
    title: 'Medellin City & Nature',
    subtitle: 'Colombia - 5 nights',
    price: '$890',
    baseBudget: 890,
    days: 5,
    location: 'Medellin',
    image:
      'https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?auto=format&fit=crop&w=1400&q=80',
    blurb: 'Cable-car city routes with day trips into green valleys.',
  },
  {
    slug: 'athens-islands-starter',
    title: 'Athens + Islands Starter',
    subtitle: 'Greece - 7 nights',
    price: '$1,560',
    baseBudget: 1560,
    days: 7,
    location: 'Athens',
    image:
      'https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1400&q=80',
    blurb: 'Historic core, ferry hops, and sunset waterfront dinners.',
  },
  {
    slug: 'marrakech-culture-sprint',
    title: 'Marrakech Culture Sprint',
    subtitle: 'Morocco - 4 nights',
    price: '$1,090',
    baseBudget: 1090,
    days: 4,
    location: 'Marrakech',
    image:
      'https://images.unsplash.com/photo-1597212618440-806262de4f6b?auto=format&fit=crop&w=1400&q=80',
    blurb: 'Riads, souks, and curated routes avoiding peak-hour crowds.',
  },
]
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
        <Link className="ghost-btn" to="/trips/generate?location=Courbevoie&budget=900&people=1&days=3&userId=1">
          Choose a room
        </Link>
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
  const [budget] = useState('1500')
  const [people] = useState('2')
  const [days] = useState('3')

  const handleSearch = (event) => {
    event.preventDefault()
    const query = new URLSearchParams({ location, budget, people, days, userId: '1' })
    navigate(`/trips/generate?${query.toString()}`)
  }

  return (
    <AppShell
      title="Plan Better Trips With Tripify"
      subtitle="Choose a destination, generate options, and build a practical itinerary in minutes."
    >
      <section className="landing-hero">
        <MasonryBackground />
        <div className="landing-content">
          <p className="landing-kicker">Smart itineraries for budget-conscious travelers</p>
          <h2>Where are you traveling next?</h2>
          <form className="landing-search" onSubmit={handleSearch}>
            <InputField
              label="Destination"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter city or country"
              required
            />
            <button type="submit" className="search-btn">
              Find trips
            </button>
          </form>
          <p className="support-text">Try: London, Tokyo, Vancouver, Mexico City, Lisbon</p>
        </div>
      </section>

      <section className="preset-trips">
        <div className="deals-head">
          <div>
            <h2>Preset Vacation Ideas</h2>
            <p>Scroll for more trip inspirations built from common student budgets.</p>
          </div>
          <Link className="ghost-btn" to="/assistant">
            Build with AI assistant
          </Link>
        </div>

        <div className="preset-grid">
          {presetTrips.map((trip) => (
            <article className="preset-card magic-bento" key={trip.title}>
              <div className="magic-bento-glow" aria-hidden="true" />
              <p className="preset-subtitle">{trip.subtitle}</p>
              <h3>{trip.title}</h3>
              <p>{trip.blurb}</p>
              <div className="preset-footer">
                <strong>{trip.price}</strong>
                <Link to={`/journeys/${trip.slug}`}>
                  Explore
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  )
}

function FadeContent({ children }) {
  return <div className="fade-content">{children}</div>
}

function AnimatedBudgetList({ options, onSelect, activeOption }) {
  return (
    <div className="animated-list">
      {options.map((option, index) => (
        <button
          key={option.id}
          type="button"
          className={`animated-list-item ${activeOption === option.id ? 'active' : ''}`}
          style={{ animationDelay: `${index * 90}ms` }}
          onClick={() => onSelect(option)}
        >
          <div>
            <strong>{option.label}</strong>
            <p>{option.description}</p>
          </div>
          <span>${option.budget.toLocaleString()}</span>
        </button>
      ))}
    </div>
  )
}

function JourneyOptionsPage() {
  const { journeySlug } = useParams()
  const trip = useMemo(() => presetTrips.find((item) => item.slug === journeySlug), [journeySlug])
  const [activeOption, setActiveOption] = useState(null)
  const tripAction = useApiAction((payload) => generateTrip(payload))

  if (!trip) {
    return <Navigate to="/" replace />
  }

  const options = [
    {
      id: 'budget-lite',
      label: 'Budget Lite',
      budget: Math.round(trip.baseBudget * 0.85),
      description: 'More hostels and public transport, high-value attractions first.',
    },
    {
      id: 'balanced',
      label: 'Balanced',
      budget: trip.baseBudget,
      description: 'Comfort stays, curated attractions, and one premium experience.',
    },
    {
      id: 'comfort-plus',
      label: 'Comfort Plus',
      budget: Math.round(trip.baseBudget * 1.2),
      description: 'Higher comfort hotels, shorter transfers, and flexible dining.',
    },
  ]

  const submitOption = async (option) => {
    setActiveOption(option.id)
    await tripAction.run({
      userId: 1,
      location: trip.location,
      budget: option.budget,
      days: trip.days,
      people: 2,
    })
  }

  return (
    <AppShell
      title={`${trip.title} Options`}
      subtitle="Choose a budget adjustment to generate a trip option from the backend."
    >
      <section className="journey-layout">
        <div className="journey-left">
          <FadeContent>
            <p className="landing-kicker">Journey Brief</p>
            <h2>Welcome back, Traveler.</h2>
            <p>
              Your {trip.location} route is ready. We prepared three budget-adjusted variants so you can choose
              the pace and cost that best matches your goals.
            </p>
            <p>
              Select an option on the right to generate a concrete trip draft. You can then confirm it or keep
              iterating.
            </p>
            <Link className="ghost-btn" to="/">
              Back to landing
            </Link>
          </FadeContent>
        </div>

        <div className="journey-right" style={{ '--journey-image': `url(${trip.image})` }}>
          <AnimatedBudgetList options={options} onSelect={submitOption} activeOption={activeOption} />
          <ApiResult status={tripAction.status} data={tripAction.data} error={tripAction.error} />
        </div>
      </section>
    </AppShell>
  )
}
function AuthPage({ mode }) {
  const isSignup = mode === 'signup'
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const authAction = useApiAction((payload) => (isSignup ? signup(payload) : login(payload)))

  const submit = async (event) => {
    event.preventDefault()
    const response = await authAction.run({ email, password })
    if (!response?.id) {
      return
    }
    if (isSignup) {
      navigate(`/onboarding/${response.id}`)
      return
    }
    navigate('/')
  }

  if (!isSignup) {
    return (
      <section className="login-page-bleed">
        <MasonryBackground columnsCount={3} className="login-masonry" />
        <div className="login-overlay" />
        <form className="form-card login-card" onSubmit={submit}>
          <h2>Welcome back, traveler.</h2>
          <p>Your next escape is closer than you think.</p>
          <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <SubmitButton status={authAction.status} loadingText="Signing in..." idleText="Login" />
          <Link className="ghost-btn create-account-cta" to="/signup">
            Create account
          </Link>
          {authAction.status === 'error' && <p className="login-error">{authAction.error}</p>}
        </form>
      </section>
    )
  }

  return (
    <section className="login-page-bleed">
      <MasonryBackground columnsCount={3} className="login-masonry" />
      <div className="login-overlay" />
      <form className="form-card login-card" onSubmit={submit}>
        <h2>Create your account.</h2>
        <p>Start planning the trip you have been picturing.</p>
        <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <InputField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <SubmitButton status={authAction.status} loadingText="Creating..." idleText="Create account" />
        <Link className="ghost-btn create-account-cta" to="/login">
          Already have an account? Sign in
        </Link>
        {authAction.status === 'error' && <p className="login-error">{authAction.error}</p>}
      </form>
    </section>
  )
}

function PreferenceTileGroup({ title, options, value, onChange, columns = 3 }) {
  return (
    <section className="pref-group">
      <p>{title}</p>
      <div className="pref-tiles" style={{ '--pref-columns': columns }}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`pref-tile ${value === option.value ? 'is-selected' : ''}`}
            onClick={() => onChange(option.value)}
          >
            <span className="pref-icon" aria-hidden="true">
              {option.icon}
            </span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function OnboardingPage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [dietaryPreference, setDietaryPreference] = useState('Vegan')
  const [personalityType, setPersonalityType] = useState('Ambivert')
  const [tripCategory, setTripCategory] = useState('Friends')
  const [lactoseIntolerant, setLactoseIntolerant] = useState(true)
  const [drinksAlcohol, setDrinksAlcohol] = useState(false)
  const [smokes, setSmokes] = useState(false)
  const saveAction = useApiAction((payload) => updatePreferences(userId, payload))

  const dietaryOptions = [
    { value: 'Vegan', label: 'Vegan', icon: 'VG' },
    { value: 'Lactose Intolerant', label: 'Lactose Intolerant', icon: 'LI' },
    { value: 'MeatLover', label: 'MeatLover', icon: 'ML' },
  ]
  const personalityOptions = [
    { value: 'Extrovert', label: 'Extrovert', icon: 'EX' },
    { value: 'Ambivert', label: 'Ambivert', icon: 'AM' },
    { value: 'Introvert', label: 'Introvert', icon: 'IN' },
  ]
  const tripOptions = [
    { value: 'Romantic', label: 'Romantic', icon: 'RO' },
    { value: 'Family', label: 'Family', icon: 'FA' },
    { value: 'Friends', label: 'Friends', icon: 'FR' },
  ]
  const yesNoOptions = [
    { value: true, label: 'Yes', icon: 'Y' },
    { value: false, label: 'No', icon: 'N' },
  ]

  const submit = async (event) => {
    event.preventDefault()
    if (step === 1) {
      setStep(2)
      return
    }

    const response = await saveAction.run({
      foodPreferences: dietaryPreference,
      allergies: lactoseIntolerant ? 'Lactose' : 'None',
      dietaryPreference,
      personalityType,
      tripCategory,
      lactoseIntolerant,
      drinksAlcohol,
      smokes,
    })
    if (response?.id) {
      navigate('/assistant')
    }
  }

  return (
    <section className="login-page-bleed">
      <MasonryBackground columnsCount={3} className="login-masonry" />
      <div className="login-overlay" />
      <form className="form-card login-card onboarding-card" onSubmit={submit}>
        <h2>Tell us about your travel style.</h2>
        <p>Step {step} of 2</p>

        {step === 1 ? (
          <>
            <PreferenceTileGroup
              title="Dietary Preferences"
              options={dietaryOptions}
              value={dietaryPreference}
              onChange={setDietaryPreference}
              columns={3}
            />
            <PreferenceTileGroup
              title="Personality"
              options={personalityOptions}
              value={personalityType}
              onChange={setPersonalityType}
              columns={3}
            />
            <PreferenceTileGroup
              title="Trip Category"
              options={tripOptions}
              value={tripCategory}
              onChange={setTripCategory}
              columns={3}
            />
            <button type="submit">Next</button>
          </>
        ) : (
          <>
            <PreferenceTileGroup
              title="Lactose Intolerant"
              options={yesNoOptions}
              value={lactoseIntolerant}
              onChange={setLactoseIntolerant}
              columns={2}
            />
            <PreferenceTileGroup
              title="Drinking"
              options={yesNoOptions}
              value={drinksAlcohol}
              onChange={setDrinksAlcohol}
              columns={2}
            />
            <PreferenceTileGroup
              title="Smoking"
              options={yesNoOptions}
              value={smokes}
              onChange={setSmokes}
              columns={2}
            />
            <div className="onboarding-actions">
              <button type="button" className="ghost-btn" onClick={() => setStep(1)}>
                Back
              </button>
              <SubmitButton status={saveAction.status} loadingText="Saving..." idleText="Finish" />
            </div>
          </>
        )}

        {saveAction.status === 'error' && <p className="login-error">{saveAction.error}</p>}
      </form>
    </section>
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
  const [tripId, setTripId] = useState('')
  const [destination, setDestination] = useState('Chicago')
  const [budget, setBudget] = useState('1500')
  const [days, setDays] = useState('3')
  const [people, setPeople] = useState('2')
  const [prompt, setPrompt] = useState('Design a value-focused plan with food and local activities.')
  const assistantAction = useApiAction((payload) => buildAssistantPlan(payload))
  const [historyStatus, setHistoryStatus] = useState('idle')
  const [historyData, setHistoryData] = useState(null)
  const [historyError, setHistoryError] = useState('')

  const numericTripId = tripId.trim() ? Number(tripId) : null

  const submit = async (event) => {
    event.preventDefault()
    const payload = {
      userId: Number(userId),
      destination,
      budget: Number(budget),
      days: Number(days),
      people: Number(people),
      prompt,
    }

    if (numericTripId) {
      payload.tripId = numericTripId
    }

    await assistantAction.run(payload)
  }

  const loadSavedByTrip = async () => {
    if (!numericTripId) {
      setHistoryStatus('error')
      setHistoryError('Enter a trip ID before loading saved plans by trip.')
      setHistoryData(null)
      return
    }

    setHistoryStatus('loading')
    setHistoryError('')
    setHistoryData(null)

    try {
      const response = await getAssistantPlansByTrip(numericTripId)
      setHistoryData(response)
      setHistoryStatus('success')
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Unknown error')
      setHistoryStatus('error')
    }
  }

  const loadSavedByUser = async () => {
    setHistoryStatus('loading')
    setHistoryError('')
    setHistoryData(null)

    try {
      const response = await getAssistantPlansByUser(Number(userId))
      setHistoryData(response)
      setHistoryStatus('success')
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Unknown error')
      setHistoryStatus('error')
    }
  }

  return (
    <AppShell
      title="AI itinerary assistant"
      subtitle="POST /api/assistant/plan plus GET /api/assistant/trips/{tripId} and /api/assistant/users/{userId}"
    >
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
              label="Trip ID (optional)"
              type="number"
              min="1"
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
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
          <p className="support-text">
            The destination you enter here drives the AI recommendation. Use a trip ID only to save the plan against an
            existing trip.
          </p>
          <label>
            Prompt
            <textarea rows="4" value={prompt} onChange={(e) => setPrompt(e.target.value)} required />
          </label>
          <SubmitButton status={assistantAction.status} loadingText="Building..." idleText="Build plan" />
        </form>

        <div className="form-grid">
          <ApiResult status={assistantAction.status} data={assistantAction.data} error={assistantAction.error} />
          <section className="form-card">
            <p className="support-text">Load the assistant plans already saved for this trip or user.</p>
            <div className="actions-row">
              <button type="button" onClick={loadSavedByTrip} disabled={historyStatus === 'loading'}>
                {historyStatus === 'loading' ? 'Loading...' : 'Load saved by trip'}
              </button>
              <button type="button" onClick={loadSavedByUser} disabled={historyStatus === 'loading'}>
                {historyStatus === 'loading' ? 'Loading...' : 'Load saved by user'}
              </button>
            </div>
            <ApiResult status={historyStatus} data={historyData} error={historyError} />
          </section>
        </div>
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
      <Route path="/onboarding/:userId" element={<OnboardingPage />} />
      <Route path="/users/:userId" element={<UserProfilePage />} />
      <Route path="/preferences/:userId" element={<PreferencesPage />} />
      <Route path="/trips/generate" element={<TripGeneratePage />} />
      <Route path="/trips/:tripId" element={<TripDetailPage />} />
      <Route path="/assistant" element={<AssistantPage />} />
      <Route path="/journeys/:journeySlug" element={<JourneyOptionsPage />} />
      <Route path="/health" element={<HealthPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App



