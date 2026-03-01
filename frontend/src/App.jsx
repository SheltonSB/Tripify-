import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  chatWithAssistant,
  confirmTrip,
  generateTrip,
  getDestinationPhotos,
  getHealth,
  getLiveEvents,
  getLiveRecommendations,
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

function TravelQuoteList({ quotes }) {
  if (!Array.isArray(quotes) || !quotes.length) {
    return null
  }

  return (
    <div className="spotlight-grid">
      {quotes.map((quote, index) => (
        <article className="spotlight-card" key={`${quote.provider}-${quote.category}-${quote.label}-${index}`}>
          <p className="spotlight-day">{quote.category}</p>
          <h3>{quote.label || 'Live quote'}</h3>
          <p>
            <strong>
              {quote.currency || 'USD'} {Number(quote.amount || 0).toFixed(0)}
            </strong>
          </p>
          <p>Source: {quote.provider}</p>
        </article>
      ))}
    </div>
  )
}

function TripGenerationResult({ status, data, error }) {
  if (status === 'error') {
    return <ApiResult status={status} data={data} error={error} />
  }

  if (status === 'loading') {
    return (
      <section className="result-card">
        <div className="result-head">
          <span className="status-pill status-loading">loading</span>
        </div>
        <p>Generating your trip shell...</p>
      </section>
    )
  }

  if (status !== 'success' || !data) {
    return (
      <section className="result-card">
        <div className="result-head">
          <span className="status-pill status-idle">idle</span>
        </div>
        <p>Generate a trip to create the trip record that the live planner will use.</p>
      </section>
    )
  }

  return (
    <section className="result-card">
      <div className="result-head">
        <span className="status-pill status-success">success</span>
      </div>
      <h3>{data.location}</h3>
      <p>Trip ID: {data.id}</p>
      <p>Budget: ${Number(data.budget || 0).toFixed(0)}</p>
      <p>
        {data.days} nights • {data.people} traveler{data.people === 1 ? '' : 's'}
      </p>
      <p>{data.confirmed ? 'Confirmed' : 'Ready for planning'}</p>
      <div className="actions-row">
        <Link className="ghost-btn" to={`/assistant`}>
          Open AI planner
        </Link>
        <Link className="ghost-btn" to={`/trips/${data.id}`}>
          View trip detail
        </Link>
      </div>
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
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [searchLocation, setSearchLocation] = useState('')
  const [activeDestination, setActiveDestination] = useState('')
  const [budget] = useState('1500')
  const [people] = useState('2')
  const [days] = useState('3')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [locationError, setLocationError] = useState('')
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [dietaryPreference, setDietaryPreference] = useState('Vegan')
  const [personalityType, setPersonalityType] = useState('Ambivert')
  const [tripCategory, setTripCategory] = useState('Friends')
  const profileAction = useApiAction((userId) => getUser(userId))
  const preferencesAction = useApiAction((payload) => updatePreferences(currentUser.id, payload))
  const photosAction = useApiAction((destination) => getDestinationPhotos(destination))
  const eventsAction = useApiAction((destination, eventOptions = {}) => getLiveEvents(destination, eventOptions))
  const recommendationsAction = useApiAction((destination, latitudeOverride, longitudeOverride) =>
    getLiveRecommendations({
      destination,
      budget: Number(budget),
      days: Number(days),
      people: Number(people),
      userId: currentUser?.id ?? '',
      latitude: latitudeOverride ?? latitude,
      longitude: longitudeOverride ?? longitude,
    }),
  )

  const refreshDiscovery = (destination = activeDestination, latitudeOverride = latitude, longitudeOverride = longitude) => {
    const resolvedDestination = (destination || '').trim()
    if (!resolvedDestination) {
      return
    }

    setActiveDestination(resolvedDestination)
    setSelectedPlace(null)
    recommendationsAction.run(resolvedDestination, latitudeOverride, longitudeOverride)
    photosAction.run(resolvedDestination)
    eventsAction.run(resolvedDestination)
  }

  const jumpToSection = (sectionId) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const buildAppleMapsUrl = (placeName) => {
    const query = [placeName, activeDestination].filter(Boolean).join(', ')
    return `https://maps.apple.com/?q=${encodeURIComponent(query)}`
  }

  const buildAssistantAreaUrl = (place) => {
    const params = new URLSearchParams({
      destination: activeDestination,
      prompt: `Tell me more about ${place.name} in ${activeDestination} and help me plan around this area.`,
    })

    if (place.latitude != null) {
      params.set('latitude', String(place.latitude))
    }
    if (place.longitude != null) {
      params.set('longitude', String(place.longitude))
    }
    if (place.name) {
      params.set('areaName', place.name)
    }

    return `/assistant?${params.toString()}`
  }

  const selectPlaceArea = (place) => {
    setSelectedPlace(place)
    eventsAction.run(activeDestination, {
      area: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      radiusMiles: 15,
    })
    jumpToSection('home-live-events')
  }

  const useCurrentArea = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported in this browser.')
      return
    }

    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = position.coords.latitude.toFixed(6)
        const nextLongitude = position.coords.longitude.toFixed(6)
        setLatitude(nextLatitude)
        setLongitude(nextLongitude)
        refreshDiscovery(activeDestination, nextLatitude, nextLongitude)
      },
      (error) => {
        setLocationError(error.message || 'Could not read current location.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const profileNeedsSetup = (profile) =>
    !profile
    || !profile.dietaryPreference
    || !profile.personalityType
    || !profile.tripCategory
    || profile.dietaryPreference === 'Not specified'
    || profile.personalityType === 'Not specified'
    || profile.tripCategory === 'Not specified'

  const needsPreferenceSetup = Boolean(currentUser?.id) && (profileAction.status !== 'success' || profileNeedsSetup(profileAction.data))

  useEffect(() => {
    if (currentUser?.id) {
      profileAction.run(currentUser.id)
    }
  }, [currentUser?.id])

  useEffect(() => {
    const profile = profileAction.data
    if (!profile) {
      return
    }

    setDietaryPreference(profile.dietaryPreference || profile.foodPreferences || 'Vegan')
    setPersonalityType(profile.personalityType || 'Ambivert')
    setTripCategory(profile.tripCategory || 'Friends')

    if (!profileNeedsSetup(profile) && activeDestination) {
      refreshDiscovery(activeDestination)
    }
  }, [profileAction.data])

  const handleSearch = (event) => {
    event.preventDefault()
    if (needsPreferenceSetup) {
      const nextDestination = (searchLocation || '').trim()
      if (nextDestination) {
        setActiveDestination(nextDestination)
      }
      return
    }
    refreshDiscovery(searchLocation)
  }

  const savePreferenceGate = async (event) => {
    event.preventDefault()
    const response = await preferencesAction.run({
      foodPreferences: dietaryPreference,
      allergies: profileAction.data?.allergies || 'None',
      dietaryPreference,
      personalityType,
      tripCategory,
      lactoseIntolerant: profileAction.data?.lactoseIntolerant ?? false,
      drinksAlcohol: profileAction.data?.drinksAlcohol ?? false,
      smokes: profileAction.data?.smokes ?? false,
    })

    if (response?.id) {
      await profileAction.run(response.id)
      refreshDiscovery(activeDestination)
    }
  }

  const openTripPlanner = () => {
    const targetLocation = (activeDestination || searchLocation || '').trim()
    if (!targetLocation) {
      return
    }
    const query = new URLSearchParams({
      location: targetLocation,
      budget,
      people,
      days,
      userId: String(currentUser?.id || 1),
    })
    navigate(`/trips/generate?${query.toString()}`)
  }

  return (
    <AppShell
      title="Plan Better Trips With Tripify"
      subtitle="Search a destination, explore live places nearby, and use the AI guide only when you need help."
    >
      <section className="landing-hero">
        <MasonryBackground />
        <div className="landing-content">
          <p className="landing-kicker">Live discovery for smarter travelers</p>
          <h2>Start with a blank search, then build around a real place.</h2>
          <p className="landing-intro">
            Tripify ranks live activities, nearby areas, and ticketed events from provider data. Search a destination
            first, then let the AI guide explain what is worth doing there.
          </p>
          <form className="landing-search" onSubmit={handleSearch}>
            <InputField
              label="Destination"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Search any city, area, island, or country"
              required
            />
            <button type="submit" className="search-btn">
              Show live results
            </button>
          </form>
          <div className="landing-annotation-grid">
            <article className="landing-annotation">
              <span className="annotation-pill">1</span>
              <strong>Search first</strong>
              <p>Nothing loads until you choose where you actually want to go.</p>
            </article>
            <article className="landing-annotation">
              <span className="annotation-pill">2</span>
              <strong>Pick an area</strong>
              <p>Choose a nearby place, then Tripify narrows events and recommendations around that area.</p>
            </article>
            <article className="landing-annotation">
              <span className="annotation-pill">3</span>
              <strong>Ask the AI guide</strong>
              <p>The AI explains tradeoffs and answers questions about the area you selected.</p>
            </article>
          </div>
          <div className="actions-row">
            <p className="support-text">Try: Hawaii, London, Tokyo, Vancouver, Mexico City, Lisbon</p>
            <button type="button" className="ghost-btn" onClick={openTripPlanner}>
              Open trip planner
            </button>
            <Link className="ai-guide-btn" to="/assistant">
              AI Travel Guide
            </Link>
          </div>
        </div>
      </section>

      {currentUser?.id && needsPreferenceSetup ? (
        <section className="two-col">
          <form className="form-card" onSubmit={savePreferenceGate}>
            <h2>Tell us your travel style first</h2>
            <p className="support-text">
              Tripify uses your preferences before it ranks live activities, so your recommendations match what you actually like.
            </p>
            <div className="field">
              <label htmlFor="home-dietary">Dietary preference</label>
              <select id="home-dietary" value={dietaryPreference} onChange={(e) => setDietaryPreference(e.target.value)}>
                <option value="Vegan">Vegan</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="No restrictions">No restrictions</option>
                <option value="Lactose Intolerant">Lactose Intolerant</option>
                <option value="MeatLover">MeatLover</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="home-personality">Personality</label>
              <select id="home-personality" value={personalityType} onChange={(e) => setPersonalityType(e.target.value)}>
                <option value="Extrovert">Extrovert</option>
                <option value="Ambivert">Ambivert</option>
                <option value="Introvert">Introvert</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="home-trip-category">Trip category</label>
              <select id="home-trip-category" value={tripCategory} onChange={(e) => setTripCategory(e.target.value)}>
                <option value="Romantic">Romantic</option>
                <option value="Family">Family</option>
                <option value="Friends">Friends</option>
                <option value="Solo">Solo</option>
              </select>
            </div>
            <SubmitButton
              status={preferencesAction.status}
              loadingText="Saving preferences..."
              idleText="Save preferences and personalize"
            />
          </form>
          <div className="form-card">
            <h2>Why this matters</h2>
            <p className="support-text">
              Travelers should not all get the same activity list. Once you save this, Tripify will bias the live ranking to your
              travel style before it shows you places to go.
            </p>
          </div>
        </section>
      ) : null}

      <section className="preset-trips" id="home-nearby-places">
        <div className="deals-head">
          <div>
            <h2>{activeDestination ? `${activeDestination} Live Activities Nearby (Estimated Spend)` : 'Live Activities Nearby'}</h2>
            <p>
              {activeDestination
                ? 'Live activities are ranked in real time from provider data, live pricing, weather, and your budget.'
                : 'Search a destination first to load live activities, nearby places, and pricing.'}
            </p>
          </div>
          <div className="actions-row">
            <button type="button" className="ghost-btn" onClick={() => activeDestination && refreshDiscovery(activeDestination)} disabled={!activeDestination}>
              Refresh live data
            </button>
            <button type="button" className="ghost-btn" onClick={useCurrentArea}>
              Use my area for nearest places
            </button>
            <Link className="ghost-btn" to="/assistant">
              Open AI guide
            </Link>
          </div>
        </div>
        {locationError ? <p className="support-text">{locationError}</p> : null}
        {latitude && longitude ? (
          <p className="support-text">
            Ranking nearby places from your current area ({latitude}, {longitude}).
          </p>
        ) : (
          <p className="support-text">Use your area to unlock closest-place distance ranking.</p>
        )}

        {photosAction.status === 'success' && Array.isArray(photosAction.data?.photoUrls) && photosAction.data.photoUrls.length ? (
          <div className="preset-grid" style={{ marginBottom: '1rem' }}>
            {photosAction.data.photoUrls.slice(0, 4).map((url, index) => (
              <article
                className="preset-card magic-bento"
                key={`${url}-${index}`}
                style={{ padding: '0.4rem', textAlign: 'left' }}
              >
                <img
                  src={url}
                  alt={`${activeDestination} preview ${index + 1}`}
                  style={{ width: '100%', height: '190px', objectFit: 'cover', borderRadius: '16px' }}
                />
                <div style={{ padding: '0.55rem 0.35rem 0.1rem' }}>
                  <p className="preset-subtitle">{activeDestination}</p>
                  <strong>Explore {activeDestination}</strong>
                  <div className="actions-row" style={{ marginTop: '0.55rem' }}>
                    <button type="button" className="ghost-btn" onClick={() => jumpToSection('home-nearby-places')}>
                      See live activities
                    </button>
                    <button type="button" className="ghost-btn" onClick={openTripPlanner}>
                      Plan this trip
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <div className="preset-grid">
          {!activeDestination && recommendationsAction.status === 'idle' ? (
            <article className="preset-card magic-bento landing-empty-card">
              <div className="magic-bento-glow" aria-hidden="true" />
              <p className="preset-subtitle">Welcome</p>
              <h3>Search to unlock live places</h3>
              <p>
                Start with any destination above. Once you search, Tripify will pull live nearby activities and rank
                them around your budget and preferences.
              </p>
            </article>
          ) : recommendationsAction.status === 'loading' ? (
            <article className="preset-card magic-bento">
              <div className="magic-bento-glow" aria-hidden="true" />
              <p className="preset-subtitle">{activeDestination}</p>
              <h3>Loading live activities...</h3>
              <p>Ranking nearby activities against your budget and current live provider data.</p>
            </article>
          ) : recommendationsAction.status === 'success' && recommendationsAction.data?.places?.length ? (
            recommendationsAction.data.places.map((place) => (
              <article className="preset-card magic-bento" key={`${place.name}-${place.provider}`}>
                <div className="magic-bento-glow" aria-hidden="true" />
                <p className="preset-subtitle">{activeDestination}</p>
                <h3>{place.name}</h3>
                <p className="preset-subtitle">
                  {place.category}
                  {place.distanceMeters ? ` • ${(place.distanceMeters / 1000).toFixed(1)} km away` : ''}
                </p>
                <p>{place.note}</p>
                <p className="support-text" style={{ margin: 0 }}>
                  Live place data from {place.provider}. Spend shown here is an estimate based on provider metadata.
                </p>
                <div className="preset-footer">
                  <strong>~${Number(place.estimatedCost || 0).toFixed(0)}</strong>
                  <div className="actions-row">
                    <button type="button" className="ghost-btn" onClick={() => selectPlaceArea(place)}>
                      See nearby events
                    </button>
                    <a href={buildAppleMapsUrl(place.name)} target="_blank" rel="noreferrer">
                      Open in Maps
                    </a>
                    <Link to={buildAssistantAreaUrl(place)}>
                      Ask AI about this area
                    </Link>
                    <Link
                      to={`/trips/generate?location=${encodeURIComponent(activeDestination)}&budget=${budget}&days=${days}&people=${people}&userId=${encodeURIComponent(String(currentUser?.id || 1))}`}
                    >
                      Plan around this
                    </Link>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="preset-card magic-bento">
              <div className="magic-bento-glow" aria-hidden="true" />
              <p className="preset-subtitle">{activeDestination || 'No destination selected'}</p>
              <h3>{activeDestination ? 'No live activities yet' : 'Search to begin'}</h3>
              <p>
                {activeDestination
                  ? 'Check your provider keys, then refresh. This section only shows provider-backed activities.'
                  : 'Use the search box above. The landing page now starts blank on purpose instead of preloading a fixed city.'}
              </p>
            </article>
          )}
        </div>
        {recommendationsAction.status === 'success' && recommendationsAction.data ? (
          <>
            <p className="support-text">
              {Array.isArray(recommendationsAction.data.priceQuotes) && recommendationsAction.data.priceQuotes.length
              ? `Live travel + hotel cost: $${Number(recommendationsAction.data.fixedCost || 0).toFixed(0)}. Remaining budget: $${Number(recommendationsAction.data.remainingBudget || 0).toFixed(0)}.`
              : 'Live travel + hotel pricing is still loading or unavailable for this destination right now.'}
              {recommendationsAction.data.weather?.summary
                ? ` Current weather: ${recommendationsAction.data.weather.summary}.`
                : ''}
              {' '}Nearby activity prices are estimated spend from live provider metadata, not hardcoded values.
            </p>
            {Array.isArray(recommendationsAction.data.priceQuotes) && recommendationsAction.data.priceQuotes.length ? (
              <>
                <h2>Live Travel Pricing</h2>
                <TravelQuoteList quotes={recommendationsAction.data.priceQuotes} />
              </>
            ) : null}
          </>
        ) : null}
        {recommendationsAction.status === 'error' ? (
          <p className="support-text">{recommendationsAction.error}</p>
        ) : null}
      </section>

      <section className="preset-trips" id="home-live-events">
        <div className="deals-head">
          <div>
            <h2>
              {selectedPlace?.name ? `${selectedPlace.name} Nearby Live Events` : activeDestination ? `${activeDestination} Live Ticketed Events` : 'Live Ticketed Events'}
            </h2>
            <p>
              {selectedPlace?.name
                ? `Showing live events near the selected area so you do not get results that are hours away.`
                : activeDestination
                  ? 'Select an activity first to narrow events to that specific area.'
                  : 'Search a destination first, then pick an activity to filter events around a real area.'}
            </p>
          </div>
          <div className="actions-row">
            <button type="button" className="ghost-btn" onClick={() => jumpToSection('home-nearby-places')}>
              Back to nearby places
            </button>
            {selectedPlace ? (
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setSelectedPlace(null)
                  eventsAction.run(activeDestination)
                }}
              >
                Show destination-wide events
              </button>
            ) : null}
          </div>
        </div>

        <div className="preset-grid">
          {!activeDestination && eventsAction.status === 'idle' ? (
            <article className="preset-card magic-bento landing-empty-card">
              <div className="magic-bento-glow" aria-hidden="true" />
              <p className="preset-subtitle">Events wait for a place</p>
              <h3>Choose a destination, then an area</h3>
              <p>Tripify only shows events after you search a destination, and it works best once you select a nearby place first.</p>
            </article>
          ) : eventsAction.status === 'loading' ? (
            <article className="preset-card magic-bento">
              <div className="magic-bento-glow" aria-hidden="true" />
              <p className="preset-subtitle">{activeDestination}</p>
              <h3>Loading live events...</h3>
              <p>Checking Ticketmaster for ticketed events near this destination.</p>
            </article>
          ) : eventsAction.status === 'success' && Array.isArray(eventsAction.data) && eventsAction.data.length ? (
            eventsAction.data.map((eventItem) => (
              <article className="preset-card magic-bento" key={eventItem.id || eventItem.name}>
                {eventItem.imageUrl ? (
                  <img
                    src={eventItem.imageUrl}
                    alt={eventItem.name}
                    style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '16px', marginBottom: '0.75rem' }}
                  />
                ) : null}
                <p className="preset-subtitle">{eventItem.venueName || eventItem.city || activeDestination}</p>
                <h3>{eventItem.name}</h3>
                <p>{eventItem.startDateTime || 'Date TBD'}</p>
                {eventItem.distanceMeters != null ? (
                  <p>{(eventItem.distanceMeters / 1609.34).toFixed(1)} miles from the selected area</p>
                ) : selectedPlace ? (
                  <p>Inside the selected area radius</p>
                ) : null}
                <div className="preset-footer">
                  <strong>
                    {eventItem.minPrice ? `From ${eventItem.minPrice} ${eventItem.currency || ''}` : 'Price TBD'}
                  </strong>
                  {eventItem.ticketUrl ? (
                    <a href={eventItem.ticketUrl} target="_blank" rel="noreferrer">
                      Tickets
                    </a>
                  ) : (
                    <span />
                  )}
                </div>
              </article>
            ))
          ) : (
            <article className="preset-card magic-bento">
              <div className="magic-bento-glow" aria-hidden="true" />
              <p className="preset-subtitle">{activeDestination}</p>
              <h3>No live ticketed events</h3>
              <p>Either no Ticketmaster events were found or the Ticketmaster API is not configured yet.</p>
            </article>
          )}
        </div>
        {eventsAction.status === 'error' ? <p className="support-text">{eventsAction.error}</p> : null}
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
  const presetJourneys = [
    {
      slug: 'kyoto-temple-trails',
      title: 'Kyoto Temple Trails',
      subtitle: 'Japan - 5 nights',
      baseBudget: 1380,
      days: 5,
      location: 'Kyoto',
      image:
        'https://images.unsplash.com/photo-1526481280695-3c4691f2f038?auto=format&fit=crop&w=1400&q=80',
    },
    {
      slug: 'lisbon-food-week',
      title: 'Lisbon Food Week',
      subtitle: 'Portugal - 4 nights',
      baseBudget: 980,
      days: 4,
      location: 'Lisbon',
      image:
        'https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=1400&q=80',
    },
    {
      slug: 'banff-alpine-escape',
      title: 'Banff Alpine Escape',
      subtitle: 'Canada - 6 nights',
      baseBudget: 1740,
      days: 6,
      location: 'Banff',
      image:
        'https://images.unsplash.com/photo-1601758123927-196ac4f7d7d3?auto=format&fit=crop&w=1400&q=80',
    },
  ]
  const trip = useMemo(() => presetJourneys.find((item) => item.slug === journeySlug), [journeySlug])
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

        <TripGenerationResult
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
  const [searchParams] = useSearchParams()
  const [intent, setIntent] = useState(() => ({
    userId: currentUser?.id ? String(currentUser.id) : '1',
    destination: searchParams.get('destination') || '',
    budget: '1500',
    vibe: searchParams.get('vibe') || 'balanced',
    latitude: searchParams.get('latitude') || '',
    longitude: searchParams.get('longitude') || '',
    areaName: searchParams.get('areaName') || '',
    dietaryPreference: 'Not specified',
    personalityType: 'Not specified',
    tripCategory: 'Not specified',
    lactoseIntolerant: '',
    drinksAlcohol: '',
    smokes: '',
  }))
  const [locationError, setLocationError] = useState('')
  const chatAction = useApiAction((payload) => chatWithAssistant(payload))
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const profileAction = useApiAction((id) => getUser(id))

  const setIntentField = (field, value) => {
    setIntent((prev) => ({ ...prev, [field]: value }))
  }

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

  useEffect(() => {
    const areaLabel = intent.areaName || intent.destination
    if (!areaLabel) {
      return
    }

    setChatMessages([
      {
        role: 'assistant',
        text: `Ask me anything about ${areaLabel}. I can explain what is nearby, what fits your budget, and which stop is worth prioritizing first.`,
      },
    ])
    setChatInput('')
  }, [intent.areaName, intent.destination])

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

  const submitChat = async (event) => {
    event.preventDefault()
    const message = chatInput.trim()
    if (!message) {
      return
    }

    const outgoingMessage = { role: 'user', text: message }
    setChatMessages((prev) => [...prev, outgoingMessage])
    setChatInput('')

    const payload = {
      destination: intent.destination,
      message,
      vibe: intent.vibe,
    }

    if (Number.isFinite(numericUserId) && numericUserId > 0) {
      payload.userId = numericUserId
    }
    if (intent.areaName.trim()) {
      payload.areaName = intent.areaName.trim()
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

    const response = await chatAction.run(payload)
    if (response?.reply) {
      setChatMessages((prev) => [...prev, { role: 'assistant', text: response.reply }])
      return
    }

    setChatMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: 'I could not answer that right now. Try again in a moment or ask a more specific question about this area.',
      },
    ])
  }

  return (
    <AppShell
      title="AI travel guide"
      subtitle="Ask about the exact area you selected. This page is now a focused live chat helper."
    >
      <section className="form-grid">
        <section className="form-card assistant-chat-shell">
          <div className="assistant-chat-hero">
            <div>
              <p className="landing-kicker">Live AI guide</p>
              <h2>{intent.areaName || intent.destination || 'Ask about any destination'}</h2>
              <p className="support-text">
                {intent.areaName
                  ? `Focused on ${intent.areaName} inside ${intent.destination || 'your selected destination'}.`
                  : intent.destination
                    ? `Ask about ${intent.destination}, nearby options, budget tradeoffs, and where to start.`
                    : 'Open this from a place card to carry area context in automatically, or type a destination below.'}
              </p>
            </div>
            <div className="actions-row">
              <button type="button" className="ghost-btn" onClick={useCurrentLocation}>
                Use my current location
              </button>
            </div>
          </div>
          <div className="form-grid form-grid-2">
            {!currentUser?.id ? (
              <InputField
                label="User ID"
                type="number"
                min="1"
                value={intent.userId}
                onChange={(e) => setIntentField('userId', e.target.value)}
                required
              />
            ) : null}
            <InputField
              label="Destination"
              value={intent.destination}
              onChange={(e) => setIntentField('destination', e.target.value)}
              placeholder="Ask about a city, area, or destination"
              required
            />
            <InputField
              label="Focus area"
              value={intent.areaName}
              onChange={(e) => setIntentField('areaName', e.target.value)}
              placeholder="Neighborhood or selected area"
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
          </div>
          {locationError ? <p className="login-error">{locationError}</p> : null}
          {currentUser?.id ? <p className="support-text">Using logged-in account: {currentUser.email}</p> : null}
        </section>

        <section className="form-card assistant-chat-shell">
          <p className="support-text">
            Ask direct questions about {intent.areaName || intent.destination}. The assistant will answer in normal
            language instead of returning a fixed JSON plan.
          </p>
          <div
            style={{
              display: 'grid',
              gap: '0.75rem',
              maxHeight: '340px',
              overflowY: 'auto',
              padding: '0.25rem',
            }}
          >
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={{
                  justifySelf: message.role === 'user' ? 'end' : 'start',
                  maxWidth: '92%',
                  padding: '0.8rem 0.95rem',
                  borderRadius: '16px',
                  background:
                    message.role === 'user' ? 'rgba(12, 74, 110, 0.92)' : 'rgba(248, 250, 252, 0.94)',
                  color: message.role === 'user' ? '#f8fafc' : '#0f172a',
                  border:
                    message.role === 'user'
                      ? '1px solid rgba(186, 230, 253, 0.2)'
                      : '1px solid rgba(15, 23, 42, 0.08)',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {message.text}
              </div>
            ))}
            {chatAction.status === 'loading' ? <p className="support-text">AI is replying...</p> : null}
          </div>
          <form onSubmit={submitChat} style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
            <label>
              Ask about this area
              <textarea
                rows="3"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder={
                  intent.areaName
                    ? `Ask about ${intent.areaName}, nearby options, timing, or budget tradeoffs`
                    : `Ask about ${intent.destination}, nearby options, timing, or budget tradeoffs`
                }
                required
              />
            </label>
            <button type="submit" disabled={chatAction.status === 'loading'}>
              {chatAction.status === 'loading' ? 'Thinking...' : 'Ask AI'}
            </button>
          </form>
          {chatAction.status === 'error' ? <p className="login-error">{chatAction.error}</p> : null}
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
  const priceQuotes = Array.isArray(plan?.priceQuotes) ? plan.priceQuotes : []
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

        {priceQuotes.length ? (
          <>
            <h2>Live Flight and Hotel Prices</h2>
            <TravelQuoteList quotes={priceQuotes} />
          </>
        ) : null}

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
                    Distance:{' '}
                    <strong>
                      {item.distanceMeters == null ? 'Use your area to calculate distance' : `${Math.round(item.distanceMeters)}m`}
                    </strong>
                  </p>
                  <p>{item.reason}</p>
                </article>
              ))}
            </div>
          </>
        ) : null}

        <h2>Suggested Day Plan</h2>
        <div className="spotlight-grid">
          {(plan.steps || []).map((step, index) => (
            <article className="spotlight-card" key={`${step.dayNumber}-${step.title}-${index}`}>
              <p className="spotlight-day">Day {step.dayNumber}</p>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
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
        <Route path="/" element={<HomePage />} />
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
