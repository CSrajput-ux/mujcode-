import StudentLayout from '../../components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { FileText, Upload, Video, File, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import CaseStudyNotebook from '../../components/CaseStudyNotebook';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Assignments() {
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [submittedAssignments, setSubmittedAssignments] = useState<any[]>([]);
  const [researchPapers, setResearchPapers] = useState<any[]>([]);
  const [caseStudies, setCaseStudies] = useState<any[]>([]);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<{ id: string, type: 'assignment' | 'research' | 'casestudy' } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUploadSubmit = () => {
    if (!selectedFile || !uploadTarget) {
      toast.error("Please select a file to upload.");
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    if (uploadTarget.type === 'assignment') {
      const item = pendingAssignments.find(a => a.id === uploadTarget.id);
      if (item) {
        setPendingAssignments(prev => prev.filter(a => a.id !== uploadTarget.id));
        setSubmittedAssignments(prev => [{
           id: item.id, title: item.title, subject: item.subject, type: item.type, submittedOn: today, grade: 'Pending', score: 0 
        }, ...prev]);
      }
    } else if (uploadTarget.type === 'research') {
      const item = researchPapers.find(r => r.id === uploadTarget.id);
      if (item) {
        setResearchPapers(prev => prev.filter(r => r.id !== uploadTarget.id));
        setSubmittedAssignments(prev => [{
           id: item.id, title: item.title, subject: item.subject, type: 'Research', submittedOn: today, grade: 'Pending', score: 0 
        }, ...prev]);
      }
    } else if (uploadTarget.type === 'casestudy') {
      const item = caseStudies.find(c => c.id === uploadTarget.id);
      if (item) {
        setCaseStudies(prev => prev.filter(c => c.id !== uploadTarget.id));
        setSubmittedAssignments(prev => [{
           id: item.id, title: item.title, subject: item.subject, type: 'Case Study', submittedOn: today, grade: 'Pending', score: 0 
        }, ...prev]);
      }
    }

    setUploadModalOpen(false);
    setSelectedFile(null);
    setUploadTarget(null);
    toast.success("Document submitted successfully!");
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
            {pendingAssignments.map((assignment, index) => (
              <Card key={index} className="shadow-md border-l-4 border-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-3 bg-orange-100 rounded-lg text-[#FF7A00]">
                        {getTypeIcon(assignment.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{assignment.subject}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-1 text-[#FF7A00]" />
                            Due: {assignment.dueDate}
                          </span>
                          <Badge variant="outline">
                            Accepts: {assignment.allowedTypes.join(', ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button className="bg-[#FF7A00] hover:bg-[#FF6A00]" onClick={() => { setUploadTarget({ id: assignment.id, type: 'assignment' }); setUploadModalOpen(true); }}>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Submitted Assignments */}
          <TabsContent value="submitted" className="space-y-4">
            {submittedAssignments.map((assignment, index) => (
              <Card key={index} className="shadow-md border-l-4 border-green-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-3 bg-green-100 rounded-lg text-green-600">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{assignment.subject}</p>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">Submitted: {assignment.submittedOn}</span>
                          <Badge className={getGradeColor(assignment.grade)}>
                            Grade: {assignment.grade}
                          </Badge>
                          <span className="text-sm font-semibold text-[#FF7A00]">Score: {assignment.score}/100</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" className="hover:border-[#FF7A00] hover:text-[#FF7A00]">
                      View Feedback
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                    <Button variant="outline" className="flex-1 hover:border-[#FF7A00] hover:text-[#FF7A00]">
                      View Guidelines
                    </Button>
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
                    <Button variant="outline" className="flex-1 hover:border-[#FF7A00] hover:text-[#FF7A00]">
                      <FileText className="w-4 h-4 mr-2" />
                      Read Case
                    </Button>
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
    </StudentLayout>
  );
}
