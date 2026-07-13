import { useEffect, useState } from 'react';
import { Badge } from "@/app/components/ui/badge";
import { Code2, BookOpen } from 'lucide-react';
import facultyActivityService from '@/app/services/facultyActivityService';

const QuestionsList = () => {
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const res = await facultyActivityService.getQuestions();
                if (res.success) {
                    setQuestions(res.data);
                }
            } catch (error) {
                console.error("Failed to load questions", error);
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    if (loading) return <div>Loading questions...</div>;

    if (questions.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">No questions found. Create a new question to build your bank.</div>;
    }

    return (
        <div className="space-y-4">
            {questions.map((q) => (
                <div key={q._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${q.type === 'coding' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                            {q.type === 'coding' ? <Code2 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{q.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant={q.difficulty === 'Easy' ? 'secondary' : q.difficulty === 'Medium' ? 'default' : 'destructive'} className="text-xs">
                                    {q.difficulty}
                                </Badge>
                                {q.topic && <span className="text-xs text-gray-500">• {q.topic}</span>}
                                {q.languages?.length > 0 && <span className="text-xs text-gray-500">• {q.languages.join(', ')}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">
                        {new Date(q.createdAt).toLocaleDateString()}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default QuestionsList;
