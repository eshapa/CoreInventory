import api from "./axios";

export const getProducts = () => api.get("/products");
export const getProduct = (id) => api.get(`/products/${id}`);
export const getProductBySku = (sku) => api.get(`/products/sku/${sku}`);
export const getProductStock = (id) => api.get(`/products/${id}/stock`);
export const createProduct = (data) => api.post("/products", data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const updateProductQrCode = (id, data) => api.patch(`/products/${id}/qr-code`, data);
