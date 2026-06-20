export function stockStatus(product) {
  // El mínimo es el piso aceptable: tener justo el mínimo ya alcanza.
  if (product.currentStock <= 0) return 'critical'                      // Sin stock
  if (product.currentStock < product.minRequiredStock) return 'low'    // Crítico: por debajo del mínimo
  return 'ok'                                                           // En el mínimo o por encima
}

export const STOCK_STATUS = {
  ok:       { dot: 'ds-dot-ok',       badge: 'ds-badge-ok',       label: 'OK',        color: 'var(--success)' },
  warn:     { dot: 'ds-dot-warn',     badge: 'ds-badge-warn',     label: 'Bajo',      color: '#f59e0b' },
  low:      { dot: 'ds-dot-low',      badge: 'ds-badge-low',      label: 'Crítico',   color: 'var(--error)' },
  critical: { dot: 'ds-dot-critical', badge: 'ds-badge-critical', label: 'Sin stock', color: 'var(--error)' },
}

export const SORT_ORDER = { critical: 0, low: 1, warn: 2, ok: 3 }
