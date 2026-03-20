import axios from 'axios';

// Backend çalıştığı adres. Prodüksiyonda/env üzerinden okuyalım (örn VITE_API_URL):
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Her isteğe otomatik Token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: 401 Hatalarında çıkış yaptır
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Login ve Register isteklerinde dönen 401'ler şifre yanlıştır, sayfayı yenileme ki kırmızı uyarı ekranda çıksın.
      if (error.config && !error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
