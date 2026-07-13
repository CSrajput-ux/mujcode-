import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Video, Plus, Calendar, Clock, Upload, Users, MoreVertical } from 'lucide-react';
import { getLiveClasses, scheduleLiveClass, updateLiveClassStatus, type LiveClass } from '../../services/liveClassService';
import { toast } from 'sonner';

export default function LiveClassesManager() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [formData, setFormData] = useState({
    topic: '', subject: '', courseName: '', branch: '', semester: '', section: '', date: '', time: '', duration: 60, meetingLink: ''
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await getLiveClasses();
      setClasses(data);
    } catch (error) {
      toast.error('Failed to load live classes');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scheduleLiveClass({
        ...formData,
        semester: formData.semester ? parseInt(formData.semester) : undefined
      });
      toast.success('Live class scheduled successfully!');
      setShowScheduleForm(false);
      setFormData({ topic: '', subject: '', courseName: '', branch: '', semester: '', section: '', date: '', time: '', duration: 60, meetingLink: '' });
      fetchClasses();
    } catch (error) {
      toast.error('Failed to schedule class');
    }
  };

  const handleStatusChange = async (id: string, status: 'Upcoming' | 'Live' | 'Completed') => {
    try {
      await updateLiveClassStatus(id, status);
      toast.success(`Class marked as ${status}`);
      fetchClasses();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Classes</h1>
            <p className="text-gray-600">Manage your online sessions, attendance, and resources</p>
          </div>
          <Button className="bg-[#FF7A00] hover:bg-[#FF6A00]" onClick={() => setShowScheduleForm(!showScheduleForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Class
          </Button>
        </div>

        {showScheduleForm && (
          <Card className="border-orange-100 shadow-sm">
            <CardHeader className="bg-orange-50/50 border-b border-orange-100">
              <CardTitle>Schedule New Live Class</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSchedule} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Topic</label>
                    <Input required value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} placeholder="e.g. Intro to Binary Trees" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subject</label>
                    <Input required value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} placeholder="e.g. Data Structures" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meeting Link (Optional - Zoom/Teams/Meet)</label>
                    <Input value={formData.meetingLink} onChange={(e) => setFormData({...formData, meetingLink: e.target.value})} placeholder="e.g. https://meet.google.com/..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time</label>
                    <Input type="time" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (mins)</label>
                    <Input type="number" required value={formData.duration} onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowScheduleForm(false)}>Cancel</Button>
                  <Button type="submit" className="bg-[#FF7A00] hover:bg-[#FF6A00]">Schedule</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading...</div>
          ) : classes.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
              <Video className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold">No Classes Scheduled</h3>
              <p className="text-gray-500">You haven't scheduled any live classes yet.</p>
            </div>
          ) : (
            classes.map(c => (
              <Card key={c._id} className="overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge 
                          className={
                            c.status === 'Live' ? 'bg-red-100 text-red-700 hover:bg-red-100 animate-pulse' :
                            c.status === 'Completed' ? 'bg-gray-100 text-gray-700 hover:bg-gray-100' :
                            'bg-blue-100 text-blue-700 hover:bg-blue-100'
                          }
                        >
                          {c.status === 'Live' ? '🔴 LIVE' : c.status}
                        </Badge>
                        <h3 className="text-xl font-bold text-gray-900">{c.topic}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-orange-500" /> {new Date(c.date).toLocaleDateString()}</span>
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1 text-orange-500" /> {c.time} ({c.duration} mins)</span>
                        <span className="flex items-center"><Users className="w-4 h-4 mr-1 text-orange-500" /> {c.subject}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      {c.status === 'Upcoming' && (
                        <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => handleStatusChange(c._id, 'Live')}>
                          Start Class
                        </Button>
                      )}
                      {c.status === 'Live' && (
                        <div className="flex flex-col gap-2 w-full">
                          <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => navigate(`/live-class/${c._id}`)}>
                            Join Class
                          </Button>
                          <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white" onClick={() => handleStatusChange(c._id, 'Completed')}>
                            End Class
                          </Button>
                        </div>
                      )}
                      {c.status === 'Completed' && (
                        <Button variant="outline" className="w-full text-orange-600 border-orange-200">
                          <Upload className="w-4 h-4 mr-2" /> Upload Recording
                        </Button>
                      )}
                      <Button variant="ghost" className="w-full text-gray-500 hover:text-gray-900">
                        Manage Attendance
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}
