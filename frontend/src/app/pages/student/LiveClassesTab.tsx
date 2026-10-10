import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Video, Clock, Calendar, GraduationCap, Building2, ExternalLink, Radio, LogOut } from 'lucide-react';
import { getLiveClasses, joinLiveClass, leaveLiveClass, type LiveClass } from '../../services/liveClassService';
import { toast } from 'sonner';

export default function LiveClassesTab() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await getLiveClasses();
      setClasses(data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load live classes');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (id: string, meetingLink?: string) => {
    try {
      const res = await joinLiveClass(id);
      setActiveClassId(id);
      toast.success('Joined class! Attendance is now being tracked.');

      if (meetingLink && (meetingLink.startsWith('http://') || meetingLink.startsWith('https://'))) {
        window.open(meetingLink, '_blank');
      }
      navigate(`/live-class/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to join class');
    }
  };

  const handleLeave = async () => {
    if (!activeClassId) return;
    try {
      await leaveLiveClass(activeClassId);
      setActiveClassId(null);
      toast.success('Left class. Attendance record saved successfully.');
    } catch (error) {
      toast.error('Failed to record leave time');
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-500">Loading your live classes...</p>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="mx-auto w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
          <Video className="w-8 h-8 text-orange-400" />
        </div>
        <h3 className="text-xl font-black text-slate-800">No Live Classes Scheduled</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          There are currently no active or upcoming live classes for your branch and semester. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Attendance Tracking Banner */}
      {activeClassId && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-2xl flex justify-between items-center gap-4 flex-wrap shadow-sm">
          <div className="space-y-1">
            <p className="font-black text-base flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-600 animate-pulse" />
              Live Attendance Session Active
            </p>
            <p className="text-xs text-red-700 font-medium">
              Your attendance is currently counting towards the 20-minute threshold. Remember to click "Leave Class" when finished!
            </p>
          </div>
          <div className="flex gap-2.5">
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white font-bold h-10 px-4 rounded-xl shadow-sm"
              onClick={() => navigate(`/live-class/${activeClassId}`)}
            >
              <Video className="w-4 h-4 mr-1.5" />
              Enter Classroom
            </Button>
            <Button 
              variant="outline" 
              className="border-red-300 text-red-700 hover:bg-red-100 font-bold h-10 px-4 rounded-xl"
              onClick={handleLeave}
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Leave Class
            </Button>
          </div>
        </div>
      )}

      {/* Grid of Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map((c) => {
          const isLive = c.status === 'Live';
          const isUpcoming = c.status === 'Upcoming';
          const isCompleted = c.status === 'Completed';

          return (
            <Card 
              key={c._id} 
              className={`overflow-hidden border-none shadow-sm hover:shadow-md transition-all rounded-3xl ring-1 ${
                isLive ? 'ring-2 ring-red-500 bg-red-50/10' : 'ring-gray-100 bg-white'
              }`}
            >
              <CardContent className="p-6 space-y-5">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-lg shrink-0">
                      {(c.facultyName || 'F').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg leading-tight line-clamp-1">{c.topic}</h3>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">
                        {c.subject} • {c.facultyName || 'Faculty Member'}
                      </p>
                    </div>
                  </div>
                  
                  <Badge 
                    className={
                      isLive 
                        ? 'bg-red-600 text-white font-black animate-pulse px-3 py-1 text-xs shrink-0' 
                        : isUpcoming 
                          ? 'bg-blue-100 text-blue-800 border-blue-200 border font-bold text-xs shrink-0' 
                          : 'bg-slate-100 text-slate-700 border-slate-200 border font-bold text-xs shrink-0'
                    }
                  >
                    {isLive ? '🔴 LIVE NOW' : c.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold text-slate-600">
                  <div className="flex items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Calendar className="w-4 h-4 mr-2 text-orange-500 shrink-0" />
                    {new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="flex items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Clock className="w-4 h-4 mr-2 text-orange-500 shrink-0" />
                    {c.time} ({c.duration}m)
                  </div>
                  <div className="flex items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 col-span-2">
                    <GraduationCap className="w-4 h-4 mr-2 text-orange-500 shrink-0" />
                    Target: {c.branch || 'CSE'} • Sem {c.semester || 5} • Sec {c.section || 'All'}
                  </div>
                </div>

                <div className="pt-1 flex gap-2.5">
                  {isLive ? (
                    <>
                      <Button 
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black h-11 rounded-xl shadow-md shadow-red-600/20"
                        onClick={() => handleJoin(c._id, c.meetingLink)}
                      >
                        <Video className="w-4 h-4 mr-2" />
                        {activeClassId === c._id ? 'Re-enter Class' : 'Join Live Class'}
                      </Button>

                      {c.meetingLink && (
                        <Button
                          variant="outline"
                          className="border-slate-200 font-bold h-11 px-3.5 rounded-xl"
                          onClick={() => window.open(c.meetingLink, '_blank')}
                          title="Open External Meeting Link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </>
                  ) : isUpcoming ? (
                    <Button variant="secondary" className="flex-1 w-full h-11 rounded-xl font-bold bg-slate-100 text-slate-500 cursor-default" disabled>
                      Scheduled for {c.time}
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1 w-full h-11 rounded-xl font-bold border-slate-200 text-slate-600" disabled>
                      Session Completed
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
