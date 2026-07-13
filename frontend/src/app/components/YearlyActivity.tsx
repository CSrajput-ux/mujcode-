import {
    eachDayOfInterval,
    format,
    getDay,
    startOfMonth,
    endOfMonth,
    subMonths,
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useState, useEffect } from 'react';

export default function YearlyActivity() {
    const [activityData, setActivityData] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const userId = user.id;

                if (!userId) {
                    setLoading(false);
                    return;
                }

                const res = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5000') + ''}/api/student/heatmap/${userId}`);
                const data = await res.json();

                if (res.ok && Array.isArray(data)) {
                    // Convert activity array to record for easy lookup
                    const activityMap: Record<string, number> = {};
                    data.forEach((item: any) => {
                        // item.date is YYYY-MM-DD string
                        activityMap[item.date] = item.count;
                    });
                    setActivityData(activityMap);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching activity:', error);
                setLoading(false);
            }
        };

        fetchActivity();
    }, []);

    // Generate data for the last 12 months (including current)
    const today = new Date();
    const monthsData = [];

    // Iterate 11 months back to current month
    for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        // Get all days in this month
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Group into weeks (columns)
        const weeks: (Date | null)[][] = [];
        let currentWeek: (Date | null)[] = [];

        // Pad the start of the first week
        const startDayIndex = getDay(monthStart);
        for (let j = 0; j < startDayIndex; j++) {
            currentWeek.push(null);
        }

        daysInMonth.forEach(day => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });

        // Pad the end of the last week
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push(null);
            }
            weeks.push(currentWeek);
        }

        monthsData.push({
            date: monthDate,
            label: format(monthDate, 'MMMM'),
            shortLabel: format(monthDate, 'MMM'),
            weeks: weeks
        });
    }

    // Get activity level for a specific date (REAL DATA)
    const getActivityLevel = (date: Date | null) => {
        if (!date) return 0;

        const dateStr = format(date, 'yyyy-MM-dd');
        const count = activityData[dateStr] || 0;

        // Map count to level (0-4)
        if (count === 0) return 0;
        if (count <= 2) return 1;
        if (count <= 5) return 2;
        if (count <= 10) return 3;
        return 4;
    };

    // Uniform Orange color scheme
    const getLevelColor = (level: number) => {
        switch (level) {
            case 0: return 'bg-gray-100 hover:bg-gray-200'; // Empty - no activity
            case 1: return 'bg-[#FFE5CC] hover:bg-[#FFD9B3]'; // Light orange
            case 2: return 'bg-[#FFCC99] hover:bg-[#FFB366]'; // Medium-light orange
            case 3: return 'bg-[#FF9933] hover:bg-[#FF8000]'; // Medium orange
            case 4: return 'bg-[#FF7A00] hover:bg-[#E66D00]'; // Strong orange
            default: return 'bg-gray-100';
        }
    };

    // Calculate total contributions
    let totalContributions = 0;
    monthsData.forEach(m => {
        m.weeks.forEach(w => {
            w.forEach(d => {
                if (d && getActivityLevel(d) > 0) totalContributions++;
            })
        })
    });

    if (loading) {
        return (
            <Card className="shadow-md border-none">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-[#FF7A00]" />
                        <span>Yearly Activity</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-md border-none">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-[#FF7A00]" />
                        <span>Yearly Activity</span>
                    </div>
                    <div className="text-sm text-gray-500 font-normal">
                        {totalContributions} submissions in the past one year
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto pb-2">
                    <div className="min-w-[1000px] flex gap-4">
                        {/* Iterate over each month */}
                        {monthsData.map((month, monthIdx) => (
                            <div key={monthIdx} className="flex flex-col gap-2">
                                <span className="text-xs text-gray-500 font-medium px-1">
                                    {month.shortLabel}
                                </span>
                                <div className="flex gap-1">
                                    {month.weeks.map((week, weekIdx) => (
                                        <div key={weekIdx} className="flex flex-col gap-1">
                                            {week.map((day, dayIdx) => {
                                                const level = getActivityLevel(day);
                                                // If day is null (padding), render invisible box
                                                if (!day) {
                                                    return <div key={dayIdx} className="w-3 h-3 bg-transparent" />;
                                                }

                                                return (
                                                    <TooltipProvider key={dayIdx}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div
                                                                    className={`w-3 h-3 rounded-sm ${getLevelColor(level)} cursor-pointer transition-all`}
                                                                />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-xs">
                                                                    <span className="font-semibold">{format(day, 'MMM d, yyyy')}:</span> {level === 0 ? 'No' : `${activityData[format(day, 'yyyy-MM-dd')] || 0}`} activity
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end mt-6 text-xs text-gray-500 space-x-2">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                        <div className="w-3 h-3 bg-[#FFE5CC] rounded-sm"></div>
                        <div className="w-3 h-3 bg-[#FFCC99] rounded-sm"></div>
                        <div className="w-3 h-3 bg-[#FF9933] rounded-sm"></div>
                        <div className="w-3 h-3 bg-[#FF7A00] rounded-sm"></div>
                    </div>
                    <span>More</span>
                </div>
            </CardContent>
        </Card>
    );
}
