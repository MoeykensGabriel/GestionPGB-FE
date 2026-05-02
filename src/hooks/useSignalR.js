import { useEffect, useRef } from 'react'
import { useSignalRContext } from '../context/SignalRContext'

/**
 * Suscribe handlers a la conexión global de SignalR (una sola conexión para toda la app).
 *
 * @param {object} handlers
 * @param {(mode: string) => void} [handlers.onModeChanged]
 * @param {(data: object) => void} [handlers.onStockUpdated]
 */
export function useSignalR(handlers = {}) {
  const ctx = useSignalRContext()
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!ctx) return
    const unsubs = [
      ctx.subscribe('ModeChanged',  (d) => handlersRef.current.onModeChanged?.(d)),
      ctx.subscribe('StockUpdated', (d) => handlersRef.current.onStockUpdated?.(d)),
    ]
    return () => unsubs.forEach(fn => fn())
  }, [ctx])

  return {
    isConnected: ctx?.isConnected ?? false,
    sendSetMode: ctx?.sendSetMode ?? (() => {}),
  }
}
