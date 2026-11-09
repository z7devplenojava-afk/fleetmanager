export interface MaintenanceItemPreset {
    id: string;
    taskName: string;
    category: 'MOTOR' | 'FLUIDOS' | 'FREIOS' | 'SUSPENSAO' | 'PNEUS';
    categoryLabel: string;
    intervalKmUrban: number;
    intervalKmRoad: number;
    intervalDays?: number;
    recommendedNotes: string;
}

export const MAINTENANCE_CATEGORIES = [
    { key: 'ALL', label: 'Todas as Categorias' },
    { key: 'MOTOR', label: 'Motor & Aspiração' },
    { key: 'FLUIDOS', label: 'Fluidos, Arrefecimento & Câmbio' },
    { key: 'FREIOS', label: 'Sistema Pneumático & Freios' },
    { key: 'SUSPENSAO', label: 'Suspensão, Chassi & Transmissão' },
    { key: 'PNEUS', label: 'Pneus & Embreagem' },
];

export const MAINTENANCE_PLAN_PRESETS: MaintenanceItemPreset[] = [
    // 1. Motor & Aspiração
    {
        id: 'oleo_motor',
        taskName: 'Troca de Óleo do Motor',
        category: 'MOTOR',
        categoryLabel: 'Motor & Aspiração',
        intervalKmUrban: 10000,
        intervalKmRoad: 30000,
        intervalDays: 180, // 6 meses
        recommendedNotes: 'Urbano severo: 10.000 a 15.000 km ou 6 meses. Rodoviário: 20.000 a 40.000 km conforme especificação lubrificante.'
    },
    {
        id: 'filtro_oleo',
        taskName: 'Filtro de Óleo do Motor',
        category: 'MOTOR',
        categoryLabel: 'Motor & Aspiração',
        intervalKmUrban: 10000,
        intervalKmRoad: 30000,
        intervalDays: 180,
        recommendedNotes: 'Trocado obrigatoriamente a cada troca de óleo (10.000 a 40.000 km).'
    },
    {
        id: 'filtro_combustivel',
        taskName: 'Filtro de Combustível (Principal e Separador Racor)',
        category: 'MOTOR',
        categoryLabel: 'Motor & Aspiração',
        intervalKmUrban: 15000,
        intervalKmRoad: 20000,
        intervalDays: 180,
        recommendedNotes: 'A cada 10.000 a 20.000 km. Drenagem diária de água da bacia decantadora.'
    },
    {
        id: 'filtro_ar',
        taskName: 'Filtro de Ar do Motor',
        category: 'MOTOR',
        categoryLabel: 'Motor & Aspiração',
        intervalKmUrban: 25000,
        intervalKmRoad: 40000,
        intervalDays: 365,
        recommendedNotes: 'A cada 20.000 a 40.000 km (ou antes, se indicado pelo vacuômetro do painel).'
    },
    {
        id: 'correias_acessorios',
        taskName: 'Correias de Acessórios (Alternador, Ventoinha, A/C)',
        category: 'MOTOR',
        categoryLabel: 'Motor & Aspiração',
        intervalKmUrban: 60000,
        intervalKmRoad: 80000,
        intervalDays: 730, // 2 anos
        recommendedNotes: 'Verificação a cada 20.000 km e troca entre 60.000 e 80.000 km (ou a cada 2 anos).'
    },

    // 2. Fluidos, Arrefecimento e Câmbio
    {
        id: 'liquido_arrefecimento',
        taskName: 'Líquido de Arrefecimento (Aditivo + Água Desmineralizada)',
        category: 'FLUIDOS',
        categoryLabel: 'Fluidos, Arrefecimento & Câmbio',
        intervalKmUrban: 80000,
        intervalKmRoad: 100000,
        intervalDays: 365, // 1 ano
        recommendedNotes: 'A cada 80.000 a 100.000 km ou a cada 1 a 2 anos.'
    },
    {
        id: 'oleo_cambio',
        taskName: 'Óleo do Câmbio (Manual / Automatizado)',
        category: 'FLUIDOS',
        categoryLabel: 'Fluidos, Arrefecimento & Câmbio',
        intervalKmUrban: 80000,
        intervalKmRoad: 120000,
        intervalDays: 730,
        recommendedNotes: 'Troca entre 60.000 e 120.000 km conforme recomendação da montadora.'
    },
    {
        id: 'oleo_diferencial',
        taskName: 'Óleo do Diferencial (Eixo Traseiro)',
        category: 'FLUIDOS',
        categoryLabel: 'Fluidos, Arrefecimento & Câmbio',
        intervalKmUrban: 60000,
        intervalKmRoad: 90000,
        intervalDays: 730,
        recommendedNotes: 'Troca entre 60.000 e 90.000 km.'
    },
    {
        id: 'fluido_direcao_embreagem',
        taskName: 'Fluido de Embreagem e Direção Hidráulica',
        category: 'FLUIDOS',
        categoryLabel: 'Fluidos, Arrefecimento & Câmbio',
        intervalKmUrban: 80000,
        intervalKmRoad: 80000,
        intervalDays: 365,
        recommendedNotes: 'Inspeção a cada 20.000 km e substituição a cada 80.000 km.'
    },

    // 3. Sistema Pneumático (Ar) e Freios
    {
        id: 'filtro_secador_ar',
        taskName: 'Filtro Secador de Ar (Coalescente / APU)',
        category: 'FREIOS',
        categoryLabel: 'Sistema Pneumático & Freios',
        intervalKmUrban: 60000,
        intervalKmRoad: 80000,
        intervalDays: 365, // 1 ano
        recommendedNotes: 'A cada 50.000 a 80.000 km ou 1 vez ao ano (evita água no circuito de ar das válvulas e freios).'
    },
    {
        id: 'lonas_pastilhas_freio',
        taskName: 'Lonas ou Pastilhas de Freio',
        category: 'FREIOS',
        categoryLabel: 'Sistema Pneumático & Freios',
        intervalKmUrban: 40000,
        intervalKmRoad: 80000,
        recommendedNotes: 'Urbano: inspeção frequente e troca média de 30.000 a 50.000 km. Rodoviário: 60.000 a 100.000 km.'
    },
    {
        id: 'tambores_discos_freio',
        taskName: 'Tambores e Discos de Freio',
        category: 'FREIOS',
        categoryLabel: 'Sistema Pneumático & Freios',
        intervalKmUrban: 100000,
        intervalKmRoad: 150000,
        recommendedNotes: 'Retífica ou substituição entre 100.000 e 150.000 km ao atingir espessura mínima tolerada.'
    },

    // 4. Suspensão, Chassi e Transmissão
    {
        id: 'engraxamento_pinos_cardan',
        taskName: 'Engraxamento de Pinos Mestres, Cruzetas e Cardan',
        category: 'SUSPENSAO',
        categoryLabel: 'Suspensão, Chassi & Transmissão',
        intervalKmUrban: 5000,
        intervalKmRoad: 10000,
        intervalDays: 60,
        recommendedNotes: 'Lubrificação preventiva a cada 5.000 a 10.000 km.'
    },
    {
        id: 'graxa_retentores_cubos',
        taskName: 'Graxa e Retentores dos Cubos de Roda',
        category: 'SUSPENSAO',
        categoryLabel: 'Suspensão, Chassi & Transmissão',
        intervalKmUrban: 80000,
        intervalKmRoad: 90000,
        intervalDays: 365,
        recommendedNotes: 'Troca da graxa e inspeção dos rolamentos a cada 80.000 a 90.000 km.'
    },
    {
        id: 'bolsas_ar_suspensao',
        taskName: 'Bolsas de Ar da Suspensão Pneumática',
        category: 'SUSPENSAO',
        categoryLabel: 'Suspensão, Chassi & Transmissão',
        intervalKmUrban: 160000,
        intervalKmRoad: 200000,
        intervalDays: 730,
        recommendedNotes: 'Inspeção visual mensal; troca preventiva entre 150.000 e 200.000 km ou primeiros sinais de ressecamento.'
    },
    {
        id: 'amortecedores',
        taskName: 'Amortecedores (Teste de Ação e Substituição)',
        category: 'SUSPENSAO',
        categoryLabel: 'Suspensão, Chassi & Transmissão',
        intervalKmUrban: 80000,
        intervalKmRoad: 120000,
        intervalDays: 365,
        recommendedNotes: 'Teste de ação a cada 40.000 km e substituição preventiva entre 80.000 e 120.000 km.'
    },

    // 5. Pneus e Embreagem
    {
        id: 'alinhamento_balanceamento',
        taskName: 'Alinhamento e Balanceamento',
        category: 'PNEUS',
        categoryLabel: 'Pneus & Embreagem',
        intervalKmUrban: 10000,
        intervalKmRoad: 10000,
        intervalDays: 90,
        recommendedNotes: 'A cada 10.000 km ou em cada troca/rodízio.'
    },
    {
        id: 'rodizio_pneus',
        taskName: 'Rodízio de Pneus',
        category: 'PNEUS',
        categoryLabel: 'Pneus & Embreagem',
        intervalKmUrban: 10000,
        intervalKmRoad: 15000,
        intervalDays: 90,
        recommendedNotes: 'A cada 10.000 a 15.000 km para desgaste uniforme dos eixos.'
    },
    {
        id: 'vida_util_pneus',
        taskName: 'Pneus (Troca ou Recapagem de Banda)',
        category: 'PNEUS',
        categoryLabel: 'Pneus & Embreagem',
        intervalKmUrban: 50000,
        intervalKmRoad: 80000,
        recommendedNotes: 'Troca ou recapagem entre 50.000 e 80.000 km conforme rota e calibragem correta.'
    },
    {
        id: 'kit_embreagem',
        taskName: 'Kit de Embreagem (Disco, Platô e Colar)',
        category: 'PNEUS',
        categoryLabel: 'Pneus & Embreagem',
        intervalKmUrban: 100000,
        intervalKmRoad: 200000,
        recommendedNotes: 'Urbano: média de 80.000 a 120.000 km. Rodoviário: pode ultrapassar 200.000 km.'
    }
];

