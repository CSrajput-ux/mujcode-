import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Users,
  FileText,
  BarChart3,
  Clock,
  BookOpen,
  Award,
  CheckCircle
} from 'lucide-react';
import { useEffect } from 'react';

export default function FacultyDashboard() {
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
  }, []);

  const stats = [
    { icon: <FileText className="w-6 h-6" />, label: 'Tests Created', value: '28', color: 'bg-blue-500' },
    { icon: <Users className="w-6 h-6" />, label: 'Students', value: '150', color: 'bg-green-500' },
    { icon: <BookOpen className="w-6 h-6" />, label: 'Sections', value: '3', color: 'bg-purple-500' },
    { icon: <Award className="w-6 h-6" />, label: 'Dept', value: 'CSE', color: 'bg-[#FF7A00]' },
  ];

  const recentActivities = [
    { action: 'Created test', item: 'Data Structures Final', time: '2 hours ago' },
    { action: 'Approved access', item: '15 students for Quiz Module', time: '5 hours ago' },
    { action: 'Graded assignment', item: 'Database Lab 3', time: '1 day ago' }
  ];

  const pendingApprovals = [
    { student: 'John Smith', request: 'Course Access: Advanced Algorithms', time: '10 min ago' },
    { student: 'Emily Davis', request: 'Test Access: Midterm Exam', time: '1 hour ago' },
    { student: 'Michael Chen', request: 'Course Access: Machine Learning', time: '2 hours ago' }
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
            {pendingApprovals.map((approval, index) => (
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
            ))}
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
            {recentActivities.map((activity, index) => (
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
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}