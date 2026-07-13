import { useState, useEffect } from 'react';
import { BookOpen, ShieldAlert, Check, Layout, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { toast } from 'sonner';

interface CoursePermissionPanelProps {
    facultyCourses: { _id: string; title: string, department: string }[];
    facultySections: string[];
}

const COURSE_FEATURES = [
    { id: 'content', label: 'View Course Content (Modules, Files)' },
    { id: 'tests', label: 'Take Tests & Quizzes' },
    { id: 'ppts', label: 'Download PPTs' },
    { id: 'pyqs', label: 'Access PYQs' },
];

export default function CoursePermissionPanel({ facultyCourses, facultySections }: CoursePermissionPanelProps) {
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('all');
    const [featuresToBlock, setFeaturesToBlock] = useState<string[]>([]);
    const [blockReason, setBlockReason] = useState('');
    const [loading, setLoading] = useState(false);

    const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

    const handleBlock = async () => {
        if (!selectedCourse) {
            toast.error('Select a course');
            return;
        }
        if (featuresToBlock.length === 0) {
            toast.error('Select features to block');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // For course blocks, we block the COURSE itself for a SECTION.
            // TargetId = CourseId
            // Section = Selected Section

            const courseTitle = facultyCourses.find(c => c._id === selectedCourse)?.title;

            // If "all" sections selected, we might want to iterate or support "all" in backend
            // For now, let's force section selection or just iterate on client side if "all"
            let sectionsToBlock = selectedSection === 'all' ? facultySections : [selectedSection];

            const promises = sectionsToBlock.map(section => {
                return fetch(`${API_BASE}/permissions/block`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        scope: 'course',
                        targetId: selectedCourse,
                        targetName: `${courseTitle} (Section ${section})`,
                        branch: 'NA', // Or derive 
                        section: section,
                        blockedFeatures: featuresToBlock,
                        reason: blockReason || 'Course Access Restriction'
                    })
                });
            });

            await Promise.all(promises);
            toast.success(`Restrictions applied to ${sectionsToBlock.length} sections for this course`);

            // Reset
            setFeaturesToBlock([]);
            setBlockReason('');

        } catch (error) {
            toast.error('Failed to apply course restrictions');
        } finally {
            setLoading(false);
        }
    };

    const toggleFeature = (id: string) => {
        setFeaturesToBlock(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6">
            <Card className="border-gray-200 shadow-xl border-t-4 border-t-orange-500">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        Course-Level Restrictions
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                        Restrict access to specific course materials for entire sections.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Select Course</label>
                            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                                <SelectTrigger className="bg-white border-gray-200 h-11">
                                    <SelectValue placeholder="Select one of your courses..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {facultyCourses.map(c => (
                                        <SelectItem key={c._id} value={c._id}>{c.title} ({c.department})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Target Section</label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger className="bg-white border-gray-200 h-11">
                                    <SelectValue placeholder="Select Target Section" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All My Sections</SelectItem>
                                    {facultySections.map(s => (
                                        <SelectItem key={s} value={s}>Section {s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="bg-orange-50/50 p-6 rounded-xl border border-orange-100/50 space-y-4">
                        <h4 className="text-sm font-bold text-orange-800 uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" />
                            Restrictions to Apply
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {COURSE_FEATURES.map(feature => (
                                <div
                                    key={feature.id}
                                    className={`
                                        flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer
                                        ${featuresToBlock.includes(feature.id)
                                            ? 'bg-red-50 border-red-200 shadow-sm'
                                            : 'bg-white border-transparent hover:bg-gray-50 border-dashed border-gray-200'}
                                    `}
                                    onClick={() => toggleFeature(feature.id)}
                                >
                                    <Checkbox
                                        id={`c-${feature.id}`}
                                        checked={featuresToBlock.includes(feature.id)}
                                        onCheckedChange={() => toggleFeature(feature.id)}
                                        className="border-gray-300 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                    />
                                    <label htmlFor={`c-${feature.id}`} className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                                        {feature.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Detailed Reason</label>
                        <textarea
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            placeholder="Please provide a reason for this restriction (visible to students)..."
                            className="w-full text-sm border border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none min-h-[80px]"
                        />
                    </div>

                </CardContent>
                <CardFooter className="bg-gray-50/50 flex justify-end p-6 rounded-b-xl">
                    <Button
                        onClick={handleBlock}
                        disabled={loading || !selectedCourse || featuresToBlock.length === 0}
                        className="bg-gray-900 hover:bg-black text-white font-bold px-6 h-11 rounded-xl shadow-lg shadow-gray-200 disabled:opacity-50 disabled:shadow-none"
                    >
                        {loading ? 'Applying...' : 'Apply Course Restrictions'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
