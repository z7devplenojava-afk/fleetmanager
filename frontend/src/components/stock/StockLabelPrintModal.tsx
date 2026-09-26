import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StockItem, StockCategoryLabels } from '@/types/stock';
import { stockLabelService, LabelPrintConfig } from '@/services/stockLabelService';
import { useToast } from '@/hooks/use-toast';
import { 
  Printer, 
  Download, 
  Loader2, 
  QrCode, 
  Sparkles, 
  Copy, 
  Layers, 
  CheckCircle2,
  Shield,
  Building2,
  FileText
} from 'lucide-react';

interface StockLabelPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: StockItem[];
}

export const StockLabelPrintModal: React.FC<StockLabelPrintModalProps> = ({
  open,
  onOpenChange,
  items
}) => {
  const { toast } = useToast();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [previewQrMap, setPreviewQrMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const isSingleItem = items.length === 1;
  const primaryItem = items[0];

  useEffect(() => {
    if (open && items.length > 0) {
      // Padrão: se for 1 item, sugere 14 (folha inteira Pimaco); se forem vários, sugere 1 de cada
      const initialQty: Record<string, number> = {};
      items.forEach(it => {
        initialQty[it.id] = isSingleItem ? 14 : 1;
      });
      setQuantities(initialQty);

      // Carregar QR code de preview do primeiro item
      if (primaryItem) {
        setLoading(true);
        stockLabelService.getQrDataUrl(primaryItem)
          .then(url => {
            setPreviewQrMap(prev => ({ ...prev, [primaryItem.id]: url }));
          })
          .catch(err => console.warn('Erro ao carregar preview QR:', err))
          .finally(() => setLoading(false));
      }
    }
  }, [open, items]);

  const totalLabels = Object.values(quantities).reduce((acc, q) => acc + (q || 0), 0);
  const totalPages = Math.max(1, Math.ceil(totalLabels / 14));

  const handleSetQuickQuantity = (qty: number) => {
    if (primaryItem) {
      setQuantities({ [primaryItem.id]: qty });
    }
  };

  const handlePrint = async () => {
    if (totalLabels === 0) {
      toast({
        title: 'Atenção',
        description: 'Informe ao menos 1 etiqueta para gerar.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setGeneratingPdf(true);
      const printConfigs: LabelPrintConfig[] = items
        .filter(it => (quantities[it.id] || 0) > 0)
        .map(it => ({
          item: it,
          quantity: quantities[it.id] || 1,
          qrDataUrl: previewQrMap[it.id]
        }));

      const filename = isSingleItem
        ? `etiquetas_${primaryItem.code}_pimaco.pdf`
        : `etiquetas_estoque_${items.length}_itens_pimaco.pdf`;

      await stockLabelService.downloadLabelsPdf(printConfigs, filename);

      toast({
        title: 'PDF Gerado com Sucesso!',
        description: `${totalLabels} etiqueta(s) gerada(s) em ${totalPages} página(s) A4 (Pimaco).`,
      });

      onOpenChange(false);
    } catch (err: any) {
      console.error('Erro ao gerar PDF de etiquetas:', err);
      toast({
        title: 'Erro ao gerar PDF',
        description: err?.message || 'Falha ao processar etiquetas para impressão.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[750px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 text-white shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-seguranca-red/20 border border-seguranca-red/40 text-seguranca-red">
              <Printer className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Imprimir Etiquetas de Estoque (Pimaco A4)
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs sm:text-sm">
                Formato padrão Pimaco 14 etiquetas por folha A4 (101.6 x 38.1 mm) com QR Code e dados completos
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 my-2">
          {/* Card Preview Visual da Etiqueta */}
          {primaryItem && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-seguranca-yellow" />
                  Pré-visualização da Etiqueta Física
                </span>
                <Badge variant="outline" className="border-gray-600 text-gray-300 text-[11px]">
                  101.6 x 38.1 mm
                </Badge>
              </div>

              {/* Mockup da Etiqueta em estilo Pimaco */}
              <div className="relative rounded-xl border border-gray-600/60 bg-white p-3.5 text-slate-800 shadow-xl overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Faixa decorativa lateral esquerda vermelha */}
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-seguranca-red"></div>

                <div className="flex-1 pl-3 space-y-1 w-full min-w-0">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="text-[10px] font-extrabold tracking-wider text-slate-900">
                      VIAÇÃO SÃO SILVESTRE
                    </span>
                    <span className="text-[9px] font-medium text-slate-500 uppercase tracking-tight">
                      ALMOXARIFADO & FROTA
                    </span>
                  </div>

                  <div className="pt-0.5">
                    <div className="text-xs font-mono font-black text-slate-950 tracking-wide">
                      {primaryItem.code}
                    </div>
                    <div className="text-xs font-bold text-slate-900 leading-snug truncate">
                      {primaryItem.fullName || primaryItem.name}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-slate-600">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-medium">
                      {StockCategoryLabels[primaryItem.category] || primaryItem.category}
                    </span>
                    {primaryItem.caNumber && (
                      <span className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-bold">
                        CA: {primaryItem.caNumber}
                      </span>
                    )}
                    <span className="font-semibold text-slate-800">
                      Estoque: {primaryItem.currentQuantity ?? 0} un
                    </span>
                  </div>

                  {(primaryItem.supplier || primaryItem.invoiceNumber) && (
                    <div className="text-[9px] text-slate-500 truncate pt-0.5">
                      {primaryItem.supplier && <span>Forn: {primaryItem.supplier} </span>}
                      {primaryItem.invoiceNumber && <span>| NF: {primaryItem.invoiceNumber}</span>}
                    </div>
                  )}
                </div>

                {/* QR Code na Etiqueta */}
                <div className="flex flex-col items-center justify-center p-1.5 bg-slate-50 border border-slate-200 rounded-lg flex-shrink-0">
                  {loading ? (
                    <div className="w-20 h-20 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                    </div>
                  ) : previewQrMap[primaryItem.id] ? (
                    <img
                      src={previewQrMap[primaryItem.id]}
                      alt="QR Code"
                      className="w-20 h-20 object-contain rounded"
                    />
                  ) : (
                    <div className="w-20 h-20 flex flex-col items-center justify-center text-slate-400">
                      <QrCode className="h-10 w-10 text-slate-400" />
                      <span className="text-[8px] mt-1 font-mono">QR CODE</span>
                    </div>
                  )}
                  <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase">
                    Escaneie p/ Detalhes
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Opções de Quantidade */}
          <div className="p-4 rounded-xl bg-seguranca-black/50 border border-gray-700/60 space-y-3">
            {isSingleItem ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-gray-200">
                    Quantidade de Etiquetas a Imprimir
                  </Label>
                  <span className="text-xs text-seguranca-yellow font-medium">
                    {totalLabels} etiqueta(s) = {totalPages} folha(s) A4
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetQuickQuantity(1)}
                    className={`border-gray-600 text-xs ${quantities[primaryItem.id] === 1 ? 'bg-seguranca-yellow text-seguranca-black font-bold' : 'text-gray-300'}`}
                  >
                    1 Etiqueta Avulsa
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetQuickQuantity(14)}
                    className={`border-gray-600 text-xs ${quantities[primaryItem.id] === 14 ? 'bg-seguranca-yellow text-seguranca-black font-bold' : 'text-gray-300'}`}
                  >
                    <Layers className="h-3.5 w-3.5 mr-1" />
                    1 Folha Cheia (14 Etiquetas)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetQuickQuantity(28)}
                    className={`border-gray-600 text-xs ${quantities[primaryItem.id] === 28 ? 'bg-seguranca-yellow text-seguranca-black font-bold' : 'text-gray-300'}`}
                  >
                    2 Folhas (28 Etiquetas)
                  </Button>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-gray-400">Ou defina a quantidade exata:</span>
                  <Input
                    type="number"
                    min="1"
                    max="280"
                    value={quantities[primaryItem.id] || 1}
                    onChange={(e) => setQuantities({ [primaryItem.id]: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-24 h-9 bg-seguranca-graphite border-gray-600 text-center font-bold text-white text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-200">
                    Itens Selecionados ({items.length})
                  </span>
                  <span className="text-xs text-seguranca-yellow font-medium">
                    Total: {totalLabels} etiqueta(s) em {totalPages} folha(s)
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {items.map(it => (
                    <div key={it.id} className="flex items-center justify-between p-2 rounded-lg bg-seguranca-graphite/60 border border-gray-700 text-xs">
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="font-mono text-seguranca-yellow font-bold mr-2">{it.code}</span>
                        <span className="text-gray-200 truncate">{it.fullName || it.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">Qtd:</span>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={quantities[it.id] ?? 1}
                          onChange={(e) => setQuantities(prev => ({
                            ...prev,
                            [it.id]: Math.max(0, parseInt(e.target.value) || 0)
                          }))}
                          className="w-16 h-7 bg-seguranca-black border-gray-600 text-center font-bold text-white text-xs p-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-700/60">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generatingPdf}
            className="border-gray-600 text-gray-300 hover:bg-seguranca-graphite"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handlePrint}
            disabled={generatingPdf || totalLabels === 0}
            className="bg-gradient-to-r from-seguranca-red to-seguranca-darkred hover:from-seguranca-darkred hover:to-seguranca-red text-white shadow-lg shadow-seguranca-red/20 font-semibold"
          >
            {generatingPdf ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando PDF Pimaco...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF de Etiquetas ({totalLabels})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
