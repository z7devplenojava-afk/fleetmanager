import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload
} from 'lucide-react';
import {
  cfmeDocumentService,
  CFME_CATEGORIES,
  CFME_CATEGORY_DESCRIPTIONS,
  CFME_CATEGORY_LABELS,
  CFME_ACCEPTED_EXTENSIONS,
  type CfmeCategory,
  type CfmeDocument,
  type CfmeDocumentFormData,
  type CfmeStatus
} from '@/services/cfmeDocumentService';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const STATUS_CONFIG: Record<CfmeStatus, { label: string; className: string }> = {
  VIGENTE: { label: 'Vigente', className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' },
  VENCENDO: { label: 'Vencendo', className: 'bg-amber-500/20 text-amber-300 border border-amber-500/40' },
  VENCIDO: { label: 'Vencido', className: 'bg-red-500/20 text-red-300 border border-red-500/40' },
  SEM_VALIDADE: { label: 'Sem validade', className: 'bg-gray-500/20 text-gray-300 border border-gray-500/40' }
};

const CATEGORY_BADGE: Record<CfmeCategory, string> = {
  ANTT: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  ATR: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
  DEER: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
  CREA: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
  CERTIDAO: 'bg-teal-500/15 text-teal-300 border-teal-500/40',
  LISTA_PASSAGEIROS: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
  AUTORIZACAO_VIAGEM: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  ATA: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  OUTRO: 'bg-gray-500/15 text-gray-300 border-gray-500/40'
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const iso = value.length > 10 ? value.substring(0, 10) : value;
  const parts = iso.split('-');
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('pt-BR');
  } catch {
    return value;
  }
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const err = error as { response?: { data?: { message?: string } }; message?: string } | undefined;
  return err?.response?.data?.message || err?.message || fallback;
};

const isExcel = (doc: CfmeDocument) => {
  const name = (doc.originalName || '').toLowerCase();
  return name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv');
};

interface DocumentFormModalProps {
  isOpen: boolean;
  editing: CfmeDocument | null;
  defaultCategory?: CfmeCategory;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_FORM: CfmeDocumentFormData = {
  category: 'ANTT',
  title: '',
  issuer: '',
  documentNumber: '',
  issueDate: '',
  expiryDate: '',
  notes: ''
};

const DocumentFormModal: React.FC<DocumentFormModalProps> = ({
  isOpen,
  editing,
  defaultCategory,
  onClose,
  onSaved
}) => {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CfmeDocumentFormData>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setForm({
        category: editing.category,
        title: editing.title || '',
        issuer: editing.issuer || '',
        documentNumber: editing.documentNumber || '',
        issueDate: editing.issueDate ? editing.issueDate.substring(0, 10) : '',
        expiryDate: editing.expiryDate ? editing.expiryDate.substring(0, 10) : '',
        notes: editing.notes || ''
      });
    } else {
      setForm({ ...EMPTY_FORM, category: defaultCategory || 'ANTT' });
    }
    setFile(null);
    setDragging(false);
  }, [isOpen, editing, defaultCategory]);

  const setField = <K extends keyof CfmeDocumentFormData>(key: K, value: CfmeDocumentFormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const acceptFile = (selected: File | null) => {
    if (!selected) return;
    const ext = selected.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'xls', 'xlsx', 'csv', 'doc', 'docx'].includes(ext)) {
      toast({
        title: 'Formato não permitido',
        description: 'Envie arquivos PDF, Excel (.xls/.xlsx), CSV ou Word (.doc/.docx).',
        variant: 'destructive'
      });
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 50MB.',
        variant: 'destructive'
      });
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async () => {
    if (!form.category) {
      toast({ title: 'Categoria obrigatória', description: 'Selecione a categoria do documento.', variant: 'destructive' });
      return;
    }
    if (!editing && !file) {
      toast({ title: 'Arquivo obrigatório', description: 'Anexe um arquivo PDF ou Excel.', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await cfmeDocumentService.update(editing.id, form);
        toast({ title: 'Documento atualizado', description: 'Os metadados foram salvos com sucesso.' });
      } else {
        await cfmeDocumentService.upload({ ...form, file: file as File });
        toast({ title: 'Documento enviado', description: 'O arquivo foi cadastrado no controle CFME.' });
      }
      onSaved();
      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: getErrorMessage(error, 'Falha ao salvar o documento.'),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-700 text-seguranca-lightgray max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <ShieldCheck className="h-5 w-5 text-seguranca-yellow" />
            {editing ? 'Editar Documento CFME' : 'Novo Documento CFME'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Certificações Federais, Municipais e Estaduais — envie PDF/Excel emitidos por ANTT, ATR, DEER, CREA, certidões, listas de passageiros, autorizações de viagem e atas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Categoria *</Label>
              <Select value={form.category} onValueChange={v => setField('category', v as CfmeCategory)}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                  {CFME_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {CFME_CATEGORY_DESCRIPTIONS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Título / Descrição</Label>
              <Input
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                placeholder="Ex.: Certificado de Autorização ANTT 2026"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Órgão / Entidade emissora</Label>
              <Input
                value={form.issuer}
                onChange={e => setField('issuer', e.target.value)}
                placeholder="Ex.: ANTT, DEER, Prefeitura..."
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Número do documento</Label>
              <Input
                value={form.documentNumber}
                onChange={e => setField('documentNumber', e.target.value)}
                placeholder="Ex.: 2026/000123"
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Data de emissão</Label>
              <Input
                type="date"
                value={form.issueDate}
                onChange={e => setField('issueDate', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Data de validade</Label>
              <Input
                type="date"
                value={form.expiryDate}
                onChange={e => setField('expiryDate', e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Observações</Label>
            <Textarea
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Informações complementares, condicionantes, exigências..."
              className="bg-seguranca-black border-gray-600 text-seguranca-lightgray min-h-[70px]"
            />
          </div>

          {!editing && (
            <div className="space-y-2">
              <Label className="text-gray-300">Arquivo (PDF / Excel) *</Label>
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={e => {
                  e.preventDefault();
                  setDragging(false);
                }}
                onDrop={e => {
                  e.preventDefault();
                  setDragging(false);
                  acceptFile(e.dataTransfer.files?.[0] || null);
                }}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  dragging
                    ? 'border-seguranca-yellow bg-seguranca-yellow/10'
                    : file
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-gray-600 bg-seguranca-black/40 hover:border-gray-500'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={CFME_ACCEPTED_EXTENSIONS}
                  className="hidden"
                  onChange={e => acceptFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    {file.name.toLowerCase().endsWith('.pdf') ? (
                      <FileText className="h-8 w-8 text-red-400" />
                    ) : (
                      <FileSpreadsheet className="h-8 w-8 text-emerald-400" />
                    )}
                    <div className="text-left">
                      <p className="font-semibold text-white text-sm">{file.name}</p>
                      <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Upload className="h-7 w-7 text-seguranca-yellow" />
                    <p className="text-sm">
                      Arraste o arquivo aqui ou <span className="text-seguranca-yellow underline">clique para selecionar</span>
                    </p>
                    <p className="text-xs text-gray-500">PDF, Excel (.xls/.xlsx), CSV ou Word — até 50MB</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-gray-700 pt-3">
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300" disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-seguranca-yellow hover:bg-yellow-500 text-seguranca-black font-bold"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {editing ? 'Salvar alterações' : 'Enviar documento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const GestaoCertificacoesCFME: React.FC = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<CfmeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | CfmeCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CfmeStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CfmeDocument | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await cfmeDocumentService.list();
      setDocuments(data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar',
        description: getErrorMessage(error, 'Não foi possível carregar os documentos.'),
        variant: 'destructive'
      });
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = documents.length;
    const vencidos = documents.filter(d => d.status === 'VENCIDO').length;
    const vencendo = documents.filter(d => d.status === 'VENCENDO').length;
    const vigentes = documents.filter(d => d.status === 'VIGENTE').length;
    return { total, vencidos, vencendo, vigentes };
  }, [documents]);

  const alerts = useMemo(
    () =>
      documents
        .filter(d => d.status === 'VENCIDO' || d.status === 'VENCENDO')
        .sort((a, b) => (a.daysToExpiry ?? 0) - (b.daysToExpiry ?? 0)),
    [documents]
  );

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (categoryFilter !== 'ALL' && doc.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const haystack = [
          doc.title,
          doc.originalName,
          doc.issuer,
          doc.documentNumber,
          doc.categoryDescription
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [documents, categoryFilter, statusFilter, searchTerm]);

  const countByCategory = useMemo(() => {
    const map = new Map<CfmeCategory, number>();
    documents.forEach(d => map.set(d.category, (map.get(d.category) || 0) + 1));
    return map;
  }, [documents]);

  const openUpload = () => {
    setEditingDoc(null);
    setIsFormOpen(true);
  };

  const openEdit = (doc: CfmeDocument) => {
    setEditingDoc(doc);
    setIsFormOpen(true);
  };

  const handleDelete = async (doc: CfmeDocument) => {
    const label = doc.title || doc.originalName;
    if (!window.confirm(`Excluir o documento "${label}"? Esta ação remove o arquivo definitivamente.`)) return;
    try {
      setDeletingId(doc.id);
      await cfmeDocumentService.remove(doc.id);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      toast({ title: 'Documento excluído', description: `${label} foi removido do controle CFME.` });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: getErrorMessage(error, 'Falha ao excluir o documento.'),
        variant: 'destructive'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (doc: CfmeDocument) => {
    try {
      setBusyId(doc.id);
      const blob = await cfmeDocumentService.fetchFile(doc.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.originalName || `cfme-${doc.id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Erro ao baixar', description: 'Não foi possível baixar o arquivo.', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const handleView = async (doc: CfmeDocument) => {
    try {
      setBusyId(doc.id);
      const blob = await cfmeDocumentService.fetchFile(doc.id);
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        toast({
          title: 'Popup bloqueado',
          description: 'Permita popups para visualizar o documento.',
          variant: 'destructive'
        });
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast({ title: 'Erro ao abrir', description: 'Não foi possível visualizar o arquivo.', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const defaultCategoryForUpload = categoryFilter === 'ALL' ? undefined : categoryFilter;

  return (
    <StandardLayout
      title="Controle de Certificações (CFME)"
      subtitle="Certificações Federais, Municipais e Estaduais — upload, validade e alertas de vencimento"
    >
      <div className="space-y-6 pb-10">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-seguranca-graphite border-l-4 border-l-blue-500">
            <CardHeader className="pb-1 p-4">
              <CardTitle className="text-xs font-medium text-blue-400 uppercase tracking-wider">Total de Documentos</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-seguranca-lightgray">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-seguranca-graphite border-l-4 border-l-emerald-500">
            <CardHeader className="pb-1 p-4">
              <CardTitle className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Vigentes</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-emerald-300">{stats.vigentes}</div>
            </CardContent>
          </Card>
          <Card className="bg-seguranca-graphite border-l-4 border-l-amber-500">
            <CardHeader className="pb-1 p-4">
              <CardTitle className="text-xs font-medium text-amber-400 uppercase tracking-wider">Vencendo em 30 dias</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-amber-300">{stats.vencendo}</div>
            </CardContent>
          </Card>
          <Card className="bg-seguranca-graphite border-l-4 border-l-red-500">
            <CardHeader className="pb-1 p-4">
              <CardTitle className="text-xs font-medium text-red-400 uppercase tracking-wider">Vencidos</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-red-300">{stats.vencidos}</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerta de vencimentos */}
        {alerts.length > 0 && (
          <Card className="bg-amber-950/20 border-amber-600/40">
            <CardContent className="p-4 flex items-start gap-3">
              <CalendarClock className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-200">
                <p className="font-semibold text-amber-300">
                  {alerts.length} documento(s) exigem atenção
                </p>
                <p className="text-amber-200/80 text-xs mt-1">
                  {alerts
                    .slice(0, 5)
                    .map(a => a.title || a.originalName)
                    .join(' • ')}
                  {alerts.length > 5 ? ` • +${alerts.length - 5}` : ''}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categorias */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={categoryFilter === 'ALL' ? 'default' : 'outline'}
            onClick={() => setCategoryFilter('ALL')}
            className={`h-9 text-xs ${categoryFilter === 'ALL' ? 'bg-seguranca-red hover:bg-seguranca-darkred text-white' : 'border-gray-600 text-gray-300'}`}
          >
            Todos ({documents.length})
          </Button>
          {CFME_CATEGORIES.map(cat => (
            <Button
              key={cat}
              size="sm"
              variant={categoryFilter === cat ? 'default' : 'outline'}
              onClick={() => setCategoryFilter(cat)}
              className={`h-9 text-xs ${categoryFilter === cat ? 'bg-seguranca-red hover:bg-seguranca-darkred text-white' : 'border-gray-600 text-gray-300'}`}
            >
              {CFME_CATEGORY_LABELS[cat]} ({countByCategory.get(cat) || 0})
            </Button>
          ))}
        </div>

        {/* Filtros e ações */}
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título, órgão, número ou arquivo..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 bg-seguranca-black border-gray-600 text-seguranca-lightgray h-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={v => setStatusFilter(v as 'ALL' | CfmeStatus)}>
                <SelectTrigger className="w-full sm:w-[190px] bg-seguranca-black border-gray-600 text-seguranca-lightgray h-9">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                  <SelectItem value="ALL">Todas as situações</SelectItem>
                  <SelectItem value="VIGENTE">Vigentes</SelectItem>
                  <SelectItem value="VENCENDO">Vencendo em 30 dias</SelectItem>
                  <SelectItem value="VENCIDO">Vencidos</SelectItem>
                  <SelectItem value="SEM_VALIDADE">Sem validade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadData}
                disabled={loading}
                className="border-gray-600 text-gray-300 hover:bg-seguranca-black h-9"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                onClick={openUpload}
                className="bg-seguranca-yellow hover:bg-yellow-500 text-seguranca-black font-bold h-9"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Novo Documento
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card className="bg-seguranca-graphite border-gray-700 overflow-hidden">
          <CardHeader className="border-b border-gray-700 bg-seguranca-black/30 py-3 px-4">
            <CardTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
              <ShieldCheck className="text-seguranca-yellow" size={18} />
              Documentos Regulatórios
              <span className="text-xs font-normal text-gray-400 ml-1">
                {filteredDocuments.length} de {documents.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow mb-2" />
                <p>Carregando documentos CFME...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center p-12 text-gray-400">
                <ShieldCheck size={40} className="mx-auto text-gray-600 mb-3" />
                <p className="font-semibold text-gray-300">Nenhum documento encontrado</p>
                <p className="text-sm mt-1">
                  Envie um arquivo PDF/Excel usando o botão "Novo Documento".
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-seguranca-black/60 text-gray-400 uppercase text-xs border-b border-gray-700">
                    <tr>
                      <th className="py-3 px-4">Documento</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Órgão / Nº</th>
                      <th className="py-3 px-4">Emissão</th>
                      <th className="py-3 px-4">Validade</th>
                      <th className="py-3 px-4">Situação</th>
                      <th className="py-3 px-4">Enviado por</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredDocuments.map(doc => (
                      <tr key={doc.id} className="hover:bg-seguranca-black/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-2">
                            {isExcel(doc) ? (
                              <FileSpreadsheet className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                            ) : (
                              <FileText className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate max-w-[240px]">
                                {doc.title || doc.originalName}
                              </p>
                              <p className="text-xs text-gray-400 truncate max-w-[240px]">{doc.originalName}</p>
                              {doc.displaySize && <p className="text-[11px] text-gray-500">{doc.displaySize}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${CATEGORY_BADGE[doc.category]} text-[11px] font-semibold`}>
                            {CFME_CATEGORY_LABELS[doc.category] || doc.category}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-200">{doc.issuer || '—'}</p>
                          <p className="text-xs text-gray-500 font-mono">{doc.documentNumber || '—'}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{formatDate(doc.issueDate)}</td>
                        <td className="py-3 px-4 text-gray-300">{formatDate(doc.expiryDate)}</td>
                        <td className="py-3 px-4">
                          <Badge className={`${STATUS_CONFIG[doc.status]?.className} text-[11px] font-semibold`}>
                            {STATUS_CONFIG[doc.status]?.label || doc.status}
                          </Badge>
                          {doc.daysToExpiry != null && doc.status !== 'SEM_VALIDADE' && (
                            <p className="text-[11px] text-gray-500 mt-1">
                              {doc.daysToExpiry < 0
                                ? `${Math.abs(doc.daysToExpiry)} dia(s) em atraso`
                                : `em ${doc.daysToExpiry} dia(s)`}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-300">{doc.uploadedByName || '—'}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(doc.createdAt)}</p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleView(doc)}
                              disabled={busyId === doc.id}
                              title="Visualizar"
                              className="border-gray-600 text-gray-300 hover:bg-seguranca-black h-8 w-8 p-0"
                            >
                              {busyId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(doc)}
                              disabled={busyId === doc.id}
                              title="Baixar"
                              className="border-gray-600 text-gray-300 hover:bg-seguranca-black h-8 w-8 p-0"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(doc)}
                              title="Editar metadados"
                              className="border-gray-600 text-blue-300 hover:bg-seguranca-black h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(doc)}
                              disabled={deletingId === doc.id}
                              title="Excluir"
                              className="border-gray-600 text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                            >
                              {deletingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legenda de situações */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Vigente</span>
          <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-amber-400" /> Vencendo em até 30 dias</span>
          <span className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-red-400" /> Vencido</span>
        </div>
      </div>

      <DocumentFormModal
        isOpen={isFormOpen}
        editing={editingDoc}
        defaultCategory={defaultCategoryForUpload}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDoc(null);
        }}
        onSaved={loadData}
      />
    </StandardLayout>
  );
};

export default GestaoCertificacoesCFME;
