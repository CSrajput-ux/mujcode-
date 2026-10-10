import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { createCompany } from '../../services/adminService';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Building2,
    Globe,
    Mail,
    MapPin,
    Plus,
    Sparkles,
    CheckCircle2,
    Image as ImageIcon,
    Briefcase,
    ShieldCheck,
    ExternalLink,
    KeyRound,
    Eye,
    EyeOff,
    Copy,
    Check,
    UserCheck,
    Lock
} from 'lucide-react';

const INDUSTRY_OPTIONS = [
    'Technology & Software',
    'Finance & FinTech',
    'Data Science & AI',
    'Healthcare & Biotech',
    'E-Commerce & Retail',
    'Consulting & Strategy',
    'Automobile & EV',
    'Semiconductor & Hardware',
    'EdTech & Learning',
    'Telecommunications',
    'Other'
];

const PRESETS = [
    {
        name: 'Google',
        industry: 'Technology & Software',
        location: 'Bangalore, India',
        contactEmail: 'campus-india@google.com',
        website: 'https://careers.google.com',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
        description: 'Global technology leader specializing in Search, Cloud, AI, and developer ecosystems.',
        suggestedEmail: 'google.campus@mujcode.in',
        suggestedPassword: 'Google@Muj2026!',
        contactPersonName: 'Google India Campus Recruitment Team'
    },
    {
        name: 'Microsoft',
        industry: 'Technology & Software',
        location: 'Hyderabad, India',
        contactEmail: 'university-hiring@microsoft.com',
        website: 'https://careers.microsoft.com',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg',
        description: 'Empowering every person and organization on the planet to achieve more through Azure and modern software.',
        suggestedEmail: 'microsoft.campus@mujcode.in',
        suggestedPassword: 'Microsoft@Muj2026!',
        contactPersonName: 'Microsoft University Hiring Lead'
    },
    {
        name: 'Amazon',
        industry: 'E-Commerce & Retail',
        location: 'Bangalore, India',
        contactEmail: 'campus-recruiting@amazon.com',
        website: 'https://amazon.jobs',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
        description: 'Earth’s most customer-centric company, pioneering cloud infrastructure (AWS) and digital commerce.',
        suggestedEmail: 'amazon.campus@mujcode.in',
        suggestedPassword: 'Amazon@Muj2026!',
        contactPersonName: 'Amazon Student Programs Lead'
    },
    {
        name: 'Goldman Sachs',
        industry: 'Finance & FinTech',
        location: 'Bangalore, India',
        contactEmail: 'india-careers@gs.com',
        website: 'https://goldmansachs.com/careers',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/61/Goldman_Sachs.svg',
        description: 'Leading global investment banking, securities, and investment management firm.',
        suggestedEmail: 'goldman.campus@mujcode.in',
        suggestedPassword: 'Goldman@Muj2026!',
        contactPersonName: 'Goldman Sachs Campus Recruiter'
    }
];

export default function AddCompany() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const [savedCredentials, setSavedCredentials] = useState<{
        companyName: string;
        email: string;
        password?: string;
    } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        industry: 'Technology & Software',
        location: '',
        contactEmail: '',
        website: '',
        logoUrl: '',
        description: '',
        isActive: true,
        // Portal Credentials Configuration
        createPortalAccount: true,
        loginEmail: '',
        password: '',
        contactPersonName: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleApplyPreset = (preset: typeof PRESETS[0]) => {
        setFormData(prev => ({
            ...prev,
            name: preset.name,
            industry: preset.industry,
            location: preset.location,
            contactEmail: preset.contactEmail,
            website: preset.website,
            logoUrl: preset.logoUrl,
            description: preset.description,
            isActive: true,
            createPortalAccount: true,
            loginEmail: preset.suggestedEmail,
            password: preset.suggestedPassword,
            contactPersonName: preset.contactPersonName
        }));
        toast.info(`Filled details and system credentials from ${preset.name} template`);
    };

    // Auto-generate suggested email
    const handleGenerateEmail = () => {
        if (!formData.name.trim()) {
            toast.error('Please enter Company Name first');
            return;
        }
        const slug = formData.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const generated = `${slug}.campus@mujcode.in`;
        setFormData(prev => ({ ...prev, loginEmail: generated }));
        toast.success(`Generated system email: ${generated}`);
    };

    // Auto-generate strong password
    const handleGeneratePassword = () => {
        const prefix = formData.name.trim() 
            ? formData.name.trim().split(' ')[0].replace(/[^a-zA-Z]/g, '') 
            : 'Company';
        const formattedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
        const generated = `${formattedPrefix}@Muj${new Date().getFullYear()}!`;
        setFormData(prev => ({ ...prev, password: generated }));
        setShowPassword(true);
        toast.success(`Generated strong password: ${generated}`);
    };

    const handleCopyCredentials = () => {
        if (!savedCredentials) return;
        const textToCopy = `MUJ Placement Portal Company Credentials:\nCompany: ${savedCredentials.companyName}\nPortal URL: ${window.location.origin}/login\nRole: Company\nEmail: ${savedCredentials.email}\nPassword: ${savedCredentials.password || '(as entered)'}`;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        toast.success('Credentials copied to clipboard!');
        setTimeout(() => setCopied(false), 2500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Company Name is required');
            return;
        }

        if (!formData.industry) {
            toast.error('Industry is required');
            return;
        }

        if (formData.createPortalAccount) {
            if (!formData.loginEmail.trim()) {
                toast.error('System Login Email is required when Portal Account is enabled');
                return;
            }
            if (!formData.password || formData.password.length < 6) {
                toast.error('Password must be at least 6 characters');
                return;
            }
        }

        // Normalize website URL if entered without protocol
        let formattedWebsite = formData.website.trim();
        if (formattedWebsite && !formattedWebsite.startsWith('http://') && !formattedWebsite.startsWith('https://')) {
            formattedWebsite = `https://${formattedWebsite}`;
        }

        let formattedLogo = formData.logoUrl.trim();
        if (formattedLogo && !formattedLogo.startsWith('http://') && !formattedLogo.startsWith('https://')) {
            formattedLogo = `https://${formattedLogo}`;
        }

        const payload = {
            name: formData.name.trim(),
            industry: formData.industry,
            location: formData.location.trim(),
            contactEmail: formData.contactEmail.trim(),
            website: formattedWebsite,
            logoUrl: formattedLogo,
            description: formData.description.trim(),
            isActive: Boolean(formData.isActive),
            loginEmail: formData.createPortalAccount ? formData.loginEmail.trim().toLowerCase() : '',
            password: formData.createPortalAccount ? formData.password.trim() : '',
            contactPersonName: formData.createPortalAccount ? formData.contactPersonName.trim() : ''
        };

        try {
            setLoading(true);
            await createCompany(payload);
            
            if (formData.createPortalAccount) {
                setSavedCredentials({
                    companyName: payload.name,
                    email: payload.loginEmail,
                    password: payload.password
                });
                toast.success(`Partner Company "${payload.name}" and system login account created!`);
            } else {
                toast.success(`Partner Company "${payload.name}" registered successfully!`);
                navigate('/admin/companies');
            }
        } catch (error: any) {
            console.error('Error creating company:', error);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to create company';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-50/80 to-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Navigation Header */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin/companies')}
                        className="mb-3 hover:bg-gray-200/60 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Companies
                    </Button>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                    Register Partner Company & Credentials
                                </h1>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FF7A00]/10 text-[#FF7A00]">
                                    Placement Portal
                                </span>
                            </div>
                            <p className="text-gray-600 mt-1 text-sm sm:text-base">
                                Add a corporate recruiting partner and generate their system portal credentials for drive management.
                            </p>
                        </div>

                        {/* Quick Presets Dropdown/Pills */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" /> Quick Presets:
                            </span>
                            {PRESETS.map((p) => (
                                <button
                                    key={p.name}
                                    type="button"
                                    onClick={() => handleApplyPreset(p)}
                                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-gray-200 hover:border-[#FF7A00] hover:text-[#FF7A00] transition-all shadow-sm"
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form (2 cols on large screen) */}
                    <div className="lg:col-span-2 space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Card 1: Primary Organization Info */}
                            <Card className="border border-gray-200 shadow-sm">
                                <CardHeader className="border-b border-gray-100 bg-white rounded-t-xl">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                                        <Building2 className="w-5 h-5 text-[#FF7A00]" />
                                        Organization Details
                                    </CardTitle>
                                    <CardDescription>
                                        Basic information displayed to students during placement drives.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div>
                                        <Label htmlFor="companyName" className="text-sm font-semibold text-gray-800">
                                            Company Name <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="mt-1.5 relative">
                                            <Input
                                                id="companyName"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="e.g. Google India Pvt. Ltd."
                                                required
                                                className="pl-9 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
                                            />
                                            <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="industry" className="text-sm font-semibold text-gray-800">
                                                Industry Sector <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="mt-1.5 relative">
                                                <select
                                                    id="industry"
                                                    name="industry"
                                                    value={formData.industry}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-3 py-2 pl-9 border rounded-md text-sm border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00]"
                                                >
                                                    {INDUSTRY_OPTIONS.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="location" className="text-sm font-semibold text-gray-800">
                                                Headquarters / Office Location
                                            </Label>
                                            <div className="mt-1.5 relative">
                                                <Input
                                                    id="location"
                                                    name="location"
                                                    value={formData.location}
                                                    onChange={handleChange}
                                                    placeholder="e.g. Bangalore, India"
                                                    className="pl-9 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
                                                />
                                                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="description" className="text-sm font-semibold text-gray-800">
                                            Company Overview / About
                                        </Label>
                                        <div className="mt-1.5">
                                            <Textarea
                                                id="description"
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={3}
                                                placeholder="Brief overview of the organization, core technologies, and products..."
                                                className="focus:border-[#FF7A00] focus:ring-[#FF7A00]"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card 2: Company Portal System Login Credentials (NEW FEATURE) */}
                            <Card className="border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 shadow-sm">
                                <CardHeader className="border-b border-amber-100 bg-white/70 backdrop-blur-sm rounded-t-xl">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                                                <KeyRound className="w-5 h-5 text-[#FF7A00]" />
                                                Company Portal System Credentials
                                            </CardTitle>
                                            <CardDescription>
                                                Generate system login mail and password so corporate recruiters can access the portal.
                                            </CardDescription>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-xs hover:border-[#FF7A00] transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.createPortalAccount}
                                                onChange={(e) => setFormData(prev => ({ ...prev, createPortalAccount: e.target.checked }))}
                                                className="rounded text-[#FF7A00] focus:ring-[#FF7A00] w-4 h-4"
                                            />
                                            <span className="text-xs font-bold text-gray-800">Enable Portal Login</span>
                                        </label>
                                    </div>
                                </CardHeader>
                                {formData.createPortalAccount && (
                                    <CardContent className="p-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* System Email */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <Label htmlFor="loginEmail" className="text-sm font-semibold text-gray-800">
                                                        System Login Email <span className="text-red-500">*</span>
                                                    </Label>
                                                    <button
                                                        type="button"
                                                        onClick={handleGenerateEmail}
                                                        className="text-xs text-[#FF7A00] hover:text-[#e06c00] font-medium flex items-center gap-1"
                                                    >
                                                        <Sparkles className="w-3 h-3" /> Auto-suggest
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        id="loginEmail"
                                                        type="email"
                                                        name="loginEmail"
                                                        value={formData.loginEmail}
                                                        onChange={handleChange}
                                                        placeholder="e.g. google.campus@mujcode.in"
                                                        required={formData.createPortalAccount}
                                                        className="pl-9 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
                                                    />
                                                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                                </div>
                                                <span className="text-[11px] text-gray-500 mt-1 block">
                                                    Used with role <strong>"Company"</strong> on the portal login screen.
                                                </span>
                                            </div>

                                            {/* Portal Password */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <Label htmlFor="password" className="text-sm font-semibold text-gray-800">
                                                        Portal Password <span className="text-red-500">*</span>
                                                    </Label>
                                                    <button
                                                        type="button"
                                                        onClick={handleGeneratePassword}
                                                        className="text-xs text-[#FF7A00] hover:text-[#e06c00] font-medium flex items-center gap-1"
                                                    >
                                                        <Sparkles className="w-3 h-3" /> Strong Password
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <Input
                                                        id="password"
                                                        type={showPassword ? 'text' : 'password'}
                                                        name="password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        placeholder="Enter or generate password"
                                                        required={formData.createPortalAccount}
                                                        minLength={6}
                                                        className="pl-9 pr-10 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
                                                    />
                                                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                <span className="text-[11px] text-gray-500 mt-1 block">
                                                    Min 6 characters. Hashed securely with Bcrypt.
                                                </span>
                                            </div>
                                        </div>

                                        {/* Representative HR Name */}
                                        <div>
                                            <Label htmlFor="contactPersonName" className="text-sm font-semibold text-gray-800">
                                                Company Recruiter / Representative Name
                                            </Label>
                                            <div className="mt-1.5 relative">
                                                <Input
                                                    id="contactPersonName"
                                                    name="contactPersonName"
                                                    value={formData.contactPersonName}
                                                    onChange={handleChange}
                                                    placeholder="e.g. Google India Campus Hiring Lead"
                                                    className="pl-9 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
                                                />
                                                <UserCheck className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>

                            {/* Card 3: Digital Presence & Recruitment Contact */}
                            <Card className="border border-gray-200 shadow-sm">
                                <CardHeader className="border-b border-gray-100 bg-white rounded-t-xl">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                                        <Globe className="w-5 h-5 text-[#FF7A00]" />
                                        Contact & Online Presence
                                    </CardTitle>
                                    <CardDescription>
                                        Public career portal link, branding assets, and corporate recruiter email.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="website" className="text-sm font-semibold text-gray-800">
                                                Official Website / Career Page
                                            </Label>
                                            <div className="mt-1.5 relative">
                                                <Input
                                                    id="website"
                                                    name="website"
                                                    value={formData.website}
                                                    onChange={handleChange}
                                                    placeholder="https://company.com"
                                                    className="pl-9 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
                                                />
                                                <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="contactEmail" className="text-sm font-semibold text-gray-800">
                                                Corporate Public HR Email
                                            </Label>
                                            <div className="mt-1.5 relative">
                                                <Input
                                                    id="contactEmail"
                                                    type="email"
                                                    name="contactEmail"
                                                    value={formData.contactEmail}
                                                    onChange={handleChange}
                                                    placeholder="campus-recruiting@company.com"
                                                    className="pl-9 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
                                                />
                                                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="logoUrl" className="text-sm font-semibold text-gray-800">
                                            Company Logo URL
                                        </Label>
                                        <div className="mt-1.5 relative">
                                            <Input
                                                id="logoUrl"
                                                name="logoUrl"
                                                value={formData.logoUrl}
                                                onChange={handleChange}
                                                placeholder="https://.../logo.png"
                                                className="pl-9 focus:border-[#FF7A00] focus:ring-[#FF7A00]"
                                            />
                                            <ImageIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Provide a publicly accessible SVG or PNG image URL for crisp rendering.
                                        </p>
                                    </div>

                                    {/* Partner Status Active Toggle */}
                                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-semibold text-gray-900 block">
                                                Active Placement Partner
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                Allow this company to post placement drives and schedule campus assessments.
                                            </span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF7A00]"></div>
                                        </label>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Form Action Buttons */}
                            <div className="flex items-center gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-[#FF7A00] hover:bg-[#e06c00] text-white font-medium py-2.5 shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Registering Company & Credentials...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            <span>Register Company & Create Account</span>
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate('/admin/companies')}
                                    disabled={loading}
                                    className="px-6 border-gray-300 text-gray-700 hover:bg-gray-100"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Live Interactive Card Preview */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="sticky top-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
                                    Live Portal Preview
                                </span>
                                <span className="text-xs text-gray-400">Student & Admin View</span>
                            </div>

                            <Card className="border border-gray-200/80 shadow-lg rounded-xl overflow-hidden bg-white hover:shadow-xl transition-all">
                                <div className="h-2 bg-gradient-to-r from-[#FF7A00] to-amber-500" />
                                <CardContent className="p-6">
                                    {/* Company Header with Avatar & Badge */}
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-14 h-14 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden shadow-inner p-2">
                                                {formData.logoUrl ? (
                                                    <img
                                                        src={formData.logoUrl}
                                                        alt={formData.name || 'Company'}
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = '';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-tr from-[#FF7A00] to-orange-400 text-white rounded-lg flex items-center justify-center font-bold text-xl shadow-sm">
                                                        {formData.name.trim() ? formData.name.trim().charAt(0).toUpperCase() : 'C'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                                    {formData.name.trim() || 'Company Name'}
                                                </h3>
                                                <span className="inline-block px-2.5 py-0.5 mt-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                                                    {formData.industry || 'Technology'}
                                                </span>
                                            </div>
                                        </div>

                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                                            formData.isActive
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                                        }`}>
                                            {formData.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-gray-600 line-clamp-3 mb-4 leading-relaxed bg-gray-50/60 p-2.5 rounded-lg border border-gray-100">
                                        {formData.description.trim() || 'Brief description of the corporate partner will appear here once entered.'}
                                    </p>

                                    {/* Portal Login Credentials Preview Box */}
                                    {formData.createPortalAccount && (
                                        <div className="mb-4 p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1.5">
                                                <KeyRound className="w-3.5 h-3.5 text-[#FF7A00]" />
                                                <span>System Portal Access</span>
                                            </div>
                                            <div className="space-y-1 text-xs">
                                                <div className="flex justify-between items-center text-gray-700">
                                                    <span className="text-gray-500">Login Role:</span>
                                                    <span className="font-semibold text-gray-800 bg-white px-1.5 py-0.5 rounded border border-amber-200">Company</span>
                                                </div>
                                                <div className="flex justify-between items-center text-gray-700">
                                                    <span className="text-gray-500">Email:</span>
                                                    <span className="font-medium text-gray-900 truncate max-w-[160px]">
                                                        {formData.loginEmail || 'Not configured'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center text-gray-700">
                                                    <span className="text-gray-500">Password:</span>
                                                    <span className="font-mono text-gray-800">
                                                        {formData.password ? (showPassword ? formData.password : '••••••••••') : 'Not set'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Meta tags */}
                                    <div className="space-y-2 text-xs text-gray-600 pt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span className="truncate">{formData.location.trim() || 'Office Location Not Specified'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span className="truncate">{formData.contactEmail.trim() || 'hr@company.com'}</span>
                                        </div>
                                        {formData.website && (
                                            <div className="flex items-center gap-2 text-[#FF7A00] font-medium">
                                                <Globe className="w-3.5 h-3.5 shrink-0" />
                                                <a
                                                    href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="truncate hover:underline flex items-center gap-1"
                                                >
                                                    {formData.website.replace(/^https?:\/\//, '')}
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Verification Footer */}
                                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            Verified MUJ Partner
                                        </span>
                                        <span className="text-[11px] text-gray-400">ID: Generated on Save</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Post-Registration Credentials Modal */}
                {savedCredentials && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-amber-200 animate-in fade-in zoom-in-95 duration-200">
                            <div className="bg-gradient-to-r from-[#FF7A00] to-amber-500 p-6 text-white text-center relative">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                                    <CheckCircle2 className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold">Company & Credentials Created!</h3>
                                <p className="text-white/80 text-xs mt-1">
                                    Share these credentials with the company HR/representative to log into MUJCODE.
                                </p>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500">Company Name:</span>
                                        <span className="font-bold text-gray-900">{savedCredentials.companyName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500">Login Role:</span>
                                        <span className="font-semibold text-[#FF7A00] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">Company</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500">Login URL:</span>
                                        <span className="font-mono text-gray-700">{window.location.origin}/login</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs border-t pt-2 border-gray-200">
                                        <span className="text-gray-500 font-medium">System Email:</span>
                                        <span className="font-mono font-bold text-gray-900 select-all">{savedCredentials.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500 font-medium">Password:</span>
                                        <span className="font-mono font-bold text-gray-900 select-all">{savedCredentials.password}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2.5 pt-2">
                                    <Button
                                        onClick={handleCopyCredentials}
                                        className="w-full bg-[#FF7A00] hover:bg-[#e06c00] text-white flex items-center justify-center gap-2"
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/admin/companies')}
                                        className="w-full border-gray-300"
                                    >
                                        Done & View Companies List
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
