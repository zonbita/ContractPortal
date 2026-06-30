import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { saveMessage, markConversationRead, deleteMessage } from '../services/chatService.js';

const userRoom = (id) => `user:${id}`;

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name email role isActive');
      if (!user || !user.isActive) return next(new Error('Unauthorized'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user._id);
    socket.join(userRoom(userId));

    socket.broadcast.emit('presence:online', { userId });

    socket.on('message:send', async ({ to, content } = {}, ack) => {
      try {
        if (!to || !content?.trim()) return;
        const message = await saveMessage(userId, to, content);
        const payload = message.toObject ? message.toObject() : message;
        io.to(userRoom(to)).emit('message:new', payload);
        socket.emit('message:new', payload);
        ack?.({ ok: true, message: payload });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on('message:delete', async ({ messageId } = {}, ack) => {
      try {
        if (!messageId) return ack?.({ ok: false });
        const res = await deleteMessage(messageId, userId);
        if (!res) return ack?.({ ok: false, error: 'Not allowed' });
        io.to(userRoom(res.recipientId)).emit('message:deleted', { messageId: res.messageId });
        socket.emit('message:deleted', { messageId: res.messageId });
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on('message:read', async ({ from } = {}) => {
      if (!from) return;
      await markConversationRead(userId, from);
      io.to(userRoom(from)).emit('message:read', { by: userId });
    });

    socket.on('typing', ({ to, isTyping } = {}) => {
      if (!to) return;
      io.to(userRoom(to)).emit('typing', { from: userId, isTyping: !!isTyping });
    });

    socket.on('disconnect', () => {
      socket.broadcast.emit('presence:offline', { userId });
    });
  });

  return io;
}
