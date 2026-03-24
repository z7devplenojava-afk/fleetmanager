import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Upload, QrCode, User, Building, Clock, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CreateVisitRequest, VisitStatus, Visit } from '@/types/visit';
import { visitService } from '@/services/visitService';
import api from '@/lib/axios';
import CameraCaptureModal from '@/components/operacional/CameraCaptureModal';
import { employeeService } from '@/services/employeeService';

interface VisitFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit?: Visit | null;
  onSave: (data: CreateVisitRequest) => void;
}

interface Supervisor {
  id: string;
  name: string;
  cpf: string;
}

interface Client {
  id: string;
  name: string;
}

interface WorkPost {
  id: string;
  name: string;
  clientId: string;
}

export const VisitFormModal: React.FC<VisitFormModalProps> = ({
  open,
  onOpenChange,
  visit,
  onSave,
}) => {
  const [formData, setFormData] = useState<CreateVisitRequest>({
    supervisorId: '',
    workPostId: '',
    clientId: '',
    visitDate: '',
    visitTime: '',
    description: '',
    observations: '',
    status: VisitStatus.SCHEDULED,
    presentEmployees: [],
    attachedFiles: [],
    photos: [],
    latitude: undefined,
    longitude: undefined,
    locationAddress: '',
    qrCodeScanned: '',
    qrCodeVerified: false,
    cancellationReason: '',
  });

  const [loading, setLoading] = useState(false);
  const [scanningQR, setScanningQR] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  // Dados do banco
  const [supervisorCpf, setSupervisorCpf] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [loadingSupervisor, setLoadingSupervisor] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [allWorkPosts, setAllWorkPosts] = useState<WorkPost[]>([]);
  const [filteredWorkPosts, setFilteredWorkPosts] = useState<WorkPost[]>([]);
  
  // Dados do funcionário identificado no local
  const [employeeCpf, setEmployeeCpf] = useState('');
  const [employeeRegistration, setEmployeeRegistration] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [employeeWarning, setEmployeeWarning] = useState<string | null>(null);
  

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  // Carregar clientes e postos de trabalho
  useEffect(() => {
    if (open) {
      loadClients();
      loadWorkPosts();
    }
  }, [open]);

  // Filtrar postos de trabalho quando cliente for selecionado
  useEffect(() => {
    if (formData.clientId) {
      const filtered = allWorkPosts.filter(wp => wp.clientId === formData.clientId);
      setFilteredWorkPosts(filtered);
      
      // Se o posto atual não pertence ao cliente selecionado, limpar
      if (formData.workPostId && !filtered.some(wp => wp.id === formData.workPostId)) {
        setFormData(prev => ({ ...prev, workPostId: '' }));
      }
    } else {
      setFilteredWorkPosts([]);
      setFormData(prev => ({ ...prev, workPostId: '' }));
    }
  }, [formData.clientId, allWorkPosts]);

  const loadClients = async () => {
    try {
      const response = await api.get('/api/clients/all');
      setClients(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de clientes",
        variant: "destructive",
      });
    }
  };

  const loadWorkPosts = async () => {
    try {
      const response = await api.get('/api/work-posts/all');
      setAllWorkPosts(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar postos de trabalho:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de postos de trabalho",
        variant: "destructive",
      });
    }
  };

  const handleSupervisorCpfChange = (cpf: string) => {
    setSupervisorCpf(cpf);
    
    // Limpar nome e ID se CPF for apagado
    if (!cpf) {
      setSupervisorName('');
      setFormData(prev => ({ ...prev, supervisorId: '' }));
    }
  };

  const handleSupervisorCpfBlur = async () => {
    if (!supervisorCpf || supervisorCpf.length < 11) {
      return;
    }

    setLoadingSupervisor(true);
    try {
      // Buscar supervisor por CPF
      const response = await api.get(`/api/employees/search/simple?q=${supervisorCpf}`);
      
      if (response.data && response.data.length > 0) {
        const supervisor = response.data[0];
        setSupervisorName(supervisor.name);
        setFormData(prev => ({ ...prev, supervisorId: supervisor.id }));
        
        toast({
          title: "Supervisor encontrado",
          description: `${supervisor.name}`,
        });
      } else {
        setSupervisorName('');
        setFormData(prev => ({ ...prev, supervisorId: '' }));
        
        toast({
          title: "Supervisor não encontrado",
          description: "CPF não encontrado no sistema",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao buscar supervisor:', error);
      setSupervisorName('');
      setFormData(prev => ({ ...prev, supervisorId: '' }));
      
      toast({
        title: "Erro",
        description: "Erro ao buscar supervisor",
        variant: "destructive",
      });
    } finally {
      setLoadingSupervisor(false);
    }
  };

  const handleEmployeeCpfChange = (cpf: string) => {
    setEmployeeCpf(cpf);
    // Limpar dados se CPF for apagado
    if (!cpf) {
      setEmployeeName('');
      setEmployeeId(null);
      setEmployeeWarning(null);
      setFormData(prev => ({ ...prev, employeeId: undefined, employeeCpf: undefined }));
    }
  };

  const handleEmployeeRegistrationChange = (registration: string) => {
    setEmployeeRegistration(registration);
    // Limpar dados se matrícula for apagada
    if (!registration) {
      setEmployeeName('');
      setEmployeeId(null);
      setEmployeeWarning(null);
      setFormData(prev => ({ ...prev, employeeId: undefined, employeeRegistrationNumber: undefined }));
    }
  };

  const handleEmployeeCpfBlur = async () => {
    if (!employeeCpf || employeeCpf.length < 11 || !formData.workPostId) {
      return;
    }
    await searchEmployee(employeeCpf, null);
  };

  const handleEmployeeRegistrationBlur = async () => {
    if (!employeeRegistration || !formData.workPostId) {
      return;
    }
    await searchEmployee(null, employeeRegistration);
  };

  const searchEmployee = async (cpf: string | null, registrationNumber: string | null) => {
    if (!formData.workPostId) {
      toast({
        title: "Atenção",
        description: "Selecione o posto de trabalho primeiro",
        variant: "destructive",
      });
      return;
    }

    setLoadingEmployee(true);
    setEmployeeName('');
    setEmployeeId(null);
    setEmployeeWarning(null);

    try {
      const params = new URLSearchParams();
      if (cpf) params.append('cpf', cpf);
      if (registrationNumber) params.append('registrationNumber', registrationNumber);
      params.append('workPostId', formData.workPostId);

      const response = await api.get(`/api/visit-controls/find-employee?${params.toString()}`);
      
      if (response.data.success) {
        const employee = response.data.employee;
        setEmployeeName(employee.name);
        setEmployeeId(employee.id);
        setFormData(prev => ({ 
          ...prev, 
          employeeId: employee.id,
          employeeCpf: employee.cpf,
          employeeRegistrationNumber: employee.registrationNumber
        }));
        
        if (!response.data.isAssignedToWorkPost) {
          setEmployeeWarning(response.data.warning || 'Funcionário não está atribuído ao posto de trabalho');
        } else {
          setEmployeeWarning(null);
        }
        
        toast({
          title: "Funcionário encontrado",
          description: `${employee.name}`,
        });
      } else {
        setEmployeeName('');
        setEmployeeId(null);
        setEmployeeWarning(null);
        toast({
          title: "Funcionário não encontrado",
          description: response.data.error || "Funcionário não encontrado com os dados informados",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar funcionário:', error);
      setEmployeeName('');
      setEmployeeId(null);
      setEmployeeWarning(null);
      toast({
        title: "Erro",
        description: error.response?.data?.error || "Erro ao buscar funcionário",
        variant: "destructive",
      });
    } finally {
      setLoadingEmployee(false);
    }
  };

  const loadSupervisorCpf = async (supervisorId: string) => {
    try {
      console.log('🔍 Buscando CPF do supervisor:', supervisorId);
      const employee = await employeeService.getEmployeeById(supervisorId);
      console.log('👤 Employee encontrado:', employee);
      
      if (employee) {
        // Tentar buscar CPF em diferentes campos possíveis (cpf, document, documentNumber)
        const cpfValue = employee.cpf || employee.document || (employee as any).documentNumber;
        
        if (cpfValue) {
          // Formatar CPF (000.000.000-00)
          const cpf = String(cpfValue).replace(/\D/g, '');
          console.log('📋 CPF encontrado (normalizado):', cpf);
          
          if (cpf.length === 11) {
            const formattedCpf = `${cpf.substring(0, 3)}.${cpf.substring(3, 6)}.${cpf.substring(6, 9)}-${cpf.substring(9, 11)}`;
            console.log('✅ CPF formatado:', formattedCpf);
            setSupervisorCpf(formattedCpf);
          } else if (cpf.length > 0) {
            // Se não tem 11 dígitos, usar como está
            setSupervisorCpf(cpf);
          } else {
            console.warn('⚠️ CPF encontrado mas vazio após normalização');
            setSupervisorCpf('');
          }
        } else {
          console.warn('⚠️ CPF não encontrado nos campos do employee. Campos disponíveis:', Object.keys(employee));
          setSupervisorCpf('');
        }
      } else {
        console.warn('⚠️ Employee não encontrado');
        setSupervisorCpf('');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar CPF do supervisor:', error);
      // Não mostrar erro ao usuário, apenas deixar o CPF vazio
      setSupervisorCpf('');
    }
  };

  useEffect(() => {
    console.log('🔄 VisitFormModal useEffect - visit mudou:', visit);
    if (visit) {
      console.log('📋 Preenchendo formulário com dados da visita:', {
        id: visit.id,
        supervisorId: visit.supervisorId,
        workPostId: visit.workPostId,
        clientId: visit.clientId,
        visitDate: visit.visitDate,
        visitTime: visit.visitTime,
        status: visit.status,
        description: visit.description,
        observations: visit.observations,
      });
      
      // Formatar data para o input HTML (YYYY-MM-DD)
      let formattedDate = '';
      if (visit.visitDate) {
        try {
          // Se já está no formato correto, usar direto
          if (visit.visitDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = visit.visitDate;
          } else {
            // Tentar converter de outros formatos
            const date = new Date(visit.visitDate);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split('T')[0];
            }
          }
        } catch (e) {
          formattedDate = new Date().toISOString().split('T')[0];
        }
      }
      if (!formattedDate) {
        formattedDate = new Date().toISOString().split('T')[0];
      }

      // Formatar hora para o input HTML (HH:mm)
      let formattedTime = '';
      if (visit.visitTime) {
        try {
          // Se já está no formato HH:mm, usar direto
          if (visit.visitTime.match(/^\d{2}:\d{2}$/)) {
            formattedTime = visit.visitTime;
          } else if (visit.visitTime.match(/^\d{2}:\d{2}:\d{2}/)) {
            // Se está no formato HH:mm:ss, pegar apenas HH:mm
            formattedTime = visit.visitTime.substring(0, 5);
          } else {
            // Tentar extrair hora de outros formatos
            const timeMatch = visit.visitTime.match(/(\d{2}):(\d{2})/);
            if (timeMatch) {
              formattedTime = `${timeMatch[1]}:${timeMatch[2]}`;
            }
          }
        } catch (e) {
          formattedTime = new Date().toTimeString().slice(0, 5);
        }
      }
      if (!formattedTime) {
        formattedTime = new Date().toTimeString().slice(0, 5);
      }

      // Preencher todos os campos da visita
      setFormData({
        supervisorId: visit.supervisorId || '',
        workPostId: visit.workPostId || '',
        clientId: visit.clientId || '',
        visitDate: formattedDate,
        visitTime: formattedTime,
        description: visit.description || '',
        observations: visit.observations || '',
        status: visit.status || VisitStatus.SCHEDULED,
        presentEmployees: visit.presentEmployees || [],
        attachedFiles: visit.attachedFiles || [],
        photos: visit.photos || [],
        latitude: visit.latitude,
        longitude: visit.longitude,
        locationAddress: visit.locationAddress || '',
        qrCodeScanned: visit.qrCodeScanned || '',
        qrCodeVerified: visit.qrCodeVerified || false,
        cancellationReason: (visit as any).cancellationReason || '',
      });
      setSupervisorName(visit.supervisorName || '');
      
      // Buscar CPF do supervisor se tiver supervisorId
      if (visit.supervisorId) {
        console.log('🔄 VisitFormModal: Buscando CPF para supervisorId:', visit.supervisorId);
        // Usar setTimeout para garantir que o modal esteja totalmente aberto
        setTimeout(() => {
          loadSupervisorCpf(visit.supervisorId);
        }, 100);
      } else {
        console.log('⚠️ VisitFormModal: supervisorId não encontrado na visita');
        setSupervisorCpf('');
      }
    } else {
      // Reset form for new visit
      setFormData({
        supervisorId: '',
        workPostId: '',
        clientId: '',
        visitDate: new Date().toISOString().split('T')[0],
        visitTime: new Date().toTimeString().slice(0, 5),
        description: '',
        observations: '',
        status: VisitStatus.SCHEDULED,
        presentEmployees: [],
        attachedFiles: [],
        photos: [],
        latitude: undefined,
        longitude: undefined,
        locationAddress: '',
        qrCodeScanned: '',
        qrCodeVerified: false,
        cancellationReason: '',
      });
      setSupervisorCpf('');
      setSupervisorName('');
    }
    setUploadedFiles([]);
    setCapturedPhotos([]);
  }, [visit, open]);

  const handleInputChange = (field: keyof CreateVisitRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handlePhotoCaptured = (file: File) => {
    setCapturedPhotos(prev => [...prev, file]);
    toast({
      title: "Foto capturada",
      description: "Foto adicionada com sucesso",
    });
  };

  const handleSubmit = async () => {
    if (!formData.supervisorId) {
      toast({
        title: "Supervisor obrigatório",
        description: "Informe o CPF do supervisor",
        variant: "destructive",
      });
      return;
    }

    if (!formData.clientId) {
      toast({
        title: "Cliente obrigatório",
        description: "Selecione um cliente",
        variant: "destructive",
      });
      return;
    }

    if (!formData.workPostId) {
      toast({
        title: "Posto de trabalho obrigatório",
        description: "Selecione um posto de trabalho",
        variant: "destructive",
      });
      return;
    }

    // Validar motivo de cancelamento se status for CANCELLED
    if (formData.status === VisitStatus.CANCELLED && (!formData.cancellationReason || formData.cancellationReason.trim() === '')) {
      toast({
        title: "Motivo de cancelamento obrigatório",
        description: "Informe o motivo do cancelamento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar visita:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-seguranca-yellow text-xl font-bold">
            {visit ? 'Editar Visita' : 'Nova Visita'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Identificação do Supervisor */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-seguranca-yellow flex items-center gap-2">
                <User size={20} />
                Identificação do Supervisor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray">CPF do Supervisor *</Label>
                  <Input
                    value={supervisorCpf}
                    onChange={(e) => handleSupervisorCpfChange(e.target.value)}
                    onBlur={handleSupervisorCpfBlur}
                    placeholder="000.000.000-00"
                    className="bg-white text-black"
                    disabled={loadingSupervisor}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray">Nome do Supervisor</Label>
                  <Input
                    value={supervisorName}
                    readOnly
                    placeholder="Nome será carregado automaticamente"
                    className="bg-gray-700 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cliente e Posto de Trabalho */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-seguranca-yellow flex items-center gap-2">
                <Building size={20} />
                Local da Visita
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cliente - PRIMEIRO */}
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray">Cliente *</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => handleInputChange('clientId', value)}
                  >
                    <SelectTrigger className="bg-white text-black">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      {clients.map((client) => (
                        <SelectItem 
                          key={client.id} 
                          value={client.id}
                          className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                        >
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Posto de Trabalho - SEGUNDO */}
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray">Posto de Trabalho *</Label>
                  <Select
                    value={formData.workPostId}
                    onValueChange={(value) => handleInputChange('workPostId', value)}
                    disabled={!formData.clientId}
                  >
                    <SelectTrigger className="bg-white text-black">
                      <SelectValue placeholder={
                        formData.clientId 
                          ? "Selecione o posto de trabalho" 
                          : "Selecione um cliente primeiro"
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      {filteredWorkPosts.map((workPost) => (
                        <SelectItem 
                          key={workPost.id} 
                          value={workPost.id}
                          className="text-seguranca-lightgray hover:bg-seguranca-graphite"
                        >
                          {workPost.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.clientId && filteredWorkPosts.length === 0 && (
                    <p className="text-xs text-yellow-500">
                      Nenhum posto de trabalho encontrado para este cliente
                    </p>
                  )}
                </div>
              </div>

              {/* Funcionários Presentes - Leitura de QR Code */}
              <div className="space-y-2 mt-4">
                <Label className="text-seguranca-lightgray flex items-center gap-2">
                  <QrCode size={16} />
                  Funcionários Presentes no Posto
                </Label>
                <Button
                  type="button"
                  onClick={() => setScanningQR(true)}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={scanningQR || !formData.workPostId}
                >
                  <QrCode size={16} />
                  {scanningQR ? 'Escaneando QR Code...' : 'Escanear QR Code dos Funcionários'}
                </Button>
                {!formData.workPostId && (
                  <p className="text-xs text-yellow-500">
                    Selecione o posto de trabalho primeiro
                  </p>
                )}
                {formData.presentEmployees && formData.presentEmployees.length > 0 && (
                  <div className="mt-2 p-3 bg-seguranca-graphite rounded-lg">
                    <p className="text-sm text-seguranca-lightgray font-medium">
                      ✓ {formData.presentEmployees.length} funcionário(s) registrado(s)
                    </p>
                  </div>
                )}
              </div>

              {/* Identificação Manual do Funcionário (quando QR Code não funciona) */}
              <div className="space-y-2 mt-4 pt-4 border-t border-gray-700">
                <Label className="text-seguranca-lightgray flex items-center gap-2">
                  <User size={16} />
                  Identificar Funcionário Manualmente (CPF ou Matrícula)
                </Label>
                <p className="text-xs text-gray-400">
                  Use este campo quando a leitura do QR Code não funcionar
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-seguranca-lightgray text-sm">CPF do Funcionário</Label>
                    <Input
                      id="employeeCpf"
                      value={employeeCpf}
                      onChange={(e) => handleEmployeeCpfChange(e.target.value)}
                      onBlur={handleEmployeeCpfBlur}
                      placeholder="000.000.000-00"
                      className="bg-white text-black"
                      disabled={loadingEmployee || !formData.workPostId}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-seguranca-lightgray text-sm">Matrícula do Funcionário</Label>
                    <Input
                      id="employeeRegistration"
                      value={employeeRegistration}
                      onChange={(e) => handleEmployeeRegistrationChange(e.target.value)}
                      onBlur={handleEmployeeRegistrationBlur}
                      placeholder="Digite a matrícula"
                      className="bg-white text-black"
                      disabled={loadingEmployee || !formData.workPostId}
                    />
                  </div>
                </div>
                {employeeName && (
                  <div className="mt-2 p-3 bg-green-900/30 border border-green-700 rounded-lg">
                    <p className="text-sm text-green-300 font-medium">
                      ✓ Funcionário encontrado: {employeeName}
                    </p>
                    {employeeWarning && (
                      <p className="text-xs text-yellow-400 mt-1">
                        ⚠️ {employeeWarning}
                      </p>
                    )}
                  </div>
                )}
                {!formData.workPostId && (
                  <p className="text-xs text-yellow-500">
                    Selecione o posto de trabalho primeiro
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data e Hora */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-seguranca-yellow flex items-center gap-2">
                <Clock size={20} />
                Data e Hora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray">Data da Visita *</Label>
                  <Input
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) => handleInputChange('visitDate', e.target.value)}
                    className="bg-white text-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray">Hora da Visita *</Label>
                  <Input
                    type="time"
                    value={formData.visitTime}
                    onChange={(e) => handleInputChange('visitTime', e.target.value)}
                    className="bg-white text-black"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value as VisitStatus)}
                >
                  <SelectTrigger className="bg-white text-black">
                    <SelectValue placeholder="Selecione o status">
                      {formData.status && (
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            formData.status === VisitStatus.SCHEDULED ? 'bg-blue-500' :
                            formData.status === VisitStatus.IN_PROGRESS ? 'bg-yellow-500' :
                            formData.status === VisitStatus.COMPLETED ? 'bg-green-500' :
                            formData.status === VisitStatus.CANCELLED ? 'bg-red-500' : 'bg-gray-500'
                          }`}></div>
                          <span>{
                            formData.status === VisitStatus.SCHEDULED ? 'Agendada' :
                            formData.status === VisitStatus.IN_PROGRESS ? 'Em Andamento' :
                            formData.status === VisitStatus.COMPLETED ? 'Concluída' :
                            formData.status === VisitStatus.CANCELLED ? 'Cancelada' : 'Selecione'
                          }</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value={VisitStatus.SCHEDULED} className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Agendada</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={VisitStatus.IN_PROGRESS} className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>Em Andamento</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={VisitStatus.COMPLETED} className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Concluída</span>
                      </div>
                    </SelectItem>
                    <SelectItem value={VisitStatus.CANCELLED} className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Cancelada</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Campo de motivo de cancelamento - aparece apenas quando status é CANCELLED */}
              {formData.status === VisitStatus.CANCELLED && (
                <div className="space-y-2">
                  <Label className="text-seguranca-lightgray">Motivo do Cancelamento *</Label>
                  <Textarea
                    value={formData.cancellationReason || ''}
                    onChange={(e) => handleInputChange('cancellationReason', e.target.value)}
                    placeholder="Informe o motivo do cancelamento"
                    className="bg-white text-black"
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Descrição e Observações */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-seguranca-yellow flex items-center gap-2">
                <FileText size={20} />
                Detalhes da Visita
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva o motivo da visita"
                  className="bg-white text-black"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-seguranca-lightgray">Observações</Label>
                <Textarea
                  value={formData.observations}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  placeholder="Observações adicionais"
                  className="bg-white text-black"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Anexos e Fotos */}
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-seguranca-yellow flex items-center gap-2">
                <Upload size={20} />
                Anexos e Fotos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Upload size={16} />
                    Anexar Arquivos
                  </Button>
                  {uploadedFiles.length > 0 && (
                    <p className="text-xs text-seguranca-lightgray mt-2">
                      {uploadedFiles.length} arquivo(s) selecionado(s)
                    </p>
                  )}
                </div>
                <div>
                  <Button
                    type="button"
                    onClick={() => setShowCameraModal(true)}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 border-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <Camera size={16} />
                    Tirar Foto
                  </Button>
                  {capturedPhotos.length > 0 && (
                    <p className="text-xs text-seguranca-lightgray mt-2">
                      {capturedPhotos.length} foto(s) capturada(s)
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.supervisorId || !formData.clientId || !formData.workPostId}
            className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-600"
          >
            {loading ? 'Salvando...' : visit ? 'Atualizar' : 'Salvar Visita'}
          </Button>
        </div>
      </DialogContent>

      <CameraCaptureModal
        open={showCameraModal}
        onOpenChange={setShowCameraModal}
        onCapture={handlePhotoCaptured}
      />
    </Dialog>
  );
};