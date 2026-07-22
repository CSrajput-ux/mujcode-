import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, Filter, X, File, Presentation, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

interface ContentItem {
    _id: string;
    title: string;
    description: string;
    type: 'module' | 'ppt' | 'pyq';
    subject: string;
    section: string;
    fileUrl: string;
    fileType: string;
    uploadedBy: string;
    createdAt: string;
}

export default function ContentHub() {
    const [contents, setContents] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter Stats
    const [filterVerify, setFilterVerify] = useState({
        section: 'All',
        subject: 'All',
        type: 'All'
    });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        section: 'A',
        subject: '',
        type: 'module'
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Mock Data for Dropdowns (Replace with API fetch if needed)
    // Dynamic Data
    const [sections, setSections] = useState<string[]>(['A', 'B', 'C', 'D', 'E', 'F']);
    const [sectionSubjects, setSectionSubjects] = useState<Record<string, string[]>>({});
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [availableSubjectsForFilter, setAvailableSubjectsForFilter] = useState<string[]>([]);

    const contentTypes = [
        { value: 'module', label: 'Learning Module', icon: BookOpen },
        { value: 'ppt', label: 'Presentation (PPT)', icon: Presentation },
        { value: 'pyq', label: 'Previous Year Qs', icon: FileText }
    ];

    useEffect(() => {
        fetchContent();
    }, [filterVerify]);

    useEffect(() => {
        const fetchSubjectsMap = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '') + '/api/faculty/subjects-by-section', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSectionSubjects(response.data);
                
                // Set default available sections based on fetched data
                const fetchedSections = Object.keys(response.data);
                if (fetchedSections.length > 0) {
                    setSections(fetchedSections);
                }
            } catch (error) {
                console.error('Error fetching subjects map:', error);
            }
        };
        fetchSubjectsMap();
    }, []);

    // Update subjects dropdown when section changes in upload form
    useEffect(() => {
        if (formData.section && sectionSubjects[formData.section]) {
            setAvailableSubjects(sectionSubjects[formData.section]);
            if (!sectionSubjects[formData.section].includes(formData.subject)) {
                setFormData(prev => ({ ...prev, subject: '' })); // Reset if subject invalid for section
            }
        } else {
            setAvailableSubjects([]);
        }
    }, [formData.section, sectionSubjects]);

    // Update subjects dropdown when section changes in filter
    useEffect(() => {
        if (filterVerify.section !== 'All' && sectionSubjects[filterVerify.section]) {
            setAvailableSubjectsForFilter(sectionSubjects[filterVerify.section]);
        } else {
            // Aggregate all subjects for 'All' sections
            const allSubs = new Set<string>();
            Object.values(sectionSubjects).forEach(subs => subs.forEach(s => allSubs.add(s)));
            setAvailableSubjectsForFilter(Array.from(allSubs));
        }
    }, [filterVerify.section, sectionSubjects]);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/content', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    section: filterVerify.section !== 'All' ? filterVerify.section : undefined,
                    subject: filterVerify.subject !== 'All' ? filterVerify.subject : undefined,
                    type: filterVerify.type !== 'All' ? filterVerify.type : undefined
                }
            });
            setContents(response.data);
        } catch (error) {
            console.error('Error fetching content:', error);
            toast.error('Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error('Please select a file');
            return;
        }
        if (!formData.title || !formData.subject) {
            toast.error('Please fill all required fields');
            return;
        }

        setUploading(true);
        const data = new FormData();
        data.append('file', selectedFile);
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('section', formData.section);
        data.append('subject', formData.subject);
        data.append('type', formData.type);

        try {
            const token = localStorage.getItem('token');
            await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/content/upload', data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success('Content uploaded successfully!');
            fetchContent();
            // Reset form
            setFormData({ ...formData, title: '', description: '', subject: '' });
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload content');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this content?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/content/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Content deleted');
            setContents(contents.filter(c => c._id !== id));
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete content');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'module': return <BookOpen className="w-5 h-5 text-blue-500" />;
            case 'ppt': return <Presentation className="w-5 h-5 text-orange-500" />;
            case 'pyq': return <FileText className="w-5 h-5 text-green-500" />;
            default: return <File className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Content Hub</h1>
                    <p className="text-gray-500 mt-1">Upload and manage academic resources for students</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload Section */}
                <Card className="lg:col-span-1 shadow-md border-orange-100 h-fit">
                    <CardHeader className="bg-orange-50/50 border-b border-orange-100">
                        <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                            <Upload className="w-5 h-5" />
                            Upload New Content
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title *</Label>
                                <Input
                                    placeholder="e.g., Unit 1: Introduction"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Section</Label>
                                <Select
                                    value={formData.section}
                                    onValueChange={(val) => setFormData({ ...formData, section: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sections.map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Subject *</Label>
                                <Select
                                    value={formData.subject}
                                    onValueChange={(val) => setFormData({ ...formData, subject: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSubjects.length > 0 ? (
                                            availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)
                                        ) : (
                                            <SelectItem value="none" disabled>No subjects for this section</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Content Type</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {contentTypes.map((type) => (
                                        <div
                                            key={type.value}
                                            onClick={() => setFormData({ ...formData, type: type.value })}
                                            className={`cursor-pointer border rounded-lg p-2 flex flex-col items-center justify-center gap-1 transition-all ${formData.type === type.value
                                                ? 'bg-orange-50 border-orange-500 text-orange-700'
                                                : 'hover:bg-gray-50 text-gray-600'
                                                }`}
                                        >
                                            <type.icon className="w-4 h-4" />
                                            <span className="text-[10px] font-medium">{type.label.split(' ')[0]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>File Description</Label>
                                <Input
                                    placeholder="Brief description..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Attachment</Label>
                                <div
                                    className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {selectedFile ? (
                                        <div className="flex items-center gap-2 text-sm text-green-600">
                                            <File className="w-4 h-4" />
                                            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                                            <X
                                                className="w-4 h-4 cursor-pointer hover:text-red-500"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFile(null);
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500">Click to upload or drag & drop</p>
                                            <p className="text-xs text-gray-400 mt-1">PDF, PPT, DOC, ZIP (Max 10MB)</p>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-[#FF7A00] hover:bg-orange-600" disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Upload Content'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Content List Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Filters */}
                    <Card className="shadow-sm">
                        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Filter className="w-4 h-4" />
                                Filter By:
                            </div>
                            <Select
                                value={filterVerify.section}
                                onValueChange={(val) => setFilterVerify({ ...filterVerify, section: val })}
                            >
                                <SelectTrigger className="w-[120px] h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Sections</SelectItem>
                                    {sections.map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Select
                                value={filterVerify.type}
                                onValueChange={(val) => setFilterVerify({ ...filterVerify, type: val })}
                            >
                                <SelectTrigger className="w-[120px] h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Types</SelectItem>
                                    {contentTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label.split(' ')[0]}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Content Grid */}
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading content...</div>
                    ) : contents.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No content found</h3>
                            <p className="text-gray-500 text-sm">Upload content to see it here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {contents.map((content) => (
                                <div
                                    key={content._id}
                                    className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${content.type === 'module' ? 'bg-blue-50' : content.type === 'ppt' ? 'bg-orange-50' : 'bg-green-50'
                                            }`}>
                                            {getIcon(content.type)}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">{content.title}</h4>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                <Badge variant="secondary" className="text-[10px] h-5">{content.subject}</Badge>
                                                <span>• Section {content.section}</span>
                                                <span className="hidden sm:inline">• {new Date(content.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDelete(content._id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                        <a
                                            href={`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}${content.fileUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button variant="outline" size="sm" className="text-xs">
                                                Download
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
