import api from './axios'

export const getProducts = (params) => api.get('/products', { params })
export const getProductById = (id) => api.get(`/products/${id}`)
export const getProductByBarcode = (barcode) => api.get(`/products/barcode/${barcode}`)
export const getLowStockProducts = () => api.get('/products/low-stock')
export const createProduct = (data) => api.post('/products', data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data)
export const deleteProduct = (id) => api.delete(`/products/${id}`)
export const getQuotationPdf  = () => api.get('/products/quotation/pdf', { responseType: 'blob' })
export const importProducts   = (data) => api.post('/products/import', data)
