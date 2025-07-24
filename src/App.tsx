import { AuthProvider } from './contexts/AuthContext'
import Router from './routes/Router'
import './App.css'
import './styles/mobile.css'

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  )
}

export default App
