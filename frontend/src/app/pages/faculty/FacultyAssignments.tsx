import { useState, useEffect } from 'react';
import FilterBar from '../../components/faculty/FilterBar';
import AssignmentCard from '../../components/faculty/AssignmentCard';
import AssignmentSubmissionTable from '../../components/faculty/AssignmentSubmissionTable';
import CreateAssignmentModal from '../../components/faculty/CreateAssignmentModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { getFacultyAssignments, getAssignmentSubmissions, Assignment, Submission } from '../../services/facultyAssignmentService';
import { toast } from 'sonner';

export default function FacultyAssignments() {
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
    const [createModalOpen, setCreateModalOpen] = useState(false);

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

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedAssignment(null);
        setSubmissions([]);
    };

    const handleDownloadReport = () => {
        toast.info("Downloading report...");
        // Implement CSV download logic here
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
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignments & Tasks</h1>
                        <p className="text-gray-600">Track assignments, case studies, and research work.</p>
                    </div>

                    <div className="flex justify-end mb-4 pr-4">
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="bg-[#FF7A00] hover:bg-[#FF6A00] flex items-center gap-2 h-10 min-w-[170px] justify-center"
                        >
                            Create Assignment / Task
                        </Button>
                    </div>

                    <FilterBar
                        onSearchChange={(val) => console.log(val)}
                        onDownload={handleDownloadReport}
                    />

                    <CreateAssignmentModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

                    <Tabs defaultValue="assignments" className="space-y-6">
                        <TabsList className="bg-gray-100 p-1 w-full max-w-3xl grid grid-cols-4">
                            <TabsTrigger value="assignments" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">Assignments</TabsTrigger>
                            <TabsTrigger value="casestudies" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">Case Studies</TabsTrigger>
                            <TabsTrigger value="research" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">Research Work</TabsTrigger>
                            <TabsTrigger value="other" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">Other</TabsTrigger>
                        </TabsList>

                        <TabsContent value="assignments" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assignmentList.map(a => (
                                    <AssignmentCard key={a._id} assignment={a} onViewSubmissions={handleViewSubmissions} />
                                ))}
                                {assignmentList.length === 0 && <p className="text-gray-500 col-span-3">No assignments found.</p>}
                            </div>
                        </TabsContent>

                        <TabsContent value="casestudies" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {caseStudies.map(a => (
                                    <AssignmentCard key={a._id} assignment={a} onViewSubmissions={handleViewSubmissions} />
                                ))}
                                {caseStudies.length === 0 && <p className="text-gray-500 col-span-3">No case studies found.</p>}
                            </div>
                        </TabsContent>

                        <TabsContent value="research" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {researchWork.map(a => (
                                    <AssignmentCard key={a._id} assignment={a} onViewSubmissions={handleViewSubmissions} />
                                ))}
                                {researchWork.length === 0 && <p className="text-gray-500 col-span-3">No research work found.</p>}
                            </div>
                        </TabsContent>

                        <TabsContent value="other" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {otherWork.map(a => (
                                    <AssignmentCard key={a._id} assignment={a} onViewSubmissions={handleViewSubmissions} />
                                ))}
                                {otherWork.length === 0 && <p className="text-gray-500 col-span-3">No other work found.</p>}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {viewMode === 'details' && selectedAssignment && (
                <div className="space-y-6">
                    <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-[#FF7A00]" onClick={handleBackToList}>
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to List
                    </Button>

                    <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{selectedAssignment.title}</h1>
                                <p className="text-gray-500 mt-1">{selectedAssignment.description}</p>
                            </div>
                            <Button variant="outline" onClick={handleDownloadReport}>
                                <Download className="w-4 h-4 mr-2" />
                                Download Report
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                            <h3 className="font-semibold text-gray-900">Student Submissions</h3>
                        </div>
                        <AssignmentSubmissionTable
                            submissions={submissions}
                            onGradeSubmission={(sub) => toast.info(`Grading ${sub.studentName}`)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
