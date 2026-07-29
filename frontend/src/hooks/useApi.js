import { useState, useCallback } from 'react'
import { api } from '../utils/api'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const request = useCallback(async (apiFunc, ...args) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFunc(...args)
      setLoading(false)
      return res
    } catch (err) {
      setLoading(false)
      setError(err.message || 'Terjadi kesalahan pada server')
      throw err
    }
  }, [])

  return {
    loading,
    error,
    get: (url) => request(api.get, url),
    post: (url, body) => request(api.post, url, body),
    put: (url, body) => request(api.put, url, body),
    del: (url) => request(api.del, url)
  }
}
