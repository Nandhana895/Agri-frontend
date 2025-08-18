// Configuration file for the application
export const config = {
  // Backend API URL - change this to match your backend
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  
  // Frontend URL
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000',
  
  // API timeout in milliseconds
  API_TIMEOUT: 10000,
  
  // Token storage key
  TOKEN_KEY: 'token',
  
  // User storage key
  USER_KEY: 'user',
};

export default config; 