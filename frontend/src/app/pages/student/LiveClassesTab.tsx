import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Video, Clock, Calendar, Download, Users, GraduationCap, Building2 } from 'lucide-react';
import { getLiveClasses, joinLiveClass, leaveLiveClass, type LiveClass } from '../../services/liveClassService';
import { toast } from 'sonner';

export default function LiveClassesTab() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await getLiveClasses();
      setClasses(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load live classes');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (id: string) => {
    try {
      const res = await joinLiveClass(id);
      if (res.meetingLink) {
        window.open(res.meetingLink, '_blank');
      }
      setActiveClassId(id);
      toast.success('Joined successfully! Attendance tracking started.');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to join class');
    }
  };

  const handleLeave = async () => {
    if (!activeClassId) return;
    try {
      await leaveLiveClass(activeClassId);
      setActiveClassId(null);
      toast.success('Left class. Attendance has been recorded.');
    } catch (error) {
      toast.error('Failed to record leave time');
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-gray-500">Loading live classes...</div>;
  }

  if (classes.length === 0) {
    return (
      <div className="py-12 text-center bg-white rounded-3xl border border-gray-100">
        <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">No Live Classes</h3>
        <p className="text-gray-500 mt-1">There are no upcoming or live classes at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeClassId && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex justify-between items-center">
          <div>
            <p className="font-bold">You are currently tracking attendance for a live class.</p>
            <p className="text-sm">Don't forget to click "Leave Class" to finalize your 20-min minimum attendance!</p>
          </div>
          <Button variant="destructive" onClick={handleLeave}>Leave Class</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {classes.map((c) => (
          <Card key={c._id} className="overflow-hidden border border-gray-100 hover:shadow-lg transition-all rounded-3xl">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                      {c.facultyName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{c.topic}</h3>
                      <p className="text-sm text-gray-500">{c.subject} • {c.facultyName}</p>
                    </div>
                  </div>
                  <Badge 
                    className={
                      c.status === 'Live' ? 'bg-red-100 text-red-700 hover:bg-red-100 animate-pulse' :
                      c.status === 'Completed' ? 'bg-gray-100 text-gray-700 hover:bg-gray-100' :
                      'bg-blue-100 text-blue-700 hover:bg-blue-100'
                    }
                  >
                    {c.status === 'Live' ? '🔴 LIVE' : c.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                    <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                    {new Date(c.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                    <Clock className="w-4 h-4 mr-2 text-orange-500" />
                    {c.time} ({c.duration} mins)
                  </div>
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                    <GraduationCap className="w-4 h-4 mr-2 text-orange-500" />
                    {c.courseName || 'All'}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                    <Building2 className="w-4 h-4 mr-2 text-orange-500" />
                    {c.department || 'General'}
                  </div>
                </div>

                <div className="flex gap-3">
                  {c.status === 'Live' ? (
                    <Button 
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold"
                      onClick={() => handleJoin(c._id)}
                      disabled={activeClassId === c._id}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      {activeClassId === c._id ? 'Joined' : 'Join Live Class'}
                    </Button>
                  ) : c.status === 'Completed' ? (
                    <>
                      <Button variant="outline" className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50" onClick={() => window.open(c.recordingUrl || '#', '_blank')} disabled={!c.recordingUrl}>
                        <Video className="w-4 h-4 mr-2" />
                        Watch Recording
                      </Button>
                      <Button variant="outline" className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50">
                        <Download className="w-4 h-4 mr-2" />
                        Notes
                      </Button>
                    </>
                  ) : (
                    <Button variant="secondary" className="flex-1 w-full" disabled>
                      Starts at {c.time}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
