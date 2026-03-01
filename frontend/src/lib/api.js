const API_TIMEOUT_MS = 8000
const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

async function request(path, options = {}) {
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL is not set')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

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
      throw new Error(`Request timed out after ${API_TIMEOUT_MS}ms`)
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
  return request('/api/assistant/plan', { method: 'POST', body: payload })
}
