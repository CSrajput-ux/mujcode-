import React, { useState, useEffect } from 'react';
import { Laptop, CheckCircle2, AlertCircle, Copy, Check, RefreshCw, X, Shield, Cpu, Download } from 'lucide-react';
import apiClient from '../services/apiClient';
import { toast } from 'sonner';

export interface LocalAgentStatus {
  hasPairedDevice: boolean;
  isOnline: boolean;
  activeDevice?: {
    deviceId: string;
    deviceName: string;
    agentVersion: string;
    compilers?: Record<string, boolean>;
    pairedAt?: number;
  } | null;
}

interface LocalCompilerWidgetProps {
  useLocalAgent: boolean;
  onToggleUseLocalAgent: (val: boolean) => void;
  onStatusChange?: (status: LocalAgentStatus) => void;
}

export default function LocalCompilerWidget({
  useLocalAgent,
  onToggleUseLocalAgent,
  onStatusChange
}: LocalCompilerWidgetProps) {
  const [status, setStatus] = useState<LocalAgentStatus>({ hasPairedDevice: false, isOnline: false });
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [challengeCode, setChallengeCode] = useState<string | null>(null);
  const [challengeExpiresAt, setChallengeExpiresAt] = useState<number | null>(null);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [unpairing, setUnpairing] = useState(false);

  // Poll status on mount and when modal is open
  const fetchStatus = async () => {
    try {
      const res = await apiClient.get('/api/agent/status');
      if (res.data?.success) {
        const newStatus: LocalAgentStatus = {
          hasPairedDevice: res.data.hasPairedDevice,
          isOnline: res.data.isOnline,
          activeDevice: res.data.activeDevice
        };
        setStatus(newStatus);
        onStatusChange?.(newStatus);

        // If user was offline/unpaired and now paired+online, auto-enable local agent
        if (newStatus.isOnline && !useLocalAgent) {
          onToggleUseLocalAgent(true);
        }
      }
    } catch {
      // Silently ignore if unauthenticated or offline
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for pairing challenge
  useEffect(() => {
    if (!challengeExpiresAt) return;
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((challengeExpiresAt - Date.now()) / 1000));
      setTimeLeftSec(remaining);
      if (remaining === 0) {
        setChallengeCode(null);
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [challengeExpiresAt]);

  const requestChallenge = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post('/api/agent/challenge');
      if (res.data?.success) {
        setChallengeCode(res.data.challengeCode);
        setChallengeExpiresAt(res.data.expiresAt);
        setTimeLeftSec(Math.floor(res.data.lifetimeMs / 1000));
      } else {
        toast.error(res.data?.error || 'Failed to generate pairing challenge');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to request pairing challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (challengeCode) {
      navigator.clipboard.writeText(challengeCode);
      setCopied(true);
      toast.success('Pairing code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUnpair = async () => {
    if (!status.activeDevice?.deviceId) return;
    setUnpairing(true);
    try {
      await apiClient.delete(`/api/agent/devices/${status.activeDevice.deviceId}`);
      toast.success('Device unpaired successfully');
      setModalOpen(false);
      onToggleUseLocalAgent(false);
      fetchStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to unpair device');
    } finally {
      setUnpairing(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Status Badge & Button */}
      {status.isOnline ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60 transition-colors"
          title="Local Compiler is online and connected"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Laptop className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Compiler: Online</span>
        </button>
      ) : status.hasPairedDevice ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-amber-950/50 border border-amber-800/80 text-amber-300 hover:bg-amber-900/50 transition-colors"
          title="Paired device is offline. Open MUJCODE Local Compiler on your desktop to connect."
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <Laptop className="w-3.5 h-3.5 text-amber-400" />
          <span>Local Compiler: Offline</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setModalOpen(true);
            if (!challengeCode) requestChallenge();
          }}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          title="Connect MUJCODE Local Compiler desktop agent"
        >
          <Cpu className="w-3.5 h-3.5 text-[#FF7A00]" />
          <span>Connect Local Compiler</span>
        </button>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#18191d] border border-zinc-700/80 rounded-xl max-w-lg w-full p-6 text-zinc-200 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-lg bg-[#FF7A00]/10 border border-[#FF7A00]/20 text-[#FF7A00]">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">MUJCODE Local Compiler</h3>
                <p className="text-xs text-zinc-400">Execute and compile code directly on your computer</p>
              </div>
            </div>

            {/* Current State Information */}
            {status.isOnline ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-300">Device Connected & Active</div>
                    <div className="text-xs text-zinc-300 mt-0.5">
                      <strong>Device:</strong> {status.activeDevice?.deviceName || 'Local Computer'}<br />
                      <strong>Agent Version:</strong> {status.activeDevice?.agentVersion || '1.0.0'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="text-xs text-zinc-300">
                    <span className="font-semibold block text-white">Execution Routing</span>
                    When you click "Run", execute on your local computer.
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useLocalAgent}
                      onChange={(e) => onToggleUseLocalAgent(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF7A00]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={unpairing}
                    onClick={handleUnpair}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:underline"
                  >
                    {unpairing ? 'Unpairing...' : 'Unpair Device'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : status.hasPairedDevice ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-amber-300">Device Offline</div>
                    <p className="text-xs text-zinc-300 mt-1">
                      Your paired device <strong>{status.activeDevice?.deviceName || 'Computer'}</strong> is currently offline.
                      Please open the <strong>MUJCODE Local Compiler</strong> desktop application on your PC.
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-900/80 p-3.5 rounded-lg border border-zinc-800 text-xs space-y-2 text-zinc-300">
                  <div className="font-semibold text-white flex items-center space-x-1.5">
                    <Shield className="w-4 h-4 text-[#FF7A00]" />
                    <span>Troubleshooting Checklist</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
                    <li>Confirm the Local Compiler desktop app is running in your Windows taskbar.</li>
                    <li>Verify your internet connection.</li>
                    <li>If the app is uninstalled, download and re-pair below.</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={unpairing}
                    onClick={handleUnpair}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:underline"
                  >
                    {unpairing ? 'Unpairing...' : 'Unpair Device'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      requestChallenge();
                    }}
                    className="px-3.5 py-1.5 bg-[#FF7A00] hover:bg-[#FF6A00] text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Pair New Device
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Install and connect the desktop compiler agent to run code directly on your local hardware using your MinGW GCC, G++, JDK, Python, and Node.js runtimes.
                </p>

                {challengeCode ? (
                  <div className="bg-zinc-900 border border-zinc-700/80 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your One-Time Pairing Code</span>
                      <span className="text-xs font-mono text-amber-400">Expires in {Math.floor(timeLeftSec / 60)}:{(timeLeftSec % 60).toString().padStart(2, '0')}</span>
                    </div>

                    <div className="flex items-center justify-between bg-black/60 border border-zinc-700 rounded-lg px-4 py-3">
                      <span className="font-mono text-2xl font-bold tracking-widest text-[#FF7A00]">
                        {challengeCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="p-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                        title="Copy code"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="text-xs text-zinc-400 space-y-1">
                      <p>1. Open <strong>MUJCODE Local Compiler</strong> on your Windows PC.</p>
                      <p>2. Paste this one-time code into the pairing input and click <strong>Approve & Pair</strong>.</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-3">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={requestChallenge}
                      className="w-full py-2.5 px-4 bg-[#FF7A00] hover:bg-[#FF6A00] text-white rounded-lg text-xs font-semibold shadow-md transition-colors flex items-center justify-center space-x-2"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                      <span>Generate Pairing Code</span>
                    </button>
                  </div>
                )}

                <div className="border-t border-zinc-800 pt-3 flex items-center justify-between text-xs text-zinc-400">
                  <span>Don't have the desktop app?</span>
                  {((import.meta as any).env?.VITE_LOCAL_COMPILER_DOWNLOAD_URL) ? (
                    <a
                      href={(import.meta as any).env.VITE_LOCAL_COMPILER_DOWNLOAD_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-[#FF7A00] hover:underline font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download for Windows</span>
                    </a>
                  ) : (
                    <span className="text-zinc-500 italic text-[11px]" title="Set VITE_LOCAL_COMPILER_DOWNLOAD_URL in production environment">
                      Download installer from release assets
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
