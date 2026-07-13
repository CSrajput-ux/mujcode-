import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, Users, UserCheck, Briefcase } from 'lucide-react';

interface AnalyticsDashboardProps {
  dashboardData: any;
}

export default function AnalyticsDashboard({ dashboardData }: AnalyticsDashboardProps) {
  const { funnel, activeDrives, applicants, shortlisted, hired, recentApplicants } = dashboardData;

  const funnelData = useMemo(() => {
    if (!funnel) return [];
    
    return [
      { name: 'Applied', value: funnel['Applied'] || 0, color: '#94a3b8' },
      { name: 'Screening', value: funnel['Screening'] || 0, color: '#3b82f6' },
      { name: 'Testing', value: funnel['Testing'] || 0, color: '#eab308' },
      { name: 'Interview', value: funnel['Interview'] || 0, color: '#a855f7' },
      { name: 'Offered', value: funnel['Offered'] || 0, color: '#22c55e' },
      { name: 'Hired', value: funnel['Hired'] || 0, color: '#10b981' }
    ];
  }, [funnel]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Drives</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{activeDrives}</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Applicants</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{applicants}</h3>
              </div>
              <div className="p-2 bg-[#FF7A00]/10 rounded-lg">
                <Users className="w-5 h-5 text-[#FF7A00]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Shortlisted</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{shortlisted}</h3>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Hired</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{hired}</h3>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recruitment Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Applicants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplicants && recentApplicants.map((app: any) => (
                <div key={app._id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div>
                    <h4 className="font-semibold text-gray-900">{app.studentDetails.name}</h4>
                    <p className="text-xs text-gray-500">{app.driveId?.title || 'Unknown Drive'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                      {app.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!recentApplicants || recentApplicants.length === 0) && (
                <div className="text-center text-gray-500 py-8">
                  No applicants yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
