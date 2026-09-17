import { useState, useEffect } from 'react';
import { Badge } from '../../../components/ui/badge';
import { Users, Loader2 } from 'lucide-react';

interface Community {
  _id: string;
  name: string;
  description?: string;
  section?: string;
  memberCount?: number;
  createdAt: string;
}

export default function CommunitiesList() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/communities`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCommunities(data.communities || []);
        }
      } catch (err) {
        console.error('Failed to load communities', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunities();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">No communities yet</p>
        <p className="text-sm">Click "Create Community" to start a new group.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {communities.map(c => (
        <div key={c._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-start gap-3">
            <Users className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-gray-900 text-sm">{c.name}</p>
              {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
              <p className="text-xs text-gray-400 mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {c.section && (
              <Badge className="bg-blue-100 text-blue-700">Section {c.section}</Badge>
            )}
            {c.memberCount !== undefined && (
              <span className="text-xs text-gray-500">{c.memberCount} members</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
