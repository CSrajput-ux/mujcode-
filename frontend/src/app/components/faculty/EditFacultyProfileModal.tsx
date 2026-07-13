import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Trash2, BookOpen, Mail, ShieldAlert } from 'lucide-react';

interface Assignment {
    year: string;
    section: string;
    branch: string;
    subject: string;
}

interface EditFacultyProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function EditFacultyProfileModal({ open, onOpenChange, onSuccess }: EditFacultyProfileModalProps) {
    const [loading, setLoading] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [department, setDepartment] = useState('');
    const [designation, setDesignation] = useState('');
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    useEffect(() => {
        if (open) {
            fetchProfile();
        }
    }, [open]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/faculty/profile/${user.id}`);
            const data = await res.json();
            if (res.ok) {
                setDepartment(data.department || '');
                setDesignation(data.designation || '');
                setAssignments(data.teachingAssignments || []);
            }
        } catch (error) {
            console.error("Failed to fetch faculty profile", error);
        }
    };

    const addAssignment = () => {
        setAssignments([...assignments, { year: '1st Year', section: 'A', branch: 'CSE', subject: '' }]);
    };

    const removeAssignment = (index: number) => {
        setAssignments(assignments.filter((_, i) => i !== index));
    };

    const updateAssignment = (index: number, field: keyof Assignment, value: string) => {
        const newAssignments = [...assignments];
        newAssignments[index][field] = value;
        setAssignments(newAssignments);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/faculty/profile/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    department,
                    designation,
                    teachingAssignments: assignments
                })
            });

            if (res.ok) {
                // Sync local storage if needed (but usually we keep base in PG)
                onSuccess();
                onOpenChange(false);
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Failed to update profile');
            }
        } catch (error) {
            alert('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <DialogTitle className="text-2xl font-bold">Edit Faculty Profile</DialogTitle>
                    <DialogDescription className="text-orange-50/90 italic font-medium">
                        Manage your assignments and professional details. Teaching mappings reflect on student dashboards.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="bg-white overflow-y-auto max-h-[70vh]">
                    <div className="p-6 space-y-8">
                        {/* Locked Identity Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="space-y-2">
                                <Label className="text-gray-500 font-bold text-[10px] uppercase flex items-center gap-1.5">
                                    <Mail className="w-3 h-3" /> Faculty Email (Locked)
                                </Label>
                                <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-sm font-medium cursor-not-allowed">
                                    {user.email || 'faculty@muj.edu'}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-500 font-bold text-[10px] uppercase flex items-center gap-1.5">
                                    <ShieldAlert className="w-3 h-3" /> Faculty ID (Locked)
                                </Label>
                                <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-sm font-medium cursor-not-allowed">
                                    {user.facultyId || 'FAC-12345'}
                                </div>
                            </div>
                        </div>

                        {/* Professional Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-gray-500 font-bold text-xs uppercase">Department</Label>
                                <Input
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="e.g. Computer Science"
                                    className="border-gray-200 focus:ring-orange-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-500 font-bold text-xs uppercase">Designation</Label>
                                <Select value={designation} onValueChange={setDesignation}>
                                    <SelectTrigger className="border-gray-200 focus:ring-orange-500">
                                        <SelectValue placeholder="Select designation" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Professor">Professor</SelectItem>
                                        <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                                        <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                                        <SelectItem value="Guest Faculty">Guest Faculty</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Teaching Assignments */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-orange-600" />
                                    Teaching Assignments
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addAssignment}
                                    className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs gap-1 font-bold"
                                >
                                    <Plus className="w-3 h-3" /> Add Mapping
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {assignments.length === 0 && (
                                    <div className="text-center p-8 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-sm">
                                        No assignments mapped yet. Click 'Add Mapping' to start.
                                    </div>
                                )}

                                {assignments.map((asgn, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-end transition-all hover:shadow-sm">
                                        <div className="md:col-span-3 space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400">Year</Label>
                                            <Select value={asgn.year} onValueChange={(val) => updateAssignment(idx, 'year', val)}>
                                                <SelectTrigger className="h-9 bg-white text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1st Year">1st Year</SelectItem>
                                                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                                                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                                                    <SelectItem value="4th Year">4th Year</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="md:col-span-2 space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400">Branch</Label>
                                            <Select value={asgn.branch} onValueChange={(val) => updateAssignment(idx, 'branch', val)}>
                                                <SelectTrigger className="h-9 bg-white text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="CSE">CSE</SelectItem>
                                                    <SelectItem value="IT">IT</SelectItem>
                                                    <SelectItem value="CCE">CCE</SelectItem>
                                                    <SelectItem value="ECE">ECE</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="md:col-span-2 space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400">Section</Label>
                                            <Select value={asgn.section} onValueChange={(val) => updateAssignment(idx, 'section', val)}>
                                                <SelectTrigger className="h-9 bg-white text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['A', 'B', 'C', 'D', 'E', 'F'].map(s => (
                                                        <SelectItem key={s} value={s}>Section {s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="md:col-span-4 space-y-1.5">
                                            <Label className="text-[10px] font-bold text-gray-400">Subject</Label>
                                            <Input
                                                value={asgn.subject}
                                                onChange={(e) => updateAssignment(idx, 'subject', e.target.value)}
                                                placeholder="e.g. Data Structures"
                                                className="h-9 bg-white text-xs"
                                            />
                                        </div>

                                        <div className="md:col-span-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeAssignment(idx)}
                                                className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="text-gray-500 font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-[#FF7A00] hover:bg-[#E66E00] text-white min-w-[140px] font-bold shadow-lg shadow-orange-100"
                        >
                            {loading ? 'Propagating...' : 'Save & Publish'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
