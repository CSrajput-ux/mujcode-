import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2, Edit, Code2 } from 'lucide-react';
import { toast } from 'sonner';
import Editor from '@monaco-editor/react';
import {
    CodingQuestion,
    createCodingQuestion,
    getCodingQuestions,
    updateCodingQuestion,
    deleteCodingQuestion
} from '../../../services/testBuilderService';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../../components/ui/select';

interface CodingBuilderProps {
    testId: string;
    test: {
        title: string;
        duration: number;
        totalMarks: number;
    };
}

const LANGUAGES = [
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'javascript', label: 'JavaScript' }
];

const STARTER_CODE_TEMPLATES: { [key: string]: string } = {
    python: '# Write your solution here\ndef solve():\n    pass\n',
    java: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n',
    cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
    c: '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n',
    javascript: '// Write your solution here\nfunction solve() {\n    \n}\n'
};

export default function CodingBuilder({ testId, test }: CodingBuilderProps) {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<CodingQuestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<CodingQuestion | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [problemStatement, setProblemStatement] = useState('');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [allowedLanguages, setAllowedLanguages] = useState<string[]>(['python']);
    const [currentLanguage, setCurrentLanguage] = useState('python');
    const [starterCode, setStarterCode] = useState<{ language: string; code: string }[]>([
        { language: 'python', code: STARTER_CODE_TEMPLATES.python }
    ]);
    const [testCases, setTestCases] = useState<{
        input: string;
        expectedOutput: string;
        marks: number;
        isHidden: boolean;
        explanation?: string;
    }[]>([{ input: '', expectedOutput: '', marks: 1, isHidden: true }]);
    const [timeLimit, setTimeLimit] = useState(5);
    const [memoryLimit, setMemoryLimit] = useState(256);

    useEffect(() => {
        fetchQuestions();
    }, [testId]);

    const fetchQuestions = async () => {
        try {
            const data = await getCodingQuestions(testId);
            setQuestions(data);
        } catch (error: any) {
            toast.error('Failed to load questions');
            console.error('Error fetching questions:', error);
        }
    };

    const handleLanguageToggle = (lang: string) => {
        if (allowedLanguages.includes(lang)) {
            // Remove language
            setAllowedLanguages(allowedLanguages.filter(l => l !== lang));
            setStarterCode(starterCode.filter(sc => sc.language !== lang));
            if (currentLanguage === lang && allowedLanguages.length > 1) {
                setCurrentLanguage(allowedLanguages.find(l => l !== lang) || 'python');
            }
        } else {
            // Add language
            setAllowedLanguages([...allowedLanguages, lang]);
            setStarterCode([...starterCode, { language: lang, code: STARTER_CODE_TEMPLATES[lang] }]);
        }
    };

    const handleStarterCodeChange = (code: string | undefined) => {
        const updatedStarterCode = starterCode.map(sc =>
            sc.language === currentLanguage ? { ...sc, code: code || '' } : sc
        );
        setStarterCode(updatedStarterCode);
    };

    const addTestCase = () => {
        setTestCases([...testCases, { input: '', expectedOutput: '', marks: 1, isHidden: true }]);
    };

    const removeTestCase = (index: number) => {
        setTestCases(testCases.filter((_, i) => i !== index));
    };

    const updateTestCase = (index: number, field: string, value: any) => {
        const updated = testCases.map((tc, i) =>
            i === index ? { ...tc, [field]: value } : tc
        );
        setTestCases(updated);
    };

    const resetForm = () => {
        setTitle('');
        setProblemStatement('');
        setDifficulty('Medium');
        setAllowedLanguages(['python']);
        setCurrentLanguage('python');
        setStarterCode([{ language: 'python', code: STARTER_CODE_TEMPLATES.python }]);
        setTestCases([{ input: '', expectedOutput: '', marks: 1, isHidden: true }]);
        setTimeLimit(5);
        setMemoryLimit(256);
        setEditingQuestion(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !problemStatement.trim()) {
            toast.error('Please fill in title and problem statement');
            return;
        }

        if (allowedLanguages.length === 0) {
            toast.error('Please select at least one language');
            return;
        }

        if (testCases.length === 0 || testCases.some(tc => !tc.input || !tc.expectedOutput)) {
            toast.error('Please add valid test cases');
            return;
        }

        const totalMarks = testCases.reduce((sum, tc) => sum + tc.marks, 0);

        const questionData: CodingQuestion = {
            title: title.trim(),
            problemStatement: problemStatement.trim(),
            difficulty,
            allowedLanguages,
            starterCode,
            testCases,
            totalMarks,
            timeLimit,
            memoryLimit
        };

        try {
            setLoading(true);
            if (editingQuestion && editingQuestion._id) {
                await updateCodingQuestion(editingQuestion._id, questionData);
                toast.success('Question updated successfully!');
            } else {
                await createCodingQuestion(testId, questionData);
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

    const handleEdit = (question: CodingQuestion) => {
        setEditingQuestion(question);
        setTitle(question.title);
        setProblemStatement(question.problemStatement);
        setDifficulty(question.difficulty);
        setAllowedLanguages(question.allowedLanguages);
        setCurrentLanguage(question.allowedLanguages[0]);
        setStarterCode(question.starterCode);
        setTestCases(question.testCases);
        setTimeLimit(question.timeLimit);
        setMemoryLimit(question.memoryLimit);
        setShowForm(true);
    };

    const handleDelete = async (questionId: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;

        try {
            await deleteCodingQuestion(questionId);
            toast.success('Question deleted successfully!');
            fetchQuestions();
        } catch (error: any) {
            toast.error('Failed to delete question');
        }
    };

    const totalMarks = questions.reduce((sum, q) => sum + q.totalMarks, 0);
    const currentStarterCode = starterCode.find(sc => sc.language === currentLanguage)?.code || '';

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
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
                        <Badge className="bg-blue-600">Coding Test</Badge>
                    </div>
                </div>

                {/* Add Question Button */}
                {!showForm && (
                    <Button
                        onClick={() => setShowForm(true)}
                        className="mb-6 bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Coding Question
                    </Button>
                )}

                {/* Question Form */}
                {showForm && (
                    <Card className="p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingQuestion ? 'Edit Question' : 'Add New Coding Question'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title */}
                            <div>
                                <Label>Question Title *</Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Two Sum Problem"
                                    required
                                />
                            </div>

                            {/* Difficulty */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>Difficulty</Label>
                                    <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Easy">Easy</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="Hard">Hard</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Time Limit (seconds)</Label>
                                    <Input
                                        type="number"
                                        value={timeLimit}
                                        onChange={(e) => setTimeLimit(Number(e.target.value))}
                                        min={1}
                                        max={30}
                                    />
                                </div>
                                <div>
                                    <Label>Memory Limit (MB)</Label>
                                    <Input
                                        type="number"
                                        value={memoryLimit}
                                        onChange={(e) => setMemoryLimit(Number(e.target.value))}
                                        min={64}
                                        max={1024}
                                    />
                                </div>
                            </div>

                            {/* Problem Statement */}
                            <div>
                                <Label>Problem Statement *</Label>
                                <textarea
                                    value={problemStatement}
                                    onChange={(e) => setProblemStatement(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                                    placeholder="Describe the problem, include examples, constraints, etc."
                                    required
                                />
                            </div>

                            {/* Allowed Languages */}
                            <div>
                                <Label>Allowed Languages *</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {LANGUAGES.map(lang => (
                                        <button
                                            key={lang.value}
                                            type="button"
                                            onClick={() => handleLanguageToggle(lang.value)}
                                            className={`px-4 py-2 rounded-lg border-2 transition-all ${allowedLanguages.includes(lang.value)
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Starter Code */}
                            <div>
                                <Label>Starter Code</Label>
                                <div className="flex gap-2 mb-2">
                                    {allowedLanguages.map(lang => (
                                        <button
                                            key={lang}
                                            type="button"
                                            onClick={() => setCurrentLanguage(lang)}
                                            className={`px-3 py-1 rounded text-sm ${currentLanguage === lang
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-700'
                                                }`}
                                        >
                                            {LANGUAGES.find(l => l.value === lang)?.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="border border-gray-300 rounded-lg overflow-hidden">
                                    <Editor
                                        height="200px"
                                        language={currentLanguage === 'cpp' ? 'cpp' : currentLanguage}
                                        value={currentStarterCode}
                                        onChange={handleStarterCodeChange}
                                        theme="vs-light"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            lineNumbers: 'on',
                                            scrollBeyondLastLine: false
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Test Cases */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <Label>Test Cases *</Label>
                                    <Button type="button" size="sm" onClick={addTestCase}>
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add Test Case
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {testCases.map((tc, index) => (
                                        <Card key={index} className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <h4 className="font-medium">Test Case {index + 1}</h4>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeTestCase(index)}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label>Input</Label>
                                                    <textarea
                                                        value={tc.input}
                                                        onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        rows={2}
                                                        placeholder="Input data"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Expected Output</Label>
                                                    <textarea
                                                        value={tc.expectedOutput}
                                                        onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                        rows={2}
                                                        placeholder="Expected output"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mt-3">
                                                <div>
                                                    <Label>Marks</Label>
                                                    <Input
                                                        type="number"
                                                        value={tc.marks}
                                                        onChange={(e) => updateTestCase(index, 'marks', Number(e.target.value))}
                                                        min={1}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Visibility</Label>
                                                    <Select
                                                        value={tc.isHidden ? 'hidden' : 'visible'}
                                                        onValueChange={(v) => updateTestCase(index, 'isHidden', v === 'hidden')}
                                                    >
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="visible">Visible to Students</SelectItem>
                                                            <SelectItem value="hidden">Hidden (Judge Only)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700"
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
                            <Code2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No coding questions added yet. Click "Add Coding Question" to get started.</p>
                        </Card>
                    ) : (
                        questions.map((question, qIndex) => (
                            <Card key={question._id} className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {qIndex + 1}. {question.title}
                                        </h3>
                                        <div className="flex gap-2 mt-2">
                                            <Badge className={
                                                question.difficulty === 'Easy' ? 'bg-green-600' :
                                                    question.difficulty === 'Medium' ? 'bg-yellow-600' :
                                                        'bg-red-600'
                                            }>
                                                {question.difficulty}
                                            </Badge>
                                            <Badge>{question.totalMarks} marks</Badge>
                                            <Badge>{question.testCases.length} test cases</Badge>
                                        </div>
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

                                <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                                    {question.problemStatement}
                                </p>

                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span>Languages: {question.allowedLanguages.join(', ')}</span>
                                    <span>•</span>
                                    <span>Time: {question.timeLimit}s</span>
                                    <span>•</span>
                                    <span>Memory: {question.memoryLimit}MB</span>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
