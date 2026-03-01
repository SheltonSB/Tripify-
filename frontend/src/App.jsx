import { createContext, useContext, useEffect, useMemo, useState } from 'react'
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

const AUTH_STORAGE_KEY = 'tripify.currentUser'
const AuthContext = createContext({
  currentUser: null,
  setCurrentUser: () => {},
})

function useAuth() {
  return useContext(AuthContext)
}

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

function formatDistance(distanceMeters) {
  if (typeof distanceMeters !== 'number' || Number.isNaN(distanceMeters)) {
    return 'Unknown'
  }
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`
  }
  return `${(distanceMeters / 1000).toFixed(1)}km`
}

function isSyntheticRecommendationSet(recommendations) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return false
  }
  return recommendations.every((item) => (item?.provider || '').toLowerCase().includes('synthetic'))
}

function AppShell({ title, subtitle, children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, setCurrentUser } = useAuth()
  const navItems = [
    { to: '/trips/generate', label: 'Trips' },
    { to: '/assistant', label: 'Planner' },
    { to: '/health', label: 'Status' },
  ]

  const handleLogout = () => {
    setCurrentUser(null)
    navigate('/login')
  }

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

            {currentUser ? (
              <div className="header-actions">
                <span className="user-chip">{currentUser.email}</span>
                <button type="button" className="ghost-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <div className="header-actions">
                <Link className="ghost-btn" to="/signup">
                  Create account
                </Link>
                <Link className="solid-btn" to="/login">
                  Login
                </Link>
              </div>
            )}
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

function IridescenceBackground() {
  return (
    <div className="iridescence-bg" aria-hidden="true">
      <span className="iridescence-layer iridescence-layer-1" />
      <span className="iridescence-layer iridescence-layer-2" />
      <span className="iridescence-layer iridescence-layer-3" />
      <span className="iridescence-grain" />
    </div>
  )
}

function LandingIntroPage() {
  const navigate = useNavigate()

  return (
    <section className="intro-landing-page">
      <IridescenceBackground />
      <div className="intro-landing-overlay" />
      <div className="intro-landing-content">
        <p className="landing-kicker">Tripify</p>
        <h1>Your journey starts here.</h1>
        <p>Discover smarter travel options tailored to your budget, vibe, and preferences.</p>
        <button type="button" className="solid-btn" onClick={() => navigate('/explore')}>
          Get Started
        </button>
      </div>
    </section>
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

function AssistantStepList({ steps }) {
  return (
    <div className="animated-list assistant-step-list">
      {steps.map((step, index) => (
        <article className="animated-list-item assistant-step-item" key={`${step.dayNumber}-${step.title}-${index}`}>
          <div>
            <strong>
              Day {step.dayNumber}: {step.title}
            </strong>
            <p>{step.description}</p>
          </div>
        </article>
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
  const { setCurrentUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const authAction = useApiAction((payload) => (isSignup ? signup(payload) : login(payload)))

  const submit = async (event) => {
    event.preventDefault()
    const response = await authAction.run({ email, password })
    if (!response?.id) {
      return
    }
    setCurrentUser(response)
    if (isSignup) {
      navigate(`/onboarding/${response.id}`)
      return
    }
    navigate('/assistant')
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
  const { setCurrentUser } = useAuth()
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
      setCurrentUser(response)
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
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [intent, setIntent] = useState(() => ({
    userId: currentUser?.id ? String(currentUser.id) : '1',
    tripId: '',
    destination: 'Chicago',
    budget: '1500',
    days: '3',
    people: '2',
    origin: 'Current location',
    vibe: 'balanced',
    latitude: '',
    longitude: '',
    dietaryPreference: 'Not specified',
    personalityType: 'Not specified',
    tripCategory: 'Not specified',
    lactoseIntolerant: '',
    drinksAlcohol: '',
    smokes: '',
    prompt: 'Design a value-focused plan with food and local activities.',
  }))
  const [locationError, setLocationError] = useState('')
  const assistantAction = useApiAction((payload) => buildAssistantPlan(payload))
  const [historyStatus, setHistoryStatus] = useState('idle')
  const [historyData, setHistoryData] = useState(null)
  const [historyError, setHistoryError] = useState('')
  const profileAction = useApiAction((id) => getUser(id))
  const latestPlan = assistantAction.status === 'success' ? assistantAction.data : null
  const recommendationProviders = Array.isArray(latestPlan?.recommendations)
    ? latestPlan.recommendations.map((item) => (item?.provider || '').toLowerCase())
    : []
  const usingSyntheticRecommendations = recommendationProviders.some((provider) => provider.includes('synthetic'))

  const setIntentField = (field, value) => {
    setIntent((prev) => ({ ...prev, [field]: value }))
  }

  const numericTripId = intent.tripId.trim() ? Number(intent.tripId) : null
  const numericUserId = Number(intent.userId)

  const inferVibeFromProfile = (profile) => {
    const trip = (profile?.tripCategory || '').toLowerCase()
    if (trip.includes('romantic')) return 'romantic'
    if (trip.includes('family')) return 'family'
    if (trip.includes('friends')) return 'social'

    const personality = (profile?.personalityType || '').toLowerCase()
    if (personality.includes('extrovert')) return 'nightlife'
    if (personality.includes('introvert')) return 'relaxed'

    const food = `${profile?.dietaryPreference || ''} ${profile?.foodPreferences || ''}`.toLowerCase()
    if (food.includes('vegan') || food.includes('food')) return 'foodie'
    return 'balanced'
  }

  useEffect(() => {
    if (currentUser?.id) {
      setIntent((prev) => ({ ...prev, userId: String(currentUser.id) }))
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      return
    }
    profileAction.run(numericUserId)
  }, [numericUserId])

  useEffect(() => {
    const profile = profileAction.data
    if (!profile) {
      return
    }
    setIntent((prev) => ({
      ...prev,
      dietaryPreference: profile.dietaryPreference || profile.foodPreferences || 'Not specified',
      personalityType: profile.personalityType || 'Not specified',
      tripCategory: profile.tripCategory || 'Not specified',
      lactoseIntolerant: profile.lactoseIntolerant == null ? '' : profile.lactoseIntolerant ? 'yes' : 'no',
      drinksAlcohol: profile.drinksAlcohol == null ? '' : profile.drinksAlcohol ? 'yes' : 'no',
      smokes: profile.smokes == null ? '' : profile.smokes ? 'yes' : 'no',
      vibe: inferVibeFromProfile(profile),
    }))
  }, [profileAction.data])

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported in this browser.')
      return
    }
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIntent((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }))
      },
      (error) => {
        setLocationError(error.message || 'Could not read current location.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const buildPromptWithIntent = () => {
    const yesNo = (value) => (value === 'yes' ? 'Yes' : value === 'no' ? 'No' : 'Not specified')
    const lines = [
      intent.prompt,
      '',
      'Intent preferences:',
      `- Dietary preference: ${intent.dietaryPreference || 'Not specified'}`,
      `- Personality: ${intent.personalityType || 'Not specified'}`,
      `- Trip category: ${intent.tripCategory || 'Not specified'}`,
      `- Lactose intolerant: ${yesNo(intent.lactoseIntolerant)}`,
      `- Drinks alcohol: ${yesNo(intent.drinksAlcohol)}`,
      `- Smokes: ${yesNo(intent.smokes)}`,
      `- Vibe: ${intent.vibe || 'balanced'}`,
    ]
    return lines.join('\n')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      return
    }
    if (!intent.destination.trim()) {
      return
    }

    const payload = {
      userId: numericUserId,
      destination: intent.destination.trim(),
      budget: Number(intent.budget),
      days: Number(intent.days),
      people: Number(intent.people),
      prompt: buildPromptWithIntent(),
      vibe: intent.vibe,
      origin: intent.origin.trim() || 'Current location',
    }

    if (numericTripId) {
      payload.tripId = numericTripId
    }
    if (intent.latitude.trim()) {
      const parsedLatitude = Number(intent.latitude)
      if (Number.isFinite(parsedLatitude)) {
        payload.latitude = parsedLatitude
      }
    }
    if (intent.longitude.trim()) {
      const parsedLongitude = Number(intent.longitude)
      if (Number.isFinite(parsedLongitude)) {
        payload.longitude = parsedLongitude
      }
    }

    const response = await assistantAction.run(payload)
    if (response && (Array.isArray(response.steps) || response.summary)) {
      navigate('/plans/ready', { state: { plan: response } })
    }
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
      const response = await getAssistantPlansByUser(Number(intent.userId))
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
      <section className="form-grid">
        <form className="form-card" onSubmit={submit}>
          <div className="form-grid form-grid-2">
            <InputField
              label="User ID"
              type="number"
              min="1"
              value={intent.userId}
              onChange={(e) => setIntentField('userId', e.target.value)}
              readOnly={Boolean(currentUser?.id)}
              required
            />
            <InputField
              label="Trip ID (optional)"
              type="number"
              min="1"
              value={intent.tripId}
              onChange={(e) => setIntentField('tripId', e.target.value)}
            />
            <InputField
              label="Destination"
              value={intent.destination}
              onChange={(e) => setIntentField('destination', e.target.value)}
              required
            />
            <FormField label="Vibe">
              <select value={intent.vibe} onChange={(e) => setIntentField('vibe', e.target.value)}>
                <option value="balanced">Balanced</option>
                <option value="foodie">Foodie</option>
                <option value="nightlife">Nightlife</option>
                <option value="relaxed">Relaxed</option>
                <option value="romantic">Romantic</option>
                <option value="family">Family</option>
                <option value="social">Social</option>
              </select>
            </FormField>
            <InputField
              label="Budget"
              type="number"
              min="0"
              value={intent.budget}
              onChange={(e) => setIntentField('budget', e.target.value)}
              required
            />
            <InputField
              label="Nights"
              type="number"
              min="1"
              value={intent.days}
              onChange={(e) => setIntentField('days', e.target.value)}
              required
            />
            <InputField
              label="Travelers"
              type="number"
              min="1"
              value={intent.people}
              onChange={(e) => setIntentField('people', e.target.value)}
              required
            />
            <InputField
              label="Origin"
              value={intent.origin}
              onChange={(e) => setIntentField('origin', e.target.value)}
              placeholder="Current location or city"
            />
            <div className="form-grid assistant-location-field">
              <button type="button" className="ghost-btn" onClick={useCurrentLocation}>
                Use my current location
              </button>
              {locationError ? <p className="login-error">{locationError}</p> : null}
            </div>
            <InputField
              label="Latitude (optional)"
              value={intent.latitude}
              onChange={(e) => setIntentField('latitude', e.target.value)}
            />
            <InputField
              label="Longitude (optional)"
              value={intent.longitude}
              onChange={(e) => setIntentField('longitude', e.target.value)}
            />
            <FormField label="Dietary preference">
              <select value={intent.dietaryPreference} onChange={(e) => setIntentField('dietaryPreference', e.target.value)}>
                <option value="Not specified">Not specified</option>
                <option value="Vegan">Vegan</option>
                <option value="Lactose Intolerant">Lactose Intolerant</option>
                <option value="MeatLover">MeatLover</option>
              </select>
            </FormField>
            <FormField label="Personality">
              <select value={intent.personalityType} onChange={(e) => setIntentField('personalityType', e.target.value)}>
                <option value="Not specified">Not specified</option>
                <option value="Extrovert">Extrovert</option>
                <option value="Ambivert">Ambivert</option>
                <option value="Introvert">Introvert</option>
              </select>
            </FormField>
            <FormField label="Trip category">
              <select value={intent.tripCategory} onChange={(e) => setIntentField('tripCategory', e.target.value)}>
                <option value="Not specified">Not specified</option>
                <option value="Romantic">Romantic</option>
                <option value="Family">Family</option>
                <option value="Friends">Friends</option>
              </select>
            </FormField>
            <FormField label="Lactose intolerant">
              <select value={intent.lactoseIntolerant} onChange={(e) => setIntentField('lactoseIntolerant', e.target.value)}>
                <option value="">Not specified</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </FormField>
            <FormField label="Drinks alcohol">
              <select value={intent.drinksAlcohol} onChange={(e) => setIntentField('drinksAlcohol', e.target.value)}>
                <option value="">Not specified</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </FormField>
            <FormField label="Smokes">
              <select value={intent.smokes} onChange={(e) => setIntentField('smokes', e.target.value)}>
                <option value="">Not specified</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </FormField>
          </div>
          <p className="support-text">
            We preload onboarding preferences from your profile and let you override them per request.
          </p>
          {currentUser?.id ? <p className="support-text">Using logged-in account: {currentUser.email}</p> : null}
          <label>
            Prompt
            <textarea rows="4" value={intent.prompt} onChange={(e) => setIntentField('prompt', e.target.value)} required />
          </label>
          <SubmitButton status={assistantAction.status} loadingText="Building..." idleText="Build plan" />
          {assistantAction.status === 'error' ? (
            <p className="form-notice form-notice-error">
              {assistantAction.error}
            </p>
          ) : null}
        </form>

        {latestPlan?.steps?.length ? (
          <section className="journey-layout assistant-journey-layout">
            <div className="journey-left">
              <FadeContent>
                <p className="landing-kicker">Plan Brief</p>
                <h2>Welcome, Traveler.</h2>
                <p>{latestPlan.summary}</p>
                {usingSyntheticRecommendations ? (
                  <p className="form-notice form-notice-warning">
                    Running in demo data mode for recommendations while live places providers are unavailable.
                  </p>
                ) : null}
                {latestPlan.steps[0]?.description ? (
                  <p>
                    Featured stop: <strong>{latestPlan.steps[0].description}</strong>
                  </p>
                ) : null}
              </FadeContent>
            </div>

            <div
              className="journey-right assistant-journey-right"
              style={{
                '--journey-image':
                  "url('https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?auto=format&fit=crop&w=1400&q=80')",
              }}
            >
              <AssistantStepList steps={latestPlan.steps} />
            </div>
          </section>
        ) : (
          <ApiResult status={assistantAction.status} data={assistantAction.data} error={assistantAction.error} />
        )}

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
      </section>
    </AppShell>
  )
}

function TravelPlanReadyPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const plan = location.state?.plan
  const recommendations = Array.isArray(plan?.recommendations) ? plan.recommendations : []
  const usingSyntheticRecommendations = isSyntheticRecommendationSet(recommendations)
  const steps = Array.isArray(plan?.steps) ? plan.steps : []
  const fixedCost = typeof plan?.fixedCost === 'number' ? plan.fixedCost : null
  const remainingBudget = typeof plan?.remainingBudget === 'number' ? plan.remainingBudget : null

  useEffect(() => {
    if (!plan) {
      navigate('/assistant', { replace: true })
    }
  }, [plan, navigate])

  if (!plan) {
    return null
  }

  return (
    <div className="plan-ready-page">
      <section className="plan-hero">
        <div className="dark-veil-bg" aria-hidden="true" />
        <div className="plan-hero-content">
          <p className="landing-kicker">Welcome, Traveler</p>
          <h1>Your Travel Plan is Ready</h1>
          <p>{plan.summary}</p>
          <button type="button" className="ghost-btn" onClick={() => navigate('/assistant')}>
            Adjust this plan
          </button>
        </div>
      </section>

      <section className="plan-days-section">
        <h2>{plan.destination} - Day by Day</h2>
        {usingSyntheticRecommendations ? (
          <p className="form-notice form-notice-warning">
            Recommendations are currently in demo mode. Live providers are unavailable, so Tripify is using destination-aware fallback data.
          </p>
        ) : null}
        <div className="budget-summary">
          <article className="spotlight-card budget-card">
            <p className="spotlight-day">Fixed Costs</p>
            <h3>{fixedCost == null ? 'N/A' : `$${fixedCost.toFixed(0)}`}</h3>
            <p>Flights and lodging estimates used by the planner.</p>
          </article>
          <article className="spotlight-card budget-card">
            <p className="spotlight-day">Remaining Budget</p>
            <h3>{remainingBudget == null ? 'N/A' : `$${remainingBudget.toFixed(0)}`}</h3>
            <p>Estimated budget left for activities, food, and local transport.</p>
          </article>
        </div>

        {recommendations.length ? (
          <>
            <h2>Top Recommendations Near You</h2>
            <div className="spotlight-grid">
              {recommendations.map((item, index) => (
                <article className="spotlight-card" key={`${item.name}-${index}`}>
                  <p className="spotlight-day">{item.category}</p>
                  <h3>{item.name}</h3>
                  <p>
                    Cost: <strong>${Number(item.estimatedCost || 0).toFixed(0)}</strong>
                  </p>
                  <p>
                    Distance: <strong>{formatDistance(item.distanceMeters)}</strong>
                  </p>
                  <p>{item.reason}</p>
                </article>
              ))}
            </div>
          </>
        ) : (
          <article className="spotlight-card spotlight-card-empty">
            <p className="spotlight-day">Recommendations</p>
            <h3>No ranked places available yet</h3>
            <p>Try adjusting destination, vibe, or enabling location access to get nearby recommendations.</p>
          </article>
        )}

        <h2>Suggested Day Plan</h2>
        <div className="spotlight-grid">
          {steps.map((step, index) => (
            <article className="spotlight-card" key={`${step.dayNumber}-${step.title}-${index}`}>
              <p className="spotlight-day">Day {step.dayNumber}</p>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
          {steps.length === 0 ? (
            <article className="spotlight-card spotlight-card-empty">
              <p className="spotlight-day">Day Plan</p>
              <h3>No generated itinerary steps</h3>
              <p>Go back to the assistant and regenerate once AI provider connectivity is restored.</p>
            </article>
          ) : null}
        </div>
      </section>
    </div>
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
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch (_error) {
      return null
    }
  })

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser))
      return
    }
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [currentUser])

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser }}>
      <Routes>
        <Route path="/" element={<LandingIntroPage />} />
        <Route path="/explore" element={<HomePage />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/onboarding/:userId" element={<OnboardingPage />} />
        <Route path="/users/:userId" element={<UserProfilePage />} />
        <Route path="/preferences/:userId" element={<PreferencesPage />} />
        <Route path="/trips/generate" element={<TripGeneratePage />} />
        <Route path="/trips/:tripId" element={<TripDetailPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/plans/ready" element={<TravelPlanReadyPage />} />
        <Route path="/journeys/:journeySlug" element={<JourneyOptionsPage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  )
}

export default App
