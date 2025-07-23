import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from '../App'
import { LoginPage } from '../pages'
import AdminPage from '../pages/AdminPage'
import Dashboard from '../features/admin/Dashboard'
import MCQs from '../features/admin/MCQs'
import Puzzles from '../features/admin/Puzzles'
import Teams from '../features/admin/Teams'
import Settings from '../features/admin/Settings'
import Monitor from '../features/admin/Monitor'
import Launch from '../features/admin/Launch'
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
