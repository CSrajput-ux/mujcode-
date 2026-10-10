import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Presentation, PenTool, Monitor, Users, MessageSquare, Eye,
  Hand, LayoutGrid, ChevronUp, ChevronDown, Sparkles
} from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { ChatBox } from '../components/ChatBox';
import { Whiteboard } from '../components/Whiteboard';
import { VideoTile } from '../components/VideoTile';
import { leaveLiveClass } from '../../../app/services/liveClassService';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Participant {
  socketId: string;
  userId?: string;
  userName: string;
  role: string;
  isCamOn?: boolean;
  isMicOn?: boolean;
  isHandRaised?: boolean;
}

const AVATAR_COLORS = [
  'bg-indigo-600', 'bg-violet-600', 'bg-emerald-600', 'bg-cyan-600',
  'bg-amber-600', 'bg-rose-600', 'bg-blue-600', 'bg-teal-600'
];

export default function LiveClassroomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [user] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored
      ? JSON.parse(stored)
      : { id: 'temp-id', name: 'Guest User', role: 'student' };
  });

  const isFaculty = user.role === 'faculty' || user.role === 'admin';

  // ── Media State ─────────────────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // ── UI State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [viewMode, setViewMode] = useState<'whiteboard' | 'video'>(isFaculty ? 'whiteboard' : 'video');
  const [showVideoStrip, setShowVideoStrip] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // ── Socket & WebRTC ──────────────────────────────────────────────────────────
  const { socket, isConnected } = useSocket(
    roomId || 'default-room',
    user.id,
    user.name,
    user.role
  );

  const { peers } = useWebRTC(socket, localStream);

  // ── Initialize Local Media Streams (Mic & Camera) ───────────────────────────
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
        activeStream = stream;
        setLocalStream(stream);

        // Start with mic & camera muted/off initially to prevent unwanted audio feedback
        if (stream.getAudioTracks()[0]) stream.getAudioTracks()[0].enabled = false;
        if (stream.getVideoTracks()[0]) stream.getVideoTracks()[0].enabled = false;
      })
      .catch(err => {
        console.warn('Audio/Video media access denied or not available:', err.message);
        // Fallback to audio-only if camera is unavailable
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(audioStream => {
            activeStream = audioStream;
            setLocalStream(audioStream);
            if (audioStream.getAudioTracks()[0]) audioStream.getAudioTracks()[0].enabled = false;
          })
          .catch(aErr => console.warn('Microphone access also unavailable:', aErr.message));
      });

    return () => {
      activeStream?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ── Socket Event Tracking (Participants, Media States, Hand Raises) ─────────
  useEffect(() => {
    if (!socket) return;

    // Self participant record
    setParticipants(prev => {
      if (prev.some(p => p.socketId === 'me' || p.socketId === socket.id)) return prev;
      return [{
        socketId: socket.id || 'me',
        userId: user.id,
        userName: user.name,
        role: user.role,
        isCamOn: false,
        isMicOn: false,
        isHandRaised: false
      }, ...prev];
    });

    // Existing participants on join
    const handleRoomUsers = ({ users }: { users: Participant[] }) => {
      setParticipants(prev => {
        const selfList = prev.filter(p => p.socketId === 'me' || p.socketId === socket.id);
        const map = new Map<string, Participant>();
        selfList.forEach(p => map.set(p.socketId, p));
        (users || []).forEach(u => map.set(u.socketId, u));
        return Array.from(map.values());
      });
    };

    // User joined event
    const handleUserJoined = (participant: Participant) => {
      setParticipants(prev => {
        if (prev.find(p => p.socketId === participant.socketId)) return prev;
        toast.info(`${participant.userName} (${participant.role}) joined`);
        return [...prev, participant];
      });
    };

    // User left event
    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      setParticipants(prev => {
        const leaving = prev.find(p => p.socketId === socketId);
        if (leaving) toast.info(`${leaving.userName} left the session`);
        return prev.filter(p => p.socketId !== socketId);
      });
    };

    // Remote peer changed mic or camera state
    const handleMediaState = ({ socketId, isCamOn, isMicOn }: { socketId: string, isCamOn: boolean, isMicOn: boolean }) => {
      setParticipants(prev => prev.map(p => {
        if (p.socketId === socketId) {
          return { ...p, isCamOn, isMicOn };
        }
        return p;
      }));
    };

    // Hand raised event
    const handleHandRaised = ({ userName, raised }: { socketId: string, userName: string, raised: boolean }) => {
      if (raised) {
        toast.warning(`✋ ${userName} raised their hand!`);
      }
      setParticipants(prev => prev.map(p => {
        if (p.userName === userName) {
          return { ...p, isHandRaised: raised };
        }
        return p;
      }));
    };

    socket.on('room-users', handleRoomUsers);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('user-media-state', handleMediaState);
    socket.on('user-hand-raised', handleHandRaised);

    return () => {
      socket.off('room-users', handleRoomUsers);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('user-media-state', handleMediaState);
      socket.off('user-hand-raised', handleHandRaised);
    };
  }, [socket, user.id, user.name, user.role]);

  // ── Media Controls (Both Faculty & Student!) ────────────────────────────────
  const toggleMic = () => {
    const track = localStream?.getAudioTracks()[0];
    if (track) {
      const nextState = !track.enabled;
      track.enabled = nextState;
      setIsMicOn(nextState);

      socket?.emit('toggle-media', { isMicOn: nextState });
      toast.success(nextState ? 'Microphone turned ON' : 'Microphone MUTED');
    } else {
      toast.error('Microphone track unavailable');
    }
  };

  const toggleCam = () => {
    const track = localStream?.getVideoTracks()[0];
    if (track) {
      const nextState = !track.enabled;
      track.enabled = nextState;
      setIsCamOn(nextState);

      socket?.emit('toggle-media', { isCamOn: nextState });
      toast.success(nextState ? 'Camera turned ON — Presence visible' : 'Camera turned OFF');
    } else {
      // Try requesting video permissions if track wasn't initially present
      navigator.mediaDevices?.getUserMedia({ video: true })
        .then(newVideoStream => {
          const videoTrack = newVideoStream.getVideoTracks()[0];
          if (localStream && videoTrack) {
            localStream.addTrack(videoTrack);
            videoTrack.enabled = true;
            setIsCamOn(true);
            socket?.emit('toggle-media', { isCamOn: true });
            toast.success('Camera enabled — You are now visible');
          }
        })
        .catch(() => toast.error('Camera device not found or permission denied'));
    }
  };

  const toggleHandRaise = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    socket?.emit('raise-hand', { raised: nextState });
    toast.info(nextState ? '✋ Hand raised for instructor' : 'Hand lowered');
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        screenStreamRef.current = ss;
        setIsScreenSharing(true);
        ss.getVideoTracks()[0].onended = stopScreenShare;
        socket?.emit('faculty-screen-share', { sharing: true });
        toast.success('Screen sharing started');
      } catch (e) {
        console.error('Screen share error:', e);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);
    socket?.emit('faculty-screen-share', { sharing: false });
    toast.info('Screen sharing stopped');
  };

  const leaveClass = async () => {
    localStream?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    socket?.disconnect();
    if (roomId && !isFaculty) {
      try {
        await leaveLiveClass(roomId);
        toast.success('Attendance recorded successfully');
      } catch (e) {
        console.error(e);
      }
    }
    navigate(-1);
  };

  // Remote participants (excluding self)
  const remoteParticipants = participants.filter(p => p.socketId !== 'me' && p.socketId !== socket?.id);

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden text-white font-sans">
      
      {/* ── Top Bar ── */}
      <TopBar
        roomId={roomId || ''}
        isConnected={isConnected}
        isFaculty={isFaculty}
        attendeeCount={participants.length}
        onLeave={leaveClass}
      />

      {/* ── Main Layout (Content Area + Sidebar) ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Center Content Area ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* ── Mode 1: Interactive Whiteboard with Top Camera Presence Strip ── */}
          {viewMode === 'whiteboard' ? (
            <div className="flex-1 flex flex-col overflow-hidden p-3 gap-2">
              
              {/* Whiteboard Header with Camera Presence Strip Toggle */}
              <div className="flex items-center justify-between px-2 shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
                    isFaculty ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {isFaculty ? (
                      <><PenTool className="w-3.5 h-3.5 text-orange-400" /> Host Whiteboard — Drawing Active</>
                    ) : (
                      <><Eye className="w-3.5 h-3.5 text-slate-400" /> Faculty Whiteboard — Interactive View</>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 font-medium">
                    {participants.length} Participant{participants.length !== 1 ? 's' : ''} in class
                  </span>
                </div>

                <button
                  onClick={() => setShowVideoStrip(!showVideoStrip)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition-colors"
                >
                  <Video className="w-3.5 h-3.5 text-orange-400" />
                  {showVideoStrip ? 'Hide Camera Strip' : 'Show Camera Strip'}
                  {showVideoStrip ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* ── Active Camera Presence Strip (Shows every student & faculty!) ── */}
              {showVideoStrip && (
                <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-slate-800 shrink-0">
                  {/* Self Tile (Compact) */}
                  <VideoTile
                    stream={isScreenSharing && screenStreamRef.current ? screenStreamRef.current : localStream}
                    userName={user.name}
                    role={user.role}
                    isMe={true}
                    isCamOn={isCamOn}
                    isMicOn={isMicOn}
                    isHandRaised={isHandRaised}
                    isScreenSharing={isScreenSharing}
                    avatarColor="bg-orange-600"
                    compact={true}
                  />

                  {/* Remote Participants Tiles (Compact) */}
                  {remoteParticipants.map((p, idx) => {
                    const peer = peers.find(pr => pr.peerId === p.socketId);
                    return (
                      <VideoTile
                        key={p.socketId}
                        stream={peer?.stream || null}
                        userName={p.userName}
                        role={p.role}
                        isMe={false}
                        isCamOn={!!p.isCamOn}
                        isMicOn={!!p.isMicOn}
                        isHandRaised={!!p.isHandRaised}
                        avatarColor={AVATAR_COLORS[idx % AVATAR_COLORS.length]}
                        compact={true}
                      />
                    );
                  })}
                </div>
              )}

              {/* Digital Whiteboard Canvas */}
              <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 bg-white shadow-2xl">
                <Whiteboard socket={socket} role={user.role} />
              </div>
            </div>
          ) : (
            /* ── Mode 2: Multi-Participant Camera Gallery Video Grid ── */
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="max-w-6xl mx-auto h-full flex flex-col justify-center">
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                      Student & Faculty Video Grid ({participants.length} Active)
                    </h2>
                  </div>
                  
                  {isCamOn ? (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                      Your Camera is Live
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full font-bold">
                      Camera Off — Avatar Active
                    </span>
                  )}
                </div>

                {/* Dynamic Responsive Grid Layout */}
                <div className={`grid gap-4 w-full ${
                  participants.length <= 1 
                    ? 'grid-cols-1 max-w-2xl mx-auto' 
                    : participants.length === 2 
                      ? 'grid-cols-1 sm:grid-cols-2' 
                      : participants.length <= 4 
                        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2' 
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}>
                  
                  {/* Self Tile (Local User) */}
                  <VideoTile
                    stream={isScreenSharing && screenStreamRef.current ? screenStreamRef.current : localStream}
                    userName={user.name}
                    role={user.role}
                    isMe={true}
                    isCamOn={isCamOn}
                    isMicOn={isMicOn}
                    isHandRaised={isHandRaised}
                    isScreenSharing={isScreenSharing}
                    avatarColor="bg-orange-600"
                    compact={false}
                  />

                  {/* Remote Participant Tiles */}
                  {remoteParticipants.map((p, idx) => {
                    const peer = peers.find(pr => pr.peerId === p.socketId);
                    return (
                      <VideoTile
                        key={p.socketId}
                        stream={peer?.stream || null}
                        userName={p.userName}
                        role={p.role}
                        isMe={false}
                        isCamOn={!!p.isCamOn}
                        isMicOn={!!p.isMicOn}
                        isHandRaised={!!p.isHandRaised}
                        avatarColor={AVATAR_COLORS[idx % AVATAR_COLORS.length]}
                        compact={false}
                      />
                    );
                  })}
                </div>

              </div>
            </div>
          )}

          {/* ── Bottom Interactive Control Bar ── */}
          <ControlBar
            isFaculty={isFaculty}
            isMicOn={isMicOn}
            isCamOn={isCamOn}
            isHandRaised={isHandRaised}
            isScreenSharing={isScreenSharing}
            viewMode={viewMode}
            onToggleMic={toggleMic}
            onToggleCam={toggleCam}
            onToggleHandRaise={toggleHandRaise}
            onToggleScreenShare={toggleScreenShare}
            onToggleView={() => setViewMode(v => v === 'whiteboard' ? 'video' : 'whiteboard')}
            onLeave={leaveClass}
          />
        </div>

        {/* ── Right Collapsible Sidebar (Chat & Participants List) ── */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
          
          {/* Tab Selector */}
          <div className="flex border-b border-slate-800">
            <button
              className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'chat'
                  ? 'border-[#FF7A00] text-[#FF7A00] bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
            <button
              className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'participants'
                  ? 'border-[#FF7A00] text-[#FF7A00] bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveTab('participants')}
            >
              <Users className="w-4 h-4" />
              Presence ({participants.length})
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' ? (
              <ChatBox socket={socket} currentUserId={user.id} />
            ) : (
              <ParticipantsPresenceList 
                participants={participants} 
                currentUserId={user.id} 
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Top Bar Component ────────────────────────────────────────────────────────
function TopBar({
  roomId, isConnected, isFaculty, attendeeCount, onLeave
}: {
  roomId: string; 
  isConnected: boolean; 
  isFaculty: boolean; 
  attendeeCount: number;
  onLeave: () => void;
}) {
  return (
    <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-5 shrink-0 shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#FF7A00] rounded-xl flex items-center justify-center font-black text-sm text-white shadow-md shadow-orange-500/20">
          MC
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
            <span>{isFaculty ? '🎓 Host Session:' : '📚 Live Class:'}</span>
            <span className="text-orange-400 font-mono text-xs">{roomId}</span>
          </h1>
          <p className={`text-[11px] font-semibold flex items-center gap-1.5 ${
            isConnected ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {isConnected ? 'Connected & Broadcasting' : 'Connecting to Room...'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full flex items-center gap-1.5 border border-red-500/30 font-bold">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
          LIVE NOW
        </span>
        
        <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-semibold border border-slate-700">
          {attendeeCount} Online
        </span>

        <span className={`text-xs px-2.5 py-1 rounded-full font-black border ${
          isFaculty ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        }`}>
          {isFaculty ? 'FACULTY' : 'STUDENT'}
        </span>
      </div>
    </div>
  );
}

// ─── Control Bar Component (With Student Camera + Mic + Hand Raise!) ─────────
function ControlBar({
  isFaculty, isMicOn, isCamOn, isHandRaised, isScreenSharing, viewMode,
  onToggleMic, onToggleCam, onToggleHandRaise, onToggleScreenShare, onToggleView, onLeave
}: {
  isFaculty: boolean;
  isMicOn: boolean; 
  isCamOn: boolean; 
  isHandRaised: boolean;
  isScreenSharing: boolean;
  viewMode: 'whiteboard' | 'video';
  onToggleMic: () => void; 
  onToggleCam: () => void;
  onToggleHandRaise: () => void;
  onToggleScreenShare: () => void; 
  onToggleView: () => void;
  onLeave: () => void;
}) {
  return (
    <div className="h-[74px] bg-slate-900 border-t border-slate-800 flex items-center justify-center px-6 gap-3.5 shrink-0 shadow-lg">

      {/* 1. Microphone Toggle (Both Faculty & Student!) */}
      <button 
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md ${
          isMicOn 
            ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' 
            : 'bg-red-500 text-white hover:bg-red-600 ring-2 ring-red-400/20'
        }`}
        onClick={onToggleMic} 
        title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
      >
        {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>

      {/* 2. CAMERA TOGGLE (For BOTH Faculty & Students!) */}
      <button 
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md ${
          isCamOn 
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/30' 
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
        }`}
        onClick={onToggleCam} 
        title={isCamOn ? 'Turn Camera Off' : 'Turn Camera On (Show Presence)'}
      >
        {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>

      {/* 3. Hand Raise Button (Student can indicate question / presence!) */}
      {!isFaculty && (
        <button
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md ${
            isHandRaised 
              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/50' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          onClick={onToggleHandRaise}
          title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
        >
          <Hand className="w-5 h-5" />
        </button>
      )}

      {/* 4. Screen Share Toggle (Faculty) */}
      {isFaculty && (
        <button
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md ${
            isScreenSharing 
              ? 'bg-[#FF7A00] text-white ring-2 ring-orange-500/30' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <Monitor className="w-5 h-5" />
        </button>
      )}

      {/* 5. View Mode Toggle (Whiteboard Canvas ↔ Multi-Camera Grid) */}
      <button
        className={`h-12 px-4 rounded-2xl flex items-center gap-2 transition-all font-bold text-xs shadow-md ${
          viewMode === 'video' 
            ? 'bg-orange-600 text-white ring-2 ring-orange-500/30' 
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
        }`}
        onClick={onToggleView}
        title={viewMode === 'whiteboard' ? 'Switch to All Camera Grid' : 'Switch to Digital Whiteboard'}
      >
        {viewMode === 'whiteboard' ? (
          <><LayoutGrid className="w-4 h-4" /> Camera Grid</>
        ) : (
          <><PenTool className="w-4 h-4" /> Whiteboard</>
        )}
      </button>

      <div className="w-px h-8 bg-slate-800 mx-2" />

      {/* 6. Leave / End Session */}
      <button
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl px-5 h-12 text-sm font-bold shadow-md shadow-red-600/20 transition-all"
        onClick={onLeave}
      >
        <PhoneOff className="w-4 h-4" />
        {isFaculty ? 'End Class' : 'Leave Class'}
      </button>
    </div>
  );
}

// ─── Participants Presence List Component ─────────────────────────────────────
function ParticipantsPresenceList({
  participants, currentUserId
}: {
  participants: Participant[]; 
  currentUserId: string;
}) {
  const faculty = participants.filter(p => p.role === 'faculty' || p.role === 'admin');
  const students = participants.filter(p => p.role !== 'faculty' && p.role !== 'admin');

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      
      {/* Instructor Section */}
      <div>
        <p className="text-[10px] text-slate-400 uppercase font-black px-2 py-1 tracking-wider">
          Instructor / Host ({faculty.length})
        </p>
        <div className="space-y-1 mt-1">
          {faculty.map((p, idx) => (
            <ParticipantPresenceRow key={p.socketId} p={p} idx={idx} isMe={p.userId === currentUserId} />
          ))}
        </div>
      </div>

      {/* Students Presence Section */}
      <div>
        <p className="text-[10px] text-slate-400 uppercase font-black px-2 py-1 tracking-wider flex items-center justify-between">
          <span>Students In Class ({students.length})</span>
          <span className="text-emerald-400 lowercase font-medium">● tracking attendance</span>
        </p>
        
        {students.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <Users className="w-6 h-6 mx-auto mb-1 opacity-40" />
            No students joined yet
          </div>
        ) : (
          <div className="space-y-1 mt-1">
            {students.map((p, idx) => (
              <ParticipantPresenceRow key={p.socketId} p={p} idx={idx + faculty.length} isMe={p.userId === currentUserId} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function ParticipantPresenceRow({ p, idx, isMe }: { p: Participant; idx: number; isMe: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-slate-800/60 rounded-xl transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center font-black text-xs text-white shrink-0`}>
          {p.userName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
            {p.userName}
            {isMe && <span className="text-[10px] text-slate-400 font-normal">(You)</span>}
          </p>
          <p className="text-[10px] text-slate-500 capitalize">{p.role}</p>
        </div>
      </div>

      {/* Status icons (Cam, Mic, Hand) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {p.isHandRaised && (
          <span className="text-amber-400 text-xs animate-bounce" title="Hand Raised">
            ✋
          </span>
        )}
        <span className={`p-1 rounded-md text-[10px] ${
          p.isCamOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
        }`} title={p.isCamOn ? 'Camera Active' : 'Camera Off'}>
          {p.isCamOn ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
        </span>
        <span className={`p-1 rounded-md text-[10px] ${
          p.isMicOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        }`} title={p.isMicOn ? 'Mic Active' : 'Muted'}>
          {p.isMicOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
        </span>
      </div>
    </div>
  );
}
