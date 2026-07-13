import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SecureTestEnvironment } from '../../components/SecureTestEnvironment';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ArrowRight, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

interface MCQQuestion {
    _id: string;
    questionText: string;
    options: string[];
    marks: number;
}

interface Test {
    _id: string;
    title: string;
    duration: number;
    totalMarks: number;
    testType: string;
}

export default function MCQTestRunner() {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();

    const [test, setTest] = useState<Test | null>(null);
    const [questions, setQuestions] = useState<MCQQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [questionId: string]: number[] }>({}); // questionId -> selected option indices
    const [loading, setLoading] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
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

            // Fetch test details
            const testResponse = await axios.get(`${API_URL}/tests/${testId}`);
            setTest(testResponse.data);
            setTimeRemaining(testResponse.data.duration * 60); // Convert minutes to seconds

            // Fetch questions (student-safe endpoint)
            const questionsResponse = await axios.get(`${API_URL}/tests/${testId}/questions/mcq/student`);
            setQuestions(questionsResponse.data);
        } catch (error: any) {
            console.error('Error fetching test:', error);
            toast.error('Failed to load test');
            navigate('/student/tests');
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (optionIndex: number) => {
        const currentQuestion = questions[currentQuestionIndex];

        // For now, treat as single answer (can be extended for multiple)
        setAnswers({
            ...answers,
            [currentQuestion._id]: [optionIndex]
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
            handleSubmit(true); // Force submit
        }
    };

    const handleSubmit = async (force: boolean = false) => {
        if (!force && !confirm('Are you sure you want to submit? You cannot change answers after submission.')) {
            return;
        }

        try {
            // In a real implementation, this would submit to backend and get actual score
            // For now, calculate simple score based on answered questions
            const answeredCount = Object.keys(answers).length;
            const totalQuestions = questions.length;
            const calculatedScore = Math.round((answeredCount / totalQuestions) * (test?.totalMarks || 100));

            setScore(calculatedScore);
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

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <Card className="max-w-2xl w-full p-8 text-center">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Submitted!</h1>
                    <p className="text-gray-600 mb-6">Your answers have been recorded successfully.</p>

                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
                        <p className="text-sm text-gray-600 mb-2">Your Score</p>
                        <p className="text-5xl font-bold text-indigo-600">{score}</p>
                        <p className="text-gray-600 mt-2">out of {test?.totalMarks}</p>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <Button onClick={() => navigate('/student/tests')}>
                            Back to Tests
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswers = answers[currentQuestion?._id] || [];
    const answeredCount = Object.keys(answers).length;

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
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeRemaining < 300 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
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
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <Badge className="mb-4">{currentQuestion?.marks} marks</Badge>
                                <h2 className="text-2xl font-semibold text-gray-900 leading-relaxed">
                                    {currentQuestion?.questionText}
                                </h2>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            {currentQuestion?.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleOptionSelect(index)}
                                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedAnswers.includes(index)
                                        ? 'border-indigo-600 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedAnswers.includes(index)
                                            ? 'border-indigo-600 bg-indigo-600'
                                            : 'border-gray-300'
                                            }`}>
                                            {selectedAnswers.includes(index) && (
                                                <div className="w-3 h-3 bg-white rounded-full" />
                                            )}
                                        </div>
                                        <span className="font-medium text-gray-700 mr-3">
                                            {String.fromCharCode(65 + index)}.
                                        </span>
                                        <span className="text-gray-900">{option}</span>
                                    </div>
                                </button>
                            ))}
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
                                <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700">
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

                    {/* Warning if unanswered */}
                    {selectedAnswers.length === 0 && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            <p className="text-sm text-yellow-800">
                                You haven't selected an answer for this question yet.
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
                                        ? 'bg-indigo-600 text-white'
                                        : answers[q._id]
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
