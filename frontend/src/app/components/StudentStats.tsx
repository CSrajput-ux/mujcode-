import { Award, Lock, CheckCircle2, Target, Flame, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

export default function StudentStats() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        solved: { easy: 0, medium: 0, hard: 0, total: 0 },
        total: { easy: 0, medium: 0, hard: 0, count: 0 }
    });
    const [badges, setBadges] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const userId = user.id;

                if (!userId) {
                    setLoading(false);
                    return;
                }

                // Parallel Fetch with authenticated apiClient
                const [userStatsRes, globalStatsRes, badgesRes] = await Promise.all([
                    apiClient.get(`/api/student/problem-stats/${userId}`).catch(() => ({ data: { solved: {}, totalSolved: 0 } })),
                    apiClient.get('/api/problems/stats').catch(() => ({ data: { total: { easy: 0, medium: 0, hard: 0 } } })),
                    apiClient.get(`/api/student/badges/${userId}`).catch(() => ({ data: { badges: [] } }))
                ]);

                const userStats = userStatsRes.data || {};
                const globalStats = globalStatsRes.data || {};
                const badgesData = badgesRes.data || {};

                // Calculate Totals
                const easyTotal = globalStats.total?.easy || 0;
                const mediumTotal = globalStats.total?.medium || 0;
                const hardTotal = globalStats.total?.hard || 0;
                const totalGlobal = easyTotal + mediumTotal + hardTotal;

                setStats({
                    solved: {
                        easy: userStats.solved?.easy || 0,
                        medium: userStats.solved?.medium || 0,
                        hard: userStats.solved?.hard || 0,
                        total: userStats.totalSolved || 0
                    },
                    total: {
                        easy: easyTotal,
                        medium: mediumTotal,
                        hard: hardTotal,
                        count: totalGlobal || 1 // Avoid division by zero
                    }
                });

                setBadges(badgesData.badges || []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching stats:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate percentages
    const easyPct = (stats.solved.easy / (stats.total.easy || 1)) * 100;
    const medPct = (stats.solved.medium / (stats.total.medium || 1)) * 100;
    const hardPct = (stats.solved.hard / (stats.total.hard || 1)) * 100;
    const totalPct = (stats.solved.total / stats.total.count) * 100;

    // Circular Progress Component
    const CircularProgress = ({ value, color, size = 112, strokeWidth = 8 }: { value: number, color: string, size?: number, strokeWidth?: number }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (value / 100) * circumference;

        return (
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg className="transform -rotate-90 w-full h-full">
                    <circle
                        className="text-gray-100"
                        strokeWidth={strokeWidth}
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                    <circle
                        className={`${color} transition-all duration-1000 ease-out`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-xs flex flex-col min-h-[190px]">
                    <div className="py-3 px-5 border-b border-gray-100 flex items-center">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="p-5 flex-1 flex items-center space-x-6">
                        <div className="rounded-full bg-gray-200 h-24 w-24 flex-shrink-0 animate-pulse"></div>
                        <div className="flex-1 space-y-3">
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-xs flex flex-col min-h-[190px]">
                    <div className="py-3 px-5 border-b border-gray-100 flex items-center">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="p-5 flex-1 flex items-center justify-center">
                        <div className="h-20 w-44 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Solved Problems */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-xs flex flex-col hover:border-orange-200/80 transition-colors">
                <div className="py-3 px-5 border-b border-gray-100 flex justify-between items-center w-full">
                    <span className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#FF7A00]" />
                        <span>Solved Problems</span>
                    </span>
                    <span className="px-2.5 py-0.5 bg-orange-50 text-[#FF7A00] border border-orange-200/60 text-xs font-semibold rounded-full">
                        {stats.solved.total} / {stats.total.count} Solved
                    </span>
                </div>
                <div className="p-4 sm:p-5 flex-1 flex items-center justify-around gap-5">
                    {/* Compact Circle */}
                    <div className="relative flex flex-col items-center justify-center flex-shrink-0">
                        <CircularProgress value={totalPct} color="text-[#FF7A00]" size={112} strokeWidth={8} />
                        <div className="absolute flex flex-col items-center text-center">
                            <span className="text-2xl font-bold text-gray-900 leading-none">{stats.solved.total}</span>
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                                <CheckCircle2 className="w-3 h-3" /> Solved
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5">of {stats.total.count}</span>
                        </div>
                    </div>

                    {/* Breakdown - Easy/Med/Hard Stats */}
                    <div className="flex flex-col gap-2.5 flex-1 max-w-[270px]">
                        {/* Easy */}
                        <div className="bg-emerald-50/50 border border-emerald-100/70 rounded-lg px-3 py-1.5">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Easy
                                </span>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-emerald-800">{stats.solved.easy}</span>
                                    <span className="text-gray-400 text-[11px]">/{stats.total.easy}</span>
                                    <span className="text-[11px] text-emerald-600/80 font-medium ml-1">({easyPct.toFixed(0)}%)</span>
                                </div>
                            </div>
                            <div className="w-full bg-emerald-100/70 h-1.5 rounded-full mt-1 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${easyPct}%` }}></div>
                            </div>
                        </div>

                        {/* Medium */}
                        <div className="bg-amber-50/50 border border-amber-100/70 rounded-lg px-3 py-1.5">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-amber-700 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    Medium
                                </span>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-amber-800">{stats.solved.medium}</span>
                                    <span className="text-gray-400 text-[11px]">/{stats.total.medium}</span>
                                    <span className="text-[11px] text-amber-600/80 font-medium ml-1">({medPct.toFixed(0)}%)</span>
                                </div>
                            </div>
                            <div className="w-full bg-amber-100/70 h-1.5 rounded-full mt-1 overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${medPct}%` }}></div>
                            </div>
                        </div>

                        {/* Hard */}
                        <div className="bg-rose-50/50 border border-rose-100/70 rounded-lg px-3 py-1.5">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-rose-700 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    Hard
                                </span>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold text-rose-800">{stats.solved.hard}</span>
                                    <span className="text-gray-400 text-[11px]">/{stats.total.hard}</span>
                                    <span className="text-[11px] text-rose-600/80 font-medium ml-1">({hardPct.toFixed(0)}%)</span>
                                </div>
                            </div>
                            <div className="w-full bg-rose-100/70 h-1.5 rounded-full mt-1 overflow-hidden">
                                <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${hardPct}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Badges */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-xs flex flex-col hover:border-purple-200/80 transition-colors">
                <div className="py-3 px-5 border-b border-gray-100 flex justify-between items-center w-full">
                    <span className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-600" />
                        <span>Badges</span>
                    </span>
                    <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/60 text-xs font-semibold rounded-full">
                        {badges.length} Unlocked
                    </span>
                </div>
                <div className="p-4 sm:p-5 flex-1 flex items-center justify-center">
                    {badges.length === 0 ? (
                        <div className="flex items-center justify-between w-full px-2 gap-4">
                            {/* Status info */}
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100/80 flex items-center justify-center flex-shrink-0">
                                    <Lock className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">No Badges Yet</p>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">Complete courses & tests to unlock badges</p>
                                </div>
                            </div>

                            {/* Preview upcoming locked badges */}
                            <div className="flex items-center gap-2.5 flex-shrink-0">
                                <div className="flex flex-col items-center p-2.5 px-3 bg-gray-50/80 rounded-lg border border-gray-100 text-center opacity-75" title="First Problem Solver">
                                    <Target className="w-5 h-5 text-gray-400 mb-1" />
                                    <span className="text-[11px] font-medium text-gray-600">Pioneer</span>
                                </div>
                                <div className="flex flex-col items-center p-2.5 px-3 bg-gray-50/80 rounded-lg border border-gray-100 text-center opacity-75" title="Coding Streak">
                                    <Flame className="w-5 h-5 text-gray-400 mb-1" />
                                    <span className="text-[11px] font-medium text-gray-600">Streak</span>
                                </div>
                                <div className="flex flex-col items-center p-2.5 px-3 bg-gray-50/80 rounded-lg border border-gray-100 text-center opacity-75" title="Course Achiever">
                                    <Sparkles className="w-5 h-5 text-gray-400 mb-1" />
                                    <span className="text-[11px] font-medium text-gray-600">Master</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 w-full overflow-x-auto py-1 [scrollbar-width:thin]">
                            {badges.map((badge: any, index: number) => (
                                <div key={index} className="flex items-center gap-2.5 p-2 px-3 bg-purple-50/50 rounded-lg border border-purple-100/80 flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                                        <Award className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-800 leading-none">{badge.name}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{new Date(badge.earnedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
