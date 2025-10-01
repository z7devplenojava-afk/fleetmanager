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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Building2,
  Calendar,
  DollarSign,
  User,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PropostaAcordo from '@/components/comercial/PropostaAcordo';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Proposal {
  id: number;
  title: string;
  proposalNumber: string;
  clientName: string;
  leadName: string;
  status: string;
  totalValue: number;
  validUntil: string;
  description: string;
  createdByName: string;
  assignedToName: string;
  createdAt: string;
  updatedAt: string;
}

const Propostas = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  // Dados simulados
  const mockProposals: Proposal[] = [
    {
      id: 1,
      title: 'Serviços de Vigilância - Shopping Center ABC',
      proposalNumber: 'PROP-2025-001',
      clientName: 'Shopping Center ABC',
      leadName: 'João Silva',
      status: 'DRAFT',
      totalValue: 45000,
      validUntil: '2025-02-15',
      description: 'Proposta para serviços de vigilância 24h no shopping center',
      createdByName: 'Maria Santos',
      assignedToName: 'Carlos Oliveira',
      createdAt: '2025-01-15',
      updatedAt: '2025-01-15'
    },
    {
      id: 2,
      title: 'Segurança Industrial - Indústria XYZ',
      proposalNumber: 'PROP-2025-002',
      clientName: 'Indústria XYZ',
      leadName: 'Pedro Santos',
      status: 'SENT',
      totalValue: 78000,
      validUntil: '2025-02-20',
      description: 'Proposta para segurança industrial com monitoramento',
      createdByName: 'Ana Costa',
      assignedToName: 'João Silva',
      createdAt: '2025-01-12',
      updatedAt: '2025-01-14'
    },
    {
      id: 3,
      title: 'Vigilância Condominial - Residencial Solar',
      proposalNumber: 'PROP-2025-003',
      clientName: 'Condomínio Solar',
      leadName: 'Ana Costa',
      status: 'UNDER_REVIEW',
      totalValue: 32000,
      validUntil: '2025-02-10',
      description: 'Proposta para vigilância condominial 24h',
      createdByName: 'Carlos Oliveira',
      assignedToName: 'Maria Santos',
      createdAt: '2025-01-10',
      updatedAt: '2025-01-13'
    }
  ];

  useEffect(() => {
    setProposals(mockProposals);
    setFilteredProposals(mockProposals);
  }, []);

  useEffect(() => {
    let filtered = proposals;

    if (searchTerm) {
      filtered = filtered.filter(proposal =>
        proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.proposalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === statusFilter);
    }

    if (clientFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.clientName === clientFilter);
    }

    setFilteredProposals(filtered);
  }, [proposals, searchTerm, statusFilter, clientFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: 'Rascunho', color: 'bg-gray-500' },
      SENT: { label: 'Enviada', color: 'bg-blue-500' },
      UNDER_REVIEW: { label: 'Em Análise', color: 'bg-yellow-500' },
      APPROVED: { label: 'Aprovada', color: 'bg-green-500' },
      REJECTED: { label: 'Rejeitada', color: 'bg-red-500' },
      EXPIRED: { label: 'Expirada', color: 'bg-orange-500' },
      CONVERTED: { label: 'Convertida', color: 'bg-purple-500' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
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

  const getUniqueClients = () => {
    return Array.from(new Set(proposals.map(p => p.clientName)));
  };

  return (
    <StandardLayout>
      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="lista">Propostas Comerciais</TabsTrigger>
          <TabsTrigger value="acordo">Proposta de Acordo</TabsTrigger>
        </TabsList>
        <TabsContent value="lista">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-seguranca-lightgray">Propostas</h1>
                <p className="text-gray-400 mt-1">Gestão de propostas comerciais</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  className="bg-seguranca-red hover:bg-seguranca-darkred"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Proposta
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
                        placeholder="Título, número ou cliente..."
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
                        <SelectItem value="DRAFT">Rascunho</SelectItem>
                        <SelectItem value="SENT">Enviada</SelectItem>
                        <SelectItem value="UNDER_REVIEW">Em Análise</SelectItem>
                        <SelectItem value="APPROVED">Aprovada</SelectItem>
                        <SelectItem value="REJECTED">Rejeitada</SelectItem>
                        <SelectItem value="EXPIRED">Expirada</SelectItem>
                        <SelectItem value="CONVERTED">Convertida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="client" className="text-seguranca-lightgray">Cliente</Label>
                    <Select value={clientFilter} onValueChange={setClientFilter}>
                      <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                        <SelectValue placeholder="Todos os clientes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os clientes</SelectItem>
                        {getUniqueClients().map(client => (
                          <SelectItem key={client} value={client}>{client}</SelectItem>
                        ))}
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
                        setClientFilter('all');
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
                      <p className="text-gray-400 text-sm">Total de Propostas</p>
                      <p className="text-2xl font-bold text-seguranca-lightgray">{proposals.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-seguranca-red" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Em Análise</p>
                      <p className="text-2xl font-bold text-yellow-500">
                        {proposals.filter(p => p.status === 'UNDER_REVIEW').length}
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">A</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Aprovadas</p>
                      <p className="text-2xl font-bold text-green-500">
                        {proposals.filter(p => p.status === 'APPROVED').length}
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
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
                        {formatCurrency(proposals.reduce((sum, proposal) => sum + proposal.totalValue, 0))}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Propostas */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Lista de Propostas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-600">
                        <TableHead className="text-seguranca-lightgray">Número</TableHead>
                        <TableHead className="text-seguranca-lightgray">Título</TableHead>
                        <TableHead className="text-seguranca-lightgray">Cliente</TableHead>
                        <TableHead className="text-seguranca-lightgray">Status</TableHead>
                        <TableHead className="text-seguranca-lightgray">Valor</TableHead>
                        <TableHead className="text-seguranca-lightgray">Válida Até</TableHead>
                        <TableHead className="text-seguranca-lightgray">Responsável</TableHead>
                        <TableHead className="text-seguranca-lightgray text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProposals.map((proposal) => (
                        <TableRow key={proposal.id} className="border-gray-600">
                          <TableCell className="text-seguranca-lightgray font-medium">
                            {proposal.proposalNumber}
                          </TableCell>
                          <TableCell className="text-seguranca-lightgray">
                            <div>
                              <div className="font-medium">{proposal.title}</div>
                              <div className="text-sm text-gray-400">{proposal.description}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-seguranca-lightgray">
                            <div>
                              <div className="font-medium">{proposal.clientName}</div>
                              <div className="text-sm text-gray-400">Lead: {proposal.leadName}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                          <TableCell className="text-seguranca-lightgray font-medium">
                            {formatCurrency(proposal.totalValue)}
                          </TableCell>
                          <TableCell className="text-seguranca-lightgray">
                            {formatDate(proposal.validUntil)}
                          </TableCell>
                          <TableCell className="text-seguranca-lightgray">
                            {proposal.assignedToName}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                                onClick={() => {
                                  setSelectedProposal(proposal);
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
                  <DialogTitle className="text-seguranca-lightgray">Detalhes da Proposta</DialogTitle>
                </DialogHeader>
                {selectedProposal && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-400">Número da Proposta</Label>
                        <p className="text-seguranca-lightgray font-medium">{selectedProposal.proposalNumber}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Status</Label>
                        <div className="mt-1">{getStatusBadge(selectedProposal.status)}</div>
                      </div>
                      <div>
                        <Label className="text-gray-400">Título</Label>
                        <p className="text-seguranca-lightgray">{selectedProposal.title}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Cliente</Label>
                        <p className="text-seguranca-lightgray">{selectedProposal.clientName}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Lead</Label>
                        <p className="text-seguranca-lightgray">{selectedProposal.leadName}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Valor Total</Label>
                        <p className="text-seguranca-lightgray font-medium">
                          {formatCurrency(selectedProposal.totalValue)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Válida Até</Label>
                        <p className="text-seguranca-lightgray">{formatDate(selectedProposal.validUntil)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Responsável</Label>
                        <p className="text-seguranca-lightgray">{selectedProposal.assignedToName}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Criado Por</Label>
                        <p className="text-seguranca-lightgray">{selectedProposal.createdByName}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Data de Criação</Label>
                        <p className="text-seguranca-lightgray">{formatDate(selectedProposal.createdAt)}</p>
                      </div>
                      <div>
                        <Label className="text-gray-400">Última Atualização</Label>
                        <p className="text-seguranca-lightgray">{formatDate(selectedProposal.updatedAt)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-gray-400">Descrição</Label>
                      <p className="text-seguranca-lightgray mt-1">{selectedProposal.description}</p>
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
                        Editar Proposta
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
                  <DialogTitle className="text-seguranca-lightgray">Nova Proposta</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title" className="text-seguranca-lightgray">Título *</Label>
                      <Input
                        id="title"
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                        placeholder="Título da proposta"
                      />
                    </div>
                    <div>
                      <Label htmlFor="client" className="text-seguranca-lightgray">Cliente *</Label>
                      <Select>
                        <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shopping">Shopping Center ABC</SelectItem>
                          <SelectItem value="industria">Indústria XYZ</SelectItem>
                          <SelectItem value="condominio">Condomínio Solar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="lead" className="text-seguranca-lightgray">Lead</Label>
                      <Select>
                        <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                          <SelectValue placeholder="Selecione o lead" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="joao">João Silva</SelectItem>
                          <SelectItem value="pedro">Pedro Santos</SelectItem>
                          <SelectItem value="ana">Ana Costa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="totalValue" className="text-seguranca-lightgray">Valor Total *</Label>
                      <Input
                        id="totalValue"
                        type="number"
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="validUntil" className="text-seguranca-lightgray">Válida Até</Label>
                      <Input
                        id="validUntil"
                        type="date"
                        className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status" className="text-seguranca-lightgray">Status</Label>
                      <Select>
                        <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Rascunho</SelectItem>
                          <SelectItem value="SENT">Enviada</SelectItem>
                          <SelectItem value="UNDER_REVIEW">Em Análise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="text-seguranca-lightgray">Descrição</Label>
                    <Textarea
                      id="description"
                      className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                      placeholder="Descrição detalhada da proposta..."
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
                      Criar Proposta
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
        <TabsContent value="acordo">
          <PropostaAcordo />
        </TabsContent>
      </Tabs>
    </StandardLayout>
  );
};

export default Propostas; 