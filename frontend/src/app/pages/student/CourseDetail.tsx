import StudentLayout from '../../components/StudentLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Code2, Database, Globe, Target, ArrowLeft, CheckCircle2, Circle, FileText, BookOpen, Presentation, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Problem {
    _id: string;
    number: number;
    title: string;
    difficulty: string;
    category: string;
    points: number;
    solved: boolean;
}

interface Course {
    _id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    totalProblems: number;
    icon: string;
}

interface ContentItem {
    _id: string;
    title: string;
    description: string;
    type: 'module' | 'ppt' | 'pyq';
    fileUrl: string;
    fileType: string;
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

    useEffect(() => {
        fetchCourseDetails();
    }, [courseId]);

    const fetchCourseDetails = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const studentId = user.college_id || user.id || '';

            const apiUrl = `${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/student/course/${courseId}/details?studentId=${studentId}`;
            const res = await fetch(apiUrl);
            const data = await res.json();

            if (res.ok) {
                setCourse(data.course);
                setProblems(data.problems || []);
                setSolvedCount(data.solvedCount || 0);

                // Fetch associated content using the course title as subject
                if (data.course && data.course.title) {
                    fetchContent(data.course.title);
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
            const response = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/content', {
                headers: { Authorization: `Bearer ${token}` },
                params: { subject } // Filter by subject matching course title
            });
            setCourseContent(response.data);
        } catch (error) {
            console.error('Error fetching course content:', error);
        }
    };

    const getIcon = (iconName: string) => {
        const iconClass = "w-12 h-12 text-[#FF7A00]";
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
                    <div key={item._id} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
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
                        <a href={`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}${item.fileUrl}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="w-4 h-4" /> Download
                            </Button>
                        </a>
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

                {/* Course Header */}
                <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-white">
                    <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                            <div className="p-4 bg-white rounded-xl shadow-sm">
                                {getIcon(course.icon)}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
                                <p className="text-gray-600 mb-3">{course.description}</p>
                                <div className="flex items-center gap-3 mb-4">
                                    <Badge variant="outline" className="text-sm">{course.category}</Badge>
                                    <Badge className={`${difficultyColors[course.difficulty]} text-sm`}>
                                        {course.difficulty}
                                    </Badge>
                                </div>

                                {/* Progress Bar */}
                                <div className="max-w-md">
                                    <div className="flex items-center justify-between mb-1 text-sm">
                                        <span className="text-gray-600">Progress</span>
                                        <span className="font-semibold text-[#FF7A00]">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div
                                            className="bg-[#FF7A00] h-3 rounded-full transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {solvedCount} / {problems.length} problems solved
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Content Tabs */}
                <Tabs defaultValue="problems" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-6">
                        <TabsTrigger value="problems" className="gap-2">
                            <Code2 className="w-4 h-4" /> Problems
                        </TabsTrigger>
                        <TabsTrigger value="modules" className="gap-2">
                            <BookOpen className="w-4 h-4" /> Modules
                        </TabsTrigger>
                        <TabsTrigger value="ppts" className="gap-2">
                            <Presentation className="w-4 h-4" /> PPTs
                        </TabsTrigger>
                        <TabsTrigger value="pyqs" className="gap-2">
                            <FileText className="w-4 h-4" /> PYQs
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="problems" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Practice Problems</h2>
                            <span className="text-sm text-gray-500">{problems.length} problems</span>
                        </div>
                        <div className="grid gap-3">
                            {problems.length === 0 ? (
                                <Card className="p-8 text-center text-gray-500">
                                    No problems found for this course yet.
                                </Card>
                            ) : (
                                problems.map((problem) => (
                                    <Card
                                        key={problem._id}
                                        className={`cursor-pointer transition-all hover:shadow-md hover:border-orange-300 ${problem.solved ? 'bg-green-50 border-green-200' : 'bg-white'}`}
                                        onClick={() => handleProblemClick(problem)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex-shrink-0">
                                                        {problem.solved ? (
                                                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                                                        ) : (
                                                            <Circle className="w-6 h-6 text-gray-300" />
                                                        )}
                                                    </div>
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <span className="font-bold text-gray-700">#{problem.number}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{problem.title}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge className={`${difficultyColors[problem.difficulty]} text-xs`}>
                                                                {problem.difficulty}
                                                            </Badge>
                                                            <span className="text-xs text-gray-500">{problem.points} pts</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    className={`${problem.solved ? 'bg-green-600 hover:bg-green-700' : 'bg-[#FF7A00] hover:bg-[#FF6A00]'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleProblemClick(problem);
                                                    }}
                                                >
                                                    {problem.solved ? '✓ Review' : '▶ Solve'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                        <Card className="border-blue-200 bg-blue-50">
                            <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-bold text-sm">💡</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">Tip</h4>
                                        <p className="text-sm text-gray-600">
                                            Click on any problem to open the code editor. Write your solution and submit to earn points!
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="modules" className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Learning Modules</h2>
                        {renderContentList('module', 'No learning modules available for this course.')}
                    </TabsContent>

                    <TabsContent value="ppts" className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Class Presentations</h2>
                        {renderContentList('ppt', 'No presentations available for this course.')}
                    </TabsContent>

                    <TabsContent value="pyqs" className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Previous Year Questions</h2>
                        {renderContentList('pyq', 'No PYQs available for this course.')}
                    </TabsContent>
                </Tabs>
            </div>
        </StudentLayout>
    );
}

