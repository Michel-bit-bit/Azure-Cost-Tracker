
export const MONTHS = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export const INPUT_COST_CATEGORIES = {
    networking: { label: "Networking", color: "#3B82F6" },
    storage: { label: "Storage", color: "#10B981" },
    compute: { label: "Compute", color: "#F59E0B" },
    management: { label: "Management", color: "#EF4444" },
    marketplace: { label: "Marketplace", color: "#8B5CF6" },
};

export type CostCategoryKey = keyof typeof INPUT_COST_CATEGORIES;

export const ALL_COST_CATEGORIES = {
    ...INPUT_COST_CATEGORIES,
    autre: { label: "Autre", color: "#A0AEC0" },
};
