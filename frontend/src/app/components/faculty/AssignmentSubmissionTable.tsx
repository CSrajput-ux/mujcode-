import { Eye, FileText, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Submission } from '../../services/facultyAssignmentService';

interface AssignmentSubmissionTableProps {
    submissions: Submission[];
    onGradeSubmission: (sub: Submission) => void;
}

export default function AssignmentSubmissionTable({ submissions, onGradeSubmission }: AssignmentSubmissionTableProps) {
    if (submissions.length === 0) {
        return <div className="p-8 text-center text-gray-500">No submissions found for this assignment.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-6 py-3">Roll No</th>
                        <th className="px-6 py-3">Student Name</th>
                        <th className="px-6 py-3">Submission Status</th>
                        <th className="px-6 py-3">Submitted At</th>
                        <th className="px-6 py-3">Marks</th>
                        <th className="px-6 py-3">Files</th>
                        <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((sub) => (
                        <tr key={sub._id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{sub.rollNumber}</td>
                            <td className="px-6 py-4">{sub.studentName}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center w-fit gap-1 ${sub.status === 'Graded' ? 'bg-green-100 text-green-800' :
                                        sub.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {sub.status === 'Graded' && <CheckCircle className="w-3 h-3" />}
                                    {sub.status === 'Submitted' && <Clock className="w-3 h-3" />}
                                    {sub.status}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() + ' ' + new Date(sub.submittedAt).toLocaleTimeString() : '-'}
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-900">{sub.marks !== undefined ? sub.marks : '-'}</td>
                            <td className="px-6 py-4">
                                {sub.files?.length > 0 ? (
                                    <div className="flex gap-2">
                                        {sub.files.map((file, i) => (
                                            <a key={i} href={file} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center">
                                                <FileText className="w-4 h-4 mr-1" /> File {i + 1}
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-gray-400">No files</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => onGradeSubmission(sub)}>
                                    <Eye className="w-4 h-4 mr-1" /> Grade/View
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
