import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Presentation, Hand, PenTool, Monitor, Users, MessageSquare, Eye
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { useSocket } from '../hooks/useSocket';
import { ChatBox } from '../components/ChatBox';
import { Whiteboard } from '../components/Whiteboard';
import { leaveLiveClass } from '../../../app/services/liveClassService';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Participant {
  socketId: string;
  userName: string;
  role: string;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LiveClassroomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [user] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored
      ? JSON.parse(stored)
      : { id: 'temp-id', name: 'Guest', role: 'student' };
  });

  const isFaculty = user.role === 'faculty';

  // ── Media State ─────────────────────────────────────────────────────────────
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // ── UI State ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [viewMode, setViewMode] = useState<'whiteboard' | 'video'>('whiteboard');
  const [participants, setParticipants] = useState<Participant[]>([]);

  // ── Socket ──────────────────────────────────────────────────────────────────
  const { socket, isConnected } = useSocket(
    roomId || 'default-room',
    user.id,
    user.name,
    user.role
  );

  // ── Track participants from socket events ────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Add self
    setParticipants([{ socketId: socket.id || 'me', userName: user.name, role: user.role }]);

    const handleUserJoined = ({ socketId, userName, role }: Participant) => {
      setParticipants(prev => {
        if (prev.find(p => p.socketId === socketId)) return prev;
        return [...prev, { socketId, userName, role }];
      });
    };

    const handleUserLeft = ({ socketId }: { socketId: string }) => {
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, user.name, user.role]);

  // ── Media init (Faculty only needs cam/mic; student may use mic too) ────────
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        if (stream.getAudioTracks()[0]) stream.getAudioTracks()[0].enabled = false;
        if (stream.getVideoTracks()[0]) stream.getVideoTracks()[0].enabled = false;
      })
      .catch(err => console.error('Media error:', err));

    return () => {
      localStream?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Controls ─────────────────────────────────────────────────────────────────
  const toggleMic = () => {
    const track = localStream?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMicOn(track.enabled); }
  };

  const toggleCam = () => {
    const track = localStream?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCamOn(track.enabled); }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        screenStreamRef.current = ss;
        setIsScreenSharing(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = ss;
        ss.getVideoTracks()[0].onended = stopScreenShare;
        // Broadcast screen-share via socket so students see a notification
        socket?.emit('faculty-screen-share', { sharing: true });
      } catch (e) { console.error('Screen share error:', e); }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
    socket?.emit('faculty-screen-share', { sharing: false });
  };

  const leaveClass = async () => {
    localStream?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    socket?.disconnect();
    if (roomId && !isFaculty) {
      try { await leaveLiveClass(roomId); } catch (e) { console.error(e); }
    }
    navigate(-1);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden text-white">
      {/* ── Top Bar ── */}
      <TopBar
        roomId={roomId || ''}
        isConnected={isConnected}
        isFaculty={isFaculty}
        onLeave={leaveClass}
      />

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Content Area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── View: Whiteboard (primary) or Faculty Video ── */}
          <div className="flex-1 p-3 overflow-hidden">
            {viewMode === 'whiteboard' ? (
              <div className="h-full flex flex-col">
                {/* Role label */}
                <div className={`text-xs font-semibold mb-2 px-2 py-1 rounded-lg w-fit flex items-center gap-1.5
                  ${isFaculty ? 'bg-[#FF7A00]/20 text-[#FF7A00]' : 'bg-slate-800 text-slate-300'}`}>
                  {isFaculty ? (
                    <><PenTool className="w-3 h-3" /> Your Whiteboard — Draw freely</>
                  ) : (
                    <><Eye className="w-3 h-3" /> Faculty's Whiteboard — Watch mode</>
                  )}
                </div>
                <div className="flex-1">
                  <Whiteboard socket={socket} role={user.role} />
                </div>
              </div>
            ) : (
              /* Faculty's camera / screen share for faculty view */
              <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-3 auto-rows-fr">
                <div className="bg-slate-900 rounded-xl overflow-hidden relative aspect-video border border-slate-800">
                  <video
                    ref={localVideoRef}
                    autoPlay muted playsInline
                    className={`w-full h-full object-cover ${!isScreenSharing ? 'scale-x-[-1]' : ''}`}
                  />
                  {!isCamOn && !isScreenSharing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                      <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs flex items-center gap-2">
                    <span>{user.name} (You){isScreenSharing ? ' — Screen' : ''}</span>
                    {!isMicOn && <MicOff className="w-3 h-3 text-red-400" />}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Control Bar ── */}
          <ControlBar
            isFaculty={isFaculty}
            isMicOn={isMicOn}
            isCamOn={isCamOn}
            isScreenSharing={isScreenSharing}
            viewMode={viewMode}
            onToggleMic={toggleMic}
            onToggleCam={toggleCam}
            onToggleScreenShare={toggleScreenShare}
            onToggleView={() => setViewMode(v => v === 'whiteboard' ? 'video' : 'whiteboard')}
            onLeave={leaveClass}
          />
        </div>

        {/* ── Sidebar ── */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
          {/* Tab Headers */}
          <div className="flex border-b border-slate-800">
            <button
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5
                ${activeTab === 'chat' ? 'border-[#FF7A00] text-[#FF7A00]' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5
                ${activeTab === 'participants' ? 'border-[#FF7A00] text-[#FF7A00]' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              onClick={() => setActiveTab('participants')}
            >
              <Users className="w-3.5 h-3.5" />
              Participants ({participants.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' ? (
              <ChatBox socket={socket} currentUserId={user.id} />
            ) : (
              <ParticipantsList participants={participants} currentUserId={user.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Top Bar Component ────────────────────────────────────────────────────────
function TopBar({
  roomId, isConnected, isFaculty, onLeave
}: {
  roomId: string; isConnected: boolean; isFaculty: boolean; onLeave: () => void;
}) {
  return (
    <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#FF7A00] rounded-lg flex items-center justify-center font-bold text-sm">
          MC
        </div>
        <div>
          <h1 className="font-semibold text-sm">
            {isFaculty ? '🎓 Teaching:' : '📚 Attending:'} {roomId}
          </h1>
          <p className={`text-xs ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
            ● {isConnected ? 'Connected' : 'Connecting...'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full flex items-center gap-1.5 border border-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
          LIVE
        </span>
        {isFaculty && (
          <span className="text-xs bg-[#FF7A00]/20 text-[#FF7A00] px-2 py-1 rounded-full border border-[#FF7A00]/30">
            Faculty
          </span>
        )}
        {!isFaculty && (
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
            Student
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Control Bar Component ────────────────────────────────────────────────────
function ControlBar({
  isFaculty, isMicOn, isCamOn, isScreenSharing, viewMode,
  onToggleMic, onToggleCam, onToggleScreenShare, onToggleView, onLeave
}: {
  isFaculty: boolean;
  isMicOn: boolean; isCamOn: boolean; isScreenSharing: boolean;
  viewMode: 'whiteboard' | 'video';
  onToggleMic: () => void; onToggleCam: () => void;
  onToggleScreenShare: () => void; onToggleView: () => void;
  onLeave: () => void;
}) {
  const iconBtn = (active: boolean, danger = false) =>
    `w-11 h-11 rounded-full border-0 flex items-center justify-center transition-all
    ${danger
      ? (active ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30')
      : (active ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30')
    }`;

  return (
    <div className="h-[72px] bg-slate-900 border-t border-slate-800 flex items-center justify-center px-6 gap-3 shrink-0">

      {/* Mic — both faculty & student */}
      <button className={iconBtn(isMicOn)} onClick={onToggleMic} title={isMicOn ? 'Mute' : 'Unmute'}>
        {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>

      {/* Camera — Faculty only */}
      {isFaculty && (
        <button className={iconBtn(isCamOn)} onClick={onToggleCam} title={isCamOn ? 'Stop Camera' : 'Start Camera'}>
          {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
      )}

      {/* Screen Share — Faculty only */}
      {isFaculty && (
        <button
          className={`w-11 h-11 rounded-full border-0 flex items-center justify-center transition-all
            ${isScreenSharing ? 'bg-[#FF7A00] text-white hover:bg-[#e66a00]' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          onClick={onToggleScreenShare}
          title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        >
          <Monitor className="w-5 h-5" />
        </button>
      )}

      {/* View Toggle (Whiteboard ↔ Video) — Faculty only */}
      {isFaculty && (
        <button
          className={`w-11 h-11 rounded-full border-0 flex items-center justify-center transition-all
            ${viewMode === 'video' ? 'bg-[#FF7A00]/20 text-[#FF7A00]' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          onClick={onToggleView}
          title={viewMode === 'whiteboard' ? 'Switch to Camera View' : 'Switch to Whiteboard'}
        >
          {viewMode === 'whiteboard' ? <Presentation className="w-5 h-5" /> : <PenTool className="w-5 h-5" />}
        </button>
      )}

      <div className="w-px h-8 bg-slate-800 mx-1" />

      {/* Leave Button */}
      <button
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-all"
        onClick={onLeave}
      >
        <PhoneOff className="w-4 h-4" />
        {isFaculty ? 'End Class' : 'Leave Class'}
      </button>
    </div>
  );
}

// ─── Participants List Component ──────────────────────────────────────────────
function ParticipantsList({
  participants, currentUserId
}: {
  participants: Participant[]; currentUserId: string;
}) {
  const faculty = participants.filter(p => p.role === 'faculty');
  const students = participants.filter(p => p.role !== 'faculty');

  const avatarColors = [
    'bg-violet-600', 'bg-blue-600', 'bg-teal-600', 'bg-emerald-600',
    'bg-amber-600', 'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600'
  ];

  const ParticipantRow = ({ p, idx }: { p: Participant; idx: number }) => {
    const isMe = p.socketId === currentUserId || (p.role === 'faculty' && p.userName);
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/50 rounded-lg mx-2 transition-colors">
        <div className={`w-8 h-8 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center font-bold text-xs text-white shrink-0`}>
          {p.userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-200 truncate">
            {p.userName}
            {isMe && <span className="text-slate-500 ml-1">(You)</span>}
          </p>
          <p className="text-xs text-slate-500 capitalize">{p.role}</p>
        </div>
        {p.role === 'faculty' && (
          <span className="text-[10px] bg-[#FF7A00]/20 text-[#FF7A00] px-1.5 py-0.5 rounded font-semibold shrink-0">
            HOST
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto py-3 space-y-1">
      {/* Faculty Section */}
      {faculty.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-semibold px-4 py-1 tracking-wider">Instructor</p>
          {faculty.map((p, i) => <ParticipantRow key={p.socketId} p={p} idx={i} />)}
        </div>
      )}

      {/* Students Section */}
      {students.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] text-slate-500 uppercase font-semibold px-4 py-1 tracking-wider">
            Students ({students.length})
          </p>
          {students.map((p, i) => <ParticipantRow key={p.socketId} p={p} idx={i + faculty.length} />)}
        </div>
      )}

      {participants.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <Users className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No one else here yet</p>
        </div>
      )}
    </div>
  );
}
