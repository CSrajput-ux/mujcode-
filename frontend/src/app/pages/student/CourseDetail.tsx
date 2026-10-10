import StudentLayout from '../../components/StudentLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
    Code2, 
    Database, 
    Globe, 
    Target, 
    ArrowLeft, 
    CheckCircle2, 
    Circle, 
    FileText, 
    BookOpen, 
    Presentation, 
    Download, 
    Eye,
    Layers,
    Search,
    Sparkles,
    Check
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import apiClient from '../../services/apiClient';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';

interface Problem {
    _id: string;
    number: number;
    title: string;
    difficulty: string;
    category: string;
    points: number;
    solved: boolean;
    moduleNumber?: number;
    moduleTitle?: string;
    moduleTopic?: string;
    topics?: string;
}

interface CourseModule {
    moduleNumber: number;
    title: string;
    level?: string;
    topics?: string;
    problemCount: number;
    problemIds?: string[];
}

interface Course {
    _id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    totalProblems: number;
    icon: string;
    modules?: CourseModule[];
}

interface ContentItem {
    _id: string;
    title: string;
    description: string;
    type: 'module' | 'ppt' | 'pyq';
    fileUrl: string;
    fileType: string;
    fileName?: string;
    uploadedBy: string;
    createdAt: string;
}

export default function CourseDetail() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [courseContent, setCourseContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [solvedCount, setSolvedCount] = useState(0);
    const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
    const [activeTab, setActiveTab] = useState<string>(
        new URLSearchParams(window.location.search).get('tab') || 'modules'
    );
    const [selectedModule, setSelectedModule] = useState<number | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCourseDetails();
    }, [courseId]);

    const fetchCourseDetails = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const studentId = user.college_id || user.id || '';

            const res = await apiClient.get(`/api/student/course/${courseId}/details?studentId=${studentId}`);
            const data = res.data;

            if (data && data.course) {
                setCourse(data.course);
                setProblems(data.problems || []);
                setSolvedCount(data.solvedCount || 0);

                // Fetch associated content using the course title as subject
                const subjectName = data.course?.title || data.course?.courseName || decodeURIComponent(courseId || '');
                if (subjectName) {
                    fetchContent(subjectName);
                }
            } else {
                console.error('API error:', data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching course details:', error);
            setLoading(false);
        }
    };

    const fetchContent = async (subject: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '') + '/api/content', {
                headers: { Authorization: `Bearer ${token}` },
                params: { subject }
            });
            setCourseContent(response.data);
        } catch (error) {
            console.error('Error fetching course content:', error);
        }
    };

    const getIcon = (iconName: string) => {
        const iconClass = "w-6 h-6 text-[#FF7A00]";
        switch (iconName) {
            case 'database': return <Database className={iconClass} />;
            case 'globe': return <Globe className={iconClass} />;
            case 'target': return <Target className={iconClass} />;
            default: return <Code2 className={iconClass} />;
        }
    };

    const difficultyColors: Record<string, string> = {
        Easy: 'bg-green-100 text-green-700 border-green-300',
        Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        Hard: 'bg-red-100 text-red-700 border-red-300'
    };

    const handleProblemClick = (problem: Problem) => {
        navigate(`/student/problems/${problem._id}`);
    };

    const handleSelectModuleForPractice = (moduleNum: number) => {
        setSelectedModule(moduleNum);
        setActiveTab('problems');
        window.scrollTo({ top: 380, behavior: 'smooth' });
    };

    const renderContentList = (type: 'module' | 'ppt' | 'pyq', emptyMsg: string) => {
        const filtered = courseContent.filter(c => c.type === type);

        if (filtered.length === 0) {
            return (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-200">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-gray-500 text-sm">{emptyMsg}</p>
                </div>
            );
        }

        return (
            <div className="grid gap-3">
                {filtered.map((item) => (
                    <div key={item._id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type === 'module' ? 'bg-blue-50 text-blue-500' :
                                type === 'ppt' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'
                                }`}>
                                {type === 'module' ? <BookOpen className="w-5 h-5" /> :
                                    type === 'ppt' ? <Presentation className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">{item.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{item.description || 'No description'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-[#FF7A00] border-[#FF7A00]/40 hover:bg-[#FF7A00]/10 hover:text-[#FF7A00] hover:border-[#FF7A00]"
                                onClick={() => setPreviewItem(item)}
                            >
                                <Eye className="w-4 h-4" /> View
                            </Button>
                            <a
                                href={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/content/download/${item._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                            >
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    <Download className="w-4 h-4" /> Download
                                </Button>
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-500">Loading course details...</div>
                </div>
            </StudentLayout>
        );
    }

    if (!course) {
        return (
            <StudentLayout>
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="text-lg text-gray-500">Course not found</div>
                    <Button onClick={() => navigate('/student/courses')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
                    </Button>
                </div>
            </StudentLayout>
        );
    }

    const progress = problems.length > 0 ? Math.round((solvedCount / problems.length) * 100) : 0;
    const hasModules = (course.modules && course.modules.length > 0) || problems.some(p => p.moduleNumber);

    // Group problems by module number
    const moduleMap: Record<number, Problem[]> = {};
    problems.forEach(p => {
        const modNum = p.moduleNumber || 1;
        if (!moduleMap[modNum]) moduleMap[modNum] = [];
        moduleMap[modNum].push(p);
    });

    // Filter problems by search query and selected module
    const filteredProblems = problems.filter(p => {
        const matchModule = selectedModule === 'all' || p.moduleNumber === selectedModule;
        const matchSearch = !searchQuery || 
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            String(p.number).includes(searchQuery) ||
            (p.topics && p.topics.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchModule && matchSearch;
    });

    // Group filtered problems for rendering
    const displayedModuleNums = selectedModule === 'all' 
        ? Object.keys(moduleMap).map(Number).sort((a, b) => a - b)
        : [selectedModule];

    return (
        <StudentLayout>
            <div className="space-y-6">
                {/* Back Button */}
                <Button
                    variant="outline"
                    onClick={() => navigate('/student/courses')}
                    className="mb-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
                </Button>

                {/* Course Header Banner */}
                <Card className="border-orange-200 bg-gradient-to-r from-orange-50 via-white to-amber-50 shadow-xs">
                    <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                            <div className="p-3 bg-white border border-orange-100 rounded-xl shadow-xs flex-shrink-0">
                                {getIcon(course.icon)}
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2.5 mb-2">
                                    <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                                    <Badge variant="outline" className="text-xs">{course.category}</Badge>
                                    <Badge className={`${difficultyColors[course.difficulty] || 'bg-gray-100 text-gray-700'} text-xs`}>
                                        {course.difficulty}
                                    </Badge>
                                    {hasModules && (
                                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                                            {course.modules?.length || Object.keys(moduleMap).length} Modules
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mb-4 max-w-3xl leading-relaxed">{course.description}</p>

                                {/* Progress Bar & Stats */}
                                <div className="max-w-md bg-white/80 p-3 rounded-lg border border-orange-100/70">
                                    <div className="flex items-center justify-between mb-1.5 text-xs">
                                        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
                                            Course Completion
                                        </span>
                                        <span className="font-bold text-[#FF7A00]">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-[#FF7A00] h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="text-[11px] text-gray-500 mt-1 flex justify-between">
                                        <span>{solvedCount} / {problems.length} problems solved</span>
                                        <span>{problems.length - solvedCount} remaining</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100/80 p-1 rounded-xl">
                        <TabsTrigger value="modules" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-xs">
                            <BookOpen className="w-4 h-4 text-[#FF7A00]" />
                            <span className="font-semibold">Curriculum Modules</span>
                        </TabsTrigger>
                        <TabsTrigger value="problems" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-xs">
                            <Code2 className="w-4 h-4 text-[#FF7A00]" />
                            <span className="font-semibold">Practice Problems</span>
                        </TabsTrigger>
                        <TabsTrigger value="ppts" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-xs">
                            <Presentation className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold">PPTs & Notes</span>
                        </TabsTrigger>
                        <TabsTrigger value="pyqs" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-xs">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold">PYQs</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* ─── TAB 1: CURRICULUM MODULES (15 MODULES) ───────────────── */}
                    <TabsContent value="modules" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Course Curriculum & Modules</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Structured zero-to-advanced pathway across {course.modules?.length || 15} comprehensive modules.
                                </p>
                            </div>
                            <Button 
                                className="bg-[#FF7A00] hover:bg-[#FF6A00] text-xs font-semibold gap-1.5"
                                onClick={() => setActiveTab('problems')}
                            >
                                <Code2 className="w-4 h-4" /> View All Problems
                            </Button>
                        </div>

                        {/* Interactive Modules Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(course.modules && course.modules.length > 0 ? course.modules : Array.from({ length: 15 }, (_, i) => ({
                                moduleNumber: i + 1,
                                title: `Module ${i + 1}`,
                                level: i < 5 ? 'Beginner' : i < 10 ? 'Intermediate' : 'Advanced',
                                topics: '',
                                problemCount: 10
                            }))).map((mod) => {
                                const modProblems = moduleMap[mod.moduleNumber] || [];
                                const modSolved = modProblems.filter(p => p.solved).length;
                                const modTotal = modProblems.length || mod.problemCount || 10;
                                const modPct = modTotal > 0 ? Math.round((modSolved / modTotal) * 100) : 0;
                                const isCompleted = modSolved > 0 && modSolved === modTotal;

                                return (
                                    <div 
                                        key={mod.moduleNumber} 
                                        className="bg-white rounded-xl border border-gray-100 shadow-xs hover:shadow-md hover:border-orange-200 transition-all p-5 flex flex-col justify-between group"
                                    >
                                        <div>
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="px-2.5 py-1 bg-orange-50 text-[#FF7A00] border border-orange-200/70 text-xs font-bold rounded-lg flex items-center gap-1.5">
                                                    <Layers className="w-3.5 h-3.5" />
                                                    Module {String(mod.moduleNumber).padStart(2, '0')}
                                                </span>
                                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                                    mod.level === 'Advanced' ? 'bg-red-50 text-red-600 border border-red-200' :
                                                    mod.level === 'Intermediate' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                    'bg-green-50 text-green-700 border border-green-200'
                                                }`}>
                                                    {mod.level || 'Beginner'}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-[#FF7A00] transition-colors leading-snug">
                                                {mod.title}
                                            </h3>

                                            {/* Topics */}
                                            {mod.topics && (
                                                <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                                                    {mod.topics}
                                                </p>
                                            )}
                                        </div>

                                        {/* Bottom Progress & Practice Button */}
                                        <div className="pt-3 border-t border-gray-100 mt-2 space-y-3">
                                            <div>
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-gray-500">Progress</span>
                                                    <span className="font-semibold text-gray-800">{modSolved} / {modTotal} solved ({modPct}%)</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-[#FF7A00]'}`}
                                                        style={{ width: `${modPct}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={`w-full text-xs font-semibold gap-1.5 transition-colors ${
                                                    isCompleted 
                                                        ? 'border-green-300 text-green-700 hover:bg-green-50' 
                                                        : 'border-orange-200 text-[#FF7A00] hover:bg-orange-50 hover:border-[#FF7A00]'
                                                }`}
                                                onClick={() => handleSelectModuleForPractice(mod.moduleNumber)}
                                            >
                                                {isCompleted ? (
                                                    <><Check className="w-3.5 h-3.5" /> Module Completed</>
                                                ) : (
                                                    <><Code2 className="w-3.5 h-3.5" /> Practice {modTotal} Problems</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>

                    {/* ─── TAB 2: PRACTICE PROBLEMS (MODULE-WISE VIEW) ──────────── */}
                    <TabsContent value="problems" className="space-y-5">
                        {/* Filter Bar */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs space-y-3">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Code2 className="w-5 h-5 text-[#FF7A00]" />
                                        <span>Coding Problems</span>
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        Showing {filteredProblems.length} of {problems.length} problems across modules
                                    </p>
                                </div>
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search problem title or #ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 h-9 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Module Selector Pills */}
                            {hasModules && (
                                <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
                                    <Button
                                        size="sm"
                                        variant={selectedModule === 'all' ? 'default' : 'outline'}
                                        className={`h-7 px-3 text-xs rounded-full flex-shrink-0 ${
                                            selectedModule === 'all' ? 'bg-[#FF7A00] hover:bg-[#FF6A00]' : 'text-gray-600'
                                        }`}
                                        onClick={() => setSelectedModule('all')}
                                    >
                                        All Modules ({problems.length})
                                    </Button>
                                    {(course.modules && course.modules.length > 0 ? course.modules : Array.from({ length: 15 }, (_, i) => ({
                                        moduleNumber: i + 1,
                                        title: `Module ${i + 1}`,
                                        problemCount: 10
                                    }))).map((mod) => {
                                        const modCount = moduleMap[mod.moduleNumber]?.length || mod.problemCount || 10;
                                        const modSolved = (moduleMap[mod.moduleNumber] || []).filter(p => p.solved).length;
                                        const isSelected = selectedModule === mod.moduleNumber;

                                        return (
                                            <Button
                                                key={mod.moduleNumber}
                                                size="sm"
                                                variant={isSelected ? 'default' : 'outline'}
                                                className={`h-7 px-3 text-xs rounded-full flex-shrink-0 transition-colors ${
                                                    isSelected ? 'bg-[#FF7A00] hover:bg-[#FF6A00]' : 'text-gray-600 hover:border-orange-300'
                                                }`}
                                                onClick={() => setSelectedModule(mod.moduleNumber)}
                                            >
                                                M{mod.moduleNumber}: {mod.title.split(':')[0].slice(0, 15)} ({modSolved}/{modCount})
                                            </Button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Problems Grouped by Module */}
                        {filteredProblems.length === 0 ? (
                            <Card className="p-12 text-center text-gray-500">
                                No problems found matching your criteria.
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {displayedModuleNums.map((modNum) => {
                                    const modProblems = filteredProblems.filter(p => (p.moduleNumber || 1) === modNum);
                                    if (modProblems.length === 0) return null;

                                    const modInfo = course.modules?.find(m => m.moduleNumber === modNum);
                                    const modTitle = modInfo?.title || modProblems[0]?.moduleTitle || `Module ${modNum}`;
                                    const modTopics = modInfo?.topics || modProblems[0]?.topics || '';
                                    const modSolvedCount = modProblems.filter(p => p.solved).length;

                                    return (
                                        <div key={modNum} className="space-y-3">
                                            {/* Module Section Header */}
                                            <div className="bg-gradient-to-r from-orange-50/90 via-amber-50/40 to-transparent p-3.5 px-4 rounded-xl border border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 bg-[#FF7A00] text-white text-[11px] font-bold rounded-md">
                                                            Module {String(modNum).padStart(2, '0')}
                                                        </span>
                                                        <h3 className="text-base font-bold text-gray-900">{modTitle}</h3>
                                                    </div>
                                                    {modTopics && (
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                            <strong className="text-gray-700">Topics:</strong> {modTopics}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className="px-2.5 py-1 bg-white border border-orange-200 text-xs font-semibold text-gray-700 rounded-lg shadow-2xs">
                                                        {modSolvedCount} / {modProblems.length} Solved
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Module Problem Cards */}
                                            <div className="grid gap-2.5">
                                                {modProblems.map((problem) => (
                                                    <div
                                                        key={problem._id}
                                                        className={`p-3.5 px-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between hover:shadow-md hover:border-orange-300 ${
                                                            problem.solved 
                                                                ? 'bg-emerald-50/40 border-emerald-200' 
                                                                : 'bg-white border-gray-100'
                                                        }`}
                                                        onClick={() => handleProblemClick(problem)}
                                                    >
                                                        <div className="flex items-center space-x-3.5 min-w-0">
                                                            <div className="flex-shrink-0">
                                                                {problem.solved ? (
                                                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                                ) : (
                                                                    <Circle className="w-5 h-5 text-gray-300" />
                                                                )}
                                                            </div>
                                                            <div className="w-12 h-9 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <span className="font-bold text-xs text-gray-700">#{problem.number}</span>
                                                            </div>
                                                            <div className="overflow-hidden min-w-0">
                                                                <h4 className="font-semibold text-sm text-gray-900 truncate">
                                                                    {problem.title}
                                                                </h4>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                                        problem.difficulty === 'Hard' ? 'bg-red-50 text-red-600 border border-red-200' :
                                                                        problem.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    }`}>
                                                                        {problem.difficulty}
                                                                    </span>
                                                                    <span className="text-[11px] text-gray-400 font-medium">
                                                                        {problem.points} pts
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            size="sm"
                                                            className={`flex-shrink-0 ml-3 text-xs font-semibold ${
                                                                problem.solved 
                                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                                                    : 'bg-[#FF7A00] hover:bg-[#FF6A00] text-white'
                                                            }`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleProblemClick(problem);
                                                            }}
                                                        >
                                                            {problem.solved ? '✓ Solved' : '▶ Solve'}
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>

                    {/* ─── TAB 3: PPTS & PRESENTATIONS ───────────────────────────── */}
                    <TabsContent value="ppts" className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Class Presentations & Slides</h2>
                        {renderContentList('ppt', 'No presentations uploaded for this course yet.')}
                    </TabsContent>

                    {/* ─── TAB 4: PREVIOUS YEAR QUESTIONS (PYQS) ─────────────────── */}
                    <TabsContent value="pyqs" className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Previous Year Exam Questions</h2>
                        {renderContentList('pyq', 'No previous year questions uploaded for this course yet.')}
                    </TabsContent>
                </Tabs>
            </div>

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
        </StudentLayout>
    );
}

