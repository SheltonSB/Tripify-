const API_TIMEOUT_MS = 8000
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
      throw new Error(buildRequestErrorMessage(response.status, responseText))
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

function buildRequestErrorMessage(status, responseText) {
  let details = responseText
  try {
    const parsed = responseText ? JSON.parse(responseText) : null
    if (parsed && typeof parsed === 'object') {
      details = parsed.message || parsed.error || responseText
    }
  } catch (_error) {
    details = responseText
  }

  if (status === 503) {
    return `Service temporarily unavailable. ${details || 'Please retry in a few seconds.'}`
  }
  if (status === 502) {
    return `Upstream provider is unreachable. ${details || 'Please retry shortly.'}`
  }
  if (status === 400) {
    return details || 'Please check your input and try again.'
  }
  return `Request failed (${status}): ${details || 'Unexpected response'}`
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

export function getAssistantPlansByTrip(tripId) {
  return request(`/api/assistant/trips/${tripId}`)
}

export function getAssistantPlansByUser(userId) {
  return request(`/api/assistant/users/${userId}`)
}
