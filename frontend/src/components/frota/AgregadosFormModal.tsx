import React, { useState, useEffect } from 'react';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { UserCheck, DollarSign, FileText, Phone, Mail, Calendar, AlertTriangle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import fleetService from '@/services/fleetService';
import { Vehicle, AggregatedPaymentType } from '@/types/fleet';

interface AgregadosFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  vehicle?: Vehicle | null; // Veículo para edição (se null,SelectionMode = nova seleção)
  vehicles: Vehicle[]; // Lista de veículos disponíveis para seleção
}

const PAYMENT_TYPE_OPTIONS: { value: AggregatedPaymentType; label: string; icon: string }[] = [
  { value: 'DAILY', label: 'Diário', icon: '📅' },
  { value: 'MONTHLY', label: 'Mensal', icon: '📆' },
  { value: 'PER_TRIP', label: 'Por Viagem', icon: '🚌' },
  { value: 'PERCENTAGE', label: 'Percentual sobre Faturamento', icon: '📊' },
];

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  BUS_ROAD: '🚌 Ônibus Rodoviário',
  BUS_LUXURY_TOURISM: '🚌✨ Luxo Turismo',
  BUS_URBAN: '🏙️ Ônibus Urbano',
  MINIBUS: '🚐 Micro-ônibus',
  VAN: '🚐 Van',
  CAR_UTILITY: '🚗 Utilitário',
  CAR: '🚗 Carro',
  TRUCK: '🚛 Caminhão',
  MOTORCYCLE: '🏍️ Moto',
  PICKUP: '🛻 Pickup',
  SUV: '🚙 SUV',
  OTHER: '❓ Outro',
};

interface AgregadoFormData {
  vehicleId: string;
  // Proprietário
  aggregatedOwnerName: string;
  aggregatedOwnerCpfCnpj: string;
  aggregatedOwnerPhone: string;
  aggregatedOwnerEmail: string;
  // Pagamento
  aggregatedPaymentType: AggregatedPaymentType | '';
  aggregatedDailyRate: number;
  aggregatedMonthlyRate: number;
  // Contrato
  aggregatedContractStartDate: string;
  aggregatedContractEndDate: string;
  aggregatedNotes: string;
}

const INITIAL_FORM_DATA: AgregadoFormData = {
  vehicleId: '',
  aggregatedOwnerName: '',
  aggregatedOwnerCpfCnpj: '',
  aggregatedOwnerPhone: '',
  aggregatedOwnerEmail: '',
  aggregatedPaymentType: '',
  aggregatedDailyRate: 0,
  aggregatedMonthlyRate: 0,
  aggregatedContractStartDate: '',
  aggregatedContractEndDate: '',
  aggregatedNotes: '',
};

const AgregadosFormModal: React.FC<AgregadosFormModalProps> = ({
  isOpen,
  onOpenChange,
  onSuccess,
  vehicle,
  vehicles,
}) => {
  const [formData, setFormData] = useState<AgregadoFormData>(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const { toast } = useToast();

  const isEditing = !!vehicle;

  // Load existing aggregated data when editing
  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicleId: vehicle.id.toString(),
        aggregatedOwnerName: vehicle.aggregatedOwnerName || '',
        aggregatedOwnerCpfCnpj: vehicle.aggregatedOwnerCpfCnpj || '',
        aggregatedOwnerPhone: vehicle.aggregatedOwnerPhone || '',
        aggregatedOwnerEmail: vehicle.aggregatedOwnerEmail || '',
        aggregatedPaymentType: vehicle.aggregatedPaymentType || '',
        aggregatedDailyRate: vehicle.aggregatedDailyRate || 0,
        aggregatedMonthlyRate: vehicle.aggregatedMonthlyRate || 0,
        aggregatedContractStartDate: vehicle.aggregatedContractStartDate || '',
        aggregatedContractEndDate: vehicle.aggregatedContractEndDate || '',
        aggregatedNotes: vehicle.aggregatedNotes || '',
      });
    } else {
      setFormData({ ...INITIAL_FORM_DATA });
    }
    setVehicleSearch('');
    setShowVehiclePicker(false);
  }, [vehicle, isOpen]);

  const handleInputChange = (field: keyof AgregadoFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Filter vehicles for picker (only show vehicles that are NOT yet aggregated, or the current one being edited)
  const availableVehicles = vehicles.filter((v) => {
    if (isEditing && v.id === vehicle?.id) return true;
    if (v.isAggregated) return false;
    if (vehicleSearch) {
      const searchLower = vehicleSearch.toLowerCase();
      return (
        v.plate.toLowerCase().includes(searchLower) ||
        v.brand.toLowerCase().includes(searchLower) ||
        v.model.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const selectedVehicle = vehicles.find((v) => v.id.toString() === formData.vehicleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicleId) {
      toast({
        title: 'Selecione o veículo',
        description: 'Escolha um veículo para vincular como agregado.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.aggregatedOwnerName.trim()) {
      toast({
        title: 'Nome do proprietário obrigatório',
        description: 'Preencha o nome do proprietário do veículo.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const updateData: Partial<Vehicle> = {
        isAggregated: true,
        aggregatedOwnerName: formData.aggregatedOwnerName,
        aggregatedOwnerCpfCnpj: formData.aggregatedOwnerCpfCnpj,
        aggregatedOwnerPhone: formData.aggregatedOwnerPhone,
        aggregatedOwnerEmail: formData.aggregatedOwnerEmail,
        aggregatedPaymentType: (formData.aggregatedPaymentType as AggregatedPaymentType) || undefined,
        aggregatedDailyRate: formData.aggregatedDailyRate || undefined,
        aggregatedMonthlyRate: formData.aggregatedMonthlyRate || undefined,
        aggregatedContractStartDate: formData.aggregatedContractStartDate || undefined,
        aggregatedContractEndDate: formData.aggregatedContractEndDate || undefined,
        aggregatedNotes: formData.aggregatedNotes || undefined,
      };

      await fleetService.updateVehicle(formData.vehicleId, updateData);

      toast({
        title: 'Sucesso',
        description: `Veículo ${isEditing ? 'atualizado' : 'vinculado como agregado'} com sucesso.`,
        variant: 'default',
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        `Não foi possível ${isEditing ? 'atualizar' : 'criar'} o agregado.`;
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        className="flex-1 sm:flex-none h-10 sm:h-11 border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="agregado-form"
        disabled={isLoading}
        className="flex-1 sm:flex-none h-10 sm:h-11 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
      >
        {isLoading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Vincular Agregado'}
      </Button>
    </div>
  );

  const renderForm = () => (
    <form id="agregado-form" onSubmit={handleSubmit} className="space-y-6 text-left">
      {/* Vehicle Selection */}
      {!isEditing && (
        <div className="space-y-2">
          <Label className="text-seguranca-lightgray flex items-center gap-2">
            Veículo <span className="text-red-400">*</span>
          </Label>
          {!selectedVehicle ? (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowVehiclePicker(!showVehiclePicker)}
                className="w-full justify-start border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite border-dashed"
              >
                <Search className="h-4 w-4 mr-2" />
                Clique para selecionar um veículo
              </Button>
              {showVehiclePicker && (
                <div className="border border-gray-600 rounded-lg bg-seguranca-black max-h-64 overflow-y-auto">
                  <div className="p-2 border-b border-gray-600">
                    <Input
                      placeholder="Buscar por placa, marca ou modelo..."
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="divide-y divide-gray-700">
                    {availableVehicles.length === 0 ? (
                      <div className="p-4 text-center text-gray-400 text-sm">
                        Nenhum veículo disponível
                      </div>
                    ) : (
                      availableVehicles.slice(0, 20).map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            handleInputChange('vehicleId', v.id.toString());
                            setShowVehiclePicker(false);
                            setVehicleSearch('');
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-seguranca-graphite transition-colors flex items-center gap-3"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium text-seguranca-lightgray">
                              {v.plate}
                            </div>
                            <div className="text-xs text-gray-400">
                              {VEHICLE_TYPE_LABELS[v.vehicleType || 'OTHER'] || v.vehicleType} •{' '}
                              {v.brand} {v.model} {v.year}
                            </div>
                          </div>
                          {v.isAggregated && (
                            <span className="text-xs bg-orange-900/30 text-orange-400 px-2 py-0.5 rounded">
                              Já agregado
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-orange-900/20 border border-orange-600/30 rounded-lg">
              <UserCheck className="h-5 w-5 text-orange-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-seguranca-lightgray">
                  {selectedVehicle.plate}
                </div>
                <div className="text-xs text-gray-400">
                  {VEHICLE_TYPE_LABELS[selectedVehicle.vehicleType || 'OTHER'] || selectedVehicle.vehicleType} •{' '}
                  {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.year}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleInputChange('vehicleId', '');
                  setShowVehiclePicker(false);
                }}
                className="text-gray-400 hover:text-red-400"
              >
                ✕
              </Button>
            </div>
          )}
        </div>
      )}

      {isEditing && selectedVehicle && (
        <div className="flex items-center gap-3 p-3 bg-orange-900/20 border border-orange-600/30 rounded-lg">
          <UserCheck className="h-5 w-5 text-orange-400" />
          <div className="flex-1">
            <div className="text-sm font-medium text-seguranca-lightgray">
              {selectedVehicle.plate}
            </div>
            <div className="text-xs text-gray-400">
              {selectedVehicle.brand} {selectedVehicle.model} {selectedVehicle.year}
            </div>
          </div>
        </div>
      )}

      {/* Dados do Proprietário */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-orange-500/20 rounded">
            <UserCheck className="h-4 w-4 text-orange-400" />
          </div>
          <h4 className="text-sm font-semibold text-seguranca-lightgray uppercase tracking-wider">
            Dados do Proprietário
          </h4>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownerName" className="text-seguranca-lightgray">
            Nome do Proprietário <span className="text-red-400">*</span>
          </Label>
          <Input
            id="ownerName"
            value={formData.aggregatedOwnerName}
            onChange={(e) => handleInputChange('aggregatedOwnerName', e.target.value)}
            placeholder="Nome completo do proprietário"
            className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ownerCpfCnpj" className="text-seguranca-lightgray">
              CPF / CNPJ
            </Label>
            <Input
              id="ownerCpfCnpj"
              value={formData.aggregatedOwnerCpfCnpj}
              onChange={(e) => handleInputChange('aggregatedOwnerCpfCnpj', e.target.value)}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerPhone" className="text-seguranca-lightgray flex items-center gap-1">
              <Phone className="h-3 w-3" /> Telefone
            </Label>
            <Input
              id="ownerPhone"
              value={formData.aggregatedOwnerPhone}
              onChange={(e) => handleInputChange('aggregatedOwnerPhone', e.target.value)}
              placeholder="(00) 00000-0000"
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownerEmail" className="text-seguranca-lightgray flex items-center gap-1">
            <Mail className="h-3 w-3" /> E-mail
          </Label>
          <Input
            id="ownerEmail"
            type="email"
            value={formData.aggregatedOwnerEmail}
            onChange={(e) => handleInputChange('aggregatedOwnerEmail', e.target.value)}
            placeholder="email@exemplo.com"
            className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
          />
        </div>
      </div>

      {/* Valores e Pagamento */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-green-500/20 rounded">
            <DollarSign className="h-4 w-4 text-green-400" />
          </div>
          <h4 className="text-sm font-semibold text-seguranca-lightgray uppercase tracking-wider">
            Valores e Pagamento
          </h4>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentType" className="text-seguranca-lightgray">
            Tipo de Pagamento
          </Label>
          <Select
            value={formData.aggregatedPaymentType}
            onValueChange={(value) => handleInputChange('aggregatedPaymentType', value)}
          >
            <SelectTrigger id="paymentType" className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
              <SelectValue placeholder="Selecione o tipo de pagamento" />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
              {PAYMENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dailyRate" className="text-seguranca-lightgray">
              Valor Diário (R$)
            </Label>
            <Input
              id="dailyRate"
              type="number"
              step="0.01"
              min="0"
              value={formData.aggregatedDailyRate || ''}
              onChange={(e) =>
                handleInputChange('aggregatedDailyRate', parseFloat(e.target.value) || 0)
              }
              placeholder="Ex: 350.00"
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyRate" className="text-seguranca-lightgray">
              Valor Mensal (R$)
            </Label>
            <Input
              id="monthlyRate"
              type="number"
              step="0.01"
              min="0"
              value={formData.aggregatedMonthlyRate || ''}
              onChange={(e) =>
                handleInputChange('aggregatedMonthlyRate', parseFloat(e.target.value) || 0)
              }
              placeholder="Ex: 8500.00"
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>
        </div>
      </div>

      {/* Contrato */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-blue-500/20 rounded">
            <FileText className="h-4 w-4 text-blue-400" />
          </div>
          <h4 className="text-sm font-semibold text-seguranca-lightgray uppercase tracking-wider">
            Contrato
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contractStart" className="text-seguranca-lightgray flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Data Início
            </Label>
            <Input
              id="contractStart"
              type="date"
              value={formData.aggregatedContractStartDate}
              onChange={(e) => handleInputChange('aggregatedContractStartDate', e.target.value)}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contractEnd" className="text-seguranca-lightgray flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Data Término
            </Label>
            <Input
              id="contractEnd"
              type="date"
              value={formData.aggregatedContractEndDate}
              onChange={(e) => handleInputChange('aggregatedContractEndDate', e.target.value)}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
          </div>
        </div>

        {/* Alerta de contrato vencido */}
        {formData.aggregatedContractEndDate &&
          new Date(formData.aggregatedContractEndDate) < new Date() && (
            <div className="flex items-center gap-2 p-2 bg-red-900/20 border border-red-600/30 rounded text-sm text-red-400">
              <AlertTriangle className="h-4 w-4" />
              A data de término do contrato já passou.
            </div>
          )}

        <div className="space-y-2">
          <Label htmlFor="aggregatedNotes" className="text-seguranca-lightgray">
            Observações
          </Label>
          <Textarea
            id="aggregatedNotes"
            value={formData.aggregatedNotes}
            onChange={(e) => handleInputChange('aggregatedNotes', e.target.value)}
            placeholder="Condições especiais, regras, cláusulas..."
            className="bg-seguranca-black border-gray-600 text-seguranca-lightgray min-h-[80px]"
          />
        </div>
      </div>
    </form>
  );

  return (
    <ResponsiveDrawer
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title={isEditing ? 'Editar Agregado' : 'Novo Agregado'}
      description={
        isEditing
          ? 'Atualize os dados do veículo agregado.'
          : 'Vincule um veículo de terceiro como agregado na frota.'
      }
      footer={footer}
      className="max-w-lg"
    >
      {renderForm()}
    </ResponsiveDrawer>
  );
};

export default AgregadosFormModal;
