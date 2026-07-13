import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SecureTestEnvironment } from '../../components/SecureTestEnvironment';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Play, CheckCircle, Code2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

interface CodingQuestion {
    _id: string;
    title: string;
    problemStatement: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    allowedLanguages: string[];
    starterCode: { language: string; code: string }[];
    testCases: {
        input: string;
        expectedOutput: string;
        marks: number;
        isHidden: boolean;
    }[];
    totalMarks: number;
    timeLimit: number;
    memoryLimit: number;
}

interface Test {
    _id: string;
    title: string;
    duration: number;
    totalMarks: number;
}

export default function CodingTestRunner() {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();

    const [test, setTest] = useState<Test | null>(null);
    const [questions, setQuestions] = useState<CodingQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedLanguage, setSelectedLanguage] = useState('python');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [testResults, setTestResults] = useState<any>(null);
    const [submitted, setSubmitted] = useState(false);
    const [totalScore, setTotalScore] = useState(0);
    const violationCountRef = useRef(0);
    const MAX_VIOLATIONS = 3;

    useState(() => {
        fetchTestAndQuestions();
    });

    const fetchTestAndQuestions = async () => {
        try {
            setLoading(true);

            // Fetch test
            const testResponse = await axios.get(`${API_URL}/tests/${testId}`);
            setTest(testResponse.data);

            // Fetch coding questions (student-safe)
            const questionsResponse = await axios.get(
                `${API_URL}/tests/${testId}/questions/coding/student`
            );
            setQuestions(questionsResponse.data);

            // Set initial language and code
            if (questionsResponse.data.length > 0) {
                const firstQuestion = questionsResponse.data[0];
                const firstLang = firstQuestion.allowedLanguages[0];
                setSelectedLanguage(firstLang);
                const starterCode = firstQuestion.starterCode.find(
                    (sc: any) => sc.language === firstLang
                )?.code || '';
                setCode(starterCode);
            }
        } catch (error: any) {
            console.error('Error fetching test:', error);
            toast.error('Failed to load test');
            navigate('/student/tests');
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (newLang: string) => {
        setSelectedLanguage(newLang);
        const currentQuestion = questions[currentQuestionIndex];
        const starterCode = currentQuestion.starterCode.find(
            sc => sc.language === newLang
        )?.code || '';
        setCode(starterCode);
    };

    const handleRunCode = async () => {
        if (!code.trim()) {
            toast.error('Please write some code first');
            return;
        }

        setRunning(true);
        const currentQuestion = questions[currentQuestionIndex];

        try {
            // Get only visible test cases for testing
            const visibleTestCases = currentQuestion.testCases.filter(tc => !tc.isHidden);

            if (visibleTestCases.length === 0) {
                toast.info('No sample test cases available. Submit to see results.');
                return;
            }

            const response = await axios.post(`${API_URL}/compile/test`, {
                language: selectedLanguage,
                code,
                testCases: visibleTestCases,
                timeLimit: currentQuestion.timeLimit,
                memoryLimit: currentQuestion.memoryLimit
            });

            setTestResults(response.data);

            if (response.data.passed) {
                toast.success(`All sample tests passed! (${response.data.totalScore}/${response.data.maxScore})`);
            } else {
                toast.warning(`Some tests failed (${response.data.totalScore}/${response.data.maxScore})`);
            }
        } catch (error: any) {
            toast.error('Failed to run code');
            console.error('Run error:', error);
        } finally {
            setRunning(false);
        }
    };

    const handleSecurityViolation = (reason: string) => {
        violationCountRef.current += 1;

        if (violationCountRef.current >= MAX_VIOLATIONS) {
            toast.error('Maximum security violations reached. Auto-submitting test.', { duration: 5000 });
            handleSubmit(true);
        }
    };

    const handleSubmit = async (force: boolean = false) => {
        if (!force && !confirm('Are you sure you want to submit? You can only submit once.')) {
            return;
        }

        setRunning(true);
        const currentQuestion = questions[currentQuestionIndex];

        try {
            const response = await axios.post(
                `${API_URL}/compile/submit/${currentQuestion._id}`,
                {
                    language: selectedLanguage,
                    code
                }
            );

            setTestResults(response.data);
            setTotalScore(response.data.totalScore);
            setSubmitted(true);

            if (force) {
                toast.error('Test auto-submitted due to security violations.');
            } else {
                toast.success('Code submitted successfully!');
            }
        } catch (error: any) {
            toast.error('Submission failed');
            console.error('Submit error:', error);
        } finally {
            setRunning(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">Loading test...</p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Code Submitted!</h1>
                    <p className="text-gray-600 mb-6">Your solution has been evaluated.</p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                        <p className="text-sm text-gray-600 mb-2">Your Score</p>
                        <p className="text-5xl font-bold text-blue-600">{totalScore}</p>
                        <p className="text-gray-600 mt-2">
                            out of {questions[currentQuestionIndex].totalMarks}
                        </p>
                    </div>

                    {testResults && (
                        <div className="text-left mb-6">
                            <h3 className="font-semibold mb-3">Test Results:</h3>
                            <div className="space-y-2">
                                {testResults.results.map((result: any, index: number) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg border-2 ${result.passed
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-red-50 border-red-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">
                                                Test Case {index + 1}
                                            </span>
                                            <Badge className={result.passed ? 'bg-green-600' : 'bg-red-600'}>
                                                {result.passed ? 'Passed' : 'Failed'}
                                            </Badge>
                                        </div>
                                        {result.error && (
                                            <p className="text-sm text-red-600 mt-1">{result.error}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button onClick={() => navigate('/student/tests')}>Back to Tests</Button>
                </Card>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <SecureTestEnvironment
            isTestActive={!submitted && !loading}
            onViolation={handleSecurityViolation}
            maxViolations={MAX_VIOLATIONS}
        >
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b shadow-sm">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <h1 className="text-xl font-bold text-gray-900">{test?.title}</h1>
                        <p className="text-sm text-gray-600">{currentQuestion.title}</p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto p-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Left Panel - Problem */}
                        <Card className="p-6 h-[calc(100vh-180px)] overflow-y-auto">
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Badge
                                        className={
                                            currentQuestion.difficulty === 'Easy'
                                                ? 'bg-green-600'
                                                : currentQuestion.difficulty === 'Medium'
                                                    ? 'bg-yellow-600'
                                                    : 'bg-red-600'
                                        }
                                    >
                                        {currentQuestion.difficulty}
                                    </Badge>
                                    <Badge>{currentQuestion.totalMarks} marks</Badge>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                    {currentQuestion.title}
                                </h2>
                            </div>

                            <div className="prose max-w-none mb-6">
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {currentQuestion.problemStatement}
                                </p>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-2">Constraints:</h3>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>Time Limit: {currentQuestion.timeLimit}s</li>
                                    <li>Memory Limit: {currentQuestion.memoryLimit}MB</li>
                                </ul>
                            </div>

                            {/* Sample Test Cases */}
                            <div className="border-t pt-4 mt-4">
                                <h3 className="font-semibold mb-3">Sample Test Cases:</h3>
                                {currentQuestion.testCases
                                    .filter(tc => !tc.isHidden)
                                    .map((tc, index) => (
                                        <div key={index} className="bg-gray-50 p-3 rounded-lg mb-3">
                                            <p className="text-sm font-medium mb-1">Example {index + 1}:</p>
                                            <div className="text-sm">
                                                <p className="text-gray-600">Input:</p>
                                                <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
                                                    {tc.input}
                                                </pre>
                                                <p className="text-gray-600 mt-2">Expected Output:</p>
                                                <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
                                                    {tc.expectedOutput}
                                                </pre>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </Card>

                        {/* Right Panel - Code Editor */}
                        <div className="space-y-4">
                            <Card className="p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Code2 className="w-5 h-5 text-blue-600" />
                                        <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {currentQuestion.allowedLanguages.map(lang => (
                                                    <SelectItem key={lang} value={lang}>
                                                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleRunCode}
                                            disabled={running}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Play className="w-4 h-4 mr-1" />
                                            Run
                                        </Button>
                                        <Button
                                            onClick={() => handleSubmit(false)}
                                            disabled={running}
                                            className="bg-green-600 hover:bg-green-700"
                                            size="sm"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Submit
                                        </Button>
                                    </div>
                                </div>

                                <div className="border border-gray-300 rounded-lg overflow-hidden">
                                    <Editor
                                        height="500px"
                                        language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
                                        value={code}
                                        onChange={value => setCode(value || '')}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: true },
                                            fontSize: 14,
                                            lineNumbers: 'on',
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true
                                        }}
                                    />
                                </div>
                            </Card>

                            {/* Test Results */}
                            {testResults && !submitted && (
                                <Card className="p-4">
                                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                                        <Clock className="w-5 h-5" />
                                        Test Results
                                    </h3>
                                    <div className="space-y-2">
                                        {testResults.results.map((result: any, index: number) => (
                                            <div
                                                key={index}
                                                className={`p-3 rounded-lg border ${result.passed
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-red-50 border-red-200'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-sm">
                                                        Test Case {index + 1}
                                                    </span>
                                                    <Badge
                                                        className={
                                                            result.passed ? 'bg-green-600' : 'bg-red-600'
                                                        }
                                                    >
                                                        {result.passed ? '✓ Passed' : '✗ Failed'}
                                                    </Badge>
                                                </div>
                                                {!result.passed && result.actualOutput && (
                                                    <div className="text-xs">
                                                        <p className="text-gray-600">Your Output:</p>
                                                        <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
                                                            {result.actualOutput}
                                                        </pre>
                                                    </div>
                                                )}
                                                {result.error && (
                                                    <div className="mt-2 flex items-start gap-2 text-xs text-red-600">
                                                        <AlertCircle className="w-4 h-4 mt-0.5" />
                                                        <span>{result.error}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </SecureTestEnvironment>
    );
}
