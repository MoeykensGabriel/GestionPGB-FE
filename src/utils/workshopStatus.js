// Mapeos de estados del backend a etiquetas + colores

export const ORDER_STATUS = {
  PendingReview:      { label: 'Pendiente revisión', color: '#94a3b8', dot: '#94a3b8' },
  AllAvailable:       { label: 'Listo para entregar', color: '#4ae176', dot: '#4ae176' },
  WithShortages:      { label: 'Con faltantes',       color: '#ef4444', dot: '#ef4444' },
  PurchasedInTransit: { label: 'Comprado / En viaje', color: '#facc15', dot: '#facc15' },
  Delivered:          { label: 'Entregado',           color: '#3b82f6', dot: '#3b82f6' },
}

export const ITEM_STATUS = {
  Available:          { label: 'Disponible',          color: '#4ae176' },
  Shortage:           { label: 'Faltante',            color: '#ef4444' },
  PurchasedInTransit: { label: 'Comprado / En viaje', color: '#facc15' },
  Delivered:          { label: 'Entregado',           color: '#3b82f6' },
  NotFound:           { label: 'Código no encontrado', color: '#94a3b8' },
}

export const orderCfg = (s) => ORDER_STATUS[s] ?? { label: s, color: '#94a3b8', dot: '#94a3b8' }
export const itemCfg  = (s) => ITEM_STATUS[s]  ?? { label: s, color: '#94a3b8' }
