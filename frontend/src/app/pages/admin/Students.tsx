import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { getStudents, deleteStudent } from '../../services/adminService';
import { toast } from 'sonner';
import { Search, Plus, Upload, Edit, Trash2, ArrowLeft } from 'lucide-react';

export default function Students() {
    const navigate = useNavigate();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [branch, setBranch] = useState('');
    const [year, setYear] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });

    useEffect(() => {
        fetchStudents();
    }, [pagination.page, branch, year]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const data = await getStudents({
                page: pagination.page,
                limit: pagination.limit,
                search,
                branch,
                year
            });
            setStudents(data.students);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPagination({ ...pagination, page: 1 });
        fetchStudents();
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            await deleteStudent(id);
            toast.success('Student deleted successfully');
            fetchStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            toast.error('Failed to delete student');
        }
    };

    const handlePageChange = (newPage: number) => {
        setPagination({ ...pagination, page: newPage });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin/dashboard')}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Manage Students</h1>
                            <p className="text-gray-600 mt-1">View and manage all student accounts</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => navigate('/admin/students/bulk-upload')}
                                variant="outline"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Bulk Upload
                            </Button>
                            <Button onClick={() => navigate('/admin/students/add')}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Student
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Search by name, email, or roll number..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <Button onClick={handleSearch}>
                                        <Search className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <select
                                className="px-3 py-2 border rounded-md"
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                            >
                                <option value="">All Branches</option>
                                <option value="CSE">CSE</option>
                                <option value="IT">IT</option>
                                <option value="ECE">ECE</option>
                                <option value="EEE">EEE</option>
                                <option value="MECH">MECH</option>
                            </select>
                            <select
                                className="px-3 py-2 border rounded-md"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                            >
                                <option value="">All Years</option>
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Students Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Students List ({pagination.total} total)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                                ))}
                            </div>
                        ) : students.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No students found</p>
                                <Button
                                    onClick={() => navigate('/admin/students/add')}
                                    className="mt-4"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Student
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll Number</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {students.map((student) => (
                                                <tr key={student.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                                        {student.User?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        {student.User?.email || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        {student.rollNumber}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        {student.branch}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        {student.year || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.User?.isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {student.User?.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => navigate(`/admin/students/edit/${student.id}`)}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(student.id, student.User?.name)}
                                                                className="text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-sm text-gray-600">
                                        Showing page {pagination.page} of {pagination.pages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page === 1}
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page >= pagination.pages}
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
