import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Users,
  FileText,
  BarChart3,
  Clock,
  BookOpen,
  Award,
  CheckCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FacultyDashboard() {
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    sections: '0',
    department: '-',
    testsCreated: 0
  });
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const facultyId = user.id;
        
        fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/faculty/analytics/dashboard-stats/${facultyId}`)
          .then(res => res.json())
          .then(data => {
            if (!data.error) {
              setDashboardStats(data);
            }
          })
          .catch(err => console.error('Failed to fetch dashboard stats', err));
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
  }, []);

  const stats = [
    { icon: <FileText className="w-6 h-6" />, label: 'Tests Created', value: dashboardStats.testsCreated.toString(), color: 'bg-blue-500' },
    { icon: <Users className="w-6 h-6" />, label: 'Students', value: dashboardStats.totalStudents.toString(), color: 'bg-green-500' },
    { icon: <BookOpen className="w-6 h-6" />, label: 'Sections', value: dashboardStats.sections, color: 'bg-purple-500' },
    { icon: <Award className="w-6 h-6" />, label: 'Dept', value: dashboardStats.department, color: 'bg-[#FF7A00]' },
  ];

  const recentActivities: any[] = [];
  const pendingApprovals: any[] = [];

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
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-[#FF7A00]" />
              <span>Pending Approvals</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                No pending approvals at this time.
              </div>
            ) : (
              pendingApprovals.map((approval, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{approval.student}</p>
                      <p className="text-sm text-gray-600">{approval.request}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{approval.time}</span>
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline">Deny</Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-[#FF7A00]" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivities.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                No recent activity.
              </div>
            ) : (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-[#FF7A00] rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.action}</span>
                      <span className="text-gray-600">: {activity.item}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
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