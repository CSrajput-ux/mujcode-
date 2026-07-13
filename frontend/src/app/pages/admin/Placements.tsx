import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
    Plus,
    ArrowLeft,
    Briefcase,
    Search,
    Filter,
    Building2,
    Calendar,
    Users,
    IndianRupee,
    ChevronRight,
    TrendingUp
} from 'lucide-react';
import { Input } from '../../components/ui/input';
import placementService from '../../services/placementService';
import { toast } from 'sonner';




export default function Placements() {
    const navigate = useNavigate();
    const [drives, setDrives] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchDrives();
    }, []);

    const fetchDrives = async () => {
        try {
            setLoading(true);
            const data = await placementService.getPlacementDrives();
            setDrives(data);
        } catch (error) {
            console.error('Error fetching drives:', error);
            toast.error('Failed to load placement drives');
        } finally {
            setLoading(false);
        }
    };

    const filteredDrives = drives.filter(d =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.Company?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = [
        { label: 'Active Drives', value: drives.filter(d => d.status === 'Scheduled' || d.status === 'Ongoing').length, icon: <TrendingUp className="w-4 h-4" />, color: 'orange' },
        { label: 'Total Companies', value: new Set(drives.map(d => d.Company?.id)).size, icon: <Building2 className="w-4 h-4" />, color: 'blue' },
        { label: 'Applications', value: drives.reduce((acc, d) => acc + (d.JobPostings?.[0]?.StudentApplications?.length || 0), 0), icon: <Users className="w-4 h-4" />, color: 'emerald' },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                            Placement <span className="text-orange-600">Headquarters</span>
                        </h1>
                        <p className="text-gray-500 font-medium">Strategic management of campus recruitment opportunities.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="rounded-xl border-gray-200 font-bold h-11"
                            onClick={() => navigate('/admin/dashboard')}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Dashboard
                        </Button>
                        <Button
                            className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold h-11 px-6 shadow-lg shadow-orange-600/20"
                            onClick={() => navigate('/admin/placements/add')}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Drive
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, idx) => (
                        <Card key={idx} className="border-none shadow-sm ring-1 ring-gray-100 rounded-3xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                                        <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                                    </div>
                                    <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
                                        {stat.icon}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters & Content Area */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search by drive title or company..."
                                className="pl-10 h-11 bg-gray-50/50 border-none focus:ring-2 focus:ring-orange-500/20 rounded-xl"
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            />

                        </div>
                        <Button variant="outline" className="h-11 border-gray-100 rounded-xl hover:bg-gray-50 font-bold px-6">
                            <Filter className="w-4 h-4 mr-2" />
                            Advanced Filters
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-40 bg-gray-100/50 rounded-3xl animate-pulse" />
                            ))
                        ) : filteredDrives.length > 0 ? (
                            filteredDrives.map((drive) => (
                                <Card key={drive.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl bg-white ring-1 ring-gray-100">
                                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                                        <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 p-4 shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-300">
                                            {drive.Company?.logoUrl ? (
                                                <img src={drive.Company.logoUrl} alt={drive.Company.name} className="max-w-full max-h-full object-contain" />
                                            ) : (
                                                <Building2 className="w-8 h-8 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 w-full space-y-4">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-xl font-black text-gray-900 group-hover:text-orange-600 transition-colors uppercase tracking-tight">
                                                            {drive.title}
                                                        </h3>
                                                        <Badge className={`
                                                            ${drive.status === 'Scheduled' ? 'bg-blue-50 text-blue-600' :
                                                                drive.status === 'Ongoing' ? 'bg-orange-50 text-orange-600' :
                                                                    'bg-emerald-50 text-emerald-600'}
                                                            border-none px-3 py-1 text-[10px] font-black uppercase
                                                        `}>
                                                            {drive.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center text-sm font-bold text-gray-500">
                                                        <Building2 className="w-4 h-4 mr-2 text-orange-500" />
                                                        {drive.Company?.name || 'Unknown Company'} • {drive.Company?.industry || 'Technology'}
                                                    </div>
                                                </div>
                                                <div className="flex -space-x-3 overflow-hidden">
                                                    {/* Mock participant avatars or similar */}
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                            {i === 3 ? '+24' : 'U'}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-2 border-t border-gray-50">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Drive Date</p>
                                                    <p className="text-sm font-bold text-gray-800 flex items-center">
                                                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                                                        {new Date(drive.driveDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Roles Offerred</p>
                                                    <p className="text-sm font-bold text-gray-800 flex items-center">
                                                        <Briefcase className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                                                        {drive.JobPostings?.length || 1} Positions
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Highest Package</p>
                                                    <p className="text-sm font-bold text-gray-800 flex items-center">
                                                        <IndianRupee className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
                                                        {drive.JobPostings?.[0]?.ctc || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    <Button variant="ghost" className="rounded-xl text-orange-600 font-black text-xs hover:bg-orange-50 group/btn">
                                                        Control Panel
                                                        <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Briefcase className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Zero Recruitment Activity</h3>
                                <p className="text-gray-500 max-w-xs mx-auto">Start by creating your first placement drive or onboarding more companies.</p>
                                <Button className="mt-6 rounded-xl bg-orange-600 hover:bg-orange-700" onClick={() => navigate('/admin/placements/add')}>
                                    Schedule Drive
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
