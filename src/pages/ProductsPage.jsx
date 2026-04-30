import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products'
import { IconPlus, IconTrash, IconX } from '../components/Icons'
import { FormField } from '../components/FormField'
import { ModalBackdrop } from '../components/ModalBackdrop'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { ImportProductsModal } from '../components/ImportProductsModal'
import { Pagination } from '../components/Pagination'
import { stockStatus, STOCK_STATUS } from '../utils/stockStatus'
import { QK } from '../utils/queryKeys'
import { useAuth } from '../context/AuthContext'
import { useDebounce } from '../hooks/useDebounce'

const CSS = `
  .pp-card {
    background: #09090b;
    border: 4px solid #000;
    box-shadow: 3px 3px 0 0 rgba(0,0,0,1);
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .pp-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
  .pp-card-name { font-size: 15px; font-weight: 800; color: #fff; letter-spacing: -0.01em; }
  .pp-card-barcode { font-family: 'Courier New', monospace; font-size: 13px; color: #dce2f7; margin-top: 3px; font-weight: 600; }
  .pp-card-bottom { display: flex; align-items: flex-end; justify-content: space-between; }
  .pp-card-prov { font-size: 11px; color: #9a9078; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
  .pp-card-stock { font-size: 26px; font-weight: 900; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; line-height: 1; }
  .pp-card-stock-sub { font-size: 10px; color: #4d5a72; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
  .pp-card-actions { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
  .pp-hint { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; color: #4d5a72; padding: 8px 0 0; text-transform: uppercase; }
`

const emptyForm = {
  barcode: '', itemName: '', description: '',
  currentStock: 0, minRequiredStock: 0, providerName: '',
}

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin' ||
    user?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] === 'Admin'

  const [showForm,   setShowForm]   = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingId, setEditingId]         = useState(null)
  const [form, setForm]                   = useState(emptyForm)
  const [search, setSearch]               = useState('')
  const [page, setPage]                   = useState(1)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const debouncedSearch = useDebounce(search)
  const PAGE_SIZE = 20

  const { data, isLoading } = useQuery({
    queryKey: [...QK.products, { page, pageSize: PAGE_SIZE, search: debouncedSearch }],
    queryFn: () => getProducts({ page, pageSize: PAGE_SIZE, search: debouncedSearch || undefined }).then(r => r.data),
    placeholderData: keepPreviousData,
  })

  const products = data?.items ?? []
  const total    = data?.total ?? 0

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QK.products }); closeForm() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QK.products }); closeForm() },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: QK.products }); setConfirmDeleteId(null) },
  })

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm) }

  const handleEdit = (p) => {
    setEditingId(p.id)
    setForm({
      barcode: p.barcode,
      itemName: p.itemName,
      description: p.description ?? '',
      currentStock: p.currentStock,
      minRequiredStock: p.minRequiredStock,
      providerName: p.providerName,
    })
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: {
          itemName: form.itemName,
          description: form.description,
          minRequiredStock: Number(form.minRequiredStock),
          providerName: form.providerName,
        },
      })
    } else {
      createMutation.mutate({
        ...form,
        currentStock: Number(form.currentStock),
        minRequiredStock: Number(form.minRequiredStock),
      })
    }
  }

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const generateBarcode = () => {
    const existing = new Set(products.map(p => p.barcode))
    let code
    do {
      const base = '200' + String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0')
      const checkDigit = (10 - ([...base].reduce((sum, d, i) => sum + Number(d) * (i % 2 === 0 ? 1 : 3), 0) % 10)) % 10
      code = base + checkDigit
    } while (existing.has(code))
    setForm(f => ({ ...f, barcode: code }))
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <style>{CSS}</style>
      <div className="ds-page">

        <div className="ds-page-hd">
          <h2 className="ds-page-title">Productos</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin && (
              <button onClick={() => setShowImport(true)} className="ds-btn-ghost" style={{ height: 44 }}>
                Importar Excel
              </button>
            )}
            <button onClick={() => setShowForm(true)} className="ds-btn">
              <IconPlus style={{ width: 14, height: 14 }} />
              Nuevo
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Buscar por nombre, código o proveedor..."
          value={search}
          onChange={handleSearchChange}
          className="ds-search"
        />

        {isLoading ? (
          <p className="ds-loading">Cargando productos...</p>
        ) : products.length === 0 ? (
          <p className="ds-empty">
            {search ? 'Sin resultados para la búsqueda' : 'No hay productos cargados'}
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="ds-panel ds-desktop">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th style={{ width: 18 }}></th>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Proveedor</th>
                    <th className="right">Stock</th>
                    <th className="right">Mín.</th>
                    <th className="center">Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const cfg = STOCK_STATUS[stockStatus(p)]
                    return (
                      <tr key={p.id}>
                        <td><span className={`ds-dot ${cfg.dot}`} /></td>
                        <td><span className="ds-mono" style={{ fontSize: 14, color: '#dce2f7', fontWeight: 600 }}>{p.barcode}</span></td>
                        <td>
                          <p style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{p.itemName}</p>
                          {p.description && <p className="ds-mono" style={{ marginTop: 2 }}>{p.description}</p>}
                        </td>
                        <td><span style={{ fontSize: 12, color: '#9a9078' }}>{p.providerName}</span></td>
                        <td className="right">
                          <span className="tabular" style={{ fontSize: 18, fontWeight: 900, color: cfg.color }}>{p.currentStock}</span>
                        </td>
                        <td className="right">
                          <span className="tabular" style={{ fontSize: 13, color: '#4d5a72', fontWeight: 700 }}>{p.minRequiredStock}</span>
                        </td>
                        <td className="center">
                          <span className={`ds-badge ${cfg.badge}`}>{cfg.label}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button onClick={() => handleEdit(p)} className="ds-action">Editar</button>
                            <button onClick={() => setConfirmDeleteId(p.id)} className="ds-btn-icon danger">
                              <IconTrash style={{ width: 14, height: 14 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div style={{ padding: '4px 18px 14px' }}>
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
              </div>
            </div>

            {/* Mobile cards */}
            <div className="ds-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {products.map((p) => {
                const cfg = STOCK_STATUS[stockStatus(p)]
                return (
                  <div key={p.id} className="pp-card">
                    <div className="pp-card-top">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p className="pp-card-name">{p.itemName}</p>
                        <p className="pp-card-barcode">{p.barcode}</p>
                      </div>
                      <span className={`ds-badge ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                    <div className="pp-card-bottom">
                      <div>
                        <p className="pp-card-prov">{p.providerName}</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                          <span className="pp-card-stock tabular" style={{ color: cfg.color }}>{p.currentStock}</span>
                          <span className="pp-card-stock-sub">/ mín {p.minRequiredStock}</span>
                        </div>
                      </div>
                      <div className="pp-card-actions">
                        <button onClick={() => handleEdit(p)} className="ds-btn-ghost" style={{ height: 36, padding: '0 14px', fontSize: 10 }}>
                          Editar
                        </button>
                        <button onClick={() => setConfirmDeleteId(p.id)} className="ds-btn-icon danger">
                          <IconTrash style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Modal: Crear / Editar */}
        {showForm && (
          <ModalBackdrop onClose={closeForm}>
            <div className="ds-modal-hd">
              <p className="ds-modal-title">{editingId ? 'Editar producto' : 'Nuevo producto'}</p>
              <button onClick={closeForm} className="ds-btn-icon">
                <IconX style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="ds-modal-body">
              {!editingId && (
                <div className="ds-field">
                  <label className="ds-label">Código de barras</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={form.barcode}
                      onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                      placeholder="Escanear, ingresar o generar"
                      required
                      className="ds-input ds-input-mono"
                    />
                    <button type="button" onClick={generateBarcode} className="ds-btn-ghost"
                      style={{ height: 48, padding: '0 14px', fontSize: 10, flexShrink: 0 }}>
                      Generar
                    </button>
                  </div>
                  <p className="pp-hint">EAN-13 propio si el producto no tiene código de fábrica</p>
                </div>
              )}

              <FormField label="Nombre del producto" value={form.itemName}
                onChange={v => setForm({ ...form, itemName: v })} required />
              <FormField label="Descripción" value={form.description}
                onChange={v => setForm({ ...form, description: v })} placeholder="Opcional" />
              <FormField label="Proveedor" value={form.providerName}
                onChange={v => setForm({ ...form, providerName: v })} required />

              <div className="ds-grid-2">
                {!editingId && (
                  <FormField label="Stock inicial" type="number" value={form.currentStock}
                    onChange={v => setForm({ ...form, currentStock: v })} required />
                )}
                <FormField label="Stock mínimo" type="number" value={form.minRequiredStock}
                  onChange={v => setForm({ ...form, minRequiredStock: v })} required />
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button type="button" onClick={closeForm} className="ds-btn-ghost" style={{ flex: 1, height: 48 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="ds-btn" style={{ flex: 1, height: 48 }}>
                  {isPending ? 'Guardando...' : editingId ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </ModalBackdrop>
        )}

        {/* Modal: Importar Excel */}
        {showImport && (
          <ImportProductsModal onClose={() => setShowImport(false)} />
        )}

        {/* Modal: Confirmar eliminación */}
        {confirmDeleteId && (
          <ConfirmDeleteModal
            title="Eliminar producto"
            onConfirm={() => deleteMutation.mutate(confirmDeleteId)}
            onCancel={() => setConfirmDeleteId(null)}
            isPending={deleteMutation.isPending}
          />
        )}

      </div>
    </>
  )
}
