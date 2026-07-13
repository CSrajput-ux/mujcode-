import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2, Edit, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import {
    TheoryQuestion,
    createTheoryQuestion,
    getTheoryQuestions,
    updateTheoryQuestion,
    deleteTheoryQuestion
} from '../../../services/testBuilderService';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

interface TheoryBuilderProps {
    testId: string;
    test: {
        title: string;
        duration: number;
        totalMarks: number;
    };
}

export default function TheoryBuilder({ testId, test }: TheoryBuilderProps) {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<TheoryQuestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<TheoryQuestion | null>(null);

    // Form state
    const [questionText, setQuestionText] = useState('');
    const [modelAnswer, setModelAnswer] = useState('');
    const [keywords, setKeywords] = useState<string[]>(['']);
    const [maxMarks, setMaxMarks] = useState(10);

    useEffect(() => {
        fetchQuestions();
    }, [testId]);

    const fetchQuestions = async () => {
        try {
            const data = await getTheoryQuestions(testId);
            setQuestions(data);
        } catch (error: any) {
            toast.error('Failed to load questions');
            console.error('Error fetching questions:', error);
        }
    };

    const handleKeywordChange = (index: number, value: string) => {
        const updated = [...keywords];
        updated[index] = value;
        setKeywords(updated);
    };

    const addKeyword = () => {
        setKeywords([...keywords, '']);
    };

    const removeKeyword = (index: number) => {
        setKeywords(keywords.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setQuestionText('');
        setModelAnswer('');
        setKeywords(['']);
        setMaxMarks(10);
        setEditingQuestion(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!questionText.trim() || !modelAnswer.trim()) {
            toast.error('Please fill in question and model answer');
            return;
        }

        const validKeywords = keywords.filter(k => k.trim().length > 0);
        if (validKeywords.length === 0) {
            toast.error('Please add at least one keyword');
            return;
        }

        const questionData: TheoryQuestion = {
            questionText: questionText.trim(),
            modelAnswer: modelAnswer.trim(),
            keywords: validKeywords,
            maxMarks
        };

        try {
            setLoading(true);
            if (editingQuestion && editingQuestion._id) {
                await updateTheoryQuestion(editingQuestion._id, questionData);
                toast.success('Question updated successfully!');
            } else {
                await createTheoryQuestion(testId, questionData);
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

    const handleEdit = (question: TheoryQuestion) => {
        setEditingQuestion(question);
        setQuestionText(question.questionText);
        setModelAnswer(question.modelAnswer);
        setKeywords(question.keywords.length > 0 ? question.keywords : ['']);
        setMaxMarks(question.maxMarks);
        setShowForm(true);
    };

    const handleDelete = async (questionId: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;

        try {
            await deleteTheoryQuestion(questionId);
            toast.success('Question deleted successfully!');
            fetchQuestions();
        } catch (error: any) {
            toast.error('Failed to delete question');
        }
    };

    const totalMarks = questions.reduce((sum, q) => sum + q.maxMarks, 0);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">
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
                        <Badge className="bg-purple-600">Theory Test</Badge>
                    </div>
                </div>

                {/* Add Question Button */}
                {!showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        className="mb-6 bg-purple-600 hover:bg-purple-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Theory Question
                    </Button>
                )}

                {/* Question Form */}
                {showForm && (
                    <Card className="p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingQuestion ? 'Edit Question' : 'Add New Theory Question'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Question Text */}
                            <div>
                                <Label>Question *</Label>
                                <textarea
                                    value={questionText}
                                    onChange={(e) => setQuestionText(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 min-h-[100px]"
                                    placeholder="Enter the theory question..."
                                    required
                                />
                            </div>

                            {/* Model Answer */}
                            <div>
                                <Label>Model Answer *</Label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Provide an ideal answer for reference. This will be used for evaluation.
                                </p>
                                <textarea
                                    value={modelAnswer}
                                    onChange={(e) => setModelAnswer(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 min-h-[150px]"
                                    placeholder="Enter the model answer..."
                                    required
                                />
                            </div>

                            {/* Keywords */}
                            <div>
                                <Label>Keywords * (for evaluation)</Label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Add important concepts/terms that should appear in the answer
                                </p>
                                <div className="space-y-2">
                                    {keywords.map((keyword, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                value={keyword}
                                                onChange={(e) => handleKeywordChange(index, e.target.value)}
                                                placeholder={`Keyword ${index + 1}`}
                                                className="flex-1"
                                            />
                                            {keywords.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeKeyword(index)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addKeyword}
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Keyword
                                    </Button>
                                </div>
                            </div>

                            {/* Max Marks */}
                            <div>
                                <Label>Maximum Marks *</Label>
                                <Input
                                    type="number"
                                    value={maxMarks}
                                    onChange={(e) => setMaxMarks(Number(e.target.value))}
                                    min={1}
                                    max={100}
                                    required
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-purple-600 hover:bg-purple-700"
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
                            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No theory questions added yet. Click "Add Theory Question" to get started.</p>
                        </Card>
                    ) : (
                        questions.map((question, qIndex) => (
                            <Card key={question._id} className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {qIndex + 1}. {question.questionText}
                                        </h3>
                                        <Badge className="bg-purple-600">
                                            {question.maxMarks} marks
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2">
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

                                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Model Answer:</p>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                        {question.modelAnswer}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Keywords:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {question.keywords.map((keyword, idx) => (
                                            <Badge key={idx} variant="outline" className="bg-white">
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
