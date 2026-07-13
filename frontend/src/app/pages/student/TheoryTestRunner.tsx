import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SecureTestEnvironment } from '../../components/SecureTestEnvironment';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowRight, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

interface TheoryQuestion {
    _id: string;
    questionText: string;
    maxMarks: number;
}

interface Test {
    _id: string;
    title: string;
    duration: number;
    totalMarks: number;
}

export default function TheoryTestRunner() {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();

    const [test, setTest] = useState<Test | null>(null);
    const [questions, setQuestions] = useState<TheoryQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [evaluation, setEvaluation] = useState<any>(null);
    const violationCountRef = useRef(0);
    const MAX_VIOLATIONS = 3;

    useEffect(() => {
        fetchTestAndQuestions();
    }, [testId]);

    useEffect(() => {
        if (timeRemaining > 0 && !submitted) {
            const timer = setTimeout(() => {
                setTimeRemaining(timeRemaining - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (timeRemaining === 0 && test && !submitted) {
            handleSubmit();
        }
    }, [timeRemaining, submitted]);

    const fetchTestAndQuestions = async () => {
        try {
            setLoading(true);

            // Fetch test
            const testResponse = await axios.get(`${API_URL}/tests/${testId}`);
            setTest(testResponse.data);
            setTimeRemaining(testResponse.data.duration * 60);

            // Fetch questions (student-safe)
            const questionsResponse = await axios.get(
                `${API_URL}/tests/${testId}/questions/theory/student`
            );
            setQuestions(questionsResponse.data);
        } catch (error: any) {
            console.error('Error fetching test:', error);
            toast.error('Failed to load test');
            navigate('/student/tests');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (value: string) => {
        const currentQuestion = questions[currentQuestionIndex];
        setAnswers({
            ...answers,
            [currentQuestion._id]: value
        });
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
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
        if (!force && !confirm('Are you sure you want to submit? You cannot change answers after submission.')) {
            return;
        }

        try {
            // Evaluate all answers
            const questionIds = questions.map(q => q._id);
            const response = await axios.post(`${API_URL}/evaluate/theory/test`, {
                answers,
                questionIds
            });

            setEvaluation(response.data);
            setSubmitted(true);

            if (force) {
                toast.error('Test auto-submitted due to security violations.');
            } else {
                toast.success('Test submitted successfully!');
            }
        } catch (error: any) {
            console.error('Error submitting test:', error);
            toast.error('Failed to submit test');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">Loading test...</p>
            </div>
        );
    }

    if (submitted && evaluation) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <Card className="max-w-4xl w-full p-8">
                    <div className="text-center mb-8">
                        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Submitted!</h1>
                        <p className="text-gray-600">Your answers have been evaluated.</p>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">Your Score</p>
                        <p className="text-5xl font-bold text-purple-600">{evaluation.totalScore}</p>
                        <p className="text-gray-600 mt-2">out of {evaluation.maxScore}</p>
                        <p className="text-lg font-semibold text-purple-700 mt-3">
                            {evaluation.percentage}%
                        </p>
                    </div>

                    {/* Question-wise Results */}
                    <div className="space-y-4 mb-6">
                        <h2 className="text-xl font-semibold">Question-wise Results:</h2>
                        {evaluation.results.map((result: any, index: number) => (
                            <Card key={index} className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-gray-900">
                                        Question {index + 1}
                                    </h3>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-purple-600">
                                            {result.marks}/{result.maxMarks}
                                        </p>
                                        <Badge
                                            className={
                                                result.confidence === 'high'
                                                    ? 'bg-green-600'
                                                    : result.confidence === 'medium'
                                                        ? 'bg-yellow-600'
                                                        : 'bg-gray-600'
                                            }
                                        >
                                            {result.confidence} confidence
                                        </Badge>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-700 mb-3">{result.questionText}</p>

                                <div className="bg-gray-50 rounded p-3 mb-3">
                                    <p className="text-xs font-medium text-gray-600 mb-1">Your Answer:</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {result.studentAnswer || '(No answer provided)'}
                                    </p>
                                </div>

                                <div className="bg-blue-50 rounded p-3 mb-3">
                                    <p className="text-xs font-medium text-blue-700 mb-1">Feedback:</p>
                                    <p className="text-sm text-gray-700">{result.feedback}</p>
                                </div>

                                {result.matchedKeywords && result.matchedKeywords.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 mb-2">
                                            Matched Keywords ({result.matchedKeywords.length}/{result.totalKeywords}):
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {result.matchedKeywords.map((keyword: string, idx: number) => (
                                                <Badge key={idx} className="bg-green-600">
                                                    ✓ {keyword}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>

                    <div className="flex justify-center">
                        <Button onClick={() => navigate('/student/tests')}>
                            Back to Tests
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion?._id] || '';
    const answeredCount = Object.keys(answers).filter(key => answers[key].trim().length > 0).length;
    const wordCount = currentAnswer.trim().split(/\s+/).filter(w => w.length > 0).length;

    return (
        <SecureTestEnvironment
            isTestActive={!submitted && !loading}
            onViolation={handleSecurityViolation}
            maxViolations={MAX_VIOLATIONS}
        >
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white border-b shadow-sm sticky top-0 z-10">
                    <div className="max-w-6xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{test?.title}</h1>
                                <p className="text-sm text-gray-600">
                                    Question {currentQuestionIndex + 1} of {questions.length}
                                </p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Answered</p>
                                    <p className="font-semibold">{answeredCount}/{questions.length}</p>
                                </div>
                                <div
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeRemaining < 300 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'
                                        }`}
                                >
                                    <Clock className="w-5 h-5" />
                                    <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Question Content */}
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <Card className="p-8 mb-6">
                        <div className="mb-6">
                            <Badge className="mb-4 bg-purple-600">{currentQuestion?.maxMarks} marks</Badge>
                            <h2 className="text-2xl font-semibold text-gray-900 leading-relaxed">
                                {currentQuestion?.questionText}
                            </h2>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-700">Your Answer:</label>
                                <span className="text-xs text-gray-500">{wordCount} words</span>
                            </div>
                            <textarea
                                value={currentAnswer}
                                onChange={(e) => handleAnswerChange(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[300px] resize-y"
                                placeholder="Write your answer here..."
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                💡 Tip: Write in clear, complete sentences. Include key concepts and explanations.
                            </p>
                        </div>
                    </Card>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={currentQuestionIndex === 0}
                        >
                            Previous
                        </Button>

                        <div className="flex gap-3">
                            {currentQuestionIndex < questions.length - 1 ? (
                                <Button onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
                                    Next Question
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => handleSubmit(false)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Submit Test
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Word count warning */}
                    {currentAnswer.trim().length > 0 && wordCount < 20 && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                                ⚠️ Your answer seems short ({wordCount} words). Consider adding more detail.
                            </p>
                        </div>
                    )}
                </div>

                {/* Question Navigator */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
                    <div className="max-w-6xl mx-auto px-6 py-4">
                        <p className="text-sm text-gray-600 mb-3">Question Navigator</p>
                        <div className="flex flex-wrap gap-2">
                            {questions.map((q, index) => (
                                <button
                                    key={q._id}
                                    onClick={() => setCurrentQuestionIndex(index)}
                                    className={`w-10 h-10 rounded-lg font-semibold transition-all ${index === currentQuestionIndex
                                        ? 'bg-purple-600 text-white'
                                        : answers[q._id] && answers[q._id].trim().length > 0
                                            ? 'bg-green-100 text-green-700 border-2 border-green-300'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </SecureTestEnvironment>
    );
}
