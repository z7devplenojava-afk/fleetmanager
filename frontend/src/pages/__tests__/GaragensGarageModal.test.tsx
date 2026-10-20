import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Garagens } from '../Garagens';
import { garageService } from '@/services/garageService';

// Layout pesado (nav/auth) — desnecessário para testar o modal de cadastro
jest.mock('@/components/StandardLayout', () => ({
  StandardLayout: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

// Mapa real (Leaflet) não roda bem no jsdom — substituído por um preview simples
jest.mock('@/components/ui/MapWithPin', () => ({
  __esModule: true,
  default: (props: { latitude?: number; longitude?: number }) => (
    <div data-testid="map-preview" data-lat={props.latitude} data-lng={props.longitude} />
  ),
}));

jest.mock('@/services/garageService', () => ({
  garageService: {
    list: jest.fn().mockResolvedValue([]),
    occupancyDashboard: jest.fn().mockResolvedValue(null),
    listActiveStays: jest.fn().mockResolvedValue([]),
    listMovements: jest.fn().mockResolvedValue([]),
    seed: jest.fn().mockResolvedValue('ok'),
    create: jest.fn().mockResolvedValue({ id: 'g1' }),
    update: jest.fn().mockResolvedValue({ id: 'g1' }),
    delete: jest.fn().mockResolvedValue(undefined),
  },
  MOVEMENT_REASON_LABELS: {},
}));

jest.mock('@/services/employeeService', () => ({
  employeeService: {
    getAllEmployees: jest.fn().mockResolvedValue([
      {
        id: 'e1',
        name: 'EDIVAINE DIONISIO DA SILVA',
        positionDescription: 'AUXILIAR ADMINISTRATIVO',
        registrationNumber: '1001',
        phone: '(11) 99999-0001',
      },
      {
        id: 'e2',
        name: 'MARIA APARECIDA SOUZA',
        positionDescription: 'ENCARREGADA',
        registrationNumber: '1002',
        phone: '(11) 99999-0002',
      },
    ]),
  },
}));

jest.mock('@/services/fleetService', () => ({
  __esModule: true,
  default: { getVehicles: jest.fn().mockResolvedValue([]) },
}));

jest.mock('@/components/frota/QRCodeScanner', () => ({
  QRCodeScanner: () => null,
}));
jest.mock('@/components/frota/VehicleQRCodeModal', () => ({
  VehicleQRCodeModal: () => null,
}));
jest.mock('@/components/operacao/OperacaoDoDiaDashboard', () => ({
  OperacaoDoDiaDashboard: () => null,
}));

const openGarageModal = async () => {
  fireEvent.click(screen.getByRole('button', { name: /Nova Garagem/ }));
  await screen.findByText('Nova Garagem / Pátio');
};

describe('Cadastro de Garagem (modal)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(async (input: RequestInfo | URL): Promise<Response> => {
      const href = String(input);
      if (href.includes('viacep.com.br')) {
        return {
          json: async () => ({
            logradouro: 'Rua das Flores',
            bairro: 'Centro',
            localidade: 'Paulínia',
            uf: 'SP',
          }),
        } as unknown as Response;
      }
      if (href.includes('nominatim.openstreetmap.org')) {
        return {
          json: async () => [{ lat: '-22.760834', lon: '-47.155278' }],
        } as unknown as Response;
      }
      throw new Error(`Fetch inesperado no teste: ${href}`);
    }) as unknown as typeof global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('preenche o endereço automaticamente ao digitar o CEP e exibe o mapa com o pino', async () => {
    render(<Garagens />);
    await openGarageModal();

    const cepInput = screen.getByPlaceholderText('CEP (00000-000)');
    fireEvent.change(cepInput, { target: { value: '13140000' } });

    // Máscara aplicada enquanto digita
    await waitFor(() => expect(cepInput).toHaveValue('13140-000'));

    // Campos preenchidos pelo ViaCEP
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Rua / Avenida')).toHaveValue('Rua das Flores')
    );
    expect(screen.getByPlaceholderText('Bairro')).toHaveValue('Centro');
    expect(screen.getByPlaceholderText('Cidade')).toHaveValue('Paulínia');
    expect(screen.getByPlaceholderText('UF')).toHaveValue('SP');
    expect(global.fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/13140000/json/');

    // Mapa da localização exibido com o pino (geocodificação do CEP)
    const map = await screen.findByTestId('map-preview');
    expect(map).toHaveAttribute('data-lat', '-22.760834');
    expect(map).toHaveAttribute('data-lng', '-47.155278');
    expect(screen.getByText(/Localização da Garagem/)).toBeInTheDocument();
  });

  it('busca o responsável na base de funcionários após 3 caracteres e salva a garagem', async () => {
    render(<Garagens />);
    await openGarageModal();

    // Nome da garagem
    fireEvent.change(screen.getByPlaceholderText('Ex.: Pátio Central - Paulínia'), {
      target: { value: 'Garagem Teste' },
    });

    // Responsável: busca na base só começa com 3 caracteres
    const responsavel = screen.getByPlaceholderText('Digite 3 letras do nome do responsável...');
    fireEvent.focus(responsavel);
    fireEvent.change(responsavel, { target: { value: 'EDI' } });

    await screen.findByText('EDIVAINE DIONISIO DA SILVA');
    expect(screen.queryByText('MARIA APARECIDA SOUZA')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('EDIVAINE DIONISIO DA SILVA'));

    // Resumo do responsável selecionado
    expect(
      screen.getByText(/AUXILIAR ADMINISTRATIVO/)
    ).toBeInTheDocument();

    // CEP + número para compor o endereço completo
    fireEvent.change(screen.getByPlaceholderText('CEP (00000-000)'), {
      target: { value: '13140000' },
    });
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Rua / Avenida')).toHaveValue('Rua das Flores')
    );
    fireEvent.change(screen.getByPlaceholderText('Número'), { target: { value: '123' } });

    fireEvent.click(screen.getByText('Cadastrar Garagem'));

    await waitFor(() =>
      expect(garageService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Garagem Teste',
          address: 'Rua das Flores, 123, Centro, Paulínia - SP - CEP 13140-000',
          responsibleEmployeeId: 'e1',
          responsibleName: 'EDIVAINE DIONISIO DA SILVA',
          responsiblePhone: '(11) 99999-0001',
        })
      )
    );
  });
});
