import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWorkshopOrders,
  updateWorkshopItemStatus,
  recheckWorkshopOrder,
  confirmWorkshopDelivery,
} from '../api/workshopOrders'
import { QK } from '../utils/queryKeys'
import { orderCfg, itemCfg } from '../utils/workshopStatus'
import { IconCheck, IconRefresh, IconTruck } from '../components/Icons'

const CSS = `
  .wo-page { display: flex; flex-direction: column; gap: 16px; }

  .wo-header { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .wo-title { font-size: 22px; font-weight: 900; color: var(--text-primary); margin: 0; letter-spacing: -0.02em; }
  .wo-sub { font-size: 11px; color: var(--text-tertiary); margin-top: 4px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; }

  .wo-empty {
    padding: 60px 20px;
    text-align: center;
    color: var(--text-tertiary);
    font-size: 13px;
    background: var(--bg-primary);
    border: 4px solid var(--border);
  }

  /* Card del pedido */
  .wo-order {
    background: var(--bg-primary);
    border: 4px solid var(--border);
  }
  .wo-order-hd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 3px solid var(--border);
    gap: 12px;
    flex-wrap: wrap;
  }
  .wo-plate {
    font-size: 20px;
    font-weight: 900;
    font-family: ui-monospace, "SF Mono", monospace;
    letter-spacing: 0.06em;
    color: var(--text-primary);
    background: var(--overlay);
    padding: 6px 12px;
    border: 2px solid var(--border);
  }
  .wo-order-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1;
  }
  .wo-order-time {
    font-size: 10px;
    color: var(--text-tertiary);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 700;
  }
  .wo-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border: 2px solid currentColor;
  }
  .wo-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }

  .wo-order-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .wo-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 14px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: var(--bg-primary);
    color: var(--text-primary);
    border: 3px solid var(--border);
    cursor: pointer;
    transition: all 0.12s;
  }
  .wo-btn:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }
  .wo-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .wo-btn-primary {
    background: #4ae176;
    border-color: #4ae176;
    color: #052e16;
  }
  .wo-btn-primary:hover:not(:disabled) {
    background: #34d058;
    border-color: #34d058;
    color: #052e16;
  }

  /* Items */
  .wo-items { padding: 0; }
  .wo-item {
    display: grid;
    grid-template-columns: 36px 1fr auto auto auto;
    align-items: center;
    gap: 14px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--overlay);
  }
  .wo-item:last-child { border-bottom: none; }
  .wo-item-bar { width: 6px; height: 36px; background: currentColor; }
  .wo-item-name { font-size: 13px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .wo-item-code { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; font-family: ui-monospace, "SF Mono", monospace; }
  .wo-item-qty {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    min-width: 60px;
  }
  .wo-item-qty-main {
    font-size: 16px;
    font-weight: 900;
    font-feature-settings: "tnum";
    color: var(--text-primary);
  }
  .wo-item-qty-sub {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-tertiary);
  }
  .wo-item-status {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 8px;
    border: 2px solid currentColor;
    min-width: 110px;
    text-align: center;
  }
  .wo-item-action {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 10px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: transparent;
    color: var(--text-secondary);
    border: 2px solid var(--border);
    cursor: pointer;
    transition: all 0.12s;
  }
  .wo-item-action:hover:not(:disabled) {
    border-color: #facc15;
    color: #facc15;
  }
  .wo-item-action:disabled { visibility: hidden; }

  @media (max-width: 767px) {
    .wo-item {
      grid-template-columns: 6px 1fr auto;
      grid-template-rows: auto auto auto;
      gap: 8px 12px;
      padding: 12px 14px;
    }
    .wo-item-bar { grid-row: 1 / 4; height: 100%; }
    .wo-item-qty { grid-row: 1; grid-column: 3; }
    .wo-item-status { grid-row: 2; grid-column: 2 / 4; justify-self: start; }
    .wo-item-action { grid-row: 3; grid-column: 2 / 4; justify-self: start; }
    .wo-order-hd { padding: 12px 14px; }
    .wo-plate { font-size: 17px; }
  }
`

function timeAgo(dateStr) {
  const d = new Date(dateStr)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'hace segundos'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function WorkshopOrdersPage() {
  const queryClient = useQueryClient()
  const [filterPlate, setFilterPlate] = useState('')

  const { data: orders = [], isLoading } = useQuery({
    queryKey: QK.workshopOrders,
    queryFn: () => getWorkshopOrders().then(r => r.data),
    refetchInterval: 15000, // refresca cada 15s
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QK.workshopOrders })

  const markPurchased = useMutation({
    mutationFn: ({ orderId, itemId }) =>
      updateWorkshopItemStatus(orderId, itemId, 'PurchasedInTransit'),
    onSuccess: invalidate,
  })
  const recheck = useMutation({
    mutationFn: (orderId) => recheckWorkshopOrder(orderId),
    onSuccess: invalidate,
  })
  const confirmDelivery = useMutation({
    mutationFn: (orderId) => confirmWorkshopDelivery(orderId),
    onSuccess: invalidate,
  })

  const grouped = useMemo(() => {
    const f = filterPlate.trim().toUpperCase()
    return orders
      .filter(o => !f || o.licensePlate.includes(f))
      .filter(o => o.status !== 'Delivered') // Activos primero
  }, [orders, filterPlate])

  const delivered = useMemo(
    () => orders.filter(o => o.status === 'Delivered'),
    [orders]
  )

  return (
    <>
      <style>{CSS}</style>

      <div className="wo-page">

        <div className="wo-header">
          <div>
            <h2 className="wo-title">Pedidos de Oficina</h2>
            <p className="wo-sub">Repuestos solicitados desde el taller</p>
          </div>
          <input
            type="text"
            placeholder="Filtrar por patente..."
            value={filterPlate}
            onChange={(e) => setFilterPlate(e.target.value)}
            className="ds-input"
            style={{ maxWidth: 240 }}
          />
        </div>

        {isLoading && <div className="wo-empty">Cargando pedidos...</div>}

        {!isLoading && grouped.length === 0 && (
          <div className="wo-empty">
            No hay pedidos activos del taller{filterPlate && ` para "${filterPlate}"`}.
          </div>
        )}

        {grouped.map(order => {
          const cfg = orderCfg(order.status)
          const allAvailable = order.items.every(
            i => i.status === 'Available' || i.status === 'Delivered'
          )
          const hasShortage = order.items.some(
            i => i.status === 'Shortage' || i.status === 'NotFound'
          )

          return (
            <div key={order.id} className="wo-order">
              <div className="wo-order-hd">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <span className="wo-plate">{order.licensePlate}</span>
                  <div className="wo-order-meta">
                    <span className="wo-badge" style={{ color: cfg.color }}>
                      <span className="wo-badge-dot" />
                      {cfg.label}
                    </span>
                    <span className="wo-order-time">
                      Recibido {timeAgo(order.createdAt)} · {order.items.length} ítems
                    </span>
                  </div>
                </div>

                <div className="wo-order-actions">
                  {hasShortage && (
                    <button
                      onClick={() => recheck.mutate(order.id)}
                      disabled={recheck.isPending}
                      className="wo-btn"
                      title="Re-verifica si llegaron repuestos al stock"
                    >
                      <IconRefresh style={{ width: 13, height: 13 }} />
                      Verificar
                    </button>
                  )}
                  <button
                    onClick={() => confirmDelivery.mutate(order.id)}
                    disabled={!allAvailable || confirmDelivery.isPending}
                    className="wo-btn wo-btn-primary"
                    title={allAvailable ? 'Confirma entrega y baja el stock' : 'Debe estar todo disponible'}
                  >
                    <IconTruck style={{ width: 13, height: 13 }} />
                    Confirmar entrega
                  </button>
                </div>
              </div>

              <div className="wo-items">
                {order.items.map(item => {
                  const ic = itemCfg(item.status)
                  const canMarkPurchased = item.status === 'Shortage'
                  return (
                    <div key={item.id} className="wo-item">
                      <div className="wo-item-bar" style={{ color: ic.color }} />
                      <div style={{ minWidth: 0 }}>
                        <p className="wo-item-name ds-prod-name">
                          {item.productName ?? `(Código no encontrado en el sistema)`}
                        </p>
                        <p className="wo-item-code">
                          {item.productCode}{item.providerName ? ` · ${item.providerName}` : ''}
                        </p>
                      </div>
                      <div className="wo-item-qty">
                        <span className="wo-item-qty-main">
                          {item.reservedQuantity}/{item.requestedQuantity}
                        </span>
                        <span className="wo-item-qty-sub">
                          {item.shortageQuantity > 0 ? `falta ${item.shortageQuantity}` : 'completo'}
                        </span>
                      </div>
                      <span className="wo-item-status" style={{ color: ic.color }}>
                        {ic.label}
                      </span>
                      <button
                        onClick={() => markPurchased.mutate({ orderId: order.id, itemId: item.id })}
                        disabled={!canMarkPurchased || markPurchased.isPending}
                        className="wo-item-action"
                        title="Marcar como Comprado / En viaje"
                      >
                        <IconCheck style={{ width: 11, height: 11 }} />
                        Comprado
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Historial de entregados */}
        {delivered.length > 0 && (
          <details style={{ marginTop: 8 }}>
            <summary
              style={{
                cursor: 'pointer',
                padding: '12px 16px',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
                background: 'var(--bg-primary)',
                border: '3px solid var(--border)',
              }}
            >
              Historial de entregas ({delivered.length})
            </summary>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {delivered.slice(0, 20).map(order => (
                <div key={order.id} className="wo-order" style={{ opacity: 0.7 }}>
                  <div className="wo-order-hd">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span className="wo-plate" style={{ fontSize: 16 }}>{order.licensePlate}</span>
                      <span className="wo-badge" style={{ color: '#3b82f6' }}>
                        <span className="wo-badge-dot" />
                        Entregado · {timeAgo(order.updatedAt)}
                      </span>
                    </div>
                    <span className="wo-order-time">{order.items.length} ítems</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

      </div>
    </>
  )
}
