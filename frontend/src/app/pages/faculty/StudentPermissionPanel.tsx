import { useState, useEffect } from 'react';
import { Search, ShieldAlert, Check, X, Lock, Unlock, User } from 'lucide-react';
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
import { Checkbox } from "@/app/components/ui/checkbox";
import { toast } from 'sonner';

interface StudentPermissionPanelProps {
    facultySections: string[];
}

interface Student {
    _id: string;
    fullName: string;
    college_id: string;
    section: string;
    branch: string;
    isBlocked?: boolean; // Helper from API
}

const FEATURES = [
    { id: 'learning', label: 'Learning Resources' },
    { id: 'tests', label: 'Tests & Quizzes' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'reports', label: 'Reports & Analytics' },
    { id: 'content', label: 'Content Hub' },
    { id: 'dashboard', label: 'Entire Dashboard (Lockout)' }
];

export default function StudentPermissionPanel({ facultySections }: StudentPermissionPanelProps) {
    const [selectedSection, setSelectedSection] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);

    // Selection for blocking
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [featuresToBlock, setFeaturesToBlock] = useState<string[]>([]);
    const [blockReason, setBlockReason] = useState('');

    const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

    useEffect(() => {
        if (selectedSection !== 'all') {
            fetchStudents(selectedSection);
        }
    }, [selectedSection]);

    const fetchStudents = async (section: string) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/admin/students?section=${section}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            // Filter by searching if needed or relying on backend
            setStudents(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const handleBlock = async () => {
        if (selectedStudents.length === 0 || featuresToBlock.length === 0) {
            toast.error('Select students and features to block');
            return;
        }

        try {
            const token = localStorage.getItem('token');

            // Loop through selected students and create blocks
            // In a real bulk API we'd send an array, but our controller takes single targetId
            // So we'll iterate.

            const promises = selectedStudents.map(studentId => {
                const student = students.find(s => s.college_id === studentId); // Using college_id as targetId
                return fetch(`${API_BASE}/permissions/block`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        scope: 'student',
                        targetId: studentId,
                        targetName: student?.fullName,
                        branch: student?.branch || 'Unknown',
                        section: student?.section || 'Unknown',
                        blockedFeatures: featuresToBlock,
                        reason: blockReason || 'Faculty Restriction'
                    })
                });
            });

            await Promise.all(promises);
            toast.success(`Successfully blocked features for ${selectedStudents.length} students`);

            // Reset form
            setSelectedStudents([]);
            setFeaturesToBlock([]);
            setBlockReason('');

            // Should refresh permissions list in parent component? 
            // We can emit event or just let user switch tabs.

        } catch (error) {
            toast.error('Failed to apply blocks');
        }
    };

    const toggleStudent = (id: string) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const toggleFeature = (id: string) => {
        setFeaturesToBlock(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. Select Students */}
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Select Students
                        </CardTitle>
                        <CardDescription>Choose section first, then select students to restrict.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Select value={selectedSection} onValueChange={setSelectedSection}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Select a Section...</SelectItem>
                                {facultySections.map(s => (
                                    <SelectItem key={s} value={s}>Section {s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {selectedSection !== 'all' && (
                            <div className="border rounded-lg p-2 h-64 overflow-y-auto space-y-1 bg-gray-50">
                                {loading && <p className="text-center text-sm text-gray-500 py-4">Loading students...</p>}
                                {!loading && students.length === 0 && <p className="text-center text-sm text-gray-500 py-4">No students found.</p>}
                                {students.map(student => (
                                    <div
                                        key={student.college_id}
                                        onClick={() => toggleStudent(student.college_id)}
                                        className={`p-2 rounded-md flex items-center justify-between cursor-pointer transition-colors ${selectedStudents.includes(student.college_id) ? 'bg-blue-100 border-blue-200' : 'hover:bg-white'}`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-gray-800">{student.fullName}</span>
                                            <span className="text-xs text-gray-500">{student.college_id}</span>
                                        </div>
                                        {selectedStudents.includes(student.college_id) && <Check className="w-4 h-4 text-blue-600" />}
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-gray-500 text-right">{selectedStudents.length} students selected</p>
                    </CardContent>
                </Card>

                {/* 2. Select Restrictions */}
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Lock className="w-5 h-5 text-red-600" />
                            Configure Restrictions
                        </CardTitle>
                        <CardDescription>What features should be blocked for selected students?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            {FEATURES.map(feature => (
                                <div key={feature.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={feature.id}
                                        checked={featuresToBlock.includes(feature.id)}
                                        onCheckedChange={() => toggleFeature(feature.id)}
                                    />
                                    <label
                                        htmlFor={feature.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                        {feature.label}
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason for Restriction</label>
                            <input
                                type="text"
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                placeholder="e.g. Disciplinary Action, Fees Pending..."
                                className="w-full text-sm border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-red-100 outline-none"
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                            onClick={handleBlock}
                            disabled={selectedStudents.length === 0 || featuresToBlock.length === 0}
                        >
                            <ShieldAlert className="w-4 h-4 mr-2" />
                            Block Access
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

function UserIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
