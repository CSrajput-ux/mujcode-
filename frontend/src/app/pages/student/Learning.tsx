import { useState, useEffect } from 'react';
import axios from 'axios';
import StudentLayout from '../../components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  BookOpen, FileText, Download, Play, AlertCircle, GraduationCap,
  Brain, Code2, Calculator, Cpu, FlaskConical, Database,
  Network, Waves, Cog, Lightbulb, Palette, Languages,
  Presentation, FolderOpen
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { getMyCoursesAPI, type StudentCoursesResponse } from '../../services/academicService';
import { Alert, AlertDescription } from '../../components/ui/alert';
import LiveClassesTab from './LiveClassesTab';

interface ContentItem {
  _id: string;
  title: string;
  description: string;
  type: 'module' | 'ppt' | 'pyq';
  subject: string;
  section: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: string;
  createdAt: string;
}

// Smart icon mapping function
const getSubjectIcon = (courseName: string, courseType: string) => {
  const name = courseName.toLowerCase();

  // AI & Machine Learning
  if (name.includes('ai') || name.includes('artificial intelligence') ||
    name.includes('machine learning') || name.includes('ml') ||
    name.includes('deep learning') || name.includes('neural')) {
    return Brain;
  }

  // Programming & DSA
  if (name.includes('programming') || name.includes('dsa') ||
    name.includes('data structures') || name.includes('algorithm') ||
    name.includes('coding') || name.includes('java') ||
    name.includes('python') || name.includes('c++') || name.includes('oops')) {
    return Code2;
  }

  // Mathematics
  if (name.includes('math') || name.includes('calculus') ||
    name.includes('algebra') || name.includes('statistics') ||
    name.includes('probability') || name.includes('discrete')) {
    return Calculator;
  }

  // Electronics & Hardware
  if (name.includes('electronics') || name.includes('vlsi') ||
    name.includes('circuit') || name.includes('embedded') ||
    name.includes('microprocessor') || name.includes('digital')) {
    return Cpu;
  }

  // Databases
  if (name.includes('database') || name.includes('dbms') ||
    name.includes('sql') || name.includes('rdbms')) {
    return Database;
  }

  // Networks & Communications
  if (name.includes('network') || name.includes('communication') ||
    name.includes('internet') || name.includes('wireless')) {
    return Network;
  }

  // Physics & Waves
  if (name.includes('physics') || name.includes('optics') ||
    name.includes('wave') || name.includes('mechanics')) {
    return Waves;
  }

  // Engineering & Systems
  if (name.includes('system') || name.includes('engineering') ||
    name.includes('operating') || name.includes('architecture')) {
    return Cog;
  }

  // Design & Arts
  if (name.includes('design') || name.includes('graphics') ||
    name.includes('art') || name.includes('illustration')) {
    return Palette;
  }

  // Languages & Literature
  if (name.includes('english') || name.includes('literature') ||
    name.includes('writing') || name.includes('communication skills')) {
    return Languages;
  }

  // Innovation & Projects
  if (name.includes('innovation') || name.includes('project') ||
    name.includes('research') || name.includes('thesis')) {
    return Lightbulb;
  }

  // Labs (by type)
  if (courseType === 'Lab') {
    return FlaskConical;
  }

  // Default
  return BookOpen;
};

export default function Learning() {
  const [coursesData, setCoursesData] = useState<StudentCoursesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    fetchMyCourses();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      console.log('Profile updated, refreshing courses...');
      fetchMyCourses();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyCoursesAPI();
      setCoursesData(data);
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.message || err.response?.data?.hint || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };


  const programmingMaterials = [
    { title: 'C Programming - Complete Guide', type: 'PDF', size: '5.2 MB', lessons: 45 },
    { title: 'Java Fundamentals', type: 'Video', size: '1.2 GB', lessons: 32 },
    { title: 'Python for Beginners', type: 'PDF', size: '3.8 MB', lessons: 28 },
    { title: 'JavaScript ES6+', type: 'Video', size: '850 MB', lessons: 24 }
  ];

  const previousYearPapers = [
    { year: '2025', subject: 'Data Structures', type: 'Final Exam' },
    { year: '2025', subject: 'Algorithms', type: 'Midterm' },
    { year: '2024', subject: 'Database Systems', type: 'Final Exam' },
    { year: '2024', subject: 'Operating Systems', type: 'Final Exam' }
  ];

  const getCourseTypeColor = (type: string) => {
    switch (type) {
      case 'Theory':
        return 'bg-blue-500';
      case 'Lab':
        return 'bg-green-500';
      case 'Project':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Learning Resources</h1>
          <p className="text-gray-600">Access study materials and semester courses</p>
        </div>

        {/* Student Info Banner */}
        {coursesData && (
          <Card className="bg-gradient-to-r from-[#FF7A00] to-[#FF6A00] text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white bg-opacity-20 rounded-full">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{coursesData.student.name}</h2>
                    <p className="text-white text-opacity-90">
                      {coursesData.student.branch} • Semester {coursesData.student.semester}
                      {coursesData.student.section && ` • Section ${coursesData.student.section}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{coursesData.summary.totalCourses}</div>
                  <div className="text-white text-opacity-90">Total Courses</div>
                  <div className="text-sm mt-1">{coursesData.summary.totalCredits} Credits</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="semester" className="space-y-6">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="semester" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
              My Semester Courses
            </TabsTrigger>
            <TabsTrigger value="programming" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
              Programming Languages
            </TabsTrigger>
            <TabsTrigger value="papers" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
              Previous Year Papers
            </TabsTrigger>
            <TabsTrigger value="live-classes" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
              Live Classes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="semester">
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00]"></div>
                <p className="mt-4 text-gray-600">Loading your courses...</p>
              </div>
            )}

            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                  <p className="mt-2 text-sm">
                    Please update your profile with branch and semester information in Profile Settings.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {!loading && !error && coursesData && (
              <div className="space-y-6">
                {/* Course Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {coursesData.summary.breakdown.theory}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Theory Courses</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {coursesData.summary.breakdown.lab}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Lab Courses</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200 bg-purple-50">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">
                          {coursesData.summary.breakdown.project}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Project Courses</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Course List */}
                <div className="space-y-4">
                  {coursesData.courses.map((course, index) => {
                    const SubjectIcon = getSubjectIcon(course.courseName, course.courseType);
                    return (
                      <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className={`p-3 ${getCourseTypeColor(course.courseType)} rounded-lg text-white`}>
                                <SubjectIcon className="w-6 h-6" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-xl font-semibold text-gray-900">{course.courseName}</h3>
                                <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                                  {course.courseCode}
                                </span>
                                {course.isElective && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                    Elective
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <span className={`w-2 h-2 rounded-full ${getCourseTypeColor(course.courseType)} mr-2`}></span>
                                  {course.courseType}
                                </span>
                                <span>•</span>
                                <span>{course.credits} Credits</span>
                                {course.prerequisites && course.prerequisites.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>Prerequisites: {course.prerequisites.join(', ')}</span>
                                  </>
                                )}
                              </div>
                              {course.syllabusOverview && (
                                <p className="mt-2 text-sm text-gray-600 italic">
                                  {course.syllabusOverview}
                                </p>
                              )}
                            </div>
                            <Button className="bg-[#FF7A00] hover:bg-[#FF6A00]">
                              View Materials
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {coursesData.courses.length === 0 && (
                  <Card className="text-center py-12">
                    <CardContent>
                      <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No courses found for this semester
                      </h3>
                      <p className="text-gray-600">
                        Courses for {coursesData.student.branch} Semester {coursesData.student.semester} will be added soon.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

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

          <TabsContent value="live-classes" className="mt-6">
            <LiveClassesTab />
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout >
  );
}
