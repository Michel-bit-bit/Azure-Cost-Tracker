import React, { useState, useMemo, useEffect } from 'react';
import { CostEntry } from '../types';
import { MONTHS, INPUT_COST_CATEGORIES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnnualReviewProps {
    entries: CostEntry[];
}

const calculateTotal = (entry: CostEntry | undefined): number => {
    if (!entry) return 0;
    const sumOfParts = entry.networking + entry.storage + entry.compute + entry.management + entry.marketplace;
    return entry.totalTTC ?? sumOfParts;
};

const CustomTooltip = ({ active, payload, label, annualTotal, entries, selectedYear }: {
    active?: boolean,
    payload?: any[],
    label?: string,
    annualTotal?: number,
    entries: CostEntry[],
    selectedYear: number | null
}) => {
    if (active && payload && payload.length && selectedYear) {
        const monthIndex = MONTHS.indexOf(label || '');
        const currentMonthEntry = entries.find((e: CostEntry) => e.year === selectedYear && e.month === monthIndex);
        const prevYearEntry = entries.find((e: CostEntry) => e.year === selectedYear - 1 && e.month === monthIndex);
        
        const monthTotal = calculateTotal(currentMonthEntry);
        // Fix: Safer check for annualTotal
        const percentageOfAnnual = annualTotal && annualTotal > 0 ? (monthTotal / annualTotal * 100).toFixed(1) : 0;
        
        let comparisonText = 'N/A';
        if (prevYearEntry) {
            const prevYearTotal = calculateTotal(prevYearEntry);
            const diff = monthTotal - prevYearTotal;
            // Fix: Prevent division by zero
            if (prevYearTotal > 0) {
                comparisonText = `${diff.toFixed(2)}€ (${(diff / prevYearTotal * 100).toFixed(1)}%)`;
            } else {
                comparisonText = `${diff.toFixed(2)}€ (N/A)`;
            }
        }

        return (
            <div className="p-3 bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                <p className="font-bold text-bunker dark:text-link-water">{label} {selectedYear}</p>
                <p className="text-comet dark:text-storm-grey">Coût: {monthTotal.toFixed(2)}€</p>
                <p className="text-comet dark:text-storm-grey">Part annuelle: {percentageOfAnnual}%</p>
                <p className="text-comet dark:text-storm-grey">vs N-1: {comparisonText}</p>
            </div>
        );
    }
    return null;
};

const AnnualReview: React.FC<AnnualReviewProps> = ({ entries }) => {
    // Fix: Explicitly type sort parameters to avoid arithmetic operation errors on potentially non-number types.
    const availableYears = useMemo(() => Array.from(new Set(entries.map(e => e.year))).sort((a: number, b: number) => b - a), [entries]);
    const [selectedYear, setSelectedYear] = useState<number | null>(availableYears[0] || null);

    // Fix: useEffect was used but not imported.
    useEffect(() => {
        if (!selectedYear && availableYears.length > 0) {
            setSelectedYear(availableYears[0]);
        } else if (selectedYear && !availableYears.includes(selectedYear)) {
            setSelectedYear(availableYears[0] || null);
        }
    }, [availableYears, selectedYear]);

    const yearData = useMemo(() => {
        if (!selectedYear) return [];
        const yearEntries = entries.filter(e => e.year === selectedYear);
        return MONTHS.map((monthName, i) => {
            const monthEntry = yearEntries.find(e => e.month === i);
            return {
                name: monthName,
                Coût: calculateTotal(monthEntry)
            };
        });
    }, [entries, selectedYear]);
    
    const stats = useMemo(() => {
        if (!selectedYear) return null;
        const currentYearEntries = entries.filter(e => e.year === selectedYear).sort((a,b) => a.month - b.month);
        if (currentYearEntries.length === 0) return null;

        const firstMonth = currentYearEntries[0];
        const lastMonth = currentYearEntries[currentYearEntries.length - 1];
        const firstTotal = calculateTotal(firstMonth);
        const lastTotal = calculateTotal(lastMonth);

        const diff = lastTotal - firstTotal;
        const diffPercent = firstTotal !== 0 ? (diff / firstTotal * 100) : 0;

        const annualTotal = currentYearEntries.reduce((sum, e) => sum + calculateTotal(e), 0);
        
        const prevYearEntries = entries.filter(e => e.year === selectedYear - 1);
        const prevYearTotal = prevYearEntries.reduce((sum, e) => sum + calculateTotal(e), 0);
        const annualDiff = annualTotal - prevYearTotal;
        const annualDiffPercent = prevYearTotal !== 0 ? (annualDiff / prevYearTotal * 100) : 0;

        return {
            firstVsLastDiff: diff,
            firstVsLastPercent: diffPercent,
            annualTotal,
            prevYearTotal,
            annualDiff,
            annualDiffPercent
        };
    }, [entries, selectedYear]);

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-bunker dark:text-link-water">Bilan Annuel</h2>
                <select 
                    value={selectedYear ?? ''} 
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    disabled={availableYears.length === 0}
                >
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>
            
            {!selectedYear ? (
                <p className="text-center text-comet dark:text-storm-grey mt-8">Aucune donnée disponible pour le bilan annuel.</p>
            ) : (
                <>
                    <div className="h-96 w-full mb-6">
                        <ResponsiveContainer>
                            <BarChart data={yearData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip content={<CustomTooltip annualTotal={stats?.annualTotal} entries={entries} selectedYear={selectedYear} />} />
                                <Legend />
                                <Bar dataKey="Coût" fill={INPUT_COST_CATEGORIES.networking.color} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                            <h3 className="font-semibold text-storm-grey">Premier vs Dernier Mois</h3>
                            <p className={stats.firstVsLastDiff > 0 ? 'text-red-500' : 'text-green-500'}>
                                {stats.firstVsLastDiff.toFixed(2)}€ ({stats.firstVsLastPercent.toFixed(1)}%)
                            </p>
                        </div>
                        <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                            <h3 className="font-semibold text-storm-grey">Total Annuel {selectedYear}</h3>
                            <p className="font-bold text-lg text-bunker dark:text-link-water">{stats.annualTotal.toFixed(2)}€</p>
                        </div>
                         <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                            <h3 className="font-semibold text-storm-grey">vs Année {selectedYear - 1}</h3>
                            {stats.prevYearTotal > 0 ? (
                                <p className={stats.annualDiff > 0 ? 'text-red-500' : 'text-green-500'}>
                                    {stats.annualDiff.toFixed(2)}€ ({stats.annualDiffPercent.toFixed(1)}%)
                                </p>
                            ) : <p>N/A</p>}
                        </div>
                    </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AnnualReview;