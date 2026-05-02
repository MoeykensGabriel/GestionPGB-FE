import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getProducts, getLowStockProducts } from '../api/products'
import { QuotationModal } from '../components/QuotationModal'
import { getMovements } from '../api/movements'
import { useTheme } from '../hooks/useTheme'
import { stockStatus, STOCK_STATUS } from '../utils/stockStatus'
import { movementBadge, formatQty } from '../utils/movements'
import { QK } from '../utils/queryKeys'

const CSS = `
  .dp-inv-card {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .dp-inv-card:last-child { border-bottom: none; }
  .dp-inv-name { font-size: 13px; font-weight: 700; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dp-inv-prov { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
`

const DP_MOVEMENTS_KEY = [...QK.movements, { pageSize: 8 }]

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme()

  const todayStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }, [])

  // La conexión global en Layout ya invalida las queries al recibir StockUpdated.

  const { data: totalProducts = 0 } = useQuery({
    queryKey: [...QK.products, { pageSize: 1 }],
    queryFn: () => getProducts({ pageSize: 1 }).then(r => r.data.total),
  })

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => getLowStockProducts().then(r => r.data),
  })

  const { data: todayCount = 0 } = useQuery({
    queryKey: [...QK.movements, { from: todayStart, pageSize: 1 }],
    queryFn: () => getMovements({ from: todayStart, pageSize: 1 }).then(r => r.data.total),
  })

  const { data: recentMovements = [] } = useQuery({
    queryKey: DP_MOVEMENTS_KEY,
    queryFn: () => getMovements({ pageSize: 8 }).then(r => r.data.items),
  })

  const [showQuotation, setShowQuotation] = useState(false)

  const stats = [
    { label: 'Productos', value: totalProducts, accent: '#facc15' },
    { label: 'Stock crítico', value: lowStockItems.length, accent: '#ef4444' },
    { label: 'Movim. hoy', value: todayCount, accent: '#4ae176' },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div className="ds-page">

        {/* Header */}
        <div className="ds-page-hd">
          <h2 className="ds-page-title">Dashboard</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={toggleTheme}
              className="ds-btn-ghost"
              style={{ height: 44, padding: '0 14px', fontSize: 11 }}
              title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            >
              {theme === 'dark' ? 'claro' : 'oscuro'}
            </button>
            <button onClick={() => setShowQuotation(true)} className="ds-btn">
              <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              PDF Cotización
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="ds-grid-3">
          {stats.map((s) => (
            <div key={s.label} className="ds-panel ds-stat">
              <div className="ds-stat-accent" style={{ background: s.accent }} />
              <p className="ds-stat-num tabular">{s.value}</p>
              <p className="ds-stat-label" style={{ marginTop: 6 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Low-stock inventory */}
        <div className="ds-panel">
          <div className="ds-panel-hd">
            <p className="ds-panel-title">Stock crítico</p>
            <p className="ds-panel-count">{lowStockItems.length} productos</p>
          </div>

          {lowStockItems.length === 0 ? (
            <p className="ds-empty">Todo el stock en orden</p>
          ) : (
            <>
              {/* Desktop */}
              <table className="ds-table ds-desktop">
                <thead>
                  <tr>
                    <th style={{ width: 20 }}></th>
                    <th>Producto</th>
                    <th>Proveedor</th>
                    <th className="right">Stock</th>
                    <th className="right">Mín.</th>
                    <th className="center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((p) => {
                    const cfg = STOCK_STATUS[stockStatus(p)]
                    return (
                      <tr key={p.id}>
                        <td><span className={`ds-dot ${cfg.dot}`} /></td>
                        <td>
                          <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.itemName}</p>
                          {p.description && <p className="ds-mono" style={{ marginTop: 2 }}>{p.description}</p>}
                        </td>
                        <td><span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{p.providerName}</span></td>
                        <td className="right">
                          <span className="tabular" style={{ fontSize: 17, fontWeight: 900, color: cfg.color }}>{p.currentStock}</span>
                        </td>
                        <td className="right">
                          <span className="tabular" style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700 }}>{p.minRequiredStock}</span>
                        </td>
                        <td className="center">
                          <span className={`ds-badge ${cfg.badge}`}>{cfg.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Mobile */}
              <div className="ds-mobile">
                {lowStockItems.map((p) => {
                  const cfg = STOCK_STATUS[stockStatus(p)]
                  return (
                    <div key={p.id} className="dp-inv-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                        <span className={`ds-dot ${cfg.dot}`} style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <p className="dp-inv-name">{p.itemName}</p>
                          <p className="dp-inv-prov">{p.providerName}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p className="tabular" style={{ fontSize: 20, fontWeight: 900, color: cfg.color, lineHeight: 1 }}>{p.currentStock}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700, marginTop: 2 }}>mín {p.minRequiredStock}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Recent movements */}
        <div className="ds-panel">
          <div className="ds-panel-hd">
            <p className="ds-panel-title">Últimos movimientos</p>
          </div>
          {recentMovements.length === 0 ? (
            <p className="ds-empty">Sin movimientos</p>
          ) : (
            <div>
              {recentMovements.map((m, i, arr) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 18px',
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.productName}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {m.createdBy} · {new Date(m.createdAt).toLocaleString('es-AR')}
                    </p>
                  </div>
                  <span className={`ds-badge ${movementBadge(m.type)}`}>
                    {m.type} {formatQty(m.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {showQuotation && <QuotationModal onClose={() => setShowQuotation(false)} />}
    </>
  )
}
