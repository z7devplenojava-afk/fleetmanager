import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, AlertTriangle, Bus, IdCard, UserRound } from 'lucide-react';
import driverService from '@/services/driverService';
import fleetService from '@/services/fleetService';
import { useToast } from '@/hooks/use-toast';
import { Driver } from '@/types/driver';
import type { Vehicle } from '@/types/fleet';
import { EmployeeCombobox } from '@/components/ui/employee-combobox';
import employeeService from '@/services/employeeService';

interface DriverFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
  driver?: Driver | null; // Para edição
}

const CNH_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'ACC'];

const isExpired = (date?: string) => {
  if (!date) return false;
  return new Date(date) < new Date();
};

const DriverFormModal: React.FC<DriverFormModalProps> = ({ isOpen, onOpenChange, onSuccess, driver }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'ATIVO' | 'INATIVO'>('ATIVO');
  const [cpf, setCpf] = useState('');
  const [cnhCategory, setCnhCategory] = useState('');
  const [cnhExpiration, setCnhExpiration] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [activeTab, setActiveTab] = useState('dados');
  const [driverVehicles, setDriverVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!driver;

  useEffect(() => {
    if (driver) {
      setEmployeeId('');
      setName(driver.name);
      setLicenseNumber(driver.licenseNumber || '');
      setPhone(driver.phone || '');
      setStatus(driver.status);
      setCpf(driver.cpf || '');
      setCnhCategory(driver.cnhCategory || '');
      setCnhExpiration(driver.cnhExpiration || '');
      setPhotoUrl(driver.photoUrl || '');
    } else {
      setEmployeeId('');
      setName('');
      setLicenseNumber('');
      setPhone('');
      setStatus('ATIVO');
      setCpf('');
      setCnhCategory('');
      setCnhExpiration('');
      setPhotoUrl('');
    }
    setActiveTab('dados');
  }, [driver, isOpen]);

  // Veículos vinculados (leitura): frota cujo motorista atribuído é este motorista
  useEffect(() => {
    const loadVehicles = async () => {
      if (!isOpen || !driver?.name) {
        setDriverVehicles([]);
        return;
      }
      try {
        const vehicles = await fleetService.getVehicles();
        const mine = (vehicles || []).filter(
          (v) => v.assignedDriver && v.assignedDriver.trim().toLowerCase() === driver.name.trim().toLowerCase()
        );
        setDriverVehicles(mine);
      } catch {
        setDriverVehicles([]);
      }
    };
    loadVehicles();
  }, [isOpen, driver?.name]);

  // Quando escolher um funcionário, preencher nome e CNH automaticamente
  useEffect(() => {
    const loadEmployee = async () => {
      if (!employeeId) return;
      try {
        const emp = await employeeService.getEmployeeById(employeeId);
        if (emp) {
          setName(emp.name || '');
          if (emp.cnhNumber) setLicenseNumber(emp.cnhNumber);
          if (emp.phone) setPhone(emp.phone);
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

  const cnhExpired = useMemo(() => isExpired(cnhExpiration), [cnhExpiration]);

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
      const driverData = {
        name,
        licenseNumber,
        phone,
        status,
        cpf: cpf || undefined,
        cnhCategory: cnhCategory || undefined,
        cnhExpiration: cnhExpiration || undefined,
        photoUrl: photoUrl || undefined,
      };
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
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || err.message || `Não foi possível ${isEditing ? 'atualizar' : 'criar'} o motorista.`;
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
    <form id="driver-form" onSubmit={handleSubmit} className="text-left">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-seguranca-black border border-gray-700">
          <TabsTrigger value="dados" className="data-[state=active]:bg-seguranca-graphite data-[state=active]:text-seguranca-yellow">
            <UserRound className="w-4 h-4 mr-1" /> Dados
          </TabsTrigger>
          <TabsTrigger value="cnh" className="data-[state=active]:bg-seguranca-graphite data-[state=active]:text-seguranca-yellow">
            <IdCard className="w-4 h-4 mr-1" /> CNH
          </TabsTrigger>
          <TabsTrigger value="veiculos" className="data-[state=active]:bg-seguranca-graphite data-[state=active]:text-seguranca-yellow">
            <Bus className="w-4 h-4 mr-1" /> Veículos
          </TabsTrigger>
        </TabsList>

        {/* Aba 1: Dados Pessoais */}
        <TabsContent value="dados" className="space-y-4 pt-4">
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
            <Label htmlFor="cpf" className="text-seguranca-lightgray">
              CPF
            </Label>
            <Input
              id="cpf"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              placeholder="000.000.000-00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-seguranca-lightgray">
              WhatsApp
            </Label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-2.5 h-4 w-4 text-seguranca-lightgray/50" />
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="(00) 00000-0000"
              />
            </div>
            <p className="text-xs text-gray-400">Usado para enviar notificações de multas e alertas ao motorista.</p>
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

          <div className="space-y-2">
            <Label htmlFor="photoUrl" className="text-seguranca-lightgray">
              URL da foto
            </Label>
            <Input
              id="photoUrl"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              placeholder="https://..."
            />
          </div>
        </TabsContent>

        {/* Aba 2: CNH */}
        <TabsContent value="cnh" className="space-y-4 pt-4">
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
            <Label htmlFor="cnhCategory" className="text-seguranca-lightgray">
              Categoria
            </Label>
            <Select value={cnhCategory} onValueChange={setCnhCategory}>
              <SelectTrigger id="cnhCategory" className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                {CNH_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnhExpiration" className="text-seguranca-lightgray">
              Validade da CNH
            </Label>
            <Input
              id="cnhExpiration"
              type="date"
              value={cnhExpiration}
              onChange={(e) => setCnhExpiration(e.target.value)}
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
            />
            {cnhExpired && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                CNH vencida em {new Date(cnhExpiration).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </TabsContent>

        {/* Aba 3: Veículos (leitura) */}
        <TabsContent value="veiculos" className="pt-4">
          {driverVehicles.length === 0 ? (
            <p className="text-sm text-gray-400">
              Nenhum veículo vinculado a este motorista. Atribua o motorista na tela de Frota.
            </p>
          ) : (
            <div className="space-y-2">
              {driverVehicles.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between bg-seguranca-black border border-gray-700 rounded-md px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-seguranca-yellow" />
                    <span className="text-gray-200 font-mono text-sm">{v.plate}</span>
                    <span className="text-gray-400 text-sm">{v.brand} {v.model}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      v.status === 'ACTIVE'
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : v.status === 'MAINTENANCE'
                        ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                        : 'bg-gray-500/10 border-gray-500/30 text-gray-400'
                    }
                  >
                    {v.status === 'ACTIVE' ? 'Ativo' : v.status === 'MAINTENANCE' ? 'Manutenção' : v.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
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
