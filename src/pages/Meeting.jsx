import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import AgoraRTC from "agora-rtc-sdk-ng"
import { WhiteWebSdk } from "white-web-sdk"
import api from "../api/api"

export default function Meeting() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [localTracks, setLocalTracks] = useState({ audio: null, video: null })
  const [room, setRoom] = useState(null)
  const [whiteboardVisible, setWhiteboardVisible] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [remoteUsers, setRemoteUsers] = useState(new Set())
  const [selectedColor, setSelectedColor] = useState([255, 0, 0]) // RGB for red
  const [selectedTool, setSelectedTool] = useState('pencil') // pencil, eraser
  const joinedRef = useRef(false)
  const localUidRef = useRef(null)
  const addedContainersRef = useRef(new Set())
  const whiteboardVisibleRef = useRef(false)
    const [rtcDebug, setRtcDebug] = useState(null)
const [whiteboardDebug, setWhiteboardDebug] = useState(null)




  useEffect(() => {
    if(!joinedRef.current){
      joinVideo()
    }
    
    return () => {
      cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId])

  const cleanup = async () => {
    console.log("=== CLEANUP ===")
    
    if (localTracks.audio) {
      localTracks.audio.stop()
      localTracks.audio.close()
    }
    if (localTracks.video) {
      localTracks.video.stop()
      localTracks.video.close()
    }
    if (client) {
      await client.leave()
    }
    if (room) {
      await room.disconnect()
    }
    
    // Clear all refs
    joinedRef.current = false
    localUidRef.current = null
    addedContainersRef.current.clear()
    
    // Clear remote videos container
    const remoteContainer = document.getElementById("remote-videos")
    if (remoteContainer) {
      remoteContainer.innerHTML = ""
    }
    
    console.log("✓ Cleanup complete")
  }

  const joinVideo = async () => {
    try {
      setLoading(true)
      setError('')

      // Get RTC token from backend
      const { data } = await api.get(`/rtc/token?channel=${roomId}`)
      console.log(data,"data of rtc token");
      // Create Agora client
      setRtcDebug(data)

      const agoraClient = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      })
      console.log(agoraClient,"agora client");

      // Join the channel
      const uid = await agoraClient.join(
        data.appId,
        roomId,
        data.token || null,
        data.uid
      )
      console.log(data.uid,"uid of agora client");
     

      
      // Store local user ID IMMEDIATELY - CRITICAL for filtering
      localUidRef.current = data.uid
      console.log("========================================")
      console.log("🎯 JOINED CHANNEL")
      console.log("My UID:", uid, "Type:", typeof uid)
      console.log("========================================")

      setClient(agoraClient)

      // IMPORTANT: Set up event handlers BEFORE publishing
      // Handle remote users
      agoraClient.on("user-published", async (user, mediaType) => {
        console.log("========================================")
        console.log("=== USER PUBLISHED ===")
        console.log("Remote UID:", user.uid, "Type:", typeof user.uid)
        console.log("Local UID:", localUidRef.current, "Type:", typeof localUidRef.current)
        console.log("MediaType:", mediaType)
        console.log("Strict equal (===):", user.uid === localUidRef.current)
        console.log("String compare:", String(user.uid) === String(localUidRef.current))
        console.log("Number compare:", Number(user.uid) === Number(localUidRef.current))
        
        // ROBUST CHECK: Skip if this is our own user (multiple comparison methods)
        const isSameUser = (
          user.uid === localUidRef.current ||
          String(user.uid) === String(localUidRef.current) ||
          Number(user.uid) === Number(localUidRef.current)
        )
        
        if (isSameUser) {
          console.log("✓✓✓ SKIPPING OWN USER ✓✓✓")
          console.log("========================================")
          return
        }
        
        // Skip if already subscribed to this user's media type
        const userMediaKey = `${user.uid}-${mediaType}`
        if (addedContainersRef.current.has(userMediaKey)) {
          console.log("✓ Already handling this user's", mediaType)
          console.log("========================================")
          return
        }
        
        console.log("→→→ SUBSCRIBING TO REMOTE USER:", user.uid, mediaType)
        await agoraClient.subscribe(user, mediaType)
        
        if (mediaType === "video") {
          addedContainersRef.current.add(userMediaKey)
          
          // // Track remote user
          // setRemoteUsers(prev => new Set(prev).add(user.uid))
          
          const remoteVideoTrack = user.videoTrack
          let playerContainer = document.getElementById(`remote-${user.uid}`)
          if (!playerContainer) {
            // Create wrapper for grid item
            const wrapper = document.createElement("div")
            wrapper.className = 'remote-video-wrapper'
            wrapper.style.position = 'relative'
            wrapper.style.width = '100%'
            wrapper.style.aspectRatio = '4/3'
            
            // Create video container
            playerContainer = document.createElement("div")
            playerContainer.id = `remote-${user.uid}`
            playerContainer.style.width = '100%'
            playerContainer.style.height = '100%'
            playerContainer.style.backgroundColor = '#1e293b'
            playerContainer.style.borderRadius = '12px'
            playerContainer.style.overflow = 'hidden'
            playerContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)'
            
            // Create label
            const label = document.createElement("div")
            label.textContent = `Participant`
            label.style.position = 'absolute'
            label.style.bottom = '10px'
            label.style.left = '10px'
            label.style.backgroundColor = 'rgba(0,0,0,0.7)'
            label.style.color = 'white'
            label.style.padding = '4px 12px'
            label.style.borderRadius = '6px'
            label.style.fontSize = '14px'
            label.style.zIndex = '1'
            
            wrapper.appendChild(playerContainer)
            wrapper.appendChild(label)
            document.getElementById("remote-videos")?.appendChild(wrapper)
            console.log("✓✓✓ CREATED CONTAINER FOR REMOTE USER:", user.uid)
            console.log("========================================")
          } else {
            console.log("✓ Container already exists for:", user.uid)
            console.log("========================================")
          }
          
          remoteVideoTrack.play(playerContainer)
          console.log("✓✓✓ PLAYING VIDEO FOR:", user.uid)
        }
        
        if (mediaType === "audio") {
          addedContainersRef.current.add(userMediaKey)
          user.audioTrack.play()
          console.log("✓✓✓ PLAYING AUDIO FOR:", user.uid)
          console.log("========================================")
        }
      })

     agoraClient.on("user-unpublished", async (user, mediaType) => {
  console.log("❌ user-unpublished", user.uid, mediaType)

  // ✅ STOP VIDEO TRACK
  if (mediaType === "video" && user.videoTrack) {
    user.videoTrack.stop()
  }

  // ✅ REMOVE FULL WRAPPER (NOT JUST VIDEO DIV)
  const playerContainer = document.getElementById(`remote-${user.uid}`)
  if (playerContainer) {
    const wrapper = playerContainer.closest(".remote-video-wrapper")
    if (wrapper) {
      wrapper.remove()
    }
  }

  // ✅ CLEAR TRACKING KEYS
  addedContainersRef.current.delete(`${user.uid}-video`)
  addedContainersRef.current.delete(`${user.uid}-audio`)
})

      
      agoraClient.on("user-left", (user) => {
        console.log("========================================")
        console.log("=== USER LEFT ===")
        console.log("User:", user.uid)
        
        // Clean up tracking
        addedContainersRef.current.delete(`${user.uid}-video`)
        addedContainersRef.current.delete(`${user.uid}-audio`)
        
        setRemoteUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(user.uid)
          return newSet
        })
        
        const playerContainer = document.getElementById(`remote-${user.uid}`)
        if (playerContainer) {
          // Remove the wrapper (parent element)
          const wrapper = playerContainer.closest('.remote-video-wrapper')
          if (wrapper) {
            wrapper.remove()
          }
          console.log("✓ Removed container for user:", user.uid)
        }
        console.log("========================================")
      })

      // Listen for stream messages (for whiteboard sync)
      agoraClient.on("stream-message", (uid, stream) => {
        try {
          const decoder = new TextDecoder()
          const message = decoder.decode(stream)
          const data = JSON.parse(message)
          
          console.log("📨 Received stream message from", uid, ":", data)
          
          if (data.type === 'WHITEBOARD_OPENED' && !whiteboardVisibleRef.current) {
            console.log("🎨 Auto-opening whiteboard (remote user opened it)")
            openWhiteboard()
          } else if (data.type === 'WHITEBOARD_CLOSED' && whiteboardVisibleRef.current) {
            console.log("🚪 Auto-closing whiteboard (remote user closed it)")
            setWhiteboardVisible(false)
            whiteboardVisibleRef.current = false
          }
        } catch (err) {
          console.warn("Error processing stream message:", err)
        }
      })

      // NOW create and publish tracks AFTER event handlers are set up
      console.log("Creating local tracks...")
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
      
      setLocalTracks({ audio: audioTrack, video: videoTrack })

      // Play local video
      videoTrack.play("local-video")

      // Publish tracks
      console.log("Publishing local tracks...")
      await agoraClient.publish([audioTrack, videoTrack])
      console.log("✓ Local tracks published")

      // IMPORTANT: Get current remote users already in the channel
      console.log("Current remote users in channel:", agoraClient.remoteUsers.map(u => u.uid))

      joinedRef.current = true
      setLoading(false)
    } catch (err) {
      console.error("Failed to join video:", err)
      setError(`Failed to join video: ${err.message}`)
      setLoading(false)
    }
  }

  const openWhiteboard = async () => {
    try {
      setError('')
      setWhiteboardVisible(true) // Show overlay first
      whiteboardVisibleRef.current = true
      
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log("🎨 Opening whiteboard for room:", roomId)
      
      // Send room_id in the request body
      const { data } = await api.post("/whiteboard/session", {
        room_id: roomId
      })
      setWhiteboardDebug(data)

      console.log("📋 Whiteboard session data:", {
        roomUUID: data.roomUUID,
        appIdentifier: data.appIdentifier,
        region: data.region,
        hasToken: !!data.roomToken
      })
  
      const sdk = new WhiteWebSdk({
        appIdentifier: data.appIdentifier || "whiteboard-poc",
        region: data.region || "us-sv",
        loggerOptions: {
          reportLevelMask: "debug"
        }
      })
  
      const cleanToken = data.roomToken.replace(/"/g, '').trim()
      
      console.log("🔗 Joining whiteboard room:", data.roomUUID)
  
      const whiteboardRoom = await sdk.joinRoom({
        uuid: data.roomUUID,
        roomToken: cleanToken,
        uid: localStorage.getItem('userId') || `user-${Date.now()}`,
        isWritable: true,
        disableNewPencil: false,
        invisiblePlugins: [],
        useMultiViews: false
      })
      
      console.log("✅ Joined whiteboard room, binding to element...")
  
      const whiteboardElement = document.getElementById("whiteboard")
      if (whiteboardElement) {
        whiteboardRoom.bindHtmlElement(whiteboardElement)
        
        // Set up event listeners for collaboration
        whiteboardRoom.callbacks.on("onRoomStateChanged", (modifyState) => {
          console.log("🔄 Room state changed:", modifyState)
        })
        
        whiteboardRoom.callbacks.on("onPhaseChanged", (phase) => {
          console.log("📡 Phase changed:", phase)
        })
        
        setRoom(whiteboardRoom)
        setWhiteboardVisible(true)
        whiteboardVisibleRef.current = true  // Update ref
        console.log("✅ Whiteboard initialized successfully")
        console.log("👥 Room members:", whiteboardRoom.state.roomMembers?.length || 0)
        
        // Set initial tool and color
        whiteboardRoom.setMemberState({
          currentApplianceName: "pencil",
          strokeColor: selectedColor,
          strokeWidth: 4
        })
        
        // Broadcast whiteboard opened to other users via Agora data stream
        if (client) {
          try {
            const encoder = new TextEncoder()
            const message = encoder.encode(JSON.stringify({
              type: 'WHITEBOARD_OPENED',
              roomId: roomId,
              timestamp: Date.now()
            }))
            await client.sendStreamMessage(message)
            console.log("📡 Broadcasted whiteboard opened event")
          } catch (err) {
            console.warn("Could not broadcast whiteboard event:", err)
          }
        }
      } else {
        throw new Error("Whiteboard element not found")
      }
    } catch (err) {
      console.error("❌ Failed to open whiteboard:", err)
      const errorMsg = err.response?.data?.detail || err.message
      setError(`Whiteboard error: ${errorMsg}`)
      setWhiteboardVisible(false) // Hide on error
      whiteboardVisibleRef.current = false
    }
  }
  const toggleVideo = async () => {
    if (localTracks.video) {
      await localTracks.video.setEnabled(!videoEnabled)
      setVideoEnabled(!videoEnabled)
    }
  }

  const toggleAudio = async () => {
    if (localTracks.audio) {
      await localTracks.audio.setEnabled(!audioEnabled)
      setAudioEnabled(!audioEnabled)
    }
  }

  const leaveRoom = async () => {
    await cleanup()
    navigate('/')
  }

  const copyRoomLink = () => {
    const roomUrl = window.location.href
    navigator.clipboard.writeText(roomUrl).then(() => {
      alert('Room link copied! Share it with others to join.')
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = roomUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('Room link copied! Share it with others to join.')
    })
  }

  const closeWhiteboard = async () => {
    setWhiteboardVisible(false)
    whiteboardVisibleRef.current = false
    
    // Broadcast whiteboard closed to other users
    if (client) {
      try {
        const encoder = new TextEncoder()
        const message = encoder.encode(JSON.stringify({
          type: 'WHITEBOARD_CLOSED',
          roomId: roomId,
          timestamp: Date.now()
        }))
        await client.sendStreamMessage(message)
        console.log("📡 Broadcasted whiteboard closed event")
      } catch (err) {
        console.warn("Could not broadcast whiteboard close event:", err)
      }
    }
  }

  const changeColor = (color) => {
    setSelectedColor(color)
    if (room) {
      room.setMemberState({
        strokeColor: color
      })
    }
  }

  const changeTool = (tool) => {
    setSelectedTool(tool)
    if (room) {
      if (tool === 'eraser') {
        room.setMemberState({
          currentApplianceName: "eraser"
        })
      } else if (tool === 'pencil') {
        room.setMemberState({
          currentApplianceName: "pencil"
        })
      }
    }
  }

  const clearWhiteboard = () => {
    if (room) {
      room.cleanCurrentScene()
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Meeting Room</h2>
          <p style={styles.roomId}>Room ID: {roomId}</p>
          <p style={styles.participants}>👥 Participants: {remoteUsers.size + 1}</p>
        </div>
        <div style={styles.headerButtons}>
          <button onClick={copyRoomLink} style={styles.copyBtn}>
            📋 Copy Room Link
          </button>
          <button onClick={leaveRoom} style={styles.leaveBtn}>
            Leave Meeting
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      
      {loading && <div style={styles.loading}>Joining meeting...</div>}

      {!loading && (
        <div style={styles.videoSection}>
          <div style={styles.localVideo}>
            <div id="local-video" style={styles.videoPlayer}></div>
            <div style={styles.videoLabel}>You {!videoEnabled && '(Video Off)'}</div>
          </div>
          
          <div id="remote-videos" style={styles.remoteVideos}></div>
        </div>
      )}

      <div style={styles.controls}>
        <button 
          onClick={toggleVideo} 
          style={{...styles.controlBtn, backgroundColor: videoEnabled ? '#3b82f6' : '#ef4444'}}
        >
          {videoEnabled ? '📹 Video On' : '📹 Video Off'}
        </button>
        <button 
          onClick={toggleAudio}
          style={{...styles.controlBtn, backgroundColor: audioEnabled ? '#3b82f6' : '#ef4444'}}
        >
          {audioEnabled ? '🎙️ Mic On' : '🎙️ Mic Off'}
        </button>
        <button 
          onClick={openWhiteboard}
          style={{...styles.controlBtn, backgroundColor: '#10b981'}}
          disabled={whiteboardVisible}
        >
          {whiteboardVisible ? '✏️ Whiteboard Active' : '✏️ Open Whiteboard'}
        </button>
      </div>

      {whiteboardVisible && (
        <div style={styles.whiteboardOverlay}>
          <div style={styles.whiteboardHeader}>
            <div style={styles.whiteboardHeaderLeft}>
              <h3 style={styles.whiteboardTitle}>🎨 Drawing Mode Active</h3>
              
              {/* Drawing Tools */}
              <div style={styles.toolsContainer}>
                {/* Tool Selection */}
                <button
                  onClick={() => changeTool('pencil')}
                  style={{
                    ...styles.toolBtn,
                    backgroundColor: selectedTool === 'pencil' ? '#10b981' : '#374151'
                  }}
                  title="Pencil"
                >
                  ✏️
                </button>
                <button
                  onClick={() => changeTool('eraser')}
                  style={{
                    ...styles.toolBtn,
                    backgroundColor: selectedTool === 'eraser' ? '#10b981' : '#374151'
                  }}
                  title="Eraser"
                >
                  🧹
                </button>
                <button
                  onClick={clearWhiteboard}
                  style={{...styles.toolBtn, backgroundColor: '#374151'}}
                  title="Clear All"
                >
                  🗑️
                </button>
                
                {/* Color Picker */}
                <div style={styles.colorPickerContainer}>
                  <button
                    onClick={() => changeColor([255, 0, 0])}
                    style={{...styles.colorBtn, backgroundColor: 'rgb(255, 0, 0)'}}
                    title="Red"
                  />
                  <button
                    onClick={() => changeColor([0, 0, 255])}
                    style={{...styles.colorBtn, backgroundColor: 'rgb(0, 0, 255)'}}
                    title="Blue"
                  />
                  <button
                    onClick={() => changeColor([0, 255, 0])}
                    style={{...styles.colorBtn, backgroundColor: 'rgb(0, 255, 0)'}}
                    title="Green"
                  />
                  <button
                    onClick={() => changeColor([255, 255, 0])}
                    style={{...styles.colorBtn, backgroundColor: 'rgb(255, 255, 0)'}}
                    title="Yellow"
                  />
                  <button
                    onClick={() => changeColor([255, 0, 255])}
                    style={{...styles.colorBtn, backgroundColor: 'rgb(255, 0, 255)'}}
                    title="Magenta"
                  />
                  <button
                    onClick={() => changeColor([0, 0, 0])}
                    style={{...styles.colorBtn, backgroundColor: 'rgb(0, 0, 0)', border: '2px solid white'}}
                    title="Black"
                  />
                  <button
                    onClick={() => changeColor([255, 255, 255])}
                    style={{...styles.colorBtn, backgroundColor: 'rgb(255, 255, 255)', border: '2px solid #666'}}
                    title="White"
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={closeWhiteboard}
              style={styles.closeWhiteboardBtn}
            >
              ✕ Close Whiteboard
            </button>
          </div>
          <div id="whiteboard" style={styles.whiteboardCanvas}></div>
        </div>
      )}
      {/* ================= TEST PANEL ================= */}
<div style={{
  marginTop: "30px",
  padding: "20px",
  background: "#020617",
  border: "1px solid #334155",
  borderRadius: "12px",
  color: "#e5e7eb",
  fontSize: "14px"
}}>
  <h2 style={{ color: "#22c55e" }}>🧪 Testing Panel (For External Testers)</h2>

  {/* RTC INFO */}
  {rtcDebug && (
    <>
      <h3 style={{ color: "#38bdf8" }}>🎥 Agora Video (RTC)</h3>
      <p><b>App ID:</b> {rtcDebug.appId}</p>
      <p><b>Room ID (Channel):</b> {roomId}</p>
      <p><b>UID:</b> {rtcDebug.uid}</p>
      <p><b>Expires In:</b> {rtcDebug.expiresIn} sec</p>

      <label><b>RTC Token:</b></label>
      <textarea
        readOnly
        value={rtcDebug.token || "NO TOKEN (APP CERT DISABLED)"}
        style={{
          width: "100%",
          height: "80px",
          marginTop: "6px",
          background: "#020617",
          color: "#38bdf8",
          border: "1px solid #334155",
          borderRadius: "6px",
          padding: "8px"
        }}
      />
    </>
  )}

  {/* WHITEBOARD INFO */}
  {whiteboardDebug && (
    <>
      <h3 style={{ color: "#facc15", marginTop: "20px" }}>🎨 Agora Whiteboard</h3>
      <p><b>Room UUID:</b> {whiteboardDebug.roomUUID}</p>
      <p><b>App Identifier:</b> {whiteboardDebug.appIdentifier}</p>
      <p><b>Region:</b> {whiteboardDebug.region}</p>

      <label><b>Room Token:</b></label>
      <textarea
        readOnly
        value={whiteboardDebug.roomToken}
        style={{
          width: "100%",
          height: "80px",
          marginTop: "6px",
          background: "#020617",
          color: "#facc15",
          border: "1px solid #334155",
          borderRadius: "6px",
          padding: "8px"
        }}
      />
    </>
  )}
</div>
{/* ================= END TEST PANEL ================= */}

    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    padding: '20px',
    color: '#f1f5f9'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  title: {
    margin: 0,
    fontSize: '28px'
  },
  headerButtons: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  copyBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#10b981',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600'
  },
  leaveBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#ef4444',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600'
  },
  roomId: {
    color: '#94a3b8',
    fontSize: '14px',
    margin: '5px 0 0 0'
  },
  participants: {
    color: '#10b981',
    fontSize: '14px',
    margin: '5px 0 0 0',
    fontWeight: '600'
  },
  error: {
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  loading: {
    color: '#60a5fa',
    fontSize: '18px',
    textAlign: 'center',
    padding: '40px'
  },
  videoSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  localVideo: {
    position: 'relative',
    width: '100%',
    aspectRatio: '4/3'
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
  },
  videoLabel: {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    zIndex: 1
  },
  remoteVideos: {
    display: 'contents'
  },
  controls: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  controlBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  },
  whiteboardOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column'
  },
  whiteboardHeader: {
    pointerEvents: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    flexWrap: 'wrap',
    gap: '16px'
  },
  whiteboardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap'
  },
  whiteboardTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#10b981',
    fontWeight: '600'
  },
  toolsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  toolBtn: {
    width: '40px',
    height: '40px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  colorPickerContainer: {
    display: 'flex',
    gap: '8px',
    paddingLeft: '12px',
    borderLeft: '1px solid rgba(148, 163, 184, 0.3)'
  },
  colorBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  },
  closeWhiteboardBtn: {
    background: '#ef4444',
    border: 'none',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  whiteboardCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
    pointerEvents: 'auto',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent so videos show through
    cursor: 'crosshair'
  }
}

