import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { createStudent } from '../../services/adminService';
import uniService from '../../services/universityService';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus } from 'lucide-react';

export default function AddStudent() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        rollNumber: '',
        password: '',
        departmentId: '',
        programId: '',
        branchId: '',
        sectionId: '',
        academicYearId: '',
        year: '' // Display year (1-4)
    });

    // Dynamic Lists
    const [departments, setDepartments] = useState<any[]>([]);
    const [programs, setPrograms] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([{ id: 1, name: '2025-2026' }]); // Mock for now or fetch if API exists

    // Load Departments on mount
    useEffect(() => {
        const loadDepts = async () => {
            try {
                const data = await uniService.getDepartments();
                setDepartments(data);
            } catch (err) {
                console.error("Failed to load departments", err);
            }
        };
        loadDepts();
    }, []);

    // Load Programs when Department changes
    useEffect(() => {
        if (formData.departmentId) {
            const loadProgs = async () => {
                try {
                    const data = await uniService.getPrograms(parseInt(formData.departmentId));
                    setPrograms(data);
                    setFormData(prev => ({ ...prev, programId: '', branchId: '', sectionId: '' }));
                } catch (err) { console.error(err); }
            };
            loadProgs();
        } else {
            setPrograms([]);
        }
    }, [formData.departmentId]);

    // Load Branches when Program changes
    useEffect(() => {
        if (formData.programId) {
            const loadBranches = async () => {
                try {
                    const data = await uniService.getBranches(parseInt(formData.programId));
                    setBranches(data);
                    setFormData(prev => ({ ...prev, branchId: '', sectionId: '' }));
                } catch (err) { console.error(err); }
            };
            loadBranches();
        } else {
            setBranches([]);
        }
    }, [formData.programId]);

    // Load Sections when Branch changes
    useEffect(() => {
        if (formData.branchId) {
            const loadSections = async () => {
                try {
                    const data = await uniService.getSections ? await uniService.getSections(parseInt(formData.branchId)) : [];
                    // Fallback if uniService doesn't have getSections yet
                    // I will add getSections to uniService.
                    setSections(data);
                } catch (err) { console.error(err); }
            };
            loadSections();
        } else {
            setSections([]);
        }
    }, [formData.branchId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.email || !formData.rollNumber || !formData.password || !formData.branchId) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            setLoading(true);
            await createStudent(formData);
            toast.success('Student created successfully');
            navigate('/admin/students');
        } catch (error: any) {
            console.error('Error creating student:', error);
            toast.error(error.response?.data?.error || 'Failed to create student');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/admin/students')}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Students
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5" />
                            Add New Student (Relational)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Basic Info */}
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                        <Input name="name" value={formData.name} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                        <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number *</label>
                                        <Input name="rollNumber" value={formData.rollNumber} onChange={handleChange} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                        <Input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} />
                                    </div>
                                </div>

                                {/* Department */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <select name="departmentId" value={formData.departmentId} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
                                        <option value="">Select Department</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>

                                {/* Program */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                                    <select name="programId" value={formData.programId} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" disabled={!formData.departmentId}>
                                        <option value="">Select Program</option>
                                        {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                {/* Branch */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
                                    <select name="branchId" value={formData.branchId} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" disabled={!formData.programId} required>
                                        <option value="">Select Branch</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>

                                {/* Section */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                    <select name="sectionId" value={formData.sectionId} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" disabled={!formData.branchId}>
                                        <option value="">Select Section</option>
                                        {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                                    </select>
                                </div>

                                {/* Year */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Year</label>
                                    <select name="year" value={formData.year} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
                                        <option value="">Select Year</option>
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                    </select>
                                </div>

                                {/* Academic Year */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                                    <select name="academicYearId" value={formData.academicYearId} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
                                        <option value="">Default (Current)</option>
                                        {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={loading} className="flex-1">
                                    {loading ? 'Creating...' : 'Create Student'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => navigate('/admin/students')} className="flex-1">
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

