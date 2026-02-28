const API_TIMEOUT_MS = 8000
const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

async function request(path) {
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL is not set')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      signal: controller.signal,
    })
    const responseText = await response.text()

    if (!response.ok) {
      throw new Error(`Request failed (${response.status}): ${responseText}`)
    }

    return responseText ? JSON.parse(responseText) : {}
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
