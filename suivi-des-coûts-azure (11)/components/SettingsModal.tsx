
import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { Theme } from '../types';
import { db } from '../services/db';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImportSuccess: () => void;
}

const InfoModal: React.FC<{onClose: () => void}> = ({onClose}) => (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
        onClick={onClose}
    >
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Bibliothèques Utilisées</h3>
            <ul className="list-disc list-inside space-y-2">
                <li>React</li>
                <li>Tailwind CSS</li>
                <li>Recharts</li>
            </ul>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-azure text-white rounded hover:bg-neon-blue">Fermer</button>
        </div>
    </div>
);


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
    const [theme, setTheme] = useState<Theme>('system');
    const [isInfoModalOpen, setInfoModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') as Theme | null;
        if(storedTheme) {
            setTheme(storedTheme);
            applyTheme(storedTheme);
        } else {
            applyTheme('system');
        }
    }, []);

    const applyTheme = (t: Theme) => {
        if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTheme = e.target.value as Theme;
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    const handleExport = async () => {
        try {
            const jsonString = await db.exportData();
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `azure_costs_backup_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            alert("L'exportation des données a échoué.");
        }
    };
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const jsonString = event.target?.result as string;
                await db.importData(jsonString);
                alert("Importation réussie !");
                onImportSuccess();
                onClose();
            } catch (error) {
                console.error("Import failed:", error);
                alert("L'importation a échoué. Vérifiez le format du fichier.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <>
        <Modal isOpen={isOpen} onClose={onClose} title="Options">
            <div className="space-y-6">
                <div>
                    <label htmlFor="theme-select" className="block text-sm font-medium text-storm-grey dark:text-gray-300">Thème</label>
                    <select id="theme-select" value={theme} onChange={handleThemeChange} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-azure focus:border-azure bg-white dark:bg-gray-700">
                        <option value="light">Clair</option>
                        <option value="dark">Sombre</option>
                        <option value="system">Système</option>
                    </select>
                </div>
                
                <div className="space-y-2">
                    <h3 className="text-md font-medium text-storm-grey dark:text-gray-300">Gestion des données</h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button onClick={handleExport} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Exporter en JSON</button>
                        <button onClick={handleImportClick} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Importer depuis JSON</button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                    </div>
                </div>

                <div>
                    <button onClick={() => setInfoModalOpen(true)} className="text-sm text-azure hover:underline">
                        Informations sur les bibliothèques (i)
                    </button>
                </div>
            </div>
        </Modal>
        {isInfoModalOpen && <InfoModal onClose={() => setInfoModalOpen(false)} />}
        </>
    );
};

export default SettingsModal;
