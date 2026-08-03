const BASE_URL = '/api'

function getUserId() {
  try {
    const saved = sessionStorage.getItem('uks_user')
    if (saved) {
      const u = JSON.parse(saved)
      return u?.id ? String(u.id) : null
    }
  } catch (e) {}
  return null
}

export async function fetchApi(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`

  const userId = getUserId()
  const headers = {
    'Content-Type': 'application/json',
    ...(userId ? { 'X-User-Id': userId } : {}),
    ...(options.headers || {})
  }

  const config = {
    ...options,
    headers
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
    console.warn(`API Not Reachable [${endpoint}]:`, err.message)
    throw err
  }
}

export const api = {
  get: (endpoint) => fetchApi(endpoint),
  post: (endpoint, body) => fetchApi(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => fetchApi(endpoint, { method: 'PUT', body }),
  del: (endpoint) => fetchApi(endpoint, { method: 'DELETE' }),

  siswa: {
    getAll: () => fetchApi('/siswa'),
    create: (data) => fetchApi('/siswa', { method: 'POST', body: data }),
    update: (id, data) => fetchApi(`/siswa/${id}`, { method: 'PUT', body: data }),
    delete: (id) => fetchApi(`/siswa/${id}`, { method: 'DELETE' })
  },
  kunjungan: {
    getAll: () => fetchApi('/kunjungan'),
    create: (data) => fetchApi('/kunjungan', { method: 'POST', body: data }),
    delete: (id) => fetchApi(`/kunjungan/${id}`, { method: 'DELETE' })
  }
}
