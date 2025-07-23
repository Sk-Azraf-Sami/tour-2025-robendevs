import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from '../App'
import { LoginPage } from '../pages'
import AdminPage from '../pages/AdminPage'
import AdminWelcome from '../features/admin/AdminWelcome'
import MCQManager from '../features/admin/MCQManager'
import PuzzleManager from '../features/admin/PuzzleManager'
import GlobalSettings from '../features/admin/GlobalSettings'
import LiveDashboard from '../features/admin/LiveDashboard'
import ProtectedRoute from '../components/ProtectedRoute'
import TeamDashboard from '../features/teams/TeamDashboard'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
   {
    path: '/team/dashboard',
    element: (
      <ProtectedRoute>
        <TeamDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminPage />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminWelcome />,
      },
      {
        path: 'mcq-manager',
        element: <MCQManager />,
      },
      {
        path: 'puzzle-manager',
        element: <PuzzleManager />,
      },
      {
        path: 'global-settings',
        element: <GlobalSettings />,
      },
      {
        path: 'live-dashboard',
        element: <LiveDashboard />,
      },
    ],
  },
])

export default function Router() {
  return <RouterProvider router={router} />
}
