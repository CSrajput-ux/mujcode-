import StudentLayout from '../../components/StudentLayout';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Send, CheckCircle2, XCircle, Clock, ArrowLeft, Save, MessageSquare, Lightbulb } from 'lucide-react';
import { Textarea } from '../../components/ui/textarea';
import apiClient from '../../services/apiClient';
import { toast } from 'sonner';

export default function ProblemSolver() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [problem, setProblem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('description');

    // Editor state
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [showInput, setShowInput] = useState(false);

    // Results state
    const [verdict, setVerdict] = useState('');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const isRunningRef = useRef(false);

    const setRunning = (val: boolean) => {
        isRunningRef.current = val;
        setIsRunning(val);
    };

    // Submissions state
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    // Editorial state
    const [feedback, setFeedback] = useState('');
    const [improvement, setImprovement] = useState('');
    const [notes, setNotes] = useState('');

    const languages = [
        { id: 'c', name: 'C', template: '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}' },
        { id: 'cpp', name: 'C++', template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}' },
        { id: 'python', name: 'Python', template: '# Your code here\n' },
        { id: 'java', name: 'Java', template: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}' },
        { id: 'javascript', name: 'JavaScript', template: '// Your code here\n' },
        { id: 'sql', name: 'SQL', template: '-- Write your SQL query here\nSELECT * FROM table_name;\n' }
    ];

    useEffect(() => {
        fetchProblem();
        // Load notes from local storage
        if (id) {
            const savedNotes = localStorage.getItem(`notes_${id}`);
            if (savedNotes) setNotes(savedNotes);
        }
    }, [id]);

    useEffect(() => {
        // Set default code template when language changes
        const lang = languages.find(l => l.id === language);
        if (lang && !code) {
            setCode(lang.template);
        }
    }, [language]);

    useEffect(() => {
        // Fetch submissions when Submissions tab is active
        if (activeTab === 'submissions') {
            fetchSubmissions();
        }
    }, [activeTab]);

    const fetchProblem = async () => {
        try {
            const res = await apiClient.get(`/api/problems/number/${id}`);
            setProblem(res.data.problem);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching problem:', error);
            setLoading(false);
        }
    };

    const fetchSubmissions = async () => {
        setLoadingSubmissions(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (!user.id) {
                setLoadingSubmissions(false);
                return;
            }

            const res = await apiClient.get(`/api/judge/submissions/${user.id}/${id}`);
            
            if (res.status === 200) {
                setSubmissions(res.data.submissions || []);
            }
            setLoadingSubmissions(false);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            setLoadingSubmissions(false);
        }
    };

    const handleRun = async () => {
        setRunning(true);
        setVerdict('Running...');
        setOutput('');
        setShowInput(true); // Switch to Test Result tab

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const res = await apiClient.post('/api/judge/submit', {
                userId: user.id,
                problemId: id,
                code,
                language,
                mode: 'run'
            });

            // Use jobId for real-time in-memory queue polling
            pollJobResult(res.data.jobId, 'run');
        } catch (error) {
            console.error('Run error:', error);
            setVerdict('Error');
            setOutput('Failed to submit code');
            setRunning(false);
        }
    };

    const handleSubmit = async () => {
        setRunning(true);
        setVerdict('Judging...');
        setOutput('');
        setShowInput(true); // Switch to Test Result tab

        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const res = await apiClient.post('/api/judge/submit', {
                userId: user.id,
                problemId: id,
                code,
                language,
                mode: 'submit'
            });

            // Use jobId for real-time in-memory queue polling
            pollJobResult(res.data.jobId, 'submit');
        } catch (error) {
            console.error('Submit error:', error);
            setVerdict('Error');
            setOutput('Failed to submit code');
            setRunning(false);
        }
    };

    /**
     * Poll /api/judge/job-status/:jobId (in-memory queue — instant updates).
     * This is faster and more reliable than polling MongoDB /status/:submissionId
     * because the Docker result is available immediately when the job completes.
     */
    const pollJobResult = async (jobId: string, mode: string = 'run') => {
        if (!jobId) {
            setVerdict('Error');
            setOutput('No job ID returned from server.');
            setRunning(false);
            return;
        }

        const interval = setInterval(async () => {
            try {
                const res = await apiClient.get(`/api/judge/job-status/${jobId}`);
                const data = res.data;

                // Job is done (done | error | rejected | timeout)
                if (data.status === 'done') {
                    clearInterval(interval);
                    const result = data.result || {};
                    setVerdict(result.verdict || 'Successful');
                    setOutput(result.output || 'No output');
                    setRunning(false);

                    if (mode === 'submit') {
                        fetchSubmissions();
                    }
                } else if (data.status === 'error' || data.status === 'rejected') {
                    clearInterval(interval);
                    setVerdict('System Error');
                    setOutput(data.error || 'Execution failed');
                    setRunning(false);
                } else if (data.status === 'timeout') {
                    clearInterval(interval);
                    setVerdict('Time Limit Exceeded');
                    setOutput('Your code exceeded the time limit.');
                    setRunning(false);
                }
                // status === 'queued' or 'running' → keep polling
            } catch (error) {
                console.error('Poll error:', error);
                clearInterval(interval);
                setVerdict('Error');
                setOutput('Failed to get result from server.');
                setRunning(false);
            }
        }, 500);

        // Safety timeout after 90 seconds (Java can be slow on first Docker start)
        const safetyTimer = setTimeout(() => {
            clearInterval(interval);
            if (isRunningRef.current) {
                setVerdict('Timeout');
                setOutput('Request timed out. The server took too long to respond.');
                setRunning(false);
            }
        }, 90000);

        // Clean up safety timer when interval clears
        const cleanup = () => clearTimeout(safetyTimer);
        // Attach cleanup to interval clearing — patch: just clear both on unmount
        return () => { clearInterval(interval); clearTimeout(safetyTimer); };
    };


    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-100 text-green-700';
            case 'Medium': return 'bg-yellow-100 text-yellow-700';
            case 'Hard': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getVerdictIcon = () => {
        if (verdict.includes('Accepted') || verdict.includes('Successful')) {
            return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        } else if (verdict.includes('Wrong') || verdict.includes('Error')) {
            return <XCircle className="w-5 h-5 text-red-500" />;
        } else {
            return <Clock className="w-5 h-5 text-yellow-500" />;
        }
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-lg text-gray-500">Loading problem...</div>
                </div>
            </StudentLayout>
        );
    }

    if (!problem) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-lg text-red-500">Problem not found</div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="h-screen flex flex-col">
                {/* Header */}
                <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="mr-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-xl font-bold">#{problem.number}. {problem.title}</h1>
                        <Badge className={getDifficultyColor(problem.difficulty)}>
                            {problem.difficulty}
                        </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={handleRun}
                            disabled={isRunning}
                            variant="outline"
                            className="flex items-center space-x-2"
                        >
                            <Play className="w-4 h-4" />
                            <span>Run</span>
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isRunning}
                            className="bg-[#FF7A00] hover:bg-[#FF6A00] flex items-center space-x-2"
                        >
                            <Send className="w-4 h-4" />
                            <span>Submit</span>
                        </Button>
                    </div>
                </div>

                {/* Main Content - Split View */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Problem Description */}
                    <div className="w-2/5 border-r bg-white overflow-y-auto">
                        {/* Tabs */}
                        <div className="border-b flex">
                            {['description', 'editorial', 'solutions', 'submissions'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-3 text-sm font-medium capitalize ${activeTab === tab
                                        ? 'border-b-2 border-[#FF7A00] text-[#FF7A00]'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {activeTab === 'description' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-lg font-semibold mb-2">Description</h2>
                                        <p className="text-gray-700 whitespace-pre-wrap">{problem.description}</p>
                                    </div>

                                    {problem.examples && problem.examples.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Examples</h3>
                                            {problem.examples.map((example: any, idx: number) => (
                                                <div key={idx} className="bg-gray-50 p-4 rounded mb-3">
                                                    <div className="mb-2">
                                                        <span className="font-medium">Input:</span>
                                                        <pre className="bg-white p-2 rounded mt-1">{example.input}</pre>
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Output:</span>
                                                        <pre className="bg-white p-2 rounded mt-1">{example.output}</pre>
                                                    </div>
                                                    {example.explanation && (
                                                        <div className="mt-2">
                                                            <span className="font-medium">Explanation:</span>
                                                            <p className="text-gray-600 mt-1">{example.explanation}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {problem.constraints && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Constraints</h3>
                                            {Array.isArray(problem.constraints) ? (
                                                <ul className="list-disc list-inside text-gray-700 space-y-1">
                                                    {problem.constraints.map((constraint: string, idx: number) => (
                                                        <li key={idx}>{constraint}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-gray-700 whitespace-pre-line">{problem.constraints}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'editorial' && (
                                <div className="space-y-8">
                                    {/* Personal Notes */}
                                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                                        <div className="flex items-center space-x-2 mb-4 text-blue-800">
                                            <Save className="w-5 h-5" />
                                            <h3 className="font-semibold text-lg">Personal Notes</h3>
                                        </div>
                                        <Textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Write your personal notes, logic, or reminders here..."
                                            className="bg-white border-blue-200 focus:border-blue-400 min-h-[150px] mb-4"
                                        />
                                        <Button
                                            onClick={() => {
                                                localStorage.setItem(`notes_${id}`, notes);
                                                toast.success("Notes saved successfully!");
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            Save Notes
                                        </Button>
                                    </div>

                                    {/* Improvement Suggestions */}
                                    <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100">
                                        <div className="flex items-center space-x-2 mb-4 text-yellow-800">
                                            <Lightbulb className="w-5 h-5" />
                                            <h3 className="font-semibold text-lg">Suggest Improvement</h3>
                                        </div>
                                        <p className="text-sm text-yellow-700 mb-3">Found an issue with the problem or test cases? Let us know!</p>
                                        <Textarea
                                            value={improvement}
                                            onChange={(e) => setImprovement(e.target.value)}
                                            placeholder="Describe the issue or improvement..."
                                            className="bg-white border-yellow-200 focus:border-yellow-400 min-h-[100px] mb-4"
                                        />
                                        <Button
                                            onClick={() => {
                                                if (!improvement.trim()) return toast.error("Please enter a suggestion");
                                                toast.success("Suggestion submitted! Thank you.");
                                                setImprovement('');
                                            }}
                                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                        >
                                            Submit Suggestion
                                        </Button>
                                    </div>

                                    {/* Feedback */}
                                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                        <div className="flex items-center space-x-2 mb-4 text-gray-800">
                                            <MessageSquare className="w-5 h-5" />
                                            <h3 className="font-semibold text-lg">Editorial Feedback</h3>
                                        </div>
                                        <Textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Was this editorial helpful? Any confusion?"
                                            className="bg-white border-gray-300 focus:border-gray-400 min-h-[100px] mb-4"
                                        />
                                        <Button
                                            onClick={() => {
                                                if (!feedback.trim()) return toast.error("Please enter feedback");
                                                toast.success("Feedback received!");
                                                setFeedback('');
                                            }}
                                            variant="outline"
                                            className="border-gray-400 text-gray-700 hover:bg-gray-100"
                                        >
                                            Submit Feedback
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'solutions' && (
                                <div className="text-center text-gray-500 py-12">
                                    Community solutions coming soon!
                                </div>
                            )}

                            {activeTab === 'submissions' && (
                                <div className="space-y-4">
                                    {loadingSubmissions ? (
                                        <div className="text-center text-gray-500 py-12">
                                            Loading submissions...
                                        </div>
                                    ) : submissions.length === 0 ? (
                                        <div className="text-center text-gray-500 py-12">
                                            No submissions yet. Submit your code to see history here!
                                        </div>
                                    ) : (
                                        submissions.map((submission: any, idx: number) => (
                                            <div key={idx} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                                                {/* Header with verdict and time */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        {submission.verdict === 'Accepted' ? (
                                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-red-500" />
                                                        )}
                                                        <span className={`font-semibold ${submission.verdict === 'Accepted' ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {submission.verdict}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            • {submission.language}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(submission.createdAt).toLocaleString()}
                                                    </span>
                                                </div>

                                                {/* Code */}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-700 mb-1">Code:</div>
                                                    <pre className="bg-gray-900 text-white p-3 rounded text-xs overflow-x-auto">
                                                        <code>{submission.code}</code>
                                                    </pre>
                                                </div>

                                                {/* Output */}
                                                {submission.output && (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-700 mb-1">Output:</div>
                                                        <pre className={`p-3 rounded text-xs whitespace-pre-wrap ${submission.verdict === 'Accepted'
                                                            ? 'bg-green-50 text-green-800'
                                                            : 'bg-red-50 text-red-800'
                                                            }`}>
                                                            {submission.output}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Code Editor */}
                    <div className="w-3/5 flex flex-col bg-gray-900">
                        {/* Editor Header */}
                        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
                            >
                                {languages.map(lang => (
                                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Code Editor - Takes 60% height */}
                        <div className="h-3/5 overflow-hidden">
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full h-full bg-gray-900 text-white p-4 font-mono text-sm resize-none focus:outline-none"
                                placeholder="Write your code here..."
                                spellCheck={false}
                            />
                        </div>

                        {/* Bottom Panel - Testcase & Test Result Tabs - 40% height */}
                        <div className="h-2/5 border-t border-gray-700 bg-gray-800 flex flex-col">
                            {/* Tabs Header */}
                            <div className="flex border-b border-gray-700">
                                <button
                                    onClick={() => setShowInput(false)}
                                    className={`px-4 py-2 text-sm font-medium ${!showInput
                                        ? 'bg-gray-900 text-green-400 border-b-2 border-green-400'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Testcase
                                </button>
                                <button
                                    onClick={() => setShowInput(true)}
                                    className={`px-4 py-2 text-sm font-medium ${showInput
                                        ? 'bg-gray-900 text-green-400 border-b-2 border-green-400'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    Test Result
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {!showInput ? (
                                    /* Testcase Tab */
                                    <div className="space-y-3">
                                        {problem?.testCases && problem.testCases.length > 0 ? (
                                            problem.testCases.slice(0, 3).map((testCase: any, idx: number) => (
                                                <div key={idx} className="bg-gray-900 rounded p-3 space-y-2">
                                                    <div className="text-gray-400 text-xs font-semibold">
                                                        Case {idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-400 text-xs mb-1">Input:</div>
                                                        <pre className="bg-gray-800 text-white text-sm p-2 rounded font-mono">
                                                            {testCase.input}
                                                        </pre>
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-400 text-xs mb-1">Expected Output:</div>
                                                        <pre className="bg-gray-800 text-white text-sm p-2 rounded font-mono">
                                                            {testCase.output}
                                                        </pre>
                                                    </div>
                                                </div>
                                            ))
                                        ) : problem?.examples && problem.examples.length > 0 ? (
                                            /* Fallback to examples if testCases not available */
                                            problem.examples.map((example: any, idx: number) => (
                                                <div key={idx} className="bg-gray-900 rounded p-3 space-y-2">
                                                    <div className="text-gray-400 text-xs font-semibold">
                                                        Case {idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-400 text-xs mb-1">Input:</div>
                                                        <pre className="bg-gray-800 text-white text-sm p-2 rounded font-mono">
                                                            {example.input}
                                                        </pre>
                                                    </div>
                                                    <div>
                                                        <div className="text-gray-400 text-xs mb-1">Expected Output:</div>
                                                        <pre className="bg-gray-800 text-white text-sm p-2 rounded font-mono">
                                                            {example.output}
                                                        </pre>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-gray-500 py-8">
                                                No test cases available
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Test Result Tab */
                                    <div className="space-y-3">
                                        {verdict ? (
                                            <div>
                                                <div className="flex items-center space-x-2 mb-3">
                                                    {getVerdictIcon()}
                                                    <span className="font-semibold text-white text-lg">{verdict}</span>
                                                </div>
                                                <div className="bg-gray-900 p-3 rounded">
                                                    <div className="text-gray-400 text-xs mb-2">Output:</div>
                                                    <pre className="text-green-400 text-sm whitespace-pre-wrap font-mono">
                                                        {output}
                                                    </pre>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-500 py-12">
                                                <p className="mb-2">You must run your code first</p>
                                                <p className="text-sm">Click the <span className="text-green-400">Run</span> button to test your code</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
