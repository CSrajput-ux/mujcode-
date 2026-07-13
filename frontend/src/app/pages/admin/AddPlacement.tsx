import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Briefcase,
    Calendar,
    Building2,
    IndianRupee,
    MapPin,
    Target
} from 'lucide-react';
import placementService from '../../services/placementService';
import uniService from '../../services/universityService';
import { toast } from 'sonner';

interface JobForm {
    role: string;
    ctc: string;
    locations: string;
    eligibilityCriteria: string;
}

export default function AddPlacement() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        companyId: '',
        academicYearId: '',
        driveDate: '',
        description: '',
        jobs: [
            { role: '', ctc: '', locations: '', eligibilityCriteria: '' }
        ] as JobForm[]
    });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [comps, years] = await Promise.all([
                    placementService.getCompanies(),
                    uniService.getAcademicYears()
                ]);
                setCompanies(comps);
                setAcademicYears(years);
            } catch (error) {
                console.error("Error loading form data:", error);
                toast.error("Failed to load companies or academic years");
            }
        };
        loadInitialData();
    }, []);

    const handleAddJob = () => {
        setFormData({
            ...formData,
            jobs: [...formData.jobs, { role: '', ctc: '', locations: '', eligibilityCriteria: '' }]
        });
    };

    const handleRemoveJob = (index: number) => {
        const newJobs = formData.jobs.filter((_, i) => i !== index);
        setFormData({ ...formData, jobs: newJobs });
    };

    const handleJobChange = (index: number, field: keyof JobForm, value: string) => {
        const newJobs = [...formData.jobs];
        newJobs[index] = { ...newJobs[index], [field]: value };
        setFormData({ ...formData, jobs: newJobs });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Transform criteria string to JSON if needed, or just send as is
            const submissionData = {
                ...formData,
                companyId: parseInt(formData.companyId),
                academicYearId: parseInt(formData.academicYearId),
                jobs: formData.jobs.map(j => ({
                    ...j,
                    eligibilityCriteria: { description: j.eligibilityCriteria }
                }))
            };

            await placementService.createPlacementDrive(submissionData);
            toast.success("Placement Drive created successfully");
            navigate('/admin/placements');
        } catch (error: any) {
            console.error("Create Drive Error:", error);
            toast.error(error.response?.data?.message || "Failed to create drive");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/admin/placements')}
                            className="text-gray-500 hover:text-orange-600 -ml-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Placements
                        </Button>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
                            <Briefcase className="w-8 h-8 mr-3 text-orange-600" />
                            Schedule New Drive
                        </h1>
                        <p className="text-gray-500 font-medium">Coordinate a campus recruitment opportunity for current students.</p>
                    </div>
                    <Button
                        form="drive-form"
                        type="submit"
                        disabled={loading}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 rounded-xl shadow-lg shadow-orange-600/20"
                    >
                        {loading ? 'Creating...' : 'Launch Drive'}
                    </Button>
                </div>

                <form id="drive-form" onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info Card */}
                    <Card className="rounded-3xl border-none shadow-sm ring-1 ring-gray-100 overflow-hidden bg-white">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                            <CardTitle className="text-lg font-bold flex items-center">
                                <Building2 className="w-5 h-5 mr-2 text-orange-500" />
                                Drive Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-gray-700 font-semibold">Drive Title</Label>
                                <Input
                                    placeholder="e.g. Microsoft 2026 Campus Recruitment"
                                    className="h-12 rounded-xl bg-gray-50/50 border-none focus:ring-2 focus:ring-orange-500/20"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-700 font-semibold text-sm">Select Company</Label>
                                <Select
                                    value={formData.companyId}
                                    onValueChange={(v) => setFormData({ ...formData, companyId: v })}
                                    required
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-gray-50/50 border-none shadow-none focus:ring-2 focus:ring-orange-500/20">
                                        <SelectValue placeholder="Select Company" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-700 font-semibold text-sm">Academic Year</Label>
                                <Select
                                    value={formData.academicYearId}
                                    onValueChange={(v) => setFormData({ ...formData, academicYearId: v })}
                                    required
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-gray-50/50 border-none shadow-none focus:ring-2 focus:ring-orange-500/20">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                        {academicYears.map(y => (
                                            <SelectItem key={y.id} value={y.id.toString()}>{y.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-700 font-semibold text-sm">Drive Date</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                    <Input
                                        type="date"
                                        className="h-12 rounded-xl bg-gray-50/50 border-none pl-10 focus:ring-2 focus:ring-orange-500/20"
                                        required
                                        value={formData.driveDate}
                                        onChange={(e) => setFormData({ ...formData, driveDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-gray-700 font-semibold text-sm">Drive Description</Label>
                                <Textarea
                                    placeholder="Brief overview of the drive process and requirements..."
                                    className="min-h-[120px] rounded-2xl bg-gray-50/50 border-none focus:ring-2 focus:ring-orange-500/20"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Jobs Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-black text-gray-900 flex items-center">
                                <Target className="w-5 h-5 mr-2 text-orange-500" />
                                Job Roles & Offerings
                            </h2>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddJob}
                                className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 font-bold"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Another Role
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {formData.jobs.map((job, index) => (
                                <Card key={index} className="rounded-3xl border-none shadow-sm ring-1 ring-gray-100 bg-white relative overflow-visible">
                                    {index > 0 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-white shadow-md text-red-500 hover:text-red-700 hover:bg-red-50 ring-1 ring-gray-100"
                                            onClick={() => handleRemoveJob(index)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-gray-700 font-semibold text-sm">Role Title</Label>
                                            <Input
                                                placeholder="e.g. Associate SDE"
                                                className="h-11 rounded-xl bg-gray-50/50 border-none focus:ring-2 focus:ring-orange-500/20"
                                                required
                                                value={job.role}
                                                onChange={(e) => handleJobChange(index, 'role', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-700 font-semibold text-sm">Salary (CTC)</Label>
                                            <div className="relative">
                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                                <Input
                                                    placeholder="e.g. 15 LPA"
                                                    className="h-11 rounded-xl bg-gray-50/50 border-none pl-10 focus:ring-2 focus:ring-orange-500/20"
                                                    value={job.ctc}
                                                    onChange={(e) => handleJobChange(index, 'ctc', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-gray-700 font-semibold text-sm">Locations</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                                <Input
                                                    placeholder="e.g. Bangalore, Remote"
                                                    className="h-11 rounded-xl bg-gray-50/50 border-none pl-10 focus:ring-2 focus:ring-orange-500/20"
                                                    value={job.locations}
                                                    onChange={(e) => handleJobChange(index, 'locations', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-3">
                                            <Label className="text-gray-700 font-semibold text-sm">Eligibility Criteria</Label>
                                            <Input
                                                placeholder="e.g. CS/IT/EC students with 7.5+ CGPA and no active backlogs"
                                                className="h-11 rounded-xl bg-gray-50/50 border-none focus:ring-2 focus:ring-orange-500/20"
                                                value={job.eligibilityCriteria}
                                                onChange={(e) => handleJobChange(index, 'eligibilityCriteria', e.target.value)}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
