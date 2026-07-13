import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Code2,
  Users,
  FileText,
  Calendar,
  Video,
  TrendingUp,
  CheckCircle,
  Clock,
  Eye,
  Download,
  Filter,
  LogOut,
  Menu,
  X,
  Briefcase
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import logoImage from '@/assets/image-removebg-preview.png';
import DriveManagementPage from './Drives/DriveManagementPage';
import AnalyticsDashboard from './AnalyticsDashboard';

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [dashboardData, setDashboardData] = useState({
    activeDrives: 0,
    applicants: 0,
    shortlisted: 0,
    hired: 0,
    drives: [],
    recentApplicants: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/v1/company/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setDashboardData(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { icon: <Briefcase className="w-6 h-6" />, label: 'Active Drives', value: dashboardData.activeDrives.toString(), color: 'bg-blue-500' },
    { icon: <Users className="w-6 h-6" />, label: 'Applicants', value: dashboardData.applicants.toString(), color: 'bg-green-500' },
    { icon: <CheckCircle className="w-6 h-6" />, label: 'Shortlisted', value: dashboardData.shortlisted.toString(), color: 'bg-purple-500' },
    { icon: <TrendingUp className="w-6 h-6" />, label: 'Hired (YTD)', value: dashboardData.hired.toString(), color: 'bg-[#FF7A00]' },
  ];

  const activeDrives = dashboardData.drives || [];
  const recentApplicants = dashboardData.recentApplicants || [];

  const menuItems = [
    { icon: <TrendingUp />, label: 'Overview' },
    { icon: <Briefcase />, label: 'Drive Management' },
    { icon: <FileText />, label: 'Create Assessment' },
    { icon: <Users />, label: 'Candidates' },
    { icon: <BarChart3 />, label: 'Analytics' },
    { icon: <CheckCircle />, label: 'Results' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-[#FF7A00]"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center space-x-2">
                <img src={logoImage} alt="MujCode Logo" className="w-8 h-8" />
                <span className="text-2xl font-bold text-gray-900">MujCode</span>
                <span className="hidden sm:inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                  COMPANY
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">Tech Corp</div>
                <div className="text-xs text-gray-500">Admin</div>
              </div>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                TC
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] 
          w-64 bg-white shadow-lg transition-transform duration-300 z-30
          overflow-y-auto
        `}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveTab(item.label);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.label 
                    ? 'bg-orange-50 text-[#FF7A00]' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className={activeTab === item.label ? "text-[#FF7A00]" : "text-gray-400"}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full bg-gray-50 min-h-screen">
          {activeTab === 'Overview' && (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Dashboard</h1>
                  <p className="text-gray-600">Manage recruitment drives and candidates</p>
                </div>
                <Button className="bg-[#FF7A00] hover:bg-[#FF6A00]" onClick={() => setActiveTab('Drive Management')}>
                  <Briefcase className="w-4 h-4 mr-2" />
                  Create New Drive
                </Button>
              </div>

              <AnalyticsDashboard dashboardData={dashboardData} />
            </div>
          )}

          {activeTab === 'Drive Management' && (
            <DriveManagementPage />
          )}

          {['Create Assessment', 'Candidates', 'Analytics', 'Results'].includes(activeTab) && (
            <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
              <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 max-w-md w-full">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-[#FF7A00]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
                <p className="text-gray-500 mb-6">
                  The {activeTab} module is currently under development. Check back later!
                </p>
                <Button 
                  onClick={() => setActiveTab('Overview')}
                  className="bg-[#FF7A00] hover:bg-[#FF6A00] w-full"
                >
                  Return to Overview
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function BarChart3({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}