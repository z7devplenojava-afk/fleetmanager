'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ClipboardCheck,
  Plus,
  FileText,
  History,
  Loader2,
  Trash2,
  Gauge,
  QrCode,
  Pencil,
} from 'lucide-react';
import { CameraCapture } from '@/components/frota/CameraCapture';
import { QRCodeScanner } from '@/components/frota/QRCodeScanner';
import ChecklistItemRow from '@/components/frota/ChecklistItemRow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import clientChecklistService from '@/services/clientChecklistService';
import clientService from '@/services/clientService';
import fleetService from '@/services/fleetService';
import driverService from '@/services/driverService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type {
  ClientChecklistTemplate,
  CreateClientChecklistTemplateDTO,
  CreateClientChecklistRecordDTO,
  ChecklistResponse,
} from '@/types/clientChecklist';

const GestaoChecklistCliente: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'new' | 'templates' | 'history'>('new');
  const [isRecordFormOpen, setIsRecordFormOpen] = useState(false);
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    templateId: '',
    vehicleId: '',
    driverId: '',
    kmReading: '',
    observations: '',
    equipmentReleased: undefined as boolean | undefined,
  });
  const [responses, setResponses] = useState<Record<string, ChecklistResponse>>({});
  const [odometerPhotoFile, setOdometerPhotoFile] = useState<File | null>(null);
  const [vehiclePhotos, setVehiclePhotos] = useState<File[]>([]);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState<{
    clientId: string;
    name: string;
    revision: string;
    items: { title: string; orderIndex: number; required: boolean }[];
  }>({ clientId: '', name: '', revision: '', items: [] });
  const [filters, setFilters] = useState({
    clientId: 'all',
    templateId: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-select'],
    queryFn: clientService.getClientsForSelect,
  });

  const clientIdForTemplates = formData.clientId || (activeTab === 'history' ? filters.clientId : '');
  const { data: templates = [] } = useQuery({
    queryKey: ['client-checklist-templates', clientIdForTemplates],
    queryFn: () => clientChecklistService.getTemplates(clientIdForTemplates),
    enabled: !!clientIdForTemplates && clientIdForTemplates !== 'all',
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fleetService.getVehicles,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: driverService.getDrivers,
  });

  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: [
      'client-checklist-records',
      filters.clientId,
      filters.templateId,
      filters.dateFrom,
      filters.dateTo,
    ],
    queryFn: () =>
      clientChecklistService.getRecords({
        clientId: filters.clientId === 'all' ? undefined : filters.clientId,
        templateId: filters.templateId === 'all' ? undefined : filters.templateId,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      }),
  });

  const selectedTemplate = templates.find((t) => t.id === formData.templateId);

  const createRecordMutation = useMutation({
    mutationFn: async (payload: {
      data: CreateClientChecklistRecordDTO;
      odometerFile?: File;
      vehiclePhotos?: File[];
    }) => {
      const created = await clientChecklistService.createRecord(payload.data);
      if (payload.odometerFile) {
        await clientChecklistService.uploadOdometerPhoto(created.id, payload.odometerFile);
      }
      if (payload.vehiclePhotos && payload.vehiclePhotos.length > 0) {
        await clientChecklistService.uploadVehiclePhotos(created.id, payload.vehiclePhotos);
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-checklist-records'] });
      toast({ title: 'Sucesso', description: 'Checklist registrado com sucesso.' });
      handleCloseRecordForm();
    },
    onError: (err: Error) => {
      toast({
        title: 'Erro',
        description: err.message || 'Falha ao registrar checklist.',
        variant: 'destructive',
      });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: (dto: CreateClientChecklistTemplateDTO) => clientChecklistService.createTemplate(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-checklist-templates'] });
      toast({ title: 'Sucesso', description: 'Modelo criado com sucesso.' });
      handleCloseTemplateForm();
    },
    onError: (err: Error) => {
      toast({ title: 'Erro', description: err.message || 'Falha ao criar modelo.', variant: 'destructive' });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateClientChecklistTemplateDTO> }) =>
      clientChecklistService.updateTemplate(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-checklist-templates'] });
      toast({ title: 'Sucesso', description: 'Modelo atualizado com sucesso.' });
      handleCloseTemplateForm();
    },
    onError: (err: Error) => {
      toast({ title: 'Erro', description: err.message || 'Falha ao atualizar modelo.', variant: 'destructive' });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => clientChecklistService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-checklist-templates'] });
      toast({ title: 'Sucesso', description: 'Modelo excluído.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro', description: err.message || 'Falha ao excluir.', variant: 'destructive' });
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: (id: string) => clientChecklistService.deleteRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-checklist-records'] });
      toast({ title: 'Sucesso', description: 'Registro excluído.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro', description: err.message || 'Falha ao excluir.', variant: 'destructive' });
    },
  });

  const handleOpenRecordForm = () => {
    setFormData({
      clientId: '',
      templateId: '',
      vehicleId: '',
      driverId: '',
      kmReading: '',
      observations: '',
      equipmentReleased: undefined,
    });
    setResponses({});
    setOdometerPhotoFile(null);
    setVehiclePhotos([]);
    setIsRecordFormOpen(true);
  };

  const handleCloseRecordForm = () => {
    setIsRecordFormOpen(false);
    setIsQRScannerOpen(false);
  };

  const handleOpenTemplateForm = (template?: ClientChecklistTemplate) => {
    if (template) {
      setEditingTemplateId(template.id);
      setTemplateForm({
        clientId: template.clientId,
        name: template.name,
        revision: template.revision || '',
        items: template.items.map((i) => ({
          title: i.title,
          orderIndex: i.orderIndex,
          required: i.required,
        })),
      });
    } else {
      setEditingTemplateId(null);
      setTemplateForm({
        clientId: formData.clientId || '',
        name: '',
        revision: '',
        items: [],
      });
    }
    setIsTemplateFormOpen(true);
  };

  const handleCloseTemplateForm = () => {
    setIsTemplateFormOpen(false);
    setEditingTemplateId(null);
  };

  const handleResponseChange = (itemId: string, value: ChecklistResponse) => {
    setResponses((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleSubmitRecord = () => {
    const km = Number.parseInt(formData.kmReading, 10);
    if (!formData.clientId || !formData.templateId) {
      toast({ title: 'Campos obrigatórios', description: 'Selecione cliente e modelo.', variant: 'destructive' });
      return;
    }
    if (Number.isNaN(km) || km < 0) {
      toast({ title: 'KM inválido', description: 'Informe a quilometragem.', variant: 'destructive' });
      return;
    }
    createRecordMutation.mutate({
      data: {
        templateId: formData.templateId,
        clientId: formData.clientId,
        vehicleId: formData.vehicleId || undefined,
        driverId: formData.driverId || undefined,
        kmReading: km,
        responses: Object.keys(responses).length > 0 ? responses : undefined,
        observations: formData.observations || undefined,
        equipmentReleased: formData.equipmentReleased,
        inspectorName: user?.name,
      },
      odometerFile: odometerPhotoFile || undefined,
      vehiclePhotos: vehiclePhotos.length > 0 ? vehiclePhotos : undefined,
    });
  };

  const handleSubmitTemplate = () => {
    if (!templateForm.clientId || !templateForm.name.trim()) {
      toast({ title: 'Campos obrigatórios', description: 'Cliente e nome do modelo.', variant: 'destructive' });
      return;
    }
    if (editingTemplateId) {
      updateTemplateMutation.mutate({
        id: editingTemplateId,
        dto: {
          clientId: templateForm.clientId,
          name: templateForm.name,
          revision: templateForm.revision || undefined,
          items: templateForm.items.map((i, idx) => ({
            title: i.title,
            orderIndex: idx,
            required: i.required,
          })),
        },
      });
    } else {
      createTemplateMutation.mutate({
        clientId: templateForm.clientId,
        name: templateForm.name,
        revision: templateForm.revision || undefined,
        items: templateForm.items.map((i, idx) => ({
          title: i.title,
          orderIndex: idx,
          required: i.required,
        })),
      });
    }
  };

  const addTemplateItem = () => {
    setTemplateForm((prev) => ({
      ...prev,
      items: [...prev.items, { title: '', orderIndex: prev.items.length, required: false }],
    }));
  };

  const removeTemplateItem = (idx: number) => {
    setTemplateForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const updateTemplateItem = (idx: number, field: 'title' | 'required', value: string | boolean) => {
    setTemplateForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      ),
    }));
  };

  return (
    <StandardLayout title="Gestão Checklist por Cliente">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-seguranca-lightgray flex items-center gap-2">
            <ClipboardCheck className="h-8 w-8 text-seguranca-yellow" />
            Gestão Checklist por Cliente
          </h1>
          <p className="text-gray-400">
            Modelos de checklist customizados por cliente. Preenchimento rápido com QR Code e câmera.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            variant={activeTab === 'new' ? 'default' : 'outline'}
            onClick={() => setActiveTab('new')}
            size="sm"
            className={activeTab === 'new' ? 'bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90' : ''}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo registro
          </Button>
          <Button
            variant={activeTab === 'templates' ? 'default' : 'outline'}
            onClick={() => setActiveTab('templates')}
            size="sm"
            className={activeTab === 'templates' ? 'bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90' : ''}
          >
            <FileText className="mr-2 h-4 w-4" /> Modelos
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            size="sm"
            className={activeTab === 'history' ? 'bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90' : ''}
          >
            <History className="mr-2 h-4 w-4" /> Histórico
          </Button>
        </div>

        {activeTab === 'new' && (
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="pt-6">
              <p className="text-gray-400 mb-4">
                Selecione o cliente e o modelo de checklist. Use o QR Code para preencher veículo e motorista.
              </p>
              <Button
                onClick={handleOpenRecordForm}
                className="bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90"
              >
                <Plus className="mr-2 h-4 w-4" /> Novo checklist
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'templates' && (
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray">Modelos de checklist</CardTitle>
              <p className="text-gray-400 text-sm">
                Crie e edite modelos de checklist por cliente. Cada modelo possui itens com respostas C (Conforme), NC
                (Não Conforme) ou NA (Não Aplicável).
              </p>
              <Button
                onClick={() => handleOpenTemplateForm()}
                className="mt-4 bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90 w-fit"
              >
                <Plus className="mr-2 h-4 w-4" /> Novo modelo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Filtrar por cliente</Label>
                <Select
                  value={filters.clientId}
                  onValueChange={(v) => setFilters((f) => ({ ...f, clientId: v }))}
                >
                  <SelectTrigger className="w-[280px] bg-seguranca-black border-gray-600">
                    <SelectValue placeholder="Todos os clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-4 space-y-2">
                {filters.clientId !== 'all' &&
                  templates.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-seguranca-black border border-gray-700"
                    >
                      <div>
                        <p className="font-medium text-seguranca-lightgray">{t.name}</p>
                        <p className="text-sm text-gray-400">
                          {t.clientName} {t.revision && `• Rev. ${t.revision}`} • {t.items.length} itens
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTemplateForm(t)}
                          className="border-gray-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => {
                            if (globalThis.confirm('Excluir este modelo?')) {
                              deleteTemplateMutation.mutate(t.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                {filters.clientId === 'all' && (
                  <p className="text-gray-400 py-4">Selecione um cliente para ver os modelos.</p>
                )}
                {filters.clientId !== 'all' && templates.length === 0 && (
                  <p className="text-gray-400 py-4">Nenhum modelo cadastrado para este cliente.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'history' && (
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray">Histórico de registros</CardTitle>
              <div className="flex flex-wrap gap-2 mt-4">
                <Select
                  value={filters.clientId}
                  onValueChange={(v) => setFilters((f) => ({ ...f, clientId: v }))}
                >
                  <SelectTrigger className="w-[200px] bg-seguranca-black border-gray-600">
                    <SelectValue placeholder="Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.templateId}
                  onValueChange={(v) => setFilters((f) => ({ ...f, templateId: v }))}
                >
                  <SelectTrigger className="w-[180px] bg-seguranca-black border-gray-600">
                    <SelectValue placeholder="Modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {templates
                      .filter((t) => filters.clientId === 'all' || t.clientId === filters.clientId)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                  className="w-[140px] bg-seguranca-black border-gray-600"
                />
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                  className="w-[140px] bg-seguranca-black border-gray-600"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-seguranca-black/50 text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="p-4">Data/Hora</th>
                      <th className="p-4">Cliente</th>
                      <th className="p-4">Modelo</th>
                      <th className="p-4">Veículo</th>
                      <th className="p-4">Motorista</th>
                      <th className="p-4">KM</th>
                      <th className="p-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {recordsLoading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-seguranca-yellow" />
                        </td>
                      </tr>
                    ) : (
                      records.map((r) => (
                        <tr key={r.id} className="hover:bg-seguranca-black/30 transition-colors">
                          <td className="p-4 text-gray-300">
                            {new Date(r.occurredAt).toLocaleString('pt-BR')}
                          </td>
                          <td className="p-4 font-medium text-seguranca-lightgray">{r.clientName}</td>
                          <td className="p-4">{r.templateName}</td>
                          <td className="p-4">{r.vehiclePlate || '-'}</td>
                          <td className="p-4">{r.driverName || '-'}</td>
                          <td className="p-4 font-mono">{r.kmReading ?? '-'}</td>
                          <td className="p-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => {
                                if (globalThis.confirm('Excluir este registro?')) {
                                  deleteRecordMutation.mutate(r.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                    {!recordsLoading && records.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-gray-400">
                          Nenhum registro encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog: Novo registro */}
      <Dialog open={isRecordFormOpen} onOpenChange={(open) => !open && handleCloseRecordForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">Novo checklist</DialogTitle>
            <DialogDescription>Preencha o checklist. Use QR Code para identificar veículo e motorista.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-seguranca-lightgray">Identificação</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsQRScannerOpen(true)}
                className="border-gray-600"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Ler QR Code
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cliente *</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(v) => setFormData((f) => ({ ...f, clientId: v, templateId: '' }))}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modelo *</Label>
                <Select
                  value={formData.templateId}
                  onValueChange={(v) => setFormData((f) => ({ ...f, templateId: v }))}
                  disabled={!formData.clientId}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.items.length} itens)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Veículo</Label>
                <Select
                  value={formData.vehicleId || 'none'}
                  onValueChange={(v) => setFormData((f) => ({ ...f, vehicleId: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600">
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.plate} - {v.brand} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Motorista</Label>
                <Select
                  value={formData.driverId || 'none'}
                  onValueChange={(v) => setFormData((f) => ({ ...f, driverId: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600">
                    <SelectValue placeholder="Selecione o motorista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <QRCodeScanner
              open={isQRScannerOpen}
              onOpenChange={setIsQRScannerOpen}
              onScan={(result) => {
                setFormData((prev) => ({
                  ...prev,
                  ...(result.clientId && { clientId: result.clientId }),
                  ...(result.vehicleId && { vehicleId: result.vehicleId }),
                  ...(result.driverId && { driverId: result.driverId }),
                }));
                const parts: string[] = [];
                if (result.clientId) parts.push('cliente');
                if (result.vehicleId) parts.push('veículo');
                if (result.driverId) parts.push('motorista');
                toast({ title: 'QR Code lido', description: parts.length ? `${parts.join(', ')} preenchidos.` : 'Dados preenchidos.' });
              }}
            />
            <div className="space-y-3 p-4 rounded-lg border border-gray-700 bg-seguranca-black/50">
              <div className="flex items-center gap-2 text-seguranca-yellow font-medium">
                <Gauge className="h-5 w-5" />
                Odômetro
              </div>
              <div>
                <Label>Quilometragem (KM)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.kmReading}
                  onChange={(e) => setFormData((f) => ({ ...f, kmReading: e.target.value }))}
                  placeholder="Ex: 45000"
                  className="bg-seguranca-black border-gray-600"
                />
              </div>
              <CameraCapture
                label="Foto do odômetro (opcional)"
                onPhotosChange={(photos) => setOdometerPhotoFile(photos[0] ?? null)}
                maxPhotos={1}
                disabled={createRecordMutation.isPending}
              />
              <div className="pt-4 border-t border-gray-700">
                <CameraCapture
                  label="Fotos do veículo (câmera)"
                  onPhotosChange={setVehiclePhotos}
                  maxPhotos={10}
                  disabled={createRecordMutation.isPending}
                />
              </div>
            </div>
            {selectedTemplate && selectedTemplate.items.length > 0 && (
              <div>
                <Label className="mb-2 block">Lista de verificação (C / NC / NA)</Label>
                <div className="space-y-0 max-h-[280px] overflow-y-auto pr-2 border border-gray-700 rounded p-3">
                  {selectedTemplate.items.map((item) => (
                    <ChecklistItemRow
                      key={item.id}
                      itemId={item.id}
                      title={item.title}
                      value={responses[item.id]}
                      onChange={handleResponseChange}
                      required={item.required}
                      disabled={createRecordMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.observations}
                onChange={(e) => setFormData((f) => ({ ...f, observations: e.target.value }))}
                placeholder="Observações gerais..."
                rows={2}
                className="bg-seguranca-black border-gray-600"
              />
            </div>
            <div className="flex items-center gap-4">
              <Label>Equipamento liberado?</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.equipmentReleased === true ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData((f) => ({ ...f, equipmentReleased: true }))}
                  className={formData.equipmentReleased === true ? 'bg-green-600' : 'border-gray-600'}
                >
                  Sim
                </Button>
                <Button
                  type="button"
                  variant={formData.equipmentReleased === false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData((f) => ({ ...f, equipmentReleased: false }))}
                  className={formData.equipmentReleased === false ? 'bg-red-600' : 'border-gray-600'}
                >
                  Não
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseRecordForm} className="border-gray-600">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitRecord}
              disabled={createRecordMutation.isPending}
              className="bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90"
            >
              {createRecordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Modelo de checklist */}
      <Dialog open={isTemplateFormOpen} onOpenChange={(open) => !open && handleCloseTemplateForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">
              {editingTemplateId ? 'Editar modelo' : 'Novo modelo'}
            </DialogTitle>
            <DialogDescription>
              Defina o nome, revisão e os itens do checklist. Cada item terá opções C, NC e NA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente *</Label>
              <Select
                value={templateForm.clientId}
                onValueChange={(v) => setTemplateForm((f) => ({ ...f, clientId: v }))}
                disabled={!!editingTemplateId}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome do modelo *</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Checklist Ônibus PHR"
                  className="bg-seguranca-black border-gray-600"
                />
              </div>
              <div>
                <Label>Revisão</Label>
                <Input
                  value={templateForm.revision}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, revision: e.target.value }))}
                  placeholder="Ex: 16"
                  className="bg-seguranca-black border-gray-600"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Itens do checklist</Label>
                <Button type="button" variant="outline" size="sm" onClick={addTemplateItem} className="border-gray-600">
                  <Plus className="h-4 w-4 mr-2" /> Adicionar item
                </Button>
              </div>
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {templateForm.items.map((item, idx) => (
                  <div key={`${item.title}-${idx}`} className="flex gap-2 items-center p-2 rounded bg-seguranca-black border border-gray-700">
                    <Input
                      value={item.title}
                      onChange={(e) => updateTemplateItem(idx, 'title', e.target.value)}
                      placeholder="Título do item"
                      className="flex-1 bg-seguranca-graphite border-gray-600"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-400 shrink-0">
                      <input
                        type="checkbox"
                        checked={item.required}
                        onChange={(e) => updateTemplateItem(idx, 'required', e.target.checked)}
                        className="rounded"
                      />
                      {' '}Obrigatório
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-500/10 shrink-0"
                      onClick={() => removeTemplateItem(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseTemplateForm} className="border-gray-600">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitTemplate}
              disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
              className="bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90"
            >
              {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingTemplateId ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StandardLayout>
  );
};

export default GestaoChecklistCliente;
