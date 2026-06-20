export function stockStatus(product) {
  const ratio = product.currentStock / (product.minRequiredStock || 1)
  if (product.currentStock <= 0) return 'critical'
  // Crítico solo si está ESTRICTAMENTE por debajo del mínimo (stock < mín, no <=).
  // Justo en el mínimo ya no cuenta como crítico.
  if (product.currentStock < product.minRequiredStock) return 'low'
  if (ratio <= 1.5) return 'warn'
  return 'ok'
}

export const STOCK_STATUS = {
  ok:       { dot: 'ds-dot-ok',       badge: 'ds-badge-ok',       label: 'OK',        color: 'var(--success)' },
  warn:     { dot: 'ds-dot-warn',     badge: 'ds-badge-warn',     label: 'Bajo',      color: '#f59e0b' },
  low:      { dot: 'ds-dot-low',      badge: 'ds-badge-low',      label: 'Crítico',   color: 'var(--error)' },
  critical: { dot: 'ds-dot-critical', badge: 'ds-badge-critical', label: 'Sin stock', color: 'var(--error)' },
}

export const SORT_ORDER = { critical: 0, low: 1, warn: 2, ok: 3 }
