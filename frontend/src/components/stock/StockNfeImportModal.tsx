import React, { useState, useEffect, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { stockService } from '@/services/stockService';
import {
  stockNfeService,
  StockNfeParsedDTO,
  ProcessItemPayload,
  ProcessInstallmentPayload,
  StockNfeProcessRequestDTO
} from '@/services/stockNfeService';
import { StockItem, StockCategory } from '@/types/stock';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Zap,
  CircleDot,
  Building2,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  Package,
  PlusCircle,
  Link2,
  Loader2,
  Hash
} from 'lucide-react';

interface StockNfeImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface EditableItemRow {
  selected: boolean;
  action: 'CREATE_NEW' | 'LINK_EXISTING';
  matchedStockItemId?: string;
  productCode: string;
  name: string;
  category: StockCategory;
  quantity: number;
  unitCost: number;
  totalPrice: number;
  unitOfMeasure: string;
  barcode: string;
  ncm: string;
  cfop: string;
  isBattery: boolean;
  isTire: boolean;
}

export const StockNfeImportModal: React.FC<StockNfeImportModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<StockNfeParsedDTO | null>(null);
  const [existingItems, setExistingItems] = useState<StockItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Form states
  const [itemsRows, setItemsRows] = useState<EditableItemRow[]>([]);
  const [createFinancialAccounts, setCreateFinancialAccounts] = useState(true);

  // Carregar itens existentes do estoque para o dropdown de "Vincular a existente"
  useEffect(() => {
    if (open) {
      loadStockItems();
    } else {
      // Resetar estado ao fechar
      setFile(null);
      setParsedData(null);
      setItemsRows([]);
    }
  }, [open]);

  const loadStockItems = async () => {
    try {
      setLoadingItems(true);
      const items = await stockService.getAllItems();
      setExistingItems(items || []);
    } catch (err) {
      console.error('Erro ao carregar itens do estoque:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.xml')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo XML de Nota Fiscal Eletrônica válido.',
        variant: 'destructive'
      });
      return;
    }

    setFile(selectedFile);
    await parseSelectedFile(selectedFile);
  };

  const parseSelectedFile = async (fileToParse: File) => {
    try {
      setParsing(true);
      const data = await stockNfeService.parseXml(fileToParse);
      setParsedData(data);

      // Preencher linhas de itens adaptáveis
      const rows: EditableItemRow[] = data.items.map((it) => {
        const hasMatch = !!it.matchedStockItemId;
        return {
          selected: true,
          action: hasMatch ? 'LINK_EXISTING' : 'CREATE_NEW',
          matchedStockItemId: it.matchedStockItemId || undefined,
          productCode: it.productCode || '',
          name: it.description || '',
          category: (it.suggestedCategory as StockCategory) || StockCategory.PECAS_MECANICA,
          quantity: it.quantity || 1,
          unitCost: it.unitPrice || 0,
          totalPrice: it.totalPrice || 0,
          unitOfMeasure: it.unitOfMeasure || 'UN',
          barcode: it.barcode || '',
          ncm: it.ncm || '',
          cfop: it.cfop || '',
          isBattery: it.isBattery || false,
          isTire: it.isTire || false
        };
      });

      setItemsRows(rows);

      if (data.alreadyImported) {
        toast({
          title: 'Atenção: NF-e Duplicada',
          description: data.duplicateWarning || 'Esta nota fiscal já foi registrada no sistema.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'XML carregado com sucesso!',
          description: `NF-e nº ${data.invoiceNumber} do fornecedor ${data.supplierName} lida com ${data.items.length} item(ns).`
        });
      }
    } catch (err: any) {
      console.error('Erro ao ler XML:', err);
      toast({
        title: 'Erro no processamento do XML',
        description: err.response?.data?.message || err.message || 'Verifique se o arquivo é uma NF-e SEFAZ válida.',
        variant: 'destructive'
      });
      setParsedData(null);
    } finally {
      setParsing(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    setItemsRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  const updateItemRow = (index: number, updates: Partial<EditableItemRow>) => {
    setItemsRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const selectedCount = useMemo(() => {
    return itemsRows.filter((r) => r.selected).length;
  }, [itemsRows]);

  const selectedTotal = useMemo(() => {
    return itemsRows
      .filter((r) => r.selected)
      .reduce((acc, curr) => acc + curr.totalPrice, 0);
  }, [itemsRows]);

  const handleSubmit = async () => {
    if (!parsedData) return;

    if (parsedData.alreadyImported) {
      toast({
        title: 'Operação bloqueada',
        description: 'Não é possível importar uma nota fiscal que já foi processada anteriormente.',
        variant: 'destructive'
      });
      return;
    }

    const itemsToProcess: ProcessItemPayload[] = itemsRows
      .filter((r) => r.selected)
      .map((r) => ({
        action: r.action,
        stockItemId: r.action === 'LINK_EXISTING' ? r.matchedStockItemId : undefined,
        code: r.productCode,
        name: r.name,
        category: r.category,
        quantity: r.quantity,
        unitCost: r.unitCost,
        unitName: r.unitOfMeasure,
        barcode: r.barcode,
        description: `NCM: ${r.ncm} | CFOP: ${r.cfop}`
      }));

    if (itemsToProcess.length === 0) {
      toast({
        title: 'Nenhum item selecionado',
        description: 'Selecione ao menos um item da nota fiscal para dar entrada no estoque.',
        variant: 'destructive'
      });
      return;
    }

    // Parcelas financeiras
    const installmentsPayload: ProcessInstallmentPayload[] = (parsedData.installments || []).map((inst) => ({
      installmentNumber: inst.installmentNumber,
      dueDate: inst.dueDate,
      amount: inst.amount,
      barcode: inst.barcode,
      notes: `NF ${parsedData.invoiceNumber} - Parcela ${inst.installmentNumber}`
    }));

    const payload: StockNfeProcessRequestDTO = {
      accessKey: parsedData.accessKey,
      invoiceNumber: parsedData.invoiceNumber,
      series: parsedData.series,
      issueDate: parsedData.issueDate,
      totalAmount: parsedData.totalInvoiceAmount,
      supplierCnpj: parsedData.supplierCnpj,
      supplierName: parsedData.supplierName,
      supplierTradeName: parsedData.supplierTradeName,
      supplierAddress: parsedData.supplierAddress,
      supplierCity: parsedData.supplierCity,
      supplierState: parsedData.supplierState,
      supplierZipCode: parsedData.supplierZipCode,
      supplierId: parsedData.existingSupplierId,
      createFinancialAccounts,
      items: itemsToProcess,
      installments: installmentsPayload
    };

    try {
      setProcessing(true);
      const res = await stockNfeService.processNfe(payload);

      toast({
        title: 'Importação concluída com sucesso!',
        description: `${res.itemsCreated} novo(s) item(ns), ${res.itemsUpdated} atualizado(s), ${res.batteriesCreated} bateria(s), ${res.tiresCreated} pneu(s) e ${res.financialAccountsCreated} conta(s) a pagar gerada(s).`
      });

      // Disparar sincronização global
      window.dispatchEvent(new CustomEvent('stock-data-changed'));

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (err: any) {
      console.error('Erro ao processar NF-e:', err);
      toast({
        title: 'Erro ao processar importação',
        description: err.response?.data?.message || err.message || 'Falha ao gravar no estoque e financeiro.',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[96vw] max-h-[92vh] overflow-y-auto bg-seguranca-graphite border-gray-700 text-white p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
            <FileText className="h-6 w-6 text-seguranca-yellow" />
            Importar XML de Nota Fiscal (Estoque & Financeiro)
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-xs sm:text-sm">
            Importe o XML da NF-e para alimentar automaticamente o estoque geral, abas de Baterias/Pneus e criar as parcelas no Contas a Pagar.
          </DialogDescription>
        </DialogHeader>

        {/* Passo 1: Upload do Arquivo XML */}
        {!parsedData ? (
          <div className="py-8">
            <label
              htmlFor="nfe-xml-upload"
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-600 hover:border-seguranca-yellow rounded-xl bg-seguranca-black/40 hover:bg-seguranca-black/60 transition-all cursor-pointer group text-center"
            >
              <div className="p-4 rounded-full bg-seguranca-yellow/10 group-hover:bg-seguranca-yellow/20 mb-3 transition-colors">
                {parsing ? (
                  <Loader2 className="h-10 w-10 text-seguranca-yellow animate-spin" />
                ) : (
                  <Upload className="h-10 w-10 text-seguranca-yellow group-hover:scale-110 transition-transform" />
                )}
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                {parsing ? 'Processando XML da NF-e...' : 'Clique para selecionar ou arraste o arquivo XML da NF-e'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 max-w-md">
                Formatos aceitos: <strong>.xml</strong> (NF-e padrão SEFAZ modelo 55)
              </p>
              <input
                id="nfe-xml-upload"
                type="file"
                accept=".xml,text/xml"
                className="hidden"
                disabled={parsing}
                onChange={handleFileChange}
              />
            </label>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Aviso de Duplicidade */}
            {parsedData.alreadyImported && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3 text-red-200 text-sm">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-red-300">Nota Fiscal já importada!</strong>
                  <span>{parsedData.duplicateWarning || 'Esta nota fiscal já possui lançamentos no sistema.'}</span>
                </div>
              </div>
            )}

            {/* Cabeçalho da NF-e */}
            <Card className="bg-seguranca-black/40 border-gray-700/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-700/60 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-seguranca-yellow/10 text-seguranca-yellow border-seguranca-yellow/30 font-semibold px-2.5 py-1">
                    NF-e nº {parsedData.invoiceNumber}
                  </Badge>
                  {parsedData.series && (
                    <Badge variant="secondary" className="bg-gray-800 text-gray-300 text-xs">
                      Série {parsedData.series}
                    </Badge>
                  )}
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Emissão: {new Date(parsedData.issueDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block">Total da Nota</span>
                    <span className="text-lg font-bold text-green-400">
                      R$ {parsedData.totalInvoiceAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:text-white"
                    onClick={() => {
                      setParsedData(null);
                      setFile(null);
                    }}
                  >
                    Trocar XML
                  </Button>
                </div>
              </div>

              {/* Dados do Fornecedor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-seguranca-yellow flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">{parsedData.supplierName}</span>
                    <span className="block text-gray-400 text-xs">
                      CNPJ: {parsedData.supplierCnpj} {parsedData.existingSupplierId ? '• (Fornecedor já cadastrado)' : '• (Novo fornecedor - será cadastrado)'}
                    </span>
                  </div>
                </div>

                {parsedData.supplierAddress && (
                  <div className="text-xs text-gray-400">
                    <span>{parsedData.supplierAddress}</span>
                    <span> • {parsedData.supplierCity}/{parsedData.supplierState}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Tabela Adaptativa de Itens */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
                  <Package className="h-4 w-4 text-seguranca-yellow" />
                  Itens da Nota Fiscal ({selectedCount} de {itemsRows.length} selecionados)
                </h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-300 hover:text-white"
                    onClick={() => toggleSelectAll(true)}
                  >
                    Marcar todos
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-400 hover:text-white"
                    onClick={() => toggleSelectAll(false)}
                  >
                    Desmarcar todos
                  </Button>
                </div>
              </div>

              <div className="border border-gray-700 rounded-lg overflow-x-auto bg-seguranca-black/30">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-800/80 text-gray-300 text-xs uppercase font-medium border-b border-gray-700">
                    <tr>
                      <th className="p-3 w-10 text-center">Sel.</th>
                      <th className="p-3">Item / Descrição</th>
                      <th className="p-3">Ação no Estoque</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3 text-center">Qtd</th>
                      <th className="p-3 text-right">Vlr. Unitário</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/60">
                    {itemsRows.map((row, index) => (
                      <tr key={index} className={`hover:bg-gray-800/40 transition-colors ${row.selected ? '' : 'opacity-50'}`}>
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-600 text-seguranca-red focus:ring-seguranca-red h-4 w-4"
                            checked={row.selected}
                            onChange={(e) => updateItemRow(index, { selected: e.target.checked })}
                          />
                        </td>

                        {/* Nome / Descrição */}
                        <td className="p-3 max-w-[260px]">
                          <div className="flex flex-col gap-1">
                            <Input
                              value={row.name}
                              onChange={(e) => updateItemRow(index, { name: e.target.value })}
                              className="h-8 text-xs bg-gray-900/60 border-gray-700 text-white font-medium"
                            />
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] text-gray-400 font-mono">
                                Cód: {row.productCode}
                              </span>
                              {row.isBattery && (
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] py-0 px-1.5 flex items-center gap-1">
                                  <Zap className="h-2.5 w-2.5" /> Bateria Frota
                                </Badge>
                              )}
                              {row.isTire && (
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px] py-0 px-1.5 flex items-center gap-1">
                                  <CircleDot className="h-2.5 w-2.5" /> Pneu Frota
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Ação: Criar Novo ou Vincular */}
                        <td className="p-3 min-w-[210px]">
                          <div className="space-y-1.5">
                            <Select
                              value={row.action}
                              onValueChange={(val: any) => updateItemRow(index, { action: val })}
                            >
                              <SelectTrigger className="h-7 text-xs bg-gray-900 border-gray-700">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                                <SelectItem value="CREATE_NEW">
                                  <span className="flex items-center gap-1.5 text-green-400">
                                    <PlusCircle className="h-3 w-3" /> Cadastrar como Novo
                                  </span>
                                </SelectItem>
                                <SelectItem value="LINK_EXISTING">
                                  <span className="flex items-center gap-1.5 text-blue-400">
                                    <Link2 className="h-3 w-3" /> Vincular a Existente
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            {row.action === 'LINK_EXISTING' && (
                              <Select
                                value={row.matchedStockItemId || ''}
                                onValueChange={(val) => updateItemRow(index, { matchedStockItemId: val })}
                              >
                                <SelectTrigger className="h-7 text-xs bg-gray-900 border-blue-600/50 text-blue-200">
                                  <SelectValue placeholder="Selecione o item..." />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-graphite border-gray-700 text-white max-h-56">
                                  {existingItems.map((ex) => (
                                    <SelectItem key={ex.id} value={ex.id} className="text-xs">
                                      {ex.code} - {ex.name} (Atual: {ex.currentQuantity})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </td>

                        {/* Categoria */}
                        <td className="p-3 min-w-[170px]">
                          <Select
                            value={row.category}
                            onValueChange={(val: any) => updateItemRow(index, { category: val })}
                          >
                            <SelectTrigger className="h-8 text-xs bg-gray-900 border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-700 text-white max-h-56">
                              <SelectItem value={StockCategory.PECAS_MECANICA}>Peças Mecânicas</SelectItem>
                              <SelectItem value={StockCategory.PECAS_ELETRICA}>Elétrica e Baterias</SelectItem>
                              <SelectItem value={StockCategory.PNEUS_RODAS}>Pneus, Câmaras e Rodas</SelectItem>
                              <SelectItem value={StockCategory.SISTEMA_FREIOS}>Freios e Suspensão</SelectItem>
                              <SelectItem value={StockCategory.LUBRIFICANTES_FLUIDOS}>Óleos e Fluidos</SelectItem>
                              <SelectItem value={StockCategory.AR_CONDICIONADO}>Ar Condicionado</SelectItem>
                              <SelectItem value={StockCategory.LIMPEZA_HIGIENIZACAO}>Limpeza de Frota</SelectItem>
                              <SelectItem value={StockCategory.FERRAMENTAS}>Ferramentas</SelectItem>
                              <SelectItem value={StockCategory.EPI}>EPIs e Uniformes</SelectItem>
                              <SelectItem value={StockCategory.OUTROS}>Outros</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Qtd */}
                        <td className="p-3 text-center font-bold text-white">
                          {row.quantity} <span className="text-[11px] text-gray-400 font-normal">{row.unitOfMeasure}</span>
                        </td>

                        {/* Custo Unit */}
                        <td className="p-3 text-right text-gray-300 font-mono">
                          R$ {row.unitCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Total */}
                        <td className="p-3 text-right font-semibold text-green-400 font-mono">
                          R$ {row.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Passo 3: Integração Financeira (Contas a Pagar) */}
            <Card className="bg-seguranca-black/40 border-gray-700 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <div>
                    <h4 className="font-semibold text-white text-sm sm:text-base">Módulo Financeiro (Contas a Pagar)</h4>
                    <p className="text-xs text-gray-400">
                      Geração automática das faturas/boletos no contas a pagar conforme cobrança da NF-e.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="fin-switch" className="text-xs sm:text-sm text-gray-300 cursor-pointer">
                    Lançar no Contas a Pagar
                  </Label>
                  <Switch
                    id="fin-switch"
                    checked={createFinancialAccounts}
                    onCheckedChange={setCreateFinancialAccounts}
                  />
                </div>
              </div>

              {createFinancialAccounts && (
                <div className="mt-2">
                  {parsedData.installments && parsedData.installments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {parsedData.installments.map((inst, i) => (
                        <div key={i} className="p-2.5 bg-gray-800/60 border border-gray-700 rounded-lg flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-white block">Parcela {inst.installmentNumber}</span>
                            <span className="text-gray-400 text-[11px] flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Vence: {new Date(inst.dueDate).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <span className="font-bold text-green-400 font-mono">
                            R$ {inst.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      Esta nota fiscal não possui grupo de duplicatas/parcelamento declarado no XML. O valor total de R$ {parsedData.totalInvoiceAmount.toFixed(2)} será lançado à vista no vencimento padrão.
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 w-full sm:w-auto text-left">
            {parsedData && (
              <span>
                Total selecionado: <strong className="text-green-400 font-mono">R$ {selectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> ({selectedCount} itens)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={processing}
              className="border-gray-600 text-gray-300 hover:text-white"
            >
              Cancelar
            </Button>

            {parsedData && (
              <Button
                onClick={handleSubmit}
                disabled={processing || selectedCount === 0 || parsedData.alreadyImported}
                className="bg-seguranca-red hover:bg-seguranca-red/90 text-white font-semibold flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando Estoque & Financeiro...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmar e Integrar ({selectedCount})
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
