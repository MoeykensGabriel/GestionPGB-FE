export const movementBadge = (type) =>
  type === 'ENTRADA' ? 'ds-badge-entry' : 'ds-badge-exit'

export const movementColor = (type) =>
  type === 'ENTRADA' ? '#4ae176' : '#ff6b6b'

export const formatQty = (qty) =>
  qty > 0 ? `+${qty}` : String(qty)
