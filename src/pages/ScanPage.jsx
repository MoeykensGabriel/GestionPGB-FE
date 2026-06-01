import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scanBarcode } from '../api/movements'
import { getProductByBarcode } from '../api/products'
import { useSignalR } from '../hooks/useSignalR'
import { IconArrowRight } from '../components/Icons'
import { QK } from '../utils/queryKeys'

const CSS = `
  /* ── Mode buttons ── */
  .sp-mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .sp-mode-btn {
    padding: 20px 12px 16px;
    border: 4px solid var(--border);
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    border-radius: 0;
    transition: box-shadow 0.1s, transform 0.1s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }
  .sp-mode-sub {
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.18em;
    opacity: 0.65;
  }
  .sp-mode-btn.inactive {
    background: var(--bg-primary);
    color: var(--text-secondary);
    box-shadow: none;
  }
  .sp-mode-btn.inactive:hover { color: var(--text-tertiary); background: var(--overlay-hover); }
  .sp-mode-btn.entrada {
    background: var(--success);
    color: #002010;
    box-shadow: 4px 4px 0 0 var(--border);
  }
  .sp-mode-btn.entrada:active { transform: translate(2px,2px); box-shadow: 0 0 0 0 var(--border); }
  .sp-mode-btn.salida {
    background: var(--error);
    color: var(--error-light);
    box-shadow: 4px 4px 0 0 var(--border);
  }
  .sp-mode-btn.salida:active { transform: translate(2px,2px); box-shadow: 0 0 0 0 var(--border); }

  /* Consulta — modo de solo lectura, color informativo (azul) y full-width */
  .sp-mode-consulta { width: 100%; margin-top: 10px; }
  .sp-mode-btn.consulta {
    background: #3b82f6;
    color: #f0f6ff;
    box-shadow: 4px 4px 0 0 var(--border);
  }
  .sp-mode-btn.consulta:active { transform: translate(2px,2px); box-shadow: 0 0 0 0 var(--border); }

  /* ── Result card ── */
  .sp-result {
    border: 4px solid var(--border);
    padding: 18px 20px;
  }
  .sp-result.entrada { background: var(--overlay); border-left-color: var(--success); }
  .sp-result.salida  { background: var(--overlay); border-left-color: var(--error); }
  .sp-result.consulta { background: var(--overlay); border-left: 6px solid #3b82f6; }
  .sp-result-type {
    font-size: 9px; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; margin-bottom: 7px;
  }
  .sp-result.entrada .sp-result-type { color: var(--success); }
  .sp-result.salida  .sp-result-type { color: var(--error-light); }
  .sp-result.consulta .sp-result-type { color: #3b82f6; }

  /* Chips de metadata en consulta (código, proveedor, stock bajo) */
  .sp-consulta-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .sp-consulta-chip {
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; padding: 5px 10px;
    border: 2px solid var(--border); background: var(--bg-primary);
    color: var(--text-secondary); font-family: 'Courier New', monospace;
  }
  .sp-consulta-chip.low {
    border-color: var(--error); color: var(--error-light);
    background: var(--overlay); font-family: 'Inter', system-ui, sans-serif;
  }
  .sp-result-name {
    font-size: 15px; font-weight: 800; color: var(--text-primary);
    margin-bottom: 14px; letter-spacing: -0.01em; line-height: 1.2;
  }
  .sp-result-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    border: 3px solid var(--border);
  }
  .sp-result-cell {
    padding: 10px 14px;
    background: var(--overlay);
  }
  .sp-result-cell:first-child { border-right: 3px solid var(--border); }
  .sp-result-cell-lbl {
    font-size: 8px; font-weight: 700; letter-spacing: 0.15em;
    text-transform: uppercase; color: var(--text-secondary); margin-bottom: 5px;
  }
  .sp-result-cell-val {
    font-size: 32px; font-weight: 900; letter-spacing: -0.03em;
    line-height: 1; font-variant-numeric: tabular-nums; color: var(--text-primary);
  }
  @media (min-width: 768px) {
    .sp-result-cell-val { font-size: 44px; }
    .sp-result-name { font-size: 18px; }
    .sp-result { padding: 22px 26px; }
  }

  /* ── Input area ── */
  .sp-input-wrap {
    background: var(--bg-primary); border: 4px solid var(--border);
    box-shadow: 4px 4px 0 0 var(--border);
  }
  .sp-input-hd {
    padding: 9px 16px; border-bottom: 4px solid var(--border);
    font-size: 9px; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--accent); background: var(--bg-secondary);
  }
  .sp-input-body { padding: 14px; display: flex; gap: 10px; }
  .sp-bc-input {
    flex: 1; height: 52px; padding: 0 14px;
    font-family: 'Courier New', monospace; font-size: 16px; font-weight: 700;
    color: var(--accent); background: var(--bg-secondary);
    border: 4px solid var(--border); box-shadow: inset 3px 3px 0 0 var(--border);
    outline: none; border-radius: 0; caret-color: var(--accent);
    transition: border-color 0.15s;
  }
  .sp-bc-input::placeholder { color: var(--text-tertiary); }
  .sp-bc-input:focus { border-color: var(--accent); }
  @media (min-width: 768px) {
    .sp-bc-input { height: 60px; font-size: 20px; }
    .sp-input-body { padding: 16px; }
  }

  /* ── Connection badge ── */
  .sp-conn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 10px; border: 3px solid var(--border);
    font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
  }
  .sp-conn.on  { background: var(--overlay); color: var(--success); }
  .sp-conn.off { background: var(--overlay); color: var(--text-secondary); }
  .sp-conn-dot { width: 6px; height: 6px; flex-shrink: 0; }
  .sp-conn.on .sp-conn-dot { background: var(--success); animation: sp-blink 1.5s step-end infinite; }
  .sp-conn.off .sp-conn-dot { background: var(--text-secondary); }
  @keyframes sp-blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* ── Session log ── */
  .sp-log {
    width: 255px; flex-shrink: 0; background: var(--bg-primary);
    border: 4px solid var(--border); box-shadow: 4px 4px 0 0 var(--border);
    display: flex; flex-direction: column;
  }
  .sp-log-hd {
    padding: 10px 14px; border-bottom: 4px solid var(--border); background: var(--bg-secondary);
    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  }
  .sp-log-title { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); }
  .sp-log-count { font-size: 9px; font-weight: 700; color: var(--text-secondary); }
  .sp-log-body { flex: 1; overflow-y: auto; min-height: 0; }
  .sp-log-row {
    padding: 10px 14px; border-bottom: 1px solid var(--overlay);
    display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
  }
  .sp-log-row:last-child { border-bottom: none; }
  .sp-log-name { font-size: 12px; font-weight: 700; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sp-log-sub { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px; }
  .sp-log-qty { font-size: 15px; font-weight: 900; font-variant-numeric: tabular-nums; flex-shrink: 0; }
  .sp-log-ft { padding: 8px 14px; border-top: 4px solid var(--border); flex-shrink: 0; }
  .sp-log-clear {
    background: none; border: none; cursor: pointer;
    font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--text-secondary); transition: color 0.15s; padding: 0; font-family: 'Inter', system-ui, sans-serif;
  }
  .sp-log-clear:hover { color: var(--text-tertiary); }
`

export default function ScanPage() {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState('ENTRADA')
  const [barcode, setBarcode] = useState('')
  const [lastResult, setLastResult] = useState(null)
  const [consultaResult, setConsultaResult] = useState(null)
  const [error, setError] = useState('')
  const [sessionLog, setSessionLog] = useState([])
  const [resultKey, setResultKey] = useState(0)
  const inputRef = useRef(null)

  // Ref del modo actual — lo usan los handlers de SignalR (closures estables)
  // para no pisar la consulta local con eventos remotos.
  const modeRef = useRef(mode)
  useEffect(() => { modeRef.current = mode }, [mode])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement
      const tag = active?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active?.isContentEditable) return
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Evita duplicar el mismo movimiento si este dispositivo ya lo agregó vía mutation
  const addToLog = (data) =>
    setSessionLog(prev => {
      if (prev.length > 0 && prev[0].id === data.id) return prev
      return [{ ...data, ts: Date.now() }, ...prev].slice(0, 30)
    })

  const { isConnected, sendSetMode } = useSignalR({
    onModeChanged: (newMode) => {
      // Si estoy consultando localmente, ignoro cambios de modo remotos
      // para no sacar al operario de su búsqueda.
      if (modeRef.current === 'CONSULTA') return
      setMode(newMode); setError('')
    },
    // Muestra el resultado en todos los dispositivos conectados, no solo el que escaneó
    onStockUpdated: (data) => {
      // En modo consulta no piso mi resultado con scans de otros dispositivos
      if (modeRef.current === 'CONSULTA') return
      setLastResult(data)
      setResultKey(k => k + 1)
      addToLog(data)
    },
  })

  const handleModeChange = (newMode) => {
    setMode(newMode)
    setError('')
    setConsultaResult(null)
    // CONSULTA es un modo local de solo lectura — no se difunde a otros dispositivos.
    if (newMode !== 'CONSULTA') sendSetMode(newMode)
  }

  const mutation = useMutation({
    mutationFn: scanBarcode,
    onSuccess: ({ data }) => {
      setLastResult(data)
      setResultKey(k => k + 1)
      setError('')
      addToLog(data)
      setBarcode('')
      queryClient.invalidateQueries({ queryKey: QK.products })
      queryClient.invalidateQueries({ queryKey: QK.movements })
      setTimeout(() => inputRef.current?.focus(), 80)
    },
    onError: (err) => {
      const detail = err?.response?.data?.detail
      setError(detail ?? 'Producto no encontrado')
      setBarcode('')
      setTimeout(() => inputRef.current?.focus(), 80)
    },
  })

  // Modo consulta: solo lectura, NO altera stock. Llama al endpoint de búsqueda por código.
  const consultaMutation = useMutation({
    mutationFn: (value) => getProductByBarcode(value),
    onSuccess: ({ data }) => {
      setConsultaResult(data)
      setResultKey(k => k + 1)
      setError('')
      setBarcode('')
      setTimeout(() => inputRef.current?.focus(), 80)
    },
    onError: () => {
      setConsultaResult(null)
      setError('Código no encontrado en el sistema')
      setBarcode('')
      setTimeout(() => inputRef.current?.focus(), 80)
    },
  })

  const handleScan = (e) => {
    e.preventDefault()
    const raw = inputRef.current?.value ?? barcode
    const value = raw.replace(/[\r\n\t]/g, '').trim()
    if (!value) return

    setBarcode('')
    if (inputRef.current) inputRef.current.value = ''

    if (mode === 'CONSULTA') {
      consultaMutation.mutate(value)
    } else {
      mutation.mutate({ barcode: value, type: mode })
    }
  }

  const resultClass = (lastResult?.type ?? 'ENTRADA').toLowerCase()
  const isPending = mutation.isPending || consultaMutation.isPending

  return (
    <>
      <style>{CSS}</style>
      <div className="ds-page">

        {/* Header */}
        <div className="ds-page-hd">
          <h2 className="ds-page-title">Escanear</h2>
          <div className={`sp-conn ${isConnected ? 'on' : 'off'}`}>
            <div className="sp-conn-dot" />
            {isConnected ? 'En vivo' : 'Sin conexión'}
          </div>
        </div>

        <div className="sp-cols">

          {/* Left: controls */}
          <div className="sp-left">

            {/* Mode buttons */}
            <div className="sp-mode-grid">
              {['ENTRADA', 'SALIDA'].map((m) => {
                const active = mode === m
                return (
                  <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    className={`sp-mode-btn ${active ? m.toLowerCase() : 'inactive'}`}
                  >
                    <span className="sp-mode-sub">{active ? 'Modo activo' : 'Cambiar a'}</span>
                    {m}
                  </button>
                )
              })}
            </div>

            {/* Consulta: modo de solo lectura, separado de los que mueven stock */}
            <button
              onClick={() => handleModeChange('CONSULTA')}
              className={`sp-mode-btn sp-mode-consulta ${mode === 'CONSULTA' ? 'consulta' : 'inactive'}`}
            >
              <span className="sp-mode-sub">{mode === 'CONSULTA' ? 'Modo activo · no altera stock' : 'Cambiar a · solo consultar'}</span>
              CONSULTA
            </button>

            {/* Result area */}
            {mode === 'CONSULTA' ? (
              consultaResult ? (
                <div key={resultKey} className="sp-result scan-result consulta">
                  <p className="sp-result-type">Consulta · solo lectura</p>
                  <p className="sp-result-name">{consultaResult.itemName}</p>
                  <div className="sp-result-grid">
                    <div className="sp-result-cell">
                      <p className="sp-result-cell-lbl">Stock actual</p>
                      <p className="sp-result-cell-val tabular">{consultaResult.currentStock}</p>
                    </div>
                    <div className="sp-result-cell">
                      <p className="sp-result-cell-lbl">Disponible</p>
                      <p className="sp-result-cell-val tabular">{consultaResult.availableStock}</p>
                    </div>
                  </div>
                  <div className="sp-consulta-meta">
                    <span className="sp-consulta-chip">{consultaResult.barcode}</span>
                    {consultaResult.providerName && (
                      <span className="sp-consulta-chip">{consultaResult.providerName}</span>
                    )}
                    {consultaResult.isLowStock && (
                      <span className="sp-consulta-chip low">Stock bajo</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="sp-placeholder">Escaneá una bolsa para identificar el componente...</div>
              )
            ) : (
              lastResult ? (
                <div key={resultKey} className={`sp-result scan-result ${resultClass}`}>
                  <p className="sp-result-type">Último escaneo · {lastResult.type}</p>
                  <p className="sp-result-name">{lastResult.productName}</p>
                  <div className="sp-result-grid">
                    <div className="sp-result-cell">
                      <p className="sp-result-cell-lbl">Movimiento</p>
                      <p className="sp-result-cell-val tabular">
                        {lastResult.quantity > 0 ? `+${lastResult.quantity}` : lastResult.quantity}
                      </p>
                    </div>
                    <div className="sp-result-cell">
                      <p className="sp-result-cell-lbl">Stock actual</p>
                      <p className="sp-result-cell-val tabular">{lastResult.currentStock}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="sp-placeholder">Esperando escaneo...</div>
              )
            )}

            {/* Barcode form */}
            <div className="sp-input-wrap">
              <div className="sp-input-hd">Código de barras</div>
              <div className="sp-input-body">
                <form onSubmit={handleScan} style={{ display: 'flex', gap: 10, flex: 1 }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Esperando lector..."
                    className="sp-bc-input"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="ds-btn"
                    style={{ height: 52, minWidth: 68, flexShrink: 0 }}
                  >
                    {isPending
                      ? '...'
                      : <><span>OK</span><IconArrowRight style={{ width: 14, height: 14 }} /></>
                    }
                  </button>
                </form>
              </div>
              {error && (
                <div style={{ padding: '0 14px 14px' }}>
                  <p className="ds-msg-error">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Session log — desktop (via CSS) */}
          <div className="sp-log" id="sp-log-desktop">
            <LogPanel log={sessionLog} onClear={() => setSessionLog([])} />
          </div>
        </div>

        {/* Session log — mobile */}
        {sessionLog.length > 0 && (
          <div className="sp-mob-log" id="sp-log-mobile">
            <div className="sp-mob-log-hd">Sesión actual · {sessionLog.length}</div>
            {sessionLog.slice(0, 5).map((entry, i) => (
              <div key={i} className="sp-mob-row">
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.productName}
                  </p>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: entry.type === 'ENTRADA' ? '#4ae176' : '#ff6b6b', marginTop: 2 }}>
                    {entry.type}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <p style={{ fontSize: 17, fontWeight: 900, color: entry.type === 'ENTRADA' ? '#4ae176' : '#ff6b6b', fontVariantNumeric: 'tabular-nums' }}>
                    {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700 }}>stk {entry.currentStock}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  )
}

function LogPanel({ log, onClear }) {
  return (
    <>
      <div className="sp-log-hd">
        <p className="sp-log-title">Sesión</p>
        {log.length > 0 && <p className="sp-log-count">{log.length}</p>}
      </div>
      <div className="sp-log-body">
        {log.length === 0 ? (
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1e2a3a', padding: '28px 14px', textAlign: 'center' }}>
            Sin movimientos
          </p>
        ) : (
          log.map((entry, i) => (
            <div key={i} className="sp-log-row">
              <div style={{ minWidth: 0, flex: 1 }}>
                <p className="sp-log-name">{entry.productName}</p>
                <p className="sp-log-sub" style={{ color: entry.type === 'ENTRADA' ? '#4ae176' : '#ff6b6b' }}>
                  {entry.type} · {entry.currentStock}
                </p>
              </div>
              <p className="sp-log-qty" style={{ color: entry.type === 'ENTRADA' ? '#4ae176' : '#ff6b6b' }}>
                {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
              </p>
            </div>
          ))
        )}
      </div>
      {log.length > 0 && (
        <div className="sp-log-ft">
          <button onClick={onClear} className="sp-log-clear">Limpiar</button>
        </div>
      )}
    </>
  )
}
