import { useEffect, useRef, useState, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'

const HUB_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5122'}/hubs/stock`

/**
 * Conecta al StockHub de SignalR y expone métodos para enviar eventos al servidor.
 *
 * @param {object} handlers
 * @param {(mode: string) => void} [handlers.onModeChanged]   - El otro dispositivo cambió el modo
 * @param {(data: object) => void} [handlers.onStockUpdated]  - El backend procesó un movimiento
 */
export function useSignalR(handlers = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const connectionRef = useRef(null)
  // handlersRef evita recrear la conexión cuando cambian los callbacks
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('token') ?? '',
        // Intenta WebSockets primero; si el proxy los bloquea, cae a Long Polling.
        // Server-Sent Events se omite: Railway lo cierra antes de los 60s.
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      // Reintentos: inmediato, 2s, 5s, 10s, 30s
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    // Registrar handlers una sola vez; los callbacks actuales se leen desde la ref
    connection.on('ModeChanged', (mode) => handlersRef.current.onModeChanged?.(mode))
    connection.on('StockUpdated', (data) => handlersRef.current.onStockUpdated?.(data))

    connectionRef.current = connection

    connection
      .start()
      .then(() => setIsConnected(true))
      .catch((err) => console.error('[SignalR] Error al conectar:', err))

    connection.onreconnected(() => setIsConnected(true))
    connection.onreconnecting(() => setIsConnected(false))
    connection.onclose(() => setIsConnected(false))

    return () => {
      connection.stop()
    }
  }, []) // Solo al montar/desmontar

  /** Notifica al resto de clientes que este dispositivo cambió el modo */
  const sendSetMode = useCallback(async (mode) => {
    const conn = connectionRef.current
    if (conn?.state === signalR.HubConnectionState.Connected) {
      try {
        await conn.invoke('SetMode', mode)
      } catch (err) {
        console.error('[SignalR] SetMode error:', err)
      }
    }
  }, [])

  return { isConnected, sendSetMode }
}
