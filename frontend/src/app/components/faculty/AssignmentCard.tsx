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
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{assignment.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Briefcase className="w-3 h-3 mr-1" />
                            <span>{assignment.subject}</span>
                            <span className="mx-2">•</span>
                            <span>{assignment.branch} - {assignment.section}</span>
                        </div>
                    </div>
                    <Badge variant={isOverdue ? "destructive" : "default"}>
                        {isOverdue ? 'Closed' : 'Active'}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center text-blue-600 mb-1">
                            <Users className="w-4 h-4 mr-2" />
                            <span className="text-xs font-semibold">Completed</span>
                        </div>
                        <span className="text-xl font-bold text-gray-800">{assignment.completedCount} / {assignment.totalStudents}</span>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="flex items-center text-orange-600 mb-1">
                            <Users className="w-4 h-4 mr-2" />
                            <span className="text-xs font-semibold">Pending</span>
                        </div>
                        <span className="text-xl font-bold text-gray-800">{assignment.pendingCount}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        onClick={() => onViewSubmissions(assignment)}
                    >
                        View Submissions
                    </Button>
                    {onDelete && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors shrink-0"
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
