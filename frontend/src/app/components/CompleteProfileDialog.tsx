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
import { Label } from './ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface CompleteProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function CompleteProfileDialog({ open, onOpenChange, onSuccess }: CompleteProfileDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        departmentId: '',
        programId: '',
        branchId: '',
        sectionId: '',
        academicYearId: '',
        year: '',
        // Legacy fields
        section: '',
        branch: '',
        department: '',
        course: ''
    });

    const [departments, setDepartments] = useState<any[]>([]);
    const [programs, setPrograms] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);

    // Fetch initial data
    useEffect(() => {
        if (open) {
            const loadInitialData = async () => {
                try {
                    const depts = await uniService.getDepartments();
                    setDepartments(depts);

                    const years = await uniService.getAcademicYears();
                    setAcademicYears(years);

                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    const userId = user.id;

                    if (!userId) return;

                    const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/student/profile/${userId}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.profile) {
                            setFormData(prev => ({
                                ...prev,
                                section: data.profile.section || '',
                                branch: data.profile.branch || '',
                                year: data.profile.year ? data.profile.year.toString() : '',
                                course: data.profile.course || '',
                                department: data.profile.department || ''
                            }));
                        }
                    }
                } catch (error) {
                    console.error('Error loading initial data:', error);
                }
            };
            loadInitialData();
        }
    }, [open]);

    // Dependent Fetches
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


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const userId = user.id;

            const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/student/profile/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                // Update local storage with new profile data
                const updatedUser = { ...user, ...formData };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                onSuccess();
                onOpenChange(false);
            } else {
                alert('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Complete Your Profile</DialogTitle>
                    <DialogDescription>
                        Please provide your academic details to complete your profile.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                        {/* Department */}
                        <div className="grid gap-2">
                            <Label htmlFor="departmentId">Department</Label>
                            <Select
                                value={formData.departmentId}
                                onValueChange={(value) => {
                                    const dept = departments.find(d => d.id === parseInt(value));
                                    setFormData({
                                        ...formData,
                                        departmentId: value,
                                        department: dept ? dept.name : '',
                                        programId: '',
                                        branchId: '',
                                        sectionId: ''
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map(d => (
                                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Program */}
                        <div className="grid gap-2">
                            <Label htmlFor="programId">Program</Label>
                            <Select
                                value={formData.programId}
                                disabled={!formData.departmentId}
                                onValueChange={(value) => {
                                    const prog = programs.find(p => p.id === parseInt(value));
                                    setFormData({
                                        ...formData,
                                        programId: value,
                                        course: prog ? prog.name : '',
                                        branchId: '',
                                        sectionId: ''
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select program" />
                                </SelectTrigger>
                                <SelectContent>
                                    {programs.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Branch */}
                        <div className="grid gap-2">
                            <Label htmlFor="branchId">Branch</Label>
                            <Select
                                value={formData.branchId}
                                disabled={!formData.programId}
                                onValueChange={(value) => {
                                    const b = branches.find(br => br.id === parseInt(value));
                                    setFormData({
                                        ...formData,
                                        branchId: value,
                                        branch: b ? b.name : '',
                                        sectionId: ''
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Section */}
                        <div className="grid gap-2">
                            <Label htmlFor="sectionId">Section</Label>
                            <Select
                                value={formData.sectionId}
                                disabled={!formData.branchId}
                                onValueChange={(value) => {
                                    const s = sections.find(sec => sec.id === parseInt(value));
                                    setFormData({
                                        ...formData,
                                        sectionId: value,
                                        section: s ? s.name : ''
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select section" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections.map(s => (
                                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Academic Year */}
                        <div className="grid gap-2">
                            <Label htmlFor="academicYearId">Academic Year</Label>
                            <Select value={formData.academicYearId} onValueChange={(value) => setFormData({ ...formData, academicYearId: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select academic year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {academicYears.map(y => (
                                        <SelectItem key={y.id} value={y.id.toString()}>{y.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Current Year Selection (Internal to UI) */}
                        <div className="grid gap-2">
                            <Label htmlFor="year">Class Year</Label>
                            <Select value={formData.year} onValueChange={(value) => setFormData({ ...formData, year: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1st Year</SelectItem>
                                    <SelectItem value="2">2nd Year</SelectItem>
                                    <SelectItem value="3">3rd Year</SelectItem>
                                    <SelectItem value="4">4th Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="mt-4">

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-[#FF7A00] hover:bg-[#E66D00]">
                            {loading ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
