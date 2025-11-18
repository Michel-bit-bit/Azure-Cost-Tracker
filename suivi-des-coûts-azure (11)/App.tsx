
import React, { useState, useEffect, useCallback } from 'react';
// Fix: Import CostEntry from './types'
import { CostEntry } from './types';
import { db } from './services/db';
import Header from './components/Header';
import FAB from './components/FAB';
import AddEntryModal from './components/AddEntryModal';
import SettingsModal from './components/SettingsModal';
import ComparisonView from './components/ComparisonView';
import EntriesList from './components/EntriesList';
import AnnualReview from './components/AnnualReview';

const App: React.FC = () => {
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [entries, setEntries] = useState<CostEntry[]>([]);
    const [editingEntry, setEditingEntry] = useState<CostEntry | null>(null);

    const refreshEntries = useCallback(async () => {
        const allEntries = await db.getAllEntries();
        allEntries.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });
        setEntries(allEntries);
    }, []);

    useEffect(() => {
        refreshEntries();
    }, [refreshEntries]);
    
    const handleAddOrUpdateEntry = async (entry: Omit<CostEntry, 'id'> | CostEntry) => {
        if ('id' in entry) {
            await db.updateEntry(entry);
        } else {
            await db.addEntry(entry);
        }
        await refreshEntries();
        setAddModalOpen(false);
        setEditingEntry(null);
    };

    const handleEdit = (entry: CostEntry) => {
        setEditingEntry(entry);
        setAddModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) {
            await db.deleteEntry(id);
            await refreshEntries();
        }
    };
    
    const openAddModal = () => {
        setEditingEntry(null);
        setAddModalOpen(true);
    }
    
    const closeAddModal = () => {
        setAddModalOpen(false);
        setEditingEntry(null);
    }

    return (
        <div className="min-h-screen font-sans">
            <Header onSettingsClick={() => setSettingsModalOpen(true)} />
            <main className="p-4 md:p-8 space-y-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-2/5">
                        <ComparisonView entries={entries} />
                    </div>
                    <div className="lg:w-3/5">
                        <EntriesList entries={entries} onEdit={handleEdit} onDelete={handleDelete} />
                    </div>
                </div>
                <div>
                    <AnnualReview entries={entries} />
                </div>
            </main>
            <FAB onClick={openAddModal} />
            
            <AddEntryModal 
                isOpen={isAddModalOpen} 
                onClose={closeAddModal} 
                onSubmit={handleAddOrUpdateEntry}
                existingEntry={editingEntry}
            />

            <SettingsModal 
                isOpen={isSettingsModalOpen} 
                onClose={() => setSettingsModalOpen(false)}
                onImportSuccess={refreshEntries}
            />
        </div>
    );
};

export default App;