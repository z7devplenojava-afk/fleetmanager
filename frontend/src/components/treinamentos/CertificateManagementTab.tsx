import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Award,
  Download,
  FileSpreadsheet,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import certificationService from '@/services/certificationService';
import {
  Certification,
  CertificationStatus,
  CertificationType,
} from '@/types/certification';
import { exportToPDF, exportToXLSX } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';

const typeLabels: Record<CertificationType, string> = {
  SAFETY: 'Segurança',
  TECHNICAL: 'Técnica',
  MANAGEMENT: 'Gestão',
  COMPLIANCE: 'Conformidade',
  OTHER: 'Outro',
};

const statusLabels: Record<CertificationStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Ativo', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  EXPIRED: { label: 'Expirado', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
  PENDING: { label: 'Pendente', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  CANCELLED: { label: 'Cancelado', className: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
};

const emptyForm = {
  name: '',
  description: '',
  type: 'SAFETY' as CertificationType,
  status: 'ACTIVE' as CertificationStatus,
  employeeId: 0,
  employeeName: '',
  employeeCpf: '',
  issuingOrganization: '',
  certificateNumber: '',
  issueDate: '',
  expiryDate: '',
  cost: 0,
  location: '',
  notes: '',
  createdBy: 'sistema',
};

export const CertificateManagementTab: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CertificationStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | CertificationType>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await certificationService.getCertifications();
      setItems(data);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os certificados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (!term) return true;
      return (
        (c.name || '').toLowerCase().includes(term) ||
        (c.employeeName || '').toLowerCase().includes(term) ||
        (c.certificateNumber || '').toLowerCase().includes(term) ||
        (c.issuingOrganization || '').toLowerCase().includes(term)
      );
    });
  }, [items, searchTerm, statusFilter, typeFilter]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (cert: Certification) => {
    setEditingId(cert.id);
    setForm({
      name: cert.name,
      description: cert.description || '',
      type: cert.type,
      status: cert.status,
      employeeId: cert.employeeId,
      employeeName: cert.employeeName,
      employeeCpf: cert.employeeCpf,
      issuingOrganization: cert.issuingOrganization,
      certificateNumber: cert.certificateNumber,
      issueDate: (cert.issueDate || '').slice(0, 10),
      expiryDate: (cert.expiryDate || '').slice(0, 10),
      cost: cert.cost || 0,
      location: cert.location || '',
      notes: cert.notes || '',
      createdBy: cert.createdBy || 'sistema',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.employeeName.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe nome do certificado e colaborador.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        employeeId: form.employeeId || Date.now(),
        cost: Number(form.cost) || 0,
      };
      if (editingId) {
        await certificationService.updateCertification(editingId, payload);
      } else {
        await certificationService.createCertification(payload as any);
      }
      toast({ title: 'Sucesso', description: 'Certificado salvo com sucesso.' });
      setModalOpen(false);
      await load();
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o certificado.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cert: Certification) => {
    if (!confirm(`Excluir o certificado "${cert.name}" de ${cert.employeeName}?`)) return;
    try {
      await certificationService.deleteCertification(cert.id);
      await load();
      toast({ title: 'Excluído', description: 'Certificado removido.' });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!filtered.length) {
      toast({
        title: 'Nenhum registro',
        description: 'Não há certificados para exportar.',
        variant: 'destructive',
      });
      return;
    }
    setExporting(true);
    try {
      const rows = filtered.map(c => ({
        Certificado: c.name,
        Colaborador: c.employeeName,
        CPF: c.employeeCpf,
        Numero: c.certificateNumber,
        Orgao: c.issuingOrganization,
        Tipo: typeLabels[c.type] || c.type,
        Status: statusLabels[c.status]?.label || c.status,
        Emissao: formatDate(c.issueDate),
        Validade: formatDate(c.expiryDate),
        Local: c.location || '',
        Custo: c.cost ?? 0,
      }));
      const filename = `certificados-${new Date().toISOString().slice(0, 10)}`;
      if (format === 'pdf') {
        await exportToPDF(rows, filename, 'Relatório de Certificados');
      } else {
        await exportToXLSX(rows, filename, 'Relatório de Certificados');
      }
      toast({ title: 'Exportado', description: `Arquivo ${format.toUpperCase()} gerado.` });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-seguranca-graphite border-gray-700">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-seguranca-yellow" />
              Gestão de Certificados
            </CardTitle>
            <CardDescription className="text-gray-400">
              Controle de certificados e habilitações dos colaboradores.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={load} className="border-gray-600 text-gray-200">
              <RefreshCcw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('excel')}
              disabled={exporting}
              className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Excel
            </Button>
            <Button size="sm" onClick={openNew} className="bg-seguranca-red hover:bg-seguranca-darkred text-white">
              <Plus className="h-4 w-4 mr-1" />
              Novo certificado
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por nome, colaborador, nº..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-seguranca-black/60 border-gray-600 text-seguranca-lightgray"
              />
            </div>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
              <SelectTrigger className="bg-seguranca-black/60 border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600">
                <SelectItem value="all" className="text-seguranca-lightgray">Todos os status</SelectItem>
                {(Object.keys(statusLabels) as CertificationStatus[]).map(s => (
                  <SelectItem key={s} value={s} className="text-seguranca-lightgray">
                    {statusLabels[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={v => setTypeFilter(v as any)}>
              <SelectTrigger className="bg-seguranca-black/60 border-gray-600 text-seguranca-lightgray">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600">
                <SelectItem value="all" className="text-seguranca-lightgray">Todos os tipos</SelectItem>
                {(Object.keys(typeLabels) as CertificationType[]).map(t => (
                  <SelectItem key={t} value={t} className="text-seguranca-lightgray">
                    {typeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-400 flex items-center">
              <Award className="h-4 w-4 mr-2 text-seguranca-yellow" />
              {filtered.length} registro(s)
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border border-dashed border-gray-600 rounded-lg">
              Nenhum certificado encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-600/40">
              <table className="w-full text-sm">
                <thead className="bg-seguranca-black/60">
                  <tr className="text-left text-seguranca-yellow">
                    <th className="p-3 font-semibold">Certificado</th>
                    <th className="p-3 font-semibold">Colaborador</th>
                    <th className="p-3 font-semibold">Órgão</th>
                    <th className="p-3 font-semibold">Validade</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(cert => (
                    <tr key={cert.id} className="border-t border-gray-700/50 hover:bg-seguranca-black/30">
                      <td className="p-3 text-seguranca-lightgray">
                        <div className="font-medium">{cert.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{cert.certificateNumber}</div>
                      </td>
                      <td className="p-3 text-gray-300">{cert.employeeName}</td>
                      <td className="p-3 text-gray-400">{cert.issuingOrganization || '—'}</td>
                      <td className="p-3 text-gray-400">{formatDate(cert.expiryDate)}</td>
                      <td className="p-3">
                        <Badge className={`${statusLabels[cert.status]?.className} border px-2`}>
                          {statusLabels[cert.status]?.label || cert.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(cert)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(cert)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-seguranca-graphite border-gray-600 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">
              {editingId ? 'Editar certificado' : 'Novo certificado'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Preencha os dados do certificado ou habilitação.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-gray-300">Nome *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: NR-35 - Trabalho em Altura"
                className="bg-seguranca-black/60 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">Colaborador *</Label>
              <Input
                value={form.employeeName}
                onChange={e => setForm(f => ({ ...f, employeeName: e.target.value }))}
                className="bg-seguranca-black/60 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">CPF</Label>
              <Input
                value={form.employeeCpf}
                onChange={e => setForm(f => ({ ...f, employeeCpf: e.target.value }))}
                className="bg-seguranca-black/60 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">Tipo</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as CertificationType }))}>
                <SelectTrigger className="bg-seguranca-black/60 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600">
                  {(Object.keys(typeLabels) as CertificationType[]).map(t => (
                    <SelectItem key={t} value={t} className="text-seguranca-lightgray">
                      {typeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as CertificationStatus }))}>
                <SelectTrigger className="bg-seguranca-black/60 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600">
                  {(Object.keys(statusLabels) as CertificationStatus[]).map(s => (
                    <SelectItem key={s} value={s} className="text-seguranca-lightgray">
                      {statusLabels[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">Órgão emissor</Label>
              <Input
                value={form.issuingOrganization}
                onChange={e => setForm(f => ({ ...f, issuingOrganization: e.target.value }))}
                className="bg-seguranca-black/60 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">Nº certificado</Label>
              <Input
                value={form.certificateNumber}
                onChange={e => setForm(f => ({ ...f, certificateNumber: e.target.value }))}
                className="bg-seguranca-black/60 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">Emissão</Label>
              <Input
                type="date"
                value={form.issueDate}
                onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))}
                className="bg-seguranca-black/60 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">Validade</Label>
              <Input
                type="date"
                value={form.expiryDate}
                onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                className="bg-seguranca-black/60 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">Custo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.cost}
                onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))}
                className="bg-seguranca-black/60 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-300">Local</Label>
              <Input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="bg-seguranca-black/60 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-gray-300">Observações</Label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full rounded-md bg-seguranca-black/60 border border-gray-600 text-white px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="border-gray-600 text-gray-200"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-seguranca-red hover:bg-seguranca-darkred text-white"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CertificateManagementTab;
