import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Meeting from './pages/Meeting'
import Login from './pages/Login'

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem('jwt')
  const location = useLocation()
  if(!isAuthenticated){
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return children
}

// Public Route Component (redirect to home if already authenticated)
function PublicRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem('jwt')
  return !isAuthenticated ? children : <Navigate to="/" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/meeting/:roomId" 
          element={
            <ProtectedRoute>
              <Meeting />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
