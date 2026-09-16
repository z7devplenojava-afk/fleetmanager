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
  opacityService,
  dossierService,
  sstAlertService,
  OPACITY_RESULT_LABELS,
  DOSSIER_STATUS_LABELS,
  OpacityTest,
  OpacityCoverage,
  ComplianceDossier,
} from '@/services/sstComplianceService';
import {
  Bell,
  CheckCircle2,
  FileDown,
  FileCheck2,
  Gauge,
  Plus,
  Wind,
} from 'lucide-react';

/**
 * PRD 1.0 - Módulo 4: Fumaça Preta (RF-04.3), Dossiê de Conformidade
 * 1-clique (RF-04.4) e alertas de ASO/CNH (RF-04.2).
 */
const SstCompliancePanel: React.FC = () => {
  const { toast } = useToast();

  // ===== Fumaça preta =====
  const [tests, setTests] = useState<OpacityTest[]>([]);
  const [coverage, setCoverage] = useState<OpacityCoverage | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testForm, setTestForm] = useState<OpacityTest>({});

  // ===== Dossiê =====
  const [dossiers, setDossiers] = useState<ComplianceDossier[]>([]);
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [dossierForm, setDossierForm] = useState<ComplianceDossier>({});

  const currentMonth = new Date().toISOString().slice(0, 7);
  const previousMonth = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  })();

  const loadAll = useCallback(async () => {
    try {
      setTests(await opacityService.list());
      setCoverage(await opacityService.getCoverage(currentMonth));
      setDossiers(await dossierService.list());
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar dados de SST.', variant: 'destructive' });
    }
  }, [currentMonth, toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ===== Fumaça preta =====
  const handleSaveTest = async () => {
    if (!testForm.vehiclePlate?.trim()) {
      toast({ title: 'Atenção', description: 'Informe a placa do veículo.', variant: 'destructive' });
      return;
    }
    if (testForm.ringelmannScale == null) {
      toast({ title: 'Atenção', description: 'Informe a escala Ringelmann (0-5).', variant: 'destructive' });
      return;
    }
    try {
      const saved = await opacityService.create(testForm);
      toast({
        title: 'Laudo registrado',
        description: `${saved.vehiclePlate}: Ringelmann ${saved.ringelmannScale} — ${OPACITY_RESULT_LABELS[saved.result as keyof typeof OPACITY_RESULT_LABELS]}`,
      });
      setTestModalOpen(false);
      setTestForm({});
      loadAll();
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.response?.data?.message || 'Falha ao registrar laudo.',
        variant: 'destructive',
      });
    }
  };

  // ===== Dossiê =====
  const handleCreateDossier = async () => {
    if (!dossierForm.clientId) {
      toast({ title: 'Atenção', description: 'Informe o ID do cliente.', variant: 'destructive' });
      return;
    }
    try {
      await dossierService.createOrGet(previousMonth, dossierForm.clientId);
      toast({ title: 'Dossiê pronto', description: `Referência ${previousMonth} (folha do mês anterior).` });
      setDossierModalOpen(false);
      loadAll();
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.response?.data?.message || 'Falha ao criar dossiê.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveChecklist = async () => {
    if (!dossierForm.id) return;
    try {
      const saved = await dossierService.update(dossierForm.id, dossierForm);
      setDossierForm(saved);
      toast({
        title: saved.status === 'COMPLETE' ? 'Kit completo!' : 'Checklist atualizado',
        description: saved.status === 'COMPLETE'
          ? 'Todos os itens mandatórios OK. Pronto para gerar.'
          : 'Fumaça preta é validada automaticamente (100% da frota).',
      });
      loadAll();
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.response?.data?.message || 'Falha ao salvar checklist.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerate = async (id: string) => {
    try {
      await dossierService.generate(id, 'Coordenador Financeiro');
      toast({ title: 'Dossiê gerado', description: 'Kit pronto para anexo ao Boletim de Medição.' });
      loadAll();
    } catch (e: any) {
      toast({
        title: 'Kit incompleto',
        description: e?.response?.data?.message || 'Não foi possível gerar.',
        variant: 'destructive',
      });
    }
  };

  const handleDossierPdf = async (id: string) => {
    try {
      const res = await dossierService.downloadPdf(id);
      const url = URL.createObjectURL(res.data as Blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast({ title: 'Erro', description: 'Falha ao gerar PDF do dossiê.', variant: 'destructive' });
    }
  };

  const handleRunAlerts = async () => {
    try {
      const res = await sstAlertService.runManualCheck();
      toast({
        title: 'Verificação concluída',
        description: `${res.asoAlerts} alerta(s) de ASO e ${res.cnhAlerts} de CNH enviados aos supervisores.`,
      });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao executar verificação.', variant: 'destructive' });
    }
  };

  const checklistItems: [keyof ComplianceDossier, string][] = [
    ['payrollSummaryOk', 'Folha analítica e resumo do mês anterior'],
    ['payrollDepositOk', 'Comprovantes de depósito de salários'],
    ['benefitsProofOk', 'Comprovantes de benefícios (Ticket/Plano de Saúde)'],
    ['fgtsGuideOk', 'Guia de FGTS + comprovante de pagamento'],
    ['inssGuideOk', 'Guia de GPS/INSS + comprovante de pagamento'],
    ['cndtOk', 'Certidão CNDT válida'],
    ['cndFgtsOk', 'CND FGTS válida'],
    ['cndUnionOk', 'CND Conjunta da União válida'],
  ];

  return (
    <Tabs defaultValue="fumaca" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="fumaca">Fumaça Preta (Ringelmann)</TabsTrigger>
        <TabsTrigger value="dossie">Dossiê de Conformidade</TabsTrigger>
      </TabsList>

      {/* ===== RF-04.3: FUMAÇA PRETA ===== */}
      <TabsContent value="fumaca" className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Wind className="h-5 w-5" /> Laudo de Opacidade — {currentMonth}
            </h3>
            <p className="text-sm text-muted-foreground">
              RF-04.3: medição mensal obrigatória para 100% dos veículos em operação na mina.
            </p>
          </div>
          <Button size="sm" onClick={() => setTestModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Registrar Laudo
          </Button>
        </div>

        {/* Gauge de cobertura */}
        {coverage && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Frota Ativa</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{coverage.activeVehicles}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Laudos no Mês</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{coverage.testedVehicles}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1"><Gauge className="h-3 w-3" /> Cobertura</CardTitle></CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${coverage.coveragePct >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                  {coverage.coveragePct}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Pendentes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{coverage.pendingVehicles.length}</p>
                {coverage.pendingVehicles.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {coverage.pendingVehicles.slice(0, 3).map((v) => v.plate).join(', ')}
                    {coverage.pendingVehicles.length > 3 ? '...' : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardContent className="pt-4">
            {tests.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum laudo registrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Ringelmann</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Laboratório</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.testDate ? new Date(t.testDate).toLocaleDateString('pt-BR') : '—'}</TableCell>
                      <TableCell className="font-medium">{t.vehiclePlate}</TableCell>
                      <TableCell>{t.ringelmannScale}</TableCell>
                      <TableCell>
                        <Badge
                          variant={t.result === 'APPROVED' ? 'default' : t.result === 'RESTRICTED' ? 'secondary' : 'destructive'}
                        >
                          {t.result ? OPACITY_RESULT_LABELS[t.result] : '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.laboratoryName || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ===== RF-04.4: DOSSIÊ ===== */}
      <TabsContent value="dossie" className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileCheck2 className="h-5 w-5" /> Dossiê Mensal de Conformidade
            </h3>
            <p className="text-sm text-muted-foreground">
              RF-04.4: kit mandatório anexo ao BM — folha, FGTS, INSS, CNDs e fumaça preta.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleRunAlerts}>
              <Bell className="h-4 w-4 mr-1" /> Verificar ASO/CNH
            </Button>
            <Button size="sm" onClick={() => setDossierModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Novo Dossiê
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {dossiers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum dossiê criado.</p>
          ) : (
            dossiers.map((d) => (
              <Card key={d.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{d.referenceMonth}</span>
                    <Badge variant={d.status === 'ATTACHED_TO_BM' || d.status === 'COMPLETE' ? 'default' : 'outline'}>
                      {d.status ? DOSSIER_STATUS_LABELS[d.status] : '—'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {checklistItems.map(([field, label]) => (
                      <span key={String(field)} className="flex items-center gap-1">
                        <CheckCircle2 className={`h-3 w-3 ${d[field] ? 'text-green-600' : 'text-gray-400'}`} />
                        {label}
                      </span>
                    ))}
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className={`h-3 w-3 ${d.opacityTestsOk ? 'text-green-600' : 'text-gray-400'}`} />
                      Fumaça preta (auto)
                    </span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {d.status !== 'ATTACHED_TO_BM' && (
                      <Button size="sm" variant="outline" onClick={() => {
                        setDossierForm({ ...d });
                        setDossierModalOpen(true);
                      }}>
                        Editar Checklist
                      </Button>
                    )}
                    {d.status === 'COMPLETE' && (
                      <Button size="sm" onClick={() => handleGenerate(d.id!)}>
                        Gerar (1-clique)
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleDossierPdf(d.id!)}>
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </TabsContent>

      {/* ===== Modal Laudo ===== */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Laudo de Fumaça Preta</DialogTitle>
            <DialogDescription>Escala Ringelmann (0-5). Único por veículo/mês.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Veículo (ID)</Label>
              <Input
                value={testForm.vehicle?.id ?? ''}
                onChange={(e) => setTestForm((f) => ({ ...f, vehicle: e.target.value ? { id: e.target.value } : null }))}
                placeholder="UUID do veículo"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Placa *</Label>
              <Input
                value={testForm.vehiclePlate ?? ''}
                onChange={(e) => setTestForm((f) => ({ ...f, vehiclePlate: e.target.value.toUpperCase() }))}
                placeholder="ABC1D23"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Escala Ringelmann (0-5) *</Label>
              <Input
                type="number"
                min={0}
                max={5}
                value={testForm.ringelmannScale ?? ''}
                onChange={(e) => setTestForm((f) => ({ ...f, ringelmannScale: parseInt(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground">Aprovação exige escala ≤ 2.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Laboratório</Label>
              <Input
                value={testForm.laboratoryName ?? ''}
                onChange={(e) => setTestForm((f) => ({ ...f, laboratoryName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nº do Certificado</Label>
              <Input
                value={testForm.certificateNumber ?? ''}
                onChange={(e) => setTestForm((f) => ({ ...f, certificateNumber: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveTest}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Modal Dossiê ===== */}
      <Dialog open={dossierModalOpen} onOpenChange={setDossierModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dossierForm.id ? `Dossiê ${dossierForm.referenceMonth}` : 'Novo Dossiê de Conformidade'}
            </DialogTitle>
            <DialogDescription>
              {dossierForm.id
                ? 'Marque os itens já coletados. Fumaça preta é validada automaticamente.'
                : `Será criado com referência ${previousMonth} (folha do mês anterior ao BM).`}
            </DialogDescription>
          </DialogHeader>

          {!dossierForm.id && (
            <div className="space-y-1.5">
              <Label>Cliente (ID) *</Label>
              <Input
                value={dossierForm.clientId ?? ''}
                onChange={(e) => setDossierForm((f) => ({ ...f, clientId: e.target.value }))}
                placeholder="UUID do cliente"
              />
            </div>
          )}

          {dossierForm.id && (
            <div className="space-y-2">
              {checklistItems.map(([field, label]) => (
                <label key={String(field)} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={Boolean(dossierForm[field])}
                    onCheckedChange={(v) => setDossierForm((f) => ({ ...f, [field]: Boolean(v) }))}
                  />
                  {label}
                </label>
              ))}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className={`h-3 w-3 ${dossierForm.opacityTestsOk ? 'text-green-600' : 'text-gray-400'}`} />
                Fumaça preta: validação automática (100% da frota no mês)
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDossierModalOpen(false)}>Cancelar</Button>
            {dossierForm.id ? (
              <Button onClick={handleSaveChecklist}>Salvar Checklist</Button>
            ) : (
              <Button onClick={handleCreateDossier}>Criar Dossiê</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default SstCompliancePanel;
