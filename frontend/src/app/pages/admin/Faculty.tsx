import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { getFaculty, deleteFaculty } from '../../services/adminService';
import { toast } from 'sonner';
import { Search, Plus, Edit, Trash2, ArrowLeft, BookOpen } from 'lucide-react';

export default function Faculty() {
    const navigate = useNavigate();
    const [faculty, setFaculty] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [department, setDepartment] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });

    useEffect(() => {
        fetchFaculty();
    }, [pagination.page, department]);

    const fetchFaculty = async () => {
        try {
            setLoading(true);
            const data = await getFaculty({
                page: pagination.page,
                limit: pagination.limit,
                search,
                department
            });
            setFaculty(data.faculty);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching faculty:', error);
            toast.error('Failed to load faculty');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPagination({ ...pagination, page: 1 });
        fetchFaculty();
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            await deleteFaculty(id);
            toast.success('Faculty deleted successfully');
            fetchFaculty();
        } catch (error) {
            console.error('Error deleting faculty:', error);
            toast.error('Failed to delete faculty');
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
                            <h1 className="text-3xl font-bold text-gray-900">Manage Faculty</h1>
                            <p className="text-gray-600 mt-1">View and manage all faculty members</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => navigate('/admin/faculty/assign')}
                                variant="outline"
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Assign Courses
                            </Button>
                            <Button onClick={() => navigate('/admin/faculty/add')}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Faculty
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Search by name, email, or faculty ID..."
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
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                            >
                                <option value="">All Departments</option>
                                <option value="CSE">CSE</option>
                                <option value="IT">IT</option>
                                <option value="ECE">ECE</option>
                                <option value="EEE">EEE</option>
                                <option value="MECH">MECH</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Faculty Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Faculty List ({pagination.total} total)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                                ))}
                            </div>
                        ) : faculty.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No faculty found</p>
                                <Button
                                    onClick={() => navigate('/admin/faculty/add')}
                                    className="mt-4"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Faculty
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
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faculty ID</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Courses</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {faculty.map((fac) => (
                                                <tr key={fac._id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                                        {fac.name}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        {fac.email}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        {fac.facultyId}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        {fac.department}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        {fac.designation || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                        {fac.teachingCourses?.length || 0} courses
                                                    </td>
                                                    <td className="px-4 py-4 text-sm">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => navigate(`/admin/faculty/edit/${fac._id}`)}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(fac._id, fac.name)}
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
