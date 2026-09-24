import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, RefreshCw, 
  X, Check, DollarSign, Calendar, Building2, Eye, ShieldAlert
} from 'lucide-react';
import { contasAPagarService, ExpensePdfImportResultDTO } from '@/services/contasAPagarService';

interface ImportarDespesasPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportarDespesasPdfModal: React.FC<ImportarDespesasPdfModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ExpensePdfImportResultDTO | null>(null);

  const handleReset = () => {
    setSelectedFile(null);
    setImportResult(null);
    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, selecione um arquivo no formato PDF.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, envie um arquivo em formato PDF.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      const result = await contasAPagarService.importarDespesasPdf(selectedFile);
      setImportResult(result);

      if (result.errors && result.errors.length > 0 && result.created === 0 && result.updated === 0) {
        toast({
          title: 'Falha na importação',
          description: result.errors[0] || 'Não foi possível importar as despesas.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Importação concluída',
          description: `${result.created} despesa(s) criada(s) e ${result.updated} atualizada(s) com sucesso.`,
          className: 'bg-emerald-950 border-emerald-800 text-white',
        });
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro ao importar PDF de despesas:', error);
      toast({
        title: 'Erro na importação',
        description: error.response?.data?.message || error.message || 'Erro inesperado ao processar o PDF.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || val === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-100 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="border-b border-zinc-800/80 pb-4">
          <DialogTitle className="text-white text-xl font-bold flex items-center gap-2.5">
            <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span>Importar Relatório de Despesas</span>
              <span className="block text-xs font-normal text-zinc-400 mt-0.5">
                Processamento inteligente de documentos em PDF para Contas a Pagar
              </span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs mt-2 leading-relaxed">
            Faça upload do relatório oficial de despesas em formato PDF. O sistema analisa automaticamente todas as colunas, registros e valores, criando ou atualizando faturas e fornecedores no Contas a Pagar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Informações sobre a importação */}
          {!importResult && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <p className="font-semibold text-zinc-200">Reconciliação Automática</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">Identifica fornecedores e atualiza pagamentos existentes.</p>
                </div>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-sky-500/10 text-sky-400 shrink-0 mt-0.5">
                  <FileText size={14} />
                </div>
                <div>
                  <p className="font-semibold text-zinc-200">Classificação Financeira</p>
                  <p className="text-zinc-400 text-[11px] mt-0.5">Vincula categorias, datas de vencimento e parcelas.</p>
                </div>
              </div>
            </div>
          )}

          {/* Área de Upload / Drag & Drop */}
          {!importResult && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/10 scale-[0.99]'
                  : 'border-zinc-700/80 hover:border-emerald-500/60 bg-zinc-900/40 hover:bg-zinc-900/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex flex-col items-center justify-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 shadow-inner">
                  <FileText className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {selectedFile ? selectedFile.name : 'Clique para selecionar ou arraste o PDF aqui'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB • Arquivo pronto para processamento`
                      : 'Relatório financeiro de despesas em formato PDF (.pdf)'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Resultado da Importação */}
          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase">Total Lido</span>
                  <p className="text-2xl font-black text-white mt-0.5">{importResult.totalRead}</p>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase">Criadas</span>
                  <p className="text-2xl font-black text-emerald-400 mt-0.5">{importResult.created}</p>
                </div>
                <div className="bg-sky-950/40 border border-sky-800/60 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-sky-400 uppercase">Atualizadas</span>
                  <p className="text-2xl font-black text-sky-400 mt-0.5">{importResult.updated}</p>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-semibold text-rose-400 uppercase">Erros</span>
                  <p className="text-2xl font-black text-rose-400 mt-0.5">{importResult.errors?.length || 0}</p>
                </div>
              </div>

              {/* Erros / Avisos se houver */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                    <ShieldAlert size={15} />
                    Avisos / Ocorrências durante o processamento:
                  </div>
                  <ul className="text-xs text-rose-300 space-y-1 pl-5 list-disc max-h-32 overflow-y-auto">
                    {importResult.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pré-visualização de Itens Importados */}
              {importResult.items && importResult.items.length > 0 && (
                <div className="border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="bg-zinc-900/90 px-4 py-2.5 border-b border-zinc-800 text-xs font-bold text-zinc-300 flex justify-between items-center">
                    <span>Despesas Processadas ({importResult.items.length})</span>
                    <span className="text-zinc-500 font-normal">Exibindo registros atualizados</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-zinc-800/60 text-xs">
                    {importResult.items.map((item, idx) => (
                      <div key={idx} className="p-3 hover:bg-zinc-900/40 flex justify-between items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white truncate">{item.supplierName || item.supplier?.name}</span>
                            {item.supplierCode && (
                              <Badge variant="outline" className="text-[10px] text-zinc-400 border-zinc-700 py-0 px-1.5">
                                Cód: {item.supplierCode}
                              </Badge>
                            )}
                            {item.expenseNumber && (
                              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-800/60 bg-emerald-950/40 py-0 px-1.5">
                                Despesa: {item.expenseNumber} (Seq {item.installmentSeq || 1})
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            Doc: {item.invoiceNumber} • {item.description}
                            {item.bankAccountInfo && ` • CC: ${item.bankAccountInfo}`}
                          </p>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <span className="font-bold font-mono text-emerald-400 block">
                            {formatCurrency(item.amount)}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            Pago: {formatCurrency(item.paidAmount)} | Saldo: {formatCurrency(item.balanceAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botões do Rodapé */}
          <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
            {importResult ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs"
              >
                <RefreshCw size={14} className="mr-1.5" />
                Importar Outro PDF
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-zinc-400 hover:text-white text-xs"
              >
                {importResult ? 'Concluir' : 'Cancelar'}
              </Button>

              {!importResult && (
                <Button
                  size="sm"
                  disabled={!selectedFile || loading}
                  onClick={handleImport}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="mr-1.5 animate-spin" />
                      Processando Linhas e Colunas...
                    </>
                  ) : (
                    <>
                      <Upload size={14} className="mr-1.5" />
                      Iniciar Importação
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
