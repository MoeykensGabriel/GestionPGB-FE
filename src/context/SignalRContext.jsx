import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import * as signalR from '@microsoft/signalr'

const HUB_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5122'}/hubs/stock`

const SignalRContext = createContext(null)

/**
 * Gestiona UNA sola conexión WebSocket. Múltiples componentes pueden
 * suscribirse a eventos sin abrir conexiones adicionales.
 */
export function SignalRProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false)
  const connectionRef = useRef(null)
  const listenersRef  = useRef({ ModeChanged: new Set(), StockUpdated: new Set() })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('token') ?? '',
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    connection.on('ModeChanged',  (d) => listenersRef.current.ModeChanged.forEach(fn => fn(d)))
    connection.on('StockUpdated', (d) => listenersRef.current.StockUpdated.forEach(fn => fn(d)))

    connectionRef.current = connection
    connection.start()
      .then(() => setIsConnected(true))
      .catch((err) => console.error('[SignalR] Error al conectar:', err))

    connection.onreconnected(() => setIsConnected(true))
    connection.onreconnecting(() => setIsConnected(false))
    connection.onclose(() => setIsConnected(false))

    return () => { connection.stop() }
  }, [])

  const subscribe = useCallback((event, fn) => {
    listenersRef.current[event]?.add(fn)
    return () => listenersRef.current[event]?.delete(fn)
  }, [])

  const sendSetMode = useCallback(async (mode) => {
    const conn = connectionRef.current
    if (conn?.state === signalR.HubConnectionState.Connected) {
      try { await conn.invoke('SetMode', mode) }
      catch (err) { console.error('[SignalR] SetMode error:', err) }
    }
  }, [])

  return (
    <SignalRContext.Provider value={{ isConnected, subscribe, sendSetMode }}>
      {children}
    </SignalRContext.Provider>
  )
}

export function useSignalRContext() {
  return useContext(SignalRContext)
}
