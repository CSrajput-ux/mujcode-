import { useState, useEffect } from 'react';
import FilterBar from '../../components/faculty/FilterBar';
import {
    KPICard, PerformanceChart, ActivityChart, SuccessPieChart
} from '../../components/faculty/AnalyticsComponents';
import {
    getDashboardStats, getSectionPerformance, getActivityMetrics, getSuccessRates, getFacultyInsights
} from '../../services/facultyAnalyticsService';
import { Users, CheckCircle, Clock, TrendingUp, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

export default function FacultyReports() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [sectionData, setSectionData] = useState<any[]>([]);
    const [activityData, setActivityData] = useState<any[]>([]);
    const [successData, setSuccessData] = useState<any[]>([]);
    const [insights, setInsights] = useState<string[]>([]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [statsData, sectionPerf, activityMetrics, successRates, insightsData] = await Promise.all([
                getDashboardStats(),
                getSectionPerformance(),
                getActivityMetrics(),
                getSuccessRates(),
                getFacultyInsights()
            ]);

            setStats(statsData);
            setSectionData(sectionPerf);
            setActivityData(activityMetrics);
            setSuccessData(successRates);
            setInsights(insightsData);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
                <p className="text-gray-600">Insights on student performance and engagement.</p>
            </div>

            <FilterBar
                onSearchChange={() => { }}
                onDownload={() => toast.info("Downloading Report...")}
            />

            {/* SECTION 1: OVERALL PERFORMANCE SUMMARY (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Students"
                    value={stats?.totalStudents || 0}
                    icon={<Users className="w-6 h-6" />}
                />
                <KPICard
                    title="Active Students"
                    value={stats ? `${stats.activeStudentsPct}%` : '0%'}
                    trend={5}
                    trendLabel="vs last week"
                    icon={<CheckCircle className="w-6 h-6" />}
                />
                <KPICard
                    title="Avg Daily Submissions"
                    value={stats?.avgDailySubmissions || 0}
                    trend={-2}
                    trendLabel="vs last week"
                    icon={<Clock className="w-6 h-6" />}
                />
                <KPICard
                    title="Overall Success Rate"
                    value={stats ? `${stats.overallSuccessRate}%` : '0%'}
                    trend={stats?.growthTrend}
                    icon={<TrendingUp className="w-6 h-6" />}
                />
            </div>

            {/* SECTION 2: SECTION-WISE PERFORMANCE GRAPH */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Section Performance Over Time</h3>
                <PerformanceChart data={sectionData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SECTION 3: AVERAGE DAILY STUDENT ACTIVITY */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Average Daily Student Activity</h3>
                    <p className="text-sm text-gray-500 mb-6">Based on assignments, quizzes, and research work.</p>
                    <ActivityChart data={activityData} />
                </div>

                {/* SECTION 5: STUDENT SUCCESS RATE */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Student Success Rate</h3>
                    <SuccessPieChart data={successData} />
                </div>
            </div>

            {/* SECTION 6: INSIGHT & RECOMMENDATION PANEL */}
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm">
                        <Lightbulb className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Automated Insights</h3>
                        <ul className="space-y-2 text-blue-900">
                            {insights.length > 0 ? (
                                insights.map((insight, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        {insight}
                                    </li>
                                ))
                            ) : (
                                <li className="text-blue-700 italic">No significant insights detected for this period.</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
