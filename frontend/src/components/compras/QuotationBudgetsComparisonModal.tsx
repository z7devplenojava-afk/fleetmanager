import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingDown, 
  ArrowRight, 
  DollarSign, 
  Clock, 
  Truck, 
  ShieldCheck, 
  FileText, 
  Check, 
  RefreshCw, 
  Building2, 
  AlertCircle,
  FileSpreadsheet,
  PackageCheck,
  PackageX
} from 'lucide-react';
import { QuotationSupplierAttachment } from '@/components/QuotationFormModal';
import { QuotationBudgetParser, ParsedBudgetData, BudgetItem } from '@/utils/quotationBudgetParser';
import { useToast } from '@/hooks/use-toast';

export interface EvaluatedBudget {
  attachmentId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  parsedData: ParsedBudgetData;
  matchedSupplierId?: string;
  matchedSupplierName: string;
  totalAmount: number;
  deliveryDays: number;
  deliveryText: string;
  paymentTerms: string;
  freightType: string;
  freightValue: number;
  totalItems: number;
  availableItemsCount: number;
  unavailableItemsCount: number;
  unavailableItems: string[];
  score: number; // 0 to 100
  scoreBreakdown: {
    priceScore: number;
    availabilityScore: number;
    deliveryScore: number;
    termsScore: number;
  };
  isWinner?: boolean;
  savingsVsHighest?: number;
}

interface QuotationBudgetsComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: QuotationSupplierAttachment[];
  suppliers: any[];
  onApplyBudget: (data: ParsedBudgetData, supplierId?: string) => void;
}

/**
 * Converte dataUrl base64 em File para processamento pelo parser
 */
async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  if (dataUrl.startsWith('data:')) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  }
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], fileName, { type: blob.type });
}

export const QuotationBudgetsComparisonModal: React.FC<QuotationBudgetsComparisonModalProps> = ({
  isOpen,
  onClose,
  attachments,
  suppliers,
  onApplyBudget
}) => {
  const [loading, setLoading] = useState(false);
  const [evaluatedBudgets, setEvaluatedBudgets] = useState<EvaluatedBudget[]>([]);
  const [selectedBudgetIndex, setSelectedBudgetIndex] = useState<number | null>(null);
  const [parseErrors, setParseErrors] = useState<{ fileName: string; error: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && attachments.length > 0) {
      analyzeAttachments();
    }
  }, [isOpen, attachments]);

  const analyzeAttachments = async () => {
    setLoading(true);
    setParseErrors([]);
    const results: { parsed: ParsedBudgetData; att: QuotationSupplierAttachment }[] = [];
    const errors: { fileName: string; error: string }[] = [];

    for (const att of attachments) {
      try {
        let parsed: ParsedBudgetData;
        if (att.parsedData) {
          parsed = att.parsedData;
        } else if (att.url) {
          const fileObj = await dataUrlToFile(att.url, att.name);
          parsed = await QuotationBudgetParser.parseFile(fileObj);
        } else {
          throw new Error('Arquivo sem conteúdo acessível.');
        }
        results.push({ parsed, att });
      } catch (err: any) {
        console.warn(`Erro ao analisar ${att.name}:`, err);
        errors.push({
          fileName: att.name,
          error: err.message || 'Formato não reconhecido ou documento escaneado sem texto extraível.'
        });
      }
    }

    setParseErrors(errors);

    if (results.length === 0) {
      setLoading(false);
      setEvaluatedBudgets([]);
      return;
    }

    // Identificar menor valor para normalização do score de preço
    const validAmounts = results.map(r => r.parsed.totals.totalAmount).filter(a => a > 0);
    const minAmount = validAmounts.length > 0 ? Math.min(...validAmounts) : 0;
    const maxAmount = validAmounts.length > 0 ? Math.max(...validAmounts) : 0;

    const evaluated: EvaluatedBudget[] = results.map(({ parsed, att }) => {
      // 1. Tentar fazer match com os fornecedores do sistema
      let matchedSupplierId: string | undefined;
      let matchedSupplierName = parsed.supplier.name || att.name.replace(/\.[^/.]+$/, '');

      if (suppliers && suppliers.length > 0) {
        const found = suppliers.find(s => {
          if (parsed.supplier.cnpj && s.cnpj) {
            const c1 = s.cnpj.replace(/\D/g, '');
            const c2 = parsed.supplier.cnpj.replace(/\D/g, '');
            if (c1 && c2 && c1 === c2) return true;
          }
          if (s.nome && parsed.supplier.name) {
            const n1 = s.nome.toLowerCase().trim();
            const n2 = parsed.supplier.name.toLowerCase().trim();
            return n1.includes(n2) || n2.includes(n1);
          }
          return false;
        });
        if (found) {
          matchedSupplierId = String(found.id);
          matchedSupplierName = found.nome;
        }
      }

      // 2. Extrair prazo de entrega
      let deliveryDays = 1;
      const delivText = parsed.commercial.deliveryTime || 'Pronta entrega';
      if (/imediato|pronta/i.test(delivText)) deliveryDays = 0;
      else if (/(\d+)\s*(dia|dias)/i.test(delivText)) {
        const m = delivText.match(/(\d+)\s*(dia|dias)/i);
        if (m) deliveryDays = parseInt(m[1], 10);
      } else if (/2\s*a\s*3/i.test(delivText)) deliveryDays = 2;
      else if (/3\s*a\s*5/i.test(delivText)) deliveryDays = 4;

      // 3. Itens cotados e faltas
      const totalItems = parsed.items.length;
      const availableItems = parsed.items.filter(i => i.isAvailable);
      const unavailableItems = parsed.items.filter(i => !i.isAvailable).map(i => i.description || i.code);
      const availableCount = availableItems.length;
      const unavailableCount = unavailableItems.length;

      // 4. Cálculo Ponderado do Score (0 a 100)
      // A. Preço (peso 50 pts)
      let priceScore = 50;
      if (minAmount > 0 && parsed.totals.totalAmount > 0) {
        priceScore = (minAmount / parsed.totals.totalAmount) * 50;
      } else if (parsed.totals.totalAmount === 0) {
        priceScore = 20;
      }

      // B. Disponibilidade de Peças (peso 25 pts)
      let availabilityScore = 25;
      if (totalItems > 0) {
        availabilityScore = (availableCount / totalItems) * 25;
      }

      // C. Prazo de Entrega (peso 15 pts)
      let deliveryScore = 15;
      if (deliveryDays === 0) deliveryScore = 15;
      else if (deliveryDays <= 2) deliveryScore = 12;
      else if (deliveryDays <= 5) deliveryScore = 8;
      else deliveryScore = 4;

      // D. Condições Comerciais e Frete (peso 10 pts)
      let termsScore = 5;
      const isCif = (parsed.totals.freightType || '').toUpperCase().includes('CIF') || parsed.totals.freightValue === 0;
      if (isCif) termsScore += 3;
      if (/30|28|boleto|faturad/i.test(parsed.totals.paymentTerms || '')) termsScore += 2;

      const finalScore = Math.min(100, Math.round(priceScore + availabilityScore + deliveryScore + termsScore));

      return {
        attachmentId: att.id,
        fileName: att.name,
        fileType: att.type,
        fileUrl: att.url,
        parsedData: parsed,
        matchedSupplierId,
        matchedSupplierName,
        totalAmount: parsed.totals.totalAmount,
        deliveryDays,
        deliveryText: delivText,
        paymentTerms: parsed.totals.paymentTerms || 'A Combinar',
        freightType: isCif ? 'CIF (Incluso)' : 'FOB (Cliente)',
        freightValue: parsed.totals.freightValue,
        totalItems,
        availableItemsCount: availableCount,
        unavailableItemsCount: unavailableCount,
        unavailableItems,
        score: finalScore,
        scoreBreakdown: {
          priceScore: Math.round(priceScore),
          availabilityScore: Math.round(availabilityScore),
          deliveryScore,
          termsScore
        }
      };
    });

    // Ordenar do maior score para o menor (com desempate por menor preço)
    evaluated.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.totalAmount - b.totalAmount;
    });

    // Marcar a melhor proposta vencedora
    if (evaluated.length > 0) {
      evaluated[0].isWinner = true;
      if (maxAmount > evaluated[0].totalAmount && evaluated[0].totalAmount > 0) {
        evaluated[0].savingsVsHighest = maxAmount - evaluated[0].totalAmount;
      }
    }

    setEvaluatedBudgets(evaluated);
    setSelectedBudgetIndex(0);
    setLoading(false);
  };

  const handleApplySelected = (budget: EvaluatedBudget) => {
    onApplyBudget(budget.parsedData, budget.matchedSupplierId);
    toast({
      title: "Proposta Aplicada com Sucesso! 🎯",
      description: `Fornecedor ${budget.matchedSupplierName} e valores preenchidos na cotação.`
    });
    onClose();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const winner = evaluatedBudgets.find(b => b.isWinner) || evaluatedBudgets[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-zinc-950 border-gray-800 text-white p-6 shadow-2xl rounded-2xl">
        <DialogHeader className="border-b border-gray-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 rounded-xl border border-yellow-500/30">
                <Trophy className="h-6 w-6 text-yellow-400 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  Análise Comparativa de Orçamentos
                  <Badge className="bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs">
                    {attachments.length} {attachments.length === 1 ? 'Orçamento' : 'Orçamentos'}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-gray-400 text-xs mt-0.5">
                  Comparação multi-critérios inteligente (Preço, Disponibilidade, Prazo e Frete) para eleger a melhor proposta.
                </DialogDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={analyzeAttachments}
              disabled={loading}
              className="bg-zinc-900 border-gray-700 hover:bg-zinc-800 text-xs text-gray-300 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Reanalisar
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-16 text-center space-y-4">
            <div className="inline-block p-4 bg-yellow-500/10 rounded-full border border-yellow-500/30 animate-spin">
              <Sparkles className="h-8 w-8 text-yellow-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">Analisando e comparando orçamentos anexados...</p>
              <p className="text-xs text-gray-400 mt-1">Extraindo preços, itens, disponibilidade e prazos de entrega.</p>
            </div>
          </div>
        ) : evaluatedBudgets.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-amber-400 mx-auto" />
            <p className="text-sm font-semibold text-white">Nenhum orçamento pôde ser analisado automaticamente.</p>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Certifique-se de ter anexado arquivos legíveis em PDF ou Excel com texto selecionável.
            </p>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Banner da Proposta Vencedora Recomendada */}
            {winner && (
              <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-r from-yellow-950/50 via-amber-900/30 to-zinc-900 border-2 border-yellow-500/50 shadow-xl">
                <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                  <Trophy className="h-48 w-48 text-yellow-400" />
                </div>
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500 text-zinc-950 font-black text-xs px-2.5 py-0.5 flex items-center gap-1 shadow">
                        <Trophy className="h-3.5 w-3.5 fill-current" />
                        MELHOR PROPOSTA RECOMENDADA
                      </Badge>
                      <span className="text-xs text-yellow-400/90 font-semibold">
                        Pontuação: {winner.score}/100 pts
                      </span>
                    </div>

                    <h3 className="text-lg md:text-xl font-extrabold text-white flex items-center gap-2">
                      {winner.matchedSupplierName}
                      <span className="text-sm font-normal text-gray-400">({winner.fileName})</span>
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 pt-1">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        <DollarSign className="h-3.5 w-3.5" /> Total: {formatCurrency(winner.totalAmount)}
                      </span>

                      {winner.savingsVsHighest && winner.savingsVsHighest > 0 && (
                        <span className="inline-flex items-center gap-1 text-green-300 font-semibold bg-green-950/40 px-2 py-0.5 rounded border border-green-800">
                          <TrendingDown className="h-3.5 w-3.5" /> Economia de {formatCurrency(winner.savingsVsHighest)} vs maior
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-sky-300 bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800">
                        <Clock className="h-3.5 w-3.5" /> Prazo: {winner.deliveryText}
                      </span>

                      <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800">
                        <Truck className="h-3.5 w-3.5" /> Frete: {winner.freightType}
                      </span>

                      {winner.unavailableItemsCount === 0 ? (
                        <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800">
                          <PackageCheck className="h-3.5 w-3.5" /> 100% dos Itens Atendidos
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800">
                          <PackageX className="h-3.5 w-3.5" /> {winner.unavailableItemsCount} item(ns) indisponível(is)
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => handleApplySelected(winner)}
                    className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-zinc-950 font-black text-sm h-11 px-5 gap-2 shadow-lg hover:shadow-yellow-500/20 shrink-0"
                  >
                    <Check className="h-5 w-5 stroke-[3]" />
                    Aplicar Esta Proposta Vencedora
                  </Button>
                </div>
              </div>
            )}

            {/* Cards Comparativos Lado a Lado */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                Comparativo Geral das Propostas ({evaluatedBudgets.length})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {evaluatedBudgets.map((item, idx) => (
                  <Card
                    key={item.attachmentId}
                    className={`bg-zinc-900 border transition-all ${
                      item.isWinner 
                        ? 'border-yellow-500/60 shadow-lg shadow-yellow-500/5 bg-gradient-to-b from-zinc-900 to-yellow-950/20' 
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <CardHeader className="p-4 pb-2 border-b border-gray-800/60">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {item.isWinner ? (
                              <Badge className="bg-yellow-500 text-zinc-950 text-[10px] font-black px-2 py-0.2">
                                🏆 1º Lugar
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-gray-700 text-gray-400 text-[10px]">
                                #{idx + 1} Lugar
                              </Badge>
                            )}
                            <span className="text-[11px] text-gray-400 font-mono">
                              Score: {item.score} pts
                            </span>
                          </div>

                          <CardTitle className="text-sm font-bold text-white truncate max-w-[200px]" title={item.matchedSupplierName}>
                            {item.matchedSupplierName}
                          </CardTitle>
                          <p className="text-[11px] text-gray-400 truncate max-w-[200px]" title={item.fileName}>
                            {item.fileName}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className={`text-base font-black font-mono block ${item.isWinner ? 'text-emerald-400' : 'text-white'}`}>
                            {formatCurrency(item.totalAmount)}
                          </span>
                          {idx > 0 && winner && item.totalAmount > winner.totalAmount && (
                            <span className="text-[10px] text-rose-400 block font-medium">
                              +{formatCurrency(item.totalAmount - winner.totalAmount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-3 space-y-2.5 text-xs">
                      {/* Critérios chave */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-950/70 p-2.5 rounded-lg border border-gray-800/80">
                        <div>
                          <span className="text-gray-400 block">Prazo de Entrega:</span>
                          <span className="font-semibold text-gray-200">{item.deliveryText}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Frete:</span>
                          <span className="font-semibold text-gray-200">{item.freightType}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Cond. Pagamento:</span>
                          <span className="font-semibold text-gray-200 truncate block" title={item.paymentTerms}>
                            {item.paymentTerms}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Peças Atendidas:</span>
                          <span className={`font-semibold ${item.unavailableItemsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {item.availableItemsCount}/{item.totalItems || item.availableItemsCount}
                          </span>
                        </div>
                      </div>

                      {/* Alerta de Peças Faltantes */}
                      {item.unavailableItemsCount > 0 && (
                        <div className="p-2 bg-rose-950/40 border border-rose-900/60 rounded text-[11px] text-rose-300">
                          <span className="font-bold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> {item.unavailableItemsCount} item(ns) em falta:
                          </span>
                          <span className="truncate block mt-0.5 text-rose-200/80">
                            {item.unavailableItems.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Botão de Aplicação Individual */}
                      <Button
                        type="button"
                        onClick={() => handleApplySelected(item)}
                        variant={item.isWinner ? 'default' : 'outline'}
                        className={`w-full h-8 text-xs font-bold gap-1.5 ${
                          item.isWinner 
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-zinc-950' 
                            : 'bg-zinc-800 hover:bg-zinc-700 text-gray-200 border-gray-700'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        {item.isWinner ? 'Usar Esta Proposta (Vencedora)' : 'Usar Este Orçamento'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Tabela de Itens e Preços Comparados */}
            {evaluatedBudgets.some(b => b.parsedData.items.length > 0) && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-blue-400" />
                  Comparativo Detalhado de Peças & Preços Unitários
                </h4>

                <div className="overflow-x-auto rounded-xl border border-gray-800">
                  <Table className="w-full text-xs">
                    <TableHeader className="bg-zinc-900">
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-300 font-bold">Item / Descrição da Peça</TableHead>
                        <TableHead className="text-gray-300 font-bold text-center">Qtd</TableHead>
                        {evaluatedBudgets.map(b => (
                          <TableHead key={b.attachmentId} className="text-center font-bold text-gray-200">
                            <div className="flex flex-col items-center">
                              <span className="truncate max-w-[140px]">{b.matchedSupplierName}</span>
                              {b.isWinner && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 text-[9px] px-1 py-0 h-4 border-yellow-500/40">
                                  Vencedor
                                </Badge>
                              )}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Agrupar itens por descrição ou código */}
                      {(() => {
                        const itemsMap = new Map<string, { description: string; code: string; quantity: number; unit: string }>();
                        evaluatedBudgets.forEach(b => {
                          b.parsedData.items.forEach(it => {
                            const key = (it.description || it.code || 'Item').toLowerCase().trim();
                            if (!itemsMap.has(key)) {
                              itemsMap.set(key, {
                                description: it.description || it.code,
                                code: it.code,
                                quantity: it.quantity || 1,
                                unit: it.unit || 'UN'
                              });
                            }
                          });
                        });

                        const uniqueItems = Array.from(itemsMap.values());
                        if (uniqueItems.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={2 + evaluatedBudgets.length} className="text-center py-4 text-gray-500">
                                Nenhum item discriminado individualmente nas propostas.
                              </TableCell>
                            </TableRow>
                          );
                        }

                        return uniqueItems.map((uItem, rowIdx) => {
                          // Obter preços de cada orçamento para este item
                          const pricesForRow = evaluatedBudgets.map(b => {
                            const found = b.parsedData.items.find(i => 
                              (i.description || '').toLowerCase().includes(uItem.description.toLowerCase()) ||
                              (uItem.description || '').toLowerCase().includes((i.description || '').toLowerCase()) ||
                              (uItem.code && i.code && uItem.code === i.code)
                            );
                            return found ? { price: found.unitPrice, isAvailable: found.isAvailable } : null;
                          });

                          const validPrices = pricesForRow.filter(p => p && p.isAvailable && p.price > 0).map(p => p!.price);
                          const lowestPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

                          return (
                            <TableRow key={rowIdx} className="border-gray-800 hover:bg-zinc-900/50">
                              <TableCell className="font-medium text-gray-200">
                                <div>
                                  <span>{uItem.description}</span>
                                  {uItem.code && (
                                    <span className="text-[10px] text-gray-400 font-mono block">Cód: {uItem.code}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-gray-300 font-mono">
                                {uItem.quantity} {uItem.unit}
                              </TableCell>
                              {pricesForRow.map((itemPrice, colIdx) => (
                                <TableCell key={colIdx} className="text-center">
                                  {!itemPrice ? (
                                    <span className="text-gray-500 italic text-[10px]">Não cotado</span>
                                  ) : !itemPrice.isAvailable ? (
                                    <Badge variant="outline" className="border-rose-800 text-rose-400 text-[10px] bg-rose-950/30">
                                      NÃO TEMOS
                                    </Badge>
                                  ) : (
                                    <span className={`font-mono font-semibold ${itemPrice.price === lowestPrice ? 'text-emerald-400 font-bold' : 'text-gray-300'}`}>
                                      {formatCurrency(itemPrice.price)}
                                      {itemPrice.price === lowestPrice && validPrices.length > 1 && (
                                        <span className="block text-[9px] text-emerald-400 font-sans">Menor Preço</span>
                                      )}
                                    </span>
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          );
                        });
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Alertas de Erros de Arquivos se houver */}
            {parseErrors.length > 0 && (
              <div className="p-3 bg-zinc-900/80 border border-gray-800 rounded-lg text-xs text-gray-400 space-y-1">
                <span className="font-semibold text-gray-300 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 text-yellow-400" />
                  Nota sobre arquivos não-textuais:
                </span>
                {parseErrors.map((pe, pIdx) => (
                  <p key={pIdx} className="text-[11px] text-gray-400">
                    • <strong>{pe.fileName}</strong>: {pe.error}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t border-gray-800 pt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {evaluatedBudgets.length > 0 && `Critérios ponderados: Menor Preço (50%), Disponibilidade (25%), Entrega (15%), Frete/Condição (10%)`}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="bg-zinc-900 border-gray-700 text-gray-300 hover:bg-zinc-800 text-xs"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
