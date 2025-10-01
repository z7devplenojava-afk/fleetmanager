import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { notificationService } from '@/services/notificationService';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  mobile: string;
  company: string;
  position: string;
  status: string;
  source: string;
  estimatedValue: number;
  notes: string;
  assignedToName: string;
  nextFollowUp: string;
  createdAt: string;
}

const Leads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Dados simulados
  const mockLeads: Lead[] = [
    {
      id: 1,
      name: 'João Silva',
      email: 'joao.silva@empresa.com',
      phone: '(11) 99999-9999',
      mobile: '(11) 88888-8888',
      company: 'Empresa ABC Ltda',
      position: 'Gerente de Segurança',
      status: 'NEW',
      source: 'WEBSITE',
      estimatedValue: 15000,
      notes: 'Interessado em serviços de vigilância para shopping center',
      assignedToName: 'Maria Santos',
      nextFollowUp: '2025-01-20',
      createdAt: '2025-01-15'
    },
    {
      id: 2,
      name: 'Ana Costa',
      email: 'ana.costa@condominio.com',
      phone: '(11) 77777-7777',
      mobile: '(11) 66666-6666',
      company: 'Condomínio Solar',
      position: 'Síndica',
      status: 'CONTACTED',
      source: 'REFERRAL',
      estimatedValue: 8000,
      notes: 'Precisa de orçamento para vigilância 24h',
      assignedToName: 'Carlos Oliveira',
      nextFollowUp: '2025-01-18',
      createdAt: '2025-01-10'
    },
    {
      id: 3,
      name: 'Pedro Santos',
      email: 'pedro.santos@industria.com',
      phone: '(11) 55555-5555',
      mobile: '(11) 44444-4444',
      company: 'Indústria XYZ',
      position: 'Diretor de Operações',
      status: 'QUALIFIED',
      source: 'COLD_CALL',
      estimatedValue: 25000,
      notes: 'Empresa em expansão, precisa de segurança industrial',
      assignedToName: 'João Silva',
      nextFollowUp: '2025-01-22',
      createdAt: '2025-01-08'
    }
  ];

  useEffect(() => {
    setLeads(mockLeads);
    setFilteredLeads(mockLeads);
  }, []);

  useEffect(() => {
    let filtered = leads;

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }

    setFilteredLeads(filtered);
  }, [leads, searchTerm, statusFilter, sourceFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      NEW: { label: 'Novo', color: 'bg-blue-500' },
      CONTACTED: { label: 'Contactado', color: 'bg-yellow-500' },
      QUALIFIED: { label: 'Qualificado', color: 'bg-green-500' },
      PROPOSAL_SENT: { label: 'Proposta Enviada', color: 'bg-purple-500' },
      NEGOTIATION: { label: 'Em Negociação', color: 'bg-orange-500' },
      WON: { label: 'Ganho', color: 'bg-green-600' },
      LOST: { label: 'Perdido', color: 'bg-red-500' },
      INACTIVE: { label: 'Inativo', color: 'bg-gray-500' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.NEW;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getSourceBadge = (source: string) => {
    const sourceConfig = {
      WEBSITE: { label: 'Website', color: 'bg-blue-100 text-blue-800' },
      REFERRAL: { label: 'Indicação', color: 'bg-green-100 text-green-800' },
      COLD_CALL: { label: 'Ligação a Frio', color: 'bg-yellow-100 text-yellow-800' },
      EMAIL_MARKETING: { label: 'Email Marketing', color: 'bg-purple-100 text-purple-800' },
      SOCIAL_MEDIA: { label: 'Redes Sociais', color: 'bg-pink-100 text-pink-800' },
      GOOGLE_ADS: { label: 'Google Ads', color: 'bg-red-100 text-red-800' },
      EVENT: { label: 'Evento', color: 'bg-indigo-100 text-indigo-800' },
      PARTNER: { label: 'Parceiro', color: 'bg-teal-100 text-teal-800' },
      OTHER: { label: 'Outro', color: 'bg-gray-100 text-gray-800' }
    };

    const config = sourceConfig[source as keyof typeof sourceConfig] || sourceConfig.OTHER;
    return <Badge className={config.color}>{config.label}</Badge>;
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

  return (
    <StandardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Leads</h1>
            <p className="text-gray-400 mt-1">Gestão de leads e oportunidades comerciais</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              className="bg-seguranca-red hover:bg-seguranca-darkred"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search" className="text-seguranca-lightgray">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Nome, empresa ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status" className="text-seguranca-lightgray">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="NEW">Novo</SelectItem>
                    <SelectItem value="CONTACTED">Contactado</SelectItem>
                    <SelectItem value="QUALIFIED">Qualificado</SelectItem>
                    <SelectItem value="PROPOSAL_SENT">Proposta Enviada</SelectItem>
                    <SelectItem value="NEGOTIATION">Em Negociação</SelectItem>
                    <SelectItem value="WON">Ganho</SelectItem>
                    <SelectItem value="LOST">Perdido</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="source" className="text-seguranca-lightgray">Fonte</Label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Todas as fontes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as fontes</SelectItem>
                    <SelectItem value="WEBSITE">Website</SelectItem>
                    <SelectItem value="REFERRAL">Indicação</SelectItem>
                    <SelectItem value="COLD_CALL">Ligação a Frio</SelectItem>
                    <SelectItem value="EMAIL_MARKETING">Email Marketing</SelectItem>
                    <SelectItem value="SOCIAL_MEDIA">Redes Sociais</SelectItem>
                    <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
                    <SelectItem value="EVENT">Evento</SelectItem>
                    <SelectItem value="PARTNER">Parceiro</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSourceFilter('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total de Leads</p>
                  <p className="text-2xl font-bold text-seguranca-lightgray">{leads.length}</p>
                </div>
                <Users className="h-8 w-8 text-seguranca-red" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Novos</p>
                  <p className="text-2xl font-bold text-blue-500">
                    {leads.filter(l => l.status === 'NEW').length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">N</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Em Negociação</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {leads.filter(l => l.status === 'NEGOTIATION').length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">N</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Valor Total</p>
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(leads.reduce((sum, lead) => sum + lead.estimatedValue, 0))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Leads */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-seguranca-lightgray">Lista de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-600">
                    <TableHead className="text-seguranca-lightgray">Nome</TableHead>
                    <TableHead className="text-seguranca-lightgray">Empresa</TableHead>
                    <TableHead className="text-seguranca-lightgray">Status</TableHead>
                    <TableHead className="text-seguranca-lightgray">Fonte</TableHead>
                    <TableHead className="text-seguranca-lightgray">Valor Estimado</TableHead>
                    <TableHead className="text-seguranca-lightgray">Responsável</TableHead>
                    <TableHead className="text-seguranca-lightgray">Próximo Follow-up</TableHead>
                    <TableHead className="text-seguranca-lightgray text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="border-gray-600">
                      <TableCell className="text-seguranca-lightgray">
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-gray-400">{lead.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray">
                        <div>
                          <div className="font-medium">{lead.company}</div>
                          <div className="text-sm text-gray-400">{lead.position}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>{getSourceBadge(lead.source)}</TableCell>
                      <TableCell className="text-seguranca-lightgray">
                        {formatCurrency(lead.estimatedValue)}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray">
                        {lead.assignedToName}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray">
                        {formatDate(lead.nextFollowUp)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsViewModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-seguranca-black border-gray-600 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Visualização */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-600 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-seguranca-lightgray">Detalhes do Lead</DialogTitle>
              <DialogDescription className="text-gray-400">
                Visualize todas as informações do lead selecionado
              </DialogDescription>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Nome</Label>
                    <p className="text-seguranca-lightgray font-medium">{selectedLead.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Email</Label>
                    <p className="text-seguranca-lightgray">{selectedLead.email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Telefone</Label>
                    <p className="text-seguranca-lightgray">{selectedLead.phone}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Celular</Label>
                    <p className="text-seguranca-lightgray">{selectedLead.mobile}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Empresa</Label>
                    <p className="text-seguranca-lightgray">{selectedLead.company}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Cargo</Label>
                    <p className="text-seguranca-lightgray">{selectedLead.position}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedLead.status)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Fonte</Label>
                    <div className="mt-1">{getSourceBadge(selectedLead.source)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-400">Valor Estimado</Label>
                    <p className="text-seguranca-lightgray font-medium">
                      {formatCurrency(selectedLead.estimatedValue)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Responsável</Label>
                    <p className="text-seguranca-lightgray">{selectedLead.assignedToName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Próximo Follow-up</Label>
                    <p className="text-seguranca-lightgray">{formatDate(selectedLead.nextFollowUp)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Data de Criação</Label>
                    <p className="text-seguranca-lightgray">{formatDate(selectedLead.createdAt)}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-gray-400">Observações</Label>
                  <p className="text-seguranca-lightgray mt-1">{selectedLead.notes}</p>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    onClick={() => setIsViewModalOpen(false)}
                  >
                    Fechar
                  </Button>
                  <Button className="bg-seguranca-red hover:bg-seguranca-darkred">
                    Editar Lead
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Criação */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-600 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-seguranca-lightgray">Novo Lead</DialogTitle>
              <DialogDescription className="text-gray-400">
                Preencha as informações para criar um novo lead
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-seguranca-lightgray">Nome *</Label>
                  <Input
                    id="name"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-seguranca-lightgray">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-seguranca-lightgray">Telefone</Label>
                  <Input
                    id="phone"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="mobile" className="text-seguranca-lightgray">Celular</Label>
                  <Input
                    id="mobile"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="(11) 88888-8888"
                  />
                </div>
                <div>
                  <Label htmlFor="company" className="text-seguranca-lightgray">Empresa</Label>
                  <Input
                    id="company"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Nome da empresa"
                  />
                </div>
                <div>
                  <Label htmlFor="position" className="text-seguranca-lightgray">Cargo</Label>
                  <Input
                    id="position"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="Cargo/função"
                  />
                </div>
                <div>
                  <Label htmlFor="source" className="text-seguranca-lightgray">Fonte</Label>
                  <Select>
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione a fonte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEBSITE">Website</SelectItem>
                      <SelectItem value="REFERRAL">Indicação</SelectItem>
                      <SelectItem value="COLD_CALL">Ligação a Frio</SelectItem>
                      <SelectItem value="EMAIL_MARKETING">Email Marketing</SelectItem>
                      <SelectItem value="SOCIAL_MEDIA">Redes Sociais</SelectItem>
                      <SelectItem value="GOOGLE_ADS">Google Ads</SelectItem>
                      <SelectItem value="EVENT">Evento</SelectItem>
                      <SelectItem value="PARTNER">Parceiro</SelectItem>
                      <SelectItem value="OTHER">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estimatedValue" className="text-seguranca-lightgray">Valor Estimado</Label>
                  <Input
                    id="estimatedValue"
                    type="number"
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                    placeholder="0,00"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes" className="text-seguranca-lightgray">Observações</Label>
                <Textarea
                  id="notes"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  placeholder="Informações adicionais sobre o lead..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button className="bg-seguranca-red hover:bg-seguranca-darkred">
                  Criar Lead
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </StandardLayout>
  );
};

export default Leads; 