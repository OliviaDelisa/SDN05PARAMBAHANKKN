const BASE_URL = '/api'

export const TOKEN_KEY = 'uks_token'

// Batas waktu permintaan. Tanpa ini, permintaan bisa menggantung tanpa akhir
// dan tombol simpan terlihat macet selamanya.
const TIMEOUT_MS = 15000

function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function bersihkanSesi() {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem('uks_user')
  } catch {
    // sessionStorage tidak tersedia — tidak ada yang perlu dibersihkan
  }
}

export async function fetchApi(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`

  // Identitas dikirim lewat token yang ditandatangani server, bukan header
  // X-User-Id yang bisa diisi sembarang nilai oleh siapa pun.
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  }

  const config = { ...options, headers }

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res
  try {
    res = await fetch(url, { ...config, signal: controller.signal })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Server tidak merespons. Periksa koneksi lalu coba lagi.', { cause: err })
    }
    throw new Error('Tidak dapat menghubungi server. Pastikan server backend aktif.', { cause: err })
  } finally {
    clearTimeout(timer)
  }

  // Respons bisa saja HTML (mis. halaman error proxy), jadi jangan langsung
  // memanggil res.json() tanpa memeriksa tipe kontennya.
  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await res.json() : await res.text()

  if (!res.ok) {
    // Sesi habis / token tidak sah → paksa login ulang.
    if (res.status === 401) {
      bersihkanSesi()
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }

    const pesan = isJson
      ? payload?.message
      : `Server membalas dengan status ${res.status}.`
    throw new Error(pesan || `HTTP ${res.status}`)
  }

  return isJson ? payload : { success: true, data: payload }
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
    update: (id, data) => fetchApi(`/kunjungan/${id}`, { method: 'PUT', body: data }),
    delete: (id) => fetchApi(`/kunjungan/${id}`, { method: 'DELETE' })
  }
}
