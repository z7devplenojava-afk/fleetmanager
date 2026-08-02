import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, Upload, Download, Trash2, Loader2, Plus, Calendar, AlertTriangle, CheckCircle2, File, Inbox,
} from 'lucide-react';
import { vehicleDocumentService, VehicleDocument, VehicleDocumentType } from '@/services/vehicleDocumentService';
import fleetService from '@/services/fleetService';
import { Vehicle } from '@/types/fleet';

const DOC_TYPE_LABELS: Record<VehicleDocumentType, string> = {
  CRLV: 'CRLV',
  DUT: 'DUT',
  SEGURO: 'Seguro',
  OUTRO: 'Outro',
};

const DOC_TYPE_COLORS: Record<VehicleDocumentType, string> = {
  CRLV: 'bg-green-500/20 text-green-400 border-green-500/30',
  DUT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SEGURO: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  OUTRO: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export const VehicleDocumentsTable: React.FC = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<{
    vehicleId: string;
    docType: VehicleDocumentType;
    title: string;
    documentNumber: string;
    issueDate: string;
    expiryDate: string;
  }>({
    vehicleId: '',
    docType: 'CRLV',
    title: '',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vehicleDocumentService.list();
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
  }, [toast]);

  useEffect(() => {
    load();
    fleetService.getVehicles().then(setVehicles).catch(() => {});
  }, [load]);

  const openCreate = () => {
    setForm({ vehicleId: '', docType: 'CRLV', title: '', documentNumber: '', issueDate: '', expiryDate: '' });
    setModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!form.vehicleId) {
      toast({ title: 'Aviso', description: 'Selecione o veículo', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      await vehicleDocumentService.upload({
        vehicleId: form.vehicleId,
        docType: form.docType,
        title: form.title || undefined,
        documentNumber: form.documentNumber || undefined,
        issueDate: form.issueDate || undefined,
        expiryDate: form.expiryDate || undefined,
        file,
      });
      toast({ title: 'Sucesso', description: 'Documento enviado com sucesso' });
      setModalOpen(false);
      load();
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

  const handleDownload = async (doc: VehicleDocument) => {
    setDownloadingId(doc.id);
    try {
      const blob = await vehicleDocumentService.download(doc.id);
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

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await vehicleDocumentService.delete(id);
      toast({ title: 'Sucesso', description: 'Documento excluído' });
      load();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error?.response?.data?.message || 'Não foi possível excluir o documento',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString('pt-BR');
    } catch {
      return iso;
    }
  };

  const isExpired = (d: VehicleDocument) =>
    d.expiryDate && new Date(d.expiryDate) < new Date();

  const expiresSoon = (d: VehicleDocument) => {
    if (!d.expiryDate || isExpired(d)) return false;
    const diff = (new Date(d.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 60;
  };

  const expiredCount = documents.filter(isExpired).length;
  const expiringCount = documents.filter(expiresSoon).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
        <h3 className="text-seguranca-lightgray font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos dos Veículos (CRLV, DUT, Seguro)
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} className="border-gray-600 text-gray-400 hover:bg-gray-700">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={openCreate} className="bg-seguranca-red hover:bg-seguranca-darkred">
            <Plus size={16} className="mr-2" />
            Enviar Documento
          </Button>
        </div>
      </div>

      {/* Alertas de validade */}
      {(expiredCount > 0 || expiringCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expiredCount > 0 && (
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-800/50">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Documentos Vencidos ({expiredCount})</span>
              </div>
              <p className="text-xs text-red-300 mt-1">Renove os documentos com validade expirada</p>
            </div>
          )}
          {expiringCount > 0 && (
            <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-800/50">
              <div className="flex items-center gap-2 text-amber-400">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Vencem em 60 dias ({expiringCount})</span>
              </div>
              <p className="text-xs text-amber-300 mt-1">Programe a renovação para evitar multas</p>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8 bg-seguranca-black border border-gray-600 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
          <span className="ml-2 text-seguranca-lightgray">Carregando documentos...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-seguranca-black border border-gray-600 rounded-lg text-gray-400">
          <Inbox className="mx-auto mb-2" size={32} />
          <p>Nenhum documento enviado ainda</p>
        </div>
      ) : (
        <div className="bg-seguranca-black border border-gray-600 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600 bg-seguranca-graphite">
                <th className="text-left p-3 text-seguranca-lightgray font-medium">Veículo</th>
                <th className="text-left p-3 text-seguranca-lightgray font-medium">Tipo</th>
                <th className="text-left p-3 text-seguranca-lightgray font-medium">Documento</th>
                <th className="text-left p-3 text-seguranca-lightgray font-medium">Nº</th>
                <th className="text-left p-3 text-seguranca-lightgray font-medium">Validade</th>
                <th className="text-left p-3 text-seguranca-lightgray font-medium">Arquivo</th>
                <th className="text-right p-3 text-seguranca-lightgray font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-b border-gray-700/50 hover:bg-seguranca-graphite/40 transition-colors">
                  <td className="p-3 text-white font-medium">{d.vehiclePlate}</td>
                  <td className="p-3">
                    <Badge className={DOC_TYPE_COLORS[d.docType] || DOC_TYPE_COLORS.OUTRO}>
                      {DOC_TYPE_LABELS[d.docType] || d.docType}
                    </Badge>
                  </td>
                  <td className="p-3 text-seguranca-lightgray">{d.title || d.originalName}</td>
                  <td className="p-3 text-seguranca-lightgray">{d.documentNumber || '-'}</td>
                  <td className="p-3">
                    <span className={
                      isExpired(d) ? 'text-red-500' : expiresSoon(d) ? 'text-amber-400' : 'text-seguranca-lightgray'
                    }>
                      {formatDate(d.expiryDate)}
                    </span>
                    {isExpired(d) && <AlertTriangle className="inline-block ml-1 h-3.5 w-3.5 text-red-500" />}
                  </td>
                  <td className="p-3 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <File className="h-3.5 w-3.5" />
                      {d.originalName} ({d.displaySize})
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleDownload(d)} disabled={downloadingId === d.id}
                        className="p-1.5 rounded hover:bg-seguranca-graphite text-seguranca-yellow" title="Baixar">
                        {downloadingId === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={15} />}
                      </button>
                      <button onClick={() => handleDelete(d.id)} disabled={deletingId === d.id}
                        className="p-1.5 rounded hover:bg-seguranca-graphite text-red-500" title="Excluir">
                        {deletingId === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Upload */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-seguranca-graphite border-gray-600 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-seguranca-lightgray">
              <Upload className="h-5 w-5 text-seguranca-yellow" />
              Enviar Documento do Veículo
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Envie CRLV, DUT, Seguro ou outro documento do veículo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="text-seguranca-lightgray">Veículo *</Label>
                <Select value={form.vehicleId} onValueChange={(v) => setForm({ ...form, vehicleId: v })}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.plate} - {v.brand} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-seguranca-lightgray">Tipo de Documento</Label>
                <Select value={form.docType} onValueChange={(v: any) => setForm({ ...form, docType: v })}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600">
                    {(Object.keys(DOC_TYPE_LABELS) as VehicleDocumentType[]).map((t) => (
                      <SelectItem key={t} value={t}>{DOC_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-seguranca-lightgray">Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  placeholder="Ex: CRLV 2026, Apólice Seguro..." />
              </div>
              <div>
                <Label className="text-seguranca-lightgray">Nº do Documento</Label>
                <Input value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray" />
              </div>
              <div>
                <Label className="text-seguranca-lightgray">Data de Emissão</Label>
                <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray" />
              </div>
              <div>
                <Label className="text-seguranca-lightgray">Data de Validade</Label>
                <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={uploading}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
              Cancelar
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? 'Enviando...' : 'Selecionar e Enviar'}
            </Button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleDocumentsTable;
