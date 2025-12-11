import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import WordList from './pages/WordList'
import Review from './pages/Review'

function App() {
  const token = useAuthStore((state) => state.token)

  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/" replace /> : <Register />}
        />

        {/* 受保护路由 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="words" element={<WordList />} />
          <Route path="review" element={<Review />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
