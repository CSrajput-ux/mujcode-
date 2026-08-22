import { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/card';
import { Search, Trophy, Medal, Star, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export default function ResultsPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // For results, we reuse candidates API and mock scores since actual coding test integration isn't fully wired for ATS yet
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/v1/company/candidates')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          // Add mock scores to the candidates for the Results view
          const withScores = (data.candidates || []).map((c: any, i: number) => ({
            ...c,
            score: Math.floor(Math.random() * 40) + 60, // 60-100 random score
            rank: i + 1
          })).sort((a: any, b: any) => b.score - a.score);
          
          // Re-assign ranks after sort
          withScores.forEach((c: any, i: number) => c.rank = i + 1);
          setCandidates(withScores);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredCandidates = candidates.filter((c: any) => 
    c.studentDetails?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assessment Results</h2>
          <p className="text-gray-500">Leaderboard and performance metrics of candidates</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search candidates..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#FF7A00] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm">No results found.</div>
        ) : (
          filteredCandidates.map((candidate: any) => (
            <Card key={candidate._id} className="border-0 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-all group">
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-shrink-0 relative">
                  {candidate.rank === 1 && <Trophy className="absolute -top-3 -left-3 w-8 h-8 text-yellow-500 fill-yellow-500 drop-shadow-md z-10" />}
                  {candidate.rank === 2 && <Medal className="absolute -top-3 -left-3 w-8 h-8 text-gray-400 fill-gray-300 drop-shadow-md z-10" />}
                  {candidate.rank === 3 && <Medal className="absolute -top-3 -left-3 w-8 h-8 text-amber-600 fill-amber-500 drop-shadow-md z-10" />}
                  
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shadow-inner ${
                    candidate.rank === 1 ? 'bg-yellow-100 text-yellow-700 ring-4 ring-yellow-50' :
                    candidate.rank === 2 ? 'bg-gray-100 text-gray-700 ring-4 ring-gray-50' :
                    candidate.rank === 3 ? 'bg-orange-100 text-orange-700 ring-4 ring-orange-50' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    #{candidate.rank}
                  </div>
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-bold text-gray-900">{candidate.studentDetails?.name}</h3>
                  <div className="text-sm text-gray-500 mt-1 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                    <span>{candidate.driveId?.title}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{candidate.studentDetails?.branch}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end border-l pl-0 sm:pl-6 border-gray-100">
                  <div className="text-sm font-medium text-gray-500">Overall Score</div>
                  <div className="text-3xl font-extrabold text-[#FF7A00] flex items-center">
                    {candidate.score}
                    <span className="text-sm font-medium text-gray-400 ml-1">/ 100</span>
                  </div>
                </div>

                <div className="w-full sm:w-auto mt-4 sm:mt-0 pl-0 sm:pl-6">
                  <Button variant="outline" className="w-full group-hover:border-[#FF7A00] group-hover:text-[#FF7A00] transition-colors">
                    View Report
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
