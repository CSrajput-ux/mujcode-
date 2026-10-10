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
            <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-4 py-3 font-semibold">Roll No</th>
                        <th className="px-4 py-3 font-semibold">Student Name</th>
                        <th className="px-4 py-3 font-semibold">Section</th>
                        <th className="px-4 py-3 font-semibold">Score</th>
                        <th className="px-4 py-3 font-semibold">Percentage</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 text-right font-semibold">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((sub) => (
                        <tr key={sub._id} className="bg-white border-b border-gray-100 hover:bg-gray-50/70">
                            <td className="px-4 py-3 font-medium text-gray-900">{sub.rollNumber}</td>
                            <td className="px-4 py-3 text-gray-800">{sub.studentName}</td>
                            <td className="px-4 py-3">{sub.section}</td>
                            <td className="px-4 py-3 font-bold text-gray-900">{sub.score} / {sub.totalMaxScore}</td>
                            <td className="px-4 py-3">
                                {((sub.score / sub.totalMaxScore) * 100).toFixed(1)}%
                            </td>
                            <td className="px-4 py-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${sub.status === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {sub.status}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <Button size="sm" variant="ghost" className="text-[#FF7A00] hover:text-[#e06c00] hover:bg-orange-50 h-8 px-2.5 text-xs sm:text-sm font-semibold" onClick={() => onViewSubmission(sub)}>
                                    <Eye className="w-4 h-4 mr-1.5" /> View
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
