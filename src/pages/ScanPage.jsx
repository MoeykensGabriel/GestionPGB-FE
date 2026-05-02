import { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scanBarcode } from '../api/movements'
import { useSignalR } from '../hooks/useSignalR'
import { IconArrowRight } from '../components/Icons'
import { QK } from '../utils/queryKeys'

const CSS = `
  /* ── Mode buttons ── */
  .sp-mode-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .sp-mode-btn {
    padding: 20px 12px 16px;
    border: 4px solid #000;
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
    background: #09090b;
    color: #3d4f66;
    box-shadow: none;
  }
  .sp-mode-btn.inactive:hover { color: #9a9078; background: rgba(255,255,255,0.04); }
  .sp-mode-btn.entrada {
    background: #4ae176;
    color: #002010;
    box-shadow: 4px 4px 0 0 rgba(0,0,0,1);
  }
  .sp-mode-btn.entrada:active { transform: translate(2px,2px); box-shadow: 0 0 0 0 rgba(0,0,0,1); }
  .sp-mode-btn.salida {
    background: #93000a;
    color: #ffdad6;
    box-shadow: 4px 4px 0 0 rgba(0,0,0,1);
  }
  .sp-mode-btn.salida:active { transform: translate(2px,2px); box-shadow: 0 0 0 0 rgba(0,0,0,1); }

  /* ── Result card ── */
  .sp-result {
    border: 4px solid #000;
    padding: 18px 20px;
  }
  .sp-result.entrada { background: rgba(74,225,118,0.08); border-left-color: #4ae176; }
  .sp-result.salida  { background: rgba(147,0,10,0.15);   border-left-color: #ff3b30; }
  .sp-result-type {
    font-size: 9px; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; margin-bottom: 7px;
  }
  .sp-result.entrada .sp-result-type { color: #4ae176; }
  .sp-result.salida  .sp-result-type { color: #ff6b6b; }
  .sp-result-name {
    font-size: 15px; font-weight: 800; color: #fff;
    margin-bottom: 14px; letter-spacing: -0.01em; line-height: 1.2;
  }
  .sp-result-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    border: 3px solid rgba(0,0,0,0.6);
  }
  .sp-result-cell {
    padding: 10px 14px;
    background: rgba(0,0,0,0.22);
  }
  .sp-result-cell:first-child { border-right: 3px solid rgba(0,0,0,0.6); }
  .sp-result-cell-lbl {
    font-size: 8px; font-weight: 700; letter-spacing: 0.15em;
    text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 5px;
  }
  .sp-result-cell-val {
    font-size: 32px; font-weight: 900; letter-spacing: -0.03em;
    line-height: 1; font-variant-numeric: tabular-nums; color: #fff;
  }
  @media (min-width: 768px) {
    .sp-result-cell-val { font-size: 44px; }
    .sp-result-name { font-size: 18px; }
    .sp-result { padding: 22px 26px; }
  }

  /* ── Input area ── */
  .sp-input-wrap {
    background: #09090b; border: 4px solid #000;
    box-shadow: 4px 4px 0 0 rgba(0,0,0,1);
  }
  .sp-input-hd {
    padding: 9px 16px; border-bottom: 4px solid #000;
    font-size: 9px; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #facc15; background: #0c1322;
  }
  .sp-input-body { padding: 14px; display: flex; gap: 10px; }
  .sp-bc-input {
    flex: 1; height: 52px; padding: 0 14px;
    font-family: 'Courier New', monospace; font-size: 16px; font-weight: 700;
    color: #facc15; background: #0c1322;
    border: 4px solid #000; box-shadow: inset 3px 3px 0 0 rgba(0,0,0,1);
    outline: none; border-radius: 0; caret-color: #facc15;
    transition: border-color 0.15s;
  }
  .sp-bc-input::placeholder { color: #1e2a3a; }
  .sp-bc-input:focus { border-color: #facc15; }
  @media (min-width: 768px) {
    .sp-bc-input { height: 60px; font-size: 20px; }
    .sp-input-body { padding: 16px; }
  }

  /* ── Connection badge ── */
  .sp-conn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 10px; border: 3px solid rgba(0,0,0,0.6);
    font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
  }
  .sp-conn.on  { background: rgba(74,225,118,0.1); color: #4ae176; }
  .sp-conn.off { background: rgba(255,255,255,0.04); color: #3d4f66; }
  .sp-conn-dot { width: 6px; height: 6px; flex-shrink: 0; }
  .sp-conn.on .sp-conn-dot { background: #4ae176; animation: sp-blink 1.5s step-end infinite; }
  .sp-conn.off .sp-conn-dot { background: #3d4f66; }
  @keyframes sp-blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* ── Session log ── */
  .sp-log {
    width: 255px; flex-shrink: 0; background: #09090b;
    border: 4px solid #000; box-shadow: 4px 4px 0 0 rgba(0,0,0,1);
    display: flex; flex-direction: column;
  }
  .sp-log-hd {
    padding: 10px 14px; border-bottom: 4px solid #000; background: #0c1322;
    display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
  }
  .sp-log-title { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #facc15; }
  .sp-log-count { font-size: 9px; font-weight: 700; color: #4d5a72; }
  .sp-log-body { flex: 1; overflow-y: auto; min-height: 0; }
  .sp-log-row {
    padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04);
    display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
  }
  .sp-log-row:last-child { border-bottom: none; }
  .sp-log-name { font-size: 12px; font-weight: 700; color: #dce2f7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sp-log-sub { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px; }
  .sp-log-qty { font-size: 15px; font-weight: 900; font-variant-numeric: tabular-nums; flex-shrink: 0; }
  .sp-log-ft { padding: 8px 14px; border-top: 4px solid #000; flex-shrink: 0; }
  .sp-log-clear {
    background: none; border: none; cursor: pointer;
    font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
    color: #2e3545; transition: color 0.15s; padding: 0; font-family: 'Inter', system-ui, sans-serif;
  }
  .sp-log-clear:hover { color: #9a9078; }

  /* ── Layout ── */
  .sp-cols { display: flex; gap: 14px; flex-direction: column; }
  .sp-left { flex: 1; display: flex; flex-direction: column; gap: 10px; }
  @media (min-width: 768px) { .sp-cols { flex-direction: row; align-items: flex-start; } }

  /* ── Empty placeholder ── */
  .sp-placeholder {
    border: 4px dashed rgba(255,255,255,0.07);
    padding: 32px 20px; text-align: center;
    font-size: 10px; font-weight: 700; letter-spacing: 0.15em;
    text-transform: uppercase; color: #1e2a3a;
  }

  /* ── Mobile log ── */
  .sp-mob-log { background: #09090b; border: 4px solid #000; box-shadow: 4px 4px 0 0 rgba(0,0,0,1); }
  .sp-mob-log-hd {
    padding: 10px 14px; border-bottom: 4px solid #000; background: #0c1322;
    font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #facc15;
  }
  .sp-mob-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .sp-mob-row:last-child { border-bottom: none; }

  /* visibility */
  #sp-log-desktop { display: none; }
  #sp-log-mobile  { display: block; }
  @media (min-width: 768px) {
    #sp-log-desktop { display: flex !important; }
    #sp-log-mobile  { display: none !important; }
  }
`

export default function ScanPage() {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState('ENTRADA')
  const [barcode, setBarcode] = useState('')
  const [lastResult, setLastResult] = useState(null)
  const [error, setError] = useState('')
  const [sessionLog, setSessionLog] = useState([])
  const [resultKey, setResultKey] = useState(0)
  const inputRef = useRef(null)

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

  const addToLog = (data) =>
    setSessionLog(prev => [{ ...data, ts: Date.now() }, ...prev].slice(0, 30))

  // onStockUpdated no es necesario aquí: el Layout global ya invalida las queries.
  const { isConnected, sendSetMode } = useSignalR({
    onModeChanged: (newMode) => { setMode(newMode); setError('') },
  })

  const handleModeChange = (newMode) => { setMode(newMode); setError(''); sendSetMode(newMode) }

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

  const handleScan = (e) => {
    e.preventDefault()
    const raw = inputRef.current?.value ?? barcode
    const value = raw.replace(/[\r\n\t]/g, '').trim()
    if (!value) return

    setBarcode('')
    if (inputRef.current) inputRef.current.value = ''
    mutation.mutate({ barcode: value, type: mode })
  }

  const resultClass = (lastResult?.type ?? 'ENTRADA').toLowerCase()

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

            {/* Last result */}
            {lastResult ? (
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
                    disabled={mutation.isPending}
                    className="ds-btn"
                    style={{ height: 52, minWidth: 68, flexShrink: 0 }}
                  >
                    {mutation.isPending
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
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#dce2f7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                  <p style={{ fontSize: 11, color: '#4d5a72', fontWeight: 700 }}>stk {entry.currentStock}</p>
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
