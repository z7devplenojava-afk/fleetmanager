import type { ChecklistItem } from '@/types/portaria';

/**
 * Itens padrão do checklist de conferência do veículo.
 * Usado como fallback quando nenhuma configuração foi criada para o veículo
 * e também como base para a configuração no painel do admin.
 */
export const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
    { id: 'doc-1', title: 'CNH', category: 'documentacao', required: true, checked: false },
    { id: 'doc-2', title: 'CRLV', category: 'documentacao', required: true, checked: false },
    { id: 'doc-3', title: 'Documentação do veículo', category: 'documentacao', required: true, checked: false },
    { id: 'pneus-1', title: 'Calibragem', category: 'pneus', required: true, checked: false },
    { id: 'pneus-2', title: 'Desgaste', category: 'pneus', required: true, checked: false },
    { id: 'pneus-3', title: 'Estepe', category: 'pneus', required: false, checked: false },
    { id: 'fluidos-1', title: 'Óleo', category: 'fluidos', required: true, checked: false },
    { id: 'fluidos-2', title: 'Água', category: 'fluidos', required: true, checked: false },
    { id: 'fluidos-3', title: 'Combustível', category: 'fluidos', required: true, checked: false },
    { id: 'freios-1', title: 'Funcionamento dos freios', category: 'freios', required: true, checked: false },
    { id: 'ilum-1', title: 'Faróis', category: 'iluminacao', required: true, checked: false },
    { id: 'ilum-2', title: 'Lanternas e setas', category: 'iluminacao', required: true, checked: false },
    { id: 'limpeza-1', title: 'Interior', category: 'limpeza', required: false, checked: false },
    { id: 'limpeza-2', title: 'Exterior', category: 'limpeza', required: false, checked: false },
    { id: 'outros-1', title: 'Cinto de segurança', category: 'outros', required: true, checked: false },
    { id: 'outros-2', title: 'Espelhos', category: 'outros', required: true, checked: false },
];

export const CATEGORY_LABELS: Record<string, string> = {
    documentacao: 'Documentação',
    pneus: 'Pneus',
    fluidos: 'Óleo/Fluidos',
    freios: 'Freios',
    iluminacao: 'Iluminação',
    limpeza: 'Limpeza',
    outros: 'Outros',
};

/** Converte um item configurado (backend) para o formato de checklist usado na tela. */
export function configToChecklistItem(config: {
    id?: string;
    title: string;
    category: string;
    required?: boolean;
}): ChecklistItem {
    return {
        id: config.id || `cfg-${config.title}-${Math.random().toString(36).slice(2, 8)}`,
        title: config.title,
        category: config.category || 'outros',
        required: !!config.required,
        checked: false,
    };
}

/** Converte os itens padrão para o formato de configuração enviado ao backend. */
export function defaultsToConfig(): {
    title: string;
    category: string;
    required: boolean;
    isActive: boolean;
}[] {
    return DEFAULT_CHECKLIST_ITEMS.map((item) => ({
        title: item.title,
        category: item.category,
        required: item.required,
        isActive: true,
    }));
}
