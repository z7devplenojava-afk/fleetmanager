import React, { useEffect, useMemo, useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import holeriteService, { Holerite } from '@/services/holeriteService';
import paymentReceiptService, { PaymentReceipt } from '@/services/paymentReceiptService';
import { getApiUrl } from '@/config/environment';
import { unifiedDocumentService } from '@/services/unifiedDocumentService';
import api from '@/lib/axios';
import { User } from '@/types/user';
import {
  Loader2,
  FileText,
  Download,
  Eye,
  Calendar,
  Folder,
  Building2,
  FileDown
} from 'lucide-react';

interface UnifiedDocument {
  employeeName?: string;
  cpf?: string;
  fileName: string;
  month?: number;
  year?: number;
}

interface SectorDocument {
  fileName: string;
  filePath: string;
  employeeName: string;
  cpf: string;
  sector: string;
  month: number;
  year: number;
  period: string;
}

interface SectorGroup {
  name: string;
  documentCount: number;
  documents: SectorDocument[];
}

const monthNames: Record<number, string> = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro',
};

const getMonthName = (month: number) => monthNames[month] ?? `Mês ${month}`;

const sanitizeCpf = (value?: string | null) => (value ? value.replace(/\D/g, '') : '');

const normalizeName = (value?: string | null) => {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

const extractCpfFromString = (value?: string | null) => {
  if (!value) return '';
  const match = value.match(/(\d{11})/);
  return match ? match[1] : '';
};

const buildDownloadUrl = (path: string) => {
  const apiUrl = getApiUrl();
  if (path.startsWith('http')) {
    return path;
  }
  return `${apiUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const CollaboratorHolerites: React.FC<{ user: User }> = ({ user }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'holerites' | 'receipts' | 'unificacao' | 'setores'>('holerites');
  const [loading, setLoading] = useState(true);
  const [holerites, setHolerites] = useState<Holerite[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [unifiedDocuments, setUnifiedDocuments] = useState<UnifiedDocument[]>([]);
  const [sectorGroups, setSectorGroups] = useState<SectorGroup[]>([]);

  const userCpf = sanitizeCpf((user as any)?.cpf ?? user?.username ?? '');
  const userName = normalizeName(user?.name);

  useEffect(() => {
    let mounted = true;

    const matchesUser = (cpf?: string | null, name?: string | null, fallback?: string | null) => {
      const sanitized = sanitizeCpf(cpf);
      if (userCpf) {
        if (sanitized && sanitized === userCpf) {
          return true;
        }
        const fallbackCpf = sanitizeCpf(extractCpfFromString(fallback));
        if (fallbackCpf && fallbackCpf === userCpf) {
          return true;
        }
      }
      if (userName) {
        const normalizedCandidate = normalizeName(name ?? fallback ?? '');
        if (normalizedCandidate && normalizedCandidate === userName) {
          return true;
        }
      }
      return !userCpf && !userName;
    };

    const loadData = async () => {
      setLoading(true);
      try {
        const [holeritesResult, receiptsResult, unifiedResult, sectorsResult] = await Promise.allSettled([
          holeriteService.getAllHolerites(),
          paymentReceiptService.getAllPaymentReceipts(),
          api.get('/api/unified-documents/list', { params: { _t: Date.now() } }),
          api.get('/api/sector-organization/list'),
        ]);

        if (!mounted) {
          return;
        }

        if (holeritesResult.status === 'fulfilled') {
          const filtered = (holeritesResult.value || []).filter((holerite) =>
            matchesUser(holerite.cpf, holerite.employeeName, holerite.fileName)
          );
          setHolerites(filtered);
        } else {
          setHolerites([]);
          console.error('Erro ao carregar holerites:', holeritesResult.reason);
        }

        if (receiptsResult.status === 'fulfilled') {
          const filtered = (receiptsResult.value || []).filter((receipt) =>
            matchesUser(
              (receipt as any)?.cpf ?? receipt.employeeId,
              receipt.employeeName ?? (receipt as any)?.creditedName,
              receipt.fileName
            )
          );
          setReceipts(filtered);
        } else {
          setReceipts([]);
          console.error('Erro ao carregar comprovantes:', receiptsResult.reason);
        }

        if (unifiedResult.status === 'fulfilled') {
          const data = Array.isArray(unifiedResult.value.data?.documents)
            ? unifiedResult.value.data.documents
            : [];
          const filtered = data.filter((doc: UnifiedDocument) =>
            matchesUser(doc.cpf, doc.employeeName, doc.fileName)
          );
          setUnifiedDocuments(filtered);
        } else {
          setUnifiedDocuments([]);
          console.error('Erro ao carregar unificações:', unifiedResult.reason);
        }

        if (sectorsResult.status === 'fulfilled') {
          const sectors = Array.isArray(sectorsResult.value.data?.sectors)
            ? sectorsResult.value.data.sectors
            : [];

          const groups: SectorGroup[] = sectors
            .map((sector: any) => {
              const documents: SectorDocument[] = [];

              (sector.periods || []).forEach((period: any) => {
                (period.documents || []).forEach((doc: any) => {
                  if (
                    matchesUser(
                      doc.cpf,
                      doc.employeeName,
                      doc.fileName ?? doc.path ?? `${sector.name}_${period.period}`
                    )
                  ) {
                    documents.push({
                      fileName: doc.fileName,
                      filePath: doc.filePath ?? doc.path ?? '',
                      employeeName: doc.employeeName,
                      cpf: doc.cpf,
                      sector: sector.name,
                      month: doc.month ?? parseInt((period.period || '').split('_')[0] || '0', 10),
                      year: doc.year ?? parseInt((period.period || '').split('_')[1] || '0', 10),
                      period: period.period,
                    });
                  }
                });
              });

              return {
                name: sector.name,
                documentCount: documents.length,
                documents,
              };
            })
            .filter((group: SectorGroup) => group.documentCount > 0);

          setSectorGroups(groups);
        } else {
          setSectorGroups([]);
          console.error('Erro ao carregar documentos por setor:', sectorsResult.reason);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do colaborador:', error);
        toast({
          title: 'Erro ao carregar documentos',
          description: 'Não foi possível carregar seus documentos. Tente novamente mais tarde.',
          variant: 'destructive',
        });
        setHolerites([]);
        setReceipts([]);
        setUnifiedDocuments([]);
        setSectorGroups([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, [toast, userCpf, userName]);

  const holeritesGrouped = useMemo(() => {
    const grouped: Record<number, Record<number, Holerite[]>> = {};

    holerites.forEach((holerite) => {
      if (!holerite.year || !holerite.month) return;
      if (!grouped[holerite.year]) {
        grouped[holerite.year] = {};
      }
      if (!grouped[holerite.year][holerite.month]) {
        grouped[holerite.year][holerite.month] = [];
      }
      grouped[holerite.year][holerite.month].push(holerite);
    });

    return grouped;
  }, [holerites]);

  const holeriteYears = useMemo(() => {
    return Object.keys(holeritesGrouped)
      .map((year) => Number(year))
      .sort((a, b) => b - a);
  }, [holeritesGrouped]);

  const receiptsGrouped = useMemo(() => {
    const grouped: Record<number, Record<number, PaymentReceipt[]>> = {};

    receipts.forEach((receipt) => {
      const month = receipt.month;
      const year = receipt.year;
      if (!year || !month) return;

      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][month]) {
        grouped[year][month] = [];
      }
      grouped[year][month].push(receipt);
    });

    return grouped;
  }, [receipts]);

  const receiptYears = useMemo(() => {
    return Object.keys(receiptsGrouped)
      .map((year) => Number(year))
      .sort((a, b) => b - a);
  }, [receiptsGrouped]);

  const unifiedByYear = useMemo(() => {
    const groups: Record<number, UnifiedDocument[]> = {};
    unifiedDocuments.forEach((doc) => {
      const yearMatch = doc.year ?? parseInt(doc.fileName.match(/_(\d{4})\.pdf$/)?.[1] ?? '0', 10);
      if (!yearMatch) return;
      if (!groups[yearMatch]) {
        groups[yearMatch] = [];
      }
      groups[yearMatch].push(doc);
    });
    return groups;
  }, [unifiedDocuments]);

  const handlingDownloadError = (error: unknown, message: string) => {
    console.error(message, error);
    toast({
      title: 'Erro ao baixar documento',
      description: 'Não foi possível iniciar o download. Tente novamente.',
      variant: 'destructive',
    });
  };

  const handleDownloadHolerite = async (fileName: string) => {
    try {
      const blob = await holeriteService.downloadHolerite(fileName);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      handlingDownloadError(error, 'Erro ao baixar holerite');
    }
  };

  const handleViewHolerite = async (fileName: string) => {
    try {
      const blob = await holeriteService.downloadHolerite(fileName);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      handlingDownloadError(error, 'Erro ao visualizar holerite');
    }
  };

  const handleViewReceipt = async (receipt: PaymentReceipt) => {
    try {
      const blob = await paymentReceiptService.getPaymentReceiptPdf(receipt.id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      handlingDownloadError(error, 'Erro ao visualizar comprovante');
    }
  };

  const handleDownloadReceipt = async (receipt: PaymentReceipt) => {
    try {
      await paymentReceiptService.downloadPaymentReceipt(receipt.id, receipt.fileName);
    } catch (error) {
      handlingDownloadError(error, 'Erro ao baixar comprovante');
    }
  };

  const handleViewUnified = async (doc: UnifiedDocument) => {
    try {
      await unifiedDocumentService.viewUnifiedDocument(doc.fileName);
    } catch (error) {
      handlingDownloadError(error, 'Erro ao visualizar documento unificado');
    }
  };

  const handleDownloadUnified = async (doc: UnifiedDocument) => {
    try {
      await unifiedDocumentService.downloadUnifiedDocument(doc.fileName);
    } catch (error) {
      handlingDownloadError(error, 'Erro ao baixar documento unificado');
    }
  };

  const handleDownloadSectorDocument = async (doc: SectorDocument) => {
    try {
      const url = `/api/sector-organization/download/${encodeURIComponent(doc.sector)}/${encodeURIComponent(
        doc.period
      )}/${encodeURIComponent(doc.fileName)}`;
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      handlingDownloadError(error, 'Erro ao baixar documento por setor');
    }
  };

  return (
    <StandardLayout
      title="Meus Documentos"
      subtitle="Visualize seus holerites, comprovantes e documentos unificados"
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        className="space-y-6"
      >
        <TabsList className="flex w-full flex-wrap gap-2 bg-seguranca-black/80 border border-gray-900 rounded-2xl p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
          <TabsTrigger
            value="holerites"
            className="flex-1 min-w-[140px] justify-center whitespace-nowrap rounded-xl border border-transparent bg-transparent text-xs sm:text-sm font-medium text-gray-400 transition-all data-[state='active']:border-seguranca-red data-[state='active']:bg-seguranca-red data-[state='active']:text-white data-[state='active']:shadow-[0_12px_24px_rgba(236,28,36,0.45)]"
          >
            Holerites
          </TabsTrigger>
          <TabsTrigger
            value="receipts"
            className="flex-1 min-w-[140px] justify-center whitespace-nowrap rounded-xl border border-transparent bg-transparent text-xs sm:text-sm font-medium text-gray-400 transition-all data-[state='active']:border-seguranca-red data-[state='active']:bg-seguranca-red data-[state='active']:text-white data-[state='active']:shadow-[0_12px_24px_rgba(236,28,36,0.45)]"
          >
            Comprovantes
          </TabsTrigger>
          <TabsTrigger
            value="unificacao"
            className="flex-1 min-w-[140px] justify-center whitespace-nowrap rounded-xl border border-transparent bg-transparent text-xs sm:text-sm font-medium text-gray-400 transition-all data-[state='active']:border-seguranca-red data-[state='active']:bg-seguranca-red data-[state='active']:text-white data-[state='active']:shadow-[0_12px_24px_rgba(236,28,36,0.45)]"
          >
            Unificação
          </TabsTrigger>
          <TabsTrigger
            value="setores"
            className="flex-1 min-w-[140px] justify-center whitespace-nowrap rounded-xl border border-transparent bg-transparent text-xs sm:text-sm font-medium text-gray-400 transition-all data-[state='active']:border-seguranca-red data-[state='active']:bg-seguranca-red data-[state='active']:text-white data-[state='active']:shadow-[0_12px_24px_rgba(236,28,36,0.45)]"
          >
            Por Setor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="holerites" className="mt-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p>Carregando seus holerites...</p>
            </div>
          ) : holerites.length === 0 ? (
            <Card className="bg-seguranca-black/60 border border-gray-800 rounded-2xl shadow-sm">
              <CardContent className="py-12 flex flex-col items-center gap-3 text-gray-300">
                <FileText className="w-10 h-10" />
                <p>Nenhum holerite encontrado.</p>
                <span className="text-sm text-gray-500">
                  Assim que novos holerites forem disponibilizados, eles aparecerão aqui.
                </span>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {holeriteYears.map((year) => {
                const months = Object.keys(holeritesGrouped[year])
                  .map((month) => Number(month))
                  .sort((a, b) => b - a);

                return (
                  <Card
                    key={year}
                    className="bg-[#08080F]/95 border border-gray-900/60 rounded-3xl shadow-[0_22px_65px_rgba(0,0,0,0.55)] backdrop-blur-sm"
                  >
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Ano</p>
                        <h2 className="text-2xl font-semibold text-white">{year}</h2>
                      </div>
                      <Badge className="bg-white/10 text-white border border-white/10 backdrop-blur">
                        {months.length} mês{months.length > 1 ? 'es' : ''}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {months.map((month) => {
                        const items = holeritesGrouped[year][month];

                        return (
                          <div
                            key={`${year}-${month}`}
                            className="bg-[#0F0F1E]/95 border border-gray-900/70 rounded-2xl p-4 space-y-3 shadow-[0_15px_40px_rgba(0,0,0,0.45)]"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <span className="flex items-center gap-2 text-lg text-white font-semibold">
                                <Calendar className="w-4 h-4 text-indigo-300" />
                                {getMonthName(month)}
                              </span>
                              <Badge className="bg-[#16162C] text-gray-200 border border-gray-700">
                                {items.length} arquivo{items.length > 1 ? 's' : ''}
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              {items.map((item) => (
                                <div
                                  key={item.id ?? item.fileName}
                                  className="rounded-2xl border border-gray-800/80 bg-[#111124]/95 p-3 space-y-3 shadow-inner"
                                >
                                  <div className="space-y-1 text-sm text-gray-300">
                                    <p className="font-medium text-white tracking-wide uppercase text-[11px]">
                                      {item.employeeName}
                                    </p>
                                    <p className="text-[11px] text-gray-500">CPF: {item.cpf}</p>
                                    <p className="text-[11px] text-gray-500 truncate">
                                      {item.fileName}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-[#0B0B16] border border-gray-800 text-gray-100 hover:bg-black/80 hover:border-gray-700 w-full sm:w-auto text-xs sm:text-sm rounded-lg py-2.5 transition-all"
                                      onClick={() => handleViewHolerite(item.fileName)}
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      Visualizar
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-[#5F5CFF] hover:bg-[#4B48E6] text-white w-full sm:w-auto text-xs sm:text-sm rounded-lg py-2.5 shadow-[0_12px_32px_rgba(95,92,255,0.45)] transition-all"
                                      onClick={() => handleDownloadHolerite(item.fileName)}
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Baixar
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="receipts" className="mt-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p>Carregando seus comprovantes...</p>
            </div>
          ) : receipts.length === 0 ? (
            <Card className="bg-seguranca-black/60 border border-gray-800 rounded-2xl shadow-sm">
              <CardContent className="py-12 flex flex-col items-center gap-3 text-gray-300">
                <FileText className="w-10 h-10" />
                <p>Nenhum comprovante encontrado.</p>
                <span className="text-sm text-gray-500">
                  Assim que novos comprovantes forem disponibilizados, eles aparecerão aqui.
                </span>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {receiptYears.map((year) => {
                const months = Object.keys(receiptsGrouped[year])
                  .map((month) => Number(month))
                  .sort((a, b) => b - a);

                return (
                  <Card
                    key={year}
                    className="bg-[#08080F]/95 border border-gray-900/60 rounded-3xl shadow-[0_22px_65px_rgba(0,0,0,0.55)] backdrop-blur-sm"
                  >
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Ano</p>
                        <h2 className="text-2xl font-semibold text-white">{year}</h2>
                      </div>
                      <Badge className="bg-blue-500/15 text-blue-100 border border-blue-500/40 backdrop-blur">
                        {months.length} mês{months.length > 1 ? 'es' : ''}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {months.map((month) => {
                        const items = receiptsGrouped[year][month];

                        return (
                          <div
                            key={`${year}-${month}`}
                            className="bg-[#0F0F1E]/95 border border-gray-900/70 rounded-2xl p-4 space-y-3 shadow-[0_15px_40px_rgba(0,0,0,0.45)]"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <span className="flex items-center gap-2 text-lg text-white font-semibold">
                                <Calendar className="w-4 h-4 text-blue-300" />
                                {getMonthName(month)}
                              </span>
                              <Badge className="bg-[#122039] text-blue-100 border border-blue-500/30">
                                {items.length} comprovante{items.length > 1 ? 's' : ''}
                              </Badge>
                            </div>

                            <div className="space-y-3">
                              {items.map((item) => (
                                <div
                                  key={item.id ?? item.fileName}
                                  className="rounded-2xl border border-gray-800/80 bg-[#111124]/95 p-3 space-y-3 shadow-inner"
                                >
                                  <div className="space-y-1 text-sm text-gray-300">
                                    <p className="font-medium text-white tracking-wide uppercase text-[11px]">
                                      {item.employeeName || (item as any)?.creditedName}
                                    </p>
                                    {item.transferDate && (
                                      <p className="text-[11px] text-gray-500">Transferência: {item.transferDate}</p>
                                    )}
                                    <p className="text-[11px] text-gray-500 truncate">{item.fileName}</p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="bg-[#0B0B16] border border-gray-800 text-gray-100 hover:bg-black/80 hover:border-gray-700 w-full sm:w-auto text-xs sm:text-sm rounded-lg py-2.5 transition-all"
                                      onClick={() => handleDownloadReceipt(item)}
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Baixar
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unificacao" className="mt-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p>Carregando seus documentos unificados...</p>
            </div>
          ) : unifiedDocuments.length === 0 ? (
            <Card className="bg-seguranca-black/60 border border-gray-800 rounded-2xl shadow-sm">
              <CardContent className="py-12 flex flex-col items-center gap-3 text-gray-300">
                <Folder className="w-10 h-10" />
                <p>Nenhum documento unificado encontrado.</p>
                <span className="text-sm text-gray-500">
                  Quando seus documentos forem unificados, eles aparecerão aqui.
                </span>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.keys(unifiedByYear)
                .map((year) => Number(year))
                .sort((a, b) => b - a)
                .map((year) => (
                  <Card
                    key={year}
                    className="bg-[#08080F]/95 border border-gray-900/60 rounded-3xl shadow-[0_22px_65px_rgba(0,0,0,0.55)] backdrop-blur-sm"
                  >
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Ano</p>
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-purple-300" />
                          {year}
                        </h3>
                      </div>
                      <Badge className="bg-purple-500/15 text-purple-100 border border-purple-500/40 backdrop-blur">
                        {unifiedByYear[year].length} documento{unifiedByYear[year].length > 1 ? 's' : ''}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {unifiedByYear[year]
                        .sort((a, b) => (b.month ?? 0) - (a.month ?? 0))
                        .map((doc, index) => (
                          <div
                            key={`${doc.fileName}-${index}`}
                            className="bg-[#0F0F1E]/95 border border-gray-900/70 rounded-2xl p-4 space-y-3 shadow-[0_15px_40px_rgba(0,0,0,0.45)]"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-300">
                              <div>
                                <p className="text-xs uppercase text-gray-500">Documento</p>
                                <p className="text-gray-100 text-sm truncate font-medium">
                                  {doc.fileName}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase text-gray-500">Período</p>
                                <p className="text-gray-100 text-sm">
                                  {doc.month ? `${getMonthName(doc.month)} / ${year}` : year}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase text-gray-500">Funcionário</p>
                                <p className="text-gray-100 text-sm">{doc.employeeName}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase text-gray-500">CPF</p>
                                <p className="text-gray-100 text-sm">{doc.cpf}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-[#0B0B16] border border-gray-800 text-gray-100 hover:bg-black/80 hover:border-gray-700 w-full sm:w-auto text-xs sm:text-sm rounded-lg py-2.5 transition-all"
                                onClick={() => handleViewUnified(doc)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Visualizar
                              </Button>
                              <Button
                                size="sm"
                                className="bg-[#7B4CFF] hover:bg-[#6936EB] text-white w-full sm:w-auto text-xs sm:text-sm rounded-lg py-2.5 shadow-[0_12px_32px_rgba(123,76,255,0.45)] transition-all"
                                onClick={() => handleDownloadUnified(doc)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Baixar
                              </Button>
                            </div>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="setores" className="mt-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p>Carregando seus documentos organizados por setor...</p>
            </div>
          ) : sectorGroups.length === 0 ? (
            <Card className="bg-seguranca-black/60 border border-gray-800 rounded-2xl shadow-sm">
              <CardContent className="py-12 flex flex-col items-center gap-3 text-gray-300 text-center">
                <Building2 className="w-10 h-10" />
                <p>Nenhum documento encontrado para seus setores.</p>
                <span className="text-sm text-gray-500">
                  Quando houver documentos organizados por setor para você, eles aparecerão aqui.
                </span>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {sectorGroups.map((sector) => (
                <Card
                  key={sector.name}
                  className="bg-[#08080F]/95 border border-gray-900/60 rounded-3xl shadow-[0_22px_65px_rgba(0,0,0,0.55)] backdrop-blur-sm"
                >
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#111124] border border-gray-800 flex items-center justify-center shadow-inner">
                        <Building2 className="w-5 h-5 text-seguranca-yellow" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-xl font-semibold">{sector.name}</CardTitle>
                        <p className="text-sm text-gray-400">
                          {sector.documentCount} documento{sector.documentCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sector.documents
                      .sort((a, b) => {
                        if (a.year === b.year) {
                          return b.month - a.month;
                        }
                        return b.year - a.year;
                      })
                      .map((doc) => (
                        <div
                          key={`${doc.sector}-${doc.period}-${doc.fileName}`}
                          className="border border-gray-900/70 rounded-2xl p-4 bg-[#0F0F1E]/95 space-y-3 shadow-[0_15px_40px_rgba(0,0,0,0.45)]"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase text-gray-500">Período</p>
                              <p className="text-base font-semibold text-white">
                                {doc.month ? `${getMonthName(doc.month)}/${doc.year}` : doc.period || doc.year}
                              </p>
                            </div>
                            <Badge className="bg-[#16162C] text-gray-200 border border-gray-700">
                              {doc.employeeName}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{doc.fileName}</p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-[#0B0B16] border border-gray-800 text-gray-100 hover:bg-black/80 hover:border-gray-700 w-full sm:w-auto text-xs sm:text-sm rounded-lg py-2.5 transition-all"
                              onClick={() => handleDownloadSectorDocument(doc)}
                            >
                              <FileDown className="w-4 h-4 mr-1" />
                              Baixar PDF
                            </Button>
                            {doc.filePath && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-gray-100 w-full sm:w-auto text-xs sm:text-sm rounded-lg py-2.5"
                                onClick={() => window.open(buildDownloadUrl(doc.filePath), '_blank', 'noopener,noreferrer')}
                              >
                                Abrir caminho
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </StandardLayout>
  );
};

export default CollaboratorHolerites;

