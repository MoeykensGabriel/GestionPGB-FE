import api from './axios'

export const getWorkshopOrders = () => api.get('/workshop-orders')
export const getWorkshopOrderById = (id) => api.get(`/workshop-orders/${id}`)
export const updateWorkshopItemStatus = (orderId, itemId, status) =>
  api.patch(`/workshop-orders/${orderId}/items/${itemId}/status`, { status })
export const recheckWorkshopOrder = (orderId) =>
  api.post(`/workshop-orders/${orderId}/recheck`)
export const confirmWorkshopDelivery = (orderId) =>
  api.post(`/workshop-orders/${orderId}/confirm-delivery`)
