import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { toast } from 'sonner';
import { useFacultyAssignments } from '@/app/hooks/useFacultyAssignments';

interface CreateAssignmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: () => void;
}

export default function CreateAssignmentModal({ open, onOpenChange, onCreated }: CreateAssignmentModalProps) {
    const [loading, setLoading] = useState(false);
    const { sections, subjectsBySection, branchBySection, loading: assignmentsLoading } = useFacultyAssignments();

    const [formData, setFormData] = useState({
        type: 'Assignment',
        section: '',
        subject: '',
        title: '',
        description: '',
        dueDate: '',
    });

    // ✅ Section choose karo → subjects auto-load
    const availableSubjects = subjectsBySection(formData.section);
    const autoBranch = branchBySection(formData.section);

    const handleSectionChange = (section: string) => {
        setFormData(prev => ({ ...prev, section, subject: '' }));
    };

    const handleCreate = async () => {
        if (!formData.title.trim()) { toast.error('Please enter assignment title'); return; }
        if (!formData.section) { toast.error('Please select a section'); return; }
        if (!formData.subject) { toast.error('Please select a subject'); return; }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/assignments',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        type: formData.type,
                        section: formData.section,
                        branch: autoBranch,
                        subject: formData.subject,
                        title: formData.title,
                        description: formData.description,
                        dueDate: formData.dueDate,
                    })
                }
            );
            if (!res.ok) throw new Error('Server error');
            toast.success('Assignment created successfully!');
            setFormData({ type: 'Assignment', section: '', subject: '', title: '', description: '', dueDate: '' });
            onOpenChange(false);
            onCreated?.();
        } catch {
            toast.error('Failed to create assignment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[580px]">
                <DialogHeader>
                    <DialogTitle>Create Assignment / Task</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Type */}
                    <div className="grid gap-2">
                        <Label>Type</Label>
                        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Assignment">Assignment</SelectItem>
                                <SelectItem value="CaseStudy">Case Study</SelectItem>
                                <SelectItem value="Research">Research Paper</SelectItem>
                                <SelectItem value="Other">Other Task</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ✅ Section → Subject (cascading) */}
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
                        {formData.section && autoBranch && (
                            <p className="text-xs text-gray-400">Branch: {autoBranch} • auto-detected</p>
                        )}
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
                    </div>

                    {/* Title */}
                    <div className="grid gap-2">
                        <Label>Title *</Label>
                        <Input
                            placeholder="Assignment Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea
                            placeholder="Instructions..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Upload */}
                    <div className="grid gap-2">
                        <Label>Upload File (PDF/DOC)</Label>
                        <Input type="file" />
                    </div>

                    {/* Due Date */}
                    <div className="grid gap-2">
                        <Label>Due Date</Label>
                        <Input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button className="bg-[#FF7A00] hover:bg-[#FF6A00]" onClick={handleCreate} disabled={loading}>
                        {loading ? 'Creating...' : 'Assign Task'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
