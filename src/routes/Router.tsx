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
import TeamDashboard from '../features/teams/Dashboard'
import QRScanPage from '../features/teams/QRScanPage'
import MCQPage from '../features/teams/MCQPage'
import PuzzlePage from '../features/teams/PuzzleView'

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
        element: <TeamDashboard />,
      },
      {
        path: 'scan',
        element: <QRScanPage />,
      },
      {
        path: 'mcq',
        element: <MCQPage />,
      },
      {
        path: 'puzzle',
        element: <PuzzlePage />,
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
    ],
  },
])

export default function Router() {
  return <RouterProvider router={router} />
}
