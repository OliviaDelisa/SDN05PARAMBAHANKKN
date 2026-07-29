const BASE_URL = '/api'

export async function fetchApi(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  }

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  try {
    const res = await fetch(url, config)
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || `HTTP ${res.status}`)
    }

    return data
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message)
    throw err
  }
}

export const api = {
  get: (endpoint) => fetchApi(endpoint),
  post: (endpoint, body) => fetchApi(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => fetchApi(endpoint, { method: 'PUT', body }),
  del: (endpoint) => fetchApi(endpoint, { method: 'DELETE' })
}
