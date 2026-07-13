import StudentLayout from '@/app/components/StudentLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { TrendingUp, Target, Award, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  // State for all data
  const [rankings, setRankings] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [topicData, setTopicData] = useState<any[]>([]);
  const [improvementAreas, setImprovementAreas] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // Extract numeric college_id from user data
    const studentId = user.college_id || user.id;
    if (studentId) {
      setUserId(studentId);
      fetchAllData(studentId);
    }
  }, []);

  const fetchAllData = async (studentId: number) => {
    try {
      // Fetch all analytics data
      const [rankRes, trendRes, topicRes, improvementRes, summaryRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/student/rankings/${studentId}`),
        fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/student/analytics/trend/${studentId}`),
        fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/student/analytics/topics/${studentId}`),
        fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/student/analytics/improvement/${studentId}`),
        fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/student/analytics/summary/${studentId}`)
      ]);

      const [rankData, trendData, topicData, improvementData, summaryData] = await Promise.all([
        rankRes.json(),
        trendRes.json(),
        topicRes.json(),
        improvementRes.json(),
        summaryRes.json()
      ]);

      setRankings(rankData);
      setTrendData(trendData.trend || []);
      setTopicData(topicData.topics || []);
      setImprovementAreas(improvementData.areas || []);
      setSummary(summaryData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading analytics...</div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Performance Analytics</h1>
          <p className="text-gray-600">Track your progress and identify areas for improvement</p>
        </div>

        {/* Performance Rankings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rankings?.ranks?.map((rank: any, idx: number) => {
            const colors = [
              { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
              { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
              { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' }
            ];
            const color = colors[idx];

            return (
              <Card key={idx} className={`${color.bg} border-2 ${color.border}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">{rank.label}</div>
                      <div className={`text-3xl font-bold ${color.text}`}>{rank.value}</div>
                      <div className="text-xs text-gray-500 mt-1">{rank.total}</div>
                    </div>
                    <Target className={`w-10 h-10 ${color.text} opacity-50`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-[#FF7A00]" />
              <span>Performance Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value: number) => [`${value} Problems`, 'Total Solved']}
                  />
                  <Line
                    type="monotone"
                    dataKey="solved"
                    stroke="#FF7A00"
                    strokeWidth={2}
                    dot={{ fill: '#FF7A00', r: 4 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No activity data yet. Start solving problems!
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Topic-wise Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#FF7A00]" />
                <span>Topic-wise Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topicData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topicData.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="percentage" fill="#FF7A00" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No topic data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-[#FF7A00]" />
                <span>Areas for Improvement</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {improvementAreas.length > 0 ? (
                <div className="space-y-4">
                  {improvementAreas.map((area, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">{area.topic}</div>
                          <div className="text-xs text-gray-500">{area.category}</div>
                        </div>
                        <span className="text-sm font-semibold text-red-600">{area.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{ width: `${area.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Great job! No weak areas found
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tests & Assignments Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Completed Tests & Assignments Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#FF7A00] mb-2">
                  {summary?.testsCompleted || 0}
                </div>
                <div className="text-sm text-gray-600">Tests Completed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {summary?.assignmentsSubmitted || 0}
                </div>
                <div className="text-sm text-gray-600">Assignments Submitted</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {summary?.averageScore || 0}%
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-yellow-600 mb-2">
                  {summary?.certifications || 0}
                </div>
                <div className="text-sm text-gray-600">Certifications</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
