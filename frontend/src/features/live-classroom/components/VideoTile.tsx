import { useEffect, useRef } from 'react';
import { Mic, MicOff, Hand, Video, VideoOff } from 'lucide-react';

interface VideoTileProps {
  stream?: MediaStream | null;
  userName: string;
  role: string;
  isMe?: boolean;
  isCamOn: boolean;
  isMicOn: boolean;
  isHandRaised?: boolean;
  isScreenSharing?: boolean;
  avatarColor?: string;
  compact?: boolean;
}

export function VideoTile({
  stream,
  userName,
  role,
  isMe = false,
  isCamOn,
  isMicOn,
  isHandRaised = false,
  isScreenSharing = false,
  avatarColor = 'bg-orange-600',
  compact = false
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, isCamOn]);

  const initial = (userName || 'U').charAt(0).toUpperCase();
  const isFaculty = role === 'faculty';

  if (compact) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md flex-shrink-0 w-44 h-28 group transition-all hover:ring-2 hover:ring-orange-500/50">
        {isCamOn && stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMe}
            className={`w-full h-full object-cover ${isMe && !isScreenSharing ? 'scale-x-[-1]' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-2">
            <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center font-bold text-white text-sm shadow-inner`}>
              {initial}
            </div>
            <p className="text-[11px] font-semibold text-slate-300 truncate max-w-[120px] mt-1.5">
              {userName} {isMe && '(You)'}
            </p>
          </div>
        )}

        {/* Hand Raised Floating Badge */}
        {isHandRaised && (
          <div className="absolute top-1.5 right-1.5 bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md animate-bounce">
            <Hand className="w-2.5 h-2.5 fill-current" />
          </div>
        )}

        {/* Bottom Overlay Label */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
          <span className="text-[10px] font-bold bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-md truncate max-w-[110px]">
            {isFaculty && '🎓 '}{userName} {isMe ? '(You)' : ''}
          </span>
          <span className={`p-1 rounded-md text-[10px] ${isMicOn ? 'bg-black/60 text-emerald-400' : 'bg-red-500/80 text-white'}`}>
            {isMicOn ? <Mic className="w-2.5 h-2.5" /> : <MicOff className="w-2.5 h-2.5" />}
          </span>
        </div>
      </div>
    );
  }

  // Full Grid Tile Mode
  return (
    <div className={`relative rounded-3xl overflow-hidden bg-slate-900 border transition-all duration-300 shadow-xl flex items-center justify-center aspect-video w-full ${
      isHandRaised ? 'ring-2 ring-amber-400 border-amber-500/40' : 'border-slate-800'
    }`}>
      
      {/* Video element when camera is on */}
      {isCamOn && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMe}
          className={`w-full h-full object-cover ${isMe && !isScreenSharing ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        /* Stylish Avatar Presence Card when camera is off */
        <div className="flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="relative">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${avatarColor} flex items-center justify-center text-3xl font-black text-white shadow-2xl`}>
              {initial}
            </div>
            {isCamOn && (
              <span className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 text-white rounded-full ring-4 ring-slate-900 shadow">
                <Video className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <h4 className="mt-3.5 text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
            {userName}
            {isMe && <span className="text-xs font-semibold text-slate-400">(You)</span>}
          </h4>
          <span className={`mt-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isFaculty ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-400'
          }`}>
            {isFaculty ? 'Session Host' : 'Student'}
          </span>
        </div>
      )}

      {/* Floating Hand Raised Indicator */}
      {isHandRaised && (
        <div className="absolute top-4 right-4 bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-bounce">
          <Hand className="w-3.5 h-3.5 fill-current" />
          <span>Hand Raised</span>
        </div>
      )}

      {/* Bottom info bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold text-white border border-white/10 shadow-sm">
          <span>{userName} {isMe ? '(You)' : ''}</span>
          {isScreenSharing && <span className="text-orange-400 text-[10px]">• Screen</span>}
        </div>

        <div className={`p-1.5 rounded-xl shadow-md backdrop-blur-md ${
          isMicOn ? 'bg-black/60 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/80 text-white border border-red-400/30'
        }`}>
          {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        </div>
      </div>
    </div>
  );
}
