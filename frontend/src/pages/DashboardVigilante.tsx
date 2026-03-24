import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  User, 
  Calendar,
  File,
  CheckCircle,
  Clock,
  AlertCircle,
  GraduationCap,
  AlertTriangle,
  BookOpen,
  Award,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { payslipService } from '@/services/payslipService';
import { receiptService } from '@/services/receiptService';
import { unifiedDocumentService } from '@/services/unifiedDocumentService';
import { treinamentoService, Treinamento } from '@/services/treinamentoService';

interface Payslip {
  id: string;
  employeeName: string;
  cpf: string;
  month: number;
  year: number;
  fileName: string;
  filePath: string;
  createdAt: string;
}

interface Receipt {
  id: string;
  employeeName: string;
  cpf: string;
  month: number;
  year: number;
  fileName: string;
  filePath: string;
  transferDate: string;
}

interface UnifiedDocument {
  id: string;
  employeeName: string;
  cpf: string;
  month: number;
  year: number;
  payslipFileName: string;
  receiptFileName: string;
  unifiedFileName?: string;
  fileName?: string;
  createdAt: string;
}

const DashboardVigilante: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [unifiedDocs, setUnifiedDocs] = useState<UnifiedDocument[]>([]);
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payslipsData, receiptsData, unifiedData, treinamentosData] = await Promise.all([
        payslipService.getAllPayslips(),
        receiptService.getAllReceipts(),
        unifiedDocumentService.getAllUnifiedDocuments(),
        treinamentoService.getTreinamentosPendentes()
      ]);

      setPayslips(payslipsData);
      setReceipts(receiptsData);
      setUnifiedDocs(unifiedData);
      setTreinamentos(treinamentosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seus dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPayslip = async (fileName: string) => {
    try {
      await payslipService.downloadPayslip(fileName);
      toast({
        title: 'Sucesso',
        description: 'Holerite baixado com sucesso!',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar o holerite',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadReceipt = async (receipt: Receipt) => {
    if (!receipt?.id) {
      toast({
        title: 'Documento inválido',
        description: 'Não foi possível identificar o comprovante.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await receiptService.downloadReceipt(receipt.id, receipt.fileName);
      toast({
        title: 'Sucesso',
        description: 'Comprovante baixado com sucesso!',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar o comprovante',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadUnified = async (fileName?: string) => {
    if (!fileName) {
      toast({
        title: 'Documento inválido',
        description: 'Não foi possível identificar o arquivo para download.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await unifiedDocumentService.downloadUnifiedDocument(fileName);
      toast({
        title: 'Sucesso',
        description: 'Documento unificado baixado com sucesso!',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar o documento',
        variant: 'destructive'
      });
    }
  };

  const handleMarcarTreinamentoConcluido = async (treinamentoId: string) => {
    try {
      await treinamentoService.marcarComoConcluido(treinamentoId);
      toast({
        title: 'Sucesso',
        description: 'Treinamento marcado como concluído!',
        variant: 'default'
      });
      loadData(); // Recarregar dados
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar o treinamento',
        variant: 'destructive'
      });
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1] || 'Desconhecido';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTreinamentoPriorityColor = (priority: string) => {
    switch (priority) {
      case 'ALTA':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'MEDIA':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'BAIXA':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTreinamentoStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'EM_ANDAMENTO':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'CONCLUIDO':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ATRASADO':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const calcularDiasRestantes = (dataLimite: string) => {
    const hoje = new Date();
    const limite = new Date(dataLimite);
    const diff = Math.ceil((limite.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const treinamentosPendentes = treinamentos.filter(t => t.status === 'PENDENTE' || t.status === 'EM_ANDAMENTO');
  const treinamentosAtrasados = treinamentos.filter(t => t.status === 'ATRASADO');
  const treinamentosConcluidos = treinamentos.filter(t => t.status === 'CONCLUIDO');

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-seguranca-yellow mx-auto mb-4"></div>
            <p className="text-seguranca-lightgray">Carregando seus dados...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        {/* Cabeçalho com dados do vigilante */}
        <div className="bg-seguranca-black/60 border border-gray-800 rounded-2xl shadow-sm p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-seguranca-yellow/15 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-seguranca-yellow" />
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-gray-500">Portal do Vigilante</p>
                <h1 className="text-xl sm:text-2xl font-semibold text-seguranca-lightgray">
                  Bem-vindo, {user?.name}!
                </h1>
                <p className="text-sm text-gray-400">
                  Acompanhe seus treinamentos, holerites e documentos importantes.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge className="bg-seguranca-yellow/20 text-seguranca-yellow border-seguranca-yellow/30">
                    Vigilante
                  </Badge>
                  {treinamentosAtrasados.length > 0 && (
                    <Badge className="bg-red-500/15 text-red-400 border-red-500/30">
                      {treinamentosAtrasados.length} treinamento(s) atrasado(s)
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-400">
                <div>
                  <span className="block text-xs uppercase text-gray-500">CPF</span>
                  <span className="font-medium text-seguranca-lightgray break-all">
                    {user?.username}
                  </span>
                </div>
                {user?.email && (
                  <div>
                    <span className="block text-xs uppercase text-gray-500">Email</span>
                    <span className="font-medium text-seguranca-lightgray break-all">
                      {user.email}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-orange-400" />
                Treinamentos Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-seguranca-lightgray">
                {treinamentosPendentes.length}
              </div>
              <p className="text-xs text-gray-400 mt-1">Para concluir</p>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Holerites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-seguranca-lightgray">
                {payslips.length}
              </div>
              <p className="text-xs text-gray-400 mt-1">Disponíveis</p>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <File className="w-4 h-4 text-green-400" />
                Comprovantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-seguranca-lightgray">
                {receipts.length}
              </div>
              <p className="text-xs text-gray-400 mt-1">Disponíveis</p>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-black border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                Unificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-seguranca-lightgray">
                {unifiedDocs.length}
              </div>
              <p className="text-xs text-gray-400 mt-1">Documentos completos</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerta de Treinamentos Atrasados */}
        {treinamentosAtrasados.length > 0 && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-1">
                    Atenção: Treinamentos Atrasados!
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Você possui {treinamentosAtrasados.length} treinamento(s) com prazo vencido. 
                    Por favor, regularize sua situação o quanto antes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs com conteúdo */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 bg-seguranca-black/80 border border-gray-800 rounded-xl p-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <TabsTrigger
              value="overview"
              className="flex-1 justify-center whitespace-nowrap rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm text-gray-300 transition-colors data-[state='active']:bg-seguranca-red data-[state='active']:text-white"
            >
              Visão Geral
              {treinamentosPendentes.length > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white text-[10px]">
                  {treinamentosPendentes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="payslips"
              className="flex-1 justify-center whitespace-nowrap rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm text-gray-300 transition-colors data-[state='active']:bg-seguranca-red data-[state='active']:text-white"
            >
              Holerites
            </TabsTrigger>
            <TabsTrigger
              value="receipts"
              className="flex-1 justify-center whitespace-nowrap rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm text-gray-300 transition-colors data-[state='active']:bg-seguranca-red data-[state='active']:text-white"
            >
              Comprovantes
            </TabsTrigger>
            <TabsTrigger
              value="unified"
              className="flex-1 justify-center whitespace-nowrap rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm text-gray-300 transition-colors data-[state='active']:bg-seguranca-red data-[state='active']:text-white"
            >
              Unificados
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-4 mt-5">
            {/* Treinamentos Pendentes */}
            <Card className="bg-seguranca-black border-gray-700">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-orange-400" />
                  Treinamentos Pendentes
                </CardTitle>
                <CardDescription>
                  {treinamentosPendentes.length} treinamento(s) para concluir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {treinamentosPendentes.map((treinamento) => {
                    const diasRestantes = calcularDiasRestantes(treinamento.dataLimite);
                    const progresso = treinamento.progresso || 0;
                    
                    return (
                      <div
                        key={treinamento.id}
                        className="p-4 bg-seguranca-graphite rounded-lg hover:bg-seguranca-graphite/70 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="w-4 h-4 text-orange-400" />
                              <h4 className="font-semibold text-seguranca-lightgray">
                                {treinamento.titulo}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">
                              {treinamento.descricao}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={getTreinamentoStatusColor(treinamento.status)}>
                                {treinamento.status === 'PENDENTE' && 'Pendente'}
                                {treinamento.status === 'EM_ANDAMENTO' && 'Em Andamento'}
                                {treinamento.status === 'ATRASADO' && 'Atrasado'}
                              </Badge>
                              <Badge className={getTreinamentoPriorityColor(treinamento.prioridade)}>
                                Prioridade {treinamento.prioridade}
                              </Badge>
                              {diasRestantes >= 0 ? (
                                <span className="text-xs text-gray-400">
                                  {diasRestantes === 0 ? 'Vence hoje!' : `${diasRestantes} dias restantes`}
                                </span>
                              ) : (
                                <span className="text-xs text-red-400 font-semibold">
                                  Atrasado há {Math.abs(diasRestantes)} dias
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Barra de Progresso */}
                        {progresso > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-400">Progresso</span>
                              <span className="text-xs text-seguranca-yellow font-semibold">{progresso}%</span>
                            </div>
                            <Progress value={progresso} className="h-2" />
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleMarcarTreinamentoConcluido(treinamento.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marcar como Concluído
                          </Button>
                          {treinamento.linkMaterial && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(treinamento.linkMaterial, '_blank')}
                              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                            >
                              <BookOpen className="w-4 h-4 mr-2" />
                              Acessar Material
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {treinamentosPendentes.length === 0 && (
                    <div className="text-center py-8">
                      <Award className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <p className="text-gray-400">Parabéns! Você está em dia com seus treinamentos.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas de Treinamentos */}
            {treinamentos.length > 0 && (
              <Card className="bg-seguranca-black border-gray-700">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Seu Progresso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-500/10 rounded-lg text-center">
                      <Award className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-400">{treinamentosConcluidos.length}</div>
                      <div className="text-sm text-gray-400">Concluídos</div>
                    </div>
                    <div className="p-4 bg-orange-500/10 rounded-lg text-center">
                      <Clock className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-orange-400">{treinamentosPendentes.length}</div>
                      <div className="text-sm text-gray-400">Pendentes</div>
                    </div>
                    <div className="p-4 bg-red-500/10 rounded-lg text-center">
                      <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-400">{treinamentosAtrasados.length}</div>
                      <div className="text-sm text-gray-400">Atrasados</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Holerites */}
          <TabsContent value="payslips" className="mt-5">
            <Card className="bg-seguranca-black border-gray-700">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Meus Holerites
                </CardTitle>
                <CardDescription>
                  {payslips.length} {payslips.length === 1 ? 'holerite disponível' : 'holerites disponíveis'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {payslips.map((payslip) => (
                    <div
                      key={payslip.id}
                      className="flex items-center justify-between p-4 bg-seguranca-graphite rounded-lg hover:bg-seguranca-graphite/70 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-seguranca-lightgray">
                            Holerite {getMonthName(payslip.month)}/{payslip.year}
                          </p>
                          <p className="text-sm text-gray-400">
                            Emitido em {formatDate(payslip.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPayslip(payslip.fileName)}
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  ))}
                  {payslips.length === 0 && (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">Nenhum holerite disponível</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comprovantes */}
          <TabsContent value="receipts" className="mt-5">
            <Card className="bg-seguranca-black border-gray-700">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <File className="w-5 h-5 text-green-400" />
                  Meus Comprovantes
                </CardTitle>
                <CardDescription>
                  {receipts.length} {receipts.length === 1 ? 'comprovante disponível' : 'comprovantes disponíveis'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex items-center justify-between p-4 bg-seguranca-graphite rounded-lg hover:bg-seguranca-graphite/70 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                          <File className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-seguranca-lightgray">
                            Comprovante {getMonthName(receipt.month)}/{receipt.year}
                          </p>
                          <p className="text-sm text-gray-400">
                            Transferência em {formatDate(receipt.transferDate)}
                          </p>
                        </div>
                      </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadReceipt(receipt)}
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                        >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  ))}
                  {receipts.length === 0 && (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">Nenhum comprovante disponível</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Unificados */}
          <TabsContent value="unified" className="mt-5">
            <Card className="bg-seguranca-black border-gray-700">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                  Documentos Unificados
                </CardTitle>
                <CardDescription>
                  {unifiedDocs.length} {unifiedDocs.length === 1 ? 'documento disponível' : 'documentos disponíveis'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unifiedDocs.map((doc) => (
                    <div
                      key={doc.id ?? doc.fileName ?? doc.unifiedFileName}
                      className="flex items-center justify-between p-4 bg-seguranca-graphite rounded-lg hover:bg-seguranca-graphite/70 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-seguranca-lightgray">
                            Documento {getMonthName(doc.month)}/{doc.year}
                          </p>
                          <p className="text-sm text-gray-400">
                            Holerite + Comprovante | {formatDate(doc.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                          onClick={() => handleDownloadUnified(doc.fileName ?? doc.unifiedFileName)}
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  ))}
                  {unifiedDocs.length === 0 && (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">Nenhum documento unificado disponível</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StandardLayout>
  );
};

export default DashboardVigilante;

