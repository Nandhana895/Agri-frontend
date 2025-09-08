import { io } from 'socket.io-client';
import config from '../config/config';
import authService from './authService';

let socket = null;

export function getSocket() {
  if (socket && socket.connected) return socket;
  const token = authService.getToken();
  const base = (config.API_URL || '').replace(/\/$/, '').replace(/\/api$/, '');
  socket = io(base, {
    transports: ['websocket'],
    autoConnect: true,
    withCredentials: true,
    auth: token ? { token: `Bearer ${token}` } : undefined
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}


