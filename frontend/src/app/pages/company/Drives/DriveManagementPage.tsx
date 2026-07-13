import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Briefcase, Plus, Users, Calendar, CheckCircle } from 'lucide-react';
import CreateDriveModal from './CreateDriveModal';
import CandidatePipeline from './CandidatePipeline';

export default function DriveManagementPage() {
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState<any | null>(null);

  const fetchDrives = () => {
    setLoading(true);
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/v1/company/drives')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setDrives(data.drives || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  if (selectedDrive) {
    return <CandidatePipeline drive={selectedDrive} onBack={() => setSelectedDrive(null)} />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drive Management</h1>
          <p className="text-gray-500 mt-1">Manage your campus recruitment drives and applicant pipelines.</p>
        </div>
        <Button 
          className="bg-[#FF7A00] hover:bg-[#FF6A00]"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Drive
        </Button>
      </div>

      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Briefcase className="w-5 h-5 text-[#FF7A00]" />
            <span>All Recruitment Drives</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading drives...</div>
          ) : drives.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-700">No Drives Found</h3>
              <p className="text-gray-500 mb-4">You haven't created any recruitment drives yet.</p>
              <Button onClick={() => setIsCreateModalOpen(true)} variant="outline" className="border-[#FF7A00] text-[#FF7A00]">
                Create Your First Drive
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {drives.map((drive) => (
                <div key={drive._id} className="p-5 border border-gray-100 rounded-xl hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{drive.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-3">
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1.5 text-blue-500" />
                          {drive.applicantsCount} Applicants
                        </span>
                        <span className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1.5 text-green-500" />
                          {drive.shortlistedCount} Shortlisted
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1.5 text-purple-500" />
                          Deadline: {new Date(drive.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Badge className={`
                      px-3 py-1 text-sm
                      ${drive.status === 'Active' ? 'bg-green-100 text-green-700' : ''}
                      ${drive.status === 'Draft' ? 'bg-gray-100 text-gray-700' : ''}
                      ${drive.status === 'Closed' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                      {drive.status}
                    </Badge>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex gap-3">
                    <Button 
                      size="sm" 
                      className="bg-gray-900 hover:bg-gray-800"
                      onClick={() => setSelectedDrive(drive)}
                    >
                      View Pipeline
                    </Button>
                    <Button size="sm" variant="outline">
                      Edit Settings
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateDriveModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchDrives();
        }}
      />
    </div>
  );
}
