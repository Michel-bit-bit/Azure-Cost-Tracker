import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { CostEntry } from '../types';
import { MONTHS, INPUT_COST_CATEGORIES, CostCategoryKey } from '../constants';

interface AddEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (entry: Omit<CostEntry, 'id'> | CostEntry) => void;
    existingEntry: CostEntry | null;
}

const currentYear = new Date().getFullYear();
const endYear = 2050;
const startYear = 2020;
const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i);
const TAX_RATE = 1.20;

const AddEntryModal: React.FC<AddEntryModalProps> = ({ isOpen, onClose, onSubmit, existingEntry }) => {
    const [month, setMonth] = useState<number>(new Date().getMonth());
    const [year, setYear] = useState<number>(currentYear);
    const [costs, setCosts] = useState({
        networking: '', storage: '', compute: '', management: '', marketplace: ''
    });
    const [totalTTC, setTotalTTC] = useState('');
    const [isHT, setIsHT] = useState(false);

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
                setTotalTTC(String(existingEntry.totalTTC || ''));
                setIsHT(false); // Réinitialiser, car les valeurs stockées sont toujours TTC
            } else {
                setMonth(new Date().getMonth());
                setYear(currentYear);
                setCosts({
                    networking: '', storage: '', compute: '', management: '', marketplace: ''
                });
                setTotalTTC('');
                setIsHT(false);
            }
        }
    }, [existingEntry, isOpen]);

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (/^[\d.,]*$/.test(value)) {
            setCosts(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleTotalTTCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        if (/^[\d.,]*$/.test(value)) {
            setTotalTTC(value);
        }
    };

    const calculatedSum = useMemo(() => {
        const sumOfParts = (Object.values(costs) as string[]).reduce((sum, value) => sum + (parseFloat(value.replace(',', '.')) || 0), 0);
        return isHT ? sumOfParts * TAX_RATE : sumOfParts;
    }, [costs, isHT]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const parsedCosts = (Object.keys(INPUT_COST_CATEGORIES) as CostCategoryKey[]).reduce((acc, key) => {
            acc[key] = parseFloat(costs[key].replace(',', '.')) || 0;
            return acc;
        }, {} as { [key in CostCategoryKey]: number });
        
        const sumOfParts = Object.values(parsedCosts).reduce((sum, v) => sum + v, 0);
        const parsedTotalTTC = parseFloat(totalTTC.replace(',', '.')) || 0;

        let finalCosts: { [key in CostCategoryKey]: number };
        let finalTotalTTC: number;

        if (isHT) {
            finalCosts = {
                networking: parsedCosts.networking * TAX_RATE,
                storage: parsedCosts.storage * TAX_RATE,
                compute: parsedCosts.compute * TAX_RATE,
                management: parsedCosts.management * TAX_RATE,
                marketplace: parsedCosts.marketplace * TAX_RATE,
            };
            // Le total est calculé à partir de la somme des parties HT, l'entrée manuelle est ignorée.
            finalTotalTTC = sumOfParts * TAX_RATE;
        } else {
            finalCosts = parsedCosts;
            // Si pas HT, le total manuel a la priorité, sinon c'est la somme des parties.
            finalTotalTTC = parsedTotalTTC > 0 ? parsedTotalTTC : sumOfParts;
        }

        const entryToSubmit = {
            ...finalCosts,
            month,
            year,
            totalTTC: finalTotalTTC,
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
                    {(Object.keys(INPUT_COST_CATEGORIES) as CostCategoryKey[]).map(key => (
                        <div key={key}>
                            <label htmlFor={key} className="block text-sm font-medium text-storm-grey dark:text-gray-300">{INPUT_COST_CATEGORIES[key].label}</label>
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
                
                <hr className="dark:border-gray-600 my-4" />

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="isHT" 
                            checked={isHT} 
                            onChange={(e) => setIsHT(e.target.checked)} 
                            className="h-4 w-4 rounded border-gray-300 text-azure focus:ring-azure"
                        />
                        <label htmlFor="isHT" className="text-sm font-medium text-storm-grey dark:text-gray-300 cursor-pointer">
                            Les montants des catégories sont en HT (TVA 20% sera appliquée)
                        </label>
                    </div>
                    <div>
                        <label htmlFor="totalTTC" className="block text-sm font-medium text-storm-grey dark:text-gray-300">Prix TTC (optionnel, calculé si vide)</label>
                        <input
                            type="text"
                            id="totalTTC"
                            name="totalTTC"
                            inputMode="decimal"
                            value={totalTTC}
                            onChange={handleTotalTTCChange}
                            className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 disabled:bg-gray-200 dark:disabled:bg-gray-600"
                            placeholder={isHT ? calculatedSum.toFixed(2) : "0.00"}
                            disabled={isHT}
                        />
                    </div>
                </div>

                <div className="text-right font-semibold text-bunker dark:text-link-water mt-4">
                    Somme des catégories ({isHT ? 'TTC calculé' : 'TTC'}): {calculatedSum.toFixed(2)} €
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
