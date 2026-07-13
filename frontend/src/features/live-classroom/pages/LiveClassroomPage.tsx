import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Users, Presentation, Settings, Hand, PenTool } from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { ChatBox } from '../components/ChatBox';
import { Whiteboard } from '../components/Whiteboard';

export default function LiveClassroomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  // Mock User Data (In a real app, this comes from Context/Redux)
  const [user] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : { id: 'temp-id', name: 'Student', role: 'student' };
  });

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(false); // Default off for now
  const [isCamOn, setIsCamOn] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [viewMode, setViewMode] = useState<'video' | 'whiteboard'>('video');
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const { socket, isConnected } = useSocket(roomId || 'default-room', user.id, user.name, user.role);
  const { peers } = useWebRTC(socket, localStream, user.id);

  useEffect(() => {
    // Request Media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Disable tracks based on initial state
        stream.getAudioTracks()[0].enabled = isMicOn;
        stream.getVideoTracks()[0].enabled = isCamOn;
      })
      .catch(err => {
        console.error('Failed to get media devices', err);
      });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const toggleMic = () => {
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMicOn(track.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsCamOn(track.enabled);
      }
    }
  };

  const leaveClass = () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
    socket?.disconnect();
    navigate(-1);
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden text-white">
      {/* Top Bar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-[#FF7A00] rounded-lg flex items-center justify-center font-bold">
            MC
          </div>
          <div>
            <h1 className="font-semibold text-sm">Live Class: {roomId}</h1>
            <p className="text-xs text-slate-400">Status: {isConnected ? 'Connected' : 'Connecting...'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-800 px-3 py-1 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            Live
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Main Area (Video Grid or Whiteboard) */}
        <div className="flex-1 p-4 overflow-y-auto">
          {viewMode === 'video' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr h-full">
              {/* Local Video */}
              <div className="bg-slate-900 rounded-xl overflow-hidden relative aspect-video shadow-lg border border-slate-800">
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
                {!isCamOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold">
                      {user.name.charAt(0)}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs flex items-center gap-2">
                  <span>{user.name} (You)</span>
                  {!isMicOn && <MicOff className="w-3 h-3 text-red-400" />}
                </div>
              </div>

              {/* Remote Peers */}
              {peers.map(peer => (
                <div key={peer.peerId} className="bg-slate-900 rounded-xl overflow-hidden relative aspect-video shadow-lg border border-slate-800">
                  <VideoPlayer stream={peer.stream} name={peer.userName} />
                </div>
              ))}
            </div>
          ) : (
            <Whiteboard socket={socket} role={user.role} />
          )}
        </div>

        {/* Sidebar (Chat/Participants) */}
        <div className="w-full md:w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="flex border-b border-slate-800">
            <button 
              className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'chat' ? 'border-[#FF7A00] text-[#FF7A00]' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button 
              className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'participants' ? 'border-[#FF7A00] text-[#FF7A00]' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              onClick={() => setActiveTab('participants')}
            >
              Participants ({peers.length + 1})
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' ? (
              <ChatBox socket={socket} currentUserId={user.id} />
            ) : (
              <div className="p-4 space-y-4 overflow-y-auto h-full">
                {/* Local User */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 text-sm">{user.name} (You)</div>
                </div>
                {/* Remote Peers */}
                {peers.map(p => (
                  <div key={p.peerId} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
                      {p.userName.charAt(0)}
                    </div>
                    <div className="flex-1 text-sm">{p.userName}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="h-20 bg-slate-900 border-t border-slate-800 flex items-center justify-center px-4 gap-4 z-10">
        <Button 
          variant="outline" 
          size="icon" 
          className={`w-12 h-12 rounded-full border-0 ${isMicOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
          onClick={toggleMic}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className={`w-12 h-12 rounded-full border-0 ${isCamOn ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
          onClick={toggleCam}
        >
          {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className={`w-12 h-12 rounded-full border-0 ${viewMode === 'video' ? 'bg-slate-800 hover:bg-slate-700' : 'bg-[#FF7A00]/20 text-[#FF7A00] hover:bg-[#FF7A00]/30'}`}
          onClick={() => setViewMode('video')}
          title="Video Grid"
        >
          <Presentation className="w-5 h-5" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className={`w-12 h-12 rounded-full border-0 ${viewMode === 'whiteboard' ? 'bg-[#FF7A00]/20 text-[#FF7A00] hover:bg-[#FF7A00]/30' : 'bg-slate-800 hover:bg-slate-700'}`}
          onClick={() => setViewMode('whiteboard')}
          title="Whiteboard"
        >
          <PenTool className="w-5 h-5" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="w-12 h-12 rounded-full border-0 bg-slate-800 hover:bg-slate-700"
        >
          <Hand className="w-5 h-5" />
        </Button>
        <div className="w-px h-8 bg-slate-800 mx-2"></div>
        <Button 
          variant="destructive" 
          className="rounded-full px-6 bg-red-600 hover:bg-red-700 h-10"
          onClick={leaveClass}
        >
          <PhoneOff className="w-4 h-4 mr-2" />
          Leave Class
        </Button>
      </div>
    </div>
  );
}

// Helper component to play remote streams
function VideoPlayer({ stream, name }: { stream: MediaStream, name: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream.getVideoTracks().some(track => track.enabled && track.readyState === 'live');

  return (
    <>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover"
      />
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold">
            {name.charAt(0)}
          </div>
        </div>
      )}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs flex items-center gap-2">
        <span>{name}</span>
      </div>
    </>
  );
}
