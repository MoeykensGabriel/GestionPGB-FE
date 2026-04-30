import { useEffect } from 'react'

export function ModalBackdrop({ onClose, children, modalStyle }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="ds-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ds-modal" style={modalStyle}>
        {children}
      </div>
    </div>
  )
}
