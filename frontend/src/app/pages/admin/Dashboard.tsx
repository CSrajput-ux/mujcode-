import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Users,
  GraduationCap,
  Building2,
  Shield,
  UserCog,
  Award,
  LogOut,
  ChevronRight,
  Activity
} from 'lucide-react';
import logoImage from '@/assets/image-removebg-preview.png';
import { getDashboardStats, type DashboardStats } from '../../services/adminDashboardService';
import { getDashboardData } from '../../services/adminSystemService';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Real-data states
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [uptime, setUptime] = useState<any>(null);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [systemLoading, setSystemLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchSystemData();

    // Auto-refresh system data every 30 seconds
    const intervalId = setInterval(fetchSystemData, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemData = async () => {
    try {
      setSystemLoading(true);
      const data = await getDashboardData();

      if (data.success) {
        setActivityLogs(data.data.activityLogs || []);
        setSystemHealth(data.data.systemHealth || null);
        setUptime(data.data.uptime || null);
        setPlatformStats(data.data.platformStats || null);
      }
    } catch (error) {
      console.error('Error fetching system data:', error);
      // Fail silently - don't annoy user with toasts every 30 seconds
    } finally {
      setSystemLoading(false);
    }
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-IN');
  };

  // Format growth percentage with sign and color
  const formatGrowth = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    const color = percent >= 0 ? 'text-green-600' : 'text-red-600';
    return { text: `${sign}${percent}%`, color };
  };

  // Format time ago
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const statsConfig = [
    {
      icon: <GraduationCap className="w-6 h-6" />,
      label: 'Total Students',
      getValue: () => stats ? formatNumber(stats.totalStudents) : '0',
      getGrowth: () => stats ? stats.studentGrowthPercent : 0,
      color: 'bg-blue-500'
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: 'Faculty Members',
      getValue: () => stats ? formatNumber(stats.totalFaculty) : '0',
      getGrowth: () => stats ? stats.facultyGrowthPercent : 0,
      color: 'bg-green-500'
    },
    {
      icon: <Building2 className="w-6 h-6" />,
      label: 'Companies',
      getValue: () => stats ? formatNumber(stats.totalCompanies) : '0',
      getGrowth: () => stats ? stats.companyGrowthPercent : 0,
      color: 'bg-purple-500'
    },
    {
      icon: <Award className="w-6 h-6" />,
      label: 'Active Placements',
      getValue: () => stats ? formatNumber(stats.activePlacements) : '0',
      getGrowth: () => stats ? stats.placementGrowthPercent : 0,
      color: 'bg-[#FF7A00]'
    },
  ];

  const quickActions = [
    {
      title: 'Manage Students',
      description: 'Add, edit, or remove student accounts',
      icon: <GraduationCap className="w-8 h-8" />,
      color: 'bg-blue-50 text-blue-600',
      actions: [
        { label: 'View All Students', onClick: () => navigate('/admin/students') },
        { label: 'Add New Student', onClick: () => navigate('/admin/students/add') },
        { label: 'Bulk Upload', onClick: () => navigate('/admin/students/bulk-upload') }
      ]
    },
    {
      title: 'Manage Faculty',
      description: 'Control faculty accounts and permissions',
      icon: <UserCog className="w-8 h-8" />,
      color: 'bg-green-50 text-green-600',
      actions: [
        { label: 'View All Faculty', onClick: () => navigate('/admin/faculty') },
        { label: 'Add New Faculty', onClick: () => navigate('/admin/faculty/add') },
        { label: 'Assign Courses', onClick: () => navigate('/admin/faculty/assign') }
      ]
    },
    {
      title: 'Manage Companies',
      description: 'Handle company partnerships and placements',
      icon: <Building2 className="w-8 h-8" />,
      color: 'bg-purple-50 text-purple-600',
      actions: [
        { label: 'View All Companies', onClick: () => navigate('/admin/companies') },
        { label: 'Add New Company', onClick: () => navigate('/admin/companies/add') },
        { label: 'View Placement Drives', onClick: () => navigate('/admin/placements') }
      ]
    }
  ];





  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src={logoImage} alt="MujCode Logo" className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">MujCode</h1>
                <p className="text-xs text-gray-500">Admin Control Panel</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">Administrator</div>
                <div className="text-xs text-gray-500">chhotu.singh@jaipur.manipal.edu</div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                CS
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
            <p className="text-gray-600 mt-1">Quick access to manage students, faculty, and companies</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              // Loading skeletons
              [1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-none shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                        <div className="h-8 bg-gray-300 rounded w-16 mb-1 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                      <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              statsConfig.map((stat, index) => {
                const growth = formatGrowth(stat.getGrowth());
                return (
                  <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                          <p className="text-3xl font-bold text-gray-900">{stat.getValue()}</p>
                          <p className={`text-xs mt-1 font-medium ${growth.color}`}>
                            {growth.text} this month
                          </p>
                        </div>
                        <div className={`${stat.color} p-3 rounded-lg text-white shadow-md`}>
                          {stat.icon}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <Card key={index} className="border-none shadow-md hover:shadow-xl transition-all">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`${action.color} p-3 rounded-lg`}>
                        {action.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                        <p className="text-sm text-gray-500">{action.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {action.actions.map((btn, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="w-full justify-between hover:bg-gray-50"
                        onClick={btn.onClick}
                      >
                        <span>{btn.label}</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-[#FF7A00]" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemLoading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-gray-300 mt-2"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))
                ) : activityLogs && activityLogs.length > 0 ? (
                  activityLogs.map((log: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className={`w-2 h-2 rounded-full mt-2 ${log.type === 'student' ? 'bg-blue-500' :
                        log.type === 'faculty' ? 'bg-green-500' :
                          log.type === 'company' ? 'bg-purple-500' :
                            'bg-orange-500'
                        }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{log.message}</p>
                        <p className="text-sm text-gray-600 mt-1">{log.detail}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(log.createdAt)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span>System Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemLoading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                        <div className="h-4 bg-gray-300 rounded w-24"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))
                ) : systemHealth ? (
                  <>
                    {/* MongoDB */}
                    {systemHealth.health?.database?.mongo && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${systemHealth.health.database.mongo.status === 'Healthy' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                          <span className="font-medium text-gray-900">MongoDB</span>
                        </div>
                        <span className="text-sm text-gray-600">{systemHealth.health.database.mongo.status}</span>
                      </div>
                    )}
                    {/* PostgreSQL */}
                    {systemHealth.health?.database?.postgres && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${systemHealth.health.database.postgres.status === 'Healthy' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                          <span className="font-medium text-gray-900">PostgreSQL</span>
                        </div>
                        <span className="text-sm text-gray-600">{systemHealth.health.database.postgres.status}</span>
                      </div>
                    )}
                    {/* API Server */}
                    {systemHealth.health?.api && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                          <span className="font-medium text-gray-900">API Server</span>
                        </div>
                        <span className="text-sm text-gray-600">{systemHealth.health.api.status}</span>
                      </div>
                    )}
                    {/* Workers */}
                    {systemHealth.health?.workers && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${systemHealth.health.workers.status === 'Online' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                          <span className="font-medium text-gray-900">Workers</span>
                        </div>
                        <span className="text-sm text-gray-600">{systemHealth.health.workers.status}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Unable to fetch system health</p>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Uptime</p>
                    <p className="text-2xl font-bold text-green-500">
                      {uptime?.uptime?.percentage ? `${uptime.uptime.percentage}%` : '99.9%'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Stats */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Platform Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500 mb-1">
                    {platformStats?.stats?.testsCount?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Tests Conducted</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500 mb-1">
                    {platformStats?.stats?.problemsSolved?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Problems Solved</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-500 mb-1">
                    {platformStats?.stats?.activeSessions?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Active Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#FF7A00] mb-1">
                    {platformStats?.stats?.coursesActive?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Courses Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}