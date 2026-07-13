import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import { toast } from "sonner";
import facultyActivityService from '@/app/services/facultyActivityService';

interface CreateCommunityFormProps {
    onCancel: () => void;
    onSuccess: () => void;
}

const SECTIONS = ['CSE-A', 'CSE-B', 'CSE-C', 'CSE-D', 'IT-A', 'IT-B', 'CCE-A']; // Example sections

const CreateCommunityForm: React.FC<CreateCommunityFormProps> = ({ onCancel, onSuccess }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedSections, setSelectedSections] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSectionToggle = (section: string) => {
        setSelectedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || selectedSections.length === 0) {
            toast.error("Please provide a name and select at least one section.");
            return;
        }

        setLoading(true);
        try {
            await facultyActivityService.createCommunity({
                name,
                description,
                sections: selectedSections
            });
            toast.success("Community created successfully!");
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create community.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create New Community</CardTitle>
                <CardDescription>Create a space for section-wise discussions and announcements.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Community Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Data Structures Discussion"
                            value={name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description of the community..."
                            value={description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Allowed Sections</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                            {SECTIONS.map(section => (
                                <div key={section} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={section}
                                        checked={selectedSections.includes(section)}
                                        onCheckedChange={() => handleSectionToggle(section)}
                                    />
                                    <label htmlFor={section} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {section}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>Cancel</Button>
                    <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                        {loading ? 'Creating...' : 'Create Community'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};

export default CreateCommunityForm;
