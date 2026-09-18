import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Upload, FileText, Sparkles, Building2, User, ShoppingCart, DollarSign, 
  Clock, CheckCircle2, AlertCircle, AlertTriangle, Trash2, Plus, Edit3, 
  Layers, Package, Truck, ShieldCheck, ArrowRight, Check, X, FileSpreadsheet,
  FileCheck2, RefreshCw
} from 'lucide-react';
import { 
  QuotationBudgetParser, 
  ParsedBudgetData, 
  BudgetItem, 
  parsePtBrNumber 
} from '@/utils/quotationBudgetParser';
import { useToast } from '@/hooks/use-toast';

interface QuotationBudgetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedBudget: (data: ParsedBudgetData) => void;
}

export const QuotationBudgetUploadModal: React.FC<QuotationBudgetUploadModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedBudget
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedBudgetData | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'supplier' | 'client' | 'header' | 'totals' | 'commercial'>('items');
  const [manualText, setManualText] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsParsing(true);
    try {
      const result = await QuotationBudgetParser.parseFile(uploadedFile);
      setParsedData(result);
      toast({
        title: 'Orçamento Analisado com Sucesso! 🎯',
        description: `Identificados ${result.items.length} itens, Fornecedor: ${result.supplier.name} e Total: R$ ${result.totals.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      });
    } catch (error) {
      console.error('Erro ao analisar arquivo de orçamento:', error);
      toast({
        title: 'Erro na Análise do Arquivo',
        description: 'Não foi possível extrair automaticamente todos os campos. Tente colar o texto ou verificar o formato.',
        variant: 'destructive'
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handlePasteParse = () => {
    if (!manualText.trim()) {
      toast({
        title: 'Texto Vazio',
        description: 'Por favor, cole o texto do orçamento no campo correspondente.',
        variant: 'destructive'
      });
      return;
    }
    setIsParsing(true);
    try {
      const result = QuotationBudgetParser.parseText(manualText, 'Texto-Colado.txt', 'text');
      setParsedData(result);
      toast({
        title: 'Texto Analisado com Sucesso! 🎯',
        description: `Identificados ${result.items.length} itens do orçamento fornecedor.`,
      });
    } catch (error) {
      console.error('Erro ao analisar texto:', error);
      toast({
        title: 'Erro na Análise',
        description: 'Não foi possível analisar o texto fornecido.',
        variant: 'destructive'
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleApply = () => {
    if (!parsedData) return;
    onApplyParsedBudget(parsedData);
    toast({
      title: 'Dados Importados para a Cotação! 🚀',
      description: 'Todos os 6 blocos do orçamento foram transferidos com sucesso.',
    });
    onClose();
  };

  const updateItem = (index: number, updatedFields: Partial<BudgetItem>) => {
    if (!parsedData) return;
    const newItems = [...parsedData.items];
    const current = newItems[index];
    const updated = { ...current, ...updatedFields };

    if (updatedFields.quantity !== undefined || updatedFields.unitPrice !== undefined) {
      updated.totalPrice = updated.quantity * updated.unitPrice;
    }

    newItems[index] = updated;

    // Recalcular total geral
    const newTotal = newItems.reduce((acc, it) => acc + (it.isAvailable ? it.totalPrice : 0), 0) + parsedData.totals.freightValue + parsedData.totals.otherExpenses;
    const newQty = newItems.reduce((acc, it) => acc + (it.isAvailable ? it.quantity : 0), 0);

    setParsedData({
      ...parsedData,
      items: newItems,
      totals: {
        ...parsedData.totals,
        totalAmount: newTotal,
        totalItemsQuantity: newQty
      }
    });
  };

  const toggleItemAvailability = (index: number) => {
    if (!parsedData) return;
    const item = parsedData.items[index];
    const newAvail = !item.isAvailable;
    updateItem(index, {
      isAvailable: newAvail,
      unavailableReason: newAvail ? undefined : 'NÃO TEMOS NO ESTOQUE'
    });
  };

  const removeItem = (index: number) => {
    if (!parsedData) return;
    const newItems = parsedData.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((acc, it) => acc + (it.isAvailable ? it.totalPrice : 0), 0) + parsedData.totals.freightValue + parsedData.totals.otherExpenses;
    const newQty = newItems.reduce((acc, it) => acc + (it.isAvailable ? it.quantity : 0), 0);

    setParsedData({
      ...parsedData,
      items: newItems,
      totals: {
        ...parsedData.totals,
        totalAmount: newTotal,
        totalItemsQuantity: newQty
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background">
        {/* Header */}
        <DialogHeader className="p-5 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  Analisador Inteligente de Orçamentos & Cotações
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
                    6 Blocos de Extração
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Faça o upload de qualquer orçamento de fornecedor (PDF, Excel, Cotação Rocha Peças, BHM Diesel, etc.) para análise e importação automática.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Seletor de modo ou Upload Box */}
          {!parsedData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 p-1 bg-muted rounded-lg max-w-xs mx-auto">
                <Button
                  type="button"
                  variant={inputMode === 'upload' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setInputMode('upload')}
                  className="w-full text-xs font-medium"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Arquivo (PDF / Excel)
                </Button>
                <Button
                  type="button"
                  variant={inputMode === 'paste' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setInputMode('paste')}
                  className="w-full text-xs font-medium"
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Colar Texto
                </Button>
              </div>

              {inputMode === 'upload' ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-400/40 hover:border-blue-500 rounded-2xl p-10 text-center cursor-pointer transition-all bg-blue-500/5 hover:bg-blue-500/10 group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    accept=".pdf,.xlsx,.xls,.csv,.txt"
                    className="hidden"
                  />
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8" />
                  </div>
                  <h4 className="text-base font-semibold text-foreground mb-1">
                    Arraste o arquivo do orçamento aqui ou clique para selecionar
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto mb-3">
                    Suporta arquivos <strong>PDF</strong>, planilhas <strong>Excel (.xlsx, .xls)</strong> e arquivos de texto de cotação emitidos por qualquer fornecedor de autopeças.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Badge variant="secondary" className="text-[11px] gap-1">
                      <FileText className="h-3 w-3 text-red-500" /> PDF Orçamento
                    </Badge>
                    <Badge variant="secondary" className="text-[11px] gap-1">
                      <FileSpreadsheet className="h-3 w-3 text-emerald-600" /> Excel / CSV
                    </Badge>
                    <Badge variant="secondary" className="text-[11px] gap-1">
                      <ShieldCheck className="h-3 w-3 text-blue-600" /> Detecção "NÃO TEMOS"
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Texto do Orçamento / Cotação:</Label>
                    <Textarea
                      rows={10}
                      placeholder="Cole aqui o texto completo copiado do orçamento, e-mail do fornecedor ou PDF..."
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={handlePasteParse} 
                    disabled={isParsing || !manualText.trim()}
                    className="w-full gap-2"
                  >
                    <Sparkles className="h-4 w-4" /> Analisar Texto do Orçamento
                  </Button>
                </div>
              )}

              {isParsing && (
                <div className="p-6 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col items-center justify-center gap-3 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                  <div>
                    <h5 className="font-semibold text-sm text-blue-900">Processando e estruturando os 6 blocos...</h5>
                    <p className="text-xs text-blue-700">Extraindo cabeçalho, fornecedor, cliente, tabela de itens, totais e condições comerciais.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Resultados da Extração em 6 Blocos */
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3.5 bg-muted/40 rounded-xl border">
                <div>
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">Fornecedor</span>
                  <div className="font-bold text-sm truncate text-foreground flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="truncate">{parsedData.supplier.name}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">Nº Orçamento / Data</span>
                  <div className="font-bold text-sm truncate text-foreground flex items-center gap-1.5 mt-0.5">
                    <FileCheck2 className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>{parsedData.header.budgetNumber || 'S/N'} • {parsedData.header.issueDateTime}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">Itens Cotados</span>
                  <div className="font-bold text-sm text-foreground flex items-center gap-1.5 mt-0.5">
                    <ShoppingCart className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      {parsedData.items.filter(i => i.isAvailable).length} Disponíveis
                      {parsedData.items.filter(i => !i.isAvailable).length > 0 && (
                        <span className="text-xs text-rose-600 ml-1">
                          ({parsedData.items.filter(i => !i.isAvailable).length} Não temos)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold">Valor Total Geral</span>
                  <div className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <DollarSign className="h-4 w-4 shrink-0" />
                    <span>R$ {parsedData.totals.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Tabs dos 6 Blocos */}
              <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
                <TabsList className="grid grid-cols-6 h-auto p-1 bg-muted/60">
                  <TabsTrigger value="items" className="text-xs py-2 gap-1">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>4. Itens ({parsedData.items.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="supplier" className="text-xs py-2 gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>2. Fornecedor</span>
                  </TabsTrigger>
                  <TabsTrigger value="client" className="text-xs py-2 gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span>3. Cliente</span>
                  </TabsTrigger>
                  <TabsTrigger value="header" className="text-xs py-2 gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>1. Cabeçalho</span>
                  </TabsTrigger>
                  <TabsTrigger value="totals" className="text-xs py-2 gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>5. Totais & Pgto</span>
                  </TabsTrigger>
                  <TabsTrigger value="commercial" className="text-xs py-2 gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>6. Condições</span>
                  </TabsTrigger>
                </TabsList>

                {/* BLOCO 4: ITENS / PRODUTOS COTADOS */}
                <TabsContent value="items" className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Tabela de Peças & Produtos Cotados
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Confira os códigos, especificações técnicas (ex: STD, 0.25), marcas e itens sinalizados como indisponíveis ("NÃO TEMOS").
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newItem: BudgetItem = {
                          id: `item-${parsedData.items.length + 1}`,
                          code: '',
                          description: 'Nova Peça / Item',
                          brand: '',
                          quantity: 1,
                          unit: 'UN',
                          unitPrice: 0,
                          totalPrice: 0,
                          isAvailable: true
                        };
                        setParsedData({
                          ...parsedData,
                          items: [...parsedData.items, newItem]
                        });
                      }}
                      className="text-xs h-8 gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar Item
                    </Button>
                  </div>

                  <div className="border rounded-xl overflow-hidden bg-card">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-[100px] text-[11px] font-bold">CÓDIGO</TableHead>
                          <TableHead className="text-[11px] font-bold">DESCRIÇÃO & ESPECIFICAÇÃO</TableHead>
                          <TableHead className="w-[120px] text-[11px] font-bold">MARCA</TableHead>
                          <TableHead className="w-[70px] text-[11px] font-bold text-center">QTD</TableHead>
                          <TableHead className="w-[110px] text-[11px] font-bold text-right">VL. UNIT (R$)</TableHead>
                          <TableHead className="w-[110px] text-[11px] font-bold text-right">VL. TOTAL (R$)</TableHead>
                          <TableHead className="w-[110px] text-[11px] font-bold text-center">STATUS</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedData.items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-6 text-xs text-muted-foreground">
                              Nenhum item identificado automaticamente. Clique em "Adicionar Item" acima.
                            </TableCell>
                          </TableRow>
                        ) : (
                          parsedData.items.map((item, idx) => (
                            <TableRow key={item.id || idx} className={!item.isAvailable ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''}>
                              <TableCell className="p-2">
                                <Input
                                  value={item.code}
                                  onChange={(e) => updateItem(idx, { code: e.target.value })}
                                  placeholder="Cód."
                                  className="h-8 text-xs font-mono"
                                />
                              </TableCell>
                              <TableCell className="p-2 space-y-1">
                                <Input
                                  value={item.description}
                                  onChange={(e) => updateItem(idx, { description: e.target.value })}
                                  placeholder="Descrição do produto"
                                  className="h-8 text-xs font-medium"
                                />
                                {item.technicalSpecs && (
                                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                    Spec: {item.technicalSpecs}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="p-2">
                                <Input
                                  value={item.brand || ''}
                                  onChange={(e) => updateItem(idx, { brand: e.target.value })}
                                  placeholder="Marca (ex: KS, Mahle)"
                                  className="h-8 text-xs"
                                />
                              </TableCell>
                              <TableCell className="p-2">
                                <Input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                                  className="h-8 text-xs text-center font-bold"
                                />
                              </TableCell>
                              <TableCell className="p-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  disabled={!item.isAvailable}
                                  value={item.unitPrice}
                                  onChange={(e) => updateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                                  className="h-8 text-xs text-right font-mono"
                                />
                              </TableCell>
                              <TableCell className="p-2 text-right font-mono text-xs font-bold">
                                {item.isAvailable ? (
                                  `R$ ${item.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                ) : (
                                  <span className="text-rose-600 text-[11px] font-semibold">R$ 0,00</span>
                                )}
                              </TableCell>
                              <TableCell className="p-2 text-center">
                                <Button
                                  type="button"
                                  variant={item.isAvailable ? 'outline' : 'destructive'}
                                  size="sm"
                                  onClick={() => toggleItemAvailability(idx)}
                                  className={`h-7 px-2 text-[10px] font-semibold gap-1 ${
                                    item.isAvailable ? 'text-emerald-700 border-emerald-300 hover:bg-emerald-50' : ''
                                  }`}
                                >
                                  {item.isAvailable ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-600" /> Disponível
                                    </>
                                  ) : (
                                    <>
                                      <X className="h-3 w-3" /> NÃO TEMOS
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell className="p-2 text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(idx)}
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* BLOCO 2: DADOS DO FORNECEDOR / EMITENTE */}
                <TabsContent value="supplier" className="mt-3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Razão Social / Nome da Empresa:</Label>
                      <Input
                        value={parsedData.supplier.name}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          supplier: { ...parsedData.supplier, name: e.target.value }
                        })}
                        placeholder="Ex: Rocha Distribuidora e Comercial Ltda"
                        className="text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Nome Fantasia:</Label>
                      <Input
                        value={parsedData.supplier.tradeName || ''}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          supplier: { ...parsedData.supplier, tradeName: e.target.value }
                        })}
                        placeholder="Ex: Rocha Peças Diesel, BHM Diesel"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">CNPJ do Fornecedor:</Label>
                      <Input
                        value={parsedData.supplier.cnpj || ''}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          supplier: { ...parsedData.supplier, cnpj: e.target.value }
                        })}
                        placeholder="00.000.000/0000-00"
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Vendedor / Atendente Responsável:</Label>
                      <Input
                        value={parsedData.supplier.salesRepresentative || ''}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          supplier: { ...parsedData.supplier, salesRepresentative: e.target.value }
                        })}
                        placeholder="Nome do consultor ou vendedor"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Telefone / Canais de Contato:</Label>
                      <Input
                        value={parsedData.supplier.phone || ''}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          supplier: { ...parsedData.supplier, phone: e.target.value }
                        })}
                        placeholder="(00) 0000-0000 / WhatsApp"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">E-mail Institucional:</Label>
                      <Input
                        value={parsedData.supplier.email || ''}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          supplier: { ...parsedData.supplier, email: e.target.value }
                        })}
                        placeholder="vendas@fornecedor.com.br"
                        className="text-xs"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold">Endereço Completo (Logradouro, Bairro, Cidade, UF, CEP):</Label>
                      <Input
                        value={parsedData.supplier.fullAddress || ''}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          supplier: { ...parsedData.supplier, fullAddress: e.target.value }
                        })}
                        placeholder="Av. das Indústrias, 1000 - Bairro - Cidade/UF - CEP 00000-000"
                        className="text-xs"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* BLOCO 3: DADOS DO CLIENTE / DESTINATÁRIO */}
                <TabsContent value="client" className="mt-3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Razão Social / Nome do Cliente:</Label>
                      <Input
                        value={parsedData.client.name}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          client: { ...parsedData.client, name: e.target.value }
                        })}
                        placeholder="Razão social da empresa compradora"
                        className="text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">CNPJ / CPF do Cliente:</Label>
                      <Input
                        value={parsedData.client.cnpjCpf || ''}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          client: { ...parsedData.client, cnpjCpf: e.target.value }
                        })}
                        placeholder="00.000.000/0000-00"
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Inscrição Estadual (IE):</Label>
                      <Input
                        value={parsedData.client.stateRegistration || ''}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          client: { ...parsedData.client, stateRegistration: e.target.value }
                        })}
                        placeholder="IE ou ISENTO"
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Telefone de Contato / E-mail:</Label>
                      <Input
                        value={parsedData.client.phone || parsedData.client.email || ''}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          client: { ...parsedData.client, phone: e.target.value }
                        })}
                        placeholder="Telefone / financeiro@empresa.com.br"
                        className="text-xs"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold">Endereço de Faturamento / Entrega:</Label>
                      <Input
                        value={parsedData.client.fullAddress || ''}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          client: { ...parsedData.client, fullAddress: e.target.value }
                        })}
                        placeholder="Rua, número, complemento, bairro, cidade, UF, CEP"
                        className="text-xs"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* BLOCO 1: DADOS DO CABEÇALHO E DO DOCUMENTO */}
                <TabsContent value="header" className="mt-3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Título do Documento:</Label>
                      <Input
                        value={parsedData.header.documentTitle}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          header: { ...parsedData.header, documentTitle: e.target.value }
                        })}
                        placeholder="Orçamento / Proposta Comercial"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Número do Orçamento (ID Único):</Label>
                      <Input
                        value={parsedData.header.budgetNumber}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          header: { ...parsedData.header, budgetNumber: e.target.value }
                        })}
                        placeholder="Ex: 0104/017453 ou 677370"
                        className="text-xs font-mono font-bold text-blue-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Data e Hora de Emissão:</Label>
                      <Input
                        value={parsedData.header.issueDateTime}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          header: { ...parsedData.header, issueDateTime: e.target.value }
                        })}
                        placeholder="DD/MM/AAAA HH:mm"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Paginação:</Label>
                      <Input
                        value={parsedData.header.pageNumber}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          header: { ...parsedData.header, pageNumber: e.target.value }
                        })}
                        placeholder="Página 1 de 1"
                        className="text-xs"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* BLOCO 5: TOTAIS E INFORMAÇÕES FINANCEIRAS */}
                <TabsContent value="totals" className="mt-3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Valor do Frete (R$):</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={parsedData.totals.freightValue}
                        onChange={(e) => {
                          const fVal = parseFloat(e.target.value) || 0;
                          const subtotal = parsedData.items.reduce((acc, it) => acc + (it.isAvailable ? it.totalPrice : 0), 0);
                          setParsedData({
                            ...parsedData,
                            totals: {
                              ...parsedData.totals,
                              freightValue: fVal,
                              totalAmount: subtotal + fVal + parsedData.totals.otherExpenses
                            }
                          });
                        }}
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Outras Despesas / Acréscimos (R$):</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={parsedData.totals.otherExpenses}
                        onChange={(e) => {
                          const oVal = parseFloat(e.target.value) || 0;
                          const subtotal = parsedData.items.reduce((acc, it) => acc + (it.isAvailable ? it.totalPrice : 0), 0);
                          setParsedData({
                            ...parsedData,
                            totals: {
                              ...parsedData.totals,
                              otherExpenses: oVal,
                              totalAmount: subtotal + parsedData.totals.freightValue + oVal
                            }
                          });
                        }}
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-emerald-700">Valor Total Geral (R$):</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={parsedData.totals.totalAmount}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          totals: { ...parsedData.totals, totalAmount: parseFloat(e.target.value) || 0 }
                        })}
                        className="text-xs font-mono font-bold text-emerald-700 border-emerald-300"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-1.5">
                      <Label className="text-xs font-semibold">Condição / Forma de Pagamento:</Label>
                      <Input
                        value={parsedData.totals.paymentTerms}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          totals: { ...parsedData.totals, paymentTerms: e.target.value }
                        })}
                        placeholder="Ex: BOL 30,60,90,120,150 ou À VISTA, 28 DDL"
                        className="text-xs font-medium text-blue-800"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* BLOCO 6: OBSERVAÇÕES E CONDIÇÕES COMERCIAIS */}
                <TabsContent value="commercial" className="mt-3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Prazo de Validade da Proposta:</Label>
                      <Input
                        value={parsedData.commercial.validity}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          commercial: { ...parsedData.commercial, validity: e.target.value }
                        })}
                        placeholder="Ex: Válido por 24 horas ou Enquanto durarem nossos estoques"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Prazo de Entrega Estimado:</Label>
                      <Input
                        value={parsedData.commercial.deliveryTime || ''}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          commercial: { ...parsedData.commercial, deliveryTime: e.target.value }
                        })}
                        placeholder="Ex: Imediato / 24 a 48 horas"
                        className="text-xs"
                      />
                    </div>
                    {parsedData.commercial.unavailableItemsSummary.length > 0 && (
                      <div className="md:col-span-2 p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                          <AlertTriangle className="h-4 w-4 text-rose-600" />
                          Itens Faltantes / Indisponíveis no Estoque do Fornecedor ("NÃO TEMOS"):
                        </div>
                        <ul className="list-disc list-inside text-xs text-rose-700 space-y-0.5">
                          {parsedData.commercial.unavailableItemsSummary.map((un, uIdx) => (
                            <li key={uIdx}>{un}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs font-semibold">Observações Comerciais Adicionais:</Label>
                      <Textarea
                        rows={3}
                        value={parsedData.commercial.generalNotes}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          commercial: { ...parsedData.commercial, generalNotes: e.target.value }
                        })}
                        placeholder="Instruções de faturamento, dados bancários para PIX, regras de devolução, etc."
                        className="text-xs"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between">
          <div>
            {parsedData && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setParsedData(null);
                  setFile(null);
                }}
                className="text-xs gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Analisar Outro Arquivo
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Cancelar
            </Button>
            {parsedData && (
              <Button
                type="button"
                onClick={handleApply}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" /> Importar e Preencher Cotação
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
