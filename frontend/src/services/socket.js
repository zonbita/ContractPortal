import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  if (!socket) {
    const url = import.meta.env.VITE_SOCKET_URL || undefined;
    socket = io(url, {
      path: '/socket.io',
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  } else if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
