import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Clock, ChevronLeft, ChevronRight, Flag, Grid3x3 } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
    _id: string;
    questionText: string;
    options: string[];
    points: number;
}

interface MockTestRunnerProps {
    attemptId: string;
    questions: Question[];
    duration: number; // in minutes
    onSubmit: (answers: Answer[], timeTaken: number) => void;
    onExit: () => void;
}

interface Answer {
    questionId: string;
    selectedOption: number;
    markedForReview: boolean;
}

export default function MockTestRunner({ attemptId, questions, duration, onSubmit, onExit }: MockTestRunnerProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
    const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
    const [timeRemaining, setTimeRemaining] = useState(duration * 60); // Convert to seconds
    const [showNavigator, setShowNavigator] = useState(false);

    const currentQuestion = questions[currentQuestionIndex];

    // Timer countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleAutoSubmit = () => {
        toast.warning('Time is up! Auto-submitting your test...');
        handleSubmit(true);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const handleOptionSelect = (optionIndex: number) => {
        const newAnswers = new Map(answers);
        newAnswers.set(currentQuestion._id, {
            questionId: currentQuestion._id,
            selectedOption: optionIndex,
            markedForReview: markedForReview.has(currentQuestion._id)
        });
        setAnswers(newAnswers);
    };

    const toggleMarkForReview = () => {
        const newMarked = new Set(markedForReview);
        if (newMarked.has(currentQuestion._id)) {
            newMarked.delete(currentQuestion._id);
        } else {
            newMarked.add(currentQuestion._id);
        }
        setMarkedForReview(newMarked);

        // Update answer if exists
        if (answers.has(currentQuestion._id)) {
            const newAnswers = new Map(answers);
            const existing = newAnswers.get(currentQuestion._id)!;
            newAnswers.set(currentQuestion._id, {
                ...existing,
                markedForReview: !existing.markedForReview
            });
            setAnswers(newAnswers);
        }
    };

    const handleSubmit = (auto = false) => {
        if (!auto) {
            const confirmed = confirm(
                `You have answered ${answers.size} out of ${questions.length} questions.\n\nAre you sure you want to submit?`
            );
            if (!confirmed) return;
        }

        const answersArray = Array.from(answers.values());
        const timeTaken = (duration * 60) - timeRemaining;
        onSubmit(answersArray, timeTaken);
    };

    const handleExit = () => {
        const confirmed = confirm('Are you sure you want to exit? Your progress will be lost.');
        if (confirmed) {
            onExit();
        }
    };

    const goToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
        setShowNavigator(false);
    };

    const getQuestionStatus = (index: number) => {
        const question = questions[index];
        if (answers.has(question._id)) {
            return markedForReview.has(question._id) ? 'answered-marked' : 'answered';
        }
        if (markedForReview.has(question._id)) return 'marked';
        return 'not-answered';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'answered': return 'bg-green-500 text-white';
            case 'answered-marked': return 'bg-yellow-500 text-white';
            case 'marked': return 'bg-orange-500 text-white';
            default: return 'bg-gray-200 text-gray-700';
        }
    };

    const selectedOption = answers.get(currentQuestion._id)?.selectedOption;
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-xl font-bold text-gray-900">Mock Test</h1>
                        <Badge variant="outline" className="text-sm">
                            Question {currentQuestionIndex + 1} of {questions.length}
                        </Badge>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Timer */}
                        <div className={`flex items-center px-4 py-2 rounded-lg font-mono font-bold ${timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                            <Clock className="w-5 h-5 mr-2" />
                            {formatTime(timeRemaining)}
                        </div>

                        {/* Navigator Toggle */}
                        <Button
                            variant="outline"
                            onClick={() => setShowNavigator(!showNavigator)}
                            className="hidden md:flex"
                        >
                            <Grid3x3 className="w-4 h-4 mr-2" />
                            Navigator
                        </Button>

                        {/* Submit */}
                        <Button
                            onClick={() => handleSubmit(false)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            Submit Test
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Question Area */}
                    <div className="lg:col-span-3">
                        <Card className="border-l-4 border-l-[#FF7A00]">
                            <CardContent className="p-6 space-y-6">
                                {/* Question */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Question {currentQuestionIndex + 1}
                                        </h3>
                                        <Badge className="bg-[#FF7A00] text-white">
                                            {currentQuestion.points} {currentQuestion.points === 1 ? 'Point' : 'Points'}
                                        </Badge>
                                    </div>
                                    <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap">
                                        {currentQuestion.questionText}
                                    </p>
                                </div>

                                {/* Options */}
                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleOptionSelect(index)}
                                            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedOption === index
                                                    ? 'bg-orange-50 border-[#FF7A00]'
                                                    : 'hover:bg-gray-50 border-gray-200'
                                                }`}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 ${selectedOption === index
                                                    ? 'border-[#FF7A00] bg-[#FF7A00]'
                                                    : 'border-gray-300'
                                                }`}>
                                                {selectedOption === index && (
                                                    <div className="w-2 h-2 bg-white rounded-full" />
                                                )}
                                            </div>
                                            <span className="text-gray-700">{option}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Mark for Review */}
                                <div className="flex items-center pt-4 border-t">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={markedForReview.has(currentQuestion._id)}
                                            onChange={toggleMarkForReview}
                                            className="w-4 h-4 text-[#FF7A00] border-gray-300 rounded focus:ring-[#FF7A00]"
                                        />
                                        <span className="ml-2 text-sm text-gray-600 flex items-center">
                                            <Flag className="w-4 h-4 mr-1" />
                                            Mark for Review
                                        </span>
                                    </label>
                                </div>

                                {/* Navigation */}
                                <div className="flex items-center justify-between pt-6 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                        disabled={currentQuestionIndex === 0}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" />
                                        Previous
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        onClick={handleExit}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        Exit Test
                                    </Button>

                                    {isLastQuestion ? (
                                        <Button
                                            onClick={() => handleSubmit(false)}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            Submit Test
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                            className="bg-[#FF7A00] hover:bg-[#FF6A00] text-white"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Question Navigator (Desktop) */}
                    {showNavigator && (
                        <div className="hidden lg:block">
                            <Card className="sticky top-24">
                                <CardContent className="p-4">
                                    <h4 className="font-semibold mb-4">Question Navigator</h4>
                                    <div className="grid grid-cols-5 gap-2">
                                        {questions.map((_, index) => {
                                            const status = getQuestionStatus(index);
                                            return (
                                                <button
                                                    key={index}
                                                    onClick={() => goToQuestion(index)}
                                                    className={`w-10 h-10 rounded-lg font-medium text-sm ${getStatusColor(status)} ${index === currentQuestionIndex ? 'ring-2 ring-[#FF7A00] ring-offset-2' : ''
                                                        }`}
                                                >
                                                    {index + 1}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Legend */}
                                    <div className="mt-4 pt-4 border-t space-y-2 text-xs">
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 rounded bg-green-500 mr-2"></div>
                                            <span>Answered</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 rounded bg-yellow-500 mr-2"></div>
                                            <span>Answered & Marked</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 rounded bg-orange-500 mr-2"></div>
                                            <span>Marked</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 rounded bg-gray-200 mr-2"></div>
                                            <span>Not Answered</span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="mt-4 pt-4 border-t space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span>Answered:</span>
                                            <span className="font-semibold">{answers.size}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Not Answered:</span>
                                            <span className="font-semibold">{questions.length - answers.size}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Marked:</span>
                                            <span className="font-semibold">{markedForReview.size}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
