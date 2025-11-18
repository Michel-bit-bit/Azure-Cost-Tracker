
import React from 'react';

interface FABProps {
    onClick: () => void;
}

const FAB: React.FC<FABProps> = ({ onClick }) => {
    return (
        <button 
            onClick={onClick} 
            className="fixed bottom-6 right-6 bg-azure hover:bg-neon-blue text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl font-bold transition-transform transform hover:scale-110 z-30"
            aria-label="Ajouter une nouvelle entrée"
        >
            +
        </button>
    );
};

export default FAB;
