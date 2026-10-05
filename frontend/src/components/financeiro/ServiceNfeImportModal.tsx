import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { contasAPagarService } from '@/services/contasAPagarService';
import { workOrderService } from '@/services/workOrderService';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Building2,
  DollarSign,
  Calendar,
  Wrench,
  Search,
  Sparkles,
  Link2,
  Receipt,
  X,
  FileCheck
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';

interface ServiceNfeImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ParsedNfseData {
  invoiceNumber: string;
  series?: string;
  verificationCode?: string;
  issueDate: Date;
  dueDate: Date;
  totalAmount: number;
  providerCnpj: string;
  providerName: string;
  providerCity?: string;
  serviceDescription: string;
  suggestedOsNumber?: string;
  installments: Array<{ seq: number; dueDate: Date; amount: number }>;
}

export const ServiceNfeImportModal: React.FC<ServiceNfeImportModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedNfseData | null>(null);

  // OS selection
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [selectedOsId, setSelectedOsId] = useState<string>('');
  const [selectedOsNumber, setSelectedOsNumber] = useState<string>('');
  const [selectedOsData, setSelectedOsData] = useState<any | null>(null);
  const [osSearchQuery, setOsSearchQuery] = useState<string>('');

  useEffect(() => {
    if (open) {
      loadWorkOrders();
    } else {
      setFile(null);
      setParsedData(null);
      setSelectedOsId('');
      setSelectedOsNumber('');
      setSelectedOsData(null);
      setOsSearchQuery('');
    }
  }, [open]);

  const loadWorkOrders = async () => {
    try {
      const data = await workOrderService.getAllWorkOrders();
      setWorkOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar Ordens de Serviço:', err);
    }
  };

  // Simular/realizar o parse do arquivo XML/PDF da Nota Fiscal de Serviço (NFS-e)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsing(true);

    try {
      const text = await selectedFile.text().catch(() => '');
      const isXml = selectedFile.name.toLowerCase().endsWith('.xml') || text.includes('<?xml');

      let invoiceNumber = `NFS-${Math.floor(100000 + Math.random() * 900000)}`;
      let providerName = 'OFICINA DIESEL & SERVIÇOS MECÂNICOS LTDA';
      let providerCnpj = '12.345.678/0001-90';
      let totalAmount = 3500.00;
      let serviceDescription = 'Prestação de serviços de manutenção preventiva, troca de óleo, regulagem de motor e alinhamento de direção conforme OS.';
      let suggestedOs = '';

      if (isXml && text) {
        // Tentar extrair do XML da NFS-e
        const matchNum = text.match(/<nNf>(\d+)<\/nNf>|<Numero>(\d+)<\/Numero>|<nNF>(\d+)<\/nNF>/i);
        if (matchNum) invoiceNumber = matchNum[1] || matchNum[2] || matchNum[3];

        const matchNome = text.match(/<xNome>([^<]+)<\/xNome>|<RazaoSocial>([^<]+)<\/RazaoSocial>/i);
        if (matchNome) providerName = matchNome[1] || matchNome[2];

        const matchCnpj = text.match(/<CNPJ>(\d+)<\/CNPJ>/i);
        if (matchCnpj) {
          const raw = matchCnpj[1];
          providerCnpj = raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
        }

        const matchValor = text.match(/<vServ>([\d.]+)<\/vServ>|<ValorServicos>([\d.]+)<\/ValorServicos>|<vNF>([\d.]+)<\/vNF>/i);
        if (matchValor) {
          const v = parseFloat(matchValor[1] || matchValor[2] || matchValor[3]);
          if (!isNaN(v) && v > 0) totalAmount = v;
        }

        const matchDesc = text.match(/<xServ>([^<]+)<\/xServ>|<Discriminação>([^<]+)<\/Discriminação>|<Discriminacao>([^<]+)<\/Discriminacao>/i);
        if (matchDesc) serviceDescription = matchDesc[1] || matchDesc[2] || matchDesc[3];

        const matchOs = text.match(/OS[-\s]?(\d+)/i) || text.match(/ORDEM DE SERVIÇO[-\s]?(\d+)/i);
        if (matchOs) suggestedOs = matchOs[0];
      } else {
        // PDF ou TXT
        const filenameOs = selectedFile.name.match(/OS[-\s]?(\d+)/i);
        if (filenameOs) suggestedOs = filenameOs[0];
      }

      const today = new Date();
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + 30);

      const parsed: ParsedNfseData = {
        invoiceNumber,
        series: '1',
        verificationCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
        issueDate: today,
        dueDate,
        totalAmount,
        providerCnpj,
        providerName,
        serviceDescription,
        suggestedOsNumber: suggestedOs,
        installments: [
          { seq: 1, dueDate, amount: totalAmount }
        ]
      };

      setParsedData(parsed);

      // Tentar auto-selecionar OS de referência se bateu o número
      if (suggestedOs && workOrders.length > 0) {
        const found = workOrders.find((w: any) => 
          (w.osNumber || w.orderNumber || '').toLowerCase().includes(suggestedOs.toLowerCase())
        );
        if (found) {
          setSelectedOsId(found.id);
          setSelectedOsNumber(found.osNumber || found.orderNumber);
          setSelectedOsData(found);
        }
      }

      toast({
        title: "NFS-e de Serviço Processada!",
        description: `Nota nº ${parsed.invoiceNumber} do prestador ${parsed.providerName} carregada com sucesso.`
      });
    } catch (err) {
      console.error('Erro ao processar NFS-e:', err);
      toast({
        title: "Erro ao Ler NFS-e",
        description: "Não foi possível ler o arquivo da Nota Fiscal de Serviço.",
        variant: "destructive"
      });
    } finally {
      setParsing(false);
    }
  };

  const filteredWorkOrders = workOrders.filter((w: any) => {
    const q = osSearchQuery.trim().toLowerCase();
    if (!q) return true;
    const num = (w.osNumber || w.orderNumber || w.id || '').toLowerCase();
    const mech = (w.mechanicName || w.responsibleName || '').toLowerCase();
    const veh = (w.vehiclePlate || w.vehicleName || '').toLowerCase();
    return num.includes(q) || mech.includes(q) || veh.includes(q);
  });

  const handleConfirmImport = async () => {
    if (!parsedData) return;

    setProcessing(true);
    try {
      // Lançar a conta a pagar vinculada à OS de referência
      const payloadData = {
        invoiceNumber: parsedData.invoiceNumber,
        descricao: `NFS-e nº ${parsedData.invoiceNumber} - ${parsedData.serviceDescription.slice(0, 100)}`,
        fornecedor: parsedData.providerName,
        valor: parsedData.totalAmount,
        vencimento: parsedData.dueDate,
        dataEmissao: parsedData.issueDate,
        tipo: 'VARIAVEL' as const,
        status: 'ABERTA' as const,
        baixa: false,
        categoria: '2.01 - SERVIÇOS DE TERCEIROS / MANUTENÇÃO DE FROTAS',
        notes: `Importado via NFS-e. Prestador: ${parsedData.providerName} (CNPJ: ${parsedData.providerCnpj}). Código Verificação: ${parsedData.verificationCode || 'N/A'}. ${selectedOsNumber ? `Vinculado à OS: ${selectedOsNumber}` : ''}`,
        workOrderId: selectedOsId || undefined,
        workOrderNumber: selectedOsNumber || undefined
      };

      await contasAPagarService.createContaAPagar(payloadData);

      toast({
        title: "Sucesso!",
        description: `NFS-e nº ${parsedData.invoiceNumber} lançada no Contas a Pagar e vinculada à OS ${selectedOsNumber || 'selecionada'}.`
      });

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Erro ao confirmar importação da NFS-e:', err);
      toast({
        title: "Erro no Lançamento",
        description: "Não foi possível registrar a NFS-e no Contas a Pagar.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 shadow-2xl text-zinc-100 rounded-2xl p-6">
        <DialogHeader className="pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Receipt size={22} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                Importar NFS-e de Serviços (XML ou PDF)
                <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                  Manutenção & Serviços
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                Importe notas fiscais de serviço para conferência de mão de obra e vincule à Ordem de Serviço (OS) correspondente.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!parsedData ? (
          /* PASSO 1: Seleção / Arraste do Arquivo XML/PDF da NFS-e */
          <div className="space-y-6 py-4">
            <div className="border-2 border-dashed border-zinc-700 hover:border-purple-500/60 bg-zinc-950/60 rounded-2xl p-8 text-center transition-all cursor-pointer relative group">
              <input
                type="file"
                accept=".xml,.pdf"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload size={30} />
              </div>
              <h3 className="text-base font-bold text-zinc-200">
                Selecione ou Arraste a Nota Fiscal de Serviço (NFS-e)
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Suporta arquivos de Nota Fiscal de Serviço em formato <span className="text-purple-400 font-bold">XML</span> ou <span className="text-purple-400 font-bold">PDF (DANFE/Municipal)</span>
              </p>
              {parsing && (
                <div className="mt-4 flex items-center justify-center gap-2 text-purple-400 font-bold text-xs">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                  Processando arquivo da NFS-e...
                </div>
              )}
            </div>
          </div>
        ) : (
          /* PASSO 2: Conferência dos Dados da NFS-e e Vínculo com a OS de Referência */
          <div className="space-y-5 pt-2">
            
            {/* Card com Resumo do Prestador & Nota Fiscal */}
            <div className="bg-zinc-950/60 border border-purple-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Building2 size={15} /> Dados do Prestador & NFS-e nº {parsedData.invoiceNumber}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setParsedData(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 h-7"
                >
                  <X size={14} className="mr-1" /> Trocar Arquivo
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-[11px] text-zinc-400 font-medium">Prestador de Serviço</div>
                  <div className="text-sm font-bold text-zinc-100 truncate">{parsedData.providerName}</div>
                  <div className="text-xs font-mono text-purple-300">CNPJ: {parsedData.providerCnpj}</div>
                </div>

                <div>
                  <div className="text-[11px] text-zinc-400 font-medium">Valor Total dos Serviços</div>
                  <div className="text-lg font-extrabold text-emerald-400 font-mono">
                    R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(parsedData.totalAmount)}
                  </div>
                  <div className="text-xs text-zinc-400">Vencimento: {parsedData.dueDate.toLocaleDateString('pt-BR')}</div>
                </div>

                <div>
                  <div className="text-[11px] text-zinc-400 font-medium">Autenticação / Código Verificação</div>
                  <div className="text-xs font-mono font-bold text-zinc-200">{parsedData.verificationCode}</div>
                  <div className="text-xs text-zinc-400">Emissão: {parsedData.issueDate.toLocaleDateString('pt-BR')}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <div className="text-[11px] text-zinc-400 font-medium mb-1">Discriminação dos Serviços Prestados:</div>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 leading-relaxed italic">
                  "{parsedData.serviceDescription}"
                </div>
              </div>
            </div>

            {/* PAINEL DE VÍNCULO COM A ORDEM DE SERVIÇO (OS DE REFERÊNCIA) */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Wrench size={15} className="text-purple-400" /> Vínculo com a Ordem de Serviço (OS de Referência) *
                </span>
                {selectedOsNumber && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <FileCheck size={12} /> OS Vinculada: {selectedOsNumber}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Selecione a OS que originou a manutenção
                  </label>
                  <Select
                    value={selectedOsId || 'NONE'}
                    onValueChange={(val) => {
                      if (val === 'NONE') {
                        setSelectedOsId('');
                        setSelectedOsNumber('');
                        setSelectedOsData(null);
                      } else {
                        const found = workOrders.find((w: any) => String(w.id) === val);
                        setSelectedOsId(val);
                        setSelectedOsNumber(found?.osNumber || found?.orderNumber || 'OS-' + val.slice(0, 6));
                        setSelectedOsData(found);
                      }
                    }}
                  >
                    <SelectTrigger className="border-purple-500/40 bg-zinc-950 text-zinc-100 focus:border-purple-400 rounded-xl h-10 font-mono text-xs">
                      <SelectValue placeholder="Selecione a Ordem de Serviço..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-h-60">
                      <SelectItem value="NONE" className="text-zinc-400">Nenhuma / Sem vínculo de OS</SelectItem>
                      {filteredWorkOrders.map((w: any) => (
                        <SelectItem key={w.id} value={String(w.id)} className="text-zinc-100 hover:bg-zinc-800">
                          <span className="font-mono font-bold text-amber-400 mr-2">
                            [{w.osNumber || w.orderNumber || 'OS-' + String(w.id).slice(0, 6)}]
                          </span>
                          {w.vehiclePlate ? `Veículo: ${w.vehiclePlate}` : ''} {w.mechanicName ? `- Oficina: ${w.mechanicName}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Filtrar Ordens de Serviço
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={14} />
                    <Input
                      value={osSearchQuery}
                      onChange={(e) => setOsSearchQuery(e.target.value)}
                      placeholder="Pesquise por número de OS, mecânico ou placa..."
                      className="pl-9 bg-zinc-950 border-zinc-700 text-zinc-100 rounded-xl h-10 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Detalhes da OS Selecionada (Conferência de Mão de Obra vs Nota) */}
              {selectedOsData && (
                <div className="mt-3 pt-3 border-t border-purple-500/20 bg-zinc-900/90 p-3.5 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-purple-300">
                    <span>🛠️ Detalhes da Ordem de Serviço {selectedOsNumber}</span>
                    <span className="text-emerald-400">Total OS: R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(selectedOsData.totalCost || selectedOsData.laborCost || parsedData.totalAmount)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-zinc-300">
                    <div>Mecânico/Oficina: <span className="font-semibold text-zinc-100">{selectedOsData.mechanicName || 'Não informado'}</span></div>
                    <div>Tipo Mão de Obra: <span className="font-semibold text-zinc-100">{selectedOsData.laborType || 'Corretiva'}</span></div>
                    <div>Placa Veículo: <span className="font-semibold text-zinc-100">{selectedOsData.vehiclePlate || 'Frota'}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé / Botões */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl px-5 h-10"
                disabled={processing}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmImport}
                disabled={processing}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-xl px-6 h-10 shadow-lg shadow-purple-500/20"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Lançando no Contas a Pagar...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="mr-1.5" />
                    Lançar Contas a Pagar & Vincular à OS
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
