import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { User, Mail, GraduationCap, Building2 } from 'lucide-react';

interface EditProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function EditProfileModal({ open, onOpenChange, onSuccess }: EditProfileModalProps) {
    const [loading, setLoading] = useState(false);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [formData, setFormData] = useState({
        section: user.section || '',
        branch: user.branch || '',
        year: user.year ? user.year.toString() : '',
        course: user.course || '',
        department: user.department || ''
    });

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
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none">
                <DialogHeader className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
                    <DialogDescription className="text-orange-50/90">
                        Update your academic information. Some fields are controlled by administration.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Permanent Fields - Read Only */}
                        <div className="space-y-4 md:col-span-2">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Account Information (Locked)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-600">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input value={user.name} disabled className="pl-10 bg-gray-50 border-gray-200 text-gray-500 font-medium cursor-not-allowed" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-600">College Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input value={user.email} disabled className="pl-10 bg-gray-50 border-gray-200 text-gray-500 font-medium cursor-not-allowed" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-600">Registration ID</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input value={getCollegeId(user.email)} disabled className="pl-10 bg-gray-50 border-gray-200 text-gray-500 font-medium cursor-not-allowed" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Editable Fields */}
                        <div className="space-y-4 md:col-span-2 pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Academic Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="branch">Branch</Label>
                                    <Select value={formData.branch} onValueChange={(value) => setFormData({ ...formData, branch: value })}>
                                        <SelectTrigger className="border-gray-300 focus:ring-orange-500">
                                            <SelectValue placeholder="Select branch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CSE">CSE (Computer Science)</SelectItem>
                                            <SelectItem value="IT">IT (Information Tech)</SelectItem>
                                            <SelectItem value="AIML">AI & Machine Learning</SelectItem>
                                            <SelectItem value="CCE">CCE (Computer & Comm)</SelectItem>
                                            <SelectItem value="ECE">ECE (Electronics)</SelectItem>
                                            <SelectItem value="ME">Mechanical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="year">Current Year</Label>
                                    <Select value={formData.year} onValueChange={(value) => setFormData({ ...formData, year: value })}>
                                        <SelectTrigger className="border-gray-300 focus:ring-orange-500">
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

                                <div className="space-y-2">
                                    <Label htmlFor="section">Section</Label>
                                    <Select value={formData.section} onValueChange={(value) => setFormData({ ...formData, section: value })}>
                                        <SelectTrigger className="border-gray-300 focus:ring-orange-500">
                                            <SelectValue placeholder="Select section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A">Section A</SelectItem>
                                            <SelectItem value="B">Section B</SelectItem>
                                            <SelectItem value="C">Section C</SelectItem>
                                            <SelectItem value="D">Section D</SelectItem>
                                            <SelectItem value="E">Section E</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="course">Course</Label>
                                    <Input
                                        id="course"
                                        value={formData.course}
                                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                        placeholder="e.g. B.Tech"
                                        className="border-gray-300 focus:ring-orange-500"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input
                                        id="department"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="e.g. School of Computer Science"
                                        className="border-gray-300 focus:ring-orange-500"
                                    />
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
