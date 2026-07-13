import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Play, Clock, BookOpen, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

interface Test {
    _id: string;
    title: string;
    type: string;
    testType: 'MCQ' | 'Coding' | 'Theory';
    duration: number;
    totalMarks: number;
    startTime: string;
    status: string;
}

export default function MCQTestList() {
    const navigate = useNavigate();
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            setLoading(true);
            // In production, this would filter by student enrollment
            const response = await axios.get(`${API_URL}/tests`);

            // Filter only MCQ tests that are published/active
            const mcqTests = response.data.filter((test: Test) =>
                test.testType === 'MCQ' && test.status !== 'Draft'
            );

            setTests(mcqTests);
        } catch (error: any) {
            console.error('Error fetching tests:', error);
            toast.error('Failed to load tests');
        } finally {
            setLoading(false);
        }
    };

    const handleStartTest = (testId: string) => {
        navigate(`/student/tests/mcq/${testId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">Loading tests...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Available MCQ Tests</h1>
                    <p className="text-gray-600">Select a test to begin</p>
                </div>

                {tests.length === 0 ? (
                    <Card className="p-12 text-center">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Tests Available</h2>
                        <p className="text-gray-600">
                            There are no MCQ tests available at the moment. Check back later!
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tests.map((test) => (
                            <Card key={test._id} className="p-6 hover:shadow-lg transition-shadow">
                                <div className="mb-4">
                                    <Badge className="mb-2 bg-indigo-600">MCQ Test</Badge>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {test.title}
                                    </h3>
                                    <p className="text-sm text-gray-600">{test.type}</p>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="w-4 h-4" />
                                        <span>{test.duration} minutes</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <BookOpen className="w-4 h-4" />
                                        <span>{test.totalMarks} marks</span>
                                    </div>
                                    {test.startTime && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>{new Date(test.startTime).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={() => handleStartTest(test._id)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Test
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
