import { useEffect, useState } from 'react'
import { ModalBackdrop } from './ModalBackdrop'
import { IconX } from './Icons'

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}
function detectIOS() {
  const ua = window.navigator.userAgent || ''
  const iOSDevice = /iphone|ipad|ipod/i.test(ua)
  // iPadOS 13+ se presenta como Mac con pantalla tactil.
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return iOSDevice || iPadOS
}

function DownloadIcon({ size = 14 }) {
  return (
    <svg style={{ width: size, height: size, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.4} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}
function ShareIcon() {
  return (
    <svg style={{ width: 18, height: 18, flexShrink: 0, color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
    </svg>
  )
}

/**
 * Boton para instalar la app como PWA.
 * - Android/Chrome/Edge: dispara el prompt nativo de instalacion.
 * - iOS/Safari: abre instrucciones (Compartir -> Agregar a inicio).
 * No se muestra si la app ya esta instalada o si el navegador no ofrece instalacion.
 */
export function InstallApp({ className = 'ds-btn-ghost', style, label = 'Instalar app', iconSize = 14 }) {
  const [deferred, setDeferred] = useState(null)
  const [installed, setInstalled] = useState(isStandalone())
  const [showIos, setShowIos] = useState(false)
  const ios = detectIOS()

  useEffect(() => {
    const onBeforeInstall = (e) => { e.preventDefault(); setDeferred(e) }
    const onInstalled = () => { setInstalled(true); setDeferred(null) }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null
  // Solo mostramos el boton si hay forma de instalar: prompt nativo o iOS (instrucciones).
  if (!deferred && !ios) return null

  const handleClick = async () => {
    if (deferred) {
      deferred.prompt()
      try { await deferred.userChoice } catch { /* usuario cerro el dialogo */ }
      setDeferred(null)
    } else if (ios) {
      setShowIos(true)
    }
  }

  return (
    <>
      <button onClick={handleClick} className={className} style={style} aria-label={label}>
        <DownloadIcon size={iconSize} />
        {label}
      </button>

      {showIos && (
        <ModalBackdrop onClose={() => setShowIos(false)}>
          <div className="ds-modal-hd">
            <p className="ds-modal-title">Instalar GestiónPGB</p>
            <button onClick={() => setShowIos(false)} className="ds-btn-icon" aria-label="Cerrar">
              <IconX className="w-4 h-4" />
            </button>
          </div>
          <div className="ds-modal-body" style={{ gap: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Para agregar la app a la pantalla de inicio de tu iPhone o iPad:
            </p>
            <ol style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 0, listStyle: 'none' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-primary)' }}>
                <span style={{ fontWeight: 900, color: 'var(--accent)' }}>1.</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  Tocá el botón <ShareIcon /> <strong>Compartir</strong> en la barra de Safari.
                </span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-primary)' }}>
                <span style={{ fontWeight: 900, color: 'var(--accent)' }}>2.</span>
                <span>Elegí <strong>“Agregar a inicio”</strong> (Add to Home Screen).</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-primary)' }}>
                <span style={{ fontWeight: 900, color: 'var(--accent)' }}>3.</span>
                <span>Confirmá con <strong>“Agregar”</strong>. ¡Listo!</span>
              </li>
            </ol>
            <button onClick={() => setShowIos(false)} className="ds-btn" style={{ height: 46 }}>
              Entendido
            </button>
          </div>
        </ModalBackdrop>
      )}
    </>
  )
}
