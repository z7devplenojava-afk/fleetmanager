import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { KmControl, Vehicle } from '@/types/fleet';
import { Calendar, Clock, MapPin, Fuel, DollarSign, Calculator, AlertCircle } from 'lucide-react';
import kmControlService from '@/services/kmControlService';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { workPostService, WorkPost } from '@/services/workPostService';

interface KmControlFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (kmControl: KmControl) => void;
  kmControl?: KmControl;
  vehicles?: Vehicle[];
}

const KmControlFormModal: React.FC<KmControlFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  kmControl,
  vehicles = []
}) => {
  const normalizeToHHMM = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    let str = String(value).trim();
    if (!str) return '';
    // Troca vírgula por dois pontos e remove espaços
    str = str.replace(',', ':');
    // Já no formato HH:mm
    if (/^\d{2}:\d{2}$/.test(str)) return str;
    // Formatos como H:m, HH:m, H, HH
    const match = str.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
    if (match) {
      const h = Math.max(0, Math.min(23, parseInt(match[1], 10)));
      const m = Math.max(0, Math.min(59, parseInt(match[2] ?? '0', 10)));
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return '';
  };
  const [formData, setFormData] = useState<{
    date: string;
    supervisor: string;
    fuelType: 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'FLEX';
    initialKm: string;
    finalKm: string;
    value: string;
    shiftStart: string;
    shiftEnd: string;
    workPost: string;
    problemDescription: string;
    workPostPerformance: string;
    observations: string;
    initialKmJustification: string;
    finalKmJustification: string;
    vehicleId: string;
    fuelQuantity: string; // Novo campo para quantidade de combustível
  }>({
    date: '', // Vazio para novo registro
    supervisor: '', // Vazio para usuário selecionar
    fuelType: 'GASOLINE',
    initialKm: '',
    finalKm: '',
    value: '',
    shiftStart: '',
    shiftEnd: '',
    workPost: '',
    problemDescription: '',
    workPostPerformance: '',
    observations: '',
    initialKmJustification: '',
    finalKmJustification: '',
    vehicleId: '', // Vazio para usuário selecionar
    fuelQuantity: '', // Limpar fuelQuantity para novo registro
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPhotoDescription, setUploadPhotoDescription] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [supervisors, setSupervisors] = useState<string[]>([]);
  const [isLoadingSupervisors, setIsLoadingSupervisors] = useState(false);
  const { toast } = useToast();

  // Buscar postos de trabalho do banco de dados
  const { data: workPosts, isLoading: workPostsLoading, error: workPostsError } = useQuery({
    queryKey: ['workPosts', 'kmControl'],
    queryFn: () => workPostService.getWorkPosts(),
    retry: 2,
    retryDelay: 1000,
    enabled: isOpen // Só buscar quando o modal estiver aberto
  });

  // Buscar supervisores ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      fetchSupervisors();
    }
  }, [isOpen]);

  // Função para buscar supervisores
  const fetchSupervisors = async () => {
    setIsLoadingSupervisors(true);
    try {
      const supervisorsList = await kmControlService.getSupervisors();
      setSupervisors(supervisorsList);
    } catch (error) {
      console.error('Erro ao buscar supervisores:', error);
      setSupervisors([]);
    } finally {
      setIsLoadingSupervisors(false);
    }
  };

  // Preencher formulário quando editar
  useEffect(() => {
    if (kmControl) {
      // Modal de EDIÇÃO - preencher todos os campos com dados existentes
      setFormData({
        date: kmControl.date,
        supervisor: kmControl.supervisor,
        fuelType: kmControl.fuelType,
        initialKm: kmControl.initialKm.toString(),
        finalKm: kmControl.finalKm.toString(),
        value: kmControl.value.toString(),
        shiftStart: normalizeToHHMM(kmControl.shiftStart),
        shiftEnd: normalizeToHHMM(kmControl.shiftEnd),
        workPost: kmControl.workPost,
        problemDescription: kmControl.problemDescription || '',
        workPostPerformance: kmControl.workPostPerformance || '',
        observations: kmControl.observations || '',
        initialKmJustification: kmControl.initialKmJustification || '',
        finalKmJustification: kmControl.finalKmJustification || '',
        vehicleId: kmControl.vehicleId || '',
        fuelQuantity: kmControl.fuelQuantity || '', // Preencher fuelQuantity
      });
      setSelectedFile(null); // Não carregar arquivo existente no input file
      setUploadPhotoDescription(kmControl.dashboardPhotoDescription || '');
    } else {
      // Modal de NOVO registro - campos vazios para usuário preencher
      setFormData(prev => ({
        ...prev,
        date: '', // Data vazia para usuário preencher
        supervisor: '', // Supervisor vazio para usuário selecionar
        fuelType: 'GASOLINE',
        initialKm: '',
        finalKm: '',
        value: '',
        shiftStart: '',
        shiftEnd: '',
        workPost: '',
        problemDescription: '',
        workPostPerformance: '',
        observations: '',
        initialKmJustification: '',
        finalKmJustification: '',
        vehicleId: '' // Veículo vazio para usuário selecionar
      }));
      setSelectedFile(null);
      setUploadPhotoDescription('');
      setFormData(prev => ({ ...prev, fuelQuantity: '' })); // Limpar fuelQuantity para novo registro
    }
    setErrors({});
  }, [kmControl, isOpen, supervisors, vehicles]);



  // Calcular KM total automaticamente
  const calculateTotalKm = () => {
    const initial = parseInt(formData.initialKm) || 0;
    const final = parseInt(formData.finalKm) || 0;

    // Lógica de cálculo baseada no backend
    if (initial === 0 && final > 0 && formData.initialKmJustification) {
      return final;
    } else if (final === 0 && initial > 0 && formData.finalKmJustification) {
      return initial;
    } else if (initial === 0 && final === 0 && formData.initialKmJustification && formData.finalKmJustification) {
      return 0;
    } else {
      return Math.max(0, final - initial);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = 'Data é obrigatória';
    if (!formData.supervisor) newErrors.supervisor = 'Supervisor é obrigatório';

    // Validar KM inicial e justificativa
    if ((!formData.initialKm || formData.initialKm === '0') && !formData.initialKmJustification) {
      newErrors.initialKm = 'KM Inicial ou Justificativa são obrigatórios';
    }

    // Validar KM final e justificativa
    if ((!formData.finalKm || formData.finalKm === '0') && !formData.finalKmJustification) {
      newErrors.finalKm = 'KM Final ou Justificativa são obrigatórios';
    }

    if (!formData.value) newErrors.value = 'Valor é obrigatório';
    if (!formData.workPost) newErrors.workPost = 'Posto de trabalho é obrigatório';

    // Validar KM (apenas se ambos estiverem preenchidos)
    if (formData.initialKm && formData.finalKm) {
      const initial = parseInt(formData.initialKm) || 0;
      const final = parseInt(formData.finalKm) || 0;
      if (final <= initial) {
        newErrors.finalKm = 'KM final deve ser maior que KM inicial';
      }
    }

    // Validar horários
    if (formData.shiftStart && formData.shiftEnd) {
      const parseTime = (value: unknown): { hour: number; minute: number } | null => {
        if (value === undefined || value === null) return null;
        const str = String(value);
        const parts = str.split(':');
        if (parts.length < 2) return null;
        const hour = Number(parts[0]);
        const minute = Number(parts[1]);
        if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
        return { hour, minute };
      };

      const start = parseTime(formData.shiftStart);
      const end = parseTime(formData.shiftEnd);
      if (!start || !end) {
        // Se um dos campos estiver preenchido com formato inválido, marcar erro.
        if (formData.shiftStart && !start) newErrors.shiftStart = 'Horário inválido';
        if (formData.shiftEnd && !end) newErrors.shiftEnd = 'Horário inválido';
      } else {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const day = today.getDate();

        const startDateTime = new Date(year, month, day, start.hour, start.minute);
        let endDateTime = new Date(year, month, day, end.hour, end.minute);

        if (endDateTime.getTime() <= startDateTime.getTime()) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }

        if (endDateTime.getTime() <= startDateTime.getTime()) {
          newErrors.shiftEnd = 'Fim do turno deve ser após o início do turno';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const totalKm = calculateTotalKm();

    // Preparar dados do formulário para envio
    const parsedValue = parseFloat(formData.value);
    const safeValue = Number.isFinite(parsedValue) ? parsedValue : 0;

    const kmControlData: Omit<KmControl, 'id' | 'createdAt' | 'updatedAt' | 'dashboardPhotoUrl' | 'dashboardPhotoDescription'> = {
      date: formData.date, // yyyy-mm-dd
      supervisor: formData.supervisor,
      fuelType: formData.fuelType as any, // backend espera enum FuelType
      // Se KM inicial vazio mas justificativa preenchida, usar 0 e avisar
      initialKm: formData.initialKm ? parseInt(formData.initialKm) : (formData.initialKmJustification ? 0 : 0),
      // Se KM final vazio mas justificativa preenchida, usar 0 e avisar
      finalKm: formData.finalKm ? parseInt(formData.finalKm) : (formData.finalKmJustification ? 0 : 0),
      totalKm,
      value: safeValue,
      shiftStart: formData.shiftStart ? `${formData.shiftStart}:00` : null,
      shiftEnd: formData.shiftEnd ? `${formData.shiftEnd}:00` : null,
      workPost: formData.workPost,
      problemDescription: formData.problemDescription || undefined,
      workPostPerformance: formData.workPostPerformance || undefined,
      observations: formData.observations || undefined,
      initialKmJustification: formData.initialKmJustification || undefined,
      finalKmJustification: formData.finalKmJustification || undefined,
      vehicleId: formData.vehicleId || undefined,
      vehiclePlate: (formData.vehicleId ? vehicles.find(v => v.id === formData.vehicleId)?.plate : undefined) || undefined,
      fuelQuantity: formData.fuelQuantity || undefined, // Incluir no DTO
    };

    try {
      console.log('🚀 Enviando dados para API:', kmControlData);

      let savedKmControl: KmControl;

      // Exibir toast se KM foi preenchido com 0 automaticamente
      if (!formData.initialKm && formData.initialKmJustification) {
        toast({
          title: "Atenção",
          description: "KM Inicial foi preenchido com 0, pois a justificativa foi informada.",
          variant: "default"
        });
      }
      if (!formData.finalKm && formData.finalKmJustification) {
        toast({
          title: "Atenção",
          description: "KM Final foi preenchido com 0, pois a justificativa foi informada.",
          variant: "default"
        });
      }

      if (kmControl?.id) {
        // Atualizar registro existente
        savedKmControl = await kmControlService.updateKmControl(kmControl.id, kmControlData);
        console.log('✅ Registro atualizado:', savedKmControl);
      } else {
        // Criar novo registro
        savedKmControl = await kmControlService.createKmControl(kmControlData);
        console.log('✅ Novo registro criado:', savedKmControl);
      }

      // Lógica para upload da foto, se houver um arquivo selecionado
      if (selectedFile && savedKmControl.id) {
        setIsUploadingPhoto(true);
        try {
          await kmControlService.uploadDashboardPhoto(savedKmControl.id, selectedFile, uploadPhotoDescription);
          console.log('✅ Foto do painel enviada com sucesso para:', savedKmControl.id);
          toast({
            title: "Sucesso",
            description: "Foto do painel enviada com sucesso.",
            variant: "default"
          });
        } catch (uploadError) {
          console.error('❌ Erro ao enviar foto do painel:', uploadError);
          toast({
            title: "Erro no Upload",
            description: "Falha ao enviar a foto do painel. Por favor, tente novamente.",
            variant: "destructive"
          });
        } finally {
          setIsUploadingPhoto(false);
        }
      }

      onSuccess(savedKmControl);
      onClose();
    } catch (error) {
      console.error('❌ Erro ao salvar controle de km:', error);
      // Aqui você pode mostrar uma mensagem de erro para o usuário
      toast({
        title: "Erro ao Salvar",
        description: "Falha ao salvar o controle de quilometragem. Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    const nextValue = (field === 'shiftStart' || field === 'shiftEnd')
      ? normalizeToHHMM(value)
      : value;
    setFormData(prev => ({ ...prev, [field]: nextValue }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const footer = (
    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="flex-1 sm:flex-none h-10 sm:h-11 border-gray-600 text-gray-400 hover:bg-gray-700 font-medium"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="km-control-form"
        disabled={isUploadingPhoto}
        className="flex-1 sm:flex-none h-10 sm:h-11 bg-seguranca-red hover:bg-seguranca-darkred text-white disabled:opacity-50 font-medium"
      >
        {isUploadingPhoto ? 'Enviando Foto...' : (kmControl ? 'Atualizar' : 'Salvar')}
      </Button>
    </div>
  );

  const renderForm = () => (
    <form id="km-control-form" onSubmit={handleSubmit} className="space-y-6 text-left">
      {/* Primeira linha - Data e Supervisor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="date" className="text-seguranca-lightgray font-medium">
            <Calendar className="inline h-4 w-4 mr-2 text-seguranca-yellow" />
            Data
          </Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11 ${errors.date ? 'border-red-500' : ''
              }`}
          />
          {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
        </div>

        <div className="space-y-3">
          <Label htmlFor="supervisor" className="text-seguranca-lightgray font-medium">
            Supervisor
          </Label>
          <Select
            value={formData.supervisor}
            onValueChange={(value) => handleInputChange('supervisor', value)}
          >
            <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11">
              <SelectValue placeholder={isLoadingSupervisors ? "Carregando..." : "Selecione um supervisor"} />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-black border-gray-600">
              <SelectItem value="none">Selecione um supervisor</SelectItem>
              {supervisors.map((supervisor) => (
                <SelectItem key={supervisor} value={supervisor}>
                  {supervisor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.supervisor && <p className="text-red-500 text-sm">{errors.supervisor}</p>}
        </div>
      </div>

      {/* Segunda linha - Veículo e Combustível */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="vehicleId" className="text-seguranca-lightgray font-medium">
            Veículo (Opcional)
          </Label>
          <Select
            value={formData.vehicleId}
            onValueChange={(value) => handleInputChange('vehicleId', value)}
          >
            <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11">
              <SelectValue placeholder="Selecione um veículo" />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-black border-gray-600">
              <SelectItem value="none">Sem veículo</SelectItem>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate} - {vehicle.brand} {vehicle.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label htmlFor="fuelType" className="text-seguranca-lightgray font-medium">
            <Fuel className="inline h-4 w-4 mr-2 text-seguranca-yellow" />
            Tipo de Combustível
          </Label>
          <Select
            value={formData.fuelType}
            onValueChange={(value: 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'FLEX') => handleInputChange('fuelType', value)}
          >
            <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11">
              <SelectValue placeholder="Selecione o combustível" />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-black border-gray-600">
              <SelectItem value="GASOLINE">Gasolina</SelectItem>
              <SelectItem value="ETHANOL">Etanol</SelectItem>
              <SelectItem value="DIESEL">Diesel</SelectItem>
              <SelectItem value="FLEX">Flex</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Nova linha para Quantidade de Combustível */}
      <div className="space-y-3">
        <Label htmlFor="fuelQuantity" className="text-seguranca-lightgray font-medium">
          <Fuel className="inline h-4 w-4 mr-2 text-seguranca-yellow" />
          Quantidade de Combustível (Ex: 6/12)
        </Label>
        <Input
          id="fuelQuantity"
          type="text"
          value={formData.fuelQuantity}
          onChange={(e) => handleInputChange('fuelQuantity', e.target.value)}
          placeholder="Ex: 6/12"
          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11"
        />
      </div>

      {/* Terceira linha - KM Inicial e Final */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="initialKm" className="text-seguranca-lightgray font-medium">
            KM Inicial
          </Label>
          <Input
            id="initialKm"
            type="number"
            value={formData.initialKm}
            onChange={(e) => handleInputChange('initialKm', e.target.value)}
            placeholder="0"
            className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11 font-mono ${errors.initialKm ? 'border-red-500' : ''
              }`}
          />
          {errors.initialKm && <p className="text-red-500 text-sm">{errors.initialKm}</p>}

          {/* Campo de justificativa para KM inicial */}
          {(!formData.initialKm || formData.initialKm === '0') && (
            <div className="mt-2">
              <Label htmlFor="initialKmJustification" className="text-seguranca-lightgray font-medium text-sm">
                <AlertCircle className="inline h-4 w-4 mr-2 text-seguranca-yellow" />
                Justificativa (obrigatório se não houver KM inicial)
              </Label>
              <Textarea
                id="initialKmJustification"
                value={formData.initialKmJustification}
                onChange={(e) => handleInputChange('initialKmJustification', e.target.value)}
                placeholder="Ex: Veículo em manutenção, pneu furado, problemas mecânicos..."
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-20 text-sm resize-none"
              />
              {errors.initialKmJustification && <p className="text-red-500 text-sm">{errors.initialKmJustification}</p>}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="finalKm" className="text-seguranca-lightgray font-medium">
            KM Final
          </Label>
          <Input
            id="finalKm"
            type="number"
            value={formData.finalKm}
            onChange={(e) => handleInputChange('finalKm', e.target.value)}
            placeholder="0"
            className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11 font-mono ${errors.finalKm ? 'border-red-500' : ''
              }`}
          />
          {errors.finalKm && <p className="text-red-500 text-sm">{errors.finalKm}</p>}

          {/* Campo de justificativa para KM final */}
          {(!formData.finalKm || formData.finalKm === '0') && (
            <div className="mt-2">
              <Label htmlFor="finalKmJustification" className="text-seguranca-lightgray font-medium text-sm">
                <AlertCircle className="inline h-4 w-4 mr-2 text-seguranca-yellow" />
                Justificativa (obrigatório se não houver KM final)
              </Label>
              <Textarea
                id="finalKmJustification"
                value={formData.finalKmJustification}
                onChange={(e) => handleInputChange('finalKmJustification', e.target.value)}
                placeholder="Ex: Veículo quebrou, turno interrompido, emergência..."
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-20 text-sm resize-none"
              />
              {errors.finalKmJustification && <p className="text-red-500 text-sm">{errors.finalKmJustification}</p>}
            </div>
          )}
        </div>
      </div>

      {/* KM Total calculado */}
      <div className="bg-seguranca-black/50 p-6 rounded-lg border border-seguranca-yellow/30">
        <div className="flex items-center justify-center space-x-4">
          <div className="p-3 bg-seguranca-yellow/20 rounded-full">
            <Calculator className="h-6 w-6 text-seguranca-yellow" />
          </div>
          <div className="text-center">
            <Label className="text-seguranca-lightgray font-semibold text-lg">KM Total do Dia</Label>
            <div className="text-3xl font-bold text-seguranca-yellow mt-1">
              {calculateTotalKm() !== null && calculateTotalKm() !== undefined ? calculateTotalKm().toLocaleString() : '0'} km
            </div>
          </div>
        </div>
      </div>

      {/* Quarta linha - Valor e Posto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="value" className="text-seguranca-lightgray font-medium">
            <DollarSign className="inline h-4 w-4 mr-2 text-seguranca-yellow" />
            Valor
          </Label>
          <Input
            id="value"
            type="number"
            step="0.01"
            value={formData.value}
            onChange={(e) => handleInputChange('value', e.target.value)}
            placeholder="0.00"
            className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11 ${errors.value ? 'border-red-500' : ''
              }`}
          />
          {errors.value && <p className="text-red-500 text-sm">{errors.value}</p>}
        </div>

        <div className="space-y-3">
          <Label htmlFor="workPost" className="text-seguranca-lightgray font-medium">
            <MapPin className="inline h-4 w-4 mr-2 text-seguranca-yellow" />
            Posto de Trabalho
          </Label>
          <Select
            value={formData.workPost}
            onValueChange={(value) => handleInputChange('workPost', value)}
            disabled={workPostsLoading || !!workPostsError}
          >
            <SelectTrigger className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11 ${errors.workPost ? 'border-red-500' : ''
              }`}>
              <SelectValue placeholder={workPostsLoading ? "Carregando postos..." : "Selecione um posto de trabalho"} />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-black border-gray-600 max-h-60">
              {workPosts && workPosts.map((workPost) => (
                <SelectItem key={workPost.id} value={workPost.name} className="text-seguranca-lightgray hover:bg-gray-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-seguranca-yellow" />
                    {workPost.name}
                    {workPost.postCode && (
                      <span className="text-xs text-gray-400">({workPost.postCode})</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.workPost && <p className="text-red-500 text-sm">{errors.workPost}</p>}
        </div>
      </div>

      {/* Quinta linha - Horários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="shiftStart" className="text-seguranca-lightgray font-medium">
            <Clock className="inline h-4 w-4 mr-2 text-seguranca-yellow" />
            Início do Turno
          </Label>
          <Input
            id="shiftStart"
            type="time"
            value={formData.shiftStart}
            onChange={(e) => handleInputChange('shiftStart', e.target.value)}
            className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11 font-mono ${errors.shiftStart ? 'border-red-500' : ''
              }`}
          />
          {errors.shiftStart && <p className="text-red-500 text-sm">{errors.shiftStart}</p>}
        </div>

        <div className="space-y-3">
          <Label htmlFor="shiftEnd" className="text-seguranca-lightgray font-medium">
            <Clock className="inline h-4 w-4 mr-2 text-seguranca-yellow" />
            Fim do Turno
          </Label>
          <Input
            id="shiftEnd"
            type="time"
            value={formData.shiftEnd}
            onChange={(e) => handleInputChange('shiftEnd', e.target.value)}
            className={`bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11 font-mono ${errors.shiftEnd ? 'border-red-500' : ''
              }`}
          />
          {errors.shiftEnd && <p className="text-red-500 text-sm">{errors.shiftEnd}</p>}
        </div>
      </div>

      {/* Sexta linha - Descrições */}
      <div className="space-y-6">
        <div className="space-y-3">
          <Label htmlFor="problemDescription" className="text-seguranca-lightgray font-medium">
            Descrição de Problemas
          </Label>
          <Textarea
            id="problemDescription"
            value={formData.problemDescription}
            onChange={(e) => handleInputChange('problemDescription', e.target.value)}
            placeholder="Descreva problemas encontrados durante o turno..."
            className="bg-seguranca-black border-gray-600 text-seguranca-lightgray min-h-[100px] resize-none"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="workPostPerformance" className="text-seguranca-lightgray font-medium">
            Rendimentos do Posto de Trabalho
          </Label>
          <Textarea
            id="workPostPerformance"
            value={formData.workPostPerformance}
            onChange={(e) => handleInputChange('workPostPerformance', e.target.value)}
            placeholder="Descreva o rendimento e produtividade do posto..."
            className="bg-seguranca-black border-gray-600 text-seguranca-lightgray min-h-[100px] resize-none"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="observations" className="text-seguranca-lightgray font-medium">
            Observações
          </Label>
          <Textarea
            id="observations"
            value={formData.observations}
            onChange={(e) => handleInputChange('observations', e.target.value)}
            placeholder="Descreva observações adicionais..."
            className="bg-seguranca-black border-gray-600 text-seguranca-lightgray min-h-[100px] resize-none"
          />
        </div>

        {/* Campo de Upload de Imagem do Painel */}
        <div className="space-y-3 pt-4 border-t border-gray-700">
          <Label htmlFor="dashboardPhoto" className="text-seguranca-lightgray font-medium">
            Upload Foto do Painel (Opcional)
          </Label>
          <Input
            id="dashboardPhoto"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setSelectedFile(file || null);
            }}
            className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-11 file:bg-seguranca-graphite file:text-seguranca-lightgray file:border-gray-600"
          />
          {selectedFile && (
            <div className="mt-2 p-2 bg-seguranca-black rounded border border-gray-600">
              <p className="text-xs text-gray-400 mb-2">Prévia:</p>
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Prévia da foto"
                className="max-w-full h-32 object-contain rounded"
              />
            </div>
          )}
          <div className="mt-2">
            <Label htmlFor="photoDescription" className="text-seguranca-lightgray font-medium text-sm">
              Descrição da Foto (Opcional)
            </Label>
            <Textarea
              id="photoDescription"
              value={uploadPhotoDescription}
              onChange={(e) => setUploadPhotoDescription(e.target.value)}
              placeholder="Ex: Painel com 51.107 km, foto tirada antes do início do turno..."
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray h-20 text-sm resize-none"
            />
          </div>
        </div>
      </div>
    </form>
  );

  return (
    <ResponsiveDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={`${kmControl ? 'Editar' : 'Novo'} Controle de Quilometragem`}
      description={kmControl ? 'Atualize os dados do controle de quilometragem.' : 'Registre um novo controle de quilometragem.'}
      footer={footer}
      className="max-w-2xl"
    >
      {renderForm()}
    </ResponsiveDrawer>
  );
};

export default KmControlFormModal;
