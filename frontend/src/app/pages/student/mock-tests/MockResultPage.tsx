import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { CheckCircle2, XCircle, Clock, Award, RotateCcw, ArrowLeft } from 'lucide-react';

interface QuestionResult {
    questionId: string;
    questionText: string;
    options: string[];
    selectedOption: number | null;
    correctOption: number;
    isCorrect: boolean;
    explanation: string;
    points: number;
    earnedPoints: number;
}

interface MockResultPageProps {
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    timeTaken: number;
    results: QuestionResult[];
    canRetry: boolean;
    onRetry: () => void;
    onBack: () => void;
}

export default function MockResultPage({
    score,
    maxScore,
    percentage,
    passed,
    timeTaken,
    results,
    canRetry,
    onRetry,
    onBack
}: MockResultPageProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins} min ${secs} sec`;
    };

    const correctCount = results.filter(r => r.isCorrect).length;
    const incorrectCount = results.length - correctCount;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Mock Tests
                    </Button>
                    {canRetry && (
                        <Button
                            onClick={onRetry}
                            className="bg-[#FF7A00] hover:bg-[#FF6A00] text-white"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Retry Mock Test
                        </Button>
                    )}
                </div>

                {/* Score Card */}
                <Card className="border-t-4 border-t-[#FF7A00]">
                    <CardContent className="p-8 text-center space-y-6">
                        <div>
                            {passed ? (
                                <Award className="w-16 h-16 mx-auto text-green-500 mb-4" />
                            ) : (
                                <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                            )}
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {passed ? '🎉 Congratulations!' : 'Test Completed'}
                            </h1>
                            <p className="text-gray-600">
                                {passed ? 'You passed the mock test!' : 'Keep practicing to improve your score'}
                            </p>
                        </div>

                        {/* Score Display */}
                        <div>
                            <div className="text-6xl font-bold text-[#FF7A00] mb-2">
                                {score}/{maxScore}
                            </div>
                            <div className="text-3xl font-semibold text-gray-700">
                                {percentage.toFixed(1)}%
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                            <div className="bg-green-50 rounded-lg p-4">
                                <div className="flex items-center justify-center mb-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                                    <span className="text-sm font-medium text-green-900">Correct</span>
                                </div>
                                <div className="text-2xl font-bold text-green-700">{correctCount}</div>
                            </div>

                            <div className="bg-red-50 rounded-lg p-4">
                                <div className="flex items-center justify-center mb-2">
                                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                                    <span className="text-sm font-medium text-red-900">Incorrect</span>
                                </div>
                                <div className="text-2xl font-bold text-red-700">{incorrectCount}</div>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center justify-center mb-2">
                                    <Clock className="w-5 h-5 text-blue-600 mr-2" />
                                    <span className="text-sm font-medium text-blue-900">Time Taken</span>
                                </div>
                                <div className="text-2xl font-bold text-blue-700">{formatTime(timeTaken)}</div>
                            </div>
                        </div>

                        {/* Result Badge */}
                        <div>
                            <Badge className={`text-lg px-6 py-2 ${passed ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                }`}>
                                {passed ? '✅ PASSED' : '❌ FAILED'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Results */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Question-wise Breakdown</h2>
                    <div className="space-y-4">
                        {results.map((result, index) => (
                            <Card key={result.questionId} className={`${result.isCorrect ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
                                }`}>
                                <CardContent className="p-6">
                                    {/* Question Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center">
                                            <span className="font-semibold text-gray-900 mr-3">
                                                Q{index + 1}.
                                            </span>
                                            {result.isCorrect ? (
                                                <Badge className="bg-green-500 text-white">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Correct
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-500 text-white">
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Incorrect
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-600">
                                            {result.earnedPoints}/{result.points} points
                                        </span>
                                    </div>

                                    {/* Question Text */}
                                    <p className="text-gray-700 mb-4 leading-relaxed">
                                        {result.questionText}
                                    </p>

                                    {/* Options */}
                                    <div className="space-y-2 mb-4">
                                        {result.options.map((option, optIndex) => {
                                            const isCorrect = optIndex === result.correctOption;
                                            const isSelected = optIndex === result.selectedOption;

                                            let bgColor = 'bg-white';
                                            let borderColor = 'border-gray-200';
                                            let textColor = 'text-gray-700';

                                            if (isCorrect) {
                                                bgColor = 'bg-green-50';
                                                borderColor = 'border-green-500';
                                                textColor = 'text-green-900';
                                            } else if (isSelected && !isCorrect) {
                                                bgColor = 'bg-red-50';
                                                borderColor = 'border-red-500';
                                                textColor = 'text-red-900';
                                            }

                                            return (
                                                <div
                                                    key={optIndex}
                                                    className={`flex items-center p-3 border-2 rounded-lg ${bgColor} ${borderColor}`}
                                                >
                                                    <div className="flex-1">
                                                        <span className={textColor}>{option}</span>
                                                    </div>
                                                    {isCorrect && (
                                                        <CheckCircle2 className="w-5 h-5 text-green-600 ml-2" />
                                                    )}
                                                    {isSelected && !isCorrect && (
                                                        <XCircle className="w-5 h-5 text-red-600 ml-2" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Your Answer */}
                                    {result.selectedOption !== null && !result.isCorrect && (
                                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                                            <p className="text-sm text-red-700">
                                                <strong>Your Answer:</strong> {result.options[result.selectedOption]}
                                            </p>
                                            <p className="text-sm text-green-700 mt-1">
                                                <strong>Correct Answer:</strong> {result.options[result.correctOption]}
                                            </p>
                                        </div>
                                    )}

                                    {/* Explanation */}
                                    {result.explanation && (
                                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                                            <p className="text-sm font-semibold text-blue-900 mb-1">Explanation:</p>
                                            <p className="text-sm text-blue-800">{result.explanation}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-center gap-4 py-8">
                    <Button
                        variant="outline"
                        onClick={onBack}
                        className="px-8"
                    >
                        Back to Mock Tests
                    </Button>
                    {canRetry && (
                        <Button
                            onClick={onRetry}
                            className="bg-[#FF7A00] hover:bg-[#FF6A00] text-white px-8"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
