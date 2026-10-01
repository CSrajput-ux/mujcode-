import { Server } from 'socket.io';
import { setupExamProctorSockets } from './examProctor.js';
import { verifyToken } from '../lib/auth.js';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

export function setupSockets(server) {
  // Parse allowed origins
  const allowedOrigins = (config.corsOrigin || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins.length === 1 && allowedOrigins[0] !== '*' ? allowedOrigins[0] : allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // ── Connection Authentication Guard ─────────────────────────────────────────
  // Enforces that every socket connection MUST present a valid, unexpired token
  io.use((socket, next) => {
    let rawToken = socket.handshake.auth?.token;

    if (!rawToken && socket.handshake.headers?.authorization) {
      rawToken = socket.handshake.headers.authorization.replace(/^Bearer\s+/, '').trim();
    }
    if (!rawToken && socket.handshake.headers?.['x-auth-token']) {
      rawToken = socket.handshake.headers['x-auth-token'].trim();
    }
    if (!rawToken && socket.handshake.headers?.cookie) {
      const match = socket.handshake.headers.cookie.match(/(?:^|;\s*)token=([^;]*)/);
      if (match) rawToken = decodeURIComponent(match[1]);
    }

    if (!rawToken) {
      logger.warn(`[SocketAuth] Rejected unauthenticated connection attempt: ${socket.id}`);
      return next(new Error('Authentication error: Missing token'));
    }

    const user = verifyToken(null, rawToken);
    if (!user) {
      logger.warn(`[SocketAuth] Rejected connection with invalid/expired token: ${socket.id}`);
      return next(new Error('Authentication error: Invalid or expired token'));
    }

    // Attach verified user directly to socket session
    socket.user = user;
    socket.userId = user.id;
    socket.userRole = user.role;
    socket.userName = user.name || user.email || 'User';

    next();
  });

  // Setup Secure Exam Mode real-time proctoring sockets
  setupExamProctorSockets(io);

  const liveNamespace = io.of('/live');

  // Namespace authentication
  liveNamespace.use((socket, next) => {
    if (!socket.user) {
      let rawToken = socket.handshake.auth?.token;
      if (!rawToken && socket.handshake.headers?.cookie) {
        const m = socket.handshake.headers.cookie.match(/(?:^|;\s*)token=([^;]*)/);
        if (m) rawToken = decodeURIComponent(m[1]);
      }
      const user = verifyToken(null, rawToken);
      if (!user) return next(new Error('Unauthorized'));
      socket.user = user;
      socket.userId = user.id;
      socket.userRole = user.role;
      socket.userName = user.name || user.email;
    }
    next();
  });

  liveNamespace.on('connection', (socket) => {
    logger.info(`[Socket] Authenticated client connected: ${socket.id} (user: ${socket.userId}, role: ${socket.userRole})`);

    // Join Room — derive user attributes from verified token
    socket.on('join-room', ({ roomId }) => {
      if (!roomId) return;
      socket.join(roomId);
      socket.roomId = roomId;

      // Notify others in the room using token-derived identity
      socket.to(roomId).emit('user-joined', {
        userId: socket.userId,
        userName: socket.userName,
        role: socket.userRole,
        socketId: socket.id
      });
    });

    // WebRTC Signaling
    socket.on('offer', (payload) => {
      if (!payload?.target) return;
      socket.to(payload.target).emit('offer', {
        caller: socket.id,
        sdp: payload.sdp,
        userId: socket.userId,
        userName: socket.userName
      });
    });

    socket.on('answer', (payload) => {
      if (!payload?.target) return;
      socket.to(payload.target).emit('answer', {
        caller: socket.id,
        sdp: payload.sdp
      });
    });

    socket.on('ice-candidate', (payload) => {
      if (!payload?.target) return;
      socket.to(payload.target).emit('ice-candidate', {
        sender: socket.id,
        candidate: payload.candidate
      });
    });

    // Chat — messages attributed strictly to verified user identity
    socket.on('send-message', (payload) => {
      if (!socket.roomId || !payload?.text) return;
      liveNamespace.to(socket.roomId).emit('receive-message', {
        id: Date.now().toString(),
        senderId: socket.userId,
        senderName: socket.userName,
        text: String(payload.text).slice(0, 1000), // sanitize length
        timestamp: new Date().toISOString()
      });
    });

    // Whiteboard Sync
    socket.on('whiteboard-draw', (payload) => {
      if (socket.roomId) socket.to(socket.roomId).emit('whiteboard-draw', payload);
    });

    socket.on('whiteboard-clear', (payload) => {
      // Only faculty or admin can clear whiteboard
      if (socket.userRole === 'faculty' || socket.userRole === 'admin') {
        if (socket.roomId) socket.to(socket.roomId).emit('whiteboard-clear', payload);
      }
    });

    socket.on('whiteboard-page-change', (payload) => {
      if (socket.roomId) socket.to(socket.roomId).emit('whiteboard-page-change', payload);
    });

    socket.on('whiteboard-add-page', (payload) => {
      if (socket.roomId) socket.to(socket.roomId).emit('whiteboard-add-page', payload);
    });

    // Faculty screen share notification
    socket.on('faculty-screen-share', (payload) => {
      if (socket.userRole === 'faculty' || socket.userRole === 'admin') {
        if (socket.roomId) socket.to(socket.roomId).emit('faculty-screen-share', payload);
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit('user-left', { userId: socket.userId, socketId: socket.id });
      }
    });
  });

  return io;
}
