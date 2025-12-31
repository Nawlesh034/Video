import { useState } from "react"
import api from "../api/api"
import { useNavigate } from "react-router-dom"

export default function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const username = localStorage.getItem('username')

  const createRoom = async () => {
    setLoading(true)
    try {
      const res = await api.post("/rooms")
      navigate(`/meeting/${res.data.roomId}`)
    } catch (error) {
      alert('Failed to create room: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.welcomeText}>Welcome, {username}!</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.title}>🎥 Video Conference + Whiteboard POC</h2>
        <p style={styles.description}>
          Create a new meeting room with video conferencing and interactive whiteboard features.
        </p>
        
        <div style={styles.features}>
          <div style={styles.feature}>
            <span style={styles.icon}>📹</span>
            <span>Real-time Video</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.icon}>🎙️</span>
            <span>Audio Support</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.icon}>✏️</span>
            <span>Interactive Whiteboard</span>
          </div>
        </div>

        <button 
          onClick={createRoom} 
          style={styles.createBtn}
          disabled={loading}
        >
          {loading ? 'Creating...' : '✨ Create New Meeting'}
        </button>

        <p style={styles.note}>
          Powered by Agora RTC & Netless Whiteboard
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  header: {
    width: '100%',
    maxWidth: '600px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  welcomeText: {
    color: '#f1f5f9',
    fontSize: '20px',
    margin: 0
  },
  logoutBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s'
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '48px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    textAlign: 'center'
  },
  title: {
    color: '#f1f5f9',
    fontSize: '32px',
    marginBottom: '16px'
  },
  description: {
    color: '#94a3b8',
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '32px'
  },
  features: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '32px',
    padding: '24px 0',
    borderTop: '1px solid #334155',
    borderBottom: '1px solid #334155'
  },
  feature: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: '#cbd5e1',
    fontSize: '14px'
  },
  icon: {
    fontSize: '32px'
  },
  createBtn: {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginBottom: '16px'
  },
  note: {
    color: '#64748b',
    fontSize: '12px',
    marginTop: '16px'
  }
}
