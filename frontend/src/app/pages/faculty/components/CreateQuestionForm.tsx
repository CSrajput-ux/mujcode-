import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Plus, PlusCircle, Trash2, Save } from 'lucide-react';
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import facultyActivityService from '@/app/services/facultyActivityService';

interface CreateQuestionFormProps {
    onCancel: () => void;
    onSuccess: () => void;
}

const CreateQuestionForm: React.FC<CreateQuestionFormProps> = ({ onCancel, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [type, setType] = useState('coding');
    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState('# Write your solution here\n');
    const [testCases, setTestCases] = useState([{ input: '', output: '', isSample: true }]);
    const [runResult, setRunResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [running, setRunning] = useState(false);

    const handleAddTestCase = () => {
        setTestCases([...testCases, { input: '', output: '', isSample: false }]);
    };

    const handleRemoveTestCase = (index: number) => {
        setTestCases(testCases.filter((_, i) => i !== index));
    };

    const handleTestCaseChange = (index: number, field: 'input' | 'output', value: string) => {
        const newTestCases = [...testCases];
        newTestCases[index][field] = value;
        setTestCases(newTestCases);
    };

    const handleRunCode = async () => {
        if (!code) return toast.error("Please write some code to run.");
        setRunning(true);
        setRunResult(null);
        try {
            // For Dry Run, we send the first test case or all
            // The backend dry-run endpoint currently expects 'testCases' array and uses 0th index
            const res = await facultyActivityService.runCode({
                code,
                language,
                testCases: testCases
            });

            if (res.success) {
                // Poll for result
                const submissionId = res.submissionId;
                let attempts = 0;
                const pollInterval = setInterval(async () => {
                    attempts++;
                    try {
                        const subRes = await facultyActivityService.getSubmissionResult(submissionId);
                        if (subRes.success && subRes.data.verdict !== 'Pending') {
                            clearInterval(pollInterval);
                            setRunResult(subRes.data);
                            setRunning(false);
                            if (subRes.data.verdict === 'Run Successful' || subRes.data.verdict === 'Accepted') {
                                toast.success(`Run Complete: ${subRes.data.verdict}`);
                            } else {
                                toast.error(`Run Failed: ${subRes.data.verdict}`);
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }

                    if (attempts > 20) { // 20 * 1s = 20s timeout
                        clearInterval(pollInterval);
                        setRunning(false);
                        toast.error("Run timed out.");
                    }
                }, 1000);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to start run.");
            setRunning(false);
        }
    };

    const handleSubmit = async () => {
        if (!title || !description) return toast.error("Title and Description are required.");

        setLoading(true);
        try {
            await facultyActivityService.createQuestion({
                title,
                description,
                difficulty,
                type,
                topic,
                languages: type === 'coding' ? [language] : [], // Simplified for single lang support initially
                testCases: type === 'coding' ? testCases : [],
                defaultCode: type === 'coding' ? [{ language, code }] : []
            });
            toast.success("Question created successfully!");
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create question.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            {/* Left Column: Form Details */}
            <Card className="overflow-y-auto">
                <CardHeader>
                    <CardTitle>Create New Question</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} placeholder="Question Title" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Difficulty</Label>
                            <Select value={difficulty} onValueChange={setDifficulty}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Easy">Easy</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="coding">Coding</SelectItem>
                                    <SelectItem value="theory">Theory</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Topic</Label>
                        <Input value={topic} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)} placeholder="e.g. Arrays, Strings" />
                    </div>

                    <div className="space-y-2">
                        <Label>Description (Markdown)</Label>
                        <Textarea
                            className="min-h-[200px] font-mono"
                            value={description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                            placeholder="# Problem Description..."
                        />
                    </div>

                    {type === 'coding' && (
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="font-semibold">Test Cases</h3>
                            {testCases.map((tc, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 rounded-lg space-y-2 relative">
                                    <div className="absolute top-2 right-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveTestCase(idx)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs">Input</Label>
                                            <Textarea value={tc.input} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleTestCaseChange(idx, 'input', e.target.value)} className="h-20" />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Expected Output</Label>
                                            <Textarea value={tc.output} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleTestCaseChange(idx, 'output', e.target.value)} className="h-20" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={handleAddTestCase} className="w-full">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Test Case
                            </Button>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Publishing...' : 'Publish Question'}
                    </Button>
                </CardFooter>
            </Card>

            {/* Right Column: Code Editor (Only for Coding) */}
            {type === 'coding' && (
                <Card className="flex flex-col h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Solution Sandbox</CardTitle>
                        <div className="flex items-center gap-2">
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="python">Python</SelectItem>
                                    <SelectItem value="javascript">JavaScript</SelectItem>
                                    <SelectItem value="c">C</SelectItem>
                                    <SelectItem value="cpp">C++</SelectItem>
                                    <SelectItem value="java">Java</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="sm" onClick={handleRunCode} disabled={running} className="bg-orange-600 hover:bg-orange-700">
                                <PlusCircle className="w-4 h-4 mr-2" />
                                {running ? 'Running...' : 'Run Code'}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow p-0 relative">
                        <Editor
                            height="100%"
                            defaultLanguage="python"
                            language={language}
                            theme="vs-dark"
                            value={code}
                            onChange={(value) => setCode(value || '')}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                padding: { top: 16 }
                            }}
                        />
                    </CardContent>
                    {runResult && (
                        <div className="p-4 bg-black text-white font-mono text-sm max-h-[200px] overflow-auto border-t border-gray-800">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`font-bold ${runResult.verdict.includes('Success') || runResult.verdict === 'Accepted' ? 'text-green-400' : 'text-red-400'}`}>
                                    {runResult.verdict}
                                </span>
                                <span className="text-gray-500 text-xs">{(runResult.executionTime || 0)}ms</span>
                            </div>
                            <pre className="whitespace-pre-wrap text-gray-300">{runResult.output}</pre>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default CreateQuestionForm;
