import React, { useState, useEffect, useRef } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Building2,
  Package,
  Truck,
  Loader2,
  Zap,
  Upload,
  FileSpreadsheet,
  DollarSign,
  Info,
  Calendar,
  Layers,
  Sparkles,
  CreditCard,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  procurementService,
  InvoiceEntryPayload,
  ProcurementPurchaseOrder,
  InvoiceEntryItemPayload,
  InvoiceEntryInstallmentPayload
} from '@/services/procurementService';
import { MaterialRequisition } from '@/services/materialRequisitionService';
import { stockNfeService, StockNfeParsedDTO } from '@/services/stockNfeService';

interface InvoiceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder?: ProcurementPurchaseOrder | null;
  requisition?: MaterialRequisition | null;
  onSuccess?: () => void;
}

export const InvoiceEntryModal: React.FC<InvoiceEntryModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  requisition,
  onSuccess
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Abas da Modal
  const [activeTab, setActiveTab] = useState<'principal' | 'impostos' | 'itens' | 'duplicatas'>('principal');

  // Estados dos Campos da NF-e
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceSeries, setInvoiceSeries] = useState<string>('1');
  const [invoiceKey, setInvoiceKey] = useState<string>('');
  const [naturezaOperacao, setNaturezaOperacao] = useState<string>('');
  const [protocoloAutorizacao, setProtocoloAutorizacao] = useState<string>('');

  // Emitente (Fornecedor)
  const [supplierName, setSupplierName] = useState<string>('');
  const [supplierCnpj, setSupplierCnpj] = useState<string>('');
  const [supplierIe, setSupplierIe] = useState<string>('');

  // Destinatário
  const [destName, setDestName] = useState<string>('');
  const [destCnpj, setDestCnpj] = useState<string>('');

  // Datas e Recebimento
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quantityReceived, setQuantityReceived] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [totalInvoiceCost, setTotalInvoiceCost] = useState<number>(0);

  // Totais & Impostos da DANFE
  const [baseCalculoIcms, setBaseCalculoIcms] = useState<number>(0);
  const [valorIcms, setValorIcms] = useState<number>(0);
  const [baseIcmsSt, setBaseIcmsSt] = useState<number>(0);
  const [valorIcmsSt, setValorIcmsSt] = useState<number>(0);
  const [valorTotalProdutos, setValorTotalProdutos] = useState<number>(0);
  const [valorFrete, setValorFrete] = useState<number>(0);
  const [valorSeguro, setValorSeguro] = useState<number>(0);
  const [valorDesconto, setValorDesconto] = useState<number>(0);
  const [valorIpi, setValorIpi] = useState<number>(0);

  // Itens e Duplicatas da Nota
  const [items, setItems] = useState<InvoiceEntryItemPayload[]>([]);
  const [installments, setInstallments] = useState<InvoiceEntryInstallmentPayload[]>([]);

  // Liberação para OS e Observações
  const [releaseToWorkOrder, setReleaseToWorkOrder] = useState<boolean>(true);
  const [danfeObs, setDanfeObs] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Status de Processamento & Importação
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [parsingFile, setParsingFile] = useState<boolean>(false);
  const [importedFileName, setImportedFileName] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  useEffect(() => {
    if (purchaseOrder) {
      setSupplierName(purchaseOrder.supplierName || '');
      setSupplierCnpj(purchaseOrder.supplierCnpj || '');
      setQuantityReceived(purchaseOrder.quantity || 1);
      setUnitCost(purchaseOrder.unitPrice || 0);
      setTotalInvoiceCost(purchaseOrder.totalAmount || 0);
      setValorTotalProdutos(purchaseOrder.totalAmount || 0);
    } else if (requisition) {
      setQuantityReceived(requisition.quantity || 1);
    }
  }, [purchaseOrder, requisition]);

  const handleUnitCostChange = (cost: number) => {
    setUnitCost(cost);
    setTotalInvoiceCost(cost * quantityReceived);
  };

  const handleQuantityChange = (qty: number) => {
    setQuantityReceived(qty);
    setTotalInvoiceCost(unitCost * qty);
  };

  const copyKeyToClipboard = () => {
    if (!invoiceKey) return;
    navigator.clipboard.writeText(invoiceKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    toast({
      title: 'Chave de Acesso Copiada!',
      description: 'Chave da NF-e copiada para a área de transferência.'
    });
  };

  // Parser de Arquivo XML no Navegador (Leitura Instantânea DOMParser)
  const parseXmlClientSide = (xmlText: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Chave e Ide
      const chNFe = xmlDoc.querySelector('chNFe')?.textContent || xmlDoc.querySelector('infNFe')?.getAttribute('Id')?.replace('NFe', '') || '';
      const nNF = xmlDoc.querySelector('nNF')?.textContent || '';
      const serie = xmlDoc.querySelector('serie')?.textContent || '1';
      const natOp = xmlDoc.querySelector('natOp')?.textContent || '';
      const dhEmi = xmlDoc.querySelector('dhEmi')?.textContent || xmlDoc.querySelector('dEmi')?.textContent || '';
      const nProt = xmlDoc.querySelector('nProt')?.textContent || '';

      // Emitente
      const emitNome = xmlDoc.querySelector('emit > xNome')?.textContent || '';
      const emitCNPJ = xmlDoc.querySelector('emit > CNPJ')?.textContent || '';
      const emitIE = xmlDoc.querySelector('emit > IE')?.textContent || '';

      // Destinatário
      const destNome = xmlDoc.querySelector('dest > xNome')?.textContent || '';
      const destCNPJ = xmlDoc.querySelector('dest > CNPJ')?.textContent || xmlDoc.querySelector('dest > CPF')?.textContent || '';

      // Totais
      const vBC = parseFloat(xmlDoc.querySelector('ICMSTot > vBC')?.textContent || '0');
      const vICMS = parseFloat(xmlDoc.querySelector('ICMSTot > vICMS')?.textContent || '0');
      const vBCST = parseFloat(xmlDoc.querySelector('ICMSTot > vBCST')?.textContent || '0');
      const vST = parseFloat(xmlDoc.querySelector('ICMSTot > vST')?.textContent || '0');
      const vProd = parseFloat(xmlDoc.querySelector('ICMSTot > vProd')?.textContent || '0');
      const vFrete = parseFloat(xmlDoc.querySelector('ICMSTot > vFrete')?.textContent || '0');
      const vSeg = parseFloat(xmlDoc.querySelector('ICMSTot > vSeg')?.textContent || '0');
      const vDesc = parseFloat(xmlDoc.querySelector('ICMSTot > vDesc')?.textContent || '0');
      const vIPI = parseFloat(xmlDoc.querySelector('ICMSTot > vIPI')?.textContent || '0');
      const vNF = parseFloat(xmlDoc.querySelector('ICMSTot > vNF')?.textContent || '0');

      // Observações / Dados Adicionais
      const infCpl = xmlDoc.querySelector('infAdic > infCpl')?.textContent || '';

      // Itens (det)
      const detNodes = Array.from(xmlDoc.querySelectorAll('det'));
      const parsedItems: InvoiceEntryItemPayload[] = detNodes.map((det) => {
        const cProd = det.querySelector('cProd')?.textContent || '';
        const xProd = det.querySelector('xProd')?.textContent || '';
        const ncm = det.querySelector('NCM')?.textContent || '';
        const cfop = det.querySelector('CFOP')?.textContent || '';
        const uCom = det.querySelector('uCom')?.textContent || 'UN';
        const qCom = parseFloat(det.querySelector('qCom')?.textContent || '1');
        const vUnCom = parseFloat(det.querySelector('vUnCom')?.textContent || '0');
        const vProdItem = parseFloat(det.querySelector('vProd')?.textContent || '0');
        const icmsItem = parseFloat(det.querySelector('vICMS')?.textContent || '0');
        const ipiItem = parseFloat(det.querySelector('vIPI')?.textContent || '0');

        return {
          code: cProd,
          name: xProd,
          ncm,
          cfop,
          unit: uCom,
          quantity: qCom,
          unitCost: vUnCom,
          totalCost: vProdItem,
          valorIcms: icmsItem,
          valorIpi: ipiItem
        };
      });

      // Duplicatas (dup)
      const dupNodes = Array.from(xmlDoc.querySelectorAll('dup'));
      const parsedDups: InvoiceEntryInstallmentPayload[] = dupNodes.map((dup) => ({
        number: dup.querySelector('nDup')?.textContent || '',
        dueDate: dup.querySelector('dVenc')?.textContent || '',
        amount: parseFloat(dup.querySelector('vDup')?.textContent || '0')
      }));

      // Preenchimento dos Estados
      if (chNFe) setInvoiceKey(chNFe);
      if (nNF) setInvoiceNumber(nNF);
      if (serie) setInvoiceSeries(serie);
      if (natOp) setNaturezaOperacao(natOp);
      if (nProt) setProtocoloAutorizacao(nProt);
      if (dhEmi) setIssueDate(dhEmi.split('T')[0]);

      if (emitNome) setSupplierName(emitNome);
      if (emitCNPJ) setSupplierCnpj(emitCNPJ);
      if (emitIE) setSupplierIe(emitIE);

      if (destNome) setDestName(destNome);
      if (destCNPJ) setDestCnpj(destCNPJ);

      setBaseCalculoIcms(vBC);
      setValorIcms(vICMS);
      setBaseIcmsSt(vBCST);
      setValorIcmsSt(vST);
      setValorTotalProdutos(vProd);
      setValorFrete(vFrete);
      setValorSeguro(vSeg);
      setValorDesconto(vDesc);
      setValorIpi(vIPI);
      if (vNF > 0) setTotalInvoiceCost(vNF);

      if (parsedItems.length > 0) {
        setItems(parsedItems);
        // Preencher custo do primeiro item se aplicável
        if (!unitCost || unitCost === 0) {
          setQuantityReceived(parsedItems[0].quantity);
          setUnitCost(parsedItems[0].unitCost);
        }
      }

      if (parsedDups.length > 0) {
        setInstallments(parsedDups);
      }

      if (infCpl) {
        setDanfeObs(infCpl);
      }

      return true;
    } catch (e) {
      console.warn('Falha no parser XML local, recorrendo à API do backend...', e);
      return false;
    }
  };

  // Upload de Arquivo XML ou PDF (DANFE)
  const handleFileUpload = async (file: File) => {
    setParsingFile(true);
    setImportedFileName(file.name);
    try {
      const isXml = file.name.toLowerCase().endsWith('.xml') || file.type.includes('xml');

      let parsedSuccess = false;
      if (isXml) {
        const text = await file.text();
        parsedSuccess = parseXmlClientSide(text);
      }

      // Se não for XML ou se o parser local falhar, chama o serviço unificado de NFe (backend)
      if (!parsedSuccess) {
        const parsed: StockNfeParsedDTO = await stockNfeService.parseNfe(file);

        if (parsed.accessKey) setInvoiceKey(parsed.accessKey);
        if (parsed.invoiceNumber) setInvoiceNumber(parsed.invoiceNumber);
        if (parsed.series) setInvoiceSeries(parsed.series);
        if (parsed.issueDate) setIssueDate(parsed.issueDate.split('T')[0]);
        if (parsed.supplierName) setSupplierName(parsed.supplierName);
        if (parsed.supplierCnpj) setSupplierCnpj(parsed.supplierCnpj);

        if (parsed.totalInvoiceAmount > 0) {
          setTotalInvoiceCost(parsed.totalInvoiceAmount);
        }
        if (parsed.totalProductsAmount > 0) {
          setValorTotalProdutos(parsed.totalProductsAmount);
        }
        if (parsed.shippingAmount > 0) {
          setValorFrete(parsed.shippingAmount);
        }
        if (parsed.discountAmount > 0) {
          setValorDesconto(parsed.discountAmount);
        }

        if (parsed.items && parsed.items.length > 0) {
          const mappedItems: InvoiceEntryItemPayload[] = parsed.items.map((i) => ({
            code: i.productCode,
            name: i.description,
            ncm: i.ncm,
            cfop: i.cfop,
            unit: i.unitOfMeasure,
            quantity: i.quantity,
            unitCost: i.unitPrice,
            totalCost: i.totalPrice
          }));
          setItems(mappedItems);
          setQuantityReceived(mappedItems[0].quantity);
          setUnitCost(mappedItems[0].unitCost);
        }

        if (parsed.installments && parsed.installments.length > 0) {
          setInstallments(
            parsed.installments.map((inst) => ({
              number: String(inst.installmentNumber),
              dueDate: inst.dueDate,
              amount: inst.amount
            }))
          );
        }
      }

      toast({
        title: 'Documento Importado com Sucesso!',
        description: `Dados de "${file.name}" preenchidos automaticamente no formulário.`
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao Ler Documento da NF-e',
        description: error?.response?.data?.message || 'Falha ao processar o arquivo XML ou PDF da DANFE.',
        variant: 'destructive'
      });
    } finally {
      setParsingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      toast({
        title: 'Número da Nota Fiscal Obrigatório',
        description: 'Informe o número da NF-e de entrada.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload: InvoiceEntryPayload = {
        purchaseOrderId: purchaseOrder?.id,
        requisitionId: requisition?.id || purchaseOrder?.requisitionId,
        stockItemId: requisition?.stockItemId,
        invoiceNumber,
        invoiceSeries,
        invoiceKey,
        supplierName,
        supplierCnpj,
        supplierIe,
        naturezaOperacao,
        protocoloAutorizacao,
        destName,
        destCnpj,
        issueDate,
        quantityReceived,
        unitCost,
        totalInvoiceCost,
        baseCalculoIcms,
        valorIcms,
        baseIcmsSt,
        valorIcmsSt,
        valorFrete,
        valorSeguro,
        valorDesconto,
        valorIpi,
        entryType: importedFileName ? 'XML_IMPORT' : (purchaseOrder ? 'PURCHASE_ORDER' : 'MANUAL_ENTRY'),
        releaseToWorkOrder,
        notes: [notes, danfeObs ? `[DANFE Info]: ${danfeObs}` : ''].filter(Boolean).join('\n'),
        items,
        installments
      };

      const result = await procurementService.registerInvoiceEntry(payload);

      toast({
        title: 'Nota Fiscal de Entrada Registrada!',
        description: `Item liberado no almoxarifado. Lead Time / SLA registrado: ${
          result.formattedLeadTime || 'calculado com sucesso'
        }.`
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar entrada de NF',
        description: error?.response?.data?.message || 'Falha ao salvar nota fiscal de entrada.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Cálculo de SLA em tempo real
  const createdAtStr = requisition?.createdAt || purchaseOrder?.createdAt;
  let elapsedMinutes = 0;
  if (createdAtStr) {
    elapsedMinutes = Math.floor((new Date().getTime() - new Date(createdAtStr).getTime()) / (1000 * 60));
  }
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedRemMins = elapsedMinutes % 60;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[92vh] overflow-y-auto p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="border-b border-zinc-800/80 pb-4">
          <DialogTitle className="flex items-center justify-between text-xl font-bold text-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <span>Lançamento de Nota Fiscal de Entrada no Almoxarifado</span>
                <span className="block text-xs font-normal text-zinc-400 mt-0.5">
                  Importação inteligente de XML / DANFE PDF & Controle de SLA
                </span>
              </div>
            </div>
            {importedFileName && (
              <Badge className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-2.5 py-1">
                <FileCheckIcon className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                {importedFileName}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs pt-1">
            {purchaseOrder && (
              <>
                Ordem de Compra: <span className="font-semibold text-zinc-200">{purchaseOrder.ocNumber}</span> |{' '}
              </>
            )}
            Item Alocado:{' '}
            <span className="font-semibold text-emerald-400">
              {purchaseOrder?.itemName || requisition?.itemName || 'Item Avulso / Almoxarifado'}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* ÁREA DE IMPORTAÇÃO AUTOMÁTICA DE XML OU PDF (DANFE) */}
        <div className="my-2 p-4 bg-zinc-900/80 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 rounded-xl transition-all backdrop-blur-sm group">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                {parsingFile ? <Loader2 className="w-6 h-6 animate-spin text-emerald-400" /> : <Upload className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  Importação Automática via XML ou PDF (DANFE)
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Selecione o arquivo da NF-e para preencher fornecedor, chave, valores, impostos e itens instantaneamente.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                accept=".xml,.pdf,application/pdf,text/xml,application/xml"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={parsingFile}
                className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
              >
                {parsingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Lendo Documento...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Selecionar XML / PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Card Indicador de SLA / Lead Time */}
        {createdAtStr && (
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-zinc-400 font-medium">Tempo Decorrido desde a Requisição (SLA / Lead Time)</span>
                <p className="text-sm font-bold text-zinc-100">
                  {elapsedHours > 0 ? `${elapsedHours}h ${elapsedRemMins}min` : `${elapsedMinutes} minutos`}
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-[11px] px-2.5 py-1">
              <Zap className="w-3.5 h-3.5 mr-1" /> Registro Automático no Histórico
            </Badge>
          </div>
        )}

        {/* ESTRUTURA DE ABAS DA DANFE */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
            <TabsList className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl grid grid-cols-4 w-full">
              <TabsTrigger
                value="principal"
                className="text-xs font-semibold py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 rounded-lg"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 inline" />
                Dados Principais & NFe
              </TabsTrigger>
              <TabsTrigger
                value="impostos"
                className="text-xs font-semibold py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 rounded-lg"
              >
                <DollarSign className="w-3.5 h-3.5 mr-1.5 inline" />
                Impostos & Totais
              </TabsTrigger>
              <TabsTrigger
                value="itens"
                className="text-xs font-semibold py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 rounded-lg"
              >
                <Package className="w-3.5 h-3.5 mr-1.5 inline" />
                Itens da Nota ({items.length})
              </TabsTrigger>
              <TabsTrigger
                value="duplicatas"
                className="text-xs font-semibold py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 rounded-lg"
              >
                <CreditCard className="w-3.5 h-3.5 mr-1.5 inline" />
                Faturas & Obs
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: DADOS PRINCIPAIS & FORNECEDOR */}
            <TabsContent value="principal" className="space-y-4 pt-3 focus-visible:outline-none">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4" /> Controle da Nota Fiscal Eletrônica
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-zinc-300 font-medium">Número da NF-e *</Label>
                    <Input
                      required
                      placeholder="Ex: 000.000.710"
                      className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100 font-mono font-bold"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-300 font-medium">Série</Label>
                    <Input
                      placeholder="1"
                      className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100 font-mono"
                      value={invoiceSeries}
                      onChange={(e) => setInvoiceSeries(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-300 font-medium">Data de Emissão</Label>
                    <Input
                      type="date"
                      className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100 text-xs"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-zinc-300 font-medium">Chave de Acesso da NF-e (44 dígitos)</Label>
                    {invoiceKey && (
                      <button
                        type="button"
                        onClick={copyKeyToClipboard}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey ? 'Copiada!' : 'Copiar Chave'}
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="1526082003646000026855001000007101951449542"
                    className="mt-1 bg-zinc-950 border-zinc-800 text-xs text-emerald-300 font-mono tracking-wider select-all"
                    value={invoiceKey}
                    onChange={(e) => setInvoiceKey(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-zinc-300 font-medium">Natureza da Operação</Label>
                    <Input
                      placeholder="Ex: Venda de mercadoria adquirida de terceiros"
                      className="mt-1 bg-zinc-950 border-zinc-800 text-xs text-zinc-200"
                      value={naturezaOperacao}
                      onChange={(e) => setNaturezaOperacao(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-300 font-medium">Protocolo de Autorização</Label>
                    <Input
                      placeholder="Ex: 215260045254787 em 14/08/2026"
                      className="mt-1 bg-zinc-950 border-zinc-800 text-xs text-zinc-300 font-mono"
                      value={protocoloAutorizacao}
                      onChange={(e) => setProtocoloAutorizacao(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Fornecedor / Emitente */}
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" /> Dados do Fornecedor / Emitente
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-zinc-300 font-medium">Razão Social / Nome *</Label>
                    <Input
                      required
                      placeholder="Nome da Empresa / Fornecedor"
                      className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100 font-semibold"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-300 font-medium">CNPJ do Fornecedor</Label>
                    <Input
                      placeholder="00.000.000/0000-00"
                      className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-100 font-mono"
                      value={supplierCnpj}
                      onChange={(e) => setSupplierCnpj(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-zinc-400">Inscrição Estadual</Label>
                    <Input
                      placeholder="750148306"
                      className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-300 text-xs font-mono"
                      value={supplierIe}
                      onChange={(e) => setSupplierIe(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-400">Destinatário (Sua Empresa)</Label>
                    <Input
                      placeholder="Viação São Silvestre Ltda"
                      className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-300 text-xs"
                      value={destName}
                      onChange={(e) => setDestName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-400">CNPJ Destinatário</Label>
                    <Input
                      placeholder="71.055.644/0001-25"
                      className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-300 text-xs font-mono"
                      value={destCnpj}
                      onChange={(e) => setDestCnpj(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ABA 2: IMPOSTOS & TOTAIS DA NOTA FISCAL */}
            <TabsContent value="impostos" className="space-y-4 pt-3 focus-visible:outline-none">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" /> Quadro de Impostos & Cálculo da DANFE
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    <Label className="text-[11px] text-zinc-400 font-medium">Base de Cálculo ICMS</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-200 font-mono text-xs"
                      value={baseCalculoIcms || ''}
                      onChange={(e) => setBaseCalculoIcms(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    <Label className="text-[11px] text-zinc-400 font-medium">Valor do ICMS</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="mt-1 bg-zinc-900 border-zinc-800 text-emerald-400 font-mono text-xs font-bold"
                      value={valorIcms || ''}
                      onChange={(e) => setValorIcms(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    <Label className="text-[11px] text-zinc-400 font-medium">Base Cálculo ICMS ST</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-200 font-mono text-xs"
                      value={baseIcmsSt || ''}
                      onChange={(e) => setBaseIcmsSt(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    <Label className="text-[11px] text-zinc-400 font-medium">Valor ICMS ST</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="mt-1 bg-zinc-900 border-zinc-800 text-zinc-200 font-mono text-xs"
                      value={valorIcmsSt || ''}
                      onChange={(e) => setValorIcmsSt(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <Label className="text-[11px] text-zinc-400">Valor dos Produtos</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-xs"
                      value={valorTotalProdutos || ''}
                      onChange={(e) => setValorTotalProdutos(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-zinc-400">Valor do Frete</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-xs"
                      value={valorFrete || ''}
                      onChange={(e) => setValorFrete(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-zinc-400">Valor do Seguro</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-xs"
                      value={valorSeguro || ''}
                      onChange={(e) => setValorSeguro(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-zinc-400">Desconto</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-xs"
                      value={valorDesconto || ''}
                      onChange={(e) => setValorDesconto(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-zinc-400">Valor do IPI</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="mt-1 bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-xs"
                      value={valorIpi || ''}
                      onChange={(e) => setValorIpi(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-500/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                      Valor Total da Nota Fiscal (vNF)
                    </span>
                    <span className="text-xs text-zinc-400">
                      Soma dos produtos + frete + impostos - descontos
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-300 font-mono block">
                      {formatCurrency(totalInvoiceCost)}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ABA 3: ITENS DA NOTA FISCAL & DESTINO NO ALMOXARIFADO */}
            <TabsContent value="itens" className="space-y-4 pt-3 focus-visible:outline-none">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Package className="w-4 h-4" /> Peça / Item a ser Liberado no Almoxarifado
                  </span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px]">
                    {items.length > 0 ? `${items.length} itens extraídos` : 'Item Único'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div>
                    <Label className="text-xs text-zinc-300 font-medium">Qtd Recebida *</Label>
                    <Input
                      type="number"
                      min="1"
                      required
                      className="mt-1 bg-zinc-900 border-zinc-700 text-zinc-100 font-bold"
                      value={quantityReceived}
                      onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-300 font-medium">Custo Unitário (R$) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      className="mt-1 bg-zinc-900 border-zinc-700 text-emerald-400 font-semibold text-sm"
                      value={unitCost || ''}
                      onChange={(e) => handleUnitCostChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-300 font-medium">Custo Total da NF</Label>
                    <Input
                      disabled
                      className="mt-1 bg-zinc-950 border-zinc-800 text-emerald-300 font-bold text-sm"
                      value={formatCurrency(totalInvoiceCost)}
                    />
                  </div>
                </div>

                {/* TABELA DE ITENS DA DANFE (SE IMPORTADO VIA XML/PDF) */}
                {items.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400 font-medium">Itens Detectados na DANFE:</Label>
                    <div className="max-h-48 overflow-y-auto border border-zinc-800 rounded-xl">
                      <table className="w-full text-left text-xs text-zinc-300">
                        <thead className="bg-zinc-900 text-zinc-400 font-semibold uppercase text-[10px] sticky top-0">
                          <tr>
                            <th className="p-2.5">Cód</th>
                            <th className="p-2.5">Descrição</th>
                            <th className="p-2.5">NCM</th>
                            <th className="p-2.5">CFOP</th>
                            <th className="p-2.5 text-center">Un</th>
                            <th className="p-2.5 text-right">Qtd</th>
                            <th className="p-2.5 text-right">V. Unit</th>
                            <th className="p-2.5 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60 bg-zinc-950">
                          {items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-zinc-900/60 transition-colors">
                              <td className="p-2.5 font-mono text-[11px] text-zinc-400">{item.code || '-'}</td>
                              <td className="p-2.5 font-semibold text-zinc-100">{item.name}</td>
                              <td className="p-2.5 font-mono text-[11px] text-zinc-400">{item.ncm || '-'}</td>
                              <td className="p-2.5 font-mono text-[11px] text-zinc-400">{item.cfop || '-'}</td>
                              <td className="p-2.5 text-center text-zinc-400">{item.unit || 'PC'}</td>
                              <td className="p-2.5 text-right font-bold text-zinc-200">{item.quantity}</td>
                              <td className="p-2.5 text-right font-mono text-zinc-300">{formatCurrency(item.unitCost)}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                                {formatCurrency(item.totalCost)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="releaseToWo"
                    className="w-4 h-4 rounded text-emerald-600 bg-zinc-800 border-zinc-700 focus:ring-emerald-500 shrink-0"
                    checked={releaseToWorkOrder}
                    onChange={(e) => setReleaseToWorkOrder(e.target.checked)}
                  />
                  <label htmlFor="releaseToWo" className="text-xs text-zinc-200 cursor-pointer">
                    <strong>Liberar Peça Imediatamente para a OS:</strong> Atualiza a reserva para{' '}
                    <span className="text-emerald-300 font-semibold">Pronta para Instalação</span> e altera o status da OS para{' '}
                    <span className="text-emerald-300 font-semibold">Em Andamento</span>.
                  </label>
                </div>
              </div>
            </TabsContent>

            {/* ABA 4: FATURAS, DUPLICATAS & OBSERVAÇÕES */}
            <TabsContent value="duplicatas" className="space-y-4 pt-3 focus-visible:outline-none">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" /> Duplicatas & Faturas de Pagamento
                  </span>
                </div>

                {installments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {installments.map((inst, idx) => (
                      <div key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase block">Parcela #{inst.number || idx + 1}</span>
                          <span className="text-zinc-200 font-semibold">Venc: {inst.dueDate || '-'}</span>
                        </div>
                        <span className="text-emerald-400 font-bold font-mono text-sm">{formatCurrency(inst.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex items-center gap-2">
                    <Info className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span>Nenhuma duplicata parcelada detectada. O pagamento será processado à vista ou via Ordem de Compra.</span>
                  </div>
                )}

                {danfeObs && (
                  <div>
                    <Label className="text-xs text-zinc-400 font-medium">Informações Complementares da DANFE / Fisco:</Label>
                    <p className="mt-1 bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs text-zinc-300 font-mono whitespace-pre-wrap max-h-28 overflow-y-auto select-all">
                      {danfeObs}
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-zinc-400">Observações de Recebimento Físico no Almoxarifado</Label>
                  <Textarea
                    rows={2}
                    placeholder="Ex: Peças conferidas fisicamente no almoxarifado, embalagens intactas, prontas para montagem..."
                    className="mt-1 bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-xl"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2">
            <Button type="button" variant="ghost" className="text-zinc-400 hover:text-zinc-200 text-xs" onClick={onClose}>
              Cancelar
            </Button>

            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirmar Lançamento da NF-e & Liberar Peça
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

function FileCheckIcon(props: any) {
  return <CheckCircle2 {...props} />;
}
