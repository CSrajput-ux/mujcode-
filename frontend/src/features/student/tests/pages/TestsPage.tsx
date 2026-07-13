import { useEffect, useState } from 'react';
import StudentLayout from '@/app/components/StudentLayout';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Code2, FileText, Zap, Building2, Video, Calendar, Clock, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import SecureExamGuard from '@/app/components/SecureExamGuard';
import { getTests, getTestById, submitTest, Test } from '@/app/services/testService';
import { toast } from 'sonner';

export default function Tests() {
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<Test[]>([]);
  const [studentId] = useState("student_123"); // TODO: Replace with actual auth user ID

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({}); // questionId -> selectedOptionIndex
  const [warnings, setWarnings] = useState(0);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const data = await getTests();
      setTests(data);
    } catch (error) {
      console.error("Failed to fetch tests", error);
      toast.error("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (testId: string) => {
    try {
      const fullTest = await getTestById(testId);
      setActiveTest(fullTest);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setWarnings(0);
    } catch (error) {
      toast.error("Failed to start test");
    }
  };

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleViolation = (reason: string) => {
    setWarnings(prev => prev + 1);
    // SecureExamGuard handles the UI toast warnings
    console.warn("External Violation Log:", reason);
  };

  const handleSubmit = async () => {
    if (!activeTest) return;

    // Transform answers object to array
    const formattedAnswers = Object.keys(answers).map(qId => ({
      questionId: qId,
      selectedOption: answers[qId]
    }));

    try {
      const result = await submitTest({
        testId: activeTest._id,
        studentId: studentId,
        answers: formattedAnswers,
        warningsIssued: warnings
      });

      toast.success(`Test Submitted! Score: ${result.score}/${result.totalMaxScore}`);
      setActiveTest(null);
      fetchTests(); // Refresh lists
    } catch (error) {
      toast.error("Failed to submit test");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Coding': return <Code2 className="w-5 h-5" />;
      case 'Lab': return <FileText className="w-5 h-5" />;
      case 'Quiz': return <Zap className="w-5 h-5" />;
      case 'Company': return <Building2 className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Coding': return 'bg-blue-500';
      case 'Lab': return 'bg-purple-500';
      case 'Quiz': return 'bg-green-500';
      case 'Company': return 'bg-[#FF7A00]';
      default: return 'bg-gray-500';
    }
  };

  // Helper to filter tests
  const upcomingTests = tests.filter(t => t.status === 'Upcoming');
  const liveTests = tests.filter(t => t.status === 'Live');
  const completedTests = tests.filter(t => t.status === 'Completed'); // Backend handles completed status logic or we check submissions

  // --- ACTIVE TEST RENDER ---
  if (activeTest) {
    const currentQuestion = activeTest.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === activeTest.questions.length - 1;

    const TestContent = (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="flex justify-between items-center bg-gray-50 p-6 rounded-lg border mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{activeTest.title}</h1>
              <p className="text-gray-500 mt-1">Question {currentQuestionIndex + 1} of {activeTest.questions.length}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Duration</div>
              <div className="text-2xl font-mono font-bold text-[#FF7A00]">{activeTest.duration} min</div>
            </div>
          </header>

          {/* Question Card */}
          <div className="space-y-8">
            <Card className="border-l-4 border-l-[#FF7A00]">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Question {currentQuestionIndex + 1}</h3>
                <p className="text-gray-700 text-lg mb-6">{currentQuestion.text}</p>

                <div className="space-y-3">
                  {currentQuestion.options?.map((opt, i) => (
                    <div
                      key={i}
                      onClick={() => handleOptionSelect(currentQuestion._id, i)}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${answers[currentQuestion._id] === i ? 'bg-orange-50 border-[#FF7A00]' : 'hover:bg-gray-50'
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${answers[currentQuestion._id] === i ? 'border-[#FF7A00] bg-[#FF7A00]' : 'border-gray-300'
                        }`}>
                        {answers[currentQuestion._id] === i && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className="text-gray-700">{opt}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>

              <div className="space-x-4">
                {/* Exit without submitting? Maybe warn or confirm. Using activeTest(null) effectively cancels. */}
                <Button variant="ghost" className="text-red-600" onClick={() => {
                  if (confirm("Are you sure you want to exit? Your progress will be lost.")) setActiveTest(null);
                }}>
                  Exit
                </Button>

                {isLastQuestion ? (
                  <Button className="bg-green-600 hover:bg-green-700" onClick={handleSubmit}>
                    Submit Test
                  </Button>
                ) : (
                  <Button
                    className="bg-[#FF7A00] hover:bg-[#FF6A00]"
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(activeTest.questions.length - 1, prev + 1))}
                  >
                    Next Question
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    if (activeTest.proctored) {
      return (
        <SecureExamGuard
          isExamActive={true}
          onTerminate={handleSubmit}
          onViolation={handleViolation}
        >
          {TestContent}
        </SecureExamGuard>
      );
    }

    return TestContent;
  }

  // --- LISTING RENDER ---
  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tests & Assessments</h1>
          <p className="text-gray-600">Manage your scheduled and completed tests</p>
        </div>

        {loading ? (
          <div>Loading tests...</div>
        ) : (
          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
                Upcoming ({upcomingTests.length})
              </TabsTrigger>
              <TabsTrigger value="live" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
                Live ({liveTests.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white">
                Completed ({completedTests.length})
              </TabsTrigger>
            </TabsList>

            {/* Upcoming Tests */}
            <TabsContent value="upcoming" className="space-y-4">
              {upcomingTests.length === 0 && <p className="text-gray-500">No upcoming tests.</p>}
              {upcomingTests.map((test) => (
                <Card key={test._id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`${getTypeColor(test.type)} p-3 rounded-lg text-white`}>
                          {getTypeIcon(test.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{test.title}</h3>
                            {test.proctored && (
                              <Badge className="bg-red-500">
                                <Video className="w-3 h-3 mr-1" />
                                Camera Proctored
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1 text-[#FF7A00]" />
                              {new Date(test.startTime!).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1 text-[#FF7A00]" />
                              {test.duration} min
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        className="bg-[#FF7A00] hover:bg-[#FF6A00]"
                        onClick={() => handleStartTest(test._id)}
                      >
                        Start Now (Dev Mode)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Live Tests */}
            <TabsContent value="live" className="space-y-4">
              {liveTests.length === 0 && <p className="text-gray-500">No live tests.</p>}
              {liveTests.map((test) => (
                <Card key={test._id} className="shadow-md border-2 border-[#FF7A00]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="bg-red-500 p-3 rounded-lg text-white">
                          {getTypeIcon(test.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{test.title}</h3>
                          <Badge className="bg-red-500">LIVE NOW</Badge>
                        </div>
                      </div>
                      <Button
                        className="bg-[#FF7A00] hover:bg-[#FF6A00]"
                        onClick={() => handleStartTest(test._id)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Join Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Completed Tests */}
            <TabsContent value="completed" className="space-y-4">
              {completedTests.map((test) => (
                <Card key={test._id} className="shadow-md">
                  <CardContent className="p-6">
                    <p>{test.title}</p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

          </Tabs>
        )}
      </div>
    </StudentLayout>
  );
}
