
export interface CostComponents {
    networking: number;
    storage: number;
    compute: number;
    management: number;
    marketplace: number;
}

export interface CostEntry extends CostComponents {
    id?: number;
    month: number;
    year: number;
    totalTTC?: number;
}

export type Theme = 'light' | 'dark' | 'system';