import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/StudentLayout';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Briefcase, Building2, Calendar, MapPin, IndianRupee, CheckCircle2 } from 'lucide-react';

export default function Jobs() {
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/v1/student/ats/drives');
      const data = await res.json();
      if (!data.error) {
        setDrives(data.drives || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (driveId: string) => {
    setApplying(driveId);
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
          score: 0,
          activeBacklogs: 0
        }
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/v1/student/ats/drives/${driveId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        alert(`Application Submitted! Status: ${data.application.status}\nNotes: ${data.application.notes}`);
        // Optionally refetch drives to update applicant count
        fetchDrives();
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

  return (
    <StudentLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campus Placements (New ATS)</h1>
          <p className="text-gray-500">Discover and apply to top companies.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drives.map(drive => (
            <Card key={drive._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{drive.title}</h3>
                    <div className="flex items-center text-gray-500 mt-1">
                      <Building2 className="w-4 h-4 mr-1" />
                      <span className="text-sm">Recruitment Drive</span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">
                    {drive.status}
                  </Badge>
                </div>

                <div className="space-y-2 py-3 border-y border-gray-50">
                  <div className="flex items-center text-sm text-gray-600">
                    <IndianRupee className="w-4 h-4 mr-2 text-gray-400" />
                    CTC: {drive.logistics?.ctc} LPA
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {drive.logistics?.locationType}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {new Date(drive.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <div className="font-semibold text-blue-900 mb-1">Eligibility Criteria</div>
                  <ul className="list-disc list-inside text-blue-800 space-y-1">
                    <li>Min CGPA: {drive.eligibility?.minCgpa}</li>
                    <li>Max Backlogs: {drive.eligibility?.maxBacklogs}</li>
                    <li>Branches: {drive.eligibility?.branches?.join(', ') || 'Any'}</li>
                  </ul>
                </div>

                <Button 
                  className="w-full bg-[#FF7A00] hover:bg-[#FF6A00]" 
                  onClick={() => handleApply(drive._id)}
                  disabled={applying === drive._id}
                >
                  {applying === drive._id ? 'Applying...' : 'Apply Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
          {drives.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No active drives available right now.
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
