import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/auth'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Tour 2025</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/admin"
                className="bg-blue-600 text-white px-3 py-2 sm:px-4 text-sm sm:text-base rounded-md hover:bg-blue-700 transition-colors"
              >
                <span className="hidden sm:inline">Admin Dashboard</span>
                <span className="sm:hidden">Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:py-12 px-3 sm:px-4 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center space-x-4 sm:space-x-8 mb-6 sm:mb-8">
            <a href="https://vite.dev" target="_blank">
              <img src={viteLogo} className="logo w-12 h-12 sm:w-16 sm:h-16" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank">
              <img src={reactLogo} className="logo react w-12 h-12 sm:w-16 sm:h-16" alt="React logo" />
            </a>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 px-4">Tour 2025 - RobenDevs</h1>
          <div className="bg-white rounded-lg shadow p-4 sm:p-8 max-w-sm sm:max-w-md mx-auto">
            <p className="mb-3 sm:mb-4 text-gray-600 text-sm sm:text-base">Welcome, {user.name}!</p>
            <button 
              onClick={() => setCount((count) => count + 1)}
              className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-md hover:bg-blue-700 transition-colors text-base sm:text-lg font-medium w-full sm:w-auto"
            >
              count is {count}
            </button>
            <p className="mt-3 sm:mt-4 text-gray-600 text-sm sm:text-base">
              Edit <code className="bg-gray-100 px-1 sm:px-2 py-1 rounded text-xs sm:text-sm">src/App.tsx</code> and save to test HMR
            </p>
          </div>
          <p className="mt-6 sm:mt-8 text-gray-500 text-sm sm:text-base px-4">
            Click on the Vite and React logos to learn more
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
