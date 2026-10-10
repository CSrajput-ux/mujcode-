import { Eye, FileText, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Submission } from '../../services/facultyAssignmentService';

interface AssignmentSubmissionTableProps {
    submissions: Submission[];
    onGradeSubmission: (sub: Submission) => void;
}

function resolveFileUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
    return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function AssignmentSubmissionTable({ submissions, onGradeSubmission }: AssignmentSubmissionTableProps) {
    if (submissions.length === 0) {
        return <div className="p-8 text-center text-gray-500">No submissions found for this assignment.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-4 py-3 font-semibold">Reg No</th>
                        <th className="px-4 py-3 font-semibold">Student Name</th>
                        <th className="px-4 py-3 font-semibold">Submission Status</th>
                        <th className="px-4 py-3 font-semibold">Submitted At</th>
                        <th className="px-4 py-3 font-semibold">Marks</th>
                        <th className="px-4 py-3 font-semibold">Files</th>
                        <th className="px-4 py-3 text-right font-semibold">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {submissions.map((sub) => {
                        const fileList = (Array.isArray(sub.files) && sub.files.length > 0)
                            ? sub.files
                            : (sub.fileUrl ? [sub.fileUrl] : []);
                        const regNo = sub.regNo || sub.registrationNumber || sub.college_id || sub.rollNumber || '-';

                        return (
                            <tr key={sub._id} className="bg-white border-b border-gray-100 hover:bg-gray-50/70">
                                <td className="px-4 py-3 font-semibold text-gray-900">{regNo}</td>
                                <td className="px-4 py-3 text-gray-800 font-medium">{sub.studentName}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center w-fit gap-1.5 ${
                                        sub.status === 'Graded' ? 'bg-green-100 text-green-800' :
                                        sub.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {sub.status === 'Graded' && <CheckCircle className="w-3.5 h-3.5" />}
                                        {sub.status === 'Submitted' && <Clock className="w-3.5 h-3.5" />}
                                        {sub.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {sub.submittedAt ? (
                                        new Date(sub.submittedAt).toLocaleDateString() + ' ' + 
                                        new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    ) : '-'}
                                </td>
                                <td className="px-4 py-3">
                                    {sub.status === 'Graded' && sub.marks !== undefined ? (
                                        <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded text-xs border border-green-200">
                                            {sub.marks}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 font-normal">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {fileList.length > 0 ? (
                                        <div className="flex gap-2 flex-wrap items-center">
                                            {fileList.map((file, i) => {
                                                const fullUrl = resolveFileUrl(file);
                                                const label = sub.fileName && fileList.length === 1
                                                    ? sub.fileName
                                                    : (fileList.length === 1 ? 'View File' : `File ${i + 1}`);

                                                return (
                                                    <a
                                                        key={i}
                                                        href={fullUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                                                        title="Click to view file in new tab"
                                                    >
                                                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                        <span className="max-w-[130px] truncate">{label}</span>
                                                        <ExternalLink className="w-3 h-3 text-blue-500 shrink-0 opacity-70" />
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">No files</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-200 h-8 px-2.5 text-xs sm:text-sm font-semibold"
                                        onClick={() => onGradeSubmission(sub)}
                                    >
                                        <Eye className="w-4 h-4 mr-1.5" /> Grade / View
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
