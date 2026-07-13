
import { Navigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Higher Order Component to protect routes based on permissions
 * @param requiredFeature The feature identifier that must NOT be blocked
 */
export const ProtectedRoute = ({ requiredFeature, children }: { requiredFeature: string, children: JSX.Element }) => {
    const [loading, setLoading] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockReason, setBlockReason] = useState('');

    useEffect(() => {
        const checkPermission = async () => {
            try {
                const token = localStorage.getItem('token');
                // We'll reuse the endpoint we created. 
                // Optimization: In a real app, we'd cache this in Context or Redux to avoid spamming the API on every route change.
                // For this MVP, we fetch on mount of the protected route.

                const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/student/restrictions', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.blockedFeatures.includes(requiredFeature)) {
                        setIsBlocked(true);
                        // Find reason from details if available
                        const detail = data.details.find((d: any) => d.blockedFeatures.includes(requiredFeature));
                        setBlockReason(detail?.reason || 'Faculty Restriction');
                        toast.error(`Access to ${requiredFeature} is restricted.`);
                    }

                    // Also check for 'dashboard' full block
                    if (data.blockedFeatures.includes('dashboard')) {
                        setIsBlocked(true);
                        setBlockReason('Full Dashboard Access Restricted');
                        toast.error('Your dashboard access has been restricted.');
                    }
                }
            } catch (error) {
                console.error("Permission check failed", error);
            } finally {
                setLoading(false);
            }
        };

        checkPermission();
    }, [requiredFeature]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (isBlocked) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-red-500">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🚫</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
                    <p className="text-gray-500 mb-6">
                        You do not have permission to access the <strong>{requiredFeature}</strong> module.
                    </p>
                    {blockReason && (
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
                            <p className="text-xs font-bold text-red-800 uppercase tracking-wide mb-1">Reason</p>
                            <p className="text-red-700 font-medium">{blockReason}</p>
                        </div>
                    )}
                    <button
                        onClick={() => window.location.href = '/student/dashboard'}
                        className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-all"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return children;
};
