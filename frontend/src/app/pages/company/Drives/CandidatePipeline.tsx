import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ArrowLeft, GripVertical, CheckCircle, Clock, Search, XCircle, FileText, Video } from 'lucide-react';

interface CandidatePipelineProps {
  drive: any;
  onBack: () => void;
}

const STAGES = ['Applied', 'Screening', 'Testing', 'Interview', 'Offered', 'Hired', 'Rejected'];

export default function CandidatePipeline({ drive, onBack }: CandidatePipelineProps) {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [drive._id]);

  const fetchApplications = () => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/v1/company/drives/${drive._id}/applications`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setApplications(data.applications || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData('applicationId', appId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('applicationId');
    if (!appId) return;

    // Optimistically update UI
    setApplications(prev => prev.map(app => 
      app._id === appId ? { ...app, status: newStatus } : app
    ));

    // Update Backend
    try {
      await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/v1/company/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.error(error);
      fetchApplications(); // Revert on failure
    }
  };

  const getStageColor = (stage: string) => {
    switch(stage) {
      case 'Applied': return 'bg-gray-100 border-gray-200';
      case 'Screening': return 'bg-blue-50 border-blue-200';
      case 'Testing': return 'bg-yellow-50 border-yellow-200';
      case 'Interview': return 'bg-purple-50 border-purple-200';
      case 'Offered': return 'bg-green-50 border-green-200';
      case 'Hired': return 'bg-emerald-50 border-emerald-300 shadow-sm';
      case 'Rejected': return 'bg-red-50 border-red-200 opacity-75';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStageIcon = (stage: string) => {
    switch(stage) {
      case 'Applied': return <FileText className="w-4 h-4 text-gray-500" />;
      case 'Screening': return <Search className="w-4 h-4 text-blue-500" />;
      case 'Testing': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'Interview': return <Video className="w-4 h-4 text-purple-500" />;
      case 'Hired': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'Rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 shrink-0">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Drives
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{drive.title}</h1>
            <p className="text-sm text-gray-500">Applicant Pipeline</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Badge className="bg-[#FF7A00] hover:bg-[#FF6A00] text-sm px-3 py-1">
            {applications.length} Total Applicants
          </Badge>
        </div>
      </div>

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex space-x-4 h-full min-w-max">
          {STAGES.map(stage => {
            const stageApps = applications.filter(a => a.status === stage);
            
            return (
              <div 
                key={stage}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
                className={`w-[320px] rounded-xl flex flex-col border ${getStageColor(stage)}`}
              >
                <div className="p-4 border-b border-inherit bg-white/50 rounded-t-xl shrink-0 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {getStageIcon(stage)}
                    <h3 className="font-semibold text-gray-800">{stage}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-white">
                    {stageApps.length}
                  </Badge>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {stageApps.map(app => (
                    <Card 
                      key={app._id} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, app._id)}
                      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-white"
                    >
                      <CardContent className="p-4 flex gap-3">
                        <GripVertical className="w-5 h-5 text-gray-300 mt-1 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {app.studentDetails.name}
                          </h4>
                          <p className="text-xs text-gray-500 truncate mb-2">
                            {app.studentDetails.email}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline" className="bg-gray-50">
                              {app.studentDetails.branch}
                            </Badge>
                            <Badge variant="outline" className="bg-gray-50">
                              CGPA: {app.studentDetails.cgpa}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {stageApps.length === 0 && (
                    <div className="h-full min-h-[100px] flex items-center justify-center border-2 border-dashed border-gray-300/50 rounded-lg">
                      <span className="text-sm text-gray-400 font-medium">Drop candidates here</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
