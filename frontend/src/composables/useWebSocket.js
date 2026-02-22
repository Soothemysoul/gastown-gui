/**
 * useWebSocket composable — WebSocket client with exponential backoff reconnect
 *
 * Ported from WebSocketClient class in js/api.js (lines 337-425)
 * and handleWebSocketMessage from js/app.js (lines 295-372).
 *
 * Dispatches incoming messages to the appropriate Pinia stores.
 */

import { ref, onUnmounted } from 'vue'
import { useStatusStore } from '../stores/statusStore'
import { useConvoyStore } from '../stores/convoyStore'
import { useEventStore } from '../stores/eventStore'
import { useWorkStore } from '../stores/workStore'
import { useMailStore } from '../stores/mailStore'

const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss' : 'ws'
const WS_URL = `${WS_PROTOCOL}://${window.location.host}/ws`

const MAX_RECONNECT_ATTEMPTS = 10
const BASE_RECONNECT_DELAY = 1000

// Singleton state shared across all callers
let socket = null
let reconnectAttempts = 0
let reconnectTimer = null
let refCount = 0

const isConnected = ref(false)
const connectionStatus = ref('disconnected') // 'disconnected' | 'connecting' | 'connected' | 'error'

function handleMessage(event) {
  let message
  try {
    message = JSON.parse(event.data)
  } catch {
    console.error('[WS] Parse error:', event.data)
    return
  }

  const statusStore = useStatusStore()
  const convoyStore = useConvoyStore()
  const eventStore = useEventStore()

  switch (message.type) {
    case 'status':
      statusStore.setStatus(message.data)
      break

    case 'activity':
      eventStore.addEvent(message.data)
      break

    case 'convoy_created':
    case 'convoy_updated':
      convoyStore.updateConvoy(message.data)
      break

    case 'work_slung':
      convoyStore.fetchConvoys()
      break

    case 'bead_created': {
      const workStore = useWorkStore()
      workStore.fetchBeads()
      break
    }

    case 'rig_added':
    case 'rig_removed':
      statusStore.fetchStatus(true)
      break

    case 'mayor_message':
      eventStore.addEvent({
        id: message.data.id,
        type: 'mayor_message',
        timestamp: message.data.timestamp,
        target: message.data.target,
        message: message.data.message,
        status: message.data.status,
        response: message.data.response,
      })
      break

    case 'service_started':
      if (message.data?.autoStarted) {
        eventStore.addEvent({
          id: Date.now().toString(36),
          type: 'mayor_started',
          timestamp: new Date().toISOString(),
          autoStarted: true,
          service: message.data.service,
        })
      }
      statusStore.fetchStatus()
      break

    case 'mail_received': {
      const mailStore = useMailStore()
      mailStore.fetchMail()
      break
    }

    default:
      console.log('[WS] Unknown message type:', message.type)
  }
}

function attemptReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('[WS] Max reconnect attempts reached')
    connectionStatus.value = 'error'
    return
  }

  reconnectAttempts++
  const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1)
  console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`)

  reconnectTimer = setTimeout(() => connect(), delay)
}

function connect() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return
  }

  connectionStatus.value = 'connecting'

  try {
    socket = new WebSocket(WS_URL)

    socket.onopen = () => {
      reconnectAttempts = 0
      isConnected.value = true
      connectionStatus.value = 'connected'
      console.log('[WS] Connected')
    }

    socket.onclose = () => {
      isConnected.value = false
      connectionStatus.value = 'disconnected'
      console.log('[WS] Disconnected')
      if (refCount > 0) {
        attemptReconnect()
      }
    }

    socket.onerror = () => {
      connectionStatus.value = 'error'
      console.error('[WS] Connection error')
    }

    socket.onmessage = handleMessage
  } catch (err) {
    console.error('[WS] Connection error:', err)
    attemptReconnect()
  }
}

function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  reconnectAttempts = MAX_RECONNECT_ATTEMPTS // prevent auto-reconnect
  if (socket) {
    socket.close()
    socket = null
  }
  isConnected.value = false
  connectionStatus.value = 'disconnected'
}

function send(data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data))
  } else {
    console.warn('[WS] Cannot send — not connected')
  }
}

export function useWebSocket() {
  // Ref-count: connect on first consumer, disconnect when last unmounts
  if (refCount === 0) {
    connect()
  }
  refCount++

  onUnmounted(() => {
    refCount--
    if (refCount <= 0) {
      refCount = 0
      disconnect()
    }
  })

  return {
    isConnected,
    connectionStatus,
    send,
    connect,
    disconnect,
  }
}
