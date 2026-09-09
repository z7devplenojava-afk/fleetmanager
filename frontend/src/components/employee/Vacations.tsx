import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  X,
  Plane,
  Umbrella
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Vacation {
  id: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  requestDate: string;
  approver?: string;
  approvalDate?: string;
  rejectionReason?: string;
  type: 'VACATION' | 'PERSONAL_LEAVE' | 'MEDICAL_LEAVE' | 'SPECIAL_LEAVE';
}

interface VacationBalance {
  availableDays: number;
  usedDays: number;
  daysInProgress: number;
  totalDays: number;
  acquisitionPeriod: string;
  nextAcquisitionDate: string;
}

import { feriasService } from '@/services/feriasService';

const Vacations: React.FC = () => {
  const { toast } = useToast();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [vacationBalance, setVacationBalance] = useState<VacationBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    type: 'VACATION' as const
  });

  useEffect(() => {
    loadVacations();
    loadVacationBalance();
  }, []);

  const loadVacations = async () => {
    setLoading(true);
    try {
      const data = await feriasService.getMinhasSolicitacoes();
      if (Array.isArray(data)) {
        const mapped: Vacation[] = data.map((v: any) => ({
          id: v.id || String(Math.random()),
          startDate: v.dataInicio || v.startDate || '',
          endDate: v.dataFim || v.endDate || '',
          daysRequested: v.dias || v.daysRequested || 0,
          reason: v.observacao || v.reason || '',
          status: (v.status || 'PENDING') as any,
          requestDate: v.createdAt || new Date().toISOString().split('T')[0],
          approver: v.aprovador,
          approvalDate: v.dataAprovacao,
          rejectionReason: v.motivoRejeicao,
          type: (v.tipo || 'VACATION') as any
        }));
        setVacations(mapped);
      } else {
        setVacations([]);
      }
    } catch (error) {
      console.error('Erro ao carregar férias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive',
      });
      setVacations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVacationBalance = async () => {
    try {
      const balance = await feriasService.getMeuSaldo();
      if (balance) {
        setVacationBalance({
          availableDays: balance.diasDisponiveis || balance.availableDays || 0,
          usedDays: balance.diasUtilizados || balance.usedDays || 0,
          daysInProgress: balance.diasEmAndamento || balance.daysInProgress || 0,
          totalDays: balance.diasTotais || balance.totalDays || 30,
          acquisitionPeriod: balance.periodoAquisitivo || '2024/2025',
          nextAcquisitionDate: balance.proximoPeriodo || ''
        });
      } else {
        setVacationBalance(null);
      }
    } catch (error) {
      console.error('Erro ao carregar saldo de férias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive',
      });
      setVacationBalance(null);
    }
  };

  const handleRequestVacation = async () => {
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setRequesting(true);
    try {
      await feriasService.solicitarFerias({
        dataInicio: formData.startDate,
        dataFim: formData.endDate,
        observacao: formData.reason,
        tipo: formData.type
      });
      
      toast({
        title: 'Sucesso',
        description: 'Solicitação enviada com sucesso!',
      });

      setShowRequestForm(false);
      setFormData({ startDate: '', endDate: '', reason: '', type: 'VACATION' });
      loadVacations();
    } catch (error) {
      console.error('Erro ao solicitar férias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setRequesting(false);
    }
  };

  const handleCancelVacation = async (vacation: Vacation) => {
    try {
      await feriasService.cancelarSolicitacao(vacation.id);
      
      toast({
        title: 'Sucesso',
        description: 'Solicitação cancelada com sucesso!',
      });
      loadVacations();
    } catch (error) {
      console.error('Erro ao cancelar férias:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const filteredVacations = vacations.filter(vacation => {
    const matchesSearch = vacation.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vacation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Aprovado';
      case 'PENDING':
        return 'Pendente';
      case 'REJECTED':
        return 'Rejeitado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'VACATION':
        return 'Férias';
      case 'PERSONAL_LEAVE':
        return 'Folga Pessoal';
      case 'MEDICAL_LEAVE':
        return 'Afastamento Médico';
      case 'SPECIAL_LEAVE':
        return 'Licença Especial';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Férias</h1>
          <p className="text-muted-foreground">Solicite e acompanhe suas férias e folgas</p>
        </div>
        <Button
          onClick={() => setShowRequestForm(true)}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Solicitação</span>
        </Button>
      </div>


      {/* Balance Card */}
      {vacationBalance && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-red-500" />
              Saldo de Férias - Período {vacationBalance.acquisitionPeriod}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Dias Disponíveis</p>
                <p className="text-2xl font-bold text-green-600">{vacationBalance.availableDays}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Dias Usados</p>
                <p className="text-2xl font-bold text-red-600">{vacationBalance.usedDays}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold text-yellow-600">{vacationBalance.daysInProgress}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total do Período</p>
                <p className="text-2xl font-bold text-foreground">{vacationBalance.totalDays}</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-accent rounded">
              <p className="text-sm text-muted-foreground">
                <strong>Próxima aquisição:</strong> {new Date(vacationBalance.nextAcquisitionDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Form */}
      {showRequestForm && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center justify-between">
              <span>Nova Solicitação de Férias</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRequestForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo de Solicitação</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VACATION">Férias</SelectItem>
                    <SelectItem value="PERSONAL_LEAVE">Folga Pessoal</SelectItem>
                    <SelectItem value="MEDICAL_LEAVE">Afastamento Médico</SelectItem>
                    <SelectItem value="SPECIAL_LEAVE">Licença Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="endDate">Data de Término</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="days">Dias Solicitados</Label>
                <Input
                  id="days"
                  type="number"
                  value={formData.startDate && formData.endDate ? calculateDays(formData.startDate, formData.endDate) : ''}
                  readOnly
                  className="bg-muted"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="reason">Motivo</Label>
                <Textarea
                  id="reason"
                  placeholder="Descreva o motivo da sua solicitação..."
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowRequestForm(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRequestVacation}
                disabled={requesting}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
              >
                <Send className="h-4 w-4" />
                <span>{requesting ? 'Enviando...' : 'Enviar Solicitação'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <Filter className="h-5 w-5 mr-2 text-red-500" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar solicitações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="PENDING">Pendentes</SelectItem>
                <SelectItem value="APPROVED">Aprovados</SelectItem>
                <SelectItem value="REJECTED">Rejeitados</SelectItem>
                <SelectItem value="CANCELLED">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vacations List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <Umbrella className="h-5 w-5 mr-2 text-red-500" />
            Minhas Solicitações ({filteredVacations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredVacations.map((vacation) => (
              <div key={vacation.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Plane className="h-5 w-5 text-red-500" />
                    <div>
                      <h3 className="font-medium text-foreground">{getTypeLabel(vacation.type)}</h3>
                      <p className="text-sm text-muted-foreground">{vacation.reason}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(vacation.startDate).toLocaleDateString('pt-BR')} - {new Date(vacation.endDate).toLocaleDateString('pt-BR')}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{vacation.daysRequested} dias</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-3">
                    <Badge className={getStatusColor(vacation.status)}>
                      {getStatusLabel(vacation.status)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Solicitado em: {new Date(vacation.requestDate).toLocaleDateString('pt-BR')}
                    </span>
                    {vacation.approver && (
                      <span className="text-xs text-muted-foreground">
                        Aprovado por: {vacation.approver}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVacation(vacation)}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Detalhes</span>
                  </Button>
                  {vacation.status === 'PENDING' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelVacation(vacation)}
                      className="flex items-center space-x-1"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancelar</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredVacations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Umbrella className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>Nenhuma solicitação encontrada</p>
                <p className="text-sm">Clique em "Nova Solicitação" para solicitar suas férias</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedVacation && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center justify-between">
              <span>Detalhes da Solicitação - {getTypeLabel(selectedVacation.type)}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVacation(null)}
              >
                Fechar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-3">Informações da Solicitação</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <Badge variant="outline">{getTypeLabel(selectedVacation.type)}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Motivo:</span>
                    <span className="font-medium">{selectedVacation.reason}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor(selectedVacation.status)}>
                      {getStatusLabel(selectedVacation.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dias Solicitados:</span>
                    <span className="font-medium">{selectedVacation.daysRequested}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-3">Datas e Responsáveis</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Período:</span>
                    <span className="font-medium">
                      {new Date(selectedVacation.startDate).toLocaleDateString('pt-BR')} - {new Date(selectedVacation.endDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data da Solicitação:</span>
                    <span className="font-medium">{new Date(selectedVacation.requestDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {selectedVacation.approver && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Aprovado por:</span>
                        <span className="font-medium">{selectedVacation.approver}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data da Aprovação:</span>
                        <span className="font-medium">
                          {selectedVacation.approvalDate && new Date(selectedVacation.approvalDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </>
                  )}
                  {selectedVacation.rejectionReason && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Motivo da Rejeição:</span>
                      <span className="font-medium text-red-600">{selectedVacation.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Vacations;
