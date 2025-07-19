import { useState, useEffect } from 'react'
import { UserSettings, DEFAULT_SETTINGS } from '../components/Settings'

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    // Load settings from localStorage on initialization
    const savedSettings = localStorage.getItem('audioTricksSettings')
    if (savedSettings) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) }
      } catch (e) {
        return DEFAULT_SETTINGS
      }
    }
    return DEFAULT_SETTINGS
  })

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('audioTricksSettings', JSON.stringify(settings))
  }, [settings])

  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings)
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem('audioTricksSettings')
  }

  return {
    settings,
    updateSettings,
    resetSettings
  }
}