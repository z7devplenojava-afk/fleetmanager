import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Loader2,
  FileDown,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Car,
  DollarSign,
  User,
  Calendar,
  MapPin,
  RefreshCw,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import vehicleFineQueryService, {
  VehicleFineQueryResponse,
  InfracaoDetalhada,
} from '@/services/vehicleFineQueryService';

interface VehicleFineQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlate?: string;
  initialRenavam?: string;
  initialUf?: string;
  onFinesUpdated?: () => void;
}

export const VehicleFineQueryModal: React.FC<VehicleFineQueryModalProps> = ({
  isOpen,
  onClose,
  initialPlate = '',
  initialRenavam = '',
  initialUf = 'MG',
  onFinesUpdated,
}) => {
  const { toast } = useToast();
  const [placa, setPlaca] = useState(initialPlate);
  const [renavam, setRenavam] = useState(initialRenavam);
  const [uf, setUf] = useState(initialUf);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [result, setResult] = useState<VehicleFineQueryResponse | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPlaca(initialPlate);
      setRenavam(initialRenavam);
      setUf(initialUf || 'MG');
      if (initialPlate) {
        handleSearch(false, initialPlate, initialRenavam, initialUf);
      } else {
        setResult(null);
      }
    }
  }, [isOpen, initialPlate, initialRenavam, initialUf]);

  const validatePlate = (plate: string) => {
    const clean = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const regexMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
    const regexTradicional = /^[A-Z]{3}[0-9]{4}$/;
    return regexMercosul.test(clean) || regexTradicional.test(clean);
  };

  const handleSearch = async (
    forceRefresh = false,
    searchPlate = placa,
    searchRenavam = renavam,
    searchUf = uf
  ) => {
    const cleanPlate = searchPlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!cleanPlate) {
      toast({
        title: 'Placa obrigatória',
        description: 'Por favor, informe a placa do veículo para realizar a consulta.',
        variant: 'destructive',
      });
      return;
    }

    if (!validatePlate(cleanPlate)) {
      toast({
        title: 'Formato de placa inválido',
        description: 'Utilize o formato padrão Mercosul (ex: ABC1D23) ou Tradicional (ex: ABC-1234).',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const data = await vehicleFineQueryService.consultarMultas({
        placa: cleanPlate,
        renavam: searchRenavam?.trim() || undefined,
        uf: searchUf?.trim() || 'MG',
        forceRefresh,
      });

      setResult(data);
      if (data.total_importadas_sistema && data.total_importadas_sistema > 0) {
        toast({
          title: 'Sincronização Automática',
          description: `${data.total_importadas_sistema} nova(s) multa(s) vinculada(s) à gestão do veículo!`,
        });
        if (onFinesUpdated) {
          onFinesUpdated();
        }
      }
    } catch (error: any) {
      console.error('Erro na consulta veicular:', error);
      toast({
        title: 'Falha na consulta veicular',
        description:
          error?.response?.data?.message ||
          'Serviço temporariamente indisponível. Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
    setDownloadingPdf(true);
    try {
      const blob = await vehicleFineQueryService.baixarExtratoPdf(result);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `extrato-multas-${result.dados_veiculo?.placa || 'veiculo'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Extrato Gerado',
        description: 'O PDF do extrato de multas e condutores foi baixado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro no download',
        description: 'Não foi possível gerar o PDF do extrato.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-sm">
                <Car className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                  Consulta de Multas, Débitos e Restrições Veiculares
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                    Parte Diária Integrada
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-sm">
                  Consulta consolidada de autuações governamentais com apuração inteligente do motorista por rotas e diárias.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Formulário de Busca */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label className="text-xs font-semibold text-slate-600">Placa do Veículo *</Label>
              <Input
                placeholder="Ex: ABC1D23"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                className="mt-1 font-mono uppercase tracking-wider font-semibold text-base"
                maxLength={8}
                disabled={loading}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600">RENAVAM (Opcional)</Label>
              <Input
                placeholder="Ex: 00123456789"
                value={renavam}
                onChange={(e) => setRenavam(e.target.value.replace(/\D/g, ''))}
                className="mt-1"
                maxLength={11}
                disabled={loading}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600">UF de Registro</Label>
              <Input
                placeholder="MG"
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                className="mt-1 uppercase"
                maxLength={2}
                disabled={loading}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleSearch(false)}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Consultar
                  </>
                )}
              </Button>

              {result && (
                <Button
                  variant="outline"
                  size="icon"
                  title="Forçar atualização na API externa (ignorar cache)"
                  onClick={() => handleSearch(true)}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-16 text-center">
            <div className="inline-flex p-4 rounded-full bg-blue-50 border border-blue-100 mb-4 animate-pulse">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Consultando Bases de Trânsito</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              Verificando Detran, DNIT, órgãos municipais e cruzando com as Partes Diárias de motoristas...
            </p>
          </div>
        )}

        {/* Resultados */}
        {!loading && result && (
          <div className="space-y-6 mt-4">
            {/* Metadados da consulta */}
            <div className="flex items-center justify-between bg-slate-100/80 px-3 py-2 rounded-lg text-xs text-slate-600 border">
              <div className="flex items-center gap-2">
                <span>Origem dos Dados:</span>
                <Badge
                  variant="secondary"
                  className={
                    result.origem_dados === 'API_LIVE'
                      ? 'bg-blue-100 text-blue-800'
                      : result.origem_dados === 'CACHE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-purple-100 text-purple-800'
                  }
                >
                  {result.origem_dados === 'API_LIVE'
                    ? '🔴 API Em Tempo Real'
                    : result.origem_dados === 'CACHE'
                    ? '⚡ Cache Local (Economia de Créditos)'
                    : '🧪 Provedor Sandbox / Simulado'}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <span>
                  Consultado em:{' '}
                  {result.consultado_em
                    ? new Date(result.consultado_em).toLocaleString('pt-BR')
                    : new Date().toLocaleString('pt-BR')}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="h-7 text-xs bg-white text-slate-700 hover:bg-slate-50"
                >
                  {downloadingPdf ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <FileDown className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                  )}
                  Baixar Extrato PDF
                </Button>
              </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-blue-600" />
                    Veículo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-slate-800 tracking-tight">
                    {result.dados_veiculo?.marca_modelo || 'N/D'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                    <span>Placa: <strong className="text-slate-700 font-mono">{result.dados_veiculo?.placa}</strong></span>
                    <span>Ano: {result.dados_veiculo?.ano_fabricacao || '-'}/{result.dados_veiculo?.ano_modelo || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    Multas Identificadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">
                    {result.resumo_debitos?.quantidade_multas || 0}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {result.resumo_debitos?.quantidade_multas ? 'Pendências no sistema' : 'Nenhuma autuação ativa'}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-rose-600" />
                    Total de Débitos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-rose-600">
                    R${' '}
                    {(result.resumo_debitos?.valor_total || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Valor consolidado</div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-indigo-600" />
                    Restrições / Bloqueios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.restricoes && result.restricoes.length > 0 ? (
                    <div>
                      <Badge variant="destructive" className="bg-rose-100 text-rose-700 border-rose-200 text-xs">
                        {result.restricoes.length} Restrição(ões)
                      </Badge>
                      <div className="text-xs text-slate-600 truncate mt-1">
                        {result.restricoes[0].descricao}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                        Sem Restrições
                      </Badge>
                      <div className="text-xs text-slate-500 mt-1">Veículo regular</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Restrições Detalhadas (se existirem) */}
            {result.restricoes && result.restricoes.length > 0 && (
              <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl">
                <div className="flex items-center gap-2 font-semibold text-amber-900 text-sm mb-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  Restrições Administrativas e Judiciais Encontradas
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.restricoes.map((r, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-amber-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{r.tipo}</span>
                        <Badge variant="outline" className="text-[10px]">{r.status || 'ATIVO'}</Badge>
                      </div>
                      <p className="text-slate-600 mt-1">{r.descricao}</p>
                      {r.orgao && <p className="text-slate-400 mt-0.5">Órgão: {r.orgao}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabela de Multas e Apuração da Parte Diária */}
            <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    Discriminação das Infrações & Cruzamento com a Parte Diária
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {result.infracoes?.length || 0} infrações
                    </Badge>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    O sistema cruza automaticamente o dia e o horário da infração com os registros de Partes Diárias para indicar o motorista em serviço.
                  </p>
                </div>
              </div>

              {result.infracoes && result.infracoes.length > 0 ? (
                <Table>
                  <TableHeader className="bg-slate-100/60">
                    <TableRow>
                      <TableHead className="text-xs font-bold text-slate-600">Auto / Órgão</TableHead>
                      <TableHead className="text-xs font-bold text-slate-600">Código / Descrição</TableHead>
                      <TableHead className="text-xs font-bold text-slate-600 bg-blue-50/50">
                        <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                          <User className="h-3.5 w-3.5 text-blue-600" />
                          Motorista Apurado (Parte Diária)
                        </div>
                      </TableHead>
                      <TableHead className="text-xs font-bold text-slate-600">Data / Local</TableHead>
                      <TableHead className="text-xs font-bold text-slate-600 text-right">Valor / Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.infracoes.map((inf, idx) => (
                      <TableRow key={idx} className="hover:bg-slate-50/80">
                        {/* Auto e Órgão */}
                        <TableCell className="align-top py-3">
                          <div className="font-mono font-bold text-xs text-slate-800">
                            {inf.auto_infracao}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {inf.orgao_autuador || 'Órgão Autuador'}
                          </div>
                          {inf.ja_cadastrada_no_sistema && (
                            <Badge variant="outline" className="mt-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-normal">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Sincronizada no Sistema
                            </Badge>
                          )}
                        </TableCell>

                        {/* Código e Descrição */}
                        <TableCell className="align-top py-3 max-w-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {inf.codigo_infracao || '7455-0'}
                            </Badge>
                            {inf.pontos ? (
                              <span className="text-[11px] font-semibold text-rose-600">
                                {inf.pontos} pontos
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-slate-700 mt-1 line-clamp-2" title={inf.descricao}>
                            {inf.descricao}
                          </p>
                        </TableCell>

                        {/* Motorista Apurado na Parte Diária */}
                        <TableCell className="align-top py-3 bg-blue-50/30">
                          {inf.motorista_apurado ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs text-blue-950 flex items-center gap-1">
                                  <User className="h-3 w-3 text-blue-600" />
                                  {inf.motorista_apurado.driver_name}
                                </span>
                                <Badge
                                  className={`text-[9px] px-1.5 py-0 h-4 ${
                                    inf.motorista_apurado.confianca_cruzamento === 'ALTA'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-amber-500 text-white'
                                  }`}
                                >
                                  {inf.motorista_apurado.confianca_cruzamento === 'ALTA'
                                    ? 'Horário Exato'
                                    : 'Mesmo Dia'}
                                </Badge>
                              </div>

                              {inf.motorista_apurado.parte_diaria_number && (
                                <div className="text-[11px] text-slate-600 flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  Diária #{inf.motorista_apurado.parte_diaria_number}
                                  {inf.motorista_apurado.horario_inicio && inf.motorista_apurado.horario_fim && (
                                    <span className="text-slate-400">
                                      ({inf.motorista_apurado.horario_inicio} - {inf.motorista_apurado.horario_fim})
                                    </span>
                                  )}
                                </div>
                              )}

                              {inf.motorista_apurado.obra_nome && (
                                <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                                  Obra: {inf.motorista_apurado.obra_nome}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic">
                              Nenhuma diária localizada para este horário.
                            </div>
                          )}
                        </TableCell>

                        {/* Data e Local */}
                        <TableCell className="align-top py-3">
                          <div className="text-xs text-slate-800 font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {inf.data_hora
                              ? new Date(inf.data_hora).toLocaleString('pt-BR')
                              : 'Data não informada'}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-start gap-1 max-w-[220px]">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                            <span className="truncate" title={inf.local}>{inf.local || 'Local não informado'}</span>
                          </div>
                        </TableCell>

                        {/* Valor e Situação */}
                        <TableCell className="align-top py-3 text-right">
                          <div className="text-xs font-bold text-slate-900">
                            R${' '}
                            {(inf.valor || 0).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          {inf.data_vencimento && (
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Venc: {inf.data_vencimento}
                            </div>
                          )}
                          <Badge variant="outline" className="mt-1 text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                            {inf.situacao || 'PENDENTE'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  Nenhuma infração pendente encontrada para este veículo.
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VehicleFineQueryModal;
