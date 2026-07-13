import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { getCompanies } from '../../services/adminService';
import { toast } from 'sonner';
import { Search, Plus, ArrowLeft, Building2 } from 'lucide-react';

export default function Companies() {
    const navigate = useNavigate();
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [industry, setIndustry] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    });

    useEffect(() => {
        fetchCompanies();
    }, [pagination.page, industry]);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const data = await getCompanies({
                page: pagination.page,
                limit: pagination.limit,
                search,
                industry
            });
            setCompanies(data.companies);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching companies:', error);
            toast.error('Failed to load companies');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPagination({ ...pagination, page: 1 });
        fetchCompanies();
    };

    const handlePageChange = (newPage: number) => {
        setPagination({ ...pagination, page: newPage });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
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
                            <h1 className="text-3xl font-bold text-gray-900">Manage Companies</h1>
                            <p className="text-gray-600 mt-1">View and manage all partner companies</p>
                        </div>
                        <Button onClick={() => navigate('/admin/companies/add')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Company
                        </Button>
                    </div>
                </div>

                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Search companies..."
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
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                            >
                                <option value="">All Industries</option>
                                <option value="Technology">Technology</option>
                                <option value="Finance">Finance</option>
                                <option value="Healthcare">Healthcare</option>
                                <option value="E-commerce">E-commerce</option>
                                <option value="Consulting">Consulting</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Companies List ({pagination.total} total)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-32 bg-gray-100 rounded animate-pulse" />
                                ))}
                            </div>
                        ) : companies.length === 0 ? (
                            <div className="text-center py-12">
                                <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-500 text-lg">No companies found</p>
                                <Button onClick={() => navigate('/admin/companies/add')} className="mt-4">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Company
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {companies.map((company) => (
                                        <Card key={company._id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-lg text-gray-900">
                                                            {company.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {company.industry}
                                                        </p>
                                                        <div className="mt-3 space-y-1 text-sm text-gray-600">
                                                            {company.location && (
                                                                <p>📍 {company.location}</p>
                                                            )}
                                                            {company.contactEmail && (
                                                                <p>✉️ {company.contactEmail}</p>
                                                            )}
                                                            {company.website && (
                                                                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                                    🌐 Website
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${company.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {company.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

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
