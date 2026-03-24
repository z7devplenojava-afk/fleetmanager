import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, MapPin, Clock, User, Shield } from 'lucide-react';
import { Ronda, CreateRondaDTO, RondaTipo, RondaPrioridade, RondaStatus } from '@/types/rondas';
import { rondasService } from '@/services/rondasService';
import { workPostService, WorkPost } from '@/services/workPostService';
import { employeeService } from '@/services/employeeService';

interface RondaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ronda?: Ronda | null;
  onSave: (ronda: Ronda) => void;
}

export const RondaFormModal: React.FC<RondaFormModalProps> = ({
  open,
  onOpenChange,
  ronda,
  onSave
}) => {
  const [formData, setFormData] = useState<CreateRondaDTO>({
    nome: '',
    descricao: '',
    tipo: 'PREVENTIVA',
    prioridade: 'MEDIA',
    dataInicio: '',
    dataFim: '',
    duracaoEstimada: 60,
    responsavelId: '',
    supervisorId: '',
    localId: '',
    endereco: '',
    observacoes: '',
    checkpoints: [],
    equipamentos: []
  });

  const [loading, setLoading] = useState(false);
  const [tipos, setTipos] = useState<RondaTipo[]>([]);
  const [prioridades, setPrioridades] = useState<RondaPrioridade[]>([]);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingData, setLoadingData] = useState(false);

  const equipamentos = [
    { id: '1', nome: 'Rádio Comunicador', tipo: 'COMUNICACAO' },
    { id: '2', nome: 'Lanterna', tipo: 'ILUMINACAO' },
    { id: '3', nome: 'Câmera Portátil', tipo: 'SEGURANCA' },
    { id: '4', nome: 'Colete Balístico', tipo: 'PROTECAO' }
  ];

  useEffect(() => {
    if (open) {
      loadEnums();
      loadWorkPostsAndEmployees();
      if (ronda) {
        setFormData({
          nome: ronda.nome,
          descricao: ronda.descricao || '',
          tipo: ronda.tipo,
          prioridade: ronda.prioridade,
          dataInicio: ronda.dataInicio,
          dataFim: ronda.dataFim,
          duracaoEstimada: ronda.duracaoEstimada,
          responsavelId: ronda.responsavelId,
          supervisorId: ronda.supervisorId || '',
          localId: ronda.localId,
          endereco: ronda.endereco,
          observacoes: ronda.observacoes || '',
          checkpoints: ronda.checkpoints.map(cp => ({
            nome: cp.nome,
            descricao: cp.descricao || '',
            ordem: cp.ordem,
            latitude: cp.latitude,
            longitude: cp.longitude,
            endereco: cp.endereco,
            obrigatorio: cp.obrigatorio,
            tempoEstimado: cp.tempoEstimado
          })),
          equipamentos: ronda.equipamentos.map(eq => ({
            equipamentoId: eq.equipamentoId,
            observacoes: eq.observacoes || ''
          }))
        });
      } else {
        resetForm();
      }
    }
  }, [open, ronda]);

  const loadEnums = async () => {
    try {
      const [tiposData, prioridadesData] = await Promise.all([
        rondasService.getTipoOptions(),
        rondasService.getPrioridadeOptions()
      ]);
      setTipos(tiposData);
      setPrioridades(prioridadesData);
    } catch (error) {
      console.error('Erro ao carregar enums:', error);
    }
  };

  const loadWorkPostsAndEmployees = async () => {
    setLoadingData(true);
    try {
      const [workPostsData, employeesData] = await Promise.all([
        workPostService.getAllWorkPosts(),
        employeeService.getAllEmployees()
      ]);
      
      setWorkPosts(workPostsData || []);
      setEmployees((employeesData || []).map(emp => ({
        id: emp.id,
        name: emp.name
      })));
    } catch (error) {
      console.error('Erro ao carregar postos de trabalho e funcionários:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      tipo: 'PREVENTIVA',
      prioridade: 'MEDIA',
      dataInicio: '',
      dataFim: '',
      duracaoEstimada: 60,
      responsavelId: '',
      supervisorId: '',
      localId: '',
      endereco: '',
      observacoes: '',
      checkpoints: [],
      equipamentos: []
    });
  };

  const handleInputChange = (field: keyof CreateRondaDTO, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckpointChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.map((cp, i) => 
        i === index ? { ...cp, [field]: value } : cp
      )
    }));
  };

  const addCheckpoint = () => {
    setFormData(prev => ({
      ...prev,
      checkpoints: [...prev.checkpoints, {
        nome: '',
        descricao: '',
        ordem: prev.checkpoints.length + 1,
        endereco: '',
        obrigatorio: true,
        tempoEstimado: 15
      }]
    }));
  };

  const removeCheckpoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.filter((_, i) => i !== index)
    }));
  };

  const handleEquipamentoChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      equipamentos: prev.equipamentos.map((eq, i) => 
        i === index ? { ...eq, [field]: value } : eq
      )
    }));
  };

  const addEquipamento = () => {
    setFormData(prev => ({
      ...prev,
      equipamentos: [...prev.equipamentos, {
        equipamentoId: '',
        observacoes: ''
      }]
    }));
  };

  const removeEquipamento = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipamentos: prev.equipamentos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let savedRonda: Ronda;
      
      if (ronda) {
        savedRonda = await rondasService.updateRonda(ronda.id, { ...formData, id: ronda.id });
      } else {
        savedRonda = await rondasService.createRonda(formData);
      }
      
      onSave(savedRonda);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar ronda:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoLabel = (tipo: RondaTipo) => {
    const labels = {
      PREVENTIVA: 'Preventiva',
      PATRULHAMENTO: 'Patrulhamento',
      VIGILANCIA: 'Vigilância',
      EMERGENCIA: 'Emergência',
      ESPECIAL: 'Especial'
    };
    return labels[tipo] || tipo;
  };

  const getPrioridadeLabel = (prioridade: RondaPrioridade) => {
    const labels = {
      BAIXA: 'Baixa',
      MEDIA: 'Média',
      ALTA: 'Alta',
      CRITICA: 'Crítica'
    };
    return labels[prioridade] || prioridade;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {ronda ? 'Editar Ronda' : 'Nova Ronda'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome da Ronda *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => handleInputChange('tipo', value as RondaTipo)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tipos.map(tipo => (
                        <SelectItem key={tipo} value={tipo}>
                          {getTipoLabel(tipo)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="prioridade">Prioridade *</Label>
                  <Select
                    value={formData.prioridade}
                    onValueChange={(value) => handleInputChange('prioridade', value as RondaPrioridade)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {prioridades.map(prioridade => (
                        <SelectItem key={prioridade} value={prioridade}>
                          {getPrioridadeLabel(prioridade)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duracaoEstimada">Duração Estimada (min) *</Label>
                  <Input
                    id="duracaoEstimada"
                    type="number"
                    value={formData.duracaoEstimada}
                    onChange={(e) => handleInputChange('duracaoEstimada', parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data e Horário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Data e Horário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataInicio">Data/Hora Início *</Label>
                  <Input
                    id="dataInicio"
                    type="datetime-local"
                    value={formData.dataInicio}
                    onChange={(e) => handleInputChange('dataInicio', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dataFim">Data/Hora Fim *</Label>
                  <Input
                    id="dataFim"
                    type="datetime-local"
                    value={formData.dataFim}
                    onChange={(e) => handleInputChange('dataFim', e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responsáveis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Responsáveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="responsavelId">Responsável *</Label>
                  <Select
                    value={formData.responsavelId}
                    onValueChange={(value) => handleInputChange('responsavelId', value)}
                    disabled={loadingData}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione o responsável"} />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="supervisorId">Supervisor</Label>
                  <Select
                    value={formData.supervisorId}
                    onValueChange={(value) => handleInputChange('supervisorId', value)}
                    disabled={loadingData}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione o supervisor"} />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Local */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Local
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="localId">Local *</Label>
                <Select
                  value={formData.localId}
                  onValueChange={(value) => {
                    const workPost = workPosts.find(wp => wp.id === value);
                    handleInputChange('localId', value);
                    if (workPost && workPost.address) {
                      handleInputChange('endereco', workPost.address);
                    }
                  }}
                  disabled={loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione o local"} />
                  </SelectTrigger>
                  <SelectContent>
                    {workPosts.map(workPost => (
                      <SelectItem key={workPost.id} value={workPost.id}>
                        {workPost.name || workPost.postCode || 'Sem nome'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Checkpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Checkpoints
                </span>
                <Button type="button" onClick={addCheckpoint} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.checkpoints.map((checkpoint, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Checkpoint {index + 1}</h4>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCheckpoint(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome *</Label>
                      <Input
                        value={checkpoint.nome}
                        onChange={(e) => handleCheckpointChange(index, 'nome', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Ordem *</Label>
                      <Input
                        type="number"
                        value={checkpoint.ordem}
                        onChange={(e) => handleCheckpointChange(index, 'ordem', parseInt(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Endereço *</Label>
                    <Input
                      value={checkpoint.endereco}
                      onChange={(e) => handleCheckpointChange(index, 'endereco', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tempo Estimado (min) *</Label>
                      <Input
                        type="number"
                        value={checkpoint.tempoEstimado}
                        onChange={(e) => handleCheckpointChange(index, 'tempoEstimado', parseInt(e.target.value))}
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`obrigatorio-${index}`}
                        checked={checkpoint.obrigatorio}
                        onChange={(e) => handleCheckpointChange(index, 'obrigatorio', e.target.checked)}
                      />
                      <Label htmlFor={`obrigatorio-${index}`}>Obrigatório</Label>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Equipamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Equipamentos
                </span>
                <Button type="button" onClick={addEquipamento} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.equipamentos.map((equipamento, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Equipamento {index + 1}</h4>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEquipamento(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Equipamento *</Label>
                      <Select
                        value={equipamento.equipamentoId}
                        onValueChange={(value) => handleEquipamentoChange(index, 'equipamentoId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o equipamento" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipamentos.map(eq => (
                            <SelectItem key={eq.id} value={eq.id}>
                              {eq.nome} - {eq.tipo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={equipamento.observacoes}
                      onChange={(e) => handleEquipamentoChange(index, 'observacoes', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows={3}
                placeholder="Observações gerais sobre a ronda..."
              />
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (ronda ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
