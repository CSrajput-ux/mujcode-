import StudentLayout from '../../components/StudentLayout';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Send, CheckCircle2, XCircle, Clock, ArrowLeft, Save, MessageSquare, Lightbulb, Copy, Check } from 'lucide-react';
import { Textarea } from '../../components/ui/textarea';
import apiClient from '../../services/apiClient';
import LocalCompilerWidget from '../../components/LocalCompilerWidget';
import { toast } from 'sonner';

function renderFormattedText(text?: string) {
    if (!text) return null;
    const parts = text.split(/(`[^`]+`)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
                    const code = part.slice(1, -1);
                    return (
                        <code
                            key={i}
                            className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-[#27272a] text-[#f47067] font-mono text-xs border border-zinc-700/50"
                        >
                            {code}
                        </code>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

export default function ProblemSolver() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [problem, setProblem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('description');
    const [copiedExample, setCopiedExample] = useState(false);

    // Editor state
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [showInput, setShowInput] = useState(false);
    const [useLocalAgent, setUseLocalAgent] = useState(true);

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
    const [execMetrics, setExecMetrics] = useState<{ time?: string; memory?: string }>({});

    const languages = [
        { id: 'c', name: 'C', template: '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}' },
        { id: 'cpp', name: 'C++', template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}' },
        { id: 'java', name: 'Java', template: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}' },
        { id: 'python', name: 'Python', template: '# Your code here\n' },
        { id: 'javascript', name: 'JavaScript', template: '// Your code here\n' },
        { id: 'go', name: 'Go', template: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Your code here\n    fmt.Println("Hello, World!")\n}' },
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
            const prob = res.data.problem;
            setProblem(prob);
            if (prob?.category === 'C' || prob?.courseId?.includes('c_')) {
                setLanguage('c');
                const cTemplate = languages.find(l => l.id === 'c')?.template || '';
                if (!code) setCode(cTemplate);
            }
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
                mode: 'run',
                useLocalAgent
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
                    if (result.executionTime || result.memory) {
                        setExecMetrics({
                            time: result.executionTime,
                            memory: result.memory
                        });
                    } else {
                        setExecMetrics({});
                    }
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
        // Attach cleanup to interval clearing — patch: just clear both on unmount
        return () => { clearInterval(interval); clearTimeout(safetyTimer); };
    };


    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60';
            case 'medium': return 'bg-amber-950/80 text-amber-400 border border-amber-800/60';
            case 'hard': return 'bg-rose-950/80 text-rose-400 border border-rose-800/60';
            default: return 'bg-zinc-800 text-zinc-300 border border-zinc-700';
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

    const handleCopyExample = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedExample(true);
        setTimeout(() => setCopiedExample(false), 2000);
        toast.success("Example copied to clipboard!");
    };

    if (loading) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center h-screen bg-[#121316]">
                    <div className="text-lg text-zinc-400 font-serif">Loading problem...</div>
                </div>
            </StudentLayout>
        );
    }

    if (!problem) {
        return (
            <StudentLayout>
                <div className="flex items-center justify-center h-screen bg-[#121316]">
                    <div className="text-lg text-rose-400 font-serif">Problem not found</div>
                </div>
            </StudentLayout>
        );
    }

    const exampleContent = problem?.example || (
        problem?.sampleInput || problem?.sampleOutput 
            ? `${problem.sampleInput ? `Input:\n${problem.sampleInput}\n\n` : ''}Output:\n${problem.sampleOutput || ''}`.trim()
            : (problem?.examples && problem.examples[0] 
                ? `${problem.examples[0].input ? `Input:\n${problem.examples[0].input}\n\n` : ''}Output:\n${problem.examples[0].output}`.trim() 
                : '')
    );

    const displayTestCases = (problem?.testCases && problem.testCases.length > 0)
        ? problem.testCases
        : ((problem?.examples && problem.examples.length > 0)
            ? problem.examples.map((ex: any) => ({ input: ex.input, expectedOutput: ex.output }))
            : (problem?.sampleOutput ? [{ input: problem.sampleInput || '', expectedOutput: problem.sampleOutput }] : []));

    const questionHeading = problem?.questionIndex 
        ? `Question ${problem.questionIndex}: ${problem.title}`
        : (problem?.number >= 3001 && problem?.number <= 3150 
            ? `Question ${((problem.number - 3001) % 10) + 1}: ${problem.title}`
            : `Question ${problem?.number}: ${problem?.title}`);

    return (
        <StudentLayout>
            <div className="h-screen flex flex-col bg-[#121316]">
                {/* Header */}
                <div className="bg-[#121316] border-b border-zinc-800 px-6 py-3 flex items-center justify-between text-white flex-shrink-0">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="mr-2 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-xl font-bold text-white">#{problem.number}. {problem.title}</h1>
                        <Badge className={getDifficultyColor(problem.difficulty)}>
                            {problem.difficulty}
                        </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                        <LocalCompilerWidget
                            useLocalAgent={useLocalAgent}
                            onToggleUseLocalAgent={setUseLocalAgent}
                        />
                        <Button
                            onClick={handleRun}
                            disabled={isRunning}
                            variant="outline"
                            className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white flex items-center space-x-2"
                        >
                            <Play className="w-4 h-4 text-emerald-400" />
                            <span>Run</span>
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isRunning}
                            className="bg-[#FF7A00] hover:bg-[#FF6A00] text-white flex items-center space-x-2 font-medium"
                        >
                            <Send className="w-4 h-4" />
                            <span>Submit</span>
                        </Button>
                    </div>
                </div>

                {/* Main Content - Split View */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Problem Description */}
                    <div className="w-2/5 md:w-[45%] border-r border-zinc-800 bg-[#141518] flex flex-col overflow-hidden text-zinc-200">
                        {/* Tabs */}
                        <div className="border-b border-zinc-800 bg-[#121316] flex flex-shrink-0 px-2">
                            {['description', 'editorial', 'solutions', 'submissions'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${activeTab === tab
                                        ? 'border-b-2 border-[#FF7A00] text-white font-semibold'
                                        : 'text-zinc-400 hover:text-zinc-200'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#141518]">
                            {activeTab === 'description' && (
                                <div className="space-y-6 font-serif text-[#e4e4e7]">
                                    {/* Question Title */}
                                    <h2 className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight">
                                        {questionHeading}
                                    </h2>

                                    {/* Difficulty */}
                                    <div className="text-sm md:text-base text-zinc-300 font-serif">
                                        <strong className="font-bold text-white">Difficulty:</strong>{' '}
                                        <span className="font-normal text-zinc-300">{problem.difficulty}</span>
                                    </div>

                                    {/* Problem Description */}
                                    <div className="text-sm md:text-base leading-relaxed text-zinc-300 font-serif">
                                        <strong className="font-bold text-white">Problem Description:</strong>{' '}
                                        <span>{renderFormattedText(problem.description)}</span>
                                    </div>

                                    {/* Input Format */}
                                    {problem.inputFormat && (
                                        <div className="text-sm md:text-base leading-relaxed text-zinc-300 font-serif">
                                            <strong className="font-bold text-white">Input Format:</strong>{' '}
                                            <span>{renderFormattedText(problem.inputFormat)}</span>
                                        </div>
                                    )}

                                    {/* Output Format */}
                                    {problem.outputFormat && (
                                        <div className="text-sm md:text-base leading-relaxed text-zinc-300 font-serif">
                                            <strong className="font-bold text-white">Output Format:</strong>{' '}
                                            <span>{renderFormattedText(problem.outputFormat)}</span>
                                        </div>
                                    )}

                                    {/* Constraints */}
                                    {problem.constraints && (
                                        <div className="text-sm md:text-base leading-relaxed text-zinc-300 font-serif">
                                            <strong className="font-bold text-white">Constraints:</strong>{' '}
                                            <span>{renderFormattedText(Array.isArray(problem.constraints) ? problem.constraints.join(', ') : problem.constraints)}</span>
                                        </div>
                                    )}

                                    {/* Example Block with Copy Button */}
                                    {exampleContent && (
                                        <div className="space-y-2 font-serif">
                                            <strong className="font-bold text-white text-sm md:text-base block">Example:</strong>
                                            <div className="relative bg-[#191a1e] border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-200">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyExample(exampleContent)}
                                                    className="absolute top-3 right-3 p-1.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                                    title="Copy example"
                                                >
                                                    {copiedExample ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                                <pre className="font-mono text-xs md:text-sm whitespace-pre-wrap leading-relaxed text-zinc-200 pr-8">
                                                    {exampleContent}
                                                </pre>
                                            </div>
                                        </div>
                                    )}

                                    {/* Test Cases Table */}
                                    {displayTestCases.length > 0 && (
                                        <div className="space-y-3 font-serif">
                                            <strong className="font-bold text-white text-sm md:text-base block">Test Cases:</strong>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left font-serif text-sm border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-zinc-700/60 text-white font-bold">
                                                            <th className="py-2.5 pr-4 font-bold text-xs md:text-sm w-10">#</th>
                                                            <th className="py-2.5 px-4 font-bold text-xs md:text-sm">Input</th>
                                                            <th className="py-2.5 pl-4 font-bold text-xs md:text-sm">Expected Output</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-800/60">
                                                        {displayTestCases.map((tc: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-zinc-800/20">
                                                                <td className="py-3 pr-4 text-zinc-300 font-serif text-xs md:text-sm align-middle">
                                                                    {idx + 1}
                                                                </td>
                                                                <td className="py-3 px-4 align-middle">
                                                                    {tc.input && tc.input !== '(none)' && tc.input !== 'none' ? (
                                                                        <code className="inline-block px-2 py-0.5 rounded bg-[#27272a] text-[#f47067] font-mono text-xs border border-zinc-700/50 whitespace-pre">
                                                                            {tc.input}
                                                                        </code>
                                                                    ) : (
                                                                        <span className="text-zinc-500 italic text-xs font-mono">(none)</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-3 pl-4 align-middle">
                                                                    <code className="inline-block px-2 py-0.5 rounded bg-[#27272a] text-[#f47067] font-mono text-xs border border-zinc-700/50 whitespace-pre">
                                                                        {tc.expectedOutput || tc.output}
                                                                    </code>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Hint */}
                                    {problem.hint && (
                                        <div className="text-sm md:text-base leading-relaxed text-zinc-300 font-serif pt-1">
                                            <strong className="font-bold text-white">Hint:</strong>{' '}
                                            <span>{renderFormattedText(problem.hint)}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'editorial' && (
                                <div className="space-y-6 text-zinc-200">
                                    {/* Personal Notes */}
                                    <div className="bg-[#18191d] p-6 rounded-lg border border-zinc-800">
                                        <div className="flex items-center space-x-2 mb-4 text-blue-400">
                                            <Save className="w-5 h-5" />
                                            <h3 className="font-semibold text-lg text-white">Personal Notes</h3>
                                        </div>
                                        <Textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Write your personal notes, logic, or reminders here..."
                                            className="bg-[#121316] border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-400 min-h-[150px] mb-4"
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
                                    <div className="bg-[#18191d] p-6 rounded-lg border border-zinc-800">
                                        <div className="flex items-center space-x-2 mb-4 text-amber-400">
                                            <Lightbulb className="w-5 h-5" />
                                            <h3 className="font-semibold text-lg text-white">Suggest Improvement</h3>
                                        </div>
                                        <p className="text-sm text-zinc-400 mb-3">Found an issue with the problem or test cases? Let us know!</p>
                                        <Textarea
                                            value={improvement}
                                            onChange={(e) => setImprovement(e.target.value)}
                                            placeholder="Describe the issue or improvement..."
                                            className="bg-[#121316] border-zinc-700 text-white placeholder-zinc-500 focus:border-amber-400 min-h-[100px] mb-4"
                                        />
                                        <Button
                                            onClick={() => {
                                                if (!improvement.trim()) return toast.error("Please enter a suggestion");
                                                toast.success("Suggestion submitted! Thank you.");
                                                setImprovement('');
                                            }}
                                            className="bg-amber-600 hover:bg-amber-700 text-white"
                                        >
                                            Submit Suggestion
                                        </Button>
                                    </div>

                                    {/* Feedback */}
                                    <div className="bg-[#18191d] p-6 rounded-lg border border-zinc-800">
                                        <div className="flex items-center space-x-2 mb-4 text-zinc-300">
                                            <MessageSquare className="w-5 h-5" />
                                            <h3 className="font-semibold text-lg text-white">Editorial Feedback</h3>
                                        </div>
                                        <Textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Was this editorial helpful? Any confusion?"
                                            className="bg-[#121316] border-zinc-700 text-white placeholder-zinc-500 focus:border-zinc-500 min-h-[100px] mb-4"
                                        />
                                        <Button
                                            onClick={() => {
                                                if (!feedback.trim()) return toast.error("Please enter feedback");
                                                toast.success("Feedback received!");
                                                setFeedback('');
                                            }}
                                            variant="outline"
                                            className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white"
                                        >
                                            Submit Feedback
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'solutions' && (
                                <div className="text-center text-zinc-400 py-12">
                                    Community solutions coming soon!
                                </div>
                            )}

                            {activeTab === 'submissions' && (
                                <div className="space-y-4">
                                    {loadingSubmissions ? (
                                        <div className="text-center text-zinc-400 py-12">
                                            Loading submissions...
                                        </div>
                                    ) : submissions.length === 0 ? (
                                        <div className="text-center text-zinc-400 py-12">
                                            No submissions yet. Submit your code to see history here!
                                        </div>
                                    ) : (
                                        submissions.map((submission: any, idx: number) => (
                                            <div key={idx} className="border border-zinc-800 rounded-lg p-4 bg-[#18191d] space-y-3">
                                                {/* Header with verdict and time */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        {submission.verdict === 'Accepted' ? (
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-rose-400" />
                                                        )}
                                                        <span className={`font-semibold ${submission.verdict === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {submission.verdict}
                                                        </span>
                                                        <span className="text-sm text-zinc-400">
                                                            • {submission.language}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-zinc-500">
                                                        {new Date(submission.createdAt).toLocaleString()}
                                                    </span>
                                                </div>

                                                {/* Code */}
                                                <div>
                                                    <div className="text-sm font-medium text-zinc-300 mb-1">Code:</div>
                                                    <pre className="bg-[#121316] border border-zinc-800 text-zinc-200 p-3 rounded text-xs overflow-x-auto">
                                                        <code>{submission.code}</code>
                                                    </pre>
                                                </div>

                                                {/* Output */}
                                                {submission.output && (
                                                    <div>
                                                        <div className="text-sm font-medium text-zinc-300 mb-1">Output:</div>
                                                        <pre className={`p-3 rounded text-xs whitespace-pre-wrap border ${submission.verdict === 'Accepted'
                                                            ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                                                            : 'bg-rose-950/40 border-rose-900/60 text-rose-300'
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
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center space-x-2">
                                                        {getVerdictIcon()}
                                                        <span className="font-semibold text-white text-lg">{verdict}</span>
                                                    </div>
                                                    {(execMetrics.time || execMetrics.memory) && (
                                                        <div className="flex items-center space-x-3 text-xs text-gray-300">
                                                            {execMetrics.time && (
                                                                <span className="bg-gray-700 px-2.5 py-1 rounded font-mono">
                                                                    ⏱️ Time: {execMetrics.time}
                                                                </span>
                                                            )}
                                                            {execMetrics.memory && (
                                                                <span className="bg-gray-700 px-2.5 py-1 rounded font-mono">
                                                                    💾 Memory: {execMetrics.memory}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
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
