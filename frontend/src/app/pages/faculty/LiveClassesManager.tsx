import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../../components/ui/dialog';
import { 
  Video, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Trash2, 
  ExternalLink, 
  Play, 
  Square, 
  UserCheck, 
  Sparkles,
  Layers,
  GraduationCap,
  Radio,
  BookOpen
} from 'lucide-react';
import { 
  getLiveClasses, 
  scheduleLiveClass, 
  updateLiveClassStatus, 
  deleteLiveClass,
  getClassAttendance,
  type LiveClass,
  type AttendanceRecord
} from '../../services/liveClassService';
import { toast } from 'sonner';

export default function LiveClassesManager() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  // User and assigned courses
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const teachingAssignments: any[] = user.teachingAssignments || [
    { subject: 'Artificial Intelligence & Soft Computing', branch: 'CSE', section: 'E', year: '3 Year' },
    { subject: 'Software Engineering', branch: 'CSE', section: 'E', year: '3 Year' },
    { subject: 'Computer networks', branch: 'CSE', section: 'E', year: '3 Year' },
    { subject: 'Advanced data structure', branch: 'CSE', section: 'E', year: '3 Year' },
    { subject: 'Computer Networks lab', branch: 'CSE', section: 'E', year: '3 Year' },
    { subject: 'Software engineering lab', branch: 'CSE', section: 'E', year: '3 Year' }
  ];

  const todayStr = new Date().toISOString().slice(0, 10);
  const nowTimeStr = new Date().toTimeString().slice(0, 5);

  const [formData, setFormData] = useState({
    topic: '',
    subject: teachingAssignments[0]?.subject || 'Computer networks',
    courseName: '',
    branch: 'CSE',
    semester: '5',
    section: 'E',
    date: todayStr,
    time: nowTimeStr,
    duration: 60,
    roomType: 'builtin' as 'builtin' | 'external',
    meetingLink: ''
  });

  // Attendance Dialog State
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState<LiveClass | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

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
    if (!formData.topic.trim()) {
      toast.error('Topic is required');
      return;
    }
    if (!formData.subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    try {
      const finalMeetingLink = formData.roomType === 'external' ? formData.meetingLink.trim() : '';

      await scheduleLiveClass({
        topic: formData.topic.trim(),
        subject: formData.subject.trim(),
        courseName: formData.subject.trim(),
        branch: formData.branch,
        semester: formData.semester ? parseInt(formData.semester) : 5,
        section: formData.section,
        date: formData.date,
        time: formData.time,
        duration: Number(formData.duration) || 60,
        meetingLink: finalMeetingLink
      });

      toast.success('Live class scheduled successfully!');
      setShowScheduleForm(false);
      setFormData({
        topic: '',
        subject: teachingAssignments[0]?.subject || 'Computer networks',
        courseName: '',
        branch: 'CSE',
        semester: '5',
        section: 'E',
        date: todayStr,
        time: nowTimeStr,
        duration: 60,
        roomType: 'builtin',
        meetingLink: ''
      });
      fetchClasses();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to schedule class');
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

  const handleDelete = async (id: string, topic: string) => {
    if (!window.confirm(`Are you sure you want to cancel and delete "${topic}"?`)) {
      return;
    }
    try {
      await deleteLiveClass(id);
      toast.success('Live class removed');
      fetchClasses();
    } catch (error) {
      toast.error('Failed to delete live class');
    }
  };

  const handleOpenAttendance = async (c: LiveClass) => {
    setSelectedClassForAttendance(c);
    setAttendanceModalOpen(true);
    setAttendanceLoading(true);
    try {
      const res = await getClassAttendance(c._id);
      setAttendanceRecords(res.attendance || []);
    } catch (err) {
      toast.error('Failed to load attendance');
      setAttendanceRecords([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleStartAndJoin = async (c: LiveClass) => {
    try {
      if (c.status !== 'Live') {
        await updateLiveClassStatus(c._id, 'Live');
      }
      if (c.meetingLink && (c.meetingLink.startsWith('http://') || c.meetingLink.startsWith('https://'))) {
        window.open(c.meetingLink, '_blank');
      }
      navigate(`/live-class/${c._id}`);
    } catch (err) {
      toast.error('Failed to initiate live session');
    }
  };

  // Stats calculation
  const liveCount = classes.filter(c => c.status === 'Live').length;
  const upcomingCount = classes.filter(c => c.status === 'Upcoming').length;
  const completedCount = classes.filter(c => c.status === 'Completed').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-400 border border-orange-500/30">
              <Radio className="h-3.5 w-3.5 animate-pulse text-red-400" />
              Faculty Live Classroom Center
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Live <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">Classes</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base font-medium max-w-xl">
              Conduct interactive online sessions with integrated WebRTC video, digital whiteboard, real-time code chat, and automated 20-min attendance tracking.
            </p>
          </div>

          <Button 
            className="bg-[#FF7A00] hover:bg-[#FF6A00] text-white font-bold h-12 px-6 rounded-2xl shadow-lg shadow-orange-500/20 shrink-0 flex items-center gap-2"
            onClick={() => setShowScheduleForm(!showScheduleForm)}
          >
            <Plus className="w-5 h-5" />
            {showScheduleForm ? 'Close Schedule Form' : 'Schedule New Class'}
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm ring-1 ring-gray-100 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Now</p>
              <p className="text-2xl font-black text-red-600 flex items-center gap-2">
                {liveCount}
                {liveCount > 0 && <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-50 text-red-600">
              <Radio className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm ring-1 ring-gray-100 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upcoming</p>
              <p className="text-2xl font-black text-slate-800">{upcomingCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm ring-1 ring-gray-100 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-black text-slate-800">{completedCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm ring-1 ring-gray-100 bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Scheduled</p>
              <p className="text-2xl font-black text-slate-800">{classes.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
              <Video className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Form */}
      {showScheduleForm && (
        <Card className="border-orange-100 shadow-xl rounded-3xl overflow-hidden ring-1 ring-orange-200 bg-white animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="bg-gradient-to-r from-orange-50/80 to-amber-50/40 border-b border-orange-100 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-slate-900">Schedule New Live Class</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Define subject, batch target, meeting date, and classroom format</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSchedule} className="space-y-6">
              
              {/* Row 1: Topic & Subject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    Session Topic <span className="text-rose-500">*</span>
                  </label>
                  <Input 
                    required 
                    value={formData.topic} 
                    onChange={(e) => setFormData({...formData, topic: e.target.value})} 
                    placeholder="e.g. Advanced Dynamic Programming & Graph Traversals" 
                    className="h-11 rounded-xl text-sm border-slate-200 focus:border-orange-500 focus:ring-orange-500/20" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                    Subject / Course <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium text-slate-800"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    >
                      {teachingAssignments.map((a, i) => (
                        <option key={i} value={a.subject}>
                          {a.subject} ({a.branch} - Sec {a.section})
                        </option>
                      ))}
                      <option value="Custom Subject">Other (Type Custom)</option>
                    </select>
                  </div>
                  {formData.subject === 'Custom Subject' && (
                    <Input
                      placeholder="Type custom subject title..."
                      className="h-10 mt-2 text-sm rounded-xl"
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    />
                  )}
                </div>
              </div>

              {/* Row 2: Target Branch, Semester, Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3 h-3 text-slate-400" /> Target Branch
                  </label>
                  <select
                    className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    value={formData.branch}
                    onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  >
                    <option value="CSE">Computer Science & Engineering (CSE)</option>
                    <option value="CCE">Computer & Communication (CCE)</option>
                    <option value="IT">Information Technology (IT)</option>
                    <option value="ECE">Electronics & Communication (ECE)</option>
                    <option value="All">All Branches (Open Session)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-slate-400" /> Target Semester
                  </label>
                  <select
                    className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                  >
                    <option value="1">Semester 1 (1st Year)</option>
                    <option value="2">Semester 2 (1st Year)</option>
                    <option value="3">Semester 3 (2nd Year)</option>
                    <option value="4">Semester 4 (2nd Year)</option>
                    <option value="5">Semester 5 (3rd Year)</option>
                    <option value="6">Semester 6 (3rd Year)</option>
                    <option value="7">Semester 7 (4th Year)</option>
                    <option value="8">Semester 8 (4th Year)</option>
                    <option value="All">All Semesters</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" /> Target Section
                  </label>
                  <select
                    className="w-full h-10 px-3 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                  >
                    <option value="E">Section E</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                    <option value="F">Section F</option>
                    <option value="All">All Sections (Entire Batch)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Date, Time, Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-500" /> Date
                  </label>
                  <Input 
                    type="date" 
                    required 
                    min={todayStr}
                    value={formData.date} 
                    onChange={(e) => setFormData({...formData, date: e.target.value})} 
                    className="h-11 rounded-xl text-sm" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-500" /> Start Time
                  </label>
                  <Input 
                    type="time" 
                    required 
                    value={formData.time} 
                    onChange={(e) => setFormData({...formData, time: e.target.value})} 
                    className="h-11 rounded-xl text-sm" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-500" /> Duration (Minutes)
                  </label>
                  <select
                    className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 60})}
                  >
                    <option value="30">30 Minutes</option>
                    <option value="45">45 Minutes</option>
                    <option value="60">60 Minutes (Standard)</option>
                    <option value="90">90 Minutes</option>
                    <option value="120">120 Minutes (2 Hours)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Room Type & Link */}
              <div className="space-y-3 p-4 rounded-2xl bg-orange-50/40 border border-orange-100">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Video className="w-4 h-4 text-orange-600" />
                  Classroom Hosting Format
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, roomType: 'builtin', meetingLink: ''})}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      formData.roomType === 'builtin'
                        ? 'bg-white border-orange-500 shadow-sm ring-2 ring-orange-500/20'
                        : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                      MujCode Integrated Classroom
                      {formData.roomType === 'builtin' && <span className="text-orange-600 text-xs font-black">ACTIVE</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Built-in WebRTC video/audio, real-time shared whiteboard & auto attendance tracking.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({...formData, roomType: 'external'})}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      formData.roomType === 'external'
                        ? 'bg-white border-orange-500 shadow-sm ring-2 ring-orange-500/20'
                        : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                      External Meeting (Google Meet / Zoom)
                      {formData.roomType === 'external' && <span className="text-orange-600 text-xs font-black">ACTIVE</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Provide external meeting URL. Attendance is still monitored when students enter.</p>
                  </button>
                </div>

                {formData.roomType === 'external' && (
                  <div className="mt-3">
                    <Input 
                      value={formData.meetingLink} 
                      onChange={(e) => setFormData({...formData, meetingLink: e.target.value})} 
                      placeholder="e.g. https://meet.google.com/abc-defg-hij or https://zoom.us/j/..." 
                      className="h-11 rounded-xl text-sm bg-white" 
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-11 px-5 rounded-xl font-bold" 
                  onClick={() => setShowScheduleForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#FF7A00] hover:bg-[#FF6A00] text-white h-11 px-8 rounded-xl font-bold shadow-md shadow-orange-500/20"
                >
                  Schedule Class
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Class Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">Loading live classes...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="mx-auto w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
              <Video className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-xl font-black text-slate-800">No Classes Scheduled</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              You haven't scheduled any live sessions yet. Click "Schedule New Class" above to create an interactive class session for your students.
            </p>
            <Button 
              className="mt-6 bg-[#FF7A00] hover:bg-[#FF6A00] text-white font-bold rounded-xl"
              onClick={() => setShowScheduleForm(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Schedule First Class
            </Button>
          </div>
        ) : (
          classes.map(c => {
            const isLive = c.status === 'Live';
            const isUpcoming = c.status === 'Upcoming';
            const isCompleted = c.status === 'Completed';

            return (
              <Card 
                key={c._id} 
                className={`overflow-hidden border-none shadow-sm hover:shadow-md transition-all rounded-3xl ring-1 ${
                  isLive ? 'ring-2 ring-red-500 bg-red-50/20' : 'ring-gray-100 bg-white'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    
                    {/* Left: Info */}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Badge 
                          className={
                            isLive 
                              ? 'bg-red-600 text-white font-black animate-pulse px-3 py-1 text-xs' 
                              : isUpcoming 
                                ? 'bg-blue-100 text-blue-800 border-blue-200 border font-bold px-3 py-0.5' 
                                : 'bg-slate-100 text-slate-700 border-slate-200 border font-bold px-3 py-0.5'
                          }
                        >
                          {isLive ? '🔴 LIVE NOW' : c.status}
                        </Badge>

                        <Badge variant="outline" className="text-slate-600 font-semibold border-slate-200 text-xs">
                          {c.branch || 'CSE'} • Sem {c.semester || 5} • Sec {c.section || 'All'}
                        </Badge>

                        {c.meetingLink ? (
                          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold text-xs flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> External Link
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-700 bg-orange-50 border-orange-200 font-semibold text-xs flex items-center gap-1">
                            <Video className="w-3 h-3" /> MujCode Room
                          </Badge>
                        )}
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                          {c.topic}
                        </h3>
                        <p className="text-sm font-bold text-slate-500 mt-0.5">
                          {c.subject} {c.facultyName && `• By ${c.facultyName}`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-orange-500" /> 
                          {new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-orange-500" /> 
                          {c.time} ({c.duration} mins)
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto shrink-0">
                      
                      {/* Upcoming State Actions */}
                      {isUpcoming && (
                        <>
                          <Button 
                            className="bg-red-600 hover:bg-red-700 text-white font-bold h-11 px-5 rounded-xl shadow-md shadow-red-600/20 flex items-center gap-2"
                            onClick={() => handleStartAndJoin(c)}
                          >
                            <Play className="w-4 h-4 fill-current" />
                            Start Class
                          </Button>

                          <Button 
                            variant="ghost" 
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-11 w-11 p-0 rounded-xl"
                            onClick={() => handleDelete(c._id, c.topic)}
                            title="Cancel Class"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {/* Live State Actions */}
                      {isLive && (
                        <>
                          <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2"
                            onClick={() => handleStartAndJoin(c)}
                          >
                            <Video className="w-4 h-4" />
                            Enter Classroom
                          </Button>

                          {c.meetingLink && (
                            <Button 
                              variant="outline"
                              className="border-slate-200 text-slate-700 font-bold h-11 px-4 rounded-xl flex items-center gap-1.5"
                              onClick={() => window.open(c.meetingLink, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                              External Meet
                            </Button>
                          )}

                          <Button 
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-4 rounded-xl flex items-center gap-1.5"
                            onClick={() => handleStatusChange(c._id, 'Completed')}
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                            End Class
                          </Button>
                        </>
                      )}

                      {/* Completed State Actions */}
                      {isCompleted && (
                        <>
                          <Button 
                            variant="outline" 
                            className="border-orange-200 text-orange-600 hover:bg-orange-50 font-bold h-11 px-4 rounded-xl flex items-center gap-1.5"
                            onClick={() => handleOpenAttendance(c)}
                          >
                            <UserCheck className="w-4 h-4" />
                            View Attendance
                          </Button>

                          <Button 
                            variant="ghost" 
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-11 w-11 p-0 rounded-xl"
                            onClick={() => handleDelete(c._id, c.topic)}
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {/* Always show Attendance button if not completed */}
                      {!isCompleted && (
                        <Button 
                          variant="outline" 
                          className="border-slate-200 text-slate-600 hover:text-slate-900 font-bold h-11 px-3.5 rounded-xl"
                          onClick={() => handleOpenAttendance(c)}
                        >
                          Attendance
                        </Button>
                      )}

                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Attendance Detail Dialog */}
      <Dialog open={attendanceModalOpen} onOpenChange={setAttendanceModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-orange-500" />
              Class Attendance Report
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {selectedClassForAttendance?.topic} ({selectedClassForAttendance?.subject})
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Quick summary badges */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Attended</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{attendanceRecords.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                <p className="text-xs font-bold text-emerald-600 uppercase">Present (&ge;20m)</p>
                <p className="text-xl font-black text-emerald-700 mt-0.5">
                  {attendanceRecords.filter(r => r.status === 'Present').length}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 text-center">
                <p className="text-xs font-bold text-amber-600 uppercase">Partial (&lt;20m)</p>
                <p className="text-xl font-black text-amber-700 mt-0.5">
                  {attendanceRecords.filter(r => r.status === 'Partial').length}
                </p>
              </div>
            </div>

            {/* List */}
            {attendanceLoading ? (
              <div className="py-12 text-center text-sm text-slate-500">Loading attendee records...</div>
            ) : attendanceRecords.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No Student Attendance Recorded</p>
                <p className="text-xs text-slate-400 mt-1">Students will automatically appear here once they join this session.</p>
              </div>
            ) : (
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {attendanceRecords.map(rec => (
                  <div key={rec._id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-900">{rec.studentName}</p>
                      <p className="text-xs text-slate-400">
                        {rec.studentRollNumber || rec.rollNumber || rec.studentId} 
                        {rec.branch && ` • ${rec.branch}`} {rec.section && ` Sec ${rec.section}`}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <Badge 
                        className={
                          rec.status === 'Present' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs'
                        }
                      >
                        {rec.status === 'Present' ? 'Present ✅' : 'Partial ⚠️'}
                      </Badge>
                      <p className="text-[11px] font-semibold text-slate-400">
                        Duration: {rec.totalDurationMinutes || 0} mins
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
              onClick={() => setAttendanceModalOpen(false)}
            >
              Close Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
