export function stockStatus(product) {
  const ratio = product.currentStock / (product.minRequiredStock || 1)
  if (product.currentStock <= 0) return 'critical'
  if (ratio <= 1) return 'low'
  if (ratio <= 1.5) return 'warn'
  return 'ok'
}

export const STOCK_STATUS = {
  ok:       { dot: 'ds-dot-ok',       badge: 'ds-badge-ok',       label: 'OK',        color: '#4ae176' },
  warn:     { dot: 'ds-dot-warn',     badge: 'ds-badge-warn',     label: 'Bajo',      color: '#f59e0b' },
  low:      { dot: 'ds-dot-low',      badge: 'ds-badge-low',      label: 'Crítico',   color: '#ef4444' },
  critical: { dot: 'ds-dot-critical', badge: 'ds-badge-critical', label: 'Sin stock', color: '#ff3b30' },
}

export const SORT_ORDER = { critical: 0, low: 1, warn: 2, ok: 3 }
