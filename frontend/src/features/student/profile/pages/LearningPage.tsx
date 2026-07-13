import StudentLayout from '@/app/components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { BookOpen, FileText, Download, Play, Code2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

export default function Learning() {
  const programmingMaterials = [
    { title: 'C Programming - Complete Guide', type: 'PDF', size: '5.2 MB', lessons: 45 },
    { title: 'Java Fundamentals', type: 'Video', size: '1.2 GB', lessons: 32 },
    { title: 'Python for Beginners', type: 'PDF', size: '3.8 MB', lessons: 28 },
    { title: 'JavaScript ES6+', type: 'Video', size: '850 MB', lessons: 24 }
  ];

  const semesterSubjects = [
    { code: 'CS301', title: 'Data Structures', semester: 3, modules: 5, papers: 3 },
    { code: 'CS302', title: 'Database Management', semester: 3, modules: 6, papers: 4 },
    { code: 'CS303', title: 'Operating Systems', semester: 3, modules: 5, papers: 3 },
    { code: 'CS304', title: 'Computer Networks', semester: 3, modules: 6, papers: 5 }
  ];

  const previousYearPapers = [
    { year: '2025', subject: 'Data Structures', type: 'Final Exam' },
    { year: '2025', subject: 'Algorithms', type: 'Midterm' },
    { year: '2024', subject: 'Database Systems', type: 'Final Exam' },
    { year: '2024', subject: 'Operating Systems', type: 'Final Exam' }
  ];

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Resources</h1>
          <p className="text-gray-600">Access study materials and previous year questions</p>
        </div>

        <Tabs defaultValue="programming" className="space-y-6">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="programming" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
              Programming Languages
            </TabsTrigger>
            <TabsTrigger value="semester" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
              Current Semester
            </TabsTrigger>
            <TabsTrigger value="papers" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
              Previous Year Papers
            </TabsTrigger>
          </TabsList>

          {/* Programming Languages */}
          <TabsContent value="programming">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {programmingMaterials.map((material, index) => (
                <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-[#FF7A00] bg-opacity-10 rounded-lg">
                          {material.type === 'Video' ? (
                            <Play className="w-6 h-6 text-[#FF7A00]" />
                          ) : (
                            <FileText className="w-6 h-6 text-[#FF7A00]" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{material.title}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {material.lessons} lessons • {material.size}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-[#FF7A00] hover:bg-[#FF6A00]">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Current Semester */}
          <TabsContent value="semester">
            <div className="space-y-4">
              {semesterSubjects.map((subject, index) => (
                <Card key={index} className="shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-3 bg-blue-500 rounded-lg text-white">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{subject.title}</h3>
                            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                              {subject.code}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Semester {subject.semester}</span>
                            <span>•</span>
                            <span>{subject.modules} modules</span>
                            <span>•</span>
                            <span>{subject.papers} practice papers</span>
                          </div>
                        </div>
                      </div>
                      <Button className="bg-[#FF7A00] hover:bg-[#FF6A00]">
                        View Materials
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Previous Year Papers */}
          <TabsContent value="papers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {previousYearPapers.map((paper, index) => (
                <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-purple-500 rounded-lg text-white">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{paper.subject}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {paper.year} • {paper.type}
                          </p>
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-[#FF7A00] text-white text-xs rounded">
                        PDF
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1 hover:border-[#FF7A00] hover:text-[#FF7A00]">
                        Preview
                      </Button>
                      <Button className="flex-1 bg-[#FF7A00] hover:bg-[#FF6A00]">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
}
