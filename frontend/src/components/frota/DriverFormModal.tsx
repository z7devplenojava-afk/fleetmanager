import React, { useState, useEffect } from 'react';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import driverService from '@/services/driverService';
import { useToast } from '@/hooks/use-toast';
import { Driver } from '@/types/driver';
import { EmployeeCombobox } from '@/components/ui/employee-combobox';
import employeeService from '@/services/employeeService';

interface DriverFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  driver?: Driver | null; // Para edição
}

const DriverFormModal: React.FC<DriverFormModalProps> = ({ isOpen, onOpenChange, onSuccess, driver }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [status, setStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!driver;

  useEffect(() => {
    if (driver) {
      setEmployeeId('');
      setName(driver.name);
      setLicenseNumber(driver.licenseNumber || '');
      setStatus(driver.status);
    } else {
      setEmployeeId('');
      setName('');
      setLicenseNumber('');
      setStatus('ATIVO');
    }
  }, [driver, isOpen]);

  // Quando escolher um funcionário, preencher nome e CNH automaticamente
  useEffect(() => {
    const loadEmployee = async () => {
      if (!employeeId) return;
      try {
        const emp = await employeeService.getEmployeeById(employeeId);
        if (emp) {
          setName(emp.name || '');
          if (emp.cnhNumber) setLicenseNumber(emp.cnhNumber);
          if (emp.status && ['ACTIVE', 'ATIVO'].includes(emp.status)) {
            setStatus('ATIVO');
          } else if (emp.status && ['INACTIVE', 'INATIVO'].includes(emp.status)) {
            setStatus('INATIVO');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar funcionário:', error);
      }
    };
    loadEmployee();
  }, [employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      toast({
        title: 'Selecione o funcionário',
        description: 'Escolha um funcionário para vincular como motorista.',
        variant: 'destructive',
      });
      return;
    }

    // Validar se já existe motorista com essa CNH (apenas na criação)
    if (!isEditing && licenseNumber && licenseNumber.trim()) {
      try {
        const existingDrivers = await driverService.getDrivers();
        const driverWithSameCNH = existingDrivers.find(
          d => d.licenseNumber && d.licenseNumber.trim() === licenseNumber.trim()
        );
        if (driverWithSameCNH) {
          toast({
            title: 'CNH já cadastrada',
            description: `Já existe um motorista cadastrado com esta CNH: ${licenseNumber}. Por favor, edite o motorista existente ou use uma CNH diferente.`,
            variant: 'destructive',
          });
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar CNH existente:', error);
        // Continua mesmo se houver erro na verificação
      }
    }

    setIsLoading(true);

    try {
      const driverData = { name, licenseNumber, status };
      if (isEditing && driver) {
        await driverService.updateDriver(driver.id, driverData);
      } else {
        await driverService.createDriver(driverData);
      }

      toast({
        title: 'Sucesso',
        description: `Motorista ${isEditing ? 'atualizado' : 'criado'} com sucesso.`,
        variant: 'default',
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || `Não foi possível ${isEditing ? 'atualizar' : 'criar'} o motorista.`;
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
        form="driver-form"
        disabled={isLoading}
        className="flex-1 sm:flex-none h-10 sm:h-11 bg-seguranca-red hover:bg-seguranca-darkred text-white disabled:opacity-50"
      >
        {isLoading ? 'Salvando...' : 'Salvar'}
      </Button>
    </div>
  );

  const renderForm = () => (
    <form id="driver-form" onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="space-y-2">
        <Label htmlFor="employee" className="text-seguranca-lightgray">
          Funcionário (busca)
        </Label>
        <EmployeeCombobox
          id="employee"
          value={employeeId}
          onChange={(value) => setEmployeeId(value)}
          placeholder="Buscar funcionário pelo nome..."
          searchPlaceholder="Digite pelo menos 2 letras"
          emptyPlaceholder="Nenhum funcionário encontrado"
          disabled={isEditing} // edição mantém o vínculo atual
        />
        <p className="text-xs text-gray-400">O motorista é sempre um funcionário da empresa.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="text-seguranca-lightgray">
          Nome do motorista
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="licenseNumber" className="text-seguranca-lightgray">
          Nº da CNH
        </Label>
        <Input
          id="licenseNumber"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status" className="text-seguranca-lightgray">
          Status
        </Label>
        <Select value={status} onValueChange={(value: 'ATIVO' | 'INATIVO') => setStatus(value)}>
          <SelectTrigger id="status" className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
            <SelectItem value="ATIVO">Ativo</SelectItem>
            <SelectItem value="INATIVO">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </form>
  );

  return (
    <ResponsiveDrawer
      isOpen={isOpen}
      onClose={() => onOpenChange(false)}
      title={isEditing ? 'Editar Motorista' : 'Novo Motorista'}
      description={isEditing ? 'Atualize as informações do motorista.' : 'Cadastre um novo motorista vinculado a um funcionário.'}
      footer={footer}
      className="max-w-md"
    >
      {renderForm()}
    </ResponsiveDrawer>
  );
};

export default DriverFormModal; 
