import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Menu,
    X,
    LogOut,
    Settings,
    FileText,
    BarChart3,
    ClipboardList,
    Users,
    Shield,
    Building,
    Upload,
    Video
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import FacultyProfileModal from './FacultyProfileModal';
import EditFacultyProfileModal from './EditFacultyProfileModal'; // Added import for EditFacultyProfileModal
import logoImage from '@/assets/image-removebg-preview.png';

interface FacultyLayoutProps {
    children: React.ReactNode;
}

export default function FacultyLayout({ children }: FacultyLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [editProfileOpen, setEditProfileOpen] = useState(false); // Added state for EditFacultyProfileModal
    const [user, setUser] = useState<{ name: string; department?: string; email?: string; role?: string } | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse user data', e);
            }
        }
    }, []);

    const getInitials = (name: string) => {
        if (!name) return 'FM';
        return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
    };

    const menuItems = [
        { icon: <BarChart3 className="w-5 h-5" />, label: 'Dashboard', path: '/faculty/dashboard' },
        { icon: <Settings className="w-5 h-5" />, label: 'Permissions', path: '/faculty/permissions' },
        { icon: <FileText className="w-5 h-5" />, label: 'Tests & Quiz', path: '/faculty/tests' },
        { icon: <BarChart3 className="w-5 h-5" />, label: 'Activity', path: '/faculty/activity' },
        { icon: <ClipboardList className="w-5 h-5" />, label: 'Assignments', path: '/faculty/assignments' },
        { icon: <Users className="w-5 h-5" />, label: 'Reports', path: '/faculty/reports' },
        { icon: <Upload className="w-5 h-5" />, label: 'Content Hub', path: '/faculty/content' },
        { icon: <Video className="w-5 h-5" />, label: 'Live Classes', path: '/faculty/live-classes' }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navbar */}
            <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-40">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-600 hover:text-[#FF7A00]">
                                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                            <div className="flex items-center space-x-2">
                                <img src={logoImage} alt="MujCode Logo" className="w-8 h-8" />
                                <span className="text-2xl font-bold text-gray-900">MujCode</span>
                                <span className="hidden sm:inline-block px-2 py-1 bg-orange-100 text-orange-700 text-[10px] rounded-full font-bold uppercase tracking-wider">FACULTY</span>
                            </div>
                        </div>

                        <Popover>
                            <PopoverTrigger asChild>
                                <div className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-sm font-semibold text-gray-900">{user?.name || 'Faculty Member'}</div>
                                        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-tighter">{user?.department || 'Department of CSE'}</div>
                                    </div>
                                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white">
                                        {user?.name ? getInitials(user.name) : 'FM'}
                                    </div>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-0 mr-4 shadow-2xl border-none overflow-hidden" align="end">
                                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white relative">
                                    <div className="absolute right-0 top-0 p-4 opacity-10">
                                        <Shield className="w-16 h-16" />
                                    </div>
                                    <div className="flex items-center space-x-3 relative z-10">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold backdrop-blur-md shadow-sm">
                                            {user?.name ? getInitials(user.name) : 'FM'}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h3 className="font-bold text-sm truncate leading-tight">{user?.name || 'Faculty Member'}</h3>
                                            <p className="text-white/70 text-[10px] truncate">{user?.email || 'No Email'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 space-y-1">
                                    <button
                                        onClick={() => setProfileOpen(true)}
                                        className="w-full flex items-center space-x-3 text-xs p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                                    >
                                        <Building className="w-4 h-4" />
                                        <span>View Profile</span>
                                    </button>

                                    <button
                                        onClick={() => setEditProfileOpen(true)}
                                        className="w-full flex items-center space-x-3 text-xs p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>Edit Profile</span> {/* Changed label from "Edit Assignments" to "Edit Profile" */}
                                    </button>
                                </div>

                                <div className="p-2 border-t border-gray-50">
                                    <button onClick={() => navigate('/')} className="w-full flex items-center justify-center space-x-2 text-red-600 hover:bg-red-50 py-2.5 rounded-lg transition-colors text-xs font-bold">
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
                <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg transition-transform duration-300 z-30 overflow-y-auto`}>
                    <nav className="p-6 space-y-2">
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path
                                    ? 'bg-[#FF7A00] text-white shadow-lg shadow-orange-100'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <div className={`${location.pathname === item.path ? 'text-white' : 'text-gray-400'}`}>{item.icon}</div>
                                <span className="font-semibold text-sm">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 sm:p-8 lg:p-10">
                    {children}
                </main>
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <FacultyProfileModal
                open={profileOpen}
                onOpenChange={setProfileOpen}
                onSuccess={() => { }}
            />

            <EditFacultyProfileModal
                open={editProfileOpen}
                onOpenChange={setEditProfileOpen}
                onSuccess={() => { }}
            />
        </div>
    );
}
