import { useState, useEffect } from 'react';
import uniService from '../services/universityService';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { User, Mail, Building2 } from 'lucide-react';

interface EditProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function EditProfileModal({ open, onOpenChange, onSuccess }: EditProfileModalProps) {
    const [loading, setLoading] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [formData, setFormData] = useState({
        departmentId: '',
        programId: '',
        branchId: '',
        sectionId: '',
        academicYearId: '',
        year: user.year ? user.year.toString() : '',
        semester: user.semester ? user.semester.toString() : '',
        // Legacy
        section: user.section || '',
        branch: user.branch || '',
        course: user.course || '',
        department: user.department || ''
    });

    const [departments, setDepartments] = useState<any[]>([]);
    const [programs, setPrograms] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            uniService.getDepartments().then(setDepartments);
            uniService.getAcademicYears().then(setAcademicYears);
        }
    }, [open]);

    useEffect(() => {
        if (formData.departmentId) {
            uniService.getPrograms(parseInt(formData.departmentId)).then(setPrograms);
        } else {
            setPrograms([]);
        }
    }, [formData.departmentId]);

    useEffect(() => {
        if (formData.programId) {
            uniService.getBranches(parseInt(formData.programId)).then(setBranches);
        } else {
            setBranches([]);
        }
    }, [formData.programId]);

    useEffect(() => {
        if (formData.branchId) {
            uniService.getSections(parseInt(formData.branchId)).then(setSections);
        } else {
            setSections([]);
        }
    }, [formData.branchId]);

    // Extract College ID from email
    const getCollegeId = (email: string) => {
        const match = email.match(/\.(\d+)@/);
        return match ? match[1] : '---';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/student/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const data = await res.json();
                const updatedUser = { ...user, ...data.profile };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Dispatch custom event to notify other components
                window.dispatchEvent(new Event('profileUpdated'));

                onSuccess();
                onOpenChange(false);
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none max-h-[90vh] flex flex-col">
                <DialogHeader className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white shrink-0">
                    <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
                    <DialogDescription className="text-orange-50/90 text-sm">
                        Update your academic information. Some fields are controlled by administration.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-5 space-y-5 bg-white overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Permanent Fields - Read Only */}
                        <div className="space-y-3 md:col-span-2">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Account Information (Locked)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-gray-600">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input value={user.name} disabled className="pl-10 bg-gray-50 border-gray-200 text-gray-500 font-medium cursor-not-allowed h-9" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-600">College Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input value={user.email} disabled className="pl-10 bg-gray-50 border-gray-200 text-gray-500 font-medium cursor-not-allowed h-9" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-600">Registration ID</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input value={getCollegeId(user.email)} disabled className="pl-10 bg-gray-50 border-gray-200 text-gray-500 font-medium cursor-not-allowed h-9" />
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Editable Fields */}
                        <div className="space-y-4 md:col-span-2 pt-3 border-t border-gray-100">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Academic Details</h4>

                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Select
                                    value={formData.departmentId}
                                    onValueChange={(val) => {
                                        const d = departments.find(x => x.id === parseInt(val));
                                        setFormData({ ...formData, departmentId: val, department: d?.name || '', programId: '', branchId: '', sectionId: '' });
                                    }}
                                >
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Select Department" /></SelectTrigger>
                                    <SelectContent>
                                        {departments.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Program</Label>
                                <Select
                                    value={formData.programId}
                                    disabled={!formData.departmentId}
                                    onValueChange={(val) => {
                                        const p = programs.find(x => x.id === parseInt(val));
                                        setFormData({ ...formData, programId: val, course: p?.name || '', branchId: '', sectionId: '' });
                                    }}
                                >
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Select Program" /></SelectTrigger>
                                    <SelectContent>
                                        {programs.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Branch</Label>
                                    <Select
                                        value={formData.branchId}
                                        disabled={!formData.programId}
                                        onValueChange={(val) => {
                                            const b = branches.find(x => x.id === parseInt(val));
                                            setFormData({ ...formData, branchId: val, branch: b?.name || '', sectionId: '' });
                                        }}
                                    >
                                        <SelectTrigger className="h-9"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                                        <SelectContent>
                                            {branches.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Section</Label>
                                    <Select
                                        value={formData.sectionId}
                                        disabled={!formData.branchId}
                                        onValueChange={(val) => {
                                            const s = sections.find(x => x.id === parseInt(val));
                                            setFormData({ ...formData, sectionId: val, section: s?.name || '' });
                                        }}
                                    >
                                        <SelectTrigger className="h-9"><SelectValue placeholder="Select Section" /></SelectTrigger>
                                        <SelectContent>
                                            {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Academic Year</Label>
                                    <Select
                                        value={formData.academicYearId}
                                        onValueChange={(val) => setFormData({ ...formData, academicYearId: val })}
                                    >
                                        <SelectTrigger className="h-9"><SelectValue placeholder="Select Year" /></SelectTrigger>
                                        <SelectContent>
                                            {academicYears.map(y => <SelectItem key={y.id} value={y.id.toString()}>{y.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Class Year</Label>
                                    <Select value={formData.year} onValueChange={(val) => setFormData({ ...formData, year: val })}>
                                        <SelectTrigger className="h-9"><SelectValue placeholder="Year" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1st Year</SelectItem>
                                            <SelectItem value="2">2nd Year</SelectItem>
                                            <SelectItem value="3">3rd Year</SelectItem>
                                            <SelectItem value="4">4th Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>


                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white min-w-[120px]">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
