import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/StudentLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Briefcase, 
  Building2, 
  Calendar, 
  MapPin, 
  IndianRupee, 
  CheckCircle2, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  XCircle,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

export default function Jobs() {
  const [drives, setDrives] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'applied'>('all');

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const studentId = user.id || '';
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/student/ats/drives?studentId=${studentId}`);
      const data = await res.json();
      if (!data.error) {
        setDrives(data.drives || []);
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (drive: any) => {
    setApplying(drive._id);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const studentProfile = user.StudentProfile || {};
      
      const payload = {
        studentDetails: {
          id: user.id,
          name: user.name,
          email: user.email,
          branch: studentProfile.department || 'CSE',
          cgpa: studentProfile.cgpa || 8.5,
          score: 100, // standard default
          activeBacklogs: studentProfile.activeBacklogs || 0
        }
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/student/ats/drives/${drive._id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        alert(`Application Submitted Successfully!\nStatus: ${data.application.status}\nNotes: ${data.application.notes}`);
        fetchDrives(); // Refresh to show "Applied"
      } else {
        alert(`Failed to apply: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred during application');
    } finally {
      setApplying(null);
    }
  };

  // Get current user stats
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const studentProfile = user.StudentProfile || {};
  const studentCgpa = studentProfile.cgpa || 8.5;
  const studentBacklogs = studentProfile.activeBacklogs || 0;
  const studentBranch = studentProfile.department || 'CSE';

  // Filters
  const filteredDrives = drives.filter(drive => {
    const query = searchQuery.toLowerCase();
    const titleMatch = drive.title.toLowerCase().includes(query);
    const companyMatch = drive.companyId?.name?.toLowerCase().includes(query) || false;
    
    const matchesSearch = titleMatch || companyMatch;
    
    if (activeTab === 'applied') {
      const hasApplied = applications.some(app => app.driveId === drive._id);
      return matchesSearch && hasApplied;
    }
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Offered':
      case 'Hired':
        return <Badge className="bg-emerald-500 text-white font-bold animate-bounce">Offered 🎉</Badge>;
      case 'Interview':
        return <Badge className="bg-amber-500 text-white font-bold">Interviewing 🤝</Badge>;
      case 'Testing':
        return <Badge className="bg-blue-500 text-white font-bold">Online Test 📝</Badge>;
      case 'Rejected':
        return <Badge className="bg-rose-500 text-white font-bold">Closed ❌</Badge>;
      case 'Screening':
      case 'Applied':
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 border font-bold">Applied ⌛</Badge>;
    }
  };

  return (
    <StudentLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 p-8 md:p-12 text-white shadow-2xl">
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-400 via-red-500 to-slate-900 pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-1.5 text-sm font-bold text-orange-400 border border-orange-500/25">
              <Sparkles className="h-4 w-4" />
              Corporate Relations & Placements
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Placement <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">Headquarters</span>
            </h1>
            <p className="text-slate-300 font-medium md:text-lg">
              Welcome back, {user.name || 'Student'}. Explore verified campus recruitment drives, verify your eligibility, and launch your corporate career.
            </p>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm bg-white rounded-2xl ring-1 ring-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Drives</p>
                <p className="text-2xl font-black text-slate-800">{drives.length}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-orange-50 text-orange-600">
                <Briefcase className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-2xl ring-1 ring-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Applications</p>
                <p className="text-2xl font-black text-slate-800">{applications.length}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-2xl ring-1 ring-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your CGPA</p>
                <p className="text-2xl font-black text-slate-800">{studentCgpa}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-2xl ring-1 ring-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Backlogs</p>
                <p className={`text-2xl font-black ${studentBacklogs > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {studentBacklogs}
                </p>
              </div>
              <div className={`p-3.5 rounded-xl ${studentBacklogs > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                <AlertCircle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Buttons & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All Recruitment Drives
            </button>
            <button
              onClick={() => setActiveTab('applied')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'applied'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Applied ({applications.length})
            </button>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by role or company..."
              className="pl-10 h-11 bg-gray-50/50 border-none focus:ring-2 focus:ring-orange-500/20 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Drives List / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map(i => (
              <Card key={i} className="border-none shadow-sm rounded-2xl bg-white ring-1 ring-gray-100 h-96 animate-pulse" />
            ))
          ) : filteredDrives.length > 0 ? (
            filteredDrives.map(drive => {
              const userApp = applications.find(app => app.driveId === drive._id);
              const hasApplied = !!userApp;
              
              // Verify eligibility locally for frontend alerts
              const cgpaRequirement = drive.eligibility?.minCgpa || 0;
              const backlogLimit = drive.eligibility?.maxBacklogs ?? 0;
              const branchList = drive.eligibility?.branches || [];
              
              const isCgpaEligible = studentCgpa >= cgpaRequirement;
              const isBacklogEligible = studentBacklogs <= backlogLimit;
              const isBranchEligible = branchList.length === 0 || branchList.includes(studentBranch);
              
              const isEligible = isCgpaEligible && isBacklogEligible && isBranchEligible;

              return (
                <Card 
                  key={drive._id} 
                  className={`group relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl bg-white ring-1 ring-gray-100 flex flex-col justify-between ${
                    hasApplied ? 'ring-2 ring-emerald-500/30 font-semibold' : ''
                  }`}
                >
                  <CardContent className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                    
                    {/* Top Row: Company Info & Status */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 p-2.5 shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-300">
                          {drive.companyId?.logo ? (
                            <img 
                              src={drive.companyId.logo} 
                              alt={drive.companyId.name} 
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Building2 className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          {hasApplied ? (
                            getStatusBadge(userApp.status)
                          ) : (
                            <Badge className="bg-slate-100 text-slate-800 border-slate-200 border font-bold">
                              Accepting Applications
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Title & Industry */}
                      <div>
                        <h3 className="text-xl font-black text-slate-800 group-hover:text-orange-600 transition-colors uppercase tracking-tight line-clamp-1">
                          {drive.title}
                        </h3>
                        <p className="text-sm font-bold text-gray-400 mt-0.5">
                          {drive.companyId?.name || 'Unknown Company'} • {drive.companyId?.industry || 'Technology'}
                        </p>
                      </div>
                    </div>

                    {/* Logistics Details */}
                    <div className="space-y-2.5 py-4 border-y border-slate-50">
                      <div className="flex items-center text-sm font-bold text-slate-600">
                        <IndianRupee className="w-4 h-4 mr-2.5 text-orange-500" />
                        CTC: {drive.salary?.ctc ? `${drive.salary.ctc} LPA` : 'N/A'}
                        {drive.salary?.stipend && (
                          <span className="text-xs text-slate-400 font-medium ml-1">
                            (Stipend: ₹{drive.salary.stipend}/mo)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-sm font-bold text-slate-600">
                        <MapPin className="w-4 h-4 mr-2.5 text-orange-500" />
                        {drive.location ? `${drive.location} (${drive.locationType})` : drive.locationType}
                      </div>
                      <div className="flex items-center text-sm font-bold text-slate-600">
                        <Calendar className="w-4 h-4 mr-2.5 text-orange-500" />
                        Apply before: {drive.deadline ? new Date(drive.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </div>
                    </div>

                    {/* Eligibility Panel */}
                    <div className={`p-4 rounded-2xl text-xs space-y-2 ${isEligible ? 'bg-orange-50/50 text-orange-950' : 'bg-rose-50 text-rose-950'}`}>
                      <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[10px]">
                        {isEligible ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                            <span className="text-orange-700">Eligible to Apply</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="text-rose-700">Criteria Ineligible</span>
                          </>
                        )}
                      </div>
                      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-bold mt-1 text-slate-500">
                        <li className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          CGPA &ge; {drive.eligibility?.minCgpa || 0}
                          <span className="ml-0.5">{isCgpaEligible ? '✅' : '❌'}</span>
                        </li>
                        <li className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Backlogs &le; {drive.eligibility?.maxBacklogs ?? 0}
                          <span className="ml-0.5">{isBacklogEligible ? '✅' : '❌'}</span>
                        </li>
                        <li className="col-span-2 flex items-center gap-1 line-clamp-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Branch: {drive.eligibility?.branches?.join(', ') || 'Any'}
                          <span className="ml-0.5">{isBranchEligible ? '✅' : '❌'}</span>
                        </li>
                      </ul>
                    </div>

                    {/* Actions Button */}
                    <div className="pt-2">
                      {hasApplied ? (
                        <Button 
                          className="w-full h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold hover:bg-emerald-100 cursor-default"
                          disabled
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Already Applied
                        </Button>
                      ) : (
                        <Button 
                          className={`w-full h-11 rounded-xl font-bold transition-all shadow-md ${
                            isEligible 
                              ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20' 
                              : 'bg-slate-100 hover:bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-not-allowed'
                          }`}
                          onClick={() => isEligible && handleApply(drive)}
                          disabled={applying === drive._id || !isEligible}
                        >
                          {applying === drive._id ? 'Submitting...' : isEligible ? 'Apply Now' : 'Ineligible to Apply'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">No recruitment drives available</h3>
              <p className="text-gray-500 max-w-xs mx-auto mt-1">There are no active drives matching your search criteria right now.</p>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
