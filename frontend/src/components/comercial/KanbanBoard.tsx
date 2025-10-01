import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Filter, 
  User, 
  Building2, 
  Calendar, 
  DollarSign, 
  Phone, 
  Mail,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Star
} from 'lucide-react';
import KanbanCard from './KanbanCard';
import styles from './KanbanBoard.module.css';

interface KanbanStatus {
  id: number;
  name: string;
  orderIndex: number;
  color: string;
  bgColor: string;
}

interface Lead {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'WON' | 'LOST';
  source: string;
  value: number;
  createdAt: string;
}

interface Opportunity {
  id: number;
  title: string;
  description: string;
  statusId: number;
  lead: Lead;
  value: number;
  probability: number;
  expectedCloseDate: string;
  assignedTo: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  lastContact: string;
  tags: string[];
}

// Dados mockados melhorados
const mockStatuses: KanbanStatus[] = [
  { id: 1, name: 'Novos Leads', orderIndex: 1, color: '#3B82F6', bgColor: '#DBEAFE' },
  { id: 2, name: 'Em Contato', orderIndex: 2, color: '#F59E0B', bgColor: '#FEF3C7' },
  { id: 3, name: 'Proposta Enviada', orderIndex: 3, color: '#8B5CF6', bgColor: '#EDE9FE' },
  { id: 4, name: 'Em Negociação', orderIndex: 4, color: '#EF4444', bgColor: '#FEE2E2' },
  { id: 5, name: 'Fechado', orderIndex: 5, color: '#10B981', bgColor: '#D1FAE5' },
];

const mockLeads: Lead[] = [
  {
    id: 1,
    name: 'João Silva',
    company: 'Shopping Center ABC',
    email: 'joao.silva@shoppingabc.com',
    phone: '(11) 99999-9999',
    status: 'QUALIFIED',
    source: 'Website',
    value: 45000,
    createdAt: '2025-01-15'
  },
  {
    id: 2,
    name: 'Maria Santos',
    company: 'Condomínio Solar',
    email: 'maria.santos@condominio.com',
    phone: '(11) 88888-8888',
    status: 'PROPOSAL_SENT',
    source: 'Indicação',
    value: 32000,
    createdAt: '2025-01-12'
  },
  {
    id: 3,
    name: 'Pedro Costa',
    company: 'Indústria XYZ',
    email: 'pedro.costa@industria.com',
    phone: '(11) 77777-7777',
    status: 'NEGOTIATION',
    source: 'LinkedIn',
    value: 78000,
    createdAt: '2025-01-10'
  },
  {
    id: 4,
    name: 'Ana Beatriz',
    company: 'Escritório Comercial',
    email: 'ana.beatriz@escritorio.com',
    phone: '(11) 66666-6666',
    status: 'NEW',
    source: 'Google Ads',
    value: 28000,
    createdAt: '2025-01-08'
  },
  {
    id: 5,
    name: 'Carlos Oliveira',
    company: 'Hospital São João',
    email: 'carlos.oliveira@hospital.com',
    phone: '(11) 55555-5555',
    status: 'CONTACTED',
    source: 'Telefone',
    value: 95000,
    createdAt: '2025-01-05'
  },
  {
    id: 6,
    name: 'Fernanda Lima',
    company: 'Universidade Federal',
    email: 'fernanda.lima@universidade.com',
    phone: '(11) 44444-4444',
    status: 'WON',
    source: 'Evento',
    value: 120000,
    createdAt: '2024-12-20'
  }
];

const mockOpportunities: Opportunity[] = [
  {
    id: 1,
    title: 'Segurança Shopping Center ABC',
    description: 'Serviços de vigilância 24h para shopping center com 200 lojas',
    statusId: 3,
    lead: mockLeads[0],
    value: 45000,
    probability: 75,
    expectedCloseDate: '2025-02-15',
    assignedTo: 'Maria Santos',
    priority: 'HIGH',
    lastContact: '2025-01-20',
    tags: ['Shopping', '24h', 'Vigilância']
  },
  {
    id: 2,
    title: 'Portaria Condomínio Solar',
    description: 'Serviços de portaria para condomínio residencial de luxo',
    statusId: 4,
    lead: mockLeads[1],
    value: 32000,
    probability: 90,
    expectedCloseDate: '2025-02-10',
    assignedTo: 'João Silva',
    priority: 'MEDIUM',
    lastContact: '2025-01-22',
    tags: ['Condomínio', 'Portaria', 'Residencial']
  },
  {
    id: 3,
    title: 'Segurança Industrial XYZ',
    description: 'Sistema completo de segurança para indústria química',
    statusId: 2,
    lead: mockLeads[2],
    value: 78000,
    probability: 60,
    expectedCloseDate: '2025-03-01',
    assignedTo: 'Carlos Oliveira',
    priority: 'URGENT',
    lastContact: '2025-01-18',
    tags: ['Industrial', 'Química', 'Sistema']
  },
  {
    id: 4,
    title: 'Vigilância Escritório Comercial',
    description: 'Serviços de vigilância para escritório comercial',
    statusId: 1,
    lead: mockLeads[3],
    value: 28000,
    probability: 40,
    expectedCloseDate: '2025-02-28',
    assignedTo: 'Ana Beatriz',
    priority: 'LOW',
    lastContact: '2025-01-15',
    tags: ['Escritório', 'Comercial']
  },
  {
    id: 5,
    title: 'Segurança Hospital São João',
    description: 'Sistema de segurança para hospital com 500 leitos',
    statusId: 3,
    lead: mockLeads[4],
    value: 95000,
    probability: 80,
    expectedCloseDate: '2025-02-20',
    assignedTo: 'Pedro Costa',
    priority: 'HIGH',
    lastContact: '2025-01-21',
    tags: ['Hospital', 'Sistema', '500 leitos']
  },
  {
    id: 6,
    title: 'Segurança Universidade Federal',
    description: 'Contrato anual de segurança para campus universitário',
    statusId: 5,
    lead: mockLeads[5],
    value: 120000,
    probability: 100,
    expectedCloseDate: '2025-01-30',
    assignedTo: 'Fernanda Lima',
    priority: 'HIGH',
    lastContact: '2025-01-25',
    tags: ['Universidade', 'Anual', 'Campus']
  }
];

export default function KanbanBoard() {
  const [statuses, setStatuses] = useState<KanbanStatus[]>(mockStatuses);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>(mockOpportunities);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [form, setForm] = useState({ title: '', description: '', statusId: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  useEffect(() => {
    let filtered = opportunities;
    
    if (searchTerm) {
      filtered = filtered.filter(opp => 
        opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.lead.company.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedStatus) {
      filtered = filtered.filter(opp => opp.statusId === selectedStatus);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(opp => opp.priority === selectedPriority);
    }
    
    setFilteredOpportunities(filtered);
  }, [opportunities, searchTerm, selectedStatus, selectedPriority]);

  function openModal(statusId: number) {
    setForm({ title: '', description: '', statusId });
    setEditing(null);
    setShowModal(true);
  }

  function openEditModal(opp: Opportunity) {
    setForm({ title: opp.title, description: opp.description, statusId: opp.statusId });
    setEditing(opp);
    setShowModal(true);
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-500';
      case 'CONTACTED': return 'bg-yellow-500';
      case 'QUALIFIED': return 'bg-purple-500';
      case 'PROPOSAL_SENT': return 'bg-indigo-500';
      case 'NEGOTIATION': return 'bg-red-500';
      case 'WON': return 'bg-green-500';
      case 'LOST': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getLeadStatusText = (status: string) => {
    switch (status) {
      case 'NEW': return 'Novo';
      case 'CONTACTED': return 'Contactado';
      case 'QUALIFIED': return 'Qualificado';
      case 'PROPOSAL_SENT': return 'Proposta Enviada';
      case 'NEGOTIATION': return 'Em Negociação';
      case 'WON': return 'Ganho';
      case 'LOST': return 'Perdido';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) return <div className="flex items-center justify-center p-8">Carregando Kanban...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Oportunidades</p>
                <p className="text-2xl font-bold text-seguranca-yellow">{opportunities.length}</p>
              </div>
              <Target className="h-8 w-8 text-seguranca-yellow" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Valor Total</p>
                <p className="text-2xl font-bold text-seguranca-yellow">
                  {formatCurrency(opportunities.reduce((sum, opp) => sum + opp.value, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-seguranca-yellow" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-seguranca-yellow">
                  {Math.round((opportunities.filter(opp => opp.statusId === 5).length / opportunities.length) * 100)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-seguranca-yellow" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Média de Valor</p>
                <p className="text-2xl font-bold text-seguranca-yellow">
                  {formatCurrency(opportunities.reduce((sum, opp) => sum + opp.value, 0) / opportunities.length)}
                </p>
              </div>
              <Star className="h-8 w-8 text-seguranca-yellow" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar oportunidades, leads, empresas..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
            
            <Select value={selectedStatus?.toString() || 'all'} onValueChange={(value) => setSelectedStatus(value === 'all' ? null : Number(value))}>
              <SelectTrigger className="w-48 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status.id} value={status.id.toString()}>{status.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-48 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="MEDIUM">Média</SelectItem>
                <SelectItem value="LOW">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => { setSearchTerm(''); setSelectedStatus(null); setSelectedPriority('all'); }}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className={styles['kanban-board-scroll']}>
        {statuses.map(status => {
          const statusOpportunities = filteredOpportunities.filter(opp => opp.statusId === status.id);
          const totalValue = statusOpportunities.reduce((sum, opp) => sum + opp.value, 0);
          
          return (
            <div
              key={status.id}
              className={styles['kanban-column']}
              style={{ borderLeft: `4px solid ${status.color}` }}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-seguranca-lightgray">{status.name}</h3>
                  <p className="text-sm text-gray-400">
                    {statusOpportunities.length} oportunidades • {formatCurrency(totalValue)}
                  </p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => openModal(status.id)}
                  className="bg-seguranca-yellow text-black hover:bg-yellow-500"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {statusOpportunities.map(opp => (
                  <KanbanCard
                    key={opp.id}
                    opportunity={opp}
                    onEdit={openEditModal}
                    onDragStart={() => {}}
                    getPriorityColor={getPriorityColor}
                    getLeadStatusColor={getLeadStatusColor}
                    getLeadStatusText={getLeadStatusText}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ))}
              </div>
              
              <Button 
                variant="outline"
                onClick={() => openModal(status.id)}
                className="w-full mt-4 border-dashed border-gray-600 text-gray-400 hover:bg-seguranca-black"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Oportunidade
              </Button>
            </div>
          );
        })}
      </div>

      {/* Modal de Oportunidade */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray">
                {editing ? 'Editar Oportunidade' : 'Nova Oportunidade'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); setShowModal(false); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-seguranca-lightgray mb-2">Título</label>
                  <Input
                    required
                    placeholder="Título da oportunidade"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-seguranca-lightgray mb-2">Descrição</label>
                  <textarea
                    required
                    placeholder="Descrição da oportunidade"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full p-3 bg-seguranca-black border border-gray-600 rounded-md text-seguranca-lightgray resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-seguranca-yellow text-black hover:bg-yellow-500">
                    {editing ? 'Atualizar' : 'Criar'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowModal(false)}
                    className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 