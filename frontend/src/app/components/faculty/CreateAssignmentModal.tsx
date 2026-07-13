import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { toast } from 'sonner';

interface CreateAssignmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateAssignmentModal({ open, onOpenChange }: CreateAssignmentModalProps) {
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            onOpenChange(false);
            toast.success("Assignment created successfully!");
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create Assignment / Task</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select defaultValue="assignment">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="assignment">Assignment</SelectItem>
                                    <SelectItem value="casestudy">Case Study</SelectItem>
                                    <SelectItem value="research">Research Paper</SelectItem>
                                    <SelectItem value="other">Other Task</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Subject</Label>
                            <Input placeholder="Subject Name" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label>Year</Label>
                            <Select>
                                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1st</SelectItem>
                                    <SelectItem value="2">2nd</SelectItem>
                                    <SelectItem value="3">3rd</SelectItem>
                                    <SelectItem value="4">4th</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Branch</Label>
                            <Select>
                                <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cse">CSE</SelectItem>
                                    <SelectItem value="it">IT</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Section</Label>
                            <Select>
                                <SelectTrigger><SelectValue placeholder="Sec" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="a">A</SelectItem>
                                    <SelectItem value="b">B</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Title</Label>
                        <Input placeholder="Assignment Title" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Instructions..." />
                    </div>

                    <div className="grid gap-2">
                        <Label>Upload File (PDF/DOC)</Label>
                        <Input type="file" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Due Date</Label>
                        <Input type="date" />
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
