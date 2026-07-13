
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Save, Trash2, Edit, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
    MCQQuestion,
    createMCQQuestion,
    getMCQQuestions,
    updateMCQQuestion,
    deleteMCQQuestion
} from '../../../services/testBuilderService';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

interface MCQBuilderProps {
    testId: string;
    test: {
        title: string;
        duration: number;
        totalMarks: number;
    };
}

export default function MCQBuilder({ testId, test }: MCQBuilderProps) {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<MCQQuestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<MCQQuestion | null>(null);

    // Form state
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctAnswers, setCorrectAnswers] = useState<number[]>([]);
    const [marks, setMarks] = useState(1);
    const [explanation, setExplanation] = useState('');

    useEffect(() => {
        fetchQuestions();
    }, [testId]);

    const fetchQuestions = async () => {
        try {
            const data = await getMCQQuestions(testId);
            setQuestions(data);
        } catch (error: any) {
            toast.error('Failed to load questions');
            console.error('Error fetching questions:', error);
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleCorrectAnswerToggle = (index: number) => {
        if (correctAnswers.includes(index)) {
            setCorrectAnswers(correctAnswers.filter(i => i !== index));
        } else {
            setCorrectAnswers([...correctAnswers, index]);
        }
    };

    const resetForm = () => {
        setQuestionText('');
        setOptions(['', '', '', '']);
        setCorrectAnswers([]);
        setMarks(1);
        setExplanation('');
        setEditingQuestion(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!questionText.trim()) {
            toast.error('Please enter a question');
            return;
        }

        if (options.some(opt => !opt.trim())) {
            toast.error('Please fill all options');
            return;
        }

        if (correctAnswers.length === 0) {
            toast.error('Please select at least one correct answer');
            return;
        }

        const questionData: MCQQuestion = {
            questionText: questionText.trim(),
            options: options.map(opt => opt.trim()),
            correctAnswers,
            multipleCorrect: correctAnswers.length > 1,
            marks,
            explanation: explanation.trim()
        };

        try {
            setLoading(true);
            if (editingQuestion && editingQuestion._id) {
                await updateMCQQuestion(editingQuestion._id, questionData);
                toast.success('Question updated successfully!');
            } else {
                await createMCQQuestion(testId, questionData);
                toast.success('Question added successfully!');
            }

            resetForm();
            setShowForm(false);
            fetchQuestions();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save question');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (question: MCQQuestion) => {
        setEditingQuestion(question);
        setQuestionText(question.questionText);
        setOptions(question.options);
        setCorrectAnswers(question.correctAnswers);
        setMarks(question.marks);
        setExplanation(question.explanation || '');
        setShowForm(true);
    };

    const handleDelete = async (questionId: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;

        try {
            await deleteMCQQuestion(questionId);
            toast.success('Question deleted successfully!');
            fetchQuestions();
        } catch (error: any) {
            toast.error('Failed to delete question');
        }
    };

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/faculty/tests')}
                                className="mb-2"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Tests
                            </Button>
                            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
                            <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                <span>Duration: {test.duration} minutes</span>
                                <span>•</span>
                                <span>Questions: {questions.length}</span>
                                <span>•</span>
                                <span>Total Marks: {totalMarks}</span>
                            </div>
                        </div>
                        <Badge className="bg-indigo-600">MCQ Test</Badge>
                    </div>
                </div>

                {/* Add Question Button */}
                {!showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        className="mb-6 bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                    </Button>
                )}

                {/* Question Form */}
                {showForm && (
                    <Card className="p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingQuestion ? 'Edit Question' : 'Add New Question'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Question Text */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Question <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={questionText}
                                    onChange={(e) => setQuestionText(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    rows={3}
                                    placeholder="Enter your question here..."
                                    required
                                />
                            </div>

                            {/* Options */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Options <span className="text-red-500">*</span>
                                </label>
                                <div className="space-y-2">
                                    {options.map((option, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={correctAnswers.includes(index)}
                                                onChange={() => handleCorrectAnswerToggle(index)}
                                                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                            />
                                            <span className="font-medium text-gray-700 w-8">
                                                {String.fromCharCode(65 + index)}.
                                            </span>
                                            <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                placeholder={`Option ${String.fromCharCode(65 + index)} `}
                                                required
                                            />
                                            {correctAnswers.includes(index) && (
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    Check the box(es) to mark correct answer(s)
                                </p>
                            </div>

                            {/* Marks */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Marks <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={marks}
                                        onChange={(e) => setMarks(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        min={1}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Explanation */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Explanation (Optional)
                                </label>
                                <textarea
                                    value={explanation}
                                    onChange={(e) => setExplanation(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    rows={2}
                                    placeholder="Explain the correct answer..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {editingQuestion ? 'Update' : 'Add'} Question
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        resetForm();
                                        setShowForm(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Questions List */}
                <div className="space-y-4">
                    {questions.length === 0 ? (
                        <Card className="p-8 text-center text-gray-500">
                            <p>No questions added yet. Click "Add Question" to get started.</p>
                        </Card>
                    ) : (
                        questions.map((question, qIndex) => (
                            <Card key={question._id} className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Question {qIndex + 1}
                                    </h3>
                                    <div className="flex gap-2">
                                        <Badge>{question.marks} marks</Badge>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEdit(question)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDelete(question._id!)}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <p className="text-gray-800 mb-4">{question.questionText}</p>

                                <div className="space-y-2 mb-4">
                                    {question.options.map((option, optIndex) => (
                                        <div
                                            key={optIndex}
                                            className={`flex items-center gap-3 p-3 rounded-lg ${question.correctAnswers.includes(optIndex)
                                                ? 'bg-green-50 border border-green-300'
                                                : 'bg-gray-50'
                                                } `}
                                        >
                                            <span className="font-medium text-gray-700">
                                                {String.fromCharCode(65 + optIndex)}.
                                            </span>
                                            <span className="flex-1">{option}</span>
                                            {question.correctAnswers.includes(optIndex) && (
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {question.explanation && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-sm text-blue-900">
                                            <strong>Explanation:</strong> {question.explanation}
                                        </p>
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
