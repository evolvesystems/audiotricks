import React, { useState } from 'react'
import { LockClosedIcon, UserIcon } from '@heroicons/react/24/outline'

interface LoginCardProps {
  onLogin: (isGuest?: boolean) => void
}

const LoginCard: React.FC<LoginCardProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simple client-side password check
    const correctPassword = import.meta.env.VITE_ACCESS_PASSWORD
    
    if (!correctPassword) {
      setError('No password configured. Contact administrator.')
      setIsLoading(false)
      return
    }

    if (password === correctPassword) {
      localStorage.setItem('admin_authenticated', 'true')
      onLogin(false)
    } else {
      setError('Invalid password')
      setPassword('')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="text-center mb-6">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 mb-4">
          <LockClosedIcon className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Enhanced Access</h2>
        <p className="text-sm text-gray-600 mt-1">
          Login to use admin API keys (costs charged to admin)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Access password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !password}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Checking...' : 'Login'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-red-600">
          ⚠️ Warning: Admin keys will be charged for all API usage
        </p>
      </div>
    </div>
  )
}

export default LoginCard