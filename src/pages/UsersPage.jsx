import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { register, getUsers, deleteUser } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { IconTrash, IconPlus, IconX } from '../components/Icons'
import { FormField } from '../components/FormField'
import { ModalBackdrop } from '../components/ModalBackdrop'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { QK } from '../utils/queryKeys'

const CSS = `
  .up-card {
    background: var(--bg-primary);
    border: 4px solid var(--border);
    box-shadow: 3px 3px 0 0 var(--border);
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .up-card-name { font-size: 14px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.01em; }
  .up-card-full { font-size: 11px; color: var(--text-tertiary); font-weight: 600; margin-top: 2px; }
  .up-card-you {
    font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
    color: #facc15; background: rgba(250,204,21,0.1); border: 2px solid rgba(250,204,21,0.3);
    padding: 2px 7px; display: inline-block; margin-top: 4px;
  }
`

const emptyForm = { userName: '', email: '', password: '', fullName: '', role: 'Operator' }

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const currentUserId = currentUser?.nameid ??
    currentUser?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']

  const [showForm, setShowForm]               = useState(false)
  const [form, setForm]                       = useState(emptyForm)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [formError, setFormError]             = useState('')
  const [formSuccess, setFormSuccess]         = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: QK.users,
    queryFn: () => getUsers().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.users })
      setFormSuccess(`Usuario "${form.userName}" creado correctamente.`)
      setFormError('')
      setForm(emptyForm)
      setTimeout(() => { setFormSuccess(''); setShowForm(false) }, 1800)
    },
    onError: () => {
      setFormError('No se pudo crear el usuario. Verificá los datos.')
      setFormSuccess('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QK.users }); setConfirmDeleteId(null) },
  })

  const handleCreate = (e) => {
    e.preventDefault()
    setFormError('')
    createMutation.mutate(form)
  }

  const openForm  = () => { setShowForm(true);  setFormError(''); setFormSuccess('') }
  const closeForm = () => { setShowForm(false); setFormError(''); setFormSuccess('') }

  return (
    <>
      <style>{CSS}</style>
      <div className="ds-page" style={{ maxWidth: 800 }}>

        <div className="ds-page-hd">
          <h2 className="ds-page-title">Usuarios</h2>
          <button onClick={openForm} className="ds-btn">
            <IconPlus style={{ width: 14, height: 14 }} />
            Nuevo usuario
          </button>
        </div>

        <div className="ds-panel">
          <div className="ds-panel-hd">
            <p className="ds-panel-title">Usuarios del sistema</p>
            <p className="ds-panel-count">{users.length} registrados</p>
          </div>

          {isLoading ? (
            <p className="ds-loading">Cargando usuarios...</p>
          ) : users.length === 0 ? (
            <p className="ds-empty">No hay usuarios registrados</p>
          ) : (
            <>
              {/* Desktop table */}
              <table className="ds-table ds-desktop">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isMe = u.id === currentUserId
                    return (
                      <tr key={u.id}>
                        <td>
                          <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.userName}</p>
                          {isMe && (
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#facc15' }}>
                              Tú
                            </span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-primary)' }}>{u.fullName}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{u.email}</td>
                        <td>
                          <span className={`ds-badge ${u.role === 'Admin' ? 'ds-badge-admin' : 'ds-badge-operator'}`}>
                            {u.role === 'Admin' ? 'Admin' : 'Operario'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {!isMe && (
                            <button onClick={() => setConfirmDeleteId(u.id)} className="ds-btn-icon danger" title="Eliminar">
                              <IconTrash style={{ width: 14, height: 14 }} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="ds-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10 }}>
                {users.map((u) => {
                  const isMe = u.id === currentUserId
                  return (
                    <div key={u.id} className="up-card">
                      <div style={{ minWidth: 0 }}>
                        <p className="up-card-name">{u.userName}</p>
                        <p className="up-card-full">{u.fullName}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                          <span className={`ds-badge ${u.role === 'Admin' ? 'ds-badge-admin' : 'ds-badge-operator'}`}>
                            {u.role === 'Admin' ? 'Admin' : 'Operario'}
                          </span>
                          {isMe && <span className="up-card-you">Tú</span>}
                        </div>
                      </div>
                      {!isMe && (
                        <button onClick={() => setConfirmDeleteId(u.id)} className="ds-btn-icon danger" style={{ flexShrink: 0 }}>
                          <IconTrash style={{ width: 16, height: 16 }} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal: Nuevo usuario */}
        {showForm && (
          <ModalBackdrop onClose={closeForm} modalStyle={{ maxWidth: 420 }}>
            <div className="ds-modal-hd">
              <p className="ds-modal-title">Nuevo usuario</p>
              <button onClick={closeForm} className="ds-btn-icon">
                <IconX style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="ds-modal-body">
              <FormField label="Usuario" value={form.userName}
                onChange={v => setForm({ ...form, userName: v })} required />
              <FormField label="Nombre completo" value={form.fullName}
                onChange={v => setForm({ ...form, fullName: v })} required />
              <FormField label="Email" type="email" value={form.email}
                onChange={v => setForm({ ...form, email: v })} required />
              <FormField label="Contraseña" type="password" value={form.password}
                onChange={v => setForm({ ...form, password: v })} required />

              <div className="ds-field">
                <label className="ds-label">Rol</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="ds-select">
                  <option value="Operator">Operario</option>
                  <option value="Admin">Administrador</option>
                </select>
              </div>

              {formError   && <p className="ds-msg-error">{formError}</p>}
              {formSuccess && <p className="ds-msg-ok">{formSuccess}</p>}

              <button type="submit" disabled={createMutation.isPending} className="ds-btn" style={{ width: '100%', height: 52 }}>
                {createMutation.isPending ? 'Creando...' : 'Crear usuario'}
              </button>
            </form>
          </ModalBackdrop>
        )}

        {/* Modal: Confirmar eliminación */}
        {confirmDeleteId && (
          <ConfirmDeleteModal
            title="Eliminar usuario"
            onConfirm={() => deleteMutation.mutate(confirmDeleteId)}
            onCancel={() => setConfirmDeleteId(null)}
            isPending={deleteMutation.isPending}
          />
        )}

      </div>
    </>
  )
}
