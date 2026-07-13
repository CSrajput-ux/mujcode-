import { Server } from 'socket.io';

export function setupSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production
      methods: ['GET', 'POST']
    }
  });

  const liveNamespace = io.of('/live');

  liveNamespace.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join Room
    socket.on('join-room', ({ roomId, userId, userName, role }) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.userId = userId;
      socket.userName = userName;
      socket.role = role;

      console.log(`[Socket] ${userName} (${userId}) joined room ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('user-joined', { userId, userName, role, socketId: socket.id });
    });

    // WebRTC Signaling
    socket.on('offer', (payload) => {
      socket.to(payload.target).emit('offer', {
        caller: socket.id,
        sdp: payload.sdp,
        userId: socket.userId,
        userName: socket.userName
      });
    });

    socket.on('answer', (payload) => {
      socket.to(payload.target).emit('answer', {
        caller: socket.id,
        sdp: payload.sdp
      });
    });

    socket.on('ice-candidate', (payload) => {
      socket.to(payload.target).emit('ice-candidate', {
        sender: socket.id,
        candidate: payload.candidate
      });
    });

    // Chat
    socket.on('send-message', (payload) => {
      liveNamespace.to(socket.roomId).emit('receive-message', {
        id: Date.now().toString(),
        senderId: socket.userId,
        senderName: socket.userName,
        text: payload.text,
        timestamp: new Date().toISOString()
      });
    });

    // Whiteboard Sync
    socket.on('whiteboard-draw', (payload) => {
      socket.to(socket.roomId).emit('whiteboard-draw', payload);
    });
    
    socket.on('whiteboard-clear', () => {
      socket.to(socket.roomId).emit('whiteboard-clear');
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      if (socket.roomId) {
        socket.to(socket.roomId).emit('user-left', { userId: socket.userId, socketId: socket.id });
      }
    });
  });

  return io;
}
