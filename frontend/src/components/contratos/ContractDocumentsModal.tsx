import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Upload, Download, Trash2, FileText, Loader2, Paperclip, Inbox,
} from 'lucide-react';
import { contractService, ContractDocument } from '@/services/contractService';

interface ContractDocumentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  contractNumber: string;
}

export const ContractDocumentsModal: React.FC<ContractDocumentsModalProps> = ({
  open,
  onOpenChange,
  contractId,
  contractNumber,
}) => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    if (!contractId) return;
    setLoading(true);
    try {
      const data = await contractService.listContractDocuments(contractId);
      setDocuments(data);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || 'Não foi possível carregar os documentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [contractId, toast]);

  useEffect(() => {
    if (open && contractId) {
      loadDocuments();
    }
  }, [open, contractId, loadDocuments]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await contractService.uploadContractDocument(contractId, file);
      toast({ title: 'Sucesso', description: 'Documento enviado com sucesso' });
      await loadDocuments();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || 'Não foi possível enviar o documento',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (doc: ContractDocument) => {
    setDownloadingId(doc.id);
    try {
      const blob = await contractService.downloadContractDocument(doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.originalName || 'documento';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || 'Não foi possível baixar o documento',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await contractService.deleteContractDocument(docId);
      toast({ title: 'Sucesso', description: 'Documento excluído' });
      await loadDocuments();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || 'Não foi possível excluir o documento',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('pt-BR');
    } catch {
      return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-seguranca-graphite border-gray-600 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-seguranca-lightgray">
            <Paperclip className="h-5 w-5 text-seguranca-yellow" />
            Documentos do Contrato
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {contractNumber} — anexe o contrato assinado, aditivos e demais arquivos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upload */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-lg bg-seguranca-black/50 border border-gray-700">
            <div>
              <p className="text-sm font-medium text-seguranca-lightgray">Enviar arquivo</p>
              <p className="text-xs text-gray-500">PDF, DOCX, XLSX, imagens (máx. 20MB)</p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-seguranca-yellow text-black hover:bg-yellow-500 flex-shrink-0"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {uploading ? 'Enviando...' : 'Upload'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Lista */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow mb-3" />
              <p className="text-sm">Carregando documentos...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <Inbox className="h-10 w-10 mb-3" />
              <p className="text-sm">Nenhum documento anexado a este contrato</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-seguranca-black/50 border border-gray-700 group"
                >
                  <FileText className="h-5 w-5 text-seguranca-yellow flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{doc.originalName}</p>
                    <p className="text-xs text-gray-500">
                      {doc.displaySize || ''} · {formatDate(doc.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                      className="p-2 rounded-lg hover:bg-seguranca-graphite text-gray-400 hover:text-seguranca-yellow transition-colors"
                      title="Baixar"
                    >
                      {downloadingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 rounded-lg hover:bg-seguranca-graphite text-gray-400 hover:text-red-500 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
