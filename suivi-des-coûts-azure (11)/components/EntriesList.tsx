
import React, { useState, useMemo } from 'react';
import { CostEntry } from '../types';
import { MONTHS } from '../constants';

interface EntriesListProps {
    entries: CostEntry[];
    onEdit: (entry: CostEntry) => void;
    onDelete: (id: number) => void;
}

const EntriesList: React.FC<EntriesListProps> = ({ entries, onEdit, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const filteredAndSortedEntries = useMemo(() => {
        let filtered = entries.filter(entry => {
            const entryText = `${MONTHS[entry.month]} ${entry.year}`.toLowerCase();
            return entryText.includes(searchTerm.toLowerCase());
        });

        return filtered.sort((a, b) => {
            const dateA = new Date(a.year, a.month).getTime();
            const dateB = new Date(b.year, b.month).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }, [entries, searchTerm, sortOrder]);

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };
    
    const calculateTotal = (entry: CostEntry) => {
        return entry.networking + entry.storage + entry.compute + entry.management + entry.marketplace;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md h-full flex flex-col min-h-[600px]">
            <h2 className="text-xl font-bold mb-4 text-bunker dark:text-link-water">Liste des Entrées</h2>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Rechercher (ex: Janvier 2023)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
                <button onClick={toggleSortOrder} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
                    Trier par date {sortOrder === 'desc' ? '↓' : '↑'}
                </button>
            </div>
            <div className="overflow-y-auto flex-grow">
                {filteredAndSortedEntries.length > 0 ? (
                    <ul className="space-y-3">
                        {filteredAndSortedEntries.map(entry => (
                            <li key={entry.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <div>
                                    <p className="font-semibold text-bunker dark:text-link-water">{MONTHS[entry.month]} {entry.year}</p>
                                    <p className="text-sm text-comet dark:text-storm-grey">Total: {calculateTotal(entry).toFixed(2)} €</p>
                                </div>
                                <div className="flex gap-2 self-end sm:self-center">
                                    <button onClick={() => onEdit(entry)} className="p-2 text-blue-600 hover:text-blue-800" aria-label="Modifier">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button onClick={() => onDelete(entry.id!)} className="p-2 text-red-600 hover:text-red-800" aria-label="Supprimer">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-comet dark:text-storm-grey mt-8">Aucune entrée trouvée.</p>
                )}
            </div>
        </div>
    );
};

export default EntriesList;