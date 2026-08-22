import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, Target, UserCheck, Briefcase } from 'lucide-react';

export default function CompanyAnalyticsPage() {
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch from /api/v1/company/dashboard/stats?type=analytics
    // For now, we mock the analytics data based on the general stats
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/v1/company/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setFunnelData([
            { name: 'Applied', value: data.applicants || 1500, fill: '#3B82F6' },
            { name: 'Screened', value: Math.floor((data.applicants || 1500) * 0.6), fill: '#F59E0B' },
            { name: 'Interviewed', value: Math.floor((data.applicants || 1500) * 0.2), fill: '#8B5CF6' },
            { name: 'Hired', value: data.hired || 45, fill: '#10B981' }
          ]);
          
          // Mock 6-month trend data
          setTrendData([
            { month: 'Jan', applicants: 120, hired: 5 },
            { month: 'Feb', applicants: 250, hired: 12 },
            { month: 'Mar', applicants: 380, hired: 15 },
            { month: 'Apr', applicants: 420, hired: 18 },
            { month: 'May', applicants: 500, hired: 22 },
            { month: 'Jun', applicants: 850, hired: 45 },
          ]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex justify-center items-center space-x-2">
          <div className="w-3 h-3 bg-[#FF7A00] rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-[#FF7A00] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-3 h-3 bg-[#FF7A00] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Recruitment Analytics</h2>
        <p className="text-gray-500">Insights into your hiring funnel and conversion rates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hiring Funnel Chart */}
        <Card className="border-0 shadow-sm rounded-xl bg-white/70 backdrop-blur-md overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <Target className="w-5 h-5 mr-2 text-[#FF7A00]" />
              Hiring Funnel Conversion
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontWeight={500} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trend Area Chart */}
        <Card className="border-0 shadow-sm rounded-xl bg-white/70 backdrop-blur-md overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-[#FF7A00]" />
              Applicants vs Hires (6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApplicants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHired" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="applicants" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorApplicants)" />
                <Area type="monotone" dataKey="hired" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorHired)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Time to Hire</p>
                <h3 className="text-3xl font-bold text-gray-900">14 Days</h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Offer Acceptance</p>
                <h3 className="text-3xl font-bold text-gray-900">82%</h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">Cost per Hire</p>
                <h3 className="text-3xl font-bold text-gray-900">$250</h3>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                <Target className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
