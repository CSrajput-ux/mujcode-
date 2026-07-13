import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface CreateDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateDriveModal({ isOpen, onClose, onSuccess }: CreateDriveModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    locationType: 'On-Site',
    location: '',
    ctc: '',
    minCgpa: 0,
    maxBacklogs: 0
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        locationType: formData.locationType,
        location: formData.location,
        salary: { ctc: formData.ctc },
        eligibility: { minCgpa: Number(formData.minCgpa), maxBacklogs: Number(formData.maxBacklogs) }
      };

      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/v1/company/drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onSuccess();
      } else {
        alert('Failed to create drive');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to create drive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">Create Recruitment Drive</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Basic Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Drive Title *</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-3 py-2 border rounded-md focus:ring-[#FF7A00] focus:border-[#FF7A00]" 
                  placeholder="e.g. Software Engineer 2026 Campus Drive"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                <textarea 
                  className="w-full px-3 py-2 border rounded-md h-24 focus:ring-[#FF7A00] focus:border-[#FF7A00]"
                  placeholder="Roles and responsibilities..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Logistics & Salary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline *</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-3 py-2 border rounded-md focus:ring-[#FF7A00] focus:border-[#FF7A00]"
                  value={formData.deadline}
                  onChange={e => setFormData({...formData, deadline: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CTC / Package (LPA)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border rounded-md focus:ring-[#FF7A00] focus:border-[#FF7A00]"
                  placeholder="e.g. 12 LPA"
                  value={formData.ctc}
                  onChange={e => setFormData({...formData, ctc: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
                <select 
                  className="w-full px-3 py-2 border rounded-md focus:ring-[#FF7A00] focus:border-[#FF7A00]"
                  value={formData.locationType}
                  onChange={e => setFormData({...formData, locationType: e.target.value})}
                >
                  <option>On-Site</option>
                  <option>Hybrid</option>
                  <option>Remote</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office Location</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border rounded-md focus:ring-[#FF7A00] focus:border-[#FF7A00]"
                  placeholder="e.g. Bangalore"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Eligibility Engine Criteria</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum CGPA</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="10"
                  className="w-full px-3 py-2 border rounded-md focus:ring-[#FF7A00] focus:border-[#FF7A00]"
                  value={formData.minCgpa}
                  onChange={e => setFormData({...formData, minCgpa: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Backlogs</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full px-3 py-2 border rounded-md focus:ring-[#FF7A00] focus:border-[#FF7A00]"
                  value={formData.maxBacklogs}
                  onChange={e => setFormData({...formData, maxBacklogs: Number(e.target.value)})}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              * The Auto-Eligibility Engine will automatically reject applicants failing this criteria.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#FF7A00] hover:bg-[#FF6A00]" disabled={loading}>
              {loading ? 'Publishing...' : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Publish Drive
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
