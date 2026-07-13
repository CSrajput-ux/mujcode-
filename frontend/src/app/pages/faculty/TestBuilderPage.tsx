import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import MCQBuilder from './builders/MCQBuilder';
import CodingBuilder from './builders/CodingBuilder';
import TheoryBuilder from './builders/TheoryBuilder';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/tests';

interface Test {
    _id: string;
    title: string;
    testType: 'MCQ' | 'Coding' | 'Theory';
    duration: number;
    totalMarks: number;
    builderStatus: string;
}

export default function TestBuilderPage() {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();
    const [test, setTest] = useState<Test | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTest();
    }, [testId]);

    const fetchTest = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/${testId}`);
            setTest(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load test');
            console.error('Error fetching test:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading test builder...</p>
                </div>
            </div>
        );
    }

    if (error || !test) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
                    <p className="text-gray-600 mb-4">{error || 'Test not found'}</p>
                    <button
                        onClick={() => navigate('/faculty/tests')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Back to Tests
                    </button>
                </div>
            </div>
        );
    }

    // Route to appropriate builder based on test type
    switch (test.testType) {
        case 'MCQ':
            return <MCQBuilder testId={testId!} test={test} />;
        case 'Coding':
            return <CodingBuilder testId={testId!} test={test} />;
        case 'Theory':
            return <TheoryBuilder testId={testId!} test={test} />;
        default:
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <p className="text-red-600">Unknown test type: {test.testType}</p>
                </div>
            );
    }
}
