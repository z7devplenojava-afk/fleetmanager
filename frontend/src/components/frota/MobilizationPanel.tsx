import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  eligibilityService,
  inspectionService,
  bookService,
  CRITERION_LABELS,
  BOOK_STATUS_LABELS,
  VehicleEligibility,
  MobilizationInspection,
  DailyLogBook,
  DailyLogBookStatus,
} from '@/services/mobilizationService';
import {
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  Plus,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

const fmtKm = (v?: number | null) =>
  typeof v === 'number' ? `${v.toLocaleString('pt-BR')} km` : '—';

/**
 * PRD 1.0 - Módulo 3: Elegibilidade de frota (RF-03.1), Vistoria de
 * Mobilização (RF-03.3) e Talões de Parte Diária (RF-03.5).
 */
const MobilizationPanel: React.FC = () => {
  const { toast } = useToast();

  // ===== Elegibilidade =====
  const [eligibility, setEligibility] = useState<VehicleEligibility[]>([]);
  const [showIneligible, setShowIneligible] = useState(true);
  const [eligLoading, setEligLoading] = useState(false);

  // ===== Vistorias =====
  const [inspections, setInspections] = useState<MobilizationInspection[]>([]);
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [form, setForm] = useState<MobilizationInspection>({});

  // ===== Talões =====
  const [books, setBooks] = useState<DailyLogBook[]>([]);
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState<DailyLogBook>({});
  const [sheets, setSheets] = useState(50);

  const loadEligibility = useCallback(async () => {
    setEligLoading(true);
    try {
      setEligibility(await eligibilityService.filterFleet(true));
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar elegibilidade da frota.', variant: 'destructive' });
    } finally {
      setEligLoading(false);
    }
  }, [toast]);

  const loadAll = useCallback(async () => {
    try {
      setInspections(await inspectionService.list());
      setBooks(await bookService.list());
    } catch {
      // silencioso — painéis individuais mostram erros
    }
  }, []);

  useEffect(() => {
    loadEligibility();
    loadAll();
  }, [loadEligibility, loadAll]);

  // ===== Vistoria =====
  const openNewInspection = () => {
    setForm({
      bodyworkOk: true,
      tiresOk: true,
      tachographOk: true,
      warningTriangleOk: true,
      wheelWrenchOk: true,
      reverseAlarmOk: true,
      crlvAttached: false,
    });
    setInspectionModalOpen(true);
  };

  const handleSaveInspection = async () => {
    if (!form.vehiclePlate?.trim()) {
      toast({ title: 'Atenção', description: 'Informe a placa do veículo.', variant: 'destructive' });
      return;
    }
    try {
      await inspectionService.create(form);
      toast({ title: 'Sucesso', description: 'Vistoria registrada. Aprovação exige checklist completo + assinaturas.' });
      setInspectionModalOpen(false);
      loadAll();
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.response?.data?.message || 'Falha ao registrar vistoria.',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await inspectionService.approve(id);
      toast({ title: 'Aprovada', description: 'Mobilização liberada.' });
      loadAll();
    } catch (e: any) {
      toast({
        title: 'Checklist incompleto',
        description: e?.response?.data?.message || 'Não foi possível aprovar.',
        variant: 'destructive',
      });
    }
  };

  const handleInspectionPdf = async (id: string) => {
    try {
      const res = await inspectionService.downloadPdf(id);
      const url = URL.createObjectURL(res.data as Blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast({ title: 'Erro', description: 'Falha ao gerar PDF da vistoria.', variant: 'destructive' });
    }
  };

  // ===== Talões =====
  const handleIssueBook = async () => {
    try {
      const created = await bookService.issue(bookForm, sheets);
      toast({
        title: 'Talão emitido',
        description: `${created.bookNumber}: folhas ${created.firstNumber} a ${created.lastNumber}.`,
      });
      setBookModalOpen(false);
      setBookForm({});
      setSheets(50);
      loadAll();
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.response?.data?.message || 'Falha ao emitir talão.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkLost = async (book: DailyLogBook) => {
    if (!book.id) return;
    try {
      await bookService.updateStatus(book.id, 'LOST');
      toast({ title: 'Talão marcado como extraviado' });
      loadAll();
    } catch {
      toast({ title: 'Erro', description: 'Falha ao atualizar talão.', variant: 'destructive' });
    }
  };

  const checkboxField = (
    label: string,
    field: keyof MobilizationInspection,
    checkedValue: boolean | undefined
  ) => (
    <div className="flex items-center gap-2">
      <Checkbox
        id={String(field)}
        checked={Boolean(checkedValue)}
        onCheckedChange={(v) => setForm((f) => ({ ...f, [field]: Boolean(v) }))}
      />
      <Label htmlFor={String(field)} className="text-sm">{label}</Label>
    </div>
  );

  return (
    <Tabs defaultValue="elegibilidade" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="elegibilidade">Elegibilidade da Frota</TabsTrigger>
        <TabsTrigger value="vistorias">Vistorias de Mobilização</TabsTrigger>
        <TabsTrigger value="taloes">Talões de Parte Diária</TabsTrigger>
      </TabsList>

      {/* ===== RF-03.1: ELEGIBILIDADE ===== */}
      <TabsContent value="elegibilidade" className="space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            RF-03.1: idade ≤ 5 anos, ar-condicionado, cinto completo, retarder, câmera e telemetria.
          </p>
          <Button variant="outline" size="sm" onClick={() => loadEligibility()} disabled={eligLoading}>
            Atualizar
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {eligLoading ? (
            <p className="text-sm text-muted-foreground">Avaliando frota...</p>
          ) : eligibility.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum veículo cadastrado.</p>
          ) : (
            eligibility
              .filter((r) => showIneligible || r.eligible)
              .map((r) => (
                <Card key={r.vehicleId} className={r.eligible ? 'border-green-600/40' : 'border-red-600/40'}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{r.plate}</span>
                      <Badge variant={r.eligible ? 'default' : 'destructive'}>
                        {r.eligible ? <BadgeCheck className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                        {r.eligible ? 'Elegível' : 'Inelegível'}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {[r.model, r.year].filter(Boolean).join(' · ')}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {Object.entries(r.criteria).map(([key, c]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1">
                          {c.ok ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                          {CRITERION_LABELS[key] ?? key}
                        </span>
                        <span className="text-muted-foreground">{c.detail}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={showIneligible} onCheckedChange={(v) => setShowIneligible(Boolean(v))} />
          Mostrar veículos inelegíveis
        </label>
      </TabsContent>

      {/* ===== RF-03.3: VISTORIAS ===== */}
      <TabsContent value="vistorias" className="space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            RF-03.3: checklist digital com fotos e CRLV, assinado em conjunto com o cliente.
          </p>
          <Button size="sm" onClick={openNewInspection}>
            <Plus className="h-4 w-4 mr-1" /> Nova Vistoria
          </Button>
        </div>
        <Card>
          <CardContent className="pt-4">
            {inspections.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma vistoria registrada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Laudo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.registryNumber}</TableCell>
                      <TableCell>{i.inspectionDate ? new Date(i.inspectionDate).toLocaleDateString('pt-BR') : '—'}</TableCell>
                      <TableCell>{i.vehiclePlate}</TableCell>
                      <TableCell>{i.clientName || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={i.approved ? 'default' : 'secondary'}>
                          {i.approved ? 'Aprovada' : 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!i.approved && (
                            <Button size="sm" variant="outline" onClick={() => handleApprove(i.id!)} title="Aprovar">
                              <ShieldCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleInspectionPdf(i.id!)} title="PDF">
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ===== RF-03.5: TALÕES ===== */}
      <TabsContent value="taloes" className="space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            RF-03.5: blocos com numeração sequencial distribuídos aos motoristas; folhas vinculadas às Partes Diárias.
          </p>
          <Button size="sm" onClick={() => setBookModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Emitir Talão
          </Button>
        </div>
        <Card>
          <CardContent className="pt-4">
            {books.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum talão emitido.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Talão</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Folhas</TableHead>
                    <TableHead>Consumo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((b) => {
                    const used = (b.currentNumber ?? 0) - (b.firstNumber ?? 0);
                    const total = (b.lastNumber ?? 0) - (b.firstNumber ?? 0) + 1;
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.bookNumber}</TableCell>
                        <TableCell>{b.vehiclePlate || '—'}</TableCell>
                        <TableCell>{b.assignedDriverName || '—'}</TableCell>
                        <TableCell>{b.firstNumber}–{b.lastNumber}</TableCell>
                        <TableCell>
                          <span className="text-xs">{used}/{total}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              b.status === 'ACTIVE' ? 'default'
                                : b.status === 'EXHAUSTED' ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {b.status ? BOOK_STATUS_LABELS[b.status] : '—'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {b.status === 'ACTIVE' && (
                            <Button size="sm" variant="ghost" onClick={() => handleMarkLost(b)} title="Marcar extraviado">
                              <BookOpen className="h-4 w-4 text-red-400" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ===== Modal Vistoria ===== */}
      <Dialog open={inspectionModalOpen} onOpenChange={setInspectionModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" /> Vistoria de Mobilização
            </DialogTitle>
            <DialogDescription>
              Checklist exigido pelo RF-03.3. A aprovação exige todos os itens OK, CRLV anexado e assinaturas conjuntas.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Veículo (ID) *</Label>
              <Input
                value={form.vehicle?.id ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, vehicle: e.target.value ? { id: e.target.value } : null }))}
                placeholder="UUID do veículo"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Placa *</Label>
              <Input
                value={form.vehiclePlate ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, vehiclePlate: e.target.value.toUpperCase() }))}
                placeholder="ABC1D23"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cliente (ID)</Label>
              <Input
                value={form.client?.id ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, client: e.target.value ? { id: e.target.value } : null }))}
                placeholder="UUID do cliente"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nº do Contrato</Label>
              <Input
                value={form.contractNumber ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, contractNumber: e.target.value }))}
              />
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-sm font-medium">Checklist</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {checkboxField('Estado da lataria OK', 'bodyworkOk', form.bodyworkOk)}
              {checkboxField('Pneus OK', 'tiresOk', form.tiresOk)}
              {checkboxField('Tacógrafo OK', 'tachographOk', form.tachographOk)}
              {checkboxField('Triângulo', 'warningTriangleOk', form.warningTriangleOk)}
              {checkboxField('Chave de roda', 'wheelWrenchOk', form.wheelWrenchOk)}
              {checkboxField('Alarme de ré', 'reverseAlarmOk', form.reverseAlarmOk)}
              {checkboxField('Cópia do CRLV anexada', 'crlvAttached', form.crlvAttached)}
            </div>
            <div className="space-y-1.5">
              <Label>URLs das fotos (separadas por vírgula)</Label>
              <Input
                value={form.photosUrls ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, photosUrls: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label>Vistoriador *</Label>
                <Input
                  value={form.inspectorName ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, inspectorName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Representante do Cliente *</Label>
                <Input
                  value={form.clientRepresentativeName ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, clientRepresentativeName: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInspectionModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveInspection}>Registrar Vistoria</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Modal Talão ===== */}
      <Dialog open={bookModalOpen} onOpenChange={setBookModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Emitir Talão de Parte Diária</DialogTitle>
            <DialogDescription>
              Faixa sequencial exclusiva gerada automaticamente (RF-03.5).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Veículo (ID)</Label>
              <Input
                value={bookForm.vehicle?.id ?? ''}
                onChange={(e) => setBookForm((f) => ({ ...f, vehicle: e.target.value ? { id: e.target.value } : null }))}
                placeholder="UUID do veículo"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Placa</Label>
              <Input
                value={bookForm.vehiclePlate ?? ''}
                onChange={(e) => setBookForm((f) => ({ ...f, vehiclePlate: e.target.value.toUpperCase() }))}
                placeholder="ABC1D23"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Motorista (nome)</Label>
              <Input
                value={bookForm.assignedDriverName ?? ''}
                onChange={(e) => setBookForm((f) => ({ ...f, assignedDriverName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Quantidade de folhas (1–200)</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={sheets}
                onChange={(e) => setSheets(parseInt(e.target.value) || 50)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Emitido por</Label>
              <Input
                value={bookForm.issuedBy ?? ''}
                onChange={(e) => setBookForm((f) => ({ ...f, issuedBy: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleIssueBook}>Emitir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default MobilizationPanel;
