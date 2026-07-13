import { useState, useEffect } from 'react';
import FilterBar from '../../components/faculty/FilterBar';
import TestCard from '../../components/faculty/TestCard';
import StudentPerformanceTable from '../../components/faculty/StudentPerformanceTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { getFacultyTests, getTestSubmissions, TestStats, StudentSubmission } from '../../services/facultyTestService';
import { toast } from 'sonner';

import CreateTestModal from '../../components/faculty/CreateTestModal';

export default function FacultyTests() {
    const [loading, setLoading] = useState(true);
    const [tests, setTests] = useState<TestStats[]>([]);
    const [selectedTest, setSelectedTest] = useState<TestStats | null>(null);
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // Fetch tests on mount
    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            setLoading(true);
            const data = await getFacultyTests();
            setTests(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load tests");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (test: TestStats) => {
        setSelectedTest(test);
        setViewMode('details');
        try {
            // Fetch submissions for this test
            const subs = await getTestSubmissions(test._id);
            setSubmissions(subs);
        } catch (error) {
            toast.error("Failed to load submissions");
        }
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedTest(null);
        setSubmissions([]);
    };

    const handleDownloadReport = () => {
        toast.info("Downloading report...");
        // Implement CSV download logic here
    };

    const handleTogglePublish = async (testId: string, currentStatus: boolean) => {
        try {
            const { toggleTestPublishStatus } = await import('../../services/facultyTestService');
            await toggleTestPublishStatus(testId);
            toast.success(`Test ${currentStatus ? 'unpublished' : 'published'} successfully!`);
            // Refresh the test list
            fetchTests();
        } catch (error) {
            console.error('Error toggling publish status:', error);
            toast.error('Failed to update publish status');
        }
    };

    const handleDeleteTest = async (testId: string) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this test? This will also remove all its submissions.');
        if (!confirmDelete) return;

        try {
            const { deleteTestById } = await import('../../services/facultyTestService');
            await deleteTestById(testId);
            toast.success('Test deleted successfully');
            fetchTests();
        } catch (error) {
            console.error('Error deleting test:', error);
            toast.error('Failed to delete test');
        }
    };

    // Filter tests by Tabs
    const testList = tests.filter(t => t.type !== 'Quiz');
    const quizList = tests.filter(t => t.type === 'Quiz');

    return (
        <>
            {viewMode === 'list' && (
                <div className="space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tests & Quiz</h1>
                        <p className="text-gray-600">Manage, monitor and analyze student performance</p>
                    </div>

                    <div className="flex justify-end mb-4 pr-4">
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="bg-[#FF7A00] hover:bg-[#FF6A00] flex items-center gap-2 h-10 min-w-[170px] justify-center"
                        >
                            {/* <Plus className="w-4 h-4" /> */}
                            Create Test / Quiz
                        </Button>
                    </div>

                    <FilterBar
                        onSearchChange={(val) => console.log(val)}
                        onDownload={handleDownloadReport}
                    />

                    <CreateTestModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

                    <Tabs defaultValue="tests" className="space-y-6">
                        <TabsList className="bg-gray-100 p-1">
                            <TabsTrigger value="tests" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white px-8">Tests</TabsTrigger>
                            <TabsTrigger value="quizzes" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white px-8">Quizzes</TabsTrigger>
                        </TabsList>

                        <TabsContent value="tests" className="space-y-6">
                            {/* Grouping Logic Visualization (Mocked for UI structure) */}
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">2nd Year / Section A</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {testList.map(test => (
                                        <TestCard
                                            key={test._id}
                                            test={test}
                                            onViewDetails={handleViewDetails}
                                            onTogglePublish={handleTogglePublish}
                                            onDelete={handleDeleteTest}
                                        />
                                    ))}
                                    {testList.length === 0 && <p className="text-gray-500 col-span-3">No tests found.</p>}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="quizzes" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {quizList.map(test => (
                                    <TestCard
                                        key={test._id}
                                        test={test}
                                        onViewDetails={handleViewDetails}
                                        onTogglePublish={handleTogglePublish}
                                        onDelete={handleDeleteTest}
                                    />
                                ))}
                                {quizList.length === 0 && <p className="text-gray-500 col-span-3">No quizzes found.</p>}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {viewMode === 'details' && selectedTest && (
                <div className="space-y-6">
                    <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-[#FF7A00]" onClick={handleBackToList}>
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Tests
                    </Button>

                    <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{selectedTest.title}</h1>
                                <div className="flex gap-4 text-sm text-gray-500 mt-2">
                                    <span>Subject: <strong>Data Structures</strong></span> {/* Mock subject */}
                                    <span>•</span>
                                    <span>Date: {new Date(selectedTest.startTime).toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>Duration: {selectedTest.duration} mins</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={handleDownloadReport}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Marks
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-6 mt-8">
                            <div className="p-4 bg-gray-50 rounded-lg text-center">
                                <div className="text-sm text-gray-500">Total Appeared</div>
                                <div className="text-2xl font-bold text-gray-900">{selectedTest.totalAppeared}</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg text-center">
                                <div className="text-sm text-gray-500">Avg Score</div>
                                <div className="text-2xl font-bold text-green-600">{selectedTest.avgScore.toFixed(1)}</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg text-center">
                                <div className="text-sm text-gray-500">Highest Score</div>
                                <div className="text-2xl font-bold text-blue-600">--</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg text-center">
                                <div className="text-sm text-gray-500">Pass Percentage</div>
                                <div className="text-2xl font-bold text-[#FF7A00]">--%</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">Student Performance</h3>
                            <div className="flex gap-2">
                                {/* Small inner filters if needed */}
                            </div>
                        </div>
                        <StudentPerformanceTable
                            submissions={submissions}
                            onViewSubmission={(sub) => toast.info(`Viewing submission for ${sub.studentName}`)}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
