import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Landing from '../components/Landing'
import { LoginPage, TeamPage } from '../pages'
import AdminPage from '../pages/AdminPage'
import Dashboard from '../features/admin/Dashboard'
import MCQs from '../features/admin/MCQs'
import Puzzles from '../features/admin/Puzzles'
import Teams from '../features/admin/Teams'
import Settings from '../features/admin/Settings'
import Monitor from '../features/admin/Monitor'
import Launch from '../features/admin/Launch'
import ProtectedRoute from '../components/ProtectedRoute'
import TeamGameFlow from '../features/teams/TeamGameFlow'
// Legacy components (keeping for reference)
import TeamDashboard from '../features/teams/Dashboard'
import QRScanPage from '../features/teams/QRScanPage'
import MCQPage from '../features/teams/MCQPage'
import PuzzlePage from '../features/teams/PuzzleView'
// Debug components
import AuthDebugger from '../components/AuthDebugger'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/team',
    element: (
      <ProtectedRoute>
        <TeamPage />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <TeamGameFlow />,
      },
      // Legacy routes (keeping for backward compatibility during transition)
      {
        path: 'legacy/dashboard', 
        element: <TeamDashboard />,
      },
      {
        path: 'legacy/scan',
        element: <QRScanPage />,
      },
      {
        path: 'legacy/mcq',
        element: <MCQPage />,
      },
      {
        path: 'legacy/puzzle',
        element: <PuzzlePage onProceedToScan={() => {}} />,
      },
    ],
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
        element: <Dashboard />,
      },
      {
        path: 'mcqs',
        element: <MCQs />,
      },
      {
        path: 'puzzles',
        element: <Puzzles />,
      },
      {
        path: 'teams',
        element: <Teams />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'monitor',
        element: <Monitor />,
      },
      {
        path: 'launch',
        element: <Launch />,
      },
      {
        path: 'debug',
        element: <AuthDebugger />,
      },
    ],
  },
])

export default function Router() {
  return <RouterProvider router={router} />
}
