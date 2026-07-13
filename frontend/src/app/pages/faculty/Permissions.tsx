import { useState, useEffect } from 'react';
import {
    ShieldCheck, Clock, Layers,
    Calendar, Check, X, Info, User, BookOpen, Search, ShieldAlert
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { toast } from 'sonner';

import StudentPermissionPanel from '@/app/pages/faculty/StudentPermissionPanel';
import CoursePermissionPanel from '@/app/pages/faculty/CoursePermissionPanel';

interface PermissionRequest {
    _id: string;
    targetName: string;
    targetId: string;
    scope: 'student' | 'section' | 'course';
    blockedFeatures: string[];
    reason: string;
    createdAt: string;
    section: string;
    branch: string;
    status: 'active' | 'revoked';
}

interface FacultyProfile {
    department: string;
    teachingAssignments: Array<{
        section: string;
        subject: string;
    }>;
    teachingCourses: string[]; // IDs
    // We need course Details
}

export default function FacultyPermissions() {
    const [activeTab, setActiveTab] = useState("students");
    const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null);
    const [facultyCourses, setFacultyCourses] = useState<any[]>([]); // Detailed course info
    const [activeBlocks, setActiveBlocks] = useState<PermissionRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // 1. Fetch Profile
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            if (!user?.id) throw new Error('User not found');

            const profileRes = await fetch(`${API_BASE}/faculty/profile/${user.id}`, { headers });
            const profileData = await profileRes.json();
            setFacultyProfile(profileData);

            // 2. Fetch Courses (We need titles)
            // Ideally backend returns full course objects on profile or we fetch separately
            const coursesRes = await fetch(`${API_BASE}/faculty/courses`, { headers });
            const coursesData = await coursesRes.json();
            setFacultyCourses(coursesData);

            // 3. Fetch Active Blocks
            fetchActiveBlocks();

        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveBlocks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/permissions/blocks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setActiveBlocks(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleRevoke = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this restriction?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/permissions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Restriction revoked successfully');
                fetchActiveBlocks();
            } else {
                toast.error('Failed to revoke restriction');
            }
        } catch (error) {
            toast.error('Connection error');
        }
    };

    const sections = Array.from(new Set(facultyProfile?.teachingAssignments.map(a => a.section) || []));

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-[#FF7A00]" />
                        Permission Controls
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Manage student access and course restrictions in real-time.</p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Sections</span>
                    <div className="flex gap-2">
                        {sections.map(s => (
                            <Badge key={s} variant="outline" className="bg-white border-orange-200 text-orange-700 font-bold">{s}</Badge>
                        ))}
                    </div>
                </div>
            </div>

            <Tabs defaultValue="students" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 grid grid-cols-3 w-full md:w-[600px]">
                    <TabsTrigger value="students" className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 font-bold">
                        <User className="w-4 h-4 mr-2" /> Student Controls
                    </TabsTrigger>
                    <TabsTrigger value="courses" className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 font-bold">
                        <BookOpen className="w-4 h-4 mr-2" /> Course Controls
                    </TabsTrigger>
                    <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 font-bold">
                        <ShieldAlert className="w-4 h-4 mr-2" /> Active Blocks ({activeBlocks.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="students">
                    <StudentPermissionPanel facultySections={sections} />
                </TabsContent>

                <TabsContent value="courses">
                    <CoursePermissionPanel facultyCourses={facultyCourses} facultySections={sections} />
                </TabsContent>

                <TabsContent value="active">
                    <div className="grid grid-cols-1 gap-4">
                        {activeBlocks.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-900">No Active Restrictions</h3>
                                <p className="text-gray-500">All your students have full access.</p>
                            </div>
                        ) : (
                            activeBlocks.map(block => (
                                <Card key={block._id} className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between p-6 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="uppercase text-[10px] tracking-wider font-bold bg-gray-100 text-gray-600">
                                                    {block.scope}
                                                </Badge>
                                                <h3 className="text-lg font-bold text-gray-900">{block.targetName}</h3>
                                                {block.section !== 'NA' && (
                                                    <Badge className="bg-orange-100 text-orange-700 border-none">Section {block.section}</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                <span className="font-bold">Reason:</span> {block.reason}
                                            </p>
                                            <div className="flex gap-2 flex-wrap">
                                                {block.blockedFeatures.map(f => (
                                                    <span key={f} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-medium border border-red-100">
                                                        {f}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 justify-center">
                                            <Button
                                                onClick={() => handleRevoke(block._id)}
                                                variant="outline"
                                                className="border-red-200 text-red-600 hover:bg-red-50 font-bold"
                                            >
                                                Revoke Restriction
                                            </Button>
                                            <span className="text-xs text-gray-400">Created: {new Date(block.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
