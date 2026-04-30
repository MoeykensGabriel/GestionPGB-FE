import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getMovements } from '../api/movements'
import { Pagination } from '../components/Pagination'
import { movementBadge, movementColor, formatQty } from '../utils/movements'
import { QK } from '../utils/queryKeys'

const CSS = `
  .mp-card {
    background: #09090b;
    border: 4px solid #000;
    box-shadow: 3px 3px 0 0 rgba(0,0,0,1);
    padding: 14px 16px;
  }
  .mp-card-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
  .mp-card-prod { font-size: 14px; font-weight: 800; color: #fff; letter-spacing: -0.01em; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mp-card-bottom { display: flex; align-items: center; gap: 12px; }
  .mp-card-qty { font-size: 22px; font-weight: 900; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
  .mp-card-sep { color: #1e2a3a; font-weight: 700; }
  .mp-card-stock { font-size: 13px; color: #9a9078; font-weight: 700; }
  .mp-card-meta { font-size: 10px; color: #3d4f66; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-top: 8px; }
`

const PAGE_SIZE = 25

export default function MovementsPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: [...QK.movements, { page, pageSize: PAGE_SIZE }],
    queryFn: () => getMovements({ page, pageSize: PAGE_SIZE }).then(r => r.data),
    placeholderData: keepPreviousData,
  })

  const movements = data?.items ?? []
  const total     = data?.total ?? 0

  return (
    <>
      <style>{CSS}</style>
      <div className="ds-page">

        <div className="ds-page-hd">
          <h2 className="ds-page-title">Movimientos</h2>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4d5a72' }}>
            {total} registros
          </p>
        </div>

        {isLoading ? (
          <p className="ds-loading">Cargando movimientos...</p>
        ) : movements.length === 0 ? (
          <p className="ds-empty">Sin movimientos registrados</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="ds-panel ds-desktop">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th className="right">Cantidad</th>
                    <th className="right">Stock resultante</th>
                    <th>Operador</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 700, color: '#fff' }}>{m.productName}</td>
                      <td>
                        <span className={`ds-badge ${movementBadge(m.type)}`}>{m.type}</span>
                      </td>
                      <td className="right">
                        <span className="tabular" style={{ fontSize: 16, fontWeight: 900, color: movementColor(m.type) }}>
                          {formatQty(m.quantity)}
                        </span>
                      </td>
                      <td className="right">
                        <span className="tabular" style={{ fontSize: 15, fontWeight: 700, color: '#dce2f7' }}>
                          {m.currentStock}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#9a9078' }}>{m.createdBy}</td>
                      <td>
                        <span style={{ fontSize: 11, color: '#4d5a72', fontWeight: 600 }}>
                          {new Date(m.createdAt).toLocaleString('es-AR')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '0 18px 14px' }}>
                <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
              </div>
            </div>

            {/* Mobile cards */}
            <div className="ds-mobile" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {movements.map((m) => (
                <div key={m.id} className="mp-card">
                  <div className="mp-card-top">
                    <p className="mp-card-prod">{m.productName}</p>
                    <span className={`ds-badge ${movementBadge(m.type)}`}>{m.type}</span>
                  </div>
                  <div className="mp-card-bottom">
                    <span className="mp-card-qty tabular" style={{ color: movementColor(m.type) }}>
                      {formatQty(m.quantity)}
                    </span>
                    <span className="mp-card-sep">→</span>
                    <span className="mp-card-stock">Stock: <strong style={{ color: '#dce2f7' }}>{m.currentStock}</strong></span>
                  </div>
                  <div className="mp-card-meta">{m.createdBy} · {new Date(m.createdAt).toLocaleString('es-AR')}</div>
                </div>
              ))}
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
            </div>
          </>
        )}

      </div>
    </>
  )
}
