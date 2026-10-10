import { useState, useEffect, useRef, useMemo } from 'react';
import { 
    Upload, 
    FileText, 
    Trash2, 
    Filter, 
    X, 
    File, 
    Presentation, 
    BookOpen, 
    Eye, 
    Search, 
    Download, 
    Calendar, 
    Sparkles, 
    RotateCcw,
    FolderOpen,
    FileCheck
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';
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
    fileName?: string;
    uploadedBy: string;
    createdAt: string;
}

export default function ContentHub() {
    const [contents, setContents] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter state
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

    // Dynamic Data
    const [sections, setSections] = useState<string[]>(['A', 'B', 'C', 'D', 'E', 'F']);
    const [sectionSubjects, setSectionSubjects] = useState<Record<string, string[]>>({});
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

    const contentTypes = [
        { 
            value: 'module', 
            label: 'Learning Module', 
            shortLabel: 'Module',
            icon: BookOpen, 
            activeColor: 'bg-blue-50 border-blue-500 text-blue-700',
            badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
        },
        { 
            value: 'ppt', 
            label: 'Presentation (PPT)', 
            shortLabel: 'Presentation',
            icon: Presentation, 
            activeColor: 'bg-orange-50 border-[#FF7A00] text-orange-700',
            badgeColor: 'bg-orange-50 text-orange-700 border-orange-200'
        },
        { 
            value: 'pyq', 
            label: 'Previous Year Qs', 
            shortLabel: 'PYQ Paper',
            icon: FileText, 
            activeColor: 'bg-emerald-50 border-emerald-500 text-emerald-700',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }
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
                setFormData(prev => ({ ...prev, subject: sectionSubjects[formData.section][0] || '' }));
            }
        } else {
            setAvailableSubjects([]);
        }
    }, [formData.section, sectionSubjects]);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '') + '/api/content', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    section: filterVerify.section !== 'All' ? filterVerify.section : undefined,
                    subject: filterVerify.subject !== 'All' ? filterVerify.subject : undefined,
                    type: filterVerify.type !== 'All' ? filterVerify.type : undefined
                }
            });
            setContents(response.data || []);
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

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error('Please select a file to upload');
            return;
        }
        if (!formData.title.trim() || !formData.subject) {
            toast.error('Please fill all required fields (Title & Subject)');
            return;
        }

        setUploading(true);
        const data = new FormData();
        data.append('file', selectedFile);
        data.append('title', formData.title.trim());
        data.append('description', formData.description.trim());
        data.append('section', formData.section);
        data.append('subject', formData.subject);
        data.append('type', formData.type);

        try {
            const token = localStorage.getItem('token');
            await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '') + '/api/content/upload', data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success('Resource uploaded successfully!');
            fetchContent();
            setFormData(prev => ({ ...prev, title: '', description: '' }));
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
        if (!confirm('Are you sure you want to delete this resource?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/content/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Resource deleted successfully');
            setContents(contents.filter(c => c._id !== id));
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete content');
        }
    };

    // Filter contents by search query
    const filteredContents = useMemo(() => {
        if (!searchQuery.trim()) return contents;
        const q = searchQuery.toLowerCase().trim();
        return contents.filter(item => 
            (item.title && item.title.toLowerCase().includes(q)) ||
            (item.subject && item.subject.toLowerCase().includes(q)) ||
            (item.description && item.description.toLowerCase().includes(q)) ||
            (item.section && item.section.toLowerCase().includes(q))
        );
    }, [contents, searchQuery]);

    const stats = useMemo(() => {
        return {
            total: contents.length,
            modules: contents.filter(c => c.type === 'module').length,
            ppts: contents.filter(c => c.type === 'ppt').length,
            pyqs: contents.filter(c => c.type === 'pyq').length
        };
    }, [contents]);

    const isFilterActive = filterVerify.section !== 'All' || filterVerify.type !== 'All' || searchQuery !== '';

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 bg-orange-50 border border-orange-200/80 text-[#FF7A00] text-xs font-bold rounded-md uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
                            Academic Portal
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">Resource Center</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Content Hub</h1>
                    <p className="text-sm text-gray-500 mt-1">Upload and manage academic study materials, presentations, and PYQs for students.</p>
                </div>

                {/* Quick Stats Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
                    <div className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200/80 flex items-center gap-2">
                        <FolderOpen className="w-3.5 h-3.5 text-gray-500" />
                        <div className="text-xs font-semibold text-gray-700">
                            {stats.total} <span className="text-gray-400 font-normal">Total</span>
                        </div>
                    </div>
                    <div className="px-3 py-1.5 bg-blue-50/70 rounded-lg border border-blue-100 flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        <div className="text-xs font-semibold text-blue-700">
                            {stats.modules} <span className="text-blue-500/80 font-normal">Modules</span>
                        </div>
                    </div>
                    <div className="px-3 py-1.5 bg-orange-50/70 rounded-lg border border-orange-100 flex items-center gap-2">
                        <Presentation className="w-3.5 h-3.5 text-[#FF7A00]" />
                        <div className="text-xs font-semibold text-orange-700">
                            {stats.ppts} <span className="text-orange-500/80 font-normal">PPTs</span>
                        </div>
                    </div>
                    <div className="px-3 py-1.5 bg-emerald-50/70 rounded-lg border border-emerald-100 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <div className="text-xs font-semibold text-emerald-700">
                            {stats.pyqs} <span className="text-emerald-500/80 font-normal">PYQs</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Split Content View: Left Form (1/3) + Right List (2/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
                
                {/* ─── LEFT: COMPACT UPLOAD FORM (4 COLS) ───────────────────────── */}
                <Card className="lg:col-span-5 xl:col-span-4 border-orange-100/90 shadow-2xs rounded-xl overflow-hidden bg-white">
                    <CardHeader className="bg-gradient-to-r from-orange-50 via-white to-amber-50/40 border-b border-orange-100/80 py-3 px-4 sm:px-5">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-900">
                                <span className="p-1.5 rounded-lg bg-[#FF7A00] text-white shadow-xs">
                                    <Upload className="w-3.5 h-3.5" />
                                </span>
                                Upload New Resource
                            </CardTitle>
                            <span className="text-[10px] font-medium text-orange-600 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-full">
                                PDF • PPT • DOC
                            </span>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-5">
                        <form onSubmit={handleUpload} className="space-y-3.5">
                            {/* Title Field */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                                    <span>Title <span className="text-red-500">*</span></span>
                                    <span className="text-[10px] text-gray-400 font-normal">e.g. Unit 1: Introduction</span>
                                </Label>
                                <Input
                                    placeholder="Enter resource title..."
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="h-8.5 text-xs bg-gray-50/50 focus:bg-white border-gray-200 focus:border-[#FF7A00]"
                                    required
                                />
                            </div>

                            {/* Section & Subject in 2 columns for compact height */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-700">Section <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.section}
                                        onValueChange={(val) => setFormData({ ...formData, section: val })}
                                    >
                                        <SelectTrigger className="h-8.5 text-xs bg-gray-50/50 border-gray-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections.map(s => <SelectItem key={s} value={s} className="text-xs">Section {s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold text-gray-700">Subject <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.subject}
                                        onValueChange={(val) => setFormData({ ...formData, subject: val })}
                                    >
                                        <SelectTrigger className="h-8.5 text-xs bg-gray-50/50 border-gray-200">
                                            <SelectValue placeholder="Select Subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableSubjects.length > 0 ? (
                                                availableSubjects.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)
                                            ) : (
                                                <SelectItem value="none" disabled className="text-xs">No subjects found</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Content Type Selector */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-700">Content Type</Label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {contentTypes.map((type) => {
                                        const isSelected = formData.type === type.value;
                                        const IconComp = type.icon;
                                        return (
                                            <button
                                                type="button"
                                                key={type.value}
                                                onClick={() => setFormData({ ...formData, type: type.value })}
                                                className={`py-1.5 px-2 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                                                    isSelected
                                                        ? `${type.activeColor} shadow-2xs font-semibold`
                                                        : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100/70 text-gray-600 font-medium'
                                                }`}
                                            >
                                                <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'scale-110' : 'text-gray-400'}`} />
                                                <span className="text-[11px] leading-tight truncate w-full">{type.shortLabel}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Description Field */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                                    <span>Description</span>
                                    <span className="text-[10px] text-gray-400 font-normal">Optional</span>
                                </Label>
                                <Input
                                    placeholder="Brief notes or summary..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="h-8.5 text-xs bg-gray-50/50 focus:bg-white border-gray-200 focus:border-[#FF7A00]"
                                />
                            </div>

                            {/* Compact Attachment Dropzone */}
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-gray-700">Attachment <span className="text-red-500">*</span></Label>
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                                        selectedFile
                                            ? 'bg-green-50/60 border-green-300'
                                            : isDragging
                                                ? 'bg-orange-50 border-orange-400'
                                                : 'bg-gray-50/50 border-gray-200 hover:border-orange-300 hover:bg-orange-50/30'
                                    }`}
                                >
                                    {selectedFile ? (
                                        <div className="flex items-center justify-between gap-2 text-xs text-green-700 px-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                                                <span className="truncate font-medium text-xs">{selectedFile.name}</span>
                                                <span className="text-[10px] text-gray-500 flex-shrink-0">
                                                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFile(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                                className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                                                title="Remove file"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-1">
                                            <Upload className="w-5 h-5 text-orange-500 mb-1" />
                                            <p className="text-xs font-semibold text-gray-700">Click to upload or drag file here</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">PDF, PPTX, DOC, ZIP (Max 10MB)</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button 
                                type="submit" 
                                className="w-full h-9 bg-gradient-to-r from-[#FF7A00] to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-xs shadow-xs gap-1.5 transition-all mt-1" 
                                disabled={uploading}
                            >
                                <Upload className="w-3.5 h-3.5" />
                                {uploading ? 'Uploading Resource...' : 'Upload Resource'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* ─── RIGHT: SEARCH, FILTERS & RESOURCE CARDS (8 COLS) ───────── */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-3.5">
                    
                    {/* Unified Filter & Search Bar */}
                    <Card className="border-gray-200/80 shadow-2xs rounded-xl bg-white">
                        <CardContent className="p-3 sm:p-3.5 flex flex-wrap items-center gap-2.5">
                            {/* Search Box */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search resources by title, subject..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8.5 h-8.5 text-xs bg-gray-50/60 focus:bg-white border-gray-200 focus:border-[#FF7A00]"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {/* Section Filter */}
                            <div className="flex items-center gap-1.5">
                                <Select
                                    value={filterVerify.section}
                                    onValueChange={(val) => setFilterVerify({ ...filterVerify, section: val })}
                                >
                                    <SelectTrigger className="w-[115px] h-8.5 text-xs bg-gray-50/60 border-gray-200">
                                        <SelectValue placeholder="Section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All" className="text-xs">All Sections</SelectItem>
                                        {sections.map(s => <SelectItem key={s} value={s} className="text-xs">Section {s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Content Type Filter */}
                            <div className="flex items-center gap-1.5">
                                <Select
                                    value={filterVerify.type}
                                    onValueChange={(val) => setFilterVerify({ ...filterVerify, type: val })}
                                >
                                    <SelectTrigger className="w-[115px] h-8.5 text-xs bg-gray-50/60 border-gray-200">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All" className="text-xs">All Types</SelectItem>
                                        {contentTypes.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.shortLabel}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Reset Filter Button */}
                            {isFilterActive && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setFilterVerify({ section: 'All', subject: 'All', type: 'All' });
                                        setSearchQuery('');
                                    }}
                                    className="h-8.5 text-xs px-2.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 gap-1"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Reset
                                </Button>
                            )}

                            {/* Results Count Badge */}
                            <div className="ml-auto text-[11px] text-gray-400 font-medium whitespace-nowrap">
                                {filteredContents.length} {filteredContents.length === 1 ? 'item' : 'items'}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resources List */}
                    {loading ? (
                        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                            <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2" />
                            <div className="text-xs text-gray-500">Loading academic resources...</div>
                        </div>
                    ) : filteredContents.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200/90 p-6">
                            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-orange-100">
                                <FileText className="w-6 h-6 text-orange-400" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900">No resources found</h3>
                            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                                {isFilterActive 
                                    ? "No content matches the selected filter criteria. Try resetting filters." 
                                    : "No academic content uploaded yet. Use the upload form on the left to add your first resource."}
                            </p>
                            {isFilterActive && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setFilterVerify({ section: 'All', subject: 'All', type: 'All' });
                                        setSearchQuery('');
                                    }}
                                    className="mt-3 text-xs border-orange-200 text-orange-600 hover:bg-orange-50"
                                >
                                    Reset Filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {filteredContents.map((content) => {
                                const typeMeta = contentTypes.find(t => t.value === content.type) || contentTypes[0];
                                const IconComp = typeMeta.icon;

                                return (
                                    <div
                                        key={content._id}
                                        className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200/70 shadow-2xs hover:shadow-sm hover:border-orange-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                                    >
                                        {/* Left Side: Type Icon & Info */}
                                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                                                content.type === 'module' 
                                                    ? 'bg-blue-50 border-blue-100 text-blue-600' 
                                                    : content.type === 'ppt' 
                                                        ? 'bg-orange-50 border-orange-100 text-[#FF7A00]' 
                                                        : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                            }`}>
                                                <IconComp className="w-5 h-5" />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-orange-600 transition-colors truncate">
                                                        {content.title}
                                                    </h4>
                                                    <Badge className={`${typeMeta.badgeColor} text-[10px] font-semibold px-2 py-0.2 rounded-md`}>
                                                        {typeMeta.shortLabel}
                                                    </Badge>
                                                </div>

                                                {/* Meta Info Row */}
                                                <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1 flex-wrap">
                                                    <span className="font-medium text-gray-700 bg-gray-100/90 px-2 py-0.5 rounded text-[10px]">
                                                        {content.subject}
                                                    </span>
                                                    <span className="text-gray-400">•</span>
                                                    <span className="font-medium text-gray-600">
                                                        Section {content.section}
                                                    </span>
                                                    <span className="text-gray-400">•</span>
                                                    <span className="flex items-center gap-1 text-gray-400">
                                                        <Calendar className="w-3 h-3 text-gray-400" />
                                                        {new Date(content.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                {/* Optional Description */}
                                                {content.description && (
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                        {content.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Side: Action Buttons */}
                                        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 pt-1 sm:pt-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs font-semibold gap-1.5 text-[#FF7A00] border-orange-200 hover:bg-orange-50 hover:border-orange-400 rounded-lg transition-colors"
                                                onClick={() => setPreviewItem(content)}
                                            >
                                                <Eye className="w-3.5 h-3.5 text-[#FF7A00]" />
                                                View
                                            </Button>
                                            
                                            <a
                                                href={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/content/download/${content._id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                            >
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-8 text-xs font-semibold gap-1.5 text-gray-700 border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                                                >
                                                    <Download className="w-3.5 h-3.5 text-gray-500" />
                                                    Download
                                                </Button>
                                            </a>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                onClick={() => handleDelete(content._id)}
                                                title="Delete resource"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Document Preview Modal */}
            {previewItem && (
                <DocumentPreviewModal
                    open={!!previewItem}
                    onOpenChange={(open) => !open && setPreviewItem(null)}
                    title={previewItem.title}
                    fileUrl={previewItem.fileUrl}
                    fileType={previewItem.fileType}
                    fileName={previewItem.fileName}
                    contentId={previewItem._id}
                    description={previewItem.description}
                />
            )}
        </div>
    );
}
