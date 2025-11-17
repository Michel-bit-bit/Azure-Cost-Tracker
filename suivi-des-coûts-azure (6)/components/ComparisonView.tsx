
import React, { useState, useEffect, useMemo } from 'react';
import { CostEntry } from '../types';
import { MONTHS, COST_CATEGORIES, CostCategoryKey } from '../constants';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ComparisonViewProps {
    entries: CostEntry[];
}

const calculateTotal = (entry: CostEntry | null): number => {
    if (!entry) return 0;
    return entry.networking + entry.storage + entry.compute + entry.management + entry.marketplace;
};

const CustomTooltip = ({ active, payload, label, compareEntry }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const total = calculateTotal(label === 'Mois 1' ? payload[0].payload.entry : compareEntry);
        const percentage = total > 0 ? (data.value / total * 100).toFixed(1) : 0;

        let comparisonText = '';
        if (compareEntry) {
            const compareValue = compareEntry[data.name as CostCategoryKey];
            const diff = data.value - compareValue;
            const diffText = diff > 0 ? `+${diff.toFixed(2)}€` : `${diff.toFixed(2)}€`;
            const diffColor = diff > 0 ? 'text-red-500' : 'text-green-500';
            comparisonText = ` (vs ${compareValue.toFixed(2)}€, ${diffText})`;
        }

        return (
            <div className="p-3 bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                <p className="font-bold text-bunker dark:text-link-water">{data.label}</p>
                <p className="text-comet dark:text-storm-grey">Coût: {data.value.toFixed(2)}€ ({percentage}%)</p>
                {compareEntry && <p className={`text-sm ${label === 'Mois 1' ? 'text-comet dark:text-storm-grey' : ''}`}>{comparisonText}</p>}
            </div>
        );
    }
    return null;
};

const DonutChart: React.FC<{ entry: CostEntry, compareEntry: CostEntry | null, label: string }> = ({ entry, compareEntry, label }) => {
    const total = calculateTotal(entry);
    const chartData = Object.keys(COST_CATEGORIES).map(key => {
        const catKey = key as CostCategoryKey;
        return { name: catKey, label: COST_CATEGORIES[catKey].label, value: entry[catKey], color: COST_CATEGORIES[catKey].color, entry: entry };
    });

    return (
        <div className="w-full h-64 relative">
            <ResponsiveContainer>
                <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                        {chartData.map((d) => <Cell key={`cell-${d.name}`} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip compareEntry={compareEntry} label={label}/>} />
                    <Legend iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                    <p className="text-2xl font-bold text-bunker dark:text-link-water">{total.toFixed(2)}€</p>
                    <p className="text-sm text-comet dark:text-storm-grey">Total TTC</p>
                </div>
            </div>
        </div>
    );
};

const ComparisonView: React.FC<ComparisonViewProps> = ({ entries }) => {
    const [month1Id, setMonth1Id] = useState<number | null>(null);
    const [month2Id, setMonth2Id] = useState<number | null>(null);

    useEffect(() => {
        if (entries.length >= 2) {
            setMonth1Id(entries[0].id!);
            setMonth2Id(entries[1].id!);
        } else if (entries.length === 1) {
            setMonth1Id(entries[0].id!);
            setMonth2Id(null);
        } else {
            setMonth1Id(null);
            setMonth2Id(null);
        }
    }, [entries]);

    const entry1 = useMemo(() => entries.find(e => e.id === month1Id), [entries, month1Id]);
    const entry2 = useMemo(() => entries.find(e => e.id === month2Id), [entries, month2Id]);

    const renderComparisonResult = () => {
        if (!entry1 || !entry2) return null;
        
        const total1 = calculateTotal(entry1);
        const total2 = calculateTotal(entry2);
        const diff = total1 - total2;
        const percentageDiff = total2 !== 0 ? (diff / total2) * 100 : 0;

        const trendText = percentageDiff > 0 ? "Augmentation" : "Baisse";
        const trendColor = percentageDiff > 0 ? "text-red-500" : "text-green-500";
        
        return (
            <div className="text-center p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                <p className="font-semibold text-bunker dark:text-link-water">
                    {MONTHS[entry1.month]} {entry1.year}: {total1.toFixed(2)}€ vs {MONTHS[entry2.month]} {entry2.year}: {total2.toFixed(2)}€
                </p>
                <p className={`${trendColor} font-bold`}>
                    {trendText} de {Math.abs(percentageDiff).toFixed(2)}%
                </p>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md h-full">
            <h2 className="text-xl font-bold mb-4 text-bunker dark:text-link-water">Comparaison Mensuelle</h2>
            {entries.length < 1 ? (
                 <p className="text-center text-comet dark:text-storm-grey mt-8">Ajoutez au moins une entrée pour commencer la comparaison.</p>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                            value={month1Id ?? ''}
                            onChange={(e) => setMonth1Id(Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                        >
                            {entries.map(e => <option key={e.id} value={e.id}>{`${MONTHS[e.month]} ${e.year}`}</option>)}
                        </select>
                        <select
                            value={month2Id ?? ''}
                            onChange={(e) => setMonth2Id(Number(e.target.value))}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                        >
                             <option value="">-- Comparer avec --</option>
                            {entries.map(e => <option key={e.id} value={e.id}>{`${MONTHS[e.month]} ${e.year}`}</option>)}
                        </select>
                    </div>
                    
                    {renderComparisonResult()}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                        <div className="flex flex-col items-center">
                            {entry1 ? <DonutChart entry={entry1} compareEntry={entry2 || null} label="Mois 1"/> : <p>Sélectionnez le mois 1</p>}
                        </div>
                        <div className="flex flex-col items-center">
                            {entry2 ? <DonutChart entry={entry2} compareEntry={entry1 || null} label="Mois 2"/> : <p>Sélectionnez le mois 2</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComparisonView;
