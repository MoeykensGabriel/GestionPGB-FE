import { ModalBackdrop } from './ModalBackdrop'
import { IconTrash } from './Icons'

const CSS = `
  .cdm-icon {
    width: 48px; height: 48px;
    background: rgba(147,0,10,0.2);
    border: 3px solid #93000a;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto;
  }
  .cdm-title {
    font-size: 14px; font-weight: 800;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: #fff; text-align: center; margin-top: 12px;
  }
  .cdm-sub {
    font-size: 11px; color: #4d5a72; text-align: center;
    margin-top: 6px; font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase;
  }
`

export function ConfirmDeleteModal({ title, onConfirm, onCancel, isPending }) {
  return (
    <>
      <style>{CSS}</style>
      <ModalBackdrop onClose={onCancel} modalStyle={{ maxWidth: 340 }}>
        <div className="ds-modal-body" style={{ paddingTop: 28, paddingBottom: 28 }}>
          <div className="cdm-icon">
            <IconTrash style={{ width: 22, height: 22, color: '#ff6b6b' }} />
          </div>
          <p className="cdm-title">{title}</p>
          <p className="cdm-sub">Esta acción no se puede deshacer.</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={onCancel} className="ds-btn-ghost" style={{ flex: 1, height: 48 }}>
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="ds-btn-danger"
              style={{ flex: 1, height: 48 }}
            >
              {isPending ? '...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </ModalBackdrop>
    </>
  )
}
