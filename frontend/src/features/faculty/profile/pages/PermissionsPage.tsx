import { useState, useEffect } from 'react';
import {
    ShieldCheck, ShieldAlert, Clock, Filter,
    CheckCircle2, XCircle, AlertCircle, Search,
    ChevronDown, User, BookOpen, Layers,
    Calendar, Check, X, Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from '@/app/components/ui/utils';
import { toast } from 'sonner';

interface PermissionRequest {
    _id: string;
    studentId: string;
    studentName?: string; // To be populated if backend supports
    courseId: {
        _id: string;
        title: string;
        department: string;
    };
    section: string;
    requestedAt: string;
    status: 'pending' | 'approved' | 'denied';
}

interface FacultyProfile {
    department: string;
    teachingAssignments: Array<{
        section: string;
        subject: string;
    }>;
    teachingCourses: string[];
    createdCourses: string[];
}

export default function FacultyPermissions() {
    const [requests, setRequests] = useState<PermissionRequest[]>([]);
    const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        section: 'all',
        status: 'pending',
        course: 'all'
    });

    const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch Faculty Profile for ABAC rules
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            if (!user?.id) throw new Error('User not found');

            const profileRes = await fetch(`${API_BASE}/faculty/profile/${user.id}`, { headers });
            const profileData = await profileRes.json();
            setFacultyProfile(profileData);

            // Fetch Requests
            fetchRequests();
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        let url = `${API_BASE}/permissions?status=${filters.status !== 'all' ? filters.status : ''}`;
        if (filters.section !== 'all') url += `&section=${filters.section}`;

        const res = await fetch(url, { headers });
        const data = await res.json();
        setRequests(data);
    };

    useEffect(() => {
        if (!loading) fetchRequests();
    }, [filters]);

    const handleAction = async (requestId: string, status: 'approved' | 'denied') => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/permissions/${requestId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                toast.success(`Request ${status} successfully`);
                fetchRequests();
            } else {
                const error = await res.json();
                toast.error(error.error || 'Failed to update status');
            }
        } catch (error) {
            toast.error('Connection error');
        }
    };

    const canFacultyManage = (req: PermissionRequest) => {
        if (!facultyProfile) return false;

        // Strict ABAC Logic:
        // 1. Same department
        // 2. Section is assigned to faculty
        // 3. Course is taught OR created by faculty
        const isSameDept = req.courseId.department === facultyProfile.department;
        const isAssignedSection = facultyProfile.teachingAssignments.some(a => a.section === req.section);
        const hasCourseAuthority = facultyProfile.teachingCourses.includes(req.courseId._id) ||
            facultyProfile.createdCourses.includes(req.courseId._id);

        return isSameDept && isAssignedSection && hasCourseAuthority;
    };

    const sections = Array.from(new Set(facultyProfile?.teachingAssignments.map(a => a.section) || []));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-[#FF7A00]" />
                        Permission Management
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Review and manage student course access requests for your sections.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-orange-50 px-4 py-2 rounded-lg border border-orange-100">
                        <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block">Assigned Sections</span>
                        <div className="flex gap-2 mt-1">
                            {sections.map(s => (
                                <Badge key={s} variant="outline" className="bg-white border-orange-200 text-orange-700 font-bold">{s}</Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Status</label>
                    <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
                        <SelectTrigger className="bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-orange-500/20">
                            <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending Requests</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="denied">Denied</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">Section</label>
                    <Select value={filters.section} onValueChange={(v) => setFilters(prev => ({ ...prev, section: v }))}>
                        <SelectTrigger className="bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-orange-500/20">
                            <SelectValue placeholder="Select Section" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                            <SelectItem value="all">All My Sections</SelectItem>
                            {sections.map(s => (
                                <SelectItem key={s} value={s}>Section {s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-1 md:col-span-2 flex items-end">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Student ID..."
                            className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-medium placeholder:text-gray-400"
                        />
                    </div>
                </div>
            </div>

            {/* Requests Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {requests.length === 0 ? (
                    <div className="col-span-full py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                            <ShieldAlert className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No requests found</h3>
                        <p className="text-gray-500 mt-1 max-w-xs mx-auto font-medium">There are no permission requests matching your current filters.</p>
                    </div>
                ) : (
                    requests.map(req => {
                        const manageable = canFacultyManage(req);
                        return (
                            <Card key={req._id} className="group overflow-hidden rounded-2xl border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white ring-1 ring-gray-100">
                                <CardHeader className="pb-4 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-bold text-gray-900">{req.studentId}</CardTitle>
                                                <CardDescription className="text-xs font-semibold text-gray-400">Student ID</CardDescription>
                                            </div>
                                        </div>
                                        <Badge
                                            className={cn(
                                                "capitalize px-3 py-1 rounded-full font-bold text-[10px] tracking-wider",
                                                req.status === 'pending' ? "bg-yellow-100 text-yellow-700 border-none" :
                                                    req.status === 'approved' ? "bg-green-100 text-green-700 border-none" :
                                                        "bg-red-100 text-red-700 border-none"
                                            )}
                                        >
                                            {req.status}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4 pb-6">
                                    <div className="p-4 bg-gray-50/80 rounded-xl space-y-3">
                                        <div className="flex items-center gap-3">
                                            <BookOpen className="w-4 h-4 text-[#FF7A00]" />
                                            <span className="text-sm font-bold text-gray-700 leading-tight">{req.courseId.title}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs font-bold text-gray-500">Section {req.section}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-xs font-bold text-gray-500">{new Date(req.requestedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {!manageable && (
                                        <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2 border border-red-100">
                                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                            <p className="text-[10px] font-bold text-red-600 leading-snug">
                                                You are not authorized to manage this request (Outside assigned sections/department).
                                            </p>
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="pt-0 pb-6 flex gap-3">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex-1">
                                                    <Button
                                                        disabled={!manageable || req.status !== 'pending'}
                                                        onClick={() => handleAction(req._id, 'approved')}
                                                        className="w-full bg-green-600 hover:bg-green-700 h-10 rounded-xl font-bold shadow-lg shadow-green-100 disabled:opacity-50 disabled:shadow-none"
                                                    >
                                                        <Check className="w-4 h-4 mr-2" /> Approve
                                                    </Button>
                                                </div>
                                            </TooltipTrigger>
                                            {!manageable && (
                                                <TooltipContent className="bg-red-900 border-none text-white font-bold rounded-lg shadow-xl">
                                                    You are not authorized for this section
                                                </TooltipContent>
                                            )}
                                        </Tooltip>

                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex-1">
                                                    <Button
                                                        variant="outline"
                                                        disabled={!manageable || req.status !== 'pending'}
                                                        onClick={() => handleAction(req._id, 'denied')}
                                                        className="w-full border-red-200 text-red-600 hover:bg-red-50 h-10 rounded-xl font-bold disabled:opacity-50"
                                                    >
                                                        <X className="w-4 h-4 mr-2" /> Deny
                                                    </Button>
                                                </div>
                                            </TooltipTrigger>
                                            {!manageable && (
                                                <TooltipContent className="bg-red-900 border-none text-white font-bold rounded-lg shadow-xl">
                                                    You are not authorized for this section
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </CardFooter>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
