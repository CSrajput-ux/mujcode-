import StudentLayout from '../../components/StudentLayout';
import { TrendingUp, Target, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '../../services/apiClient';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [, setUserId] = useState<number | string | null>(null);

  // State for all data
  const [rankings, setRankings] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [topicData, setTopicData] = useState<any[]>([]);
  const [improvementAreas, setImprovementAreas] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const studentId = user.college_id || user.id || user._id;
    if (studentId) {
      setUserId(studentId);
      fetchAllData(studentId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAllData = async (studentId: number | string) => {
    try {
      const [rankRes, trendRes, topicRes, improvementRes, summaryRes] = await Promise.all([
        apiClient.get(`/api/student/rankings/${studentId}`).catch(() => ({ data: { ranks: [] } })),
        apiClient.get(`/api/student/analytics/trend/${studentId}`).catch(() => ({ data: { trend: [] } })),
        apiClient.get(`/api/student/analytics/topics/${studentId}`).catch(() => ({ data: { topics: [] } })),
        apiClient.get(`/api/student/analytics/improvement/${studentId}`).catch(() => ({ data: { areas: [] } })),
        apiClient.get(`/api/student/analytics/summary/${studentId}`).catch(() => ({ data: {} })),
      ]);

      setRankings(rankRes.data || { ranks: [] });
      setTrendData(trendRes.data?.trend || []);
      setTopicData(topicRes.data?.topics || []);
      setImprovementAreas(improvementRes.data?.areas || []);
      setSummary(summaryRes.data || {});
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const ranksList = (rankings?.ranks && rankings.ranks.length > 0)
    ? rankings.ranks
    : [
        { label: 'College Rank', value: '#1', total: 'Rank across College' },
        { label: 'Branch Rank', value: '#1', total: 'Rank in your Branch' },
        { label: 'Section Rank', value: '#1', total: 'Rank in your Section' }
      ];

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-48">
          <div className="text-sm font-medium text-gray-500">Loading analytics...</div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="pb-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Performance Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track your learning velocity, rankings, and topic performance</p>
        </div>

        {/* Performance Rankings (Compact Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {ranksList.map((rank: any, idx: number) => {
            const colors = [
              { bg: 'bg-orange-50/70', border: 'border-orange-200/80', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
              { bg: 'bg-blue-50/70', border: 'border-blue-200/80', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
              { bg: 'bg-emerald-50/70', border: 'border-emerald-200/80', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' }
            ];
            const color = colors[idx % colors.length];

            return (
              <div
                key={idx}
                className={`${color.bg} border ${color.border} rounded-xl p-3.5 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow`}
              >
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{rank.label}</div>
                  <div className={`text-2xl font-bold ${color.text} tracking-tight`}>{rank.value}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{rank.total}</div>
                </div>
                <div className={`w-8 h-8 rounded-lg ${color.badge} flex items-center justify-center flex-shrink-0`}>
                  <Target className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Trend (Compact Card) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#FF7A00]" />
              <h2 className="text-sm font-bold text-gray-900">Performance Trend</h2>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">Problem solving velocity</span>
          </div>
          <div className="p-4">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value: number) => [`${value} Problems`, 'Total Solved']}
                  />
                  <Line
                    type="monotone"
                    dataKey="solved"
                    stroke="#FF7A00"
                    strokeWidth={2}
                    dot={{ fill: '#FF7A00', r: 3 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-36 flex flex-col items-center justify-center text-xs text-gray-400 space-y-1">
                <TrendingUp className="w-6 h-6 text-gray-300 mb-1" />
                <span>No activity trend recorded yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Topic Performance & Areas for Improvement (Compact Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Topic-wise Performance */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-[#FF7A00]" />
              <h2 className="text-sm font-bold text-gray-900">Topic-wise Performance</h2>
            </div>
            <div className="p-4">
              {topicData.length > 0 ? (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={topicData.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="topic" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="percentage" fill="#FF7A00" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-36 flex flex-col items-center justify-center text-xs text-gray-400 space-y-1">
                  <BookOpen className="w-6 h-6 text-gray-300 mb-1" />
                  <span>No topic performance data yet</span>
                </div>
              )}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center space-x-2">
              <Target className="w-4 h-4 text-[#FF7A00]" />
              <h2 className="text-sm font-bold text-gray-900">Areas for Improvement</h2>
            </div>
            <div className="p-4">
              {improvementAreas.length > 0 ? (
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                  {[...improvementAreas]
                    .sort((a, b) => b.percentage - a.percentage)
                    .map((area, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <div className="font-semibold text-xs text-gray-900">{area.topic}</div>
                          <div className="text-[10px] text-gray-500">{area.category}</div>
                        </div>
                        <span className="text-xs font-bold text-red-600">{area.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-red-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${area.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-36 flex flex-col items-center justify-center text-xs text-emerald-600 space-y-1">
                  <Target className="w-6 h-6 text-emerald-400 mb-1" />
                  <span className="font-medium">Great job! No weak areas detected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tests & Assignments Summary (Compact Cards) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Completed Tests & Assignments Summary</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 rounded-lg bg-orange-50/50 border border-orange-100/60">
                <div className="text-2xl font-bold text-[#FF7A00] mb-0.5">
                  {summary?.testsCompleted || 0}
                </div>
                <div className="text-xs text-gray-600 font-medium">Tests Completed</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50/50 border border-blue-100/60">
                <div className="text-2xl font-bold text-blue-600 mb-0.5">
                  {summary?.assignmentsSubmitted || 0}
                </div>
                <div className="text-xs text-gray-600 font-medium">Assignments Submitted</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-emerald-50/50 border border-emerald-100/60">
                <div className="text-2xl font-bold text-emerald-600 mb-0.5">
                  {summary?.averageScore || 0}%
                </div>
                <div className="text-xs text-gray-600 font-medium">Average Score</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-50/50 border border-amber-100/60">
                <div className="text-2xl font-bold text-amber-600 mb-0.5">
                  {summary?.certifications || 0}
                </div>
                <div className="text-xs text-gray-600 font-medium">Certifications</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
