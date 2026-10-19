import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { setupExamProctorSockets } from './examProctor.js';
import { setupAgentGateway } from './agentGateway.js';
import { verifyToken } from '../lib/auth.js';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';
import { getRawRedisClient } from '../config/redis.js';

import { isAllowedOrigin } from '../lib/cors.js';

export function setupSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error('CORS not allowed'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // ── Multi-Instance Distributed Redis Adapter ────────────────────────────────
  const rawClient = getRawRedisClient();
  const isRedisReady = rawClient && rawClient.status === 'ready' && rawClient._healthy;
  if (isRedisReady && process.env.REDIS_URI) {
    try {
      const pubClient = rawClient.duplicate({ enableOfflineQueue: true });
      const subClient = rawClient.duplicate({ enableOfflineQueue: true });

      pubClient.on('error', (err) => logger.warn(`[Socket.IO] Redis pubClient error: ${err.message}`));
      subClient.on('error', (err) => logger.warn(`[Socket.IO] Redis subClient error: ${err.message}`));

      io.adapter(createAdapter(pubClient, subClient));
      logger.info('[Socket.IO] Attached distributed Redis adapter for multi-instance broadcast.');
    } catch (err) {
      logger.warn(`[Socket.IO] Failed to attach Redis adapter: ${err.message}. Using default in-memory adapter.`);
    }
  } else {
    logger.info('[Socket.IO] Using standard in-memory adapter (Redis not connected or single-node mode).');
  }

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

  // Setup Local Compiler Agent Gateway
  setupAgentGateway(io);

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
      socket.isCamOn = false;
      socket.isMicOn = false;

      // Send list of current room participants to newly joined user
      const roomSockets = liveNamespace.adapter.rooms.get(roomId);
      const existingUsers = [];
      if (roomSockets) {
        for (const sId of roomSockets) {
          if (sId !== socket.id) {
            const targetSocket = liveNamespace.sockets.get(sId);
            if (targetSocket) {
              existingUsers.push({
                socketId: targetSocket.id,
                userId: targetSocket.userId,
                userName: targetSocket.userName,
                role: targetSocket.userRole,
                isCamOn: targetSocket.isCamOn || false,
                isMicOn: targetSocket.isMicOn || false
              });
            }
          }
        }
      }
      socket.emit('room-users', { users: existingUsers });

      // Notify others in the room using token-derived identity
      socket.to(roomId).emit('user-joined', {
        userId: socket.userId,
        userName: socket.userName,
        role: socket.userRole,
        socketId: socket.id,
        isCamOn: false,
        isMicOn: false
      });
    });

    // Toggle Camera / Mic state
    socket.on('toggle-media', (payload) => {
      if (payload?.isCamOn !== undefined) socket.isCamOn = !!payload.isCamOn;
      if (payload?.isMicOn !== undefined) socket.isMicOn = !!payload.isMicOn;
      if (socket.roomId) {
        socket.to(socket.roomId).emit('user-media-state', {
          socketId: socket.id,
          userId: socket.userId,
          userName: socket.userName,
          isCamOn: socket.isCamOn,
          isMicOn: socket.isMicOn
        });
      }
    });

    // Raise / Lower Hand
    socket.on('raise-hand', (payload) => {
      if (socket.roomId) {
        liveNamespace.to(socket.roomId).emit('user-hand-raised', {
          socketId: socket.id,
          userId: socket.userId,
          userName: socket.userName,
          raised: !!payload?.raised
        });
      }
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

    // WebRTC Signaling Answer
    socket.on('answer', (payload) => {
      if (!payload?.target) return;
      socket.to(payload.target).emit('answer', {
        caller: socket.id,
        sdp: payload.sdp
      });
    });

    // WebRTC ICE Candidate
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

    // Clear Whiteboard (Faculty/Admin only)
    socket.on('whiteboard-clear', (payload) => {
      if (socket.userRole === 'faculty' || socket.userRole === 'admin') {
        if (socket.roomId) socket.to(socket.roomId).emit('whiteboard-clear', payload);
      }
    });

    // Change Whiteboard Page
    socket.on('whiteboard-page-change', (payload) => {
      if (socket.roomId) socket.to(socket.roomId).emit('whiteboard-page-change', payload);
    });

    // Add Whiteboard Page
    socket.on('whiteboard-add-page', (payload) => {
      if (socket.roomId) socket.to(socket.roomId).emit('whiteboard-add-page', payload);
    });

    // Faculty Screen Share Notification
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
