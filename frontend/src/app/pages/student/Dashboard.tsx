import StudentLayout from '../../components/StudentLayout';
import YearlyActivity from '../../components/YearlyActivity';
import StudentStats from '../../components/StudentStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  Download,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import apiClient, { API_BASE_URL } from '../../services/apiClient';
import { toast } from 'sonner';

export default function Dashboard() {
  const [ranks, setRanks] = useState([
    { label: 'College Rank', value: '#-', total: '/ -' },
    { label: 'Branch Rank', value: '#-', total: '/ -' },
    { label: 'Section Rank', value: '#-', total: '/ -' }
  ]);
  const [loadingRanks, setLoadingRanks] = useState(true);
  const [mentors, setMentors] = useState<{ name: string, subject: string, avatar: string, department: string }[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [upcomingTests, setUpcomingTests] = useState<{ title: string, type: string, date: string, time: string }[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);

  const handleDownloadCompiler = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadProgress('Checking installer...');

    try {
      // 1. Check production environment override first
      let url = (import.meta as any).env?.VITE_LOCAL_COMPILER_DOWNLOAD_URL;

      // 2. If not in env, query backend download-info endpoint
      if (!url) {
        setDownloadProgress('Fetching release...');
        const res = await apiClient.get('/api/agent/download-info');
        if (res.data?.success && res.data.downloadUrl) {
          url = res.data.downloadUrl;
        }
      }

      if (!url) {
        throw new Error('Download URL is not configured. Please contact support.');
      }

      // If URL is relative (e.g. /api/agent/download), prefix with API_BASE_URL
      const downloadHref = url.startsWith('http') 
        ? url 
        : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

      setDownloadProgress('Downloading...');
      
      // Trigger download via anchor
      const a = document.createElement('a');
      a.href = downloadHref;
      a.setAttribute('download', 'MUJCODE-Local-Compiler-Setup-1.0.0.exe');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success('Download started! Run the installer on your Windows PC to set up offline compilation.', {
        duration: 5000
      });
    } catch (err: any) {
      console.error('Failed to download installer:', err);
      toast.error(err.response?.data?.error || err.message || 'Unable to download offline compiler. Please try again later.');
    } finally {
      setTimeout(() => {
        setDownloading(false);
        setDownloadProgress(null);
      }, 2000);
    }
  };


  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id;

        if (!userId) {
          setLoadingRanks(false);
          return;
        }

        const res = await apiClient.get(`/api/student/rankings/${userId}`);
        if (res.data && res.data.ranks) {
          setRanks(res.data.ranks);
        }
        setLoadingRanks(false);
      } catch (error) {
        console.error('Error fetching rankings:', error);
        setLoadingRanks(false);
      }
    };

    const fetchMentors = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const res = await apiClient.get(`/api/student/mentors/${user.id}`);
        if (res.data && Array.isArray(res.data)) {
          const mappedMentors = res.data.map((f: any) => ({
            name: f.name,
            subject: f.subject || 'Mentor',
            avatar: f.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
            department: f.department
          }));
          setMentors(mappedMentors);
        }
        setLoadingMentors(false);
      } catch (error) {
        console.error('Error fetching mentors:', error);
        setLoadingMentors(false);
      }
    };

    const fetchUpcomingTests = async () => {
      try {
        const res = await apiClient.get('/api/tests');
        if (res.data && Array.isArray(res.data)) {
          const mapped = res.data.slice(0, 3).map((t: any) => ({
            title: t.title,
            type: t.testType || t.type || 'Quiz',
            date: t.startTime ? new Date(t.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today',
            time: t.duration ? `${t.duration} mins` : '45 mins'
          }));
          setUpcomingTests(mapped);
        }
        setLoadingTests(false);
      } catch (error) {
        console.error('Error fetching upcoming tests:', error);
        setLoadingTests(false);
      }
    };

    fetchRankings();
    fetchMentors();
    fetchUpcomingTests();
  }, []);

  return (
    <StudentLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Welcome back, {JSON.parse(localStorage.getItem('user') || '{}').name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="text-sm text-gray-500">Here's your learning progress overview</p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              id="download-offline-compiler-btn"
              type="button"
              onClick={handleDownloadCompiler}
              disabled={downloading}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-[#FF7A00] hover:bg-[#FF6A00] text-white font-medium text-sm shadow-sm hover:shadow transition-all duration-150 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer group"
              title="Download Windows x64 Desktop Compiler for local 0ms latency execution"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-white group-hover:-translate-y-0.5 transition-transform" />
              )}
              <span>{downloadProgress || 'Download Offline Compiler'}</span>
            </button>
          </div>
        </div>

        {/* New LeetCode-style Stats & Badges */}
        <StudentStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Ranks */}
          <Card className="h-[265px] flex flex-col shadow-sm border-t-4 border-t-[#FF7A00]">
            <CardHeader className="py-2.5 px-4 border-b border-gray-100 flex-shrink-0">
              <CardTitle className="flex items-center space-x-2 text-base font-semibold">
                <Trophy className="w-4 h-4 text-[#FF7A00]" />
                <span>Your Rankings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              {ranks.map((rank, index) => (
                <div key={index} className="flex items-center justify-between p-2 px-3 bg-orange-50/40 rounded-lg border border-orange-100/50">
                  <span className="text-xs text-gray-700 font-medium">{rank.label}</span>
                  <div className="text-right">
                    <span className="text-base font-bold text-[#FF7A00]">{rank.value}</span>
                    <span className="text-xs text-gray-500 ml-1">{rank.total}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Faculty Mentors */}
          <Card className="h-[265px] flex flex-col shadow-sm border-t-4 border-t-purple-500">
            <CardHeader className="py-2.5 px-4 border-b border-gray-100 flex-shrink-0">
              <CardTitle className="flex items-center space-x-2 text-base font-semibold">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Faculty Mentors</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
              {loadingMentors ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : mentors.length > 0 ? (
                mentors.map((mentor, index) => (
                  <div key={index} className="flex items-center space-x-2.5 p-2 px-3 bg-purple-50/40 rounded-lg border border-purple-100/50 hover:bg-purple-100/60 transition-colors group">
                    <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm transition-transform group-hover:scale-105">
                      {mentor.avatar}
                    </div>
                    <div className="overflow-hidden min-w-0 flex-1">
                      <p className="font-bold text-gray-900 truncate text-xs">{mentor.name}</p>
                      <p className="text-[10px] text-purple-600 font-semibold truncate uppercase tracking-wider">{mentor.subject}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400 italic text-xs border-2 border-dashed border-gray-100 rounded-lg">
                  No faculty assigned for your section yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tests */}
          <Card className="h-[265px] flex flex-col shadow-sm border-t-4 border-t-[#FF7A00]">
            <CardHeader className="py-2.5 px-4 border-b border-gray-100 flex-shrink-0">
              <CardTitle className="flex items-center space-x-2 text-base font-semibold">
                <Calendar className="w-4 h-4 text-[#FF7A00]" />
                <span>Upcoming Tests</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
              {upcomingTests.map((test, index) => (
                <div key={index} className="p-2 px-3 bg-gray-50/70 rounded-lg border border-gray-100 hover:bg-gray-100/60 transition-colors">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-bold text-gray-900 text-xs truncate pr-2">{test.title}</p>
                    <span className="px-1.5 py-0.5 bg-[#FF7A00] text-white text-[9px] rounded font-bold flex-shrink-0">
                      {test.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[10px] text-gray-500 font-medium">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-[#FF7A00]" />
                      {test.date}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-[#FF7A00]" />
                      {test.time}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Activity Heat Map */}
        <YearlyActivity />
      </div>
    </StudentLayout>
  );
}
