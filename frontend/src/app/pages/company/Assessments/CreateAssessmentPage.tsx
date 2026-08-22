import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { BookOpen, Clock, Code2, Save, Plus } from 'lucide-react';

export default function CreateAssessmentPage({ onBack }: { onBack?: () => void }) {
  const [drives, setDrives] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    driveId: '',
    durationMinutes: 60,
    questions: [
      { type: 'mcq', title: 'What is the output of typeof null?', points: 5 },
      { type: 'coding', title: 'Write a function to reverse a string', points: 20 }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/v1/company/drives')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setDrives(data.drives || []);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/v1/company/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Assessment</h2>
          <p className="text-gray-500">Design a hiring test and link it to a drive</p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center border border-green-200 shadow-sm animate-in fade-in slide-in-from-top-4">
          <Save className="w-5 h-5 mr-2" />
          Assessment saved successfully! Candidates can now take this test.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-white/70 backdrop-blur-md">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-[#FF7A00]" />
              Basic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Assessment Title</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF7A00] outline-none"
                  placeholder="e.g. SDE-1 Frontend Technical"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Link to Drive</label>
                <select 
                  required
                  value={formData.driveId}
                  onChange={e => setFormData({...formData, driveId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF7A00] outline-none bg-white"
                >
                  <option value="">Select a Drive...</option>
                  {drives.map((d: any) => (
                    <option key={d._id} value={d._id}>{d.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description / Instructions</label>
              <textarea 
                rows={3}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF7A00] outline-none"
                placeholder="Instructions for the candidates..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-white/70 backdrop-blur-md">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center">
              <Code2 className="w-5 h-5 mr-2 text-[#FF7A00]" />
              Questions Setup
            </CardTitle>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Duration:</span>
              <input 
                type="number" 
                value={formData.durationMinutes}
                onChange={e => setFormData({...formData, durationMinutes: Number(e.target.value)})}
                className="w-16 px-2 py-1 border border-gray-200 rounded text-center focus:ring-1 focus:ring-[#FF7A00] outline-none"
              />
              <span>mins</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {formData.questions.map((q, idx) => (
                <div key={idx} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg bg-gray-50/50">
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${q.type === 'coding' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {q.type.toUpperCase()}
                  </div>
                  <div className="flex-1 font-medium text-gray-800">{q.title}</div>
                  <div className="text-sm text-gray-500 font-semibold">{q.points} pts</div>
                </div>
              ))}
              
              <Button type="button" variant="outline" className="w-full border-dashed border-2 py-6 text-gray-500 hover:text-[#FF7A00] hover:bg-orange-50/50 hover:border-[#FF7A00]">
                <Plus className="w-5 h-5 mr-2" />
                Add New Question
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          {onBack && <Button type="button" variant="outline" onClick={onBack}>Cancel</Button>}
          <Button type="submit" disabled={loading} className="bg-[#FF7A00] hover:bg-[#FF6A00] px-8">
            {loading ? 'Saving...' : 'Publish Assessment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
