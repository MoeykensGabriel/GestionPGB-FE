import api from './axios'

export const getMovements = (params) => api.get('/movements', { params })
export const getMovementsByProduct = (productId) => api.get(`/movements/product/${productId}`)
export const registerMovement = (data) => api.post('/movements', data)
export const scanBarcode = (data) => api.post('/movements/scan', data)
