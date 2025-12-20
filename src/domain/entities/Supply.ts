/**
 * Domain Entity: Supply (Insumo)
 * 
 * Represents an inventory item.
 * Maps to 'insumo' table.
 */

export interface SupplyProps {
    id: number;
    code: string;
    name: string;
    description?: string;
    unit: string;
    category: string;
    isActive: boolean;
    currentStock?: number; // Calculated/Aggregated from Stock table
}

export class Supply {
    private props: SupplyProps;

    constructor(props: SupplyProps) {
        this.props = props;
    }

    get id(): number { return this.props.id; }
    get name(): string { return this.props.name; }
    get code(): string { return this.props.code; }
    get stock(): number { return this.props.currentStock || 0; }

    toJSON() { return { ...this.props }; }
}
