import { useNavigate } from 'react-router-dom';
import {
  Code2,
  CheckCircle,
  Building2,
  Users,
  Award,
  Shield,
  Lock,
  Eye,
  Zap,
  GraduationCap,
  FileText,
  UserCheck,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Target,
  Lightbulb,
  BookOpenCheck
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import logoImage from '@/assets/image-removebg-preview.png';

export default function LandingPage() {
  const navigate = useNavigate();

  const stats = [
    { label: 'Total Tests Conducted', value: '15,000+' },
    { label: 'Students Placed', value: '2,500+' },
    { label: 'Partner Companies', value: '150+' },
    { label: 'Active Students', value: '8,000+' }
  ];

  const features = [
    {
      icon: <Shield className="w-12 h-12 text-[#FF7A00]" />,
      title: 'Secure Online Tests',
      description: 'Camera proctored tests with advanced anti-cheating mechanisms'
    },
    {
      icon: <Code2 className="w-12 h-12 text-[#FF7A00]" />,
      title: 'Industry-Level Coding',
      description: 'Real-world coding problems with in-browser compiler support'
    },
    {
      icon: <Users className="w-12 h-12 text-[#FF7A00]" />,
      title: 'Faculty-Guided Learning',
      description: 'Personalized mentorship and structured learning paths'
    },
    {
      icon: <Building2 className="w-12 h-12 text-[#FF7A00]" />,
      title: 'Company Hiring Platform',
      description: 'Direct placement opportunities with top tech companies'
    }
  ];

  const security = [
    { icon: <Lock />, text: 'End-to-end encryption' },
    { icon: <Eye />, text: 'Camera proctoring' },
    { icon: <Shield />, text: 'Plagiarism detection' },
    { icon: <Zap />, text: 'Real-time monitoring' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src={logoImage} alt="MujCode Logo" className="w-10 h-10" />
              <span className="text-2xl font-bold text-gray-900">MujCode</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button className="text-gray-700 hover:text-[#FF7A00] transition-colors">Explore</button>
              <button
                onClick={() => {
                  const aboutSection = document.getElementById('about-mujcode');
                  aboutSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-gray-700 hover:text-[#FF7A00] transition-colors"
              >
                About MujCode
              </button>
              <Button
                onClick={() => navigate('/login')}
                className="bg-[#FF7A00] hover:bg-[#FF6A00] text-white px-6 py-2 rounded-lg"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Code. Learn. Test. Get Placed.
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            The complete platform for college-level coding education, assessment, and placement
          </p>
          <Button
            onClick={() => navigate('/login')}
            className="bg-[#FF7A00] hover:bg-[#FF6A00] text-white px-8 py-4 text-lg rounded-lg"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="py-16 bg-gray-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-[#FF7A00] mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16">
            Comprehensive tools for coding education and career growth
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 border-gray-100 hover:border-[#FF7A00] transition-all rounded-xl">
                <CardContent className="p-8 text-center">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Security & Trust
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            Industry-standard security measures to ensure fair assessment
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {security.map((item, index) => (
              <Card key={index} className="border-none shadow-md">
                <CardContent className="p-6 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#FF7A00] bg-opacity-10 rounded-full flex items-center justify-center text-[#FF7A00]">
                    {item.icon}
                  </div>
                  <span className="text-gray-900 font-medium">{item.text}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT MUJCODE SECTION */}
      <section id="about-mujcode" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-[#FF7A00] mb-4">
              What is MujCode?
            </h2>
            <p className="text-2xl text-gray-700 max-w-4xl mx-auto">
              A complete college-level coding, learning, testing, and placement ecosystem.
            </p>
          </div>

          {/* What is MujCode - Intro Block with Flow */}
          <div className="mb-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Text Content */}
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  An Integrated Digital Platform
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  MujCode is an integrated digital platform designed for colleges to manage
                  coding practice, academic learning, online assessments, and campus placements
                  in one secure environment.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  It bridges the gap between students, faculty, administration, and recruiting
                  companies, creating a seamless ecosystem for technical education and career advancement.
                </p>
              </div>

              {/* Flow Diagram */}
              <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-8 shadow-lg">
                <div className="flex flex-col space-y-4">
                  {/* Student */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-[#FF7A00] rounded-full flex items-center justify-center shadow-md">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Student</p>
                      <p className="text-sm text-gray-600">Learns & Practices</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-[#FF7A00]" />
                  </div>

                  {/* Practice & Learn */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-[#FF7A00] rounded-full flex items-center justify-center shadow-md">
                      <Code2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Practice & Learn</p>
                      <p className="text-sm text-gray-600">Problems & Courses</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-[#FF7A00]" />
                  </div>

                  {/* Tests */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-[#FF7A00] rounded-full flex items-center justify-center shadow-md">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Tests</p>
                      <p className="text-sm text-gray-600">Secure Assessment</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-[#FF7A00]" />
                  </div>

                  {/* Placement */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-[#FF7A00] rounded-full flex items-center justify-center shadow-md">
                      <Briefcase className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Placement</p>
                      <p className="text-sm text-gray-600">Job Opportunities</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-[#FF7A00]" />
                  </div>

                  {/* Company */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-[#FF7A00] rounded-full flex items-center justify-center shadow-md">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Company</p>
                      <p className="text-sm text-gray-600">Hires Top Talent</p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Who Created MujCode */}
          <div className="mb-20 bg-gradient-to-br from-orange-50 to-white rounded-2xl p-12">
            <h3 className="text-3xl font-bold text-[#FF7A00] mb-8 text-center">
              Who Built MujCode?
            </h3>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-700 leading-relaxed mb-8 text-center">
                MujCode is built to solve real problems in college education and placements.
                It is designed by students and educators who understand:
              </p>
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <Card className="border-2 border-[#FF7A00] border-opacity-20 shadow-md">
                  <CardContent className="p-6 text-center">
                    <Target className="w-12 h-12 text-[#FF7A00] mx-auto mb-3" />
                    <p className="text-gray-800 font-medium">Lack of practical coding exposure</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-[#FF7A00] border-opacity-20 shadow-md">
                  <CardContent className="p-6 text-center">
                    <Lightbulb className="w-12 h-12 text-[#FF7A00] mx-auto mb-3" />
                    <p className="text-gray-800 font-medium">Unstructured placement preparation</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-[#FF7A00] border-opacity-20 shadow-md">
                  <CardContent className="p-6 text-center">
                    <Shield className="w-12 h-12 text-[#FF7A00] mx-auto mb-3" />
                    <p className="text-gray-800 font-medium">Manual and insecure examination systems</p>
                  </CardContent>
                </Card>
              </div>
              {/* Creator Card */}
              <Card className="border-2 border-[#FF7A00] shadow-lg bg-white">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 bg-[#FF7A00] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">
                    Built by Visionary Students & Educators
                  </h4>
                  <p className="text-lg text-[#FF7A00] font-semibold">
                    For Colleges, For Careers
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* How MujCode Works - Step Flow */}
          <div className="mb-20">
            <h3 className="text-3xl font-bold text-[#FF7A00] mb-12 text-center">
              How MujCode Works
            </h3>
            <div className="max-w-5xl mx-auto">
              <div className="space-y-8">
                {/* Step 1 */}
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-[#FF7A00] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl font-bold">1</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-xl shadow-md p-6 border-2 border-gray-100 hover:border-[#FF7A00] transition-all">
                    <div className="flex items-start space-x-4">
                      <UserCheck className="w-10 h-10 text-[#FF7A00] flex-shrink-0" />
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Student Registration</h4>
                        <p className="text-gray-700">Students are added and approved by Admin to ensure secure access to the platform.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-8 flex justify-center">
                    <div className="w-1 h-24 bg-gradient-to-b from-[#FF7A00] to-transparent"></div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-[#FF7A00] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl font-bold">2</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-xl shadow-md p-6 border-2 border-gray-100 hover:border-[#FF7A00] transition-all">
                    <div className="flex items-start space-x-4">
                      <BookOpenCheck className="w-10 h-10 text-[#FF7A00] flex-shrink-0" />
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Learning & Practice</h4>
                        <p className="text-gray-700">Access comprehensive courses, solve coding problems, and complete assignments to build skills.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-8 flex justify-center">
                    <div className="w-1 h-24 bg-gradient-to-b from-[#FF7A00] to-transparent"></div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-[#FF7A00] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl font-bold">3</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-xl shadow-md p-6 border-2 border-gray-100 hover:border-[#FF7A00] transition-all">
                    <div className="flex items-start space-x-4">
                      <FileText className="w-10 h-10 text-[#FF7A00] flex-shrink-0" />
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Evaluation</h4>
                        <p className="text-gray-700">Take secure tests, quizzes, and lab exams with real-time analytics and performance tracking.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-8 flex justify-center">
                    <div className="w-1 h-24 bg-gradient-to-b from-[#FF7A00] to-transparent"></div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-[#FF7A00] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl font-bold">4</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-xl shadow-md p-6 border-2 border-gray-100 hover:border-[#FF7A00] transition-all">
                    <div className="flex items-start space-x-4">
                      <Users className="w-10 h-10 text-[#FF7A00] flex-shrink-0" />
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Faculty Monitoring</h4>
                        <p className="text-gray-700">Faculty track student progress, provide guidance, and create personalized learning experiences.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-8 flex justify-center">
                    <div className="w-1 h-24 bg-gradient-to-b from-[#FF7A00] to-transparent"></div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-[#FF7A00] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl font-bold">5</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-xl shadow-md p-6 border-2 border-gray-100 hover:border-[#FF7A00] transition-all">
                    <div className="flex items-start space-x-4">
                      <Briefcase className="w-10 h-10 text-[#FF7A00] flex-shrink-0" />
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Placement Process</h4>
                        <p className="text-gray-700">Companies conduct tests and interviews through the platform to identify top talent.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-8 flex justify-center">
                    <div className="w-1 h-24 bg-gradient-to-b from-[#FF7A00] to-transparent"></div>
                  </div>
                </div>

                {/* Step 6 */}
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-[#FF7A00] rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-xl font-bold">6</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-white rounded-xl shadow-md p-6 border-2 border-[#FF7A00] hover:border-[#FF7A00] transition-all">
                    <div className="flex items-start space-x-4">
                      <Award className="w-10 h-10 text-[#FF7A00] flex-shrink-0" />
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Final Selection</h4>
                        <p className="text-gray-700">Offer letters are released via the platform, completing the end-to-end placement journey.</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-8"></div>
                </div>
              </div>
            </div>
          </div>

          {/* MujCode Dashboards Overview */}
          <div className="mb-20 bg-gray-50 rounded-2xl p-12">
            <h3 className="text-3xl font-bold text-[#FF7A00] mb-4 text-center">
              MujCode Dashboards Overview
            </h3>
            <p className="text-lg text-gray-700 text-center mb-12 max-w-3xl mx-auto">
              Four specialized dashboards tailored for different user roles in the ecosystem
            </p>
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Student Dashboard */}
              <Card className="border-2 border-[#FF7A00] border-opacity-30 hover:border-[#FF7A00] shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-[#FF7A00] rounded-full flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">Student Dashboard</h4>
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>Learn programming & subjects</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>Solve interview-level problems</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>Give tests & assignments</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>View analytics, ranks, certificates</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Faculty Dashboard */}
              <Card className="border-2 border-[#FF7A00] border-opacity-30 hover:border-[#FF7A00] shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-[#FF7A00] rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">Faculty Dashboard</h4>
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>Create tests, quizzes, assignments</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>Approve student permissions</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>Track student performance</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>Create questions & communities</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Admin Dashboard */}
              <Card className="border-2 border-[#FF7A00] border-opacity-30 hover:border-[#FF7A00] shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-[#FF7A00] rounded-full flex items-center justify-center">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">Admin Dashboard</h4>
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>Manage students, faculty, companies</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>Approve courses & question bank</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>Control placements & eligibility</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>Monitor security, logs & analytics</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Company Dashboard */}
              <Card className="border-2 border-[#FF7A00] border-opacity-30 hover:border-[#FF7A00] shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-[#FF7A00] rounded-full flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">Company Dashboard</h4>
                  </div>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>Post job drives</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>Conduct coding tests</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>Shortlist candidates</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-[#FF7A00] flex-shrink-0 mt-0.5" />
                      <span>Release offer letters</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Why MujCode - Value Section */}
          <div className="mb-20">
            <h3 className="text-3xl font-bold text-[#FF7A00] mb-4 text-center">
              Why MujCode?
            </h3>
            <p className="text-lg text-gray-700 text-center mb-12 max-w-3xl mx-auto">
              The complete solution for modern technical education and placement management
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Secure Online Exams */}
              <Card className="border-2 border-gray-100 hover:border-[#FF7A00] shadow-md hover:shadow-lg transition-all rounded-xl">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-[#FF7A00]" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Secure Online Exams</h4>
                  <p className="text-gray-600">
                    Advanced proctoring, plagiarism detection, and real-time monitoring ensure fair assessment
                  </p>
                </CardContent>
              </Card>

              {/* Industry-Level Coding Practice */}
              <Card className="border-2 border-gray-100 hover:border-[#FF7A00] shadow-md hover:shadow-lg transition-all rounded-xl">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Code2 className="w-8 h-8 text-[#FF7A00]" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Industry-Level Coding Practice</h4>
                  <p className="text-gray-600">
                    Real-world problems with in-browser compiler and instant feedback
                  </p>
                </CardContent>
              </Card>

              {/* Faculty-Guided Learning */}
              <Card className="border-2 border-gray-100 hover:border-[#FF7A00] shadow-md hover:shadow-lg transition-all rounded-xl">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-[#FF7A00]" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Faculty-Guided Learning</h4>
                  <p className="text-gray-600">
                    Personalized mentorship and structured curriculum with progress tracking
                  </p>
                </CardContent>
              </Card>

              {/* End-to-End Placement Support */}
              <Card className="border-2 border-gray-100 hover:border-[#FF7A00] shadow-md hover:shadow-lg transition-all rounded-xl">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-[#FF7A00]" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">End-to-End Placement Support</h4>
                  <p className="text-gray-600">
                    Complete placement lifecycle management from drives to offer letters
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={logoImage} alt="MujCode Logo" className="w-6 h-6" />
                <span className="text-xl font-bold">MujCode</span>
              </div>
              <p className="text-gray-400">
                Empowering students with coding skills and career opportunities
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>For Students</li>
                <li>For Faculty</li>
                <li>For Companies</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>Tutorials</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>support@mujcode.edu</li>
                <li>+91 1234567890</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2026 MujCode. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}