import { useState } from 'react'
import { useNavigate,useLocation } from 'react-router-dom'

import api from '../api/api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/login', {
        username,
        password
      })

      localStorage.setItem('jwt', response.data.token)
      localStorage.setItem('userId', response.data.userId)
      localStorage.setItem('username', response.data.username)
      
      
      const from = location.state?.from || '/'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎥 Video Conference POC</h1>
        <p style={styles.subtitle}>Login to continue</p>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter any username"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter any password"
              style={styles.input}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button 
            type="submit" 
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p style={styles.note}>
            Note: This is a POC - any username/password will work
          </p>
        </form>
        <div>
          username :{username}
          password :{password}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    padding: '20px'
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
  },
  title: {
    color: '#f1f5f9',
    fontSize: '28px',
    marginBottom: '8px',
    textAlign: 'center'
  },
  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: '32px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    color: '#e2e8f0',
    fontSize: '14px',
    fontWeight: '500'
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '8px'
  },
  error: {
    color: '#ef4444',
    fontSize: '14px',
    padding: '12px',
    backgroundColor: '#7f1d1d',
    borderRadius: '8px',
    textAlign: 'center'
  },
  note: {
    color: '#64748b',
    fontSize: '12px',
    textAlign: 'center',
    marginTop: '8px'
  }
}

