import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { toast } from 'sonner';
import axios from 'axios';

interface CreateTestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateTestModal({ open, onOpenChange }: CreateTestModalProps) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        testType: 'MCQ' as 'MCQ' | 'Coding' | 'Theory',
        type: 'Quiz',
        duration: 60,
        totalMarks: 100,
        startTime: '',
        branch: '',
        section: '',
        semester: ''
    });

    const handleCreate = async () => {
        // Validation
        if (!formData.title.trim()) {
            toast.error('Please enter a test title');
            return;
        }
        if (!formData.startTime) {
            toast.error('Please select a schedule date and time');
            return;
        }
        if (!formData.branch.trim() || !formData.section.trim() || !formData.semester) {
            toast.error('Please select branch, section and semester');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/tests/create', {
                title: formData.title,
                testType: formData.testType,
                type: formData.type,
                duration: formData.duration,
                totalMarks: formData.totalMarks,
                startTime: formData.startTime,
                branch: formData.branch,
                section: formData.section,
                semester: Number(formData.semester)
            });

            const { redirectUrl } = response.data;

            toast.success('Test created successfully! Redirecting to builder...');
            onOpenChange(false);

            // Redirect to builder page
            setTimeout(() => {
                navigate(redirectUrl);
            }, 500);
        } catch (error: any) {
            console.error('Error creating test:', error);
            toast.error(error.response?.data?.message || 'Failed to create test');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create New Test / Quiz</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Title */}
                    <div className="grid gap-2">
                        <Label>Test Title *</Label>
                        <Input
                            placeholder="e.g. Data Structures Mid-Term"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Test Type */}
                        <div className="grid gap-2">
                            <Label>Test Type *</Label>
                            <Select
                                value={formData.testType}
                                onValueChange={(value: 'MCQ' | 'Coding' | 'Theory') =>
                                    setFormData({ ...formData, testType: value })
                                }
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MCQ">📝 MCQ (Multiple Choice)</SelectItem>
                                    <SelectItem value="Coding">💻 Coding (Programming)</SelectItem>
                                    <SelectItem value="Theory">📖 Theory (Descriptive)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Category */}
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Quiz">Quiz</SelectItem>
                                    <SelectItem value="Assessment">Assessment</SelectItem>
                                    <SelectItem value="Lab">Lab Test</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Total Marks</Label>
                            <Input
                                type="number"
                                placeholder="100"
                                value={formData.totalMarks}
                                onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Duration (mins)</Label>
                            <Input
                                type="number"
                                placeholder="60"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Schedule Date & Time *</Label>
                        <Input
                            type="datetime-local"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        />
                    </div>

                    {/* Target Audience */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label>Branch *</Label>
                            <Input
                                placeholder="e.g. CSE"
                                value={formData.branch}
                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Section *</Label>
                            <Input
                                placeholder="e.g. A"
                                value={formData.section}
                                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Semester *</Label>
                            <Select
                                value={formData.semester}
                                onValueChange={(value) => setFormData({ ...formData, semester: value })}
                            >
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1</SelectItem>
                                    <SelectItem value="2">2</SelectItem>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="6">6</SelectItem>
                                    <SelectItem value="7">7</SelectItem>
                                    <SelectItem value="8">8</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Info Message */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <p className="text-blue-900">
                            <strong>Next Step:</strong> After creating the test, you'll be redirected to the test builder
                            where you can add questions based on the selected test type.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={handleCreate}
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Test'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
