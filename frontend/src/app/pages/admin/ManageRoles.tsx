import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import {
    ShieldCheck,
    ArrowLeft,
    Plus,
    Search,
    UserPlus,
    Settings2,
    Lock,
    Users,
    Trash2,
    CheckCircle2,
    ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data for initial UI implementation
const MOCK_ROLES = [
    { id: 1, name: 'Super Admin', description: 'Full system access across all modules.', users: 2, permissionsCount: 145, status: 'Active' },
    { id: 2, name: 'HOD - CSE', description: 'Departmental oversight, faculty allocation, and student progress.', users: 1, permissionsCount: 42, status: 'Active' },
    { id: 3, name: 'Dean Academics', description: 'Institutional level academic policy and curriculum management.', users: 1, permissionsCount: 68, status: 'Active' },
    { id: 4, name: 'TPO Head', description: 'Placement drive management, company onboarding, and analytics.', users: 1, permissionsCount: 35, status: 'Active' },
];

export default function ManageRoles() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');


    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/admin/dashboard')}
                            className="text-gray-500 hover:text-orange-600 -ml-2 h-8"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Return to Dashboard
                        </Button>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center">
                            <ShieldCheck className="w-10 h-10 mr-4 text-orange-600" />
                            Authority <span className="text-orange-600 ml-2">Control</span>
                        </h1>
                        <p className="text-gray-500 font-medium">Fine-tune administrative powers and module access through granular roles.</p>
                    </div>
                    <Button
                        className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold h-12 px-8 shadow-lg shadow-orange-600/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Custom Role
                    </Button>
                </div>

                {/* Info Card */}
                <Card className="rounded-3xl border-none shadow-sm ring-1 ring-orange-100 bg-orange-50/30 overflow-hidden">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-orange-100 text-orange-600">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-orange-900 leading-tight">Security Protocol</p>
                            <p className="text-xs font-medium text-orange-700">Changing role permissions will affect all assigned users immediately. Ensure you verify the access inheritance before updating.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                placeholder="Search by role title..."
                                className="w-full pl-10 h-12 bg-white border border-gray-100 focus:ring-2 focus:ring-orange-500/20 rounded-xl text-sm font-medium shadow-sm transition-all outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {MOCK_ROLES.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).map((role) => (
                            <Card key={role.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] bg-white ring-1 ring-gray-100">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-100 border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                            Role ID: #{role.id}
                                        </Badge>
                                        <Switch checked={role.status === 'Active'} />
                                    </div>
                                    <CardTitle className="text-2xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                                        {role.name}
                                    </CardTitle>
                                    <CardDescription className="font-medium text-gray-500 leading-relaxed min-h-[48px]">
                                        {role.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50/50 p-4 rounded-2xl flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                                                <Users className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Users</p>
                                                <p className="text-sm font-black text-gray-900">{role.users}</p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50/50 p-4 rounded-2xl flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                                                <Lock className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Nodes</p>
                                                <p className="text-sm font-black text-gray-900">{role.permissionsCount}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <Button className="flex-1 rounded-2xl bg-gray-900 hover:bg-orange-600 text-white font-bold h-11 transition-all">
                                            <Settings2 className="w-4 h-4 mr-2" />
                                            Configure
                                        </Button>
                                        <Button variant="ghost" size="icon" className="w-11 h-11 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Direct Add Card */}
                        <div
                            className="rounded-[2rem] border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/30 transition-all flex flex-col items-center justify-center p-12 group cursor-pointer"
                        >
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                                <Plus className="w-8 h-8 text-gray-400 group-hover:text-orange-600" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">Add Advanced Role</h3>
                            <p className="text-sm font-medium text-gray-500 text-center mt-2 max-w-[200px]">Define a new set of permissions for a specialized department lead.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
