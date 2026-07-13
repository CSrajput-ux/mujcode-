import { Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { StudentSubmission } from '../../services/facultyTestService';

interface StudentPerformanceTableProps {
    submissions: StudentSubmission[];
    onViewSubmission: (sub: StudentSubmission) => void;
}

export default function StudentPerformanceTable({ submissions, onViewSubmission }: StudentPerformanceTableProps) {
    if (submissions.length === 0) {
        return <div className="p-8 text-center text-gray-500">No submissions found for this test.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th className="px-6 py-3">Roll No</th>
                        <th className="px-6 py-3">Student Name</th>
                        <th className="px-6 py-3">Section</th>
                        <th className="px-6 py-3">Score</th>
                        <th className="px-6 py-3">Percentage</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((sub) => (
                        <tr key={sub._id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{sub.rollNumber}</td>
                            <td className="px-6 py-4">{sub.studentName}</td>
                            <td className="px-6 py-4">{sub.section}</td>
                            <td className="px-6 py-4 font-bold text-gray-900">{sub.score} / {sub.totalMaxScore}</td>
                            <td className="px-6 py-4">
                                {((sub.score / sub.totalMaxScore) * 100).toFixed(1)}%
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${sub.status === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {sub.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <Button size="sm" variant="ghost" className="text-[#FF7A00]" onClick={() => onViewSubmission(sub)}>
                                    <Eye className="w-4 h-4 mr-1" /> View
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
