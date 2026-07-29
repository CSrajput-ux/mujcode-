import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  Users,
  FileText,
  BarChart3,
  Clock,
  BookOpen,
  Award,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFacultyAssignments } from '@/app/hooks/useFacultyAssignments';

interface DashboardStats {
  totalStudents: number;
  sections: string;
  department: string;
  testsCreated: number;
}

export default function FacultyDashboard() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const { assignments } = useFacultyAssignments();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/faculty/analytics/dashboard-stats/${user.id}`,
          { headers }
        )
          .then(r => r.json())
          .then(data => setDashboardStats(data))
          .catch(() => {});
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
  }, []);

  // Unique sections from teachingAssignments
  const uniqueSections = [...new Set(assignments.map(a => a.section).filter(Boolean))].sort().join(', ') || dashboardStats?.sections || '—';
  const uniqueBranches = [...new Set(assignments.map(a => a.branch).filter(Boolean))].sort().join(', ') || '—';

  const stats = [
    {
      icon: <FileText className="w-6 h-6" />,
      label: 'Tests Created',
      value: String(dashboardStats?.testsCreated ?? 0),
      color: 'bg-blue-500'
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: 'Students',
      value: String(dashboardStats?.totalStudents ?? 0),
      color: 'bg-green-500'
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      label: 'Sections',
      value: uniqueSections,
      color: 'bg-purple-500',
      small: true
    },
    {
      icon: <Award className="w-6 h-6" />,
      label: 'Dept',
      value: dashboardStats?.department || uniqueBranches,
      color: 'bg-[#FF7A00]',
      small: true
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Faculty Dashboard</h1>
        <p className="text-gray-600">Manage your courses, students, and assessments</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className={`font-bold text-gray-900 leading-tight ${stat.small ? 'text-base break-words' : 'text-3xl'}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white flex-shrink-0`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Assigned Sections */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-[#FF7A00]" />
              <span>My Assigned Sections</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {assignments.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {assignments.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{a.subject}</p>
                      <p className="text-xs text-gray-500">{a.branch} • Section {a.section} • {a.year}</p>
                    </div>
                    <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      Sec {a.section}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 italic text-sm py-6">No pending approvals at this time.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-[#FF7A00]" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-center text-gray-400 italic text-sm py-6">No recent activity.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}