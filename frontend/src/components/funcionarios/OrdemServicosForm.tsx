import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Calendar, User, Building, FileText, Download, Eye, Clock, MapPin, AlertTriangle } from 'lucide-react';

const OrdemServicosForm = () => {
  const [form, setForm] = useState({
    employeeId: '',
    employeeName: '',
    position: '',
    serviceType: '',
    client: '',
    location: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    description: '',
    priority: '',
    status: '',
    observations: '',
  });

  const serviceTypes = [
    'Vigilância Patrimonial',
    'Segurança Pessoal',
    'Escolta de Valores',
    'Controle de Acesso',
    'Monitoramento',
    'Ronda',
    'Recepção',
    'Portaria',
    'Eventos',
    'Emergência',
  ];

  const priorityLevels = [
    'Baixa',
    'Média',
    'Alta',
    'Urgente',
  ];

  const statusOptions = [
    'Pendente',
    'Em Andamento',
    'Concluído',
    'Cancelado',
    'Suspenso',
  ];

  const mockClients = [
    'Empresa ABC Ltda',
    'Shopping Center XYZ',
    'Condomínio Residencial',
    'Indústria Metalúrgica',
    'Hospital Municipal',
  ];

  const handleGenerateOrder = () => {
    // TODO: Implementar geração da ordem de serviço
    console.log('Gerando ordem de serviço:', form);
  };

  const handlePreviewOrder = () => {
    // TODO: Implementar preview da ordem de serviço
    console.log('Preview da ordem de serviço:', form);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ordem de Serviço
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações do Funcionário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Select value={form.employeeId} onValueChange={(value) => setForm(prev => ({ ...prev, employeeId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">João Silva</SelectItem>
                  <SelectItem value="2">Maria Souza</SelectItem>
                  <SelectItem value="3">Carlos Lima</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input 
                value={form.position} 
                onChange={(e) => setForm(prev => ({ ...prev, position: e.target.value }))}
                placeholder="Ex: Vigilante"
              />
            </div>
          </div>

          {/* Tipo de Serviço e Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Serviço</Label>
              <Select value={form.serviceType} onValueChange={(value) => setForm(prev => ({ ...prev, serviceType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={form.client} onValueChange={(value) => setForm(prev => ({ ...prev, client: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {mockClients.map(client => (
                    <SelectItem key={client} value={client}>{client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-2">
            <Label>Local de Serviço</Label>
            <Input 
              value={form.location} 
              onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Endereço completo do local de serviço"
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input 
                type="date" 
                value={form.startDate} 
                onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data de Término</Label>
              <Input 
                type="date" 
                value={form.endDate} 
                onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário de Início</Label>
              <Input 
                type="time" 
                value={form.startTime} 
                onChange={(e) => setForm(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Horário de Término</Label>
              <Input 
                type="time" 
                value={form.endTime} 
                onChange={(e) => setForm(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>

          {/* Prioridade e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={(value) => setForm(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {priorityLevels.map(priority => (
                    <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição do Serviço */}
          <div className="space-y-2">
            <Label>Descrição do Serviço</Label>
            <Textarea 
              value={form.description} 
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva detalhadamente o serviço a ser prestado..."
              rows={4}
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea 
              value={form.observations} 
              onChange={(e) => setForm(prev => ({ ...prev, observations: e.target.value }))}
              placeholder="Observações adicionais sobre a ordem de serviço..."
              rows={3}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-4 pt-4">
            <Button onClick={handlePreviewOrder} variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar Ordem
            </Button>
            <Button onClick={handleGenerateOrder} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Gerar Ordem de Serviço
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdemServicosForm; 