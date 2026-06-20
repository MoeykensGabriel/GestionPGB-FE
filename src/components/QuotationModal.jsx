import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLowStockProducts, getProducts, generateQuotationPdf } from '../api/products'
import { ModalBackdrop } from './ModalBackdrop'
import { QK } from '../utils/queryKeys'

const CSS = `
  .qm-list { display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; }
  .qm-item {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 8px 12px;
    background: var(--bg-secondary);
    border: 2px solid var(--border);
    font-size: 12px;
  }
  .qm-item-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .qm-item-name { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .qm-item-meta { font-size: 10px; color: var(--text-tertiary); font-weight: 600; letter-spacing: 0.05em; }
  .qm-item-qty { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
  .qm-item-qty-input { width: 50px; height: 32px; padding: 0 6px; background: var(--bg-primary); border: 2px solid var(--border); color: var(--text-primary); font-weight: 700; text-align: center; font-size: 12px; }
  .qm-remove { background: none; border: none; cursor: pointer; color: var(--text-secondary); font-size: 16px; line-height: 1; padding: 2px 4px; flex-shrink: 0; }
  .qm-remove:hover { color: var(--error-light); }
  .qm-search { display: flex; flex-direction: column; gap: 6px; }
  .qm-results { display: flex; flex-direction: column; gap: 4px; max-height: 160px; overflow-y: auto; }
  .qm-result {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 7px 10px; background: var(--bg-secondary); border: 2px solid var(--border);
    cursor: pointer; font-size: 12px; text-align: left; width: 100%;
  }
  .qm-result:hover { border-color: var(--accent); }
  .qm-result-name { font-weight: 700; }
  .qm-result-meta { font-size: 10px; color: var(--text-tertiary); font-weight: 600; }
  .qm-result-add { font-size: 18px; color: var(--accent); line-height: 1; flex-shrink: 0; }
  .qm-empty { font-size: 11px; color: var(--text-secondary); padding: 10px 0; text-align: center; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
  .qm-section-label { font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 4px; }
  .qm-divider { border: none; border-top: 2px solid var(--border); margin: 4px 0; }
`

export function QuotationModal({ onClose }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null) // null = loading, [] = empty, [product, ...] = loaded
  const [quantities, setQuantities] = useState({}) // { productId: quantity }
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)

  // Carga bajo stock y pre-selecciona
  const { isLoading, data: lowStockData } = useQuery({
    queryKey: QK.lowStock,
    queryFn: () => getLowStockProducts().then(r => r.data),
  })

  useEffect(() => {
    if (selected === null && lowStockData) {
      setSelected(lowStockData)
      // Pre-calcula cantidades automáticas
      const qty = {}
      lowStockData.forEach(p => {
        qty[p.id] = Math.max(1, p.minRequiredStock - p.currentStock)
      })
      setQuantities(qty)
    }
  }, [lowStockData])

  // Búsqueda de productos para agregar manualmente
  const { data: searchData } = useQuery({
    queryKey: [...QK.products, { search, pageSize: 8 }],
    queryFn: () => getProducts({ page: 1, pageSize: 8, search }).then(r => r.data),
    enabled: search.trim().length >= 2,
  })

  const selectedIds = useMemo(() => new Set((selected ?? []).map(p => p.id)), [selected])

  const searchResults = useMemo(() =>
    (searchData?.items ?? []).filter(p => !selectedIds.has(p.id)),
    [searchData, selectedIds]
  )

  const remove = (id) => {
    setSelected(prev => prev.filter(p => p.id !== id))
    setQuantities(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const add = (product) => {
    setSelected(prev => [...(prev ?? []), product])
    setQuantities(prev => ({
      ...prev,
      [product.id]: Math.max(1, product.minRequiredStock - product.currentStock)
    }))
    setSearch('')
  }

  const updateQuantity = (id, qty) => {
    const num = Math.max(1, parseInt(qty) || 1)
    setQuantities(prev => ({ ...prev, [id]: num }))
  }

  const handleGenerate = async () => {
    if (!selected?.length) return
    setIsGenerating(true)
    setError(null)
    try {
      const items = selected.map(p => ({
        productId: p.id,
        quantity: quantities[p.id] ?? 1
      }))
      const res = await generateQuotationPdf(items)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `cotizacion_${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      onClose()
    } catch {
      setError('No se pudo generar el PDF. Intentá de nuevo.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <ModalBackdrop onClose={onClose} modalStyle={{ maxWidth: 480 }}>
        <div className="ds-modal-hd">
          <span className="ds-modal-title">Armar pedido de cotización</span>
          <button className="ds-btn-icon" onClick={onClose}>
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="ds-modal-body">

          {/* Lista de productos seleccionados */}
          <div>
            <p className="qm-section-label">
              Productos en el pedido ({selected?.length ?? 0})
            </p>
            {isLoading ? (
              <p className="qm-empty">Cargando faltantes...</p>
            ) : selected?.length === 0 ? (
              <p className="qm-empty">Sin productos. Agregá desde el buscador.</p>
            ) : (
              <div className="qm-list">
                {selected?.map(p => (
                  <div key={p.id} className="qm-item">
                    <div className="qm-item-info">
                      <span className="qm-item-name ds-prod-name">{p.itemName}</span>
                      <span className="qm-item-meta">{p.providerName} · Stock: {p.currentStock} / Min: {p.minRequiredStock}</span>
                    </div>
                    <div className="qm-item-qty">
                      <input
                        type="number"
                        className="qm-item-qty-input"
                        min="1"
                        value={quantities[p.id] ?? 1}
                        onChange={(e) => updateQuantity(p.id, e.target.value)}
                      />
                      <button className="qm-remove" onClick={() => remove(p.id)} title="Quitar">×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="qm-divider" />

          {/* Buscador para agregar productos */}
          <div className="qm-search">
            <p className="qm-section-label">Agregar producto al pedido</p>
            <input
              className="ds-input"
              placeholder="Buscar por nombre, código o proveedor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoComplete="off"
            />
            {search.trim().length >= 2 && (
              <div className="qm-results">
                {searchResults.length === 0 ? (
                  <p className="qm-empty">Sin resultados</p>
                ) : searchResults.map(p => (
                  <button key={p.id} className="qm-result" onClick={() => add(p)}>
                    <div>
                      <div className="qm-result-name ds-prod-name">{p.itemName}</div>
                      <div className="qm-result-meta">{p.providerName} · Stock: {p.currentStock}</div>
                    </div>
                    <span className="qm-result-add">+</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="ds-msg-error">{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ds-btn-ghost" onClick={onClose} style={{ flex: 1, height: 48 }}>
              Cancelar
            </button>
            <button
              className="ds-btn"
              onClick={handleGenerate}
              disabled={isGenerating || !selected?.length}
              style={{ flex: 2, height: 48 }}
            >
              {isGenerating ? 'Generando...' : `Generar PDF (${selected?.length ?? 0})`}
            </button>
          </div>

        </div>
      </ModalBackdrop>
    </>
  )
}
