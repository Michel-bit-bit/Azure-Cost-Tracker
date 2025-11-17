import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { CostEntry } from '../types';
import { MONTHS, COST_CATEGORIES, CostCategoryKey } from '../constants';

interface AddEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (entry: Omit<CostEntry, 'id'> | CostEntry) => void;
    existingEntry: CostEntry | null;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

const AddEntryModal: React.FC<AddEntryModalProps> = ({ isOpen, onClose, onSubmit, existingEntry }) => {
    const [month, setMonth] = useState<number>(new Date().getMonth());
    const [year, setYear] = useState<number>(currentYear);
    const [costs, setCosts] = useState({
        networking: '', storage: '', compute: '', management: '', marketplace: ''
    });

    useEffect(() => {
        if (existingEntry) {
            setMonth(existingEntry.month);
            setYear(existingEntry.year);
            setCosts({
                networking: String(existingEntry.networking),
                storage: String(existingEntry.storage),
                compute: String(existingEntry.compute),
                management: String(existingEntry.management),
                marketplace: String(existingEntry.marketplace),
            });
        } else {
            // Reset form when opening for a new entry
            setMonth(new Date().getMonth());
            setYear(currentYear);
            setCosts({ networking: '', storage: '', compute: '', management: '', marketplace: '' });
        }
    }, [existingEntry, isOpen]);

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (/^\d*\.?\d*$/.test(value)) {
            setCosts(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const totalTTC = useMemo(() => {
        // Fix: Explicitly type the accumulator to prevent type inference issues.
        // Fix: Cast cost to string to handle cases where it might be inferred as 'unknown'.
        return Object.values(costs).reduce((acc: number, cost) => acc + (parseFloat(String(cost)) || 0), 0);
    }, [costs]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const entryData = {
            month,
            year,
            networking: parseFloat(costs.networking) || 0,
            storage: parseFloat(costs.storage) || 0,
            compute: parseFloat(costs.compute) || 0,
            management: parseFloat(costs.management) || 0,
            marketplace: parseFloat(costs.marketplace) || 0,
        };

        if (existingEntry) {
            onSubmit({ ...entryData, id: existingEntry.id });
        } else {
            onSubmit(entryData);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingEntry ? "Modifier une Entrée" : "Ajouter une Entrée"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="month" className="block text-sm font-medium text-storm-grey dark:text-gray-300">Mois</label>
                        <select id="month" value={month} onChange={e => setMonth(parseInt(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-azure focus:border-azure bg-white dark:bg-gray-700">
                            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-storm-grey dark:text-gray-300">Année</label>
                        <select id="year" value={year} onChange={e => setYear(parseInt(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-azure focus:border-azure bg-white dark:bg-gray-700">
                           {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.keys(COST_CATEGORIES).map(key => {
                        const catKey = key as CostCategoryKey;
                        return (
                            <div key={key}>
                                <label htmlFor={key} className="block text-sm font-medium text-storm-grey dark:text-gray-300">{COST_CATEGORIES[catKey].label}</label>
                                <input 
                                    type="text" 
                                    id={key} 
                                    name={key}
                                    value={costs[catKey]}
                                    onChange={handleCostChange}
                                    placeholder="ex: 123.45"
                                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-azure focus:border-azure bg-white dark:bg-gray-700"
                                />
                            </div>
                        )
                    })}
                </div>

                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 text-right">
                    <p className="text-lg font-semibold">Prix TTC : <span className="text-azure dark:text-neon-blue">{totalTTC.toFixed(2)} €</span></p>
                </div>

                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 mr-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Annuler</button>
                    <button type="submit" className="px-4 py-2 bg-azure hover:bg-neon-blue text-white rounded-md">{existingEntry ? 'Mettre à jour' : 'Ajouter'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEntryModal;