import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Code2,
  BarChart3,
  FileText,
  GraduationCap,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Shield,
  Ticket,
  UserCircle,
  Briefcase,
  Lock // Added lock icon for blocked state
} from 'lucide-react';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import CompleteProfileDialog from './CompleteProfileDialog';
import EditProfileModal from './EditProfileModal';
import logoImage from '@/assets/image-removebg-preview.png';

interface StudentLayoutProps {
  children: ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [blockedFeatures, setBlockedFeatures] = useState<string[]>([]); // New State

  useEffect(() => {
    // Poll for permissions or fetch on load
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // We need an endpoint to get "My Permissions" / "My Restrictions"
        // Since we implemented GET /api/permissions/blocks for faculty, we might need a student equivalent
        // OR we can just hit a lightweight endpoint.
        // For now, let's assume we can fetch from a new endpoint: GET /api/student/permissions
        // Wait, we haven't created that endpoint yet. 
        // Let's create it in studentProfileRoutes or similar? 
        // Or just use the existence of blocks.

        // Actually, for immediate enforcement, let's just make the Menu Items logic robust.
        // If we don't have the endpoint, we can't hide it yet.
        // REQUIRED: I need to add GET /api/student/restrictions to fetch my blocks.

        const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/student/restrictions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBlockedFeatures(data.blockedFeatures || []);
        }
      } catch (e) {
        console.error("Failed to fetch permissions");
      }
    };

    fetchPermissions();
  }, [location.pathname]); // Re-check on navigation? Or just once on mount.

  const refreshProfile = () => {
    setUserProfile(JSON.parse(localStorage.getItem('user') || '{}'));
  };

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', path: '/student/dashboard', id: 'dashboard' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Courses', path: '/student/courses', id: 'courses' },
    { icon: <Code2 className="w-5 h-5" />, label: 'Problems', path: '/student/problems', id: 'problems' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics', path: '/student/analytics', id: 'reports' },
    { icon: <FileText className="w-5 h-5" />, label: 'Tests / Quiz', path: '/student/tests', id: 'tests' },
    { icon: <GraduationCap className="w-5 h-5" />, label: 'Learning', path: '/student/learning', id: 'learning' },
    { icon: <ClipboardList className="w-5 h-5" />, label: 'Assignments', path: '/student/assignments', id: 'assignments' },
    { icon: <Briefcase className="w-5 h-5" />, label: 'Placements', path: '/student/placements', id: 'placements' },
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
              </div>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-gray-900">
                      {userProfile.name?.split(' ')[0] || 'Student'}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {(() => {
                        const email = userProfile.email || '';
                        const match = email.match(/\.(\d+)@/);
                        return match ? match[1] : '---';
                      })()}
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-[#FF7A00] rounded-full flex items-center justify-center text-white font-semibold shadow-inner">
                    {userProfile.name ? userProfile.name.split(' ')[0].charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 mr-4 shadow-2xl border-none" align="end">
                {/* Header */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white rounded-t-md relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <GraduationCap className="w-24 h-24" />
                  </div>
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold backdrop-blur-md shadow-sm">
                      {userProfile.name ? userProfile.name.split(' ')[0].charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-semibold text-lg truncate leading-tight">{userProfile.name?.split(' ')[0] || 'Student'}</h3>
                      <p className="text-white/80 text-xs truncate">{userProfile.email || 'No Email'}</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-1">
                  <div className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Shield className="w-4 h-4" />
                      <span>Role</span>
                    </div>
                    <span className="font-medium capitalize bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] tracking-wide">
                      {userProfile.role || 'Student'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Ticket className="w-4 h-4" />
                      <span>College ID</span>
                    </div>
                    <span className="font-mono text-gray-900 text-xs font-semibold">
                      {(() => {
                        const email = userProfile.email || '';
                        const match = email.match(/\.(\d+)@/);
                        return match ? match[1] : '---';
                      })()}
                    </span>
                  </div>

                  {/* Profile Info Section */}
                  <div className="py-2 mt-2 space-y-1 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg text-gray-700">
                      <span>Branch</span>
                      <span className="font-semibold text-gray-900">{userProfile.branch || '---'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg text-gray-700">
                      <span>Section</span>
                      <span className="font-semibold text-gray-900">{userProfile.section || '---'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg text-gray-700">
                      <span>Year</span>
                      <span className="font-semibold text-gray-900">
                        {userProfile.year ? `${userProfile.year}${['st', 'nd', 'rd'][userProfile.year - 1] || 'th'} Year` : '---'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-3 bg-gray-50/50 space-y-2 border-t border-gray-100">
                  {!userProfile.section ? (
                    <button
                      onClick={() => setProfileDialogOpen(true)}
                      className="w-full flex items-center justify-center space-x-2 bg-orange-600 text-white hover:bg-orange-700 py-2.5 rounded-lg transition-all text-sm font-semibold shadow-md active:scale-95"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Complete Profile</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditProfileOpen(true)}
                      className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 py-2.5 rounded-lg transition-all text-sm font-semibold shadow-sm active:scale-95"
                    >
                      <UserCircle className="w-4 h-4 text-orange-500" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/')}
                    className="w-full flex items-center justify-center space-x-2 text-red-600 hover:bg-red-50 py-2.5 rounded-lg transition-colors text-sm font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          fixed top-16 left-0 h-[calc(100vh-4rem)] 
          w-64 bg-white shadow-lg transition-transform duration-300 z-30
          overflow-y-auto
        `}>
          <nav className="p-4 space-y-2">
            {menuItems.map((item, index) => {
              const isBlocked = blockedFeatures.includes(item.id);
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (isBlocked) return;
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  disabled={isBlocked}
                  className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                  ${location.pathname === item.path
                      ? 'bg-[#FF7A00] text-white shadow-md'
                      : isBlocked
                        ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                `}
                >
                  {isBlocked ? <Lock className="w-5 h-5" /> : item.icon}
                  <span className="font-medium">{item.label} {isBlocked && '(Locked)'}</span>
                </button>
              )
            })}

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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-64">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Profile Dialogs */}
      <CompleteProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        onSuccess={refreshProfile}
      />

      <EditProfileModal
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        onSuccess={refreshProfile}
      />
    </div>
  );
}