
import React, { useState, useEffect, useMemo } from 'react';
import { CostEntry } from '../types';
import { MONTHS, INPUT_COST_CATEGORIES, ALL_COST_CATEGORIES, CostCategoryKey } from '../constants';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ComparisonViewProps {
    entries: CostEntry[];
}

const calculateTotal = (entry: CostEntry | null): number => {
    if (!entry) return 0;
    const sumOfParts = entry.networking + entry.storage + entry.compute + entry.management + entry.marketplace;
    return entry.totalTTC ?? sumOfParts;
};

// Fix: Replaced `any` with a specific type for props to enable type narrowing.
const CustomTooltip = ({ active, payload, compareEntry }: { active?: boolean; payload?: any[]; compareEntry: CostEntry | null; }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload as { name: CostCategoryKey | 'autre', value: number, label: string, entry: CostEntry, color: string };
        const entryForTotal = data.entry;
        const total = calculateTotal(entryForTotal);
        const percentage = total > 0 ? (data.value / total * 100).toFixed(1) : 0;

        let comparisonText = '';
        // Fix: Assign data.name to a local variable to help TypeScript with type narrowing.
        const dataName = data.name;
        if (compareEntry && dataName !== 'autre') {
            const compareValue = compareEntry[dataName] || 0;
            const diff = data.value - compareValue;
            const diffText = diff >= 0 ? `+${diff.toFixed(2)}€` : `${diff.toFixed(2)}€`;
            comparisonText = `(vs ${compareValue.toFixed(2)}€, ${diffText})`;
        }

        return (
            <div className="p-3 bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                <p className="font-bold text-bunker dark:text-link-water">{data.label}</p>
                <p className="text-comet dark:text-storm-grey">Coût: {data.value.toFixed(2)}€ ({percentage}%)</p>
                {comparisonText && <p className="text-sm text-comet dark:text-storm-grey">{comparisonText}</p>}
            </div>
        );
    }
    return null;
};


const getPieData = (entry: CostEntry | null) => {
    if (!entry) return [];
    const sumOfParts = (Object.keys(INPUT_COST_CATEGORIES) as CostCategoryKey[]).reduce((sum, key) => sum + (entry[key] || 0), 0);
    const total = calculateTotal(entry);
    const autre = Math.max(0, total - sumOfParts);

    // Fix: Explicitly type `data` to allow for the 'autre' category.
    const data: {
        name: CostCategoryKey | 'autre';
        value: number;
        label: string;
        color: string;
        entry: CostEntry;
    }[] = (Object.keys(INPUT_COST_CATEGORIES) as CostCategoryKey[]).map(key => ({
        name: key,
        value: entry[key] || 0,
        label: INPUT_COST_CATEGORIES[key].label,
        color: INPUT_COST_CATEGORIES[key].color,
        entry: entry,
    }));

    if (autre > 0.01) {
        data.push({ name: 'autre', value: autre, label: 'Autre', color: ALL_COST_CATEGORIES.autre.color, entry: entry });
    }
    return data.filter(d => d.value > 0);
};

const PieChartDisplay: React.FC<{ pieData: any[]; compareEntry: CostEntry | null; title: string; }> = ({ pieData, compareEntry, title }) => {
    if (pieData.length === 0) {
        return <div className="text-center text-comet dark:text-storm-grey flex items-center justify-center h-full"><p>Aucune donnée pour {title}.</p></div>;
    }

    const total = calculateTotal(pieData[0]?.entry);

    return (
        <div className="flex flex-col items-center h-full">
            <h3 className="font-semibold text-bunker dark:text-link-water mb-2">{title}</h3>
            <div className="w-full h-56 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={pieData.length > 1 ? 2 : 0}>
                            {pieData.map((item) => <Cell key={item.name} fill={item.color} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip compareEntry={compareEntry} />} />
                    </PieChart>
                </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-bunker dark:text-link-water">{total.toFixed(2)}€</span>
                    <span className="text-sm text-comet dark:text-storm-grey">Total TTC</span>
                </div>
            </div>
            <Legend payload={pieData.map(item => ({ value: item.label, type: 'square', color: item.color }))} />
        </div>
    );
};


export const ComparisonView: React.FC<ComparisonViewProps> = ({ entries }) => {
    const [month1, setMonth1] = useState<number | null>(null);
    const [year1, setYear1] = useState<number | null>(null);
    const [month2, setMonth2] = useState<number | null>(null);
    const [year2, setYear2] = useState<number | null>(null);

    // Fix: Explicitly type sort parameters to avoid arithmetic operation errors on potentially non-number types.
    const availableYears = useMemo(() => Array.from(new Set(entries.map(e => e.year))).sort((a: number, b: number) => b - a), [entries]);

    useEffect(() => {
        if (entries.length > 0 && year1 === null) {
            setMonth1(entries[0].month);
            setYear1(entries[0].year);
        }
        if (entries.length > 1 && year2 === null) {
            setMonth2(entries[1].month);
            setYear2(entries[1].year);
        }
    }, [entries, year1, year2]);

    const entry1 = useMemo(() => entries.find(e => e.year === year1 && e.month === month1) || null, [entries, year1, month1]);
    const entry2 = useMemo(() => entries.find(e => e.year === year2 && e.month === month2) || null, [entries, year2, month2]);
    
    const pieData1 = useMemo(() => getPieData(entry1), [entry1]);
    const pieData2 = useMemo(() => getPieData(entry2), [entry2]);

    const comparisonResult = useMemo(() => {
        if (!entry1 || !entry2) return null;
        const total1 = calculateTotal(entry1);
        const total2 = calculateTotal(entry2);
        const diff = total1 - total2;
        const percentDiff = total2 !== 0 ? (diff / total2 * 100) : (total1 > 0 ? 100 : 0);
        const trendText = percentDiff >= 0 ? "Augmentation" : "Baisse";
        const trendColor = percentDiff >= 0 ? 'text-red-500' : 'text-green-500';
        return { trendText, trendColor, percentDiff: Math.abs(percentDiff) };
    }, [entry1, entry2]);

     if (entries.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md h-full flex flex-col min-h-[600px] justify-center items-center">
                 <h2 className="text-xl font-bold mb-4 text-bunker dark:text-link-water">Comparaison Mensuelle</h2>
                 <p className="text-comet dark:text-storm-grey">Ajoutez au moins une entrée pour commencer.</p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md h-full flex flex-col min-h-[600px]">
            <h2 className="text-xl font-bold mb-4 text-bunker dark:text-link-water">Comparaison Mensuelle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex gap-2">
                    <select value={month1 ?? ''} onChange={e => setMonth1(Number(e.target.value))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                        {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select value={year1 ?? ''} onChange={e => setYear1(Number(e.target.value))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                 <div className="flex gap-2">
                    <select value={month2 ?? ''} onChange={e => setMonth2(e.target.value ? Number(e.target.value) : null)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                        <option value="">-- Mois --</option>
                        {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select value={year2 ?? ''} onChange={e => setYear2(e.target.value ? Number(e.target.value) : null)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                        <option value="">-- Année --</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>
            {comparisonResult && (
                <div className="text-center mb-4 p-2 bg-gray-100 dark:bg-gray-700/50 rounded">
                    <p className={comparisonResult.trendColor}>
                        {comparisonResult.trendText} de {comparisonResult.percentDiff.toFixed(1)}%
                    </p>
                </div>
            )}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                <PieChartDisplay pieData={pieData1} compareEntry={entry2} title={entry1 ? `${MONTHS[entry1.month]} ${entry1.year}` : 'Période 1'} />
                <PieChartDisplay pieData={pieData2} compareEntry={entry1} title={entry2 ? `${MONTHS[entry2.month]} ${entry2.year}` : 'Période 2'} />
            </div>
        </div>
    );
};
