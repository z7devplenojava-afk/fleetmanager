import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  Camera, 
  FileText, 
  User, 
  Building, 
  MapPin, 
  Clock,
  Shield,
  AlertTriangle,
  Stethoscope,
  Calendar
} from 'lucide-react';
import { ActivityReport, CreateActivityReportDTO } from '@/types/activityReport';
import { useToast } from '@/hooks/use-toast';
import { activityReportService } from '@/services/activityReportService';
import { workPostService } from '@/services/workPostService';
import CameraCaptureModal from './CameraCaptureModal';

interface ActivityReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report?: ActivityReport | null;
  onSave: (data: CreateActivityReportDTO) => void;
}

const ActivityReportModal: React.FC<ActivityReportModalProps> = ({
  open,
  onOpenChange,
  report,
  onSave
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CreateActivityReportDTO>({
    employeeId: '',
    clientId: '',
    workPostId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    description: '',
    absenceStatus: 'PRESENT'
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  // Estados para dados dos dropdowns
  const [employees, setEmployees] = useState<{id: string, name: string}[]>([]);
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [filteredWorkPosts, setFilteredWorkPosts] = useState<{id: string, name: string}[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingWorkPosts, setLoadingWorkPosts] = useState(false);
  
  // Carregar postos quando cliente mudar
  useEffect(() => {
    const loadWorkPostsForClient = async () => {
      if (!formData.clientId) {
        setFilteredWorkPosts([]);
        return;
      }

      try {
        setLoadingWorkPosts(true);
        console.log('🔍 Carregando postos para o cliente:', formData.clientId);
        
        // Usar o método específico para buscar postos por cliente
        const posts = await workPostService.getWorkPostsByClient(formData.clientId);
        console.log('✅ Postos carregados para o cliente:', posts.length);
        
        const mappedPosts = posts.map((wp: any) => ({
          id: wp.id?.toString() || wp.id,
          name: wp.name || wp.postCode || 'Sem nome'
        }));
        
        console.log('✅ Postos mapeados:', mappedPosts.length);
        if (mappedPosts.length > 0) {
          console.log('📋 Postos encontrados:', mappedPosts.map(wp => ({ id: wp.id, name: wp.name })));
        } else {
          console.warn('⚠️ Nenhum posto encontrado para o cliente:', formData.clientId);
        }
        
        setFilteredWorkPosts(mappedPosts);
      } catch (error: any) {
        console.error('❌ Erro ao carregar postos por cliente:', error);
        console.error('❌ Detalhes do erro:', {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status
        });
        setFilteredWorkPosts([]);
        toast({
          title: 'Aviso',
          description: 'Não foi possível carregar os postos de trabalho para este cliente.',
          variant: 'destructive'
        });
      } finally {
        setLoadingWorkPosts(false);
      }
    };

    loadWorkPostsForClient();
  }, [formData.clientId]);

  // Preservar workPostId quando os postos são carregados e há um report sendo editado
  useEffect(() => {
    if (report && filteredWorkPosts.length > 0) {
      const reportWorkPostId = report.workPostId?.toString() || report.workPostId || '';
      
      console.log('🔍 Verificando preservação de workPostId:', {
        reportWorkPostId,
        formDataWorkPostId: formData.workPostId,
        filteredWorkPostsCount: filteredWorkPosts.length,
        availableWorkPostIds: filteredWorkPosts.map(wp => ({ id: wp.id, name: wp.name }))
      });
      
      if (reportWorkPostId) {
        // Verificar se o workPostId do report existe na lista de postos carregados
        // Comparar tanto como string quanto como UUID
        const workPostExists = filteredWorkPosts.some(wp => {
          const wpId = wp.id?.toString() || wp.id || '';
          return wpId === reportWorkPostId;
        });
        
        if (workPostExists) {
          if (formData.workPostId !== reportWorkPostId) {
            console.log('✅ Atualizando workPostId do report:', reportWorkPostId);
            setFormData(prev => ({ ...prev, workPostId: reportWorkPostId }));
          } else {
            console.log('✅ workPostId já está correto:', formData.workPostId);
          }
        } else {
          console.warn('⚠️ WorkPostId do report não encontrado na lista de postos:', reportWorkPostId);
          console.warn('⚠️ Postos disponíveis:', filteredWorkPosts.map(wp => ({ id: wp.id, name: wp.name })));
          // Tentar encontrar por nome como fallback
          if (report.workPostName) {
            const foundByName = filteredWorkPosts.find(wp => wp.name === report.workPostName);
            if (foundByName) {
              const foundId = foundByName.id?.toString() || foundByName.id || '';
              console.log('✅ Encontrado posto por nome, atualizando workPostId:', foundId);
              setFormData(prev => ({ ...prev, workPostId: foundId }));
            } else {
              console.warn('⚠️ Posto não encontrado nem por ID nem por nome. Nome procurado:', report.workPostName);
            }
          }
        }
      } else {
        console.warn('⚠️ report.workPostId está vazio ou undefined');
      }
    }
  }, [report, filteredWorkPosts]);

  useEffect(() => {
    if (report) {
      console.log('📋 Inicializando formData com dados do report:', {
        employeeId: report.employeeId,
        clientId: report.clientId,
        workPostId: report.workPostId,
        workPostName: report.workPostName
      });
      setFormData({
        employeeId: report.employeeId || '',
        clientId: report.clientId || '',
        workPostId: report.workPostId || '',
        date: report.date || '',
        startTime: report.startTime || '',
        endTime: report.endTime || '',
        description: report.description || '',
        ballisticPlate: report.ballisticPlate,
        weaponRegistry: report.weaponRegistry,
        absenceStatus: report.absenceStatus || 'PRESENT',
        divergences: report.divergences,
        medicalConsultation: report.medicalConsultation
      });
    } else {
      setFormData({
        employeeId: '',
        clientId: '',
        workPostId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        description: '',
        absenceStatus: 'PRESENT'
      });
    }
    setPhotos([]);
    setDocuments([]);
  }, [report, open]);

  // Carregar dados quando modal abrir
  useEffect(() => {
    if (open) {
      loadDropdownData();
    }
  }, [open]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar posto selecionado quando cliente mudar (exceto se estiver editando e o cliente não mudou)
    if (field === 'clientId') {
      // Só limpar se o cliente realmente mudou e não estamos preservando o workPostId do report
      if (!report || report.clientId !== value) {
        setFormData(prev => ({ ...prev, workPostId: '' }));
      }
    }
  };

  // Carregar dados dos dropdowns
  const loadDropdownData = async () => {
    try {
      setLoadingData(true);
      console.log('🔄 Iniciando carregamento de dados dos dropdowns...');
      
      // Carregar funcionários
      try {
        const employeesResponse = await fetch('/api/employees/basic');
        if (employeesResponse.ok) {
          const employeesData = await employeesResponse.json();
          const mappedEmployees = (employeesData.employees || []).map((emp: any) => ({
            id: emp.id?.toString() || emp.id,
            name: emp.name || 'Sem nome'
          }));
          setEmployees(mappedEmployees);
          console.log('✅ Funcionários carregados:', mappedEmployees.length);
        } else {
          console.error('❌ Erro ao carregar funcionários:', employeesResponse.status);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar funcionários:', error);
      }
      
      // Carregar clientes
      try {
        console.log('🔍 Buscando clientes em /api/clients/select...');
        const clientsResponse = await fetch('/api/clients/select');
        console.log('📡 Resposta do servidor:', clientsResponse.status, clientsResponse.statusText);
        
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          console.log('👥 Clientes carregados (raw):', clientsData?.length || 0);
          console.log('👥 Primeiro cliente (exemplo):', clientsData?.[0]);
          
          // Mapear os dados para garantir formato correto
          const mappedClients = (clientsData || []).map((client: any) => ({
            id: client.id?.toString() || client.id,
            name: client.name || 'Sem nome'
          }));
          
          console.log('✅ Clientes mapeados:', mappedClients.length);
          if (mappedClients.length > 0) {
            console.log('👥 Primeiros 3 clientes:', mappedClients.slice(0, 3));
          } else {
            console.warn('⚠️ Nenhum cliente encontrado!');
          }
          
          setClients(mappedClients);
        } else {
          console.error('❌ Erro ao carregar clientes:', clientsResponse.status, clientsResponse.statusText);
          const errorText = await clientsResponse.text();
          console.error('❌ Detalhes do erro:', errorText);
          toast({
            title: 'Aviso',
            description: `Não foi possível carregar os clientes (${clientsResponse.status}). Verifique sua conexão.`,
            variant: 'destructive'
          });
        }
      } catch (error: any) {
        console.error('❌ Erro ao buscar clientes:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar clientes: ' + (error.message || 'Erro desconhecido'),
          variant: 'destructive'
        });
      }
      
      // Não precisamos mais carregar todos os postos antecipadamente
      // Os postos serão carregados dinamicamente quando um cliente for selecionado
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados dos dropdowns:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoadingData(false);
      console.log('✅ Carregamento de dados concluído');
    }
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof CreateActivityReportDTO] as any,
        [field]: value
      }
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      toast({
        title: 'Aviso',
        description: 'Apenas arquivos de imagem são permitidos para fotos.',
        variant: 'default'
      });
    }
    
    setPhotos(prev => [...prev, ...validFiles]);
  };

  const handleCameraCapture = () => {
    setShowCameraModal(true);
  };

  const handlePhotoCaptured = (file: File) => {
    setPhotos(prev => [...prev, file]);
    toast({
      title: 'Sucesso',
      description: 'Foto capturada com sucesso!',
    });
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDocuments(prev => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.employeeId || !formData.clientId || !formData.workPostId) {
      toast({
        title: 'Erro',
        description: 'Funcionário, Cliente e Posto de Trabalho são obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      toast({
        title: 'Erro',
        description: 'Horário de início e fim são obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: 'Erro',
        description: 'Descrição da atividade é obrigatória.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Primeiro, salvar o relatório básico
      const savedReport = await onSave(formData);
      
      // Se há fotos para upload, fazer upload após salvar o relatório
      if (photos.length > 0 && savedReport?.id) {
        toast({
          title: 'Upload em andamento',
          description: 'Fazendo upload das fotos...',
        });
        
        await activityReportService.uploadMultiplePhotos(savedReport.id, photos);
        
        toast({
          title: 'Sucesso',
          description: 'Fotos enviadas com sucesso!',
        });
      }
      
      // Se há documentos para upload, fazer upload após salvar o relatório
      if (documents.length > 0 && savedReport?.id) {
        toast({
          title: 'Upload em andamento',
          description: 'Fazendo upload dos documentos...',
        });
        
        await activityReportService.uploadMultipleDocuments(savedReport.id, documents);
        
        toast({
          title: 'Sucesso',
          description: 'Documentos enviados com sucesso!',
        });
      }
      
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar relatório. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const calculateBallisticPlateExpiry = (issueDate: string) => {
    const date = new Date(issueDate);
    date.setFullYear(date.getFullYear() + 6);
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto w-[98vw] sm:w-[95vw] md:w-[90vw] lg:w-full p-0 sm:p-6">
        <DialogHeader className="px-4 sm:px-0 pt-4 sm:pt-0 pb-2">
          <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-semibold">
            {report ? 'Editar Relatório de Atividade' : 'Novo Relatório de Atividade'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 px-4 sm:px-0">
          {/* Informações Básicas */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-sm font-medium">Funcionário *</Label>
                <Select value={formData.employeeId} onValueChange={(value) => handleInputChange('employeeId', value)} disabled={loadingData}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={loadingData ? "Carregando funcionários..." : "Selecione o funcionário"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId" className="text-sm font-medium">Cliente *</Label>
                <Select value={formData.clientId} onValueChange={(value) => handleInputChange('clientId', value)} disabled={loadingData}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={loadingData ? "Carregando clientes..." : "Selecione o cliente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workPostId" className="text-sm font-medium">Posto de Trabalho *</Label>
                <Select 
                  value={formData.workPostId || ''} 
                  onValueChange={(value) => handleInputChange('workPostId', value)}
                  disabled={!formData.clientId || loadingWorkPosts}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={
                      !formData.clientId 
                        ? "Selecione um cliente primeiro" 
                        : loadingWorkPosts 
                          ? "Carregando postos..." 
                          : "Selecione o posto"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingWorkPosts ? (
                      <SelectItem value="loading" disabled>Carregando postos...</SelectItem>
                    ) : filteredWorkPosts.length === 0 ? (
                      <SelectItem value="no-posts" disabled>Nenhum posto encontrado</SelectItem>
                    ) : (
                      filteredWorkPosts.map((workPost) => (
                        <SelectItem key={workPost.id} value={workPost.id}>
                          {workPost.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formData.clientId && filteredWorkPosts.length === 0 && !loadingWorkPosts && (
                  <p className="text-xs text-yellow-500">
                    Nenhum posto de trabalho encontrado para este cliente
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Data *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="h-10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-medium">Hora Início *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="h-10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-medium">Hora Fim *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="h-10"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Descrição da Atividade */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Descrição da Atividade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Descrição *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhadamente as atividades realizadas durante o turno..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="min-h-[100px] resize-y"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Equipamentos de Segurança */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                Equipamentos de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border">
                <h4 className="font-medium text-orange-800 dark:text-orange-200 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Placa Balística
                </h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="ballisticPlateNumber" className="text-sm font-medium">Número da Placa</Label>
                    <Input
                      id="ballisticPlateNumber"
                      placeholder="BP-001-2025"
                      value={formData.ballisticPlate?.number || ''}
                      onChange={(e) => handleNestedInputChange('ballisticPlate', 'number', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ballisticPlateExpiry" className="text-sm font-medium">Validade (6 anos)</Label>
                    <Input
                      id="ballisticPlateExpiry"
                      type="date"
                      value={formData.ballisticPlate?.validUntil || ''}
                      onChange={(e) => handleNestedInputChange('ballisticPlate', 'validUntil', e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border">
                <h4 className="font-medium text-red-800 dark:text-red-200 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Registro da Arma
                </h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="weaponRegistryNumber" className="text-sm font-medium">Número do Registro</Label>
                    <Input
                      id="weaponRegistryNumber"
                      placeholder="AR-12345"
                      value={formData.weaponRegistry?.number || ''}
                      onChange={(e) => handleNestedInputChange('weaponRegistry', 'number', e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weaponRegistryExpiry" className="text-sm font-medium">Validade do Registro</Label>
                    <Input
                      id="weaponRegistryExpiry"
                      type="date"
                      value={formData.weaponRegistry?.validUntil || ''}
                      onChange={(e) => handleNestedInputChange('weaponRegistry', 'validUntil', e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status de Presença e Divergências */}
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                Status e Observações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="absenceStatus" className="text-sm font-medium">Status de Presença</Label>
                  <Select value={formData.absenceStatus} onValueChange={(value) => handleInputChange('absenceStatus', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRESENT">Presente</SelectItem>
                      <SelectItem value="ABSENT">Ausente</SelectItem>
                      <SelectItem value="LATE">Atraso</SelectItem>
                      <SelectItem value="MEDICAL_LEAVE">Atestado Médico</SelectItem>
                      <SelectItem value="JUSTIFIED">Falta Justificada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="divergences" className="text-sm font-medium">Relatar Divergências</Label>
                <Textarea
                  id="divergences"
                  placeholder="Descreva qualquer divergência, incidente ou situação anormal ocorrida..."
                  value={formData.divergences || ''}
                  onChange={(e) => handleInputChange('divergences', e.target.value)}
                  rows={3}
                  className="min-h-[80px] resize-y"
                />
              </div>
            </CardContent>
          </Card>

          {/* Consulta Médica */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5" />
                Consulta Médica
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medicalDate" className="text-sm font-medium">Data da Consulta</Label>
                <Input
                  id="medicalDate"
                  type="date"
                  value={formData.medicalConsultation?.date || ''}
                  onChange={(e) => handleNestedInputChange('medicalConsultation', 'date', e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalReason" className="text-sm font-medium">Motivo</Label>
                <Input
                  id="medicalReason"
                  placeholder="Consulta de rotina, exame periódico..."
                  value={formData.medicalConsultation?.reason || ''}
                  onChange={(e) => handleNestedInputChange('medicalConsultation', 'reason', e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalDoctor" className="text-sm font-medium">Médico Responsável</Label>
                <Input
                  id="medicalDoctor"
                  placeholder="Dr. Nome do Médico"
                  value={formData.medicalConsultation?.doctor || ''}
                  onChange={(e) => handleNestedInputChange('medicalConsultation', 'doctor', e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicalResult" className="text-sm font-medium">Resultado</Label>
                <Input
                  id="medicalResult"
                  placeholder="Apto para o trabalho, restrições..."
                  value={formData.medicalConsultation?.result || ''}
                  onChange={(e) => handleNestedInputChange('medicalConsultation', 'result', e.target.value)}
                  className="h-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Upload de Fotos */}
          <Card className="border-l-4 border-l-cyan-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                Fotos das Atividades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Adicionar Fotos</Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      id="photos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="h-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCameraCapture}
                    className="h-10 px-4 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Usar Câmera</span>
                    <span className="sm:hidden">Câmera</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Você pode fazer upload de arquivos ou usar a câmera do dispositivo para capturar fotos
                </p>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25 hover:border-cyan-500 transition-colors">
                        <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <p className="text-xs text-center mt-1 truncate px-1">{photo.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload de Documentos */}
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documents" className="text-sm font-medium">Adicionar Documentos</Label>
                <Input
                  id="documents"
                  type="file"
                  multiple
                  onChange={handleDocumentUpload}
                  className="h-10"
                />
              </div>

              {documents.length > 0 && (
                <div className="space-y-2">
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{doc.name}</span>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {(doc.size / 1024).toFixed(1)} KB
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 h-8 w-8 p-0"
                        onClick={() => removeDocument(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t bg-muted/30 -mx-4 sm:-mx-0 px-4 sm:px-0 py-4 sm:py-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="w-full sm:w-auto h-11 order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto h-11 order-1 sm:order-2 bg-blue-600 hover:bg-blue-700"
            >
              {report ? 'Atualizar Relatório' : 'Criar Relatório'}
            </Button>
          </div>
        </form>
      </DialogContent>

      <CameraCaptureModal
        open={showCameraModal}
        onOpenChange={setShowCameraModal}
        onCapture={handlePhotoCaptured}
      />
    </Dialog>
  );
};

export default ActivityReportModal;