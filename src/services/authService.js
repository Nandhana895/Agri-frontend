import api from './api';
import config from '../config/config';

class AuthService {
  // Login user
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem(config.TOKEN_KEY, response.data.token);
        localStorage.setItem(config.USER_KEY, JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  }

  // Login via Google ID token
  async loginWithGoogle(idToken) {
    try {
      const response = await api.post('/auth/google', { idToken });
      if (response.data.token) {
        localStorage.setItem(config.TOKEN_KEY, response.data.token);
        localStorage.setItem(config.USER_KEY, JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Google login failed' };
    }
  }

  // Signup user
  async signup(name, email, password, confirmPassword) {
    try {
      const response = await api.post('/auth/signup', { name, email, password, confirmPassword });
      if (response.data.token) {
        localStorage.setItem(config.TOKEN_KEY, response.data.token);
        localStorage.setItem(config.USER_KEY, JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Signup failed' };
    }
  }

  // Logout user
  logout() {
    localStorage.removeItem(config.TOKEN_KEY);
    localStorage.removeItem(config.USER_KEY);
    // Notify app listeners in the same tab so UI state updates immediately
    try {
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      // no-op: best-effort dispatch
    }
  }

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem(config.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem(config.TOKEN_KEY);
  }

  // Get token
  getToken() {
    return localStorage.getItem(config.TOKEN_KEY);
  }

}

export default new AuthService(); 