import { Calendar, Users, Briefcase, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Assignment } from '../../services/facultyAssignmentService';

interface AssignmentCardProps {
    assignment: Assignment;
    onViewSubmissions: (a: Assignment) => void;
    onDelete?: (id: string) => void;
}

export default function AssignmentCard({ assignment, onViewSubmissions, onDelete }: AssignmentCardProps) {
    const isOverdue = new Date(assignment.dueDate) < new Date();

    return (
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500 shadow-xs">
            <CardContent className="p-4 sm:p-5">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="font-bold text-base text-gray-900 line-clamp-1">{assignment.title}</h3>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Briefcase className="w-3.5 h-3.5 mr-1" />
                            <span>{assignment.subject}</span>
                            <span className="mx-1.5">•</span>
                            <span>{assignment.branch} - {assignment.section}</span>
                        </div>
                    </div>
                    <Badge variant={isOverdue ? "destructive" : "default"} className="text-xs px-2 py-0.5">
                        {isOverdue ? 'Closed' : 'Active'}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-blue-50/80 p-2.5 sm:p-3 rounded-lg">
                        <div className="flex items-center text-blue-600 mb-1">
                            <Users className="w-4 h-4 mr-1.5" />
                            <span className="text-xs font-semibold">Completed</span>
                        </div>
                        <span className="text-lg sm:text-xl font-bold text-gray-800">{assignment.completedCount} / {assignment.totalStudents}</span>
                    </div>
                    <div className="bg-orange-50/80 p-2.5 sm:p-3 rounded-lg">
                        <div className="flex items-center text-orange-600 mb-1">
                            <Users className="w-4 h-4 mr-1.5" />
                            <span className="text-xs font-semibold">Pending</span>
                        </div>
                        <span className="text-lg sm:text-xl font-bold text-gray-800">{assignment.pendingCount}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3.5">
                    <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-9 text-xs sm:text-sm"
                        onClick={() => onViewSubmissions(assignment)}
                    >
                        View Submissions
                    </Button>
                    {onDelete && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(assignment._id);
                            }}
                            title="Delete Assignment"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
