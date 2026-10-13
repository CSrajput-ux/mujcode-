import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Users,
  FileText,
  BarChart3,
  Clock,
  BookOpen,
  Award,
  CheckCircle,
  Upload,
  ClipboardList,
  Video
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDepartment } from '../../utils/departmentUtils';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

function timeAgo(dateStr: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'upload': return <Upload className="w-3.5 h-3.5" />;
    case 'test': return <ClipboardList className="w-3.5 h-3.5" />;
    case 'assignment': return <FileText className="w-3.5 h-3.5" />;
    case 'live-class': return <Video className="w-3.5 h-3.5" />;
    default: return <BarChart3 className="w-3.5 h-3.5" />;
  }
}

export default function FacultyDashboard() {
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    sections: '—',
    department: '—',
    testsCreated: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!storedUser) return;

    try {
      const user = JSON.parse(storedUser);
      const facultyId = user.id || user._id || user.facultyId || '';
      const authHeaders: Record<string, string> = {};
      if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
        authHeaders['x-auth-token'] = token;
      }

      // Fetch dashboard stats with auth token
      fetch(`${API_BASE}/api/faculty/analytics/dashboard-stats/${facultyId}`, {
        headers: authHeaders,
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          if (!data.error) setDashboardStats(data);
        })
        .catch(err => console.error('Failed to fetch dashboard stats', err))
        .finally(() => setLoadingStats(false));

      // Fetch real recent activity
      fetch(`${API_BASE}/api/faculty/recent-activity`, {
        headers: authHeaders,
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setRecentActivities(data);
        })
        .catch(err => console.error('Failed to fetch recent activity', err))
        .finally(() => setLoadingActivity(false));

    } catch (e) {
      console.error('Failed to parse user data', e);
      setLoadingStats(false);
      setLoadingActivity(false);
    }
  }, []);

  const deptInfo = formatDepartment(dashboardStats.department);

  const stats = [
    { 
      icon: <FileText className="w-5 h-5" />, 
      label: 'Tests Created', 
      value: loadingStats ? '—' : dashboardStats.testsCreated.toString(), 
      color: 'bg-blue-500' 
    },
    { 
      icon: <Users className="w-5 h-5" />, 
      label: 'Students', 
      value: loadingStats ? '—' : dashboardStats.totalStudents.toString(), 
      color: 'bg-green-500' 
    },
    { 
      icon: <BookOpen className="w-5 h-5" />, 
      label: 'Sections', 
      value: loadingStats ? '—' : dashboardStats.sections, 
      color: 'bg-purple-500' 
    },
    { 
      icon: <Award className="w-5 h-5" />, 
      label: 'Dept', 
      value: loadingStats ? '—' : deptInfo.short, 
      subtext: !loadingStats ? deptInfo.subtitle : undefined,
      title: !loadingStats ? deptInfo.full : undefined,
      color: 'bg-[#FF7A00]' 
    },
  ];

  const getValueFontSize = (val: string) => {
    if (val.length > 12) return 'text-base sm:text-lg font-bold';
    if (val.length > 6) return 'text-xl sm:text-2xl font-extrabold';
    return 'text-2xl sm:text-3xl font-extrabold';
  };

  const pendingApprovals: any[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Faculty Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your courses, students, and assessments</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, index) => (
          <Card key={index} className="border border-gray-100 shadow-xs rounded-xl bg-white hover:border-orange-200 transition-all">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-sm text-gray-500 font-medium mb-1">{stat.label}</p>
                  <p 
                    className={`${getValueFontSize(stat.value)} text-gray-900 tracking-tight leading-tight truncate`}
                    title={stat.title || stat.value}
                  >
                    {stat.value}
                  </p>
                  {stat.subtext && (
                    <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5" title={stat.title}>
                      {stat.subtext}
                    </p>
                  )}
                </div>
                <div className={`${stat.color} p-2.5 rounded-xl text-white shadow-xs shrink-0`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending Approvals */}
        <Card className="border border-gray-100 shadow-xs rounded-xl bg-white">
          <CardHeader className="py-3.5 px-5 border-b border-gray-100 bg-gray-50/40">
            <CardTitle className="text-base font-semibold flex items-center space-x-2.5 text-gray-800">
              <Clock className="w-4 h-4 text-[#FF7A00]" />
              <span>Pending Approvals</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No pending approvals at this time.
              </div>
            ) : (
              pendingApprovals.map((approval, index) => (
                <div key={index} className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 text-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{approval.student}</p>
                      <p className="text-xs text-gray-500">{approval.request}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-400">{approval.time}</span>
                    <div className="flex space-x-2">
                      <Button size="sm" className="h-8 text-xs font-semibold px-3 bg-green-500 hover:bg-green-600">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs font-semibold px-3">Deny</Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="border border-gray-100 shadow-xs rounded-xl bg-white">
          <CardHeader className="py-3.5 px-5 border-b border-gray-100 bg-gray-50/40">
            <CardTitle className="text-base font-semibold flex items-center space-x-2.5 text-gray-800">
              <BarChart3 className="w-4 h-4 text-[#FF7A00]" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {loadingActivity ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading activity...</div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No recent activity.
              </div>
            ) : (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                  <div className="p-1.5 bg-[#FF7A00] bg-opacity-10 rounded-lg text-[#FF7A00] flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{activity.action}</span>
                      <span className="text-gray-500">: {activity.item}</span>
                    </p>
                    {activity.time && (
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(activity.time)}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
