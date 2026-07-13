import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

export interface PeerConnection {
  peerId: string;
  userName: string;
  connection: RTCPeerConnection;
  stream: MediaStream;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const useWebRTC = (socket: Socket | null, localStream: MediaStream | null, userId: string) => {
  const [peers, setPeers] = useState<PeerConnection[]>([]);
  const peersRef = useRef<{ [key: string]: PeerConnection }>({});

  const addPeer = useCallback((peerId: string, userName: string, connection: RTCPeerConnection, stream: MediaStream) => {
    setPeers(prev => {
      // Prevent duplicates
      if (prev.find(p => p.peerId === peerId)) return prev;
      return [...prev, { peerId, userName, connection, stream }];
    });
    peersRef.current[peerId] = { peerId, userName, connection, stream };
  }, []);

  const removePeer = useCallback((peerId: string) => {
    setPeers(prev => prev.filter(p => p.peerId !== peerId));
    if (peersRef.current[peerId]) {
      peersRef.current[peerId].connection.close();
      delete peersRef.current[peerId];
    }
  }, []);

  const createPeerConnection = useCallback((targetId: string, targetName: string, isInitiator: boolean) => {
    if (!socket || !localStream) return null;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    // Handle remote tracks
    pc.ontrack = (event) => {
      addPeer(targetId, targetName, pc, event.streams[0]);
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          target: targetId,
          candidate: event.candidate
        });
      }
    };

    if (isInitiator) {
      pc.createOffer().then(offer => {
        return pc.setLocalDescription(offer);
      }).then(() => {
        socket.emit('offer', {
          target: targetId,
          sdp: pc.localDescription
        });
      }).catch(console.error);
    }

    return pc;
  }, [socket, localStream, addPeer]);

  useEffect(() => {
    if (!socket || !localStream) return;

    // A new user joined, we are already in the room, so we initiate the connection (Offer)
    const handleUserJoined = ({ socketId, userName }: { userId: string, userName: string, socketId: string }) => {
      createPeerConnection(socketId, userName, true);
    };

    // Receive Offer from existing user
    const handleOffer = async ({ caller, sdp, userName }: { caller: string, sdp: RTCSessionDescriptionInit, userName: string }) => {
      const pc = createPeerConnection(caller, userName, false);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { target: caller, sdp: pc.localDescription });
      }
    };

    // Receive Answer
    const handleAnswer = async ({ caller, sdp }: { caller: string, sdp: RTCSessionDescriptionInit }) => {
      const pc = peersRef.current[caller]?.connection;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    };

    // Receive ICE Candidate
    const handleIceCandidate = async ({ sender, candidate }: { sender: string, candidate: RTCIceCandidateInit }) => {
      const pc = peersRef.current[sender]?.connection;
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate', e);
        }
      }
    };

    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      removePeer(socketId);
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, localStream, createPeerConnection, removePeer]);

  return { peers };
};
