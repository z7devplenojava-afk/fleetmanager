import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import commercialEmailService, { CommercialQuotation, CommercialAttachment } from '@/services/commercialEmailService';
import {
  Mail,
  User,
  Building2,
  Calendar,
  MapPin,
  Users,
  Truck,
  FileText,
  FileSpreadsheet,
  Download,
  Upload,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  FileUp,
  Loader2
} from 'lucide-react';

interface QuotationDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: CommercialQuotation | null;
  onGenerateProposal?: (quotation: CommercialQuotation) => void;
  onStatusChanged?: () => void;
}

export const QuotationDetailModal: React.FC<QuotationDetailModalProps> = ({
  open,
  onOpenChange,
  quotation,
  onGenerateProposal,
  onStatusChanged
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'body'>('details');
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState(quotation?.notes || '');

  if (!quotation) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await commercialEmailService.uploadAttachment(quotation.id, file);
      toast({
        title: 'Anexo Adicionado',
        description: 'Arquivo verificado pelo antivírus e vinculado à cotação com sucesso.',
      });
      if (onStatusChanged) onStatusChanged();
    } catch (err: any) {
      toast({
        title: 'Erro no Upload',
        description: err.response?.data?.message || err.message || 'Falha ao processar arquivo',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await commercialEmailService.updateStatus(quotation.id, newStatus, notes);
      toast({
        title: 'Status Atualizado',
        description: `Cotação marcada como ${newStatus}.`,
      });
      if (onStatusChanged) onStatusChanged();
    } catch (err: any) {
      toast({
        title: 'Erro ao Atualizar',
        description: 'Falha ao atualizar status da cotação.',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const getSecurityBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED_SAFE':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] gap-1 py-0.5">
            <ShieldCheck className="h-3 w-3" /> Seguro & Verificado
          </Badge>
        );
      case 'SUSPICIOUS':
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] gap-1 py-0.5">
            <ShieldAlert className="h-3 w-3" /> Suspeito
          </Badge>
        );
      case 'BLOCKED':
        return (
          <Badge className="bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] gap-1 py-0.5">
            <ShieldX className="h-3 w-3" /> Bloqueado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-700/50 text-slate-300 text-[10px] gap-1 py-0.5">
            <Clock className="h-3 w-3" /> Em Análise
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-600/10 border border-red-600/20 rounded-xl text-red-500 shrink-0">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>{quotation.subject || 'Solicitação de Cotação de Fretamento'}</span>
                </DialogTitle>
                <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                  <span>De: <strong>{quotation.senderName || quotation.senderEmail}</strong></span>
                  <span>·</span>
                  <span>Recebido em: <strong>{formatDate(quotation.receivedAt)}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-red-500/40 text-red-400 font-mono text-xs">
                {quotation.status}
              </Badge>
              {quotation.confidenceScore > 0 && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs">
                  {quotation.confidenceScore}% Correspondência
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Cards de Resumo da Demanda Extraída do E-mail */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Dados Identificados da Cotação
            </span>
            {quotation.detectionKeywords && (
              <span className="text-[11px] text-slate-400">
                Termos: <strong className="text-slate-300">{quotation.detectionKeywords}</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-red-400" /> Cliente / Prospect
              </span>
              <p className="font-semibold text-slate-100 mt-1 truncate">
                {quotation.clientName || quotation.senderName || 'Não identificado'}
              </p>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-emerald-400" /> Rota (Origem / Destino)
              </span>
              <p className="font-semibold text-slate-100 mt-1 truncate">
                {quotation.extractedOrigin ? `${quotation.extractedOrigin} ➔ ${quotation.extractedDestination || 'Destino'}` : (quotation.extractedDestination || 'A definir')}
              </p>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-blue-400" /> Data da Viagem
              </span>
              <p className="font-semibold text-slate-100 mt-1">
                {quotation.extractedTripDate || 'Sob consulta'}
              </p>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Users className="h-3 w-3 text-purple-400" /> Passageiros / Veículo
              </span>
              <p className="font-semibold text-slate-100 mt-1 truncate">
                {quotation.extractedPassengers ? `${quotation.extractedPassengers} pax` : ''} {quotation.extractedVehicleType || 'Veículo Dedicado'}
              </p>
            </div>
          </div>
        </div>

        {/* Anexos Recebidos (.pdf, .xlsx) e Validação de Segurança */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-red-400" />
              Arquivos Anexos Verificados ({quotation.attachments?.length || 0})
            </span>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="border-slate-700 text-slate-200 hover:bg-slate-800 h-7 text-[11px] rounded-lg gap-1.5"
              >
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileUp className="h-3 w-3" />}
                Anexar Documento (.pdf / .xlsx)
              </Button>
            </div>
          </div>

          {quotation.attachments && quotation.attachments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {quotation.attachments.map((att) => (
                <div
                  key={att.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-red-400 shrink-0">
                      {att.fileName.endsWith('.xlsx') || att.fileName.endsWith('.xls') || att.fileName.endsWith('.csv') ? (
                        <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <FileText className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{att.fileName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">{formatFileSize(att.fileSize)}</span>
                        {getSecurityBadge(att.securityStatus)}
                      </div>
                    </div>
                  </div>

                  <a
                    href={commercialEmailService.getAttachmentDownloadUrl(att.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors shrink-0"
                    title="Baixar arquivo seguro"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-slate-500 bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
              Nenhum anexo foi recebido com este e-mail. Você pode fazer upload de orçamentos em PDF ou planilhas Excel acima.
            </div>
          )}
        </div>

        {/* Corpo da Mensagem do E-mail */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Conteúdo da Mensagem
            </span>
            <div className="flex rounded-lg border border-slate-800 p-0.5 bg-slate-950">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  activeTab === 'details' ? 'bg-red-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Texto
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('body')}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                  activeTab === 'body' ? 'bg-red-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Visualização E-mail
              </button>
            </div>
          </div>

          {activeTab === 'details' ? (
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed font-sans select-text">
              {quotation.bodyText || 'Mensagem sem conteúdo textual simples.'}
            </div>
          ) : (
            <div
              className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-300 max-h-48 overflow-y-auto leading-relaxed select-text"
              dangerouslySetInnerHTML={{ __html: quotation.bodyHtml || quotation.bodyText || '' }}
            />
          )}
        </div>

        {/* Anotações Comerciais */}
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-300 font-semibold">
            Observações e Anotações Internas do Comercial
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Insira detalhes de contato com o cliente, observações da cotação ou condições acordadas..."
            className="bg-slate-950 border-slate-800 text-xs text-slate-200 min-h-[60px]"
          />
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatus('IN_ANALYSIS')}
              disabled={updating}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-9 rounded-xl"
            >
              Em Análise
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatus('ARCHIVED')}
              disabled={updating}
              className="border-slate-700 text-slate-400 hover:bg-slate-800 text-xs h-9 rounded-xl"
            >
              Arquivar
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-9 rounded-xl"
            >
              Fechar
            </Button>

            {onGenerateProposal && (
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onGenerateProposal(quotation);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-9 rounded-xl shadow-lg shadow-red-600/20 gap-1.5"
              >
                <span>Gerar Proposta Oficial</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationDetailModal;
