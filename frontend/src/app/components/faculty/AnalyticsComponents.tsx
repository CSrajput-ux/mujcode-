import { Card, CardContent } from '../ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

// --- KPI CARD ---
interface KPICardProps {
    title: string;
    value: string | number;
    trend?: number;
    trendLabel?: string;
    icon?: React.ReactNode;
}

export function KPICard({ title, value, trend, trendLabel, icon }: KPICardProps) {
    const isPositive = trend && trend >= 0;

    return (
        <Card className="shadow-xs border-gray-100">
            <CardContent className="p-5">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 text-gray-900 tracking-tight">{value}</h3>
                    </div>
                    {icon && <div className="p-2.5 bg-orange-50 rounded-xl text-[#FF7A00]">{icon}</div>}
                </div>
                {trend !== undefined && (
                    <div className="flex items-center mt-3">
                        <span className={`flex items-center text-xs sm:text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? <ArrowUp className="w-4 h-4 mr-0.5" /> : <ArrowDown className="w-4 h-4 mr-0.5" />}
                            {Math.abs(trend)}%
                        </span>
                        <span className="text-xs text-gray-400 ml-1.5">{trendLabel || 'vs last month'}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// --- PERFORMANCE CHART (Line) ---
export function PerformanceChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
                <Line type="monotone" dataKey="Section A" stroke="#FF7A00" strokeWidth={2.5} />
                <Line type="monotone" dataKey="Section B" stroke="#3b82f6" strokeWidth={2.5} />
                <Line type="monotone" dataKey="Section C" stroke="#10b981" strokeWidth={2.5} />
            </LineChart>
        </ResponsiveContainer>
    );
}

// --- ACTIVITY CHART (Bar) ---
export function ActivityChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#FF7A00" radius={[5, 5, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

// --- SUCCESS PIE CHART ---
export function SuccessPieChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height={280}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
            </PieChart>
        </ResponsiveContainer>
    );
}
