import StudentLayout from '../../components/StudentLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Code2, Database, Globe, Target, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

export default function Courses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'C', 'C++', 'Java', 'Python', 'SQL', 'JavaScript', 'DSA', 'Interview'];

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedCategory, searchQuery, courses]);

  const fetchCourses = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const studentId = user.college_id || user.id;

      let coursesList: any[] = [];

      // 1. Try student-specific endpoint if studentId is available
      if (studentId) {
        try {
          const res = await apiClient.get(`/api/student/courses/${studentId}`);
          if (res.data?.courses && Array.isArray(res.data.courses) && res.data.courses.length > 0) {
            coursesList = res.data.courses;
          }
        } catch {
          // Fallback to general endpoint
        }
      }

      // 2. Fallback to general courses catalog
      if (coursesList.length === 0) {
        try {
          const res = await apiClient.get('/api/student/courses');
          if (res.data?.courses && Array.isArray(res.data.courses)) {
            coursesList = res.data.courses;
          }
        } catch (e) {
          console.error('Failed to load courses from general endpoint:', e);
        }
      }

      const coursesWithDefaults = coursesList.map((course: any) => ({
        ...course,
        progress: course.progress || 0,
        problemsSolved: course.problemsSolved || 0,
        status: course.status || 'not-started',
        enrolled: course.enrolled || false
      }));

      setCourses(coursesWithDefaults);
      setFilteredCourses(coursesWithDefaults);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...courses];

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  };

  const getIcon = (iconName: string) => {
    const iconClass = "w-5 h-5 text-[#FF7A00]";
    switch (iconName) {
      case 'database': return <Database className={iconClass} />;
      case 'globe': return <Globe className={iconClass} />;
      case 'target': return <Target className={iconClass} />;
      default: return <Code2 className={iconClass} />;
    }
  };

  const difficultyColors = {
    Easy: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Hard: 'bg-red-100 text-red-700'
  };

  const statusBadgeColors = {
    ongoing: 'bg-blue-500',
    completed: 'bg-green-500',
    'not-started': 'bg-gray-400'
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading courses...</div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Courses</h1>
          <p className="text-gray-600">Browse and continue your learning journey</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              className={selectedCategory === cat ? 'bg-[#FF7A00] hover:bg-[#FF6A00]' : ''}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No courses found
            </div>
          ) : (
            filteredCourses.map((course) => {
              const isOngoing = course.status === 'ongoing';
              const isCompleted = course.status === 'completed';

              return (
                <Card key={course._id} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Header with Icon and Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-orange-50/80 border border-orange-100/80 rounded-lg flex items-center justify-center">
                        {getIcon(course.icon)}
                      </div>
                      {course.status !== 'not-started' && (
                        <Badge className={`${statusBadgeColors[course.status as keyof typeof statusBadgeColors]} text-white text-xs`}>
                          {course.status === 'ongoing' ? 'Ongoing' : 'Completed'}
                        </Badge>
                      )}
                    </div>

                    {/* Title and Category - Fixed height for alignment */}
                    <div className="mb-3 min-h-[72px]">
                      <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">{course.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{course.category}</Badge>
                        <Badge className={`${difficultyColors[course.difficulty as keyof typeof difficultyColors]} text-xs`}>
                          {course.difficulty}
                        </Badge>
                      </div>
                    </div>

                    {/* Spacer to push content below to bottom */}
                    <div className="flex-grow"></div>

                    {/* Progress Bar - Always show */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-semibold text-[#FF7A00]">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#FF7A00] h-2 rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Problems Solved */}
                    <div className="mb-4 text-sm text-gray-600">
                      <span className="font-semibold">Problems Solved: </span>
                      {course.problemsSolved} / {course.totalProblems}
                    </div>

                    {/* Action Button - Always at bottom */}
                    <Button
                      className={`w-full mt-auto ${isCompleted
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-[#FF7A00] hover:bg-[#FF6A00]'
                        }`}
                      onClick={() => window.location.href = `/student/courses/${course._id}`}
                    >
                      {isCompleted ? '▶ Review' : isOngoing ? '▶ Continue' : '▶ Start Course'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Summary */}
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredCourses.length} of {courses.length} courses
        </div>

        {/* Compiler Info */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-[#FF7A00] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">ℹ</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">In-Browser Compiler Available</h4>
                <p className="text-sm text-gray-600">
                  All courses include an integrated compiler with test cases. You can write, run, and test your code directly in the browser.
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Pre-configured test cases for each problem</li>
                  <li>• Real-time code execution</li>
                  <li>• Report incorrect questions or provide feedback</li>
                  <li>• Track your solutions history</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
