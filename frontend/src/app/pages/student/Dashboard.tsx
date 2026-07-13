import StudentLayout from '../../components/StudentLayout';
import YearlyActivity from '../../components/YearlyActivity';
import StudentStats from '../../components/StudentStats';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Trophy,
  Users,
  Calendar,
  Clock
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [ranks, setRanks] = useState([
    { label: 'College Rank', value: '#-', total: '/ -' },
    { label: 'Branch Rank', value: '#-', total: '/ -' },
    { label: 'Section Rank', value: '#-', total: '/ -' }
  ]);
  const [loadingRanks, setLoadingRanks] = useState(true);
  const [mentors, setMentors] = useState<{ name: string, subject: string, avatar: string, department: string }[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id;

        if (!userId) {
          setLoadingRanks(false);
          return;
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/student/rankings/${userId}`);
        const data = await res.json();

        if (res.ok && data.ranks) {
          setRanks(data.ranks);
        }
        setLoadingRanks(false);
      } catch (error) {
        console.error('Error fetching rankings:', error);
        setLoadingRanks(false);
      }
    };

    const fetchMentors = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const studentProfile = user.StudentProfile || {};

        const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/student/mentors/${user.id}`);
        const data = await res.json();

        if (res.ok && Array.isArray(data)) {
          const mappedMentors = data.map((f: any) => ({
            name: f.name,
            subject: f.subject || 'Mentor',
            avatar: f.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
            department: f.department
          }));
          setMentors(mappedMentors);
        }
        setLoadingMentors(false);
      } catch (error) {
        console.error('Error fetching mentors:', error);
        setLoadingMentors(false);
      }
    };

    fetchRankings();
    fetchMentors();
  }, []);

  const upcomingTests: any[] = [];

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {JSON.parse(localStorage.getItem('user') || '{}').name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-gray-600">Here's your learning progress overview</p>
        </div>

        {/* New LeetCode-style Stats & Badges */}
        <StudentStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ranks */}
          <Card className="shadow-md border-t-4 border-t-[#FF7A00]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-[#FF7A00]" />
                <span className="text-lg">Your Rankings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ranks.map((rank, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50/50 rounded-lg border border-orange-100/50">
                  <span className="text-gray-700 font-medium">{rank.label}</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-[#FF7A00]">{rank.value}</span>
                    <span className="text-sm text-gray-500 ml-1">{rank.total}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Faculty Mentors */}
          <Card className="shadow-md border-t-4 border-t-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="text-lg">Faculty Mentors</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingMentors ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : mentors.length > 0 ? (
                mentors.map((mentor, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-purple-50/50 rounded-lg border border-purple-100/50 hover:bg-purple-100 transition-colors group">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm transition-transform group-hover:scale-110">
                      {mentor.avatar}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-gray-900 truncate text-sm">{mentor.name}</p>
                      <p className="text-[11px] text-purple-600 font-semibold truncate uppercase">{mentor.subject}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 italic text-sm border-2 border-dashed border-gray-100 rounded-xl">
                  No faculty assigned for your section yet.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Tests */}
          <Card className="shadow-md border-t-4 border-t-[#FF7A00]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#FF7A00]" />
                <span className="text-lg">Upcoming Tests</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingTests.map((test, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-bold text-gray-900 text-sm truncate pr-2">{test.title}</p>
                    <span className="px-2 py-0.5 bg-[#FF7A00] text-white text-[10px] rounded-full font-bold">
                      {test.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-[11px] text-gray-500 font-medium">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-[#FF7A00]" />
                      {test.date}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-[#FF7A00]" />
                      {test.time}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Activity Heat Map */}
        <YearlyActivity />
      </div>
    </StudentLayout>
  );
}
