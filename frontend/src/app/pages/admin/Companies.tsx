import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
    getCompanies,
    getCompany,
    deleteCompany,
    updateCompany,
    updateCompanyCredentials,
    toggleCompanyStatus
} from '../../services/adminService';
import { toast } from 'sonner';
import {
    Search,
    Plus,
    ArrowLeft,
    Building2,
    KeyRound,
    Eye,
    Edit3,
    Trash2,
    Globe,
    Mail,
    MapPin,
    ExternalLink,
    Lock,
    Sparkles,
    Copy,
    Check,
    AlertTriangle,
    X,
    Briefcase,
    ShieldCheck,
    CheckCircle2
} from 'lucide-react';

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

    // Modals state
    const [viewingCompany, setViewingCompany] = useState<any | null>(null);
    const [viewDetailsLoading, setViewDetailsLoading] = useState(false);

    const [editingCompany, setEditingCompany] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        industry: '',
        location: '',
        contactEmail: '',
        website: '',
        logoUrl: '',
        description: '',
        isActive: true
    });
    const [editSaving, setEditSaving] = useState(false);

    const [credentialsCompany, setCredentialsCompany] = useState<any | null>(null);
    const [credForm, setCredForm] = useState({
        loginEmail: '',
        password: '',
        contactPersonName: ''
    });
    const [credSaving, setCredSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const [deletingCompany, setDeletingCompany] = useState<any | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

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
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchCompanies();
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    // Quick Status Toggle
    const handleToggleStatus = async (company: any, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = !company.isActive;
        try {
            await toggleCompanyStatus(company.id || company._id, newStatus);
            setCompanies(prev =>
                prev.map(c =>
                    (c.id === company.id || c._id === company._id)
                        ? { ...c, isActive: newStatus }
                        : c
                )
            );
            toast.success(`${company.name} is now ${newStatus ? 'Active' : 'Inactive'}`);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update status');
        }
    };

    // Open View Details Modal
    const handleOpenView = async (company: any) => {
        setViewingCompany(company);
        setViewDetailsLoading(true);
        try {
            const fullData = await getCompany(company.id || company._id);
            setViewingCompany(fullData);
        } catch (err) {
            console.warn('Could not load extra company details, showing cached:', err);
        } finally {
            setViewDetailsLoading(false);
        }
    };

    // Open Edit Modal
    const handleOpenEdit = (company: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCompany(company);
        setEditForm({
            name: company.name || '',
            industry: company.industry || 'Technology & Software',
            location: company.location || '',
            contactEmail: company.contactEmail || '',
            website: company.website || '',
            logoUrl: company.logoUrl || '',
            description: company.description || '',
            isActive: company.isActive ?? true
        });
    };

    // Submit Edit
    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCompany) return;

        try {
            setEditSaving(true);
            await updateCompany(editingCompany.id || editingCompany._id, editForm);
            toast.success(`Updated ${editForm.name} successfully`);
            setEditingCompany(null);
            fetchCompanies();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update company');
        } finally {
            setEditSaving(false);
        }
    };

    // Open Credentials Modal
    const handleOpenCredentials = (company: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setCredentialsCompany(company);
        setCredForm({
            loginEmail: company.loginEmail || company.contactEmail || '',
            password: '',
            contactPersonName: company.contactPersonName || `${company.name} Campus Admin`
        });
    };

    // Auto-generate strong password
    const handleGenerateCredPassword = () => {
        if (!credentialsCompany) return;
        const prefix = credentialsCompany.name.split(' ')[0].replace(/[^a-zA-Z]/g, '') || 'Company';
        const formatted = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
        const pwd = `${formatted}@Muj${new Date().getFullYear()}!`;
        setCredForm(prev => ({ ...prev, password: pwd }));
        toast.info(`Generated password: ${pwd}`);
    };

    // Submit Credentials Update
    const handleSaveCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!credentialsCompany) return;
        if (!credForm.loginEmail || !credForm.password) {
            toast.error('Email and Password are required');
            return;
        }

        try {
            setCredSaving(true);
            await updateCompanyCredentials(credentialsCompany.id || credentialsCompany._id, credForm);
            toast.success(`Portal credentials updated for ${credentialsCompany.name}`);
            setCompanies(prev =>
                prev.map(c =>
                    (c.id === credentialsCompany.id || c._id === credentialsCompany._id)
                        ? { ...c, loginEmail: credForm.loginEmail }
                        : c
                )
            );
            setCredentialsCompany(null);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to update credentials');
        } finally {
            setCredSaving(false);
        }
    };

    // Open Delete Confirmation Modal
    const handleOpenDelete = (company: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeletingCompany(company);
    };

    // Confirm Delete
    const handleConfirmDelete = async () => {
        if (!deletingCompany) return;
        try {
            setDeleteLoading(true);
            await deleteCompany(deletingCompany.id || deletingCompany._id);
            toast.success(`Company "${deletingCompany.name}" deleted successfully`);
            setCompanies(prev => prev.filter(c => c.id !== deletingCompany.id && c._id !== deletingCompany._id));
            setDeletingCompany(null);
            if (viewingCompany && (viewingCompany.id === deletingCompany.id || viewingCompany._id === deletingCompany._id)) {
                setViewingCompany(null);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to delete company');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-bold text-gray-900">Manage Companies</h1>
                                <span className="bg-orange-100 text-[#FF7A00] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                    Placement & ATS
                                </span>
                            </div>
                            <p className="text-gray-600 mt-1">
                                View, edit, manage login credentials, or delete partner recruiting companies.
                            </p>
                        </div>
                        <Button 
                            onClick={() => navigate('/admin/companies/add')}
                            className="bg-[#FF7A00] hover:bg-[#e06c00] text-white flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Company
                        </Button>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <Card className="mb-6 shadow-sm border border-gray-200">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Search companies by name or industry..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <Button onClick={handleSearch} className="bg-gray-900 text-white">
                                        <Search className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <select
                                className="px-3 py-2 border rounded-md text-sm bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                            >
                                <option value="">All Industries</option>
                                <option value="Technology & Software">Technology & Software</option>
                                <option value="Finance & FinTech">Finance & FinTech</option>
                                <option value="Healthcare & Biotech">Healthcare & Biotech</option>
                                <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                                <option value="Consulting & Strategy">Consulting & Strategy</option>
                                <option value="Automobile & EV">Automobile & EV</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Companies Grid */}
                <Card className="shadow-sm border border-gray-200">
                    <CardHeader className="border-b border-gray-100 bg-white">
                        <CardTitle className="text-lg font-bold text-gray-800">
                            Partner Companies ({pagination.total || companies.length} total)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : companies.length === 0 ? (
                            <div className="text-center py-16">
                                <Building2 className="w-14 h-14 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-600 text-lg font-medium">No companies found</p>
                                <p className="text-gray-400 text-sm mt-1">Start by adding corporate partners to your campus network.</p>
                                <Button onClick={() => navigate('/admin/companies/add')} className="mt-4 bg-[#FF7A00] hover:bg-[#e06c00] text-white">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Company
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {companies.map((company) => (
                                        <Card 
                                            key={company._id || company.id} 
                                            className="group border border-gray-200/90 hover:border-[#FF7A00]/50 hover:shadow-lg transition-all rounded-xl overflow-hidden bg-white"
                                        >
                                            <div className="h-1 bg-gradient-to-r from-[#FF7A00] to-amber-400 group-hover:h-1.5 transition-all" />
                                            <CardContent className="p-5">
                                                {/* Header row: Logo + Name + Status */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-xs">
                                                            {company.logoUrl ? (
                                                                <img
                                                                    src={company.logoUrl}
                                                                    alt={company.name}
                                                                    className="w-full h-full object-contain"
                                                                    onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gradient-to-tr from-[#FF7A00] to-amber-500 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                                                                    {company.name?.charAt(0) || 'C'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#FF7A00] transition-colors line-clamp-1">
                                                                {company.name}
                                                            </h3>
                                                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60 mt-0.5">
                                                                {company.industry || 'Technology'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Status toggle pill */}
                                                    <button
                                                        onClick={(e) => handleToggleStatus(company, e)}
                                                        title="Click to toggle Active/Inactive"
                                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all border shrink-0 ${
                                                            company.isActive
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {company.isActive ? 'Active' : 'Inactive'}
                                                    </button>
                                                </div>

                                                {/* Details row */}
                                                <div className="mt-4 space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-3">
                                                    {company.location && (
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                            <span className="truncate">{company.location}</span>
                                                        </div>
                                                    )}
                                                    {company.contactEmail && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                            <span className="truncate">{company.contactEmail}</span>
                                                        </div>
                                                    )}
                                                    {company.website && (
                                                        <div className="flex items-center gap-1.5 text-[#FF7A00]">
                                                            <Globe className="w-3.5 h-3.5 shrink-0" />
                                                            <a
                                                                href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="hover:underline flex items-center gap-1 truncate"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {company.website.replace(/^https?:\/\//, '')}
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        </div>
                                                    )}

                                                    {/* Portal login badge */}
                                                    {company.loginEmail && (
                                                        <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200 font-medium w-fit mt-2">
                                                            <KeyRound className="w-3.5 h-3.5 text-[#FF7A00] shrink-0" />
                                                            <span>Portal Login: <strong>{company.loginEmail}</strong></span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Bar (View, Edit, Credentials, Delete) */}
                                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenView(company)}
                                                        className="text-xs text-gray-700 hover:text-[#FF7A00] hover:border-[#FF7A00] flex items-center gap-1.5 h-8"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        View Details
                                                    </Button>

                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => handleOpenCredentials(company, e)}
                                                            title="Manage Login Credentials"
                                                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 px-2.5"
                                                        >
                                                            <KeyRound className="w-3.5 h-3.5 mr-1" />
                                                            <span className="text-xs">Access</span>
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => handleOpenEdit(company, e)}
                                                            title="Edit Company Details"
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2.5"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5 mr-1" />
                                                            <span className="text-xs">Edit</span>
                                                        </Button>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => handleOpenDelete(company, e)}
                                                            title="Delete Company"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2.5"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Pagination */}
                                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                                    <p className="text-sm text-gray-600">
                                        Showing page {pagination.page} of {pagination.pages || 1}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page <= 1}
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pagination.page >= (pagination.pages || 1)}
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

                {/* ============================================================ */}
                {/* 1. VIEW COMPANY DETAILS MODAL */}
                {/* ============================================================ */}
                {viewingCompany && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 my-8 animate-in fade-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 text-white relative">
                                <button
                                    onClick={() => setViewingCompany(null)}
                                    className="absolute right-4 top-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg shrink-0">
                                        {viewingCompany.logoUrl ? (
                                            <img
                                                src={viewingCompany.logoUrl}
                                                alt={viewingCompany.name}
                                                className="w-full h-full object-contain"
                                                onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-tr from-[#FF7A00] to-amber-500 text-white rounded-xl flex items-center justify-center font-bold text-2xl">
                                                {viewingCompany.name?.charAt(0) || 'C'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-2xl font-bold tracking-tight">{viewingCompany.name}</h2>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                viewingCompany.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-gray-700 text-gray-300'
                                            }`}>
                                                {viewingCompany.isActive ? 'Active Partner' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-gray-300 text-sm mt-0.5 flex items-center gap-2">
                                            <span>{viewingCompany.industry}</span>
                                            {viewingCompany.location && <span>• 📍 {viewingCompany.location}</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                                {/* Description */}
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Company Overview</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                        {viewingCompany.description || 'No detailed overview provided for this partner company.'}
                                    </p>
                                </div>

                                {/* Contact & Web Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="text-xs text-gray-500 font-medium block">Public Recruiting Email</span>
                                        <span className="text-sm font-semibold text-gray-800 break-all">{viewingCompany.contactEmail || 'Not specified'}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="text-xs text-gray-500 font-medium block">Official Career Website</span>
                                        {viewingCompany.website ? (
                                            <a
                                                href={viewingCompany.website.startsWith('http') ? viewingCompany.website : `https://${viewingCompany.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm font-semibold text-[#FF7A00] hover:underline flex items-center gap-1 break-all"
                                            >
                                                {viewingCompany.website.replace(/^https?:\/\//, '')}
                                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                            </a>
                                        ) : (
                                            <span className="text-sm text-gray-500">Not specified</span>
                                        )}
                                    </div>
                                </div>

                                {/* Portal System Credentials Box */}
                                <div className="p-4 bg-gradient-to-br from-amber-50/70 to-orange-50/50 rounded-xl border border-amber-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                                            <KeyRound className="w-4 h-4 text-[#FF7A00]" />
                                            <span>Company Portal Access</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                handleOpenCredentials(viewingCompany, e);
                                            }}
                                            className="text-xs bg-white text-amber-800 border-amber-300 hover:bg-amber-100 h-7"
                                        >
                                            Reset Password
                                        </Button>
                                    </div>
                                    <div className="space-y-1.5 text-xs text-gray-700">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">System Login Email:</span>
                                            <span className="font-mono font-bold text-gray-900">{viewingCompany.loginEmail || viewingCompany.contactEmail || 'Not generated yet'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Portal Role:</span>
                                            <span className="font-semibold text-gray-800 bg-white px-2 py-0.5 rounded border border-amber-200">Company</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Login Portal URL:</span>
                                            <span className="font-mono text-gray-600">{window.location.origin}/login</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Associated Placement Drives */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            Campus Recruitment Drives ({viewingCompany.placementDrives?.length || 0})
                                        </h4>
                                        <Button
                                            size="sm"
                                            onClick={() => navigate('/admin/placements/add')}
                                            className="text-xs bg-gray-900 text-white h-7"
                                        >
                                            <Plus className="w-3 h-3 mr-1" />
                                            Post Drive
                                        </Button>
                                    </div>

                                    {viewingCompany.placementDrives && viewingCompany.placementDrives.length > 0 ? (
                                        <div className="space-y-2">
                                            {viewingCompany.placementDrives.map((d: any) => (
                                                <div key={d._id || d.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                                                    <div>
                                                        <span className="font-bold text-gray-900 block">{d.title}</span>
                                                        <span className="text-gray-500">
                                                            {d.salary?.ctc || d.ctc ? `CTC: ${d.salary?.ctc || d.ctc} LPA` : 'CTC: Undisclosed'} • Status: {d.status || 'Active'}
                                                        </span>
                                                    </div>
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-semibold text-[11px]">
                                                        {d.status || 'Active'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
                                            No placement drives posted yet for this partner.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    onClick={() => handleOpenDelete(viewingCompany, { stopPropagation: () => {} } as any)}
                                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs flex items-center gap-1.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Company
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={(e) => handleOpenEdit(viewingCompany, e)}
                                        className="text-xs flex items-center gap-1.5"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                        Edit Details
                                    </Button>
                                    <Button
                                        onClick={() => setViewingCompany(null)}
                                        className="text-xs bg-gray-900 text-white"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* 2. EDIT COMPANY MODAL */}
                {/* ============================================================ */}
                {editingCompany && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-200 my-8 animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <Edit3 className="w-5 h-5 text-[#FF7A00]" />
                                    <h3 className="font-bold text-lg text-gray-900">Edit Company Information</h3>
                                </div>
                                <button onClick={() => setEditingCompany(null)} className="p-1 hover:bg-gray-200 rounded-full text-gray-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                                <div>
                                    <Label className="text-xs font-semibold text-gray-700">Company Name *</Label>
                                    <Input
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        required
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-700">Industry Sector</Label>
                                        <Input
                                            value={editForm.industry}
                                            onChange={e => setEditForm({ ...editForm, industry: e.target.value })}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-700">Location / HQ</Label>
                                        <Input
                                            value={editForm.location}
                                            onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-700">Public Contact Email</Label>
                                        <Input
                                            type="email"
                                            value={editForm.contactEmail}
                                            onChange={e => setEditForm({ ...editForm, contactEmail: e.target.value })}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs font-semibold text-gray-700">Official Website</Label>
                                        <Input
                                            value={editForm.website}
                                            onChange={e => setEditForm({ ...editForm, website: e.target.value })}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-gray-700">Logo Image URL</Label>
                                    <Input
                                        value={editForm.logoUrl}
                                        onChange={e => setEditForm({ ...editForm, logoUrl: e.target.value })}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-gray-700">Company Overview</Label>
                                    <Textarea
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        rows={3}
                                        className="mt-1"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <span className="text-xs font-bold text-gray-800 block">Active Status</span>
                                        <span className="text-[11px] text-gray-500">Allow this company to post recruitment drives</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={editForm.isActive}
                                        onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })}
                                        className="w-4 h-4 text-[#FF7A00] rounded focus:ring-[#FF7A00]"
                                    />
                                </div>

                                <div className="flex gap-3 pt-3 border-t border-gray-100">
                                    <Button
                                        type="submit"
                                        disabled={editSaving}
                                        className="flex-1 bg-[#FF7A00] hover:bg-[#e06c00] text-white"
                                    >
                                        {editSaving ? 'Saving Changes...' : 'Save Changes'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingCompany(null)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* 3. MANAGE / RESET PORTAL CREDENTIALS MODAL */}
                {/* ============================================================ */}
                {credentialsCompany && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-amber-200 animate-in fade-in zoom-in-95 duration-200">
                            <div className="bg-gradient-to-r from-[#FF7A00] to-amber-500 p-5 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <KeyRound className="w-5 h-5" />
                                        <h3 className="font-bold text-lg">Portal Login Credentials</h3>
                                    </div>
                                    <button onClick={() => setCredentialsCompany(null)} className="p-1 hover:bg-white/20 rounded-full text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-white/80 text-xs mt-1">
                                    Manage portal access for <strong>{credentialsCompany.name}</strong>
                                </p>
                            </div>

                            <form onSubmit={handleSaveCredentials} className="p-6 space-y-4">
                                <div>
                                    <Label className="text-xs font-semibold text-gray-700">System Login Email *</Label>
                                    <Input
                                        type="email"
                                        value={credForm.loginEmail}
                                        onChange={e => setCredForm({ ...credForm, loginEmail: e.target.value })}
                                        required
                                        placeholder="recruiter@company.com"
                                        className="mt-1"
                                    />
                                    <span className="text-[11px] text-gray-400 mt-0.5 block">Used with Role: Company on login screen</span>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <Label className="text-xs font-semibold text-gray-700">New Password *</Label>
                                        <button
                                            type="button"
                                            onClick={handleGenerateCredPassword}
                                            className="text-xs text-[#FF7A00] hover:text-[#e06c00] font-semibold flex items-center gap-1"
                                        >
                                            <Sparkles className="w-3 h-3" /> Auto-generate
                                        </button>
                                    </div>
                                    <Input
                                        type="text"
                                        value={credForm.password}
                                        onChange={e => setCredForm({ ...credForm, password: e.target.value })}
                                        required
                                        minLength={6}
                                        placeholder="Min. 6 characters"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-semibold text-gray-700">Representative Name</Label>
                                    <Input
                                        value={credForm.contactPersonName}
                                        onChange={e => setCredForm({ ...credForm, contactPersonName: e.target.value })}
                                        placeholder="e.g. Campus Recruitment Lead"
                                        className="mt-1"
                                    />
                                </div>

                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Portal URL:</span>
                                        <span className="font-mono">{window.location.origin}/login</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Login Role:</span>
                                        <span className="font-bold">Company</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={credSaving}
                                        className="w-full bg-[#FF7A00] hover:bg-[#e06c00] text-white"
                                    >
                                        {credSaving ? 'Updating Credentials...' : 'Save & Update Credentials'}
                                    </Button>
                                    {credForm.password && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleCopyText(`Company: ${credentialsCompany.name}\nURL: ${window.location.origin}/login\nRole: Company\nEmail: ${credForm.loginEmail}\nPassword: ${credForm.password}`)}
                                            className="w-full text-xs flex items-center justify-center gap-1.5"
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                            {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* 4. DELETE CONFIRMATION MODAL */}
                {/* ============================================================ */}
                {deletingCompany && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-red-200 animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-6 text-center space-y-4">
                                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                                    <AlertTriangle className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Delete Partner Company?</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Are you sure you want to delete <strong className="text-gray-900">{deletingCompany.name}</strong>?
                                    </p>
                                </div>
                                <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl border border-red-200 text-left">
                                    ⚠️ <strong>Warning:</strong> This will remove the company from the placement partner catalog and permanently revoke their portal login access.
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        onClick={handleConfirmDelete}
                                        disabled={deleteLoading}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium"
                                    >
                                        {deleteLoading ? 'Deleting...' : 'Yes, Delete Company'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeletingCompany(null)}
                                        disabled={deleteLoading}
                                        className="flex-1 border-gray-300"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
