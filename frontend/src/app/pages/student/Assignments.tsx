import StudentLayout from '../../components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { FileText, Upload, Video, File, Calendar, CheckCircle2, AlertCircle, Eye, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import CaseStudyNotebook from '../../components/CaseStudyNotebook';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import DocumentPreviewModal from '../../components/DocumentPreviewModal';

export default function Assignments() {
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [submittedAssignments, setSubmittedAssignments] = useState<any[]>([]);
  const [researchPapers, setResearchPapers] = useState<any[]>([]);
  const [caseStudies, setCaseStudies] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{ id: string, type: 'assignment' | 'research' | 'casestudy' } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  // Fetch assignments from backend on mount
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setPageLoading(true);
        const res = await apiClient.get('/api/assignments/student/my');
        const all: any[] = res.data || [];
        const subRes = await apiClient.get('/api/assignments/student/submitted');
        const submitted = subRes.data || [];
        setSubmittedAssignments(submitted);
        const submittedIds = submitted.map((s: any) => s.assignmentId || s.id || s._id);

        setPendingAssignments(all.filter((a: any) => (a.type === 'Assignment' || !a.type) && !submittedIds.includes(a._id) && !submittedIds.includes(a.id)));
        setResearchPapers(all.filter((a: any) => a.type === 'Research' && !submittedIds.includes(a._id) && !submittedIds.includes(a.id)));
        setCaseStudies(all.filter((a: any) => a.type === 'CaseStudy' && !submittedIds.includes(a._id) && !submittedIds.includes(a.id)));
      } catch (err) {
        console.error('Failed to fetch assignments:', err);
        // fallback: show empty
        setPendingAssignments([]);
        setResearchPapers([]);
        setCaseStudies([]);
        setSubmittedAssignments([]);
      } finally {
        setPageLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const handleUploadSubmit = async () => {
    if (!selectedFile || !uploadTarget) {
      toast.error("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append('files', selectedFile);

    try {
      const loadingId = toast.loading("Submitting assignment...");
      
      await apiClient.post(`/api/assignments/${uploadTarget.id}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.dismiss(loadingId);
      toast.success("Document submitted successfully!");

      setUploadModalOpen(false);
      setSelectedFile(null);
      setUploadTarget(null);

      // Re-fetch assignments
      setPageLoading(true);
      const res = await apiClient.get('/api/assignments/student/my');
      const all: any[] = res.data || [];
      
      const subRes = await apiClient.get('/api/assignments/student/submitted');
      const submitted = subRes.data || [];
      setSubmittedAssignments(submitted);
      const submittedIds = submitted.map((s: any) => s.assignmentId || s.id || s._id);

      setPendingAssignments(all.filter((a: any) => (a.type === 'Assignment' || !a.type) && !submittedIds.includes(a._id) && !submittedIds.includes(a.id)));
      setResearchPapers(all.filter((a: any) => a.type === 'Research' && !submittedIds.includes(a._id) && !submittedIds.includes(a.id)));
      setCaseStudies(all.filter((a: any) => a.type === 'CaseStudy' && !submittedIds.includes(a._id) && !submittedIds.includes(a.id)));
      
    } catch (err) {
      console.error('Submit error:', err);
      toast.dismiss();
      toast.error("Failed to submit assignment.");
    } finally {
      setPageLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Written': return <FileText className="w-5 h-5" />;
      case 'Video': return <Video className="w-5 h-5" />;
      case 'Code': return <File className="w-5 h-5" />;
      case 'Case Study': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-500';
    if (grade.startsWith('B')) return 'bg-blue-500';
    if (grade.startsWith('C')) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const [activeCaseStudy, setActiveCaseStudy] = useState<{ title: string } | null>(null);

  if (pageLoading) {
    return (
      <StudentLayout>
        <div className="p-8 text-center text-gray-500">Loading assignments...</div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignments</h1>
          <p className="text-gray-600">Manage your coursework and submissions</p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="pending" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
              Pending ({pendingAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="submitted" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
              Submitted ({submittedAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="research" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
              Research Papers ({researchPapers.length})
            </TabsTrigger>
            <TabsTrigger value="casestudy" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
              Case Studies ({caseStudies.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Assignments */}
          <TabsContent value="pending" className="space-y-4">
            {pendingAssignments.length === 0 && (
              <p className="text-gray-500 text-center py-8">No pending assignments found.</p>
            )}
            {pendingAssignments.map((assignment, index) => {
              const assignmentId = assignment._id || assignment.id;
              const hasFile = Boolean(assignment.fileUrl);
              const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
              const downloadHref = hasFile ? `${baseUrl}/api/assignments/download/${assignmentId}` : '#';

              return (
                <Card key={assignmentId || index} className="shadow-md border-l-4 border-orange-500 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <div className="p-3 bg-orange-100 rounded-lg text-[#FF7A00] shrink-0">
                          {getTypeIcon(assignment.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{assignment.subject}</p>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="flex items-center text-gray-600 font-medium">
                              <Calendar className="w-4 h-4 mr-1 text-[#FF7A00]" />
                              Due: {assignment.dueDate}
                            </span>
                            {assignment.fileName && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                                📎 {assignment.fileName}
                              </Badge>
                            )}
                            {assignment.description && (
                              <Badge variant="outline" className="text-xs max-w-xs truncate">{assignment.description}</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: View, Download, Submit */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-[#FF7A00] border-[#FF7A00]/40 hover:bg-[#FF7A00]/10 hover:text-[#FF7A00] font-medium"
                          onClick={() => setPreviewItem(assignment)}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>

                        {hasFile && (
                          <a href={downloadHref} target="_blank" rel="noopener noreferrer" download>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-gray-700 hover:text-gray-900 hover:border-gray-400 font-medium"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                          </a>
                        )}

                        <Button
                          className="bg-[#FF7A00] hover:bg-[#FF6A00] gap-1.5 font-medium shadow-sm"
                          size="sm"
                          onClick={() => { setUploadTarget({ id: assignmentId, type: 'assignment' }); setUploadModalOpen(true); }}
                        >
                          <Upload className="w-4 h-4" />
                          Submit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Submitted Assignments */}
          <TabsContent value="submitted" className="space-y-4">
            {submittedAssignments.map((assignment, index) => {
              const assignmentId = assignment._id || assignment.id;
              const hasFile = Boolean(assignment.fileUrl);
              const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
              const downloadHref = hasFile ? `${baseUrl}/api/assignments/download/${assignmentId}` : '#';

              return (
                <Card key={assignmentId || index} className="shadow-md border-l-4 border-green-500">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <div className="p-3 bg-green-100 rounded-lg text-green-600 shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{assignment.subject}</p>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm text-gray-600">Submitted: {assignment.submittedOn}</span>
                            <Badge className={getGradeColor(assignment.grade)}>
                              Grade: {assignment.grade}
                            </Badge>
                            <span className="text-sm font-semibold text-[#FF7A00]">Score: {assignment.score}/100</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-gray-700 hover:border-[#FF7A00] hover:text-[#FF7A00]"
                          onClick={() => setPreviewItem(assignment)}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        {hasFile && (
                          <a href={downloadHref} target="_blank" rel="noopener noreferrer" download>
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <Download className="w-4 h-4" />
                              Download
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Research Papers */}
          <TabsContent value="research" className="space-y-4">
            {researchPapers.map((paper, index) => (
              <Card key={index} className="shadow-md border-l-4 border-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{paper.title}</span>
                    <Badge className={paper.submitted ? 'bg-green-500' : 'bg-orange-500'}>
                      {paper.submitted ? 'Submitted' : 'Pending'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subject: {paper.subject}</span>
                    <span className="text-gray-600">Minimum words: {paper.minWords}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-[#FF7A00]" />
                    <span>Due Date: {paper.dueDate}</span>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Requirements:</strong> Original research, proper citations, academic formatting (APA/IEEE)
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      className="flex-1 hover:border-[#FF7A00] hover:text-[#FF7A00] gap-1.5"
                      onClick={() => setPreviewItem(paper)}
                    >
                      <Eye className="w-4 h-4" />
                      View Guidelines
                    </Button>
                    {paper.fileUrl && (
                      <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer" download>
                        <Button variant="outline" className="gap-1.5">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    <Button className="flex-1 bg-[#FF7A00] hover:bg-[#FF6A00]" onClick={() => { setUploadTarget({ id: paper.id, type: 'research' }); setUploadModalOpen(true); }}>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Paper
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Case Studies */}
          <TabsContent value="casestudy" className="space-y-4">
            {caseStudies.map((study, index) => (
              <Card key={index} className="shadow-md border-l-4 border-blue-600">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{study.title}</span>
                    <Badge className={study.status === 'Submitted' ? 'bg-green-500' : 'bg-blue-600'}>
                      {study.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Subject: {study.subject}</span>
                    <span className="text-gray-600">Type: {study.type}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-[#FF7A00]" />
                    <span>Due Date: {study.dueDate}</span>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Scenario:</strong> {study.description}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      className="flex-1 hover:border-[#FF7A00] hover:text-[#FF7A00] gap-1.5"
                      onClick={() => setPreviewItem(study)}
                    >
                      <Eye className="w-4 h-4" />
                      Read Case
                    </Button>
                    {study.fileUrl && (
                      <a href={study.fileUrl} target="_blank" rel="noopener noreferrer" download>
                        <Button variant="outline" className="gap-1.5">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    <Button
                      onClick={() => { setUploadTarget({ id: study.id, type: 'casestudy' }); setUploadModalOpen(true); }}
                      className="flex-1 bg-[#FF7A00] hover:bg-[#FF6A00]"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Upload Info Card */}
        <Card className="shadow-md bg-gray-50 border-2 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-500 rounded-lg text-white">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Submission Guidelines</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Check accepted file formats before uploading</li>
                  <li>• Videos should not exceed 500MB in size</li>
                  <li>• Written assignments must follow the prescribed format</li>
                  <li>• Submit before the deadline to avoid penalties</li>
                  <li>• You can resubmit before the due date</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zoho-style Notebook Modal */}
      <CaseStudyNotebook
        open={!!activeCaseStudy}
        onClose={() => setActiveCaseStudy(null)}
        caseStudyTitle={activeCaseStudy?.title || ''}
      />

      {/* Upload File Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Document</DialogTitle>
            <DialogDescription>
              Upload your document file (.doc, .docx, .pdf). 
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="file-upload" className="font-semibold text-gray-700">Select File</Label>
              <Input 
                id="file-upload" 
                type="file" 
                accept=".doc,.docx,.pdf,.mp4" 
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
              />
            </div>
            {selectedFile && (
              <p className="text-sm text-green-600 font-medium flex items-center">
                <FileText className="w-4 h-4 mr-1" /> {selectedFile.name}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadModalOpen(false); setSelectedFile(null); }}>
              Cancel
            </Button>
            <Button className="bg-[#FF7A00] hover:bg-[#FF6A00] text-white" onClick={handleUploadSubmit}>
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document / Assignment Preview Modal */}
      {previewItem && (
        <DocumentPreviewModal
          open={!!previewItem}
          onOpenChange={(open) => !open && setPreviewItem(null)}
          title={previewItem.title || previewItem.fileName || 'Assignment Preview'}
          fileUrl={previewItem.fileUrl || ''}
          fileName={previewItem.fileName || ''}
          fileType={previewItem.fileType || ''}
          assignmentId={previewItem._id || previewItem.id || ''}
          description={previewItem.description || ''}
        />
      )}
    </StudentLayout>
  );
}
