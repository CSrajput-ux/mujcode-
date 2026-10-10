import { useState, useEffect } from 'react';
import FilterBar from '../../components/faculty/FilterBar';
import AssignmentCard from '../../components/faculty/AssignmentCard';
import AssignmentSubmissionTable from '../../components/faculty/AssignmentSubmissionTable';
import CreateAssignmentModal from '../../components/faculty/CreateAssignmentModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Download, Trash2, FileText, ExternalLink, Award, CheckCircle, Clock } from 'lucide-react';
import { 
    getFacultyAssignments, 
    getAssignmentSubmissions, 
    deleteAssignment, 
    gradeSubmission, 
    Assignment, 
    Submission 
} from '../../services/facultyAssignmentService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { generateAssignmentReportPDF } from '../../utils/generateAssignmentReportPDF';

function resolveFileUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
    return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function FacultyAssignments() {
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // Grading Modal State
    const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
    const [gradeMarks, setGradeMarks] = useState<string>('');
    const [gradeFeedback, setGradeFeedback] = useState<string>('');
    const [gradingLoading, setGradingLoading] = useState(false);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const data = await getFacultyAssignments();
            setAssignments(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load assignments");
        } finally {
            setLoading(false);
        }
    };

    const handleViewSubmissions = async (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setViewMode('details');
        try {
            const subs = await getAssignmentSubmissions(assignment._id);
            setSubmissions(subs);
        } catch (error) {
            toast.error("Failed to load submissions");
        }
    };

    const handleDeleteAssignment = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this assignment?")) {
            return;
        }
        try {
            await deleteAssignment(id);
            toast.success("Assignment deleted successfully");
            setAssignments(prev => prev.filter(a => a._id !== id));
            if (selectedAssignment?._id === id) {
                handleBackToList();
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete assignment");
        }
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedAssignment(null);
        setSubmissions([]);
    };

    const handleDownloadReport = () => {
        if (!selectedAssignment) {
            toast.info("Please select an assignment first to download its detailed evaluation report.");
            return;
        }

        let facultyName = 'Faculty Instructor';
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                facultyName = parsed.name || parsed.fullName || parsed.email || 'Faculty Instructor';
            }
        } catch {}

        try {
            toast.loading("Generating Manipal University Jaipur PDF Report...", { id: "report-gen" });
            generateAssignmentReportPDF({
                assignment: selectedAssignment,
                submissions: submissions,
                facultyName: facultyName
            });
            toast.success("MUJ Evaluation Report downloaded successfully!", { id: "report-gen" });
        } catch (err: any) {
            console.error('Failed to generate PDF report:', err);
            toast.error("Failed to generate PDF report.", { id: "report-gen" });
        }
    };

    const handleOpenGradeModal = (sub: Submission) => {
        setGradingSubmission(sub);
        setGradeMarks(sub.marks !== undefined ? String(sub.marks) : (sub.score !== undefined ? String(sub.score) : ''));
        setGradeFeedback(sub.feedback || '');
    };

    const handleSaveGrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gradingSubmission) return;

        const marksNum = Number(gradeMarks);
        if (gradeMarks === '' || isNaN(marksNum) || marksNum < 0) {
            toast.error("Please enter a valid marks score (0 or greater).");
            return;
        }

        const maxMarks = selectedAssignment?.totalMarks || 100;
        if (marksNum > maxMarks) {
            toast.error(`Marks cannot exceed maximum marks (${maxMarks}).`);
            return;
        }

        try {
            setGradingLoading(true);
            await gradeSubmission(gradingSubmission._id, marksNum, gradeFeedback);
            toast.success(`Marks submitted for ${gradingSubmission.studentName}!`);

            // Update submissions list
            setSubmissions(prev => prev.map(s => s._id === gradingSubmission._id ? {
                ...s,
                marks: marksNum,
                score: marksNum,
                feedback: gradeFeedback,
                status: 'Graded'
            } : s));

            setGradingSubmission(null);
        } catch (err: any) {
            console.error('Failed to grade submission:', err);
            toast.error(err.response?.data?.error || "Failed to submit marks.");
        } finally {
            setGradingLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    // Filter assignments by type
    const assignmentList = assignments.filter(a => a.type === 'Assignment');
    const caseStudies = assignments.filter(a => a.type === 'CaseStudy');
    const researchWork = assignments.filter(a => a.type === 'Research');
    const otherWork = assignments.filter(a => a.type === 'Other');

    return (
        <div className="space-y-6">
            {viewMode === 'list' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Assignments & Tasks</h1>
                            <p className="text-sm text-gray-500 mt-1">Track assignments, case studies, and research work.</p>
                        </div>

                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="bg-[#FF7A00] hover:bg-[#FF6A00] text-sm font-semibold h-10 px-5 flex items-center gap-2 shadow-xs self-start sm:self-auto cursor-pointer"
                        >
                            Create Assignment / Task
                        </Button>
                    </div>

                    <FilterBar
                        onSearchChange={(val) => console.log(val)}
                        onDownload={handleDownloadReport}
                    />

                    <CreateAssignmentModal open={createModalOpen} onOpenChange={setCreateModalOpen} onCreated={fetchAssignments} />

                    <Tabs defaultValue="assignments" className="space-y-6">
                        <TabsList className="bg-gray-100 p-1 h-10 rounded-lg w-full max-w-2xl grid grid-cols-4">
                            <TabsTrigger value="assignments" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white text-sm font-medium rounded-md">Assignments</TabsTrigger>
                            <TabsTrigger value="casestudies" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white text-sm font-medium rounded-md">Case Studies</TabsTrigger>
                            <TabsTrigger value="research" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white text-sm font-medium rounded-md">Research Work</TabsTrigger>
                            <TabsTrigger value="other" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white text-sm font-medium rounded-md">Other</TabsTrigger>
                        </TabsList>

                        <TabsContent value="assignments" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {assignmentList.map(a => (
                                    <AssignmentCard
                                        key={a._id}
                                        assignment={a}
                                        onViewSubmissions={handleViewSubmissions}
                                        onDelete={handleDeleteAssignment}
                                    />
                                ))}
                                {assignmentList.length === 0 && <p className="text-gray-500 col-span-3">No assignments found.</p>}
                            </div>
                        </TabsContent>

                        <TabsContent value="casestudies" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {caseStudies.map(a => (
                                    <AssignmentCard
                                        key={a._id}
                                        assignment={a}
                                        onViewSubmissions={handleViewSubmissions}
                                        onDelete={handleDeleteAssignment}
                                    />
                                ))}
                                {caseStudies.length === 0 && <p className="text-gray-500 col-span-3">No case studies found.</p>}
                            </div>
                        </TabsContent>

                        <TabsContent value="research" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {researchWork.map(a => (
                                    <AssignmentCard
                                        key={a._id}
                                        assignment={a}
                                        onViewSubmissions={handleViewSubmissions}
                                        onDelete={handleDeleteAssignment}
                                    />
                                ))}
                                {researchWork.length === 0 && <p className="text-gray-500 col-span-3">No research work found.</p>}
                            </div>
                        </TabsContent>

                        <TabsContent value="other" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {otherWork.map(a => (
                                    <AssignmentCard
                                        key={a._id}
                                        assignment={a}
                                        onViewSubmissions={handleViewSubmissions}
                                        onDelete={handleDeleteAssignment}
                                    />
                                ))}
                                {otherWork.length === 0 && <p className="text-gray-500 col-span-3">No other work found.</p>}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {viewMode === 'details' && selectedAssignment && (
                <div className="space-y-6">
                    <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-[#FF7A00] cursor-pointer" onClick={handleBackToList}>
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to List
                    </Button>

                    <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                        <div className="flex justify-between items-start flex-wrap gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{selectedAssignment.title}</h1>
                                {selectedAssignment.description && (
                                    <p className="text-gray-500 mt-1">{selectedAssignment.description}</p>
                                )}
                                <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 font-medium">
                                    <span className="bg-orange-50 text-[#FF7A00] px-2.5 py-1 rounded-md border border-orange-100 font-semibold">
                                        Total Marks: {selectedAssignment.totalMarks || 30}
                                    </span>
                                    <span>Subject: {selectedAssignment.subject}</span>
                                    <span>Section: {selectedAssignment.section}</span>
                                    <span>Due Date: {new Date(selectedAssignment.dueDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                    onClick={() => handleDeleteAssignment(selectedAssignment._id)}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                                <Button variant="outline" onClick={handleDownloadReport} className="cursor-pointer">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Report
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Student Submissions</h3>
                            <span className="text-xs text-gray-500">
                                Total Submissions: <strong>{submissions.length}</strong>
                            </span>
                        </div>
                        <AssignmentSubmissionTable
                            submissions={submissions}
                            onGradeSubmission={handleOpenGradeModal}
                        />
                    </div>
                </div>
            )}

            {/* Faculty Grade Submission Modal */}
            <Dialog open={!!gradingSubmission} onOpenChange={(open) => { if (!open) setGradingSubmission(null); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-gray-900">
                            <Award className="w-5 h-5 text-[#FF7A00]" />
                            Grade Student Submission
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">
                            Evaluate student work and assign marks out of maximum {selectedAssignment?.totalMarks || 30}.
                        </DialogDescription>
                    </DialogHeader>

                    {gradingSubmission && (
                        <form onSubmit={handleSaveGrade} className="space-y-4 py-2">
                            {/* Student Metadata Card */}
                            <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-100 text-xs space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Student Name:</span>
                                    <span className="font-bold text-gray-900 text-sm">{gradingSubmission.studentName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Registration No (Reg No):</span>
                                    <span className="font-bold text-gray-900 font-mono">
                                        {gradingSubmission.regNo || gradingSubmission.registrationNumber || gradingSubmission.college_id || gradingSubmission.rollNumber || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Submitted At:</span>
                                    <span className="text-gray-700">
                                        {gradingSubmission.submittedAt ? (
                                            new Date(gradingSubmission.submittedAt).toLocaleDateString() + ' ' +
                                            new Date(gradingSubmission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        ) : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 font-medium">Current Status:</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                                        gradingSubmission.status === 'Graded' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {gradingSubmission.status === 'Graded' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                        {gradingSubmission.status}
                                    </span>
                                </div>
                            </div>

                            {/* Submitted Files Section */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-700">Submitted Files / Documents</Label>
                                {(() => {
                                    const files = (Array.isArray(gradingSubmission.files) && gradingSubmission.files.length > 0)
                                        ? gradingSubmission.files
                                        : (gradingSubmission.fileUrl ? [gradingSubmission.fileUrl] : []);

                                    if (files.length === 0) {
                                        return <p className="text-xs text-gray-400 italic">No files submitted by student.</p>;
                                    }

                                    return (
                                        <div className="space-y-2">
                                            {files.map((file, idx) => {
                                                const resolved = resolveFileUrl(file);
                                                const label = gradingSubmission.fileName && files.length === 1
                                                    ? gradingSubmission.fileName
                                                    : (files.length === 1 ? 'View Submitted File' : `Submitted File ${idx + 1}`);

                                                return (
                                                    <div key={idx} className="flex items-center justify-between p-2.5 bg-blue-50/60 rounded-md border border-blue-100 text-xs">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                                            <span className="font-medium text-gray-800 truncate">{label}</span>
                                                        </div>
                                                        <a
                                                            href={resolved}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shrink-0 ml-2 shadow-xs"
                                                        >
                                                            <span>Open File</span>
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Marks Input */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="marks" className="text-xs font-semibold text-gray-700">
                                        Marks Awarded *
                                    </Label>
                                    <span className="text-[11px] text-gray-500 font-medium">
                                        Max Marks: {selectedAssignment?.totalMarks || 30}
                                    </span>
                                </div>
                                <Input
                                    id="marks"
                                    type="number"
                                    min="0"
                                    max={selectedAssignment?.totalMarks || 100}
                                    step="0.5"
                                    required
                                    placeholder={`e.g. 25 (out of ${selectedAssignment?.totalMarks || 30})`}
                                    value={gradeMarks}
                                    onChange={(e) => setGradeMarks(e.target.value)}
                                    className="h-10 text-sm font-semibold"
                                />
                            </div>

                            {/* Feedback Input */}
                            <div className="space-y-1.5">
                                <Label htmlFor="feedback" className="text-xs font-semibold text-gray-700">
                                    Faculty Feedback & Remarks (Optional)
                                </Label>
                                <Textarea
                                    id="feedback"
                                    rows={3}
                                    placeholder="Enter constructive remarks, strengths, or suggestions for the student..."
                                    value={gradeFeedback}
                                    onChange={(e) => setGradeFeedback(e.target.value)}
                                    className="text-xs resize-none"
                                />
                            </div>

                            <DialogFooter className="pt-2 flex gap-2 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setGradingSubmission(null)}
                                    disabled={gradingLoading}
                                    className="text-xs h-9 cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={gradingLoading}
                                    className="bg-[#FF7A00] hover:bg-[#FF6A00] text-white text-xs font-semibold h-9 px-4 cursor-pointer"
                                >
                                    {gradingLoading ? 'Saving...' : 'Submit Grade'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
