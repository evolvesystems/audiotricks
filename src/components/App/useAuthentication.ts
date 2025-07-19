import { useState, useEffect } from 'react'

export const useAuthentication = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true)
  const [isGuest, setIsGuest] = useState<boolean>(true)
  const [showLogin, setShowLogin] = useState(false)
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('openai_api_key') || '')
  const [elevenLabsKey, setElevenLabsKey] = useState<string>(localStorage.getItem('elevenlabs_api_key') || '')

  useEffect(() => {
    // Check if user has logged in with password before (persists permanently)
    const isAuthed = localStorage.getItem('admin_authenticated') === 'true'
    
    if (isAuthed) {
      // User previously logged in with password - use ENV keys (persists permanently)
      setIsAuthenticated(true)
      setIsGuest(false)
      const envKey = import.meta.env.VITE_OPENAI_API_KEY
      const envElevenLabsKey = import.meta.env.VITE_ELEVENLABS_API_KEY
      if (envKey) {
        setApiKey(envKey)
      }
      if (envElevenLabsKey) {
        setElevenLabsKey(envElevenLabsKey)
      }
    } else {
      // New user - show login card
      setShowLogin(true)
    }
  }, [])

  const handleLogin = (guestMode: boolean = false) => {
    setIsAuthenticated(true)
    setIsGuest(guestMode)
    setShowLogin(false)
    
    // If logged in (not guest), use ENV keys and save admin status permanently
    if (!guestMode) {
      localStorage.setItem('admin_authenticated', 'true')
      const envKey = import.meta.env.VITE_OPENAI_API_KEY
      const envElevenLabsKey = import.meta.env.VITE_ELEVENLABS_API_KEY
      if (envKey) {
        setApiKey(envKey)
      }
      if (envElevenLabsKey) {
        setElevenLabsKey(envElevenLabsKey)
      }
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setIsGuest(true)
    setShowLogin(true)
    // Note: We don't clear admin_authenticated to allow easy re-login
  }

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey)
    localStorage.setItem('openai_api_key', newKey)
  }

  const handleElevenLabsKeyChange = (newKey: string) => {
    setElevenLabsKey(newKey)
    localStorage.setItem('elevenlabs_api_key', newKey)
  }

  return {
    isAuthenticated,
    isGuest,
    showLogin,
    apiKey,
    elevenLabsKey,
    handleLogin,
    handleLogout,
    handleApiKeyChange,
    handleElevenLabsKeyChange
  }
}