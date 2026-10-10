import { Calendar, Users, BarChart2, BookOpen, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TestStats } from '../../services/facultyTestService';

interface TestCardProps {
    test: TestStats;
    onViewDetails: (test: TestStats) => void;
    onTogglePublish?: (testId: string, currentStatus: boolean) => void;
    onDelete?: (testId: string) => void;
}

export default function TestCard({ test, onViewDetails, onTogglePublish, onDelete }: TestCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-[#FF7A00] shadow-xs">
            <CardContent className="p-4 sm:p-5">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-base text-gray-900 line-clamp-1">{test.title}</h3>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                            <BookOpen className="w-3.5 h-3.5 mr-1" />
                            <span>{test.type}</span>
                            <span className="mx-1.5">•</span>
                            <span>{test.duration} min</span>
                        </div>
                    </div>
                    <div className="flex gap-1.5">
                        <Badge className={`${test.status === 'Live' ? 'bg-green-500' : 'bg-gray-500'} text-xs px-2 py-0.5`}>
                            {test.status}
                        </Badge>
                        <Badge className={`${test.isPublished ? 'bg-green-600' : 'bg-gray-400'} text-xs px-2 py-0.5`}>
                            {test.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-orange-50/80 p-2.5 sm:p-3 rounded-lg">
                        <div className="flex items-center text-[#FF7A00] mb-1">
                            <Users className="w-4 h-4 mr-1.5" />
                            <span className="text-xs font-semibold">Appeared</span>
                        </div>
                        <span className="text-lg sm:text-xl font-bold text-gray-800">{test.totalAppeared}</span>
                    </div>
                    <div className="bg-green-50/80 p-2.5 sm:p-3 rounded-lg">
                        <div className="flex items-center text-green-600 mb-1">
                            <BarChart2 className="w-4 h-4 mr-1.5" />
                            <span className="text-xs font-semibold">Avg Score</span>
                        </div>
                        <span className="text-lg sm:text-xl font-bold text-gray-800">{test.avgScore.toFixed(1)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3.5">
                    <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                        {new Date(test.startTime).toLocaleDateString()}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        className="flex-1 bg-white text-[#FF7A00] border border-[#FF7A00] hover:bg-orange-50 font-semibold h-9 text-xs sm:text-sm"
                        onClick={() => onViewDetails(test)}
                    >
                        View Details
                    </Button>
                    {onTogglePublish && (
                        <Button
                            variant="outline"
                            size="icon"
                            className={`h-9 w-9 shrink-0 ${test.isPublished ? 'text-gray-600 hover:text-gray-800' : 'text-green-600 hover:text-green-800'}`}
                            onClick={() => onTogglePublish(test._id, test.isPublished)}
                            title={test.isPublished ? 'Unpublish Test' : 'Publish Test'}
                        >
                            {test.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-red-600 hover:text-red-800"
                            onClick={() => onDelete(test._id)}
                            title="Delete Test"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
