import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GestaoChecklistVeiculo from '../GestaoChecklistVeiculo';
import fleetService from '@/services/fleetService';
import checklistConfigService from '@/services/checklistConfigService';

// UI com portal Radix (Dialog/Select) + react-query em jsdom é lenta no primeiro teste
jest.setTimeout(15000);

// ── Mocks de serviços ──
jest.mock('@/services/fleetService', () => ({
    __esModule: true,
    default: { getVehicles: jest.fn() },
}));

jest.mock('@/services/checklistConfigService', () => ({
    __esModule: true,
    default: {
        getForVehicle: jest.fn(),
        getDefaultTemplate: jest.fn(),
        replace: jest.fn(),
        copyToVehicles: jest.fn(),
    },
}));

const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: mockToast }),
}));

// O StandardLayout real exige AuthContext/sidebar; no teste renderiza só os filhos
jest.mock('@/components/StandardLayout', () => ({
    StandardLayout: ({ children }: any) => <div>{children}</div>,
}));

// ── Dados de exemplo ──
const vehicles = [
    {
        id: 'v1', plate: 'ABC-1234', brand: 'Fiat', model: 'Uno', year: 2020,
        color: 'Branco', fuelType: 'GASOLINE', currentMileage: 50000,
        status: 'ACTIVE', capacity: 5,
    },
    {
        id: 'v2', plate: 'XYZ-9876', brand: 'VW', model: 'Gol', year: 2021,
        color: 'Preto', fuelType: 'FLEX', currentMileage: 30000,
        status: 'ACTIVE', capacity: 5,
    },
    {
        id: 'v3', plate: 'JKL-0000', brand: 'Toyota', model: 'Corolla', year: 2022,
        color: 'Prata', fuelType: 'FLEX', currentMileage: 10000,
        status: 'ACTIVE', capacity: 5,
    },
];

const defaultItems = [
    { title: 'Faróis', category: 'iluminacao', required: true, isActive: true },
    { title: 'Pneus', category: 'pneus', required: false, isActive: true },
];

// ── Helpers ──
const createQueryClient = () =>
    new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderPage = () =>
    render(
        <QueryClientProvider client={createQueryClient()}>
            <GestaoChecklistVeiculo />
        </QueryClientProvider>
    );

describe('GestaoChecklistVeiculo – fluxo do diálogo de cópia', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fleetService.getVehicles as jest.Mock).mockResolvedValue(vehicles);
        (checklistConfigService.getForVehicle as jest.Mock).mockResolvedValue(defaultItems);
    });

    it('abre o diálogo de cópia listando os veículos disponíveis', async () => {
        const user = userEvent.setup();
        renderPage();

        const copyButton = await screen.findByRole('button', { name: /copiar para veículos/i });
        await waitFor(() => expect(copyButton).toBeEnabled());
        await user.click(copyButton);

        expect(await screen.findByText(/copiar configuração para veículos/i)).toBeInTheDocument();
        // Todos os veículos aparecem (destino padrão = template global, então nenhum é excluído)
        expect(screen.getByText('ABC-1234')).toBeInTheDocument();
        expect(screen.getByText('XYZ-9876')).toBeInTheDocument();
        expect(screen.getByText('JKL-0000')).toBeInTheDocument();
    });

    it('copia a configuração para os veículos selecionados e exibe o resumo do backend', async () => {
        const user = userEvent.setup();
        (checklistConfigService.copyToVehicles as jest.Mock).mockResolvedValue({
            copied: 2,
            vehicleIds: ['v1', 'v2'],
            itemsCount: 2,
        });

        renderPage();

        const copyButton = await screen.findByRole('button', { name: /copiar para veículos/i });
        await waitFor(() => expect(copyButton).toBeEnabled());
        await user.click(copyButton);

        // Seleciona dois veículos clicando nas linhas
        await user.click(await screen.findByText('ABC-1234'));
        await user.click(screen.getByText('XYZ-9876'));

        // Botão reflete a seleção
        const confirmButton = screen.getByRole('button', { name: /copiar para 2 veículo\(s\)/i });
        expect(confirmButton).toBeEnabled();

        await user.click(confirmButton);

        // Resumo retornado pelo backend é exibido
        expect(await screen.findByText('Configuração copiada!')).toBeInTheDocument();
        expect(screen.getByText('2 itens aplicados em 2 veículo(s)')).toBeInTheDocument();
        // Labels amigáveis dos veículos (placa - marca modelo)
        expect(screen.getByText('ABC-1234 - Fiat Uno')).toBeInTheDocument();
        expect(screen.getByText('XYZ-9876 - VW Gol')).toBeInTheDocument();

        // Uma única chamada em lote com os ids selecionados e os itens válidos
        expect(checklistConfigService.copyToVehicles).toHaveBeenCalledTimes(1);
        expect(checklistConfigService.copyToVehicles).toHaveBeenCalledWith(
            ['v1', 'v2'],
            expect.arrayContaining([
                expect.objectContaining({ title: 'Faróis' }),
                expect.objectContaining({ title: 'Pneus' }),
            ])
        );

        // "Concluir" fecha o diálogo
        await user.click(screen.getByRole('button', { name: /concluir/i }));
        await waitFor(() =>
            expect(screen.queryByText('Configuração copiada!')).not.toBeInTheDocument()
        );
    });

    it('mantém o diálogo aberto sem seleção com o botão de copiar desabilitado', async () => {
        const user = userEvent.setup();
        renderPage();

        const copyButton = await screen.findByRole('button', { name: /copiar para veículos/i });
        await waitFor(() => expect(copyButton).toBeEnabled());
        await user.click(copyButton);

        await screen.findByText(/copiar configuração para veículos/i);

        // Nenhum veículo selecionado → botão desabilitado
        expect(screen.getByRole('button', { name: /copiar para 0 veículo\(s\)/i })).toBeDisabled();
        expect(checklistConfigService.copyToVehicles).not.toHaveBeenCalled();
    });

    it('exibe toast "Nada para copiar" quando não há itens configurados', async () => {
        const user = userEvent.setup();
        (checklistConfigService.getForVehicle as jest.Mock).mockResolvedValue([]);

        renderPage();

        const copyButton = await screen.findByRole('button', { name: /copiar para veículos/i });
        await waitFor(() => expect(copyButton).toBeEnabled());
        await user.click(copyButton);

        expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({ title: 'Nada para copiar' })
        );
        // O diálogo não abre
        expect(screen.queryByText(/copiar configuração para veículos/i)).not.toBeInTheDocument();
    });

    it('mantém o diálogo aberto e exibe toast de erro quando a cópia falha', async () => {
        const user = userEvent.setup();
        (checklistConfigService.copyToVehicles as jest.Mock).mockRejectedValue(
            new Error('Falha no servidor')
        );

        renderPage();

        const copyButton = await screen.findByRole('button', { name: /copiar para veículos/i });
        await waitFor(() => expect(copyButton).toBeEnabled());
        await user.click(copyButton);

        await screen.findByText(/copiar configuração para veículos/i);
        await user.click(screen.getByText('ABC-1234'));

        await user.click(screen.getByRole('button', { name: /copiar para 1 veículo\(s\)/i }));

        // Toast de erro exibido
        await waitFor(() =>
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Erro ao copiar', variant: 'destructive' })
            )
        );

        // O diálogo NÃO fecha nem mostra o resumo: permanece em modo de seleção
        expect(screen.queryByText('Configuração copiada!')).not.toBeInTheDocument();
        expect(screen.getByText(/copiar configuração para veículos/i)).toBeInTheDocument();

        // isCopying foi resetado (no finally, após o catch): aguarda o re-render
        // do React antes de verificar o botão para evitar flakiness de timing
        await waitFor(() =>
            expect(screen.getByRole('button', { name: /copiar para 1 veículo\(s\)/i })).toBeEnabled()
        );
        const retryButton = screen.getByRole('button', { name: /copiar para 1 veículo\(s\)/i });
        expect(retryButton).not.toHaveTextContent(/copiando/i);
    });
});
