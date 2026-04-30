import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { IconEye, IconEyeOff, IconPerson, IconLock, IconArrowRight } from '../components/Icons'

/* ─── Diseño industrial / brutalist ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap');

  .lp-root {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    font-family: 'Inter', system-ui, sans-serif;
    background-color: #0c1322;
    color: #dce2f7;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  *, *::before, *::after { box-sizing: border-box; }

  /* ── TopBar ── */
  .lp-topbar {
    background: #09090b;
    color: #facc15;
    border-bottom: 4px solid #000;
    box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 32px;
    width: 100%;
    position: relative;
    z-index: 50;
  }

  .lp-brand {
    font-size: 22px;
    font-weight: 900;
    font-style: italic;
    letter-spacing: -0.03em;
    text-transform: uppercase;
    color: #facc15;
    margin: 0;
  }

  .lp-brand span {
    color: #ffffff;
  }

  /* ── Main container ── */
  .lp-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    gap: 20px;
  }

  /* ── Sistema badge ── */
  .lp-system-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #facc15;
    margin-bottom: 4px;
  }

  .lp-system-dot {
    width: 8px;
    height: 8px;
    background: #4ae176;
    border: 2px solid #000;
    animation: lp-blink 1.5s step-end infinite;
  }

  @keyframes lp-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  /* ── Card ── */
  .lp-card {
    width: 100%;
    max-width: 440px;
    border: 4px solid #000;
    box-shadow: 6px 6px 0px 0px rgba(0,0,0,1);
    background: #09090b;
    display: flex;
    flex-direction: column;
  }

  /* ── Card header ── */
  .lp-card-header {
    background: #0c1322;
    border-bottom: 4px solid #000;
    padding: 24px 28px 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .lp-card-title {
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -0.03em;
    text-transform: uppercase;
    color: #ffffff;
    margin: 0;
    line-height: 1;
  }

  .lp-card-title span {
    color: #facc15;
  }

  .lp-card-sub {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #9a9078;
    margin: 0;
  }

  /* ── Card body ── */
  .lp-card-body {
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* ── Field ── */
  .lp-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .lp-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #facc15;
  }

  .lp-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .lp-input-icon {
    position: absolute;
    left: 14px;
    display: flex;
    align-items: center;
    pointer-events: none;
    color: #9a9078;
  }

  .lp-input {
    width: 100%;
    height: 56px;
    padding: 0 16px 0 42px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #facc15;
    background: #0c1322;
    border: 4px solid #000;
    /* inset-well */
    box-shadow: inset 4px 4px 0px 0px rgba(0,0,0,1);
    outline: none;
    border-radius: 0;
    -webkit-appearance: none;
    transition: border-color 0.15s;
    caret-color: #facc15;
  }

  .lp-input::placeholder {
    color: #2e3545;
  }

  .lp-input:focus {
    border-color: #facc15;
  }

  .lp-input-pr {
    padding-right: 48px;
  }

  .lp-eye-btn {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    color: #9a9078;
    transition: color 0.15s;
  }

  .lp-eye-btn:hover {
    color: #facc15;
  }

  /* ── Error ── */
  .lp-error {
    background: #93000a;
    border: 4px solid #000;
    box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #ffdad6;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lp-error::before {
    content: '⚠';
    font-size: 14px;
    flex-shrink: 0;
  }

  /* ── Submit btn ── */
  .lp-btn {
    width: 100%;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border: 4px solid #000;
    border-radius: 0;
    cursor: pointer;
    background: #facc15;
    color: #231b00;
    /* machined-edge */
    box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
    transition: box-shadow 0.1s, transform 0.1s;
  }

  .lp-btn:hover:not(:disabled) {
    background: #fde047;
  }

  .lp-btn:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 0px 0px 0px 0px rgba(0,0,0,1);
  }

  .lp-btn:disabled {
    background: #574500;
    color: #9a9078;
    cursor: not-allowed;
    box-shadow: none;
  }

  /* ── Divider ── */
  .lp-divider {
    height: 4px;
    background: #000;
    display: flex;
  }

  .lp-div-1 { flex: 1; background: #facc15; }
  .lp-div-2 { flex: 1; background: #4ae176; }
  .lp-div-3 { flex: 1; background: #0c1322; }
  .lp-div-4 { flex: 1; background: #93000a; }

  /* ── Footer ── */
  .lp-footer {
    padding: 14px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 4px solid #000;
    background: #070e1d;
  }

  .lp-footer-left {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #4d4632;
  }

  .lp-footer-lock {
    width: 10px;
    height: 10px;
    border: 2px solid #4d4632;
    border-radius: 0;
    position: relative;
  }

  .lp-footer-right {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #2e3545;
  }

  /* ── Responsive ── */
  @media (max-width: 479px) {
    .lp-main {
      padding: 20px 16px;
    }
    .lp-card-header {
      padding: 20px 20px 16px;
    }
    .lp-card-body {
      padding: 20px;
    }
    .lp-footer {
      padding: 12px 20px;
    }
    .lp-card-title {
      font-size: 22px;
    }
  }
`

export default function LoginPage() {
  const [form, setForm] = useState({ userName: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { saveToken } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await login(form)
      saveToken(data.token)
      const decoded = jwtDecode(data.token)
      navigate(decoded.role === 'Admin' ? '/' : '/scan')
    } catch {
      setError('Usuario o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{CSS}</style>

      <div className="lp-root">

        {/* ── TopBar ── */}
        <header className="lp-topbar">
          <h1 className="lp-brand">Gestión<span>PGB</span></h1>
        </header>

        {/* ── Main ── */}
        <main className="lp-main">

          {/* Estado del sistema */}
          <div className="lp-system-label">
            <div className="lp-system-dot" />
            Sistema listo — Ingrese sus credenciales
          </div>

          {/* Card */}
          <div className="lp-card">

            {/* Header */}
            <div className="lp-card-header">
              <h2 className="lp-card-title">
                <span>// </span>ACCESO AL SISTEMA
              </h2>
              <p className="lp-card-sub">Control de Stock · Taller Mecánico</p>
            </div>

            {/* Body */}
            <div className="lp-card-body">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Usuario */}
                <div className="lp-field">
                  <label className="lp-label">
                    {/* inline SVG pequeño */}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                    Usuario
                  </label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon">
                      <IconPerson style={{ width: 16, height: 16 }} />
                    </span>
                    <input
                      type="text"
                      value={form.userName}
                      onChange={(e) => setForm({ ...form, userName: e.target.value })}
                      placeholder="Nombre de usuario"
                      className="lp-input"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="lp-field">
                  <label className="lp-label">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <rect x="5" y="11" width="14" height="10" rx="1" />
                      <path d="M8 11V7a4 4 0 018 0v4" />
                    </svg>
                    Contraseña
                  </label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon">
                      <IconLock style={{ width: 16, height: 16 }} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="lp-input lp-input-pr"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      tabIndex={-1}
                      className="lp-eye-btn"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword
                        ? <IconEyeOff style={{ width: 16, height: 16 }} />
                        : <IconEye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && <p className="lp-error">{error}</p>}

                {/* Submit */}
                <button type="submit" disabled={loading} className="lp-btn">
                  <span>{loading ? 'INGRESANDO...' : 'INGRESAR AL SISTEMA'}</span>
                  {!loading && <IconArrowRight style={{ width: 18, height: 18 }} />}
                </button>

              </form>
            </div>

            {/* Barra de color */}
            <div className="lp-divider">
              <div className="lp-div-1" />
              <div className="lp-div-2" />
              <div className="lp-div-3" />
              <div className="lp-div-4" />
            </div>

            {/* Footer */}
            <div className="lp-footer">
              <div className="lp-footer-left">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <rect x="5" y="11" width="14" height="10" rx="1" />
                  <path d="M8 11V7a4 4 0 018 0v4" />
                </svg>
                Solo personal autorizado
              </div>
              <div className="lp-footer-right">v1.0</div>
            </div>

          </div>

        </main>
      </div>
    </>
  )
}
