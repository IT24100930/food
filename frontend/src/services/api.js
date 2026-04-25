import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Change this to your hosted backend URL ────────────────────────────────────
export const BASE_URL = 'https://food-2-1di6.onrender.com/api';
// For local development: 'http://192.168.1.x:5000/api' (use your local IP)

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor – attach JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
      // Navigation to login is handled in AuthContext
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword:  (token, data) => api.post(`/auth/reset-password/${token}`, data),
  getMe:          ()     => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  getAll:          (params) => api.get('/users', { params }),
  getOne:          (id)     => api.get(`/users/${id}`),
  updateRole:      (id, data) => api.put(`/users/${id}/role`, data),
  toggleStatus:    (id)     => api.put(`/users/${id}/toggle-status`),
  getTrustAnalytics: ()     => api.get('/users/trust-analytics'),
  updateProfile:   (data)  => api.put('/users/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:          (id)    => api.delete(`/users/${id}`),
};

// ── Menu ──────────────────────────────────────────────────────────────────────
export const menuAPI = {
  getAll:           (params) => api.get('/menu', { params }),
  getOne:           (id)     => api.get(`/menu/${id}`),
  create:           (data)   => api.post('/menu', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:           (id, data) => api.put(`/menu/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:           (id)     => api.delete(`/menu/${id}`),
  toggleAvailability: (id)  => api.patch(`/menu/${id}/availability`),
  getAnalytics:     ()       => api.get('/menu/analytics'),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const orderAPI = {
  create:        (data)   => api.post('/orders', data),
  getAll:        (params) => api.get('/orders', { params }),
  getMyOrders:   (params) => api.get('/orders/my-orders', { params }),
  getOne:        (id)     => api.get(`/orders/${id}`),
  updateStatus:  (id, data) => api.patch(`/orders/${id}/status`, data),
  cancel:        (id, data) => api.patch(`/orders/${id}/cancel`, data),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentAPI = {
  getExchangeRates: ()       => api.get('/payments/exchange-rates'),
  process:          (data)   => api.post('/payments', data),
  getAll:           (params) => api.get('/payments', { params }),
  getOne:           (id)     => api.get(`/payments/${id}`),
  getAnalytics:     ()       => api.get('/payments/analytics'),
};

// ── Inventory ─────────────────────────────────────────────────────────────────
export const inventoryAPI = {
  getAll:       (params) => api.get('/inventory', { params }),
  getAlerts:    ()       => api.get('/inventory/alerts'),
  getOne:       (id)     => api.get(`/inventory/${id}`),
  getHistory:   (id)     => api.get(`/inventory/${id}/history`),
  create:       (data)   => api.post('/inventory', data),
  update:       (id, data) => api.put(`/inventory/${id}`, data),
  delete:       (id)     => api.delete(`/inventory/${id}`),
  adjustStock:  (id, data) => api.patch(`/inventory/${id}/stock`, data),
};

// ── Taxes ─────────────────────────────────────────────────────────────────────
export const taxAPI = {
  getAll:   ()       => api.get('/taxes'),
  create:   (data)   => api.post('/taxes', data),
  update:   (id, data) => api.put(`/taxes/${id}`, data),
  delete:   (id)     => api.delete(`/taxes/${id}`),
  toggle:   (id)     => api.patch(`/taxes/${id}/toggle`),
};

// ── Discounts ─────────────────────────────────────────────────────────────────
export const discountAPI = {
  getAll:    (params) => api.get('/discounts', { params }),
  create:    (data)   => api.post('/discounts', data),
  update:    (id, data) => api.put(`/discounts/${id}`, data),
  delete:    (id)     => api.delete(`/discounts/${id}`),
  validate:  (data)   => api.post('/discounts/validate', data),
};

// ── Refunds ───────────────────────────────────────────────────────────────────
export const refundAPI = {
  getAll:         (params) => api.get('/refunds', { params }),
  create:         (data)   => api.post('/refunds', data),
  updateStatus:   (id, data) => api.patch(`/refunds/${id}`, data),
};

export default api;
