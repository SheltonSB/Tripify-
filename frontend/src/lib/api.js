const API_TIMEOUT_MS = 8000
const DISCOVERY_TIMEOUT_MS = 20000
const AI_TIMEOUT_MS = 60000
const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

async function request(path, options = {}) {
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL is not set')
  }

  const { timeoutMs = API_TIMEOUT_MS } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const { method = 'GET', body } = options
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    const responseText = await response.text()

    if (!response.ok) {
      throw new Error(`Request failed (${response.status}): ${responseText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json') && responseText) {
      return JSON.parse(responseText)
    }
    return responseText ? { message: responseText } : {}
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export function getHealth() {
  return request('/health')
}

export function signup(payload) {
  return request('/api/auth/signup', { method: 'POST', body: payload })
}

export function login(payload) {
  return request('/api/auth/login', { method: 'POST', body: payload })
}

export function getUser(userId) {
  return request(`/api/users/${userId}`)
}

export function updatePreferences(userId, payload) {
  return request(`/api/users/${userId}/preferences`, { method: 'PUT', body: payload })
}

export function generateTrip(payload) {
  return request('/api/trips/generate', { method: 'POST', body: payload })
}

export function getTrip(tripId) {
  return request(`/api/trips/${tripId}`)
}

export function confirmTrip(tripId, payload = {}) {
  return request(`/api/trips/confirm/${tripId}`, { method: 'POST', body: payload })
}

export function buildAssistantPlan(payload) {
  return request('/api/assistant/plan', { method: 'POST', body: payload, timeoutMs: AI_TIMEOUT_MS })
}

export function chatWithAssistant(payload) {
  return request('/api/assistant/chat', { method: 'POST', body: payload, timeoutMs: AI_TIMEOUT_MS })
}

export function getAssistantPlansByTrip(tripId) {
  return request(`/api/assistant/trips/${tripId}`)
}

export function getAssistantPlansByUser(userId) {
  return request(`/api/assistant/users/${userId}`)
}

export function getDestinationPhotos(destination) {
  return request(`/api/explore/photos?destination=${encodeURIComponent(destination)}`, {
    timeoutMs: DISCOVERY_TIMEOUT_MS,
  })
}

export function getLiveEvents(destination, options = {}) {
  const params = new URLSearchParams({
    destination,
  })

  if (options.area) {
    params.set('area', options.area)
  }
  if (options.latitude != null && options.latitude !== '') {
    params.set('latitude', String(options.latitude))
  }
  if (options.longitude != null && options.longitude !== '') {
    params.set('longitude', String(options.longitude))
  }
  if (options.radiusMiles != null && options.radiusMiles !== '') {
    params.set('radiusMiles', String(options.radiusMiles))
  }

  return request(`/api/explore/events?${params.toString()}`, {
    timeoutMs: DISCOVERY_TIMEOUT_MS,
  })
}

export function getLiveRecommendations({ destination, budget = 1500, days = 3, people = 2, userId, vibe = '', latitude, longitude }) {
  const params = new URLSearchParams({
    destination,
    budget: String(budget),
    days: String(days),
    people: String(people),
  })

  if (userId != null && userId !== '') {
    params.set('userId', String(userId))
  }
  if (vibe) {
    params.set('vibe', vibe)
  }

  if (latitude != null && latitude !== '') {
    params.set('latitude', String(latitude))
  }
  if (longitude != null && longitude !== '') {
    params.set('longitude', String(longitude))
  }

  return request(`/api/explore/recommendations?${params.toString()}`, {
    timeoutMs: DISCOVERY_TIMEOUT_MS,
  })
}
