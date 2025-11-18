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
const startYear = 2020;
const endYear = 2050;
const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);

const AddEntryModal: React.FC<AddEntryModalProps> = ({ isOpen, onClose, onSubmit, existingEntry }) => {
    const [month, setMonth] = useState<number>(new Date().getMonth());
    const [year, setYear] = useState<number>(currentYear);
    const [costs, setCosts] = useState({
        networking: '', storage: '', compute: '', management: '', marketplace: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (existingEntry) {
                setMonth(existingEntry.month);
                setYear(existingEntry.year);
                setCosts({
                    networking: String(existingEntry.networking || ''),
                    storage: String(existingEntry.storage || ''),
                    compute: String(existingEntry.compute || ''),
                    management: String(existingEntry.management || ''),
                    marketplace: String(existingEntry.marketplace || '')
                });
            } else {
                setMonth(new Date().getMonth());
                setYear(currentYear);
                setCosts({
                    networking: '', storage: '', compute: '', management: '', marketplace: ''
                });
            }
        }
    }, [existingEntry, isOpen]);

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Allow only numbers and a single decimal point/comma
        if (/^[\d.,]*$/.test(value)) {
            setCosts(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const totalCost = useMemo(() => {
        return (Object.values(costs) as string[]).reduce((sum, value) => sum + (parseFloat(value.replace(',', '.')) || 0), 0);
    }, [costs]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const finalCosts: { [key in CostCategoryKey]: number } = {
            networking: parseFloat(costs.networking.replace(',', '.')) || 0,
            storage: parseFloat(costs.storage.replace(',', '.')) || 0,
            compute: parseFloat(costs.compute.replace(',', '.')) || 0,
            management: parseFloat(costs.management.replace(',', '.')) || 0,
            marketplace: parseFloat(costs.marketplace.replace(',', '.')) || 0,
        };

        const entryToSubmit = {
            ...finalCosts,
            month,
            year,
        };
        
        if (existingEntry) {
            onSubmit({ ...entryToSubmit, id: existingEntry.id });
        } else {
            onSubmit(entryToSubmit);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingEntry ? "Modifier l'entrée" : "Ajouter une entrée"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="month-select" className="block text-sm font-medium text-storm-grey dark:text-gray-300">Mois</label>
                        <select id="month-select" value={month} onChange={e => setMonth(Number(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700">
                            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="year-select" className="block text-sm font-medium text-storm-grey dark:text-gray-300">Année</label>
                        <select id="year-select" value={year} onChange={e => setYear(Number(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
                <hr className="dark:border-gray-600" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(Object.keys(COST_CATEGORIES) as CostCategoryKey[]).map(key => (
                        <div key={key}>
                            <label htmlFor={key} className="block text-sm font-medium text-storm-grey dark:text-gray-300">{COST_CATEGORIES[key].label}</label>
                            <input
                                type="text"
                                id={key}
                                name={key}
                                inputMode="decimal"
                                value={costs[key]}
                                onChange={handleCostChange}
                                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700"
                                placeholder="0.00"
                            />
                        </div>
                    ))}
                </div>
                <div className="text-right font-semibold text-bunker dark:text-link-water mt-4">
                    Somme des catégories: {totalCost.toFixed(2)} €
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Annuler</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-azure text-white hover:bg-neon-blue transition-colors">
                        {existingEntry ? 'Mettre à jour' : 'Ajouter'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEntryModal;
