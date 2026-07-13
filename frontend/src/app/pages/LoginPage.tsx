import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, GraduationCap, Users, Shield, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import logoImage from '@/assets/image-removebg-preview.png';
import ChangePasswordModal from '../components/ChangePasswordModal';

export default function LoginPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('student');
  const [credentials, setCredentials] = useState({
    collegeId: 'chhotu.2427030521@muj.manipal.edu', // Auto-fill Student
    username: 'dr.rishigupta@jaipur.manipal.edu',   // Auto-fill Faculty/Admin
    password: 'chhotu.2427030521'                        // Default password (changeable)
    // company email handles by username state for simplicity or add 'email' if needed
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingRoleRoute, setPendingRoleRoute] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const roles = [
    { value: 'student', label: 'Student', icon: <GraduationCap className="w-5 h-5" />, route: '/student/dashboard' },
    { value: 'faculty', label: 'Faculty', icon: <Users className="w-5 h-5" />, route: '/faculty/dashboard' },
    { value: 'admin', label: 'Admin', icon: <Shield className="w-5 h-5" />, route: '/admin/dashboard' },
    { value: 'company', label: 'Company', icon: <Building2 className="w-5 h-5" />, route: '/company/dashboard' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const role = roles.find(r => r.value === selectedRole);
    if (!role) return;

    // Map inputs to backend expectation (collegeId is the unified ID field)
    let loginId = credentials.collegeId;
    if (selectedRole !== 'student') {
      loginId = credentials.username; // Use username field for others
    }

    try {
      const response = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginId,
          password: credentials.password,
          role: selectedRole
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Save to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Open Password Change Modal instead of navigating immediately
        // Check if password change is required (Not for Company, and only if not changed yet)
        if (selectedRole !== 'company' && !data.user.isPasswordChanged) {
          setUserEmail(loginId);
          setPendingRoleRoute(role.route);
          setShowPasswordModal(true);
        } else {
          navigate(role.route);
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src={logoImage} alt="MujCode Logo" className="w-12 h-12" />
            <h1 className="text-4xl font-bold text-gray-900">MujCode</h1>
          </div>
          <p className="text-gray-600 text-lg">Sign in to access your account</p>
        </div>

        <Card className="shadow-2xl border-none">
          <CardContent className="p-8">
            <Tabs value={selectedRole} onValueChange={(val) => { setSelectedRole(val); setError(''); }}>
              {/* Role Selector */}
              <TabsList className="grid grid-cols-4 mb-8 bg-gray-100 p-1">
                {roles.map((role) => (
                  <TabsTrigger
                    key={role.value}
                    value={role.value}
                    className="data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white flex items-center space-x-2"
                  >
                    {role.icon}
                    <span>{role.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center font-medium">
                  {error}
                </div>
              )}

              {/* Student Login */}
              <TabsContent value="student">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <Label htmlFor="collegeId" className="text-gray-700 mb-2 block">College ID</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="collegeId"
                        type="text"
                        placeholder="Enter your college ID"
                        value={credentials.collegeId}
                        onChange={(e) => setCredentials({ ...credentials, collegeId: e.target.value })}
                        className="pl-10 py-6 border-2 focus:border-[#FF7A00]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-gray-700 mb-2 block">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        className="pl-10 py-6 border-2 focus:border-[#FF7A00]"
                      />
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <p className="text-sm text-orange-800">
                      <strong>Note:</strong> New students require Admin approval before first login
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FF7A00] hover:bg-[#FF6A00] text-white py-6 text-lg rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Logging in...' : 'Login as Student'}
                  </Button>
                </form>
              </TabsContent>

              {/* Faculty Login */}
              <TabsContent value="faculty">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <Label htmlFor="faculty-username" className="text-gray-700 mb-2 block">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="faculty-username"
                        type="text"
                        placeholder="Enter user ID"
                        value={credentials.username}
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                        className="pl-10 py-6 border-2 focus:border-[#FF7A00]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="faculty-password" className="text-gray-700 mb-2 block">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="faculty-password"
                        type="password"
                        placeholder="Enter your password"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        className="pl-10 py-6 border-2 focus:border-[#FF7A00]"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FF7A00] hover:bg-[#FF6A00] text-white py-6 text-lg rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Logging in...' : 'Login as Faculty'}
                  </Button>
                </form>
              </TabsContent>

              {/* Admin Login */}
              <TabsContent value="admin">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <Label htmlFor="admin-username" className="text-gray-700 mb-2 block">Admin Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="admin-username"
                        type="text"
                        placeholder="Enter admin ID"
                        value={credentials.username}
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                        className="pl-10 py-6 border-2 focus:border-[#FF7A00]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="admin-password" className="text-gray-700 mb-2 block">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        className="pl-10 py-6 border-2 focus:border-[#FF7A00]"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FF7A00] hover:bg-[#FF6A00] text-white py-6 text-lg rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Logging in...' : 'Login as Admin'}
                  </Button>
                </form>
              </TabsContent>

              {/* Company Login */}
              <TabsContent value="company">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <Label htmlFor="company-username" className="text-gray-700 mb-2 block">Company ID/Email</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="company-username"
                        type="text"
                        placeholder="company@example.com"
                        value={credentials.username}
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                        className="pl-10 py-6 border-2 focus:border-[#FF7A00]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company-password" className="text-gray-700 mb-2 block">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="company-password"
                        type="password"
                        placeholder="Enter your password"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        className="pl-10 py-6 border-2 focus:border-[#FF7A00]"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FF7A00] hover:bg-[#FF6A00] text-white py-6 text-lg rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Logging in...' : 'Login as Company'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-[#FF7A00] hover:underline"
              >
                ← Back to Home
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => navigate(pendingRoleRoute)}
        onSuccess={() => {
          setShowPasswordModal(false);
          navigate(pendingRoleRoute);
        }}
        userEmail={userEmail}
      />
    </div>
  );
}