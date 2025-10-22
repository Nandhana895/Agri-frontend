// Configuration file for the application
export const config = {
  // Backend API URL - change this to match your backend
  API_URL: import.meta.env.VITE_API_URL || (() => {
    console.warn('VITE_API_URL not set in environment variables. Please set VITE_API_URL in your .env file.');
    return 'http://localhost:5000/api';
  })(),
  
  // Frontend URL
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || (() => {
    console.warn('VITE_FRONTEND_URL not set in environment variables. Please set VITE_FRONTEND_URL in your .env file.');
    return 'http://localhost:5173';
  })(),
  
  // API timeout in milliseconds
  API_TIMEOUT: 10000,
  
  // Token storage key
  TOKEN_KEY: 'token',
  
  // User storage key
  USER_KEY: 'user',
  
  // Google OAuth Client ID
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || (() => {
    console.warn('VITE_GOOGLE_CLIENT_ID not set in environment variables. Google OAuth will be disabled.');
    return null;
  })(),
};

export default config; 