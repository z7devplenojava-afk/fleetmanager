import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUp, FileText, CheckCircle2, AlertCircle, Loader2, DollarSign, Building2, User, Hash, Calendar } from 'lucide-react';
import { contasAReceberService, ContaAReceber } from '@/services/contasAReceberService';
import { useToast } from '@/hooks/use-toast';

interface NfseImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  conta: ContaAReceber | null;
  onSuccess: () => void;
}

export const NfseImportModal: React.FC<NfseImportModalProps> = ({
  isOpen,
  onClose,
  conta,
  onSuccess
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  const expectedAmount = Number(conta?.grossAmount || conta?.valor || 0);
  const nfseGrossAmount = Number(previewData?.grossAmount || 0);
  const valueDifference = Math.abs(nfseGrossAmount - expectedAmount);
  const hasValueMismatch = Boolean(previewData && nfseGrossAmount > 0 && valueDifference > 0.05);

  if (!conta) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Parsear pré-visualização
      try {
        setLoading(true);
        const parsed = await contasAReceberService.parseNfse(selectedFile);
        setPreviewData(parsed);
        toast({
          title: 'Sucesso',
          description: 'Leitura da NFS-e efetuada com sucesso!'
        });
      } catch (err: any) {
        console.error('Erro ao ler NFS-e:', err);
        toast({
          title: 'Erro',
          description: err.response?.data?.message || 'Falha ao ler o arquivo NFS-e.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleImport = async () => {
    if (!file || !conta) return;
    try {
      setLoading(true);
      await contasAReceberService.importNfse(conta.id, file);
      toast({
        title: 'Sucesso',
        description: `NFS-e ${previewData?.nfseNumber || ''} importada e vinculada com sucesso!`
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao vincular NFS-e:', err);
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao importar NFS-e.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-500 flex items-center gap-2">
            <FileText size={22} />
            Importar Nota Fiscal de Serviços (NFS-e)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Alerta de Contexto */}
          <div className="bg-seguranca-black p-4 rounded-lg border border-gray-700 space-y-1">
            <div className="text-xs text-gray-400">Título Selecionado:</div>
            <div className="text-sm font-semibold text-white">
              {conta.numeroFatura} — {conta.cliente} ({formatCurrency(conta.valor)})
            </div>
            {conta.measurementNumber && (
              <div className="text-xs text-purple-400">
                Boletim de Medição: #{conta.measurementNumber}
              </div>
            )}
          </div>

          {/* Área de Seleção de Arquivo */}
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center bg-seguranca-black/50 hover:border-green-500 transition-colors">
            <input
              type="file"
              id="nfse-file-input"
              accept=".xml,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <label htmlFor="nfse-file-input" className="cursor-pointer space-y-3 block">
              <FileUp className="mx-auto h-10 w-10 text-green-400" />
              <div className="text-sm font-medium text-gray-200">
                {file ? (
                  <span className="text-green-400 font-bold">{file.name}</span>
                ) : (
                  'Clique para selecionar ou arraste o arquivo PDF ou XML da NFS-e'
                )}
              </div>
              <p className="text-xs text-gray-400">Suporta XML ABRASF / Padrão Nacional e PDF com texto pesquisável</p>
            </label>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-6 gap-3 text-green-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Processando e lendo campos da Nota Fiscal...</span>
            </div>
          )}

          {/* Pré-visualização da NFS-e Extraída */}
          {previewData && !loading && (
            <div className="space-y-4 border-t border-gray-700 pt-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-base text-seguranca-yellow flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  Dados Extraídos da NFS-e
                </h4>
                <Badge className="bg-green-600 text-white font-mono">
                  NFS-e Nº {previewData.nfseNumber || 'S/N'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prestador */}
                <Card className="bg-seguranca-black border-gray-700 p-3">
                  <div className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                    <Building2 size={14} className="text-gray-400" /> Prestador do Serviço (Emitente)
                  </div>
                  <div className="text-sm font-bold text-white">{previewData.prestadorName || 'Viação São Silvestre Ltda'}</div>
                  <div className="text-xs text-gray-400">CNPJ: {previewData.prestadorCnpjCpf || '71.055.644/0001-25'}</div>
                </Card>

                {/* Tomador */}
                <Card className="bg-seguranca-black border-gray-700 p-3">
                  <div className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                    <User size={14} className="text-gray-400" /> Tomador do Serviço (Cliente)
                  </div>
                  <div className="text-sm font-bold text-white">{previewData.tomadorName || conta.cliente}</div>
                  <div className="text-xs text-gray-400">CNPJ: {previewData.tomadorCnpjCpf || '21.705.306/0001-13'}</div>
                </Card>
              </div>

              {/* Quadro de Valores e Impostos */}
              <Card className="bg-seguranca-black border-gray-700 p-4 space-y-3">
                <div className="text-xs font-semibold text-seguranca-yellow uppercase tracking-wider flex items-center gap-1">
                  <DollarSign size={14} /> Resumo Financeiro da NFS-e
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center border-b border-gray-700 pb-3">
                  <div className="bg-seguranca-graphite/40 p-2 rounded">
                    <div className="text-xs text-gray-400">Valor Bruto</div>
                    <div className="text-base font-bold text-white">{formatCurrency(previewData.grossAmount)}</div>
                  </div>
                  <div className="bg-seguranca-graphite/40 p-2 rounded">
                    <div className="text-xs text-gray-400">ISSQN Retido</div>
                    <div className="text-base font-bold text-yellow-400">{formatCurrency(previewData.issqnRetido)}</div>
                  </div>
                  <div className="bg-seguranca-graphite/40 p-2 rounded">
                    <div className="text-xs text-gray-400">INSS Retido</div>
                    <div className="text-base font-bold text-yellow-400">{formatCurrency(previewData.inssRetido)}</div>
                  </div>
                  <div className="bg-green-950/60 border border-green-700 p-2 rounded">
                    <div className="text-xs text-green-300 font-medium">Valor Líquido a Receber</div>
                    <div className="text-lg font-black text-green-400">{formatCurrency(previewData.netAmount)}</div>
                  </div>
                </div>

                {/* Chave de Acesso & Descrição */}
                {previewData.nfseKey && (
                  <div className="text-xs text-gray-400 break-all">
                    <span className="font-semibold text-gray-300">Chave de Acesso:</span> {previewData.nfseKey}
                  </div>
                )}

                {previewData.serviceDescription && (
                  <div className="text-xs text-gray-300 bg-seguranca-graphite/30 p-2 rounded max-h-24 overflow-y-auto">
                    <span className="font-semibold text-gray-200">Descrição do Serviço:</span> {previewData.serviceDescription}
                  </div>
                )}
              </Card>

              {/* Alerta de Divergência Bloqueante de Valores */}
              {hasValueMismatch && (
                <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 space-y-2 text-red-300 animate-in fade-in-50">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-400">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    Divergência de Valores Bloqueante
                  </div>
                  <p className="text-xs leading-relaxed">
                    O valor bruto da NFS-e (<span className="font-mono font-bold text-white">{formatCurrency(nfseGrossAmount)}</span>) difere do valor esperado da fatura/medição (<span className="font-mono font-bold text-white">{formatCurrency(expectedAmount)}</span>).
                  </p>
                  <div className="text-[11px] bg-red-950/70 p-2.5 rounded-lg border border-red-900/60 font-semibold text-red-200">
                    ⚠️ Regra Fiscal & Financeira: O valor da Nota Fiscal deve ser rigorosamente igual ao valor da fatura e da medição. O vínculo foi bloqueado até a correção da nota ou do título.
                  </div>
                </div>
              )}

              {!hasValueMismatch && previewData && nfseGrossAmount > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Valores Conferidos: NFS-e e Fatura/Medição com valores idênticos ({formatCurrency(nfseGrossAmount)})
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                    Validado
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading} className="border-gray-600 text-white">
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || !previewData || loading || hasValueMismatch}
            className={`font-semibold ${
              hasValueMismatch
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Confirmar e Vincular NFS-e
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
