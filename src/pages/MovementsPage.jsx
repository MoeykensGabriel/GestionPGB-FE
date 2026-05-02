import { useMemo, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getMovements } from '../api/movements'
import { getUsers } from '../api/auth'
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
  .mp-card-prod { font-size: 14px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.01em; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mp-card-bottom { display: flex; align-items: center; gap: 12px; }
  .mp-card-qty { font-size: 22px; font-weight: 900; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
  .mp-card-sep { color: var(--text-secondary); font-weight: 700; }
  .mp-card-stock { font-size: 13px; color: var(--text-tertiary); font-weight: 700; }
  .mp-card-meta { font-size: 10px; color: var(--text-secondary); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-top: 8px; }

  /* ── Filtros ── */
  .mp-filters {
    display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end;
    padding: 12px 16px;
    background: var(--bg-primary);
    border: 4px solid var(--border);
    box-shadow: 3px 3px 0 0 var(--border);
  }
  .mp-filter-group { display: flex; flex-direction: column; gap: 4px; }
  .mp-filter-label {
    font-size: 8px; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #4d5a72;
  }
  .mp-preset-row { display: flex; gap: 4px; flex-wrap: wrap; }
  .mp-preset {
    padding: 6px 12px; border: 2px solid #1e2a3a;
    background: none; color: #4d5a72;
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; font-family: inherit; transition: all 0.12s;
  }
  .mp-preset:hover { border-color: #3d4f66; color: #9a9078; }
  .mp-preset.active { border-color: #facc15; color: #facc15; background: rgba(250,204,21,0.07); }
  .mp-select {
    height: 34px; padding: 0 10px;
    background: var(--bg-secondary); border: 2px solid var(--border);
    color: var(--text-primary); font-size: 11px; font-weight: 600;
    font-family: inherit; cursor: pointer;
    min-width: 160px;
  }
  .mp-select:focus { outline: none; border-color: #facc15; }
  .mp-clear {
    padding: 6px 12px; border: 2px solid #1e2a3a;
    background: none; color: #3d4f66;
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; font-family: inherit; transition: all 0.12s; align-self: flex-end;
  }
  .mp-clear:hover { border-color: #9a9078; color: #9a9078; }
  .mp-active-badge {
    font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    color: #facc15; background: rgba(250,204,21,0.1);
    border: 1px solid rgba(250,204,21,0.3);
    padding: 3px 8px; align-self: center;
  }
`

const DATE_PRESETS = [
  { key: 'all',       label: 'Todo' },
  { key: 'today',     label: 'Hoy' },
  { key: 'yesterday', label: 'Ayer' },
  { key: 'week',      label: 'Semana' },
  { key: 'month',     label: 'Mes' },
]

function getDateRange(preset) {
  const now = new Date()
  const startOf = (d) => { const r = new Date(d); r.setHours(0, 0, 0, 0);          return r.toISOString() }
  const endOf   = (d) => { const r = new Date(d); r.setHours(23, 59, 59, 999);     return r.toISOString() }

  switch (preset) {
    case 'today':
      return { from: startOf(now), to: endOf(now) }
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      return { from: startOf(y), to: endOf(y) }
    }
    case 'week': {
      const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
      return { from: startOf(mon), to: undefined }
    }
    case 'month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: startOf(first), to: undefined }
    }
    default:
      return { from: undefined, to: undefined }
  }
}

const PAGE_SIZE = 25

export default function MovementsPage() {
  const [page, setPage]           = useState(1)
  const [datePreset, setDatePreset] = useState('all')
  const [userFilter, setUserFilter] = useState('')

  const { from, to } = useMemo(() => getDateRange(datePreset), [datePreset])

  const filtersActive = datePreset !== 'all' || userFilter !== ''

  const queryParams = {
    page, pageSize: PAGE_SIZE,
    ...(from       && { from }),
    ...(to         && { to }),
    ...(userFilter && { createdBy: userFilter }),
  }

  const { data, isLoading } = useQuery({
    queryKey: [...QK.movements, queryParams],
    queryFn:  () => getMovements(queryParams).then(r => r.data),
    placeholderData: keepPreviousData,
  })

  const { data: usersData = [] } = useQuery({
    queryKey: QK.users,
    queryFn:  () => getUsers().then(r => r.data),
  })

  const movements = data?.items ?? []
  const total     = data?.total ?? 0

  const handlePreset = (key) => { setDatePreset(key); setPage(1) }
  const handleUser   = (e)   => { setUserFilter(e.target.value); setPage(1) }
  const clearFilters = ()    => { setDatePreset('all'); setUserFilter(''); setPage(1) }

  return (
    <>
      <style>{CSS}</style>
      <div className="ds-page">

        <div className="ds-page-hd">
          <h2 className="ds-page-title">Movimientos</h2>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            {total} registros
          </p>
        </div>

        {/* Panel de filtros */}
        <div className="mp-filters">

          <div className="mp-filter-group">
            <span className="mp-filter-label">Período</span>
            <div className="mp-preset-row">
              {DATE_PRESETS.map(p => (
                <button
                  key={p.key}
                  className={`mp-preset${datePreset === p.key ? ' active' : ''}`}
                  onClick={() => handlePreset(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mp-filter-group">
            <span className="mp-filter-label">Operador</span>
            <select className="mp-select" value={userFilter} onChange={handleUser}>
              <option value="">Todos</option>
              {usersData.map(u => (
                <option key={u.id} value={u.userName}>{u.userName}</option>
              ))}
            </select>
          </div>

          {filtersActive && (
            <>
              <span className="mp-active-badge">Filtros activos</span>
              <button className="mp-clear" onClick={clearFilters}>Limpiar</button>
            </>
          )}

        </div>

        {isLoading ? (
          <p className="ds-loading">Cargando movimientos...</p>
        ) : movements.length === 0 ? (
          <p className="ds-empty">
            {filtersActive ? 'Sin resultados para los filtros seleccionados' : 'Sin movimientos registrados'}
          </p>
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
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.productName}</td>
                      <td>
                        <span className={`ds-badge ${movementBadge(m.type)}`}>{m.type}</span>
                      </td>
                      <td className="right">
                        <span className="tabular" style={{ fontSize: 16, fontWeight: 900, color: movementColor(m.type) }}>
                          {formatQty(m.quantity)}
                        </span>
                      </td>
                      <td className="right">
                        <span className="tabular" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {m.currentStock}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{m.createdBy}</td>
                      <td>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
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
                    <span className="mp-card-stock">Stock: <strong style={{ color: 'var(--text-primary)' }}>{m.currentStock}</strong></span>
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
