import { useState, useEffect, useCallback } from 'react'

const LOGIN_URL = '/api/login?redirect=/'
const LS_KEY = 'neko-nav-authed'

function isLocalDev() {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

function getInitialAuthed() {
  if (isLocalDev()) return localStorage.getItem(LS_KEY) === 'true'
  return false
}

export function useAuth() {
  const [authed, setAuthed] = useState(getInitialAuthed())
  const [user, setUser] = useState(getInitialAuthed() ? 'local' : '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isLocalDev()) return

    let cancelled = false
    setLoading(true)
    fetch('/api/verify')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return
        setAuthed(data.authenticated)
        setUser(data.user || '')
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const login = useCallback(() => {
    if (isLocalDev()) { localStorage.setItem(LS_KEY, 'true'); setAuthed(true); setUser('local'); return }
    window.location.href = LOGIN_URL
  }, [])

  const logout = useCallback(() => {
    if (isLocalDev()) { localStorage.setItem(LS_KEY, 'false'); setAuthed(false); setUser(''); return }
    document.cookie = 'CF_Authorization=; path=/; max-age=0; domain=' + location.hostname
    setAuthed(false)
    setUser('')
  }, [])

  return { authed, user, loading, login, logout }
}
