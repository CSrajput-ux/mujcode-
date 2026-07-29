import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { useFacultyAssignments } from '@/app/hooks/useFacultyAssignments';

interface CreateTestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateTestModal({ open, onOpenChange }: CreateTestModalProps) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { sections, subjectsBySection, branchBySection, loading: assignmentsLoading } = useFacultyAssignments();

    const [formData, setFormData] = useState({
        title: '',
        testType: 'MCQ' as 'MCQ' | 'Coding' | 'Theory',
        type: 'Quiz',
        duration: 60,
        totalMarks: 100,
        startTime: '',
        section: '',
        subject: '',
        semester: '',
    });

    // ✅ Section choose karo → subjects auto-load
    const availableSubjects = subjectsBySection(formData.section);
    const autoBranch = branchBySection(formData.section);

    const handleSectionChange = (section: string) => {
        setFormData(prev => ({ ...prev, section, subject: '' }));
    };

    const handleCreate = async () => {
        if (!formData.title.trim()) { toast.error('Please enter a test title'); return; }
        if (!formData.startTime) { toast.error('Please select a schedule date and time'); return; }
        if (!formData.section) { toast.error('Please select a section'); return; }
        if (!formData.subject) { toast.error('Please select a subject'); return; }
        if (!formData.semester) { toast.error('Please select a semester'); return; }

        setLoading(true);
        try {
            const response = await axios.post(
                (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/tests/create',
                {
                    title: formData.title,
                    testType: formData.testType,
                    type: formData.type,
                    duration: formData.duration,
                    totalMarks: formData.totalMarks,
                    startTime: formData.startTime,
                    branch: autoBranch,
                    section: formData.section,
                    semester: Number(formData.semester),
                    subject: formData.subject,
                }
            );
            const { redirectUrl } = response.data;
            toast.success('Test created! Redirecting to builder...');
            onOpenChange(false);
            setTimeout(() => navigate(redirectUrl), 500);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create test');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[580px]">
                <DialogHeader>
                    <DialogTitle>Create New Test / Quiz</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Test Title */}
                    <div className="grid gap-2">
                        <Label>Test Title *</Label>
                        <Input
                            placeholder="e.g. Data Structures Mid-Term"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Test Type + Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Test Type *</Label>
                            <Select value={formData.testType} onValueChange={(v: 'MCQ' | 'Coding' | 'Theory') => setFormData({ ...formData, testType: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MCQ">📝 MCQ (Multiple Choice)</SelectItem>
                                    <SelectItem value="Coding">💻 Coding (Programming)</SelectItem>
                                    <SelectItem value="Theory">📖 Theory (Descriptive)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Quiz">Quiz</SelectItem>
                                    <SelectItem value="Assessment">Assessment</SelectItem>
                                    <SelectItem value="Lab">Lab Test</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Marks + Duration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Total Marks</Label>
                            <Input type="number" value={formData.totalMarks}
                                onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Duration (mins)</Label>
                            <Input type="number" value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })} />
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="grid gap-2">
                        <Label>Schedule Date & Time *</Label>
                        <Input type="datetime-local" value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                    </div>

                    {/* ✅ Section → Subject (cascading) */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Section */}
                        <div className="grid gap-2">
                            <Label>Section *</Label>
                            <Select value={formData.section} onValueChange={handleSectionChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder={assignmentsLoading ? 'Loading...' : 'Select Section'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.length > 0 ? sections.map(s => (
                                        <SelectItem key={s} value={s}>Section {s}</SelectItem>
                                    )) : (
                                        <SelectItem value="_none" disabled>No sections assigned</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Semester */}
                        <div className="grid gap-2">
                            <Label>Semester *</Label>
                            <Select value={formData.semester} onValueChange={(v) => setFormData({ ...formData, semester: v })}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    {[1,2,3,4,5,6,7,8].map(n => (
                                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Subject — auto from section */}
                    <div className="grid gap-2">
                        <Label>Subject *</Label>
                        <Select
                            value={formData.subject}
                            onValueChange={(v) => setFormData({ ...formData, subject: v })}
                            disabled={!formData.section}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={
                                    !formData.section
                                        ? 'Select Section first'
                                        : availableSubjects.length === 0
                                            ? 'No subjects found'
                                            : 'Select Subject'
                                } />
                            </SelectTrigger>
                            <SelectContent>
                                {availableSubjects.length > 0 ? availableSubjects.map(sub => (
                                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                                )) : (
                                    <SelectItem value="_none" disabled>No subjects for this section</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {formData.section && autoBranch && (
                            <p className="text-xs text-gray-400">Branch: {autoBranch} (auto-detected)</p>
                        )}
                    </div>

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <p className="text-blue-900">
                            <strong>Next Step:</strong> After creating the test, you'll be redirected to the test builder where you can add questions.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleCreate} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Test'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
