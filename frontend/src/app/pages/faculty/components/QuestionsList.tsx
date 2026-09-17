import { useState, useEffect } from 'react';
import { Badge } from '../../../components/ui/badge';
import { FileText, Loader2 } from 'lucide-react';

interface Question {
  _id: string;
  title: string;
  type: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  createdAt: string;
}

const difficultyColors: Record<string, string> = {
  Easy: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Hard: 'bg-red-100 text-red-700'
};

export default function QuestionsList() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/communities/questions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions || []);
        }
      } catch (err) {
        console.error('Failed to load questions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">No questions yet</p>
        <p className="text-sm">Click "Create Question" to add your first question.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map(q => (
        <div key={q._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-gray-900 text-sm">{q.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{q.type} • {new Date(q.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <Badge className={difficultyColors[q.difficulty] || 'bg-gray-100 text-gray-700'}>
            {q.difficulty}
          </Badge>
        </div>
      ))}
    </div>
  );
}
