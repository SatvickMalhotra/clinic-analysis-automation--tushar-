import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ClaimRecord } from '../types';
// Fix: Changed import for `parseISO` to use submodule import.
import { format } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';

interface AdvancedAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ClaimRecord[];
}

const safeParseFloat = (value: any): number => {
    if (value === null || value === undefined || String(value).trim() === '') return 0;
    const num = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
};

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                <p className="font-bold text-slate-800">{label}</p>
                {payload.map((pld: any, index: number) => (
                    <p key={pld.dataKey} style={{ color: pld.stroke }}>
                        {pld.name}: {Number(pld.value).toLocaleString('en-IN')}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const formatYAxisTick = (value: number) => {
    if (value >= 1e7) return `${(value / 1e7).toFixed(1)}Cr`;
    if (value >= 1e5) return `${(value / 1e5).toFixed(1)}L`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toLocaleString('en-IN');
};


const TrendChart: React.FC<{
    chartData: any[];
    keys: string[];
    title: string;
    metric: 'count' | 'claim' | 'settled';
}> = ({ chartData, keys, title, metric }) => {

    const yAxisFormatter = metric === 'count' ? (val:number) => val.toLocaleString('en-IN') : formatYAxisTick;

    return (
        <div className="bg-white p-4 rounded-lg shadow border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={yAxisFormatter} tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        {keys.map((key, index) => (
                            <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={2} />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


const AdvancedAnalysisModal: React.FC<AdvancedAnalysisModalProps> = ({ isOpen, onClose, data }) => {
    const [metric, setMetric] = useState<'count' | 'claim' | 'settled'>('count');

    const analysisCategories = ['Registered to Insurer', 'Aging Days Bucketing', 'TAT Group', 'Customer Gender' ,'Construct Type', 'State', 'Product'];

    const monthlyTrendData = useMemo(() => {
        if (!data) return {};

        const getMetricValue = (row: ClaimRecord) => {
            if (metric === 'claim') return safeParseFloat(row['Claim Amount']);
            if (metric === 'settled') return safeParseFloat(row['Settled Amount']);
            return 1; // for count
        };

        return analysisCategories.reduce((acc, category) => {
            const monthlyData: Record<string, Record<string, number>> = {};
            
            data.forEach(row => {
                const date = row.parsedClaimIntimationDate as Date | null;
                if (date) {
                    const month = format(date, 'yyyy-MM');
                    const catValue = String(row[category] || 'N/A');
                    if (!monthlyData[month]) monthlyData[month] = {};
                    if (!monthlyData[month][catValue]) monthlyData[month][catValue] = 0;
                    monthlyData[month][catValue] += getMetricValue(row);
                }
            });

            // Consolidate to top N + 'Other'
            const categoryTotals = data.reduce((totalAcc, row) => {
                const catValue = String(row[category] || 'N/A');
                if (!totalAcc[catValue]) totalAcc[catValue] = 0;
                totalAcc[catValue] += getMetricValue(row);
                return totalAcc;
            }, {} as Record<string, number>);

            const sortedCategories = Object.keys(categoryTotals).sort((a,b) => categoryTotals[b] - categoryTotals[a]);
            const topKeys = new Set(sortedCategories.slice(0, 6));

            const allMonths = Object.keys(monthlyData).sort();
            const allKeys = new Set<string>();

            const chartData = allMonths.map(month => {
                const monthEntry: Record<string, any> = { month: format(parseISO(month + '-01'), 'MMM yyyy') };
                let otherValue = 0;

                Object.entries(monthlyData[month]).forEach(([catValue, value]) => {
                    if (topKeys.has(catValue)) {
                        monthEntry[catValue] = value;
                        allKeys.add(catValue);
                    } else {
                        otherValue += value;
                    }
                });
                
                if (otherValue > 0) {
                     monthEntry['Other'] = otherValue;
                     allKeys.add('Other');
                }
               
                return monthEntry;
            });

            acc[category] = { chartData, keys: Array.from(allKeys) };
            return acc;
        }, {} as Record<string, { chartData: any[], keys: string[] }>);

    }, [data, metric]);


    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-100 rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-300 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-primary">Month-over-Month Trend Analysis</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <label className="text-sm font-medium text-slate-700">Metric:</label>
                             <select value={metric} onChange={(e) => setMetric(e.target.value as any)} className="bg-white border-slate-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm">
                                <option value="count">Claim Count</option>
                                <option value="claim">Claim Amount</option>
                                <option value="settled">Settled Amount</option>
                             </select>
                        </div>
                        <button onClick={onClose} className="text-slate-500 hover:text-slate-800">&times;</button>
                    </div>
                </header>
                <main className="flex-grow p-4 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {analysisCategories.map(category => {
                            const data = monthlyTrendData[category];
                            return data && data.chartData.length > 0 ? (
                                <TrendChart key={category} {...data} title={`Monthly Trend: ${category}`} metric={metric}/>
                            ) : null;
                        })}
                    </div>
                </main>
            </div>
        </div>,
        document.body
    );
};

export default AdvancedAnalysisModal;