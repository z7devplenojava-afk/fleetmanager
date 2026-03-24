import React, { useState, useEffect } from 'react';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  Search, 
  Filter,
  Loader2,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { proposalService, Proposal } from '@/services/proposalService';
import { propostaService, PropostaParams } from '@/services/propostaService';
import { PropostaComercial } from '@/types/proposta';
import { clientService } from '@/services/clientService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface AgreementProposal extends Proposal {
  agreementParams?: PropostaParams;
  agreementData?: PropostaComercial;
}

export const AgreementProposalsList: React.FC = () => {
  const { toast } = useToast();
  const [proposals, setProposals] = useState<AgreementProposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<AgreementProposal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<AgreementProposal | null>(null);
  const [clients, setClients] = useState<Array<{ id: string | number; name: string; cnpj?: string }>>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [editClientId, setEditClientId] = useState<string | number | undefined>(undefined);

  // Load proposals
  const loadProposals = async () => {
    try {
      setLoading(true);
      const data = await proposalService.getAllProposals();
      // Filtrar apenas propostas de acordo (pode usar um campo específico ou título)
      const agreementProposals = await Promise.all(
        data
          .filter((p: any) => p.title?.includes('Proposta de Acordo') || p.description?.includes('acordo'))
          .map(async (proposal: any) => {
            // Tentar buscar proposta completa para ter o nome do cliente
            let clientName = proposal.client?.name || proposal.clientName || 'N/A';
            try {
              const proposalId = typeof proposal.id === 'string' ? proposal.id : String(proposal.id);
              const fullProposal = await proposalService.getProposalById(proposalId);
              clientName = fullProposal.client?.name || (fullProposal as any).clientName || proposal.client?.name || proposal.clientName || 'N/A';
            } catch (error) {
              // Se falhar, usar o que já temos
              console.warn('Não foi possível buscar proposta completa:', error);
            }
            
            return {
              id: proposal.id,
              title: proposal.title || '',
              proposalNumber: proposal.proposalNumber || '',
              clientName: clientName,
              status: proposal.status || 'DRAFT',
              totalValue: proposal.totalValue ? Number(proposal.totalValue) : 0,
              validUntil: proposal.validUntil ? new Date(proposal.validUntil).toISOString().split('T')[0] : '',
              description: proposal.description || '',
              createdAt: proposal.createdAt ? new Date(proposal.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              updatedAt: proposal.updatedAt ? new Date(proposal.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            };
          })
      );
      setProposals(agreementProposals);
      setFilteredProposals(agreementProposals);
    } catch (error: any) {
      console.error('Erro ao carregar propostas de acordo:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível carregar as propostas de acordo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load clients
  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const data = await clientService.getAllClients();
      const normalizedClients = Array.isArray(data) ? data.map((client: any) => ({
        id: client.id || client.uuid || String(client.id),
        name: client.name || client.nome || '',
        cnpj: client.cnpj || ''
      })) : [];
      setClients(normalizedClients);
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  useEffect(() => {
    if (isEditModalOpen && clients.length === 0) {
      loadClients();
    }
  }, [isEditModalOpen]);

  useEffect(() => {
    let filtered = proposals;

    if (searchTerm) {
      filtered = filtered.filter(proposal =>
        proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.proposalNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(proposal => proposal.status === statusFilter);
    }

    setFilteredProposals(filtered);
  }, [proposals, searchTerm, statusFilter]);

  const handleDelete = async (proposalId: number | string) => {
    if (!confirm('Tem certeza que deseja excluir esta proposta de acordo?')) return;
    try {
      await proposalService.deleteProposal(proposalId);
      toast({
        title: "Sucesso",
        description: "Proposta de acordo excluída com sucesso!",
      });
      await loadProposals();
    } catch (error: any) {
      console.error('Erro ao excluir proposta de acordo:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Não foi possível excluir a proposta de acordo.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPDF = async (proposal: AgreementProposal) => {
    try {
      // Buscar proposta completa do backend para garantir que temos o nome do cliente
      let clientName = proposal.clientName || 'N/A';
      try {
        const proposalId = typeof proposal.id === 'string' ? proposal.id : String(proposal.id);
        const fullProposal = await proposalService.getProposalById(proposalId);
        clientName = fullProposal.client?.name || (fullProposal as any).clientName || proposal.clientName || 'N/A';
      } catch (error) {
        console.error('Erro ao buscar proposta completa para PDF:', error);
        // Usar o nome que já temos
      }

      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.setTextColor(40, 40, 40);
      doc.text('PROPOSTA COMERCIAL DE ACORDO', 105, 20, { align: 'center' });
      
      // Informações da Proposta
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Número: ${proposal.proposalNumber || 'N/A'}`, 14, 35);
      doc.text(`Data: ${new Date(proposal.createdAt).toLocaleDateString('pt-BR')}`, 14, 42);
      doc.text(`Cliente: ${clientName}`, 14, 49);
      doc.text(`Status: ${getStatusLabel(proposal.status)}`, 14, 56);
      
      let yPos = 70;

      // Valor Final
      doc.setFontSize(16);
      doc.setTextColor(255, 193, 7);
      doc.text('VALOR FINAL', 105, yPos, { align: 'center' });
      yPos += 10;
      
      doc.setFontSize(14);
      doc.text(`Mensal: ${formatCurrency(proposal.totalValue)}`, 105, yPos, { align: 'center' });
      yPos += 8;
      doc.text(`Anual: ${formatCurrency(proposal.totalValue * 12)}`, 105, yPos, { align: 'center' });
      yPos += 15;

      // Descrição
      if (proposal.description) {
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text('DESCRIÇÃO DO SERVIÇO', 14, yPos);
        yPos += 8;
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const descLines = doc.splitTextToSize(proposal.description, 180);
        doc.text(descLines, 14, yPos);
        yPos += descLines.length * 6 + 10;
      }

      // Salvar PDF
      const fileName = `proposta_acordo_${proposal.proposalNumber || proposal.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Sucesso",
        description: "PDF gerado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o PDF.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadExcel = async (proposal: AgreementProposal) => {
    try {
      // Buscar proposta completa do backend para garantir que temos o nome do cliente
      let clientName = proposal.clientName || 'N/A';
      try {
        const proposalId = typeof proposal.id === 'string' ? proposal.id : String(proposal.id);
        const fullProposal = await proposalService.getProposalById(proposalId);
        clientName = fullProposal.client?.name || (fullProposal as any).clientName || proposal.clientName || 'N/A';
      } catch (error) {
        console.error('Erro ao buscar proposta completa para Excel:', error);
        // Usar o nome que já temos
      }

      const workbook = XLSX.utils.book_new();

      // Aba: Resumo
      const resumoData = [
        ['PROPOSTA COMERCIAL DE ACORDO'],
        ['Número', proposal.proposalNumber || 'N/A'],
        ['Data', new Date(proposal.createdAt).toLocaleDateString('pt-BR')],
        ['Cliente', clientName],
        ['Status', getStatusLabel(proposal.status)],
        [''],
        ['VALOR FINAL'],
        ['Mensal', proposal.totalValue],
        ['Anual', proposal.totalValue * 12],
        [''],
        ['DESCRIÇÃO DO SERVIÇO'],
        [proposal.description || '']
      ];
      const resumoSheet = XLSX.utils.aoa_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo');

      // Salvar Excel
      const fileName = `proposta_acordo_${proposal.proposalNumber || proposal.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Sucesso",
        description: "Excel gerado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o Excel.",
        variant: "destructive"
      });
    }
  };

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

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      DRAFT: 'Rascunho',
      SENT: 'Enviada',
      UNDER_REVIEW: 'Em Análise',
      APPROVED: 'Aprovada',
      REJECTED: 'Rejeitada',
      EXPIRED: 'Expirada',
      CONVERTED: 'Convertida'
    };
    return statusMap[status] || status;
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
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray">Lista de Propostas de Acordo</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Nenhuma proposta de acordo encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-600">
                    <TableHead className="text-seguranca-lightgray">Número</TableHead>
                    <TableHead className="text-seguranca-lightgray">Título</TableHead>
                    <TableHead className="text-seguranca-lightgray">Cliente</TableHead>
                    <TableHead className="text-seguranca-lightgray">Status</TableHead>
                    <TableHead className="text-seguranca-lightgray">Valor Mensal</TableHead>
                    <TableHead className="text-seguranca-lightgray">Válida Até</TableHead>
                    <TableHead className="text-seguranca-lightgray text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProposals.map((proposal) => (
                    <TableRow key={proposal.id} className="border-gray-600">
                      <TableCell className="text-seguranca-lightgray font-medium">
                        {proposal.proposalNumber || '-'}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray">
                        <div>
                          <div className="font-medium">{proposal.title}</div>
                          <div className="text-sm text-gray-400">{proposal.description || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray">
                        {proposal.clientName}
                      </TableCell>
                      <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                      <TableCell className="text-seguranca-lightgray font-medium">
                        {proposal.totalValue ? formatCurrency(proposal.totalValue) : '-'}
                      </TableCell>
                      <TableCell className="text-seguranca-lightgray">
                        {proposal.validUntil ? formatDate(proposal.validUntil) : '-'}
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
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                            onClick={async () => {
                              setSelectedProposal(proposal);
                              // Carregar clientes se necessário
                              if (clients.length === 0) {
                                await loadClients();
                              }
                              // Buscar proposta completa do backend para ter clientId
                              try {
                                const proposalId = typeof proposal.id === 'string' ? proposal.id : String(proposal.id);
                                const fullProposal = await proposalService.getProposalById(proposalId);
                                const clientId = (fullProposal as any).clientId 
                                  ? String((fullProposal as any).clientId)
                                  : (fullProposal.client?.id ? String(fullProposal.client.id) : undefined);
                                setEditClientId(clientId);
                              } catch (error) {
                                console.error('Erro ao carregar proposta completa:', error);
                                // Tentar extrair do objeto atual
                                const clientId = (proposal as any).clientId 
                                  ? String((proposal as any).clientId)
                                  : (proposal.client?.id ? String(proposal.client.id) : undefined);
                                setEditClientId(clientId);
                              }
                              setIsEditModalOpen(true);
                            }}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-seguranca-black border-gray-600 text-blue-400 hover:text-blue-300"
                            onClick={() => handleDownloadPDF(proposal)}
                            title="Download PDF"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-seguranca-black border-gray-600 text-green-400 hover:text-green-300"
                            onClick={() => handleDownloadExcel(proposal)}
                            title="Download Excel"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-seguranca-black border-gray-600 text-red-400 hover:text-red-300"
                            onClick={() => handleDelete(proposal.id)}
                            title="Excluir"
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
          )}
        </CardContent>
      </Card>

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="bg-seguranca-graphite border-gray-600 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">Detalhes da Proposta de Acordo</DialogTitle>
            <DialogDescription className="text-gray-400">
              Visualize os detalhes completos da proposta de acordo selecionada
            </DialogDescription>
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
                  <Label className="text-gray-400">Valor Mensal</Label>
                  <p className="text-seguranca-lightgray font-medium">
                    {formatCurrency(selectedProposal.totalValue)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400">Valor Anual</Label>
                  <p className="text-seguranca-lightgray font-medium">
                    {formatCurrency(selectedProposal.totalValue * 12)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400">Válida Até</Label>
                  <p className="text-seguranca-lightgray">{formatDate(selectedProposal.validUntil)}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Data de Criação</Label>
                  <p className="text-seguranca-lightgray">{formatDate(selectedProposal.createdAt)}</p>
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
                <Button
                  className="bg-seguranca-red hover:bg-seguranca-darkred"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedProposal(selectedProposal);
                    setIsEditModalOpen(true);
                  }}
                >
                  Editar Proposta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-seguranca-graphite border-gray-600 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">Editar Proposta de Acordo</DialogTitle>
            <DialogDescription className="text-gray-400">
              Atualize os dados da proposta de acordo
            </DialogDescription>
          </DialogHeader>
          {selectedProposal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title" className="text-seguranca-lightgray">Título *</Label>
                  <Input
                    id="edit-title"
                    value={selectedProposal.title}
                    onChange={(e) => setSelectedProposal({ ...selectedProposal, title: e.target.value })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-client" className="text-seguranca-lightgray">Cliente</Label>
                  <Select
                    value={editClientId ? String(editClientId) : ''}
                    onValueChange={(value) => {
                      setEditClientId(value ? (isNaN(Number(value)) ? value : Number(value)) : undefined);
                    }}
                    disabled={loadingClients}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder={loadingClients ? "Carregando..." : "Selecione o cliente"} />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-[300px]">
                      {clients.map((client) => (
                        <SelectItem 
                          key={client.id} 
                          value={String(client.id)}
                          className="text-seguranca-lightgray hover:bg-seguranca-red/20"
                        >
                          {client.name} {client.cnpj ? `- ${client.cnpj}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-status" className="text-seguranca-lightgray">Status</Label>
                  <Select
                    value={selectedProposal.status}
                    onValueChange={(value) => setSelectedProposal({ ...selectedProposal, status: value as any })}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="DRAFT" className="text-seguranca-lightgray">Rascunho</SelectItem>
                      <SelectItem value="SENT" className="text-seguranca-lightgray">Enviada</SelectItem>
                      <SelectItem value="UNDER_REVIEW" className="text-seguranca-lightgray">Em Análise</SelectItem>
                      <SelectItem value="APPROVED" className="text-seguranca-lightgray">Aprovada</SelectItem>
                      <SelectItem value="REJECTED" className="text-seguranca-lightgray">Rejeitada</SelectItem>
                      <SelectItem value="EXPIRED" className="text-seguranca-lightgray">Expirada</SelectItem>
                      <SelectItem value="CONVERTED" className="text-seguranca-lightgray">Convertida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-totalValue" className="text-seguranca-lightgray">Valor Mensal *</Label>
                  <Input
                    id="edit-totalValue"
                    type="number"
                    step="0.01"
                    value={selectedProposal.totalValue || ''}
                    onChange={(e) => setSelectedProposal({ ...selectedProposal, totalValue: parseFloat(e.target.value) || 0 })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-validUntil" className="text-seguranca-lightgray">Válida Até</Label>
                  <Input
                    id="edit-validUntil"
                    type="date"
                    value={selectedProposal.validUntil || ''}
                    onChange={(e) => setSelectedProposal({ ...selectedProposal, validUntil: e.target.value })}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description" className="text-seguranca-lightgray">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={selectedProposal.description || ''}
                  onChange={(e) => setSelectedProposal({ ...selectedProposal, description: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray min-h-[100px]"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditClientId(undefined);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-seguranca-red hover:bg-seguranca-darkred"
                  onClick={async () => {
                    if (!selectedProposal) return;
                    try {
                      // Converter clientId para string se necessário
                      const clientId = editClientId 
                        ? (typeof editClientId === 'string' ? editClientId : String(editClientId))
                        : undefined;
                      
                      const proposalId = typeof selectedProposal.id === 'string' 
                        ? selectedProposal.id 
                        : String(selectedProposal.id);
                      
                      await proposalService.updateProposal(proposalId, {
                        title: selectedProposal.title,
                        clientId: clientId,
                        totalValue: selectedProposal.totalValue,
                        validUntil: selectedProposal.validUntil,
                        description: selectedProposal.description,
                        status: selectedProposal.status
                      });
                      toast({
                        title: "Sucesso",
                        description: "Proposta de acordo atualizada com sucesso!",
                      });
                      setIsEditModalOpen(false);
                      setEditClientId(undefined);
                      await loadProposals();
                    } catch (error: any) {
                      console.error('Erro ao atualizar proposta de acordo:', error);
                      toast({
                        title: "Erro",
                        description: error.response?.data?.message || "Não foi possível atualizar a proposta de acordo.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  Atualizar Proposta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

