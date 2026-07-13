import { useState } from 'react';
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
import { User, Mail, Shield, Briefcase, Building } from 'lucide-react';

interface FacultyProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function FacultyProfileModal({ open, onOpenChange, onSuccess }: FacultyProfileModalProps) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [loading, setLoading] = useState(false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-8 bg-gradient-to-br from-purple-600 to-indigo-700 text-white relative">
                    <div className="absolute right-0 top-0 p-8 opacity-10">
                        <Shield className="w-24 h-24" />
                    </div>
                    <DialogTitle className="text-2xl font-bold mb-2">Faculty Profile</DialogTitle>
                    <DialogDescription className="text-purple-100/90">
                        View your institutional profile details and account settings.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 space-y-8 bg-white">
                    <div className="flex justify-center -mt-16 relative z-10">
                        <div className="w-24 h-24 bg-white rounded-full p-1 shadow-xl">
                            <div className="w-full h-full bg-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'FM'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</Label>
                                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <User className="w-4 h-4 text-purple-500" />
                                        <span className="font-medium text-gray-900">{user.name}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Designation</Label>
                                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <Briefcase className="w-4 h-4 text-purple-500" />
                                        <span className="font-medium text-gray-900">{user.designation || 'Senior Faculty'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">College Email</Label>
                                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <Mail className="w-4 h-4 text-purple-500" />
                                    <span className="font-medium text-gray-900">{user.email}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Department</Label>
                                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <Building className="w-4 h-4 text-purple-500" />
                                        <span className="font-medium text-gray-900">{user.department || 'CSE'}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Role</Label>
                                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                                        <Shield className="w-4 h-4 text-purple-600" />
                                        <span className="font-bold text-purple-700 uppercase text-xs">{user.role}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="w-full text-gray-500 font-semibold"
                        >
                            Close Profile
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
