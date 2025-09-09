import axios from 'axios';
import config from '../config/config';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: config.API_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem(config.TOKEN_KEY);
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If a token exists, force logout and redirect. Otherwise (e.g., during login), let the caller handle the message.
      const hasToken = Boolean(localStorage.getItem(config.TOKEN_KEY));
      if (hasToken) {
        try { localStorage.removeItem(config.TOKEN_KEY); } catch (_) {}
        try { localStorage.removeItem(config.USER_KEY); } catch (_) {}
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api; 
export const chatApi = {
  async listConversations() {
    const res = await api.get('/chat/conversations');
    return res.data;
  },
  async getOrCreateConversationByEmail(email) {
    const res = await api.post('/chat/conversations/by-email', { email });
    return res.data;
    },
  async listMessages(conversationId) {
    const res = await api.get(`/chat/conversations/${conversationId}/messages`);
    return res.data;
  },
  async markRead(conversationId) {
    const res = await api.post(`/chat/conversations/${conversationId}/read`);
    return res.data;
  }
};