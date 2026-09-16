import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  contractTemplateService,
  ContractTemplate,
  GeneratedContract,
  TEMPLATE_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
} from '@/services/contractTemplateService';
import { costSimulationService, CostSimulation, STATUS_LABELS } from '@/services/costSimulationService';
import { FileDown, FileText, Send } from 'lucide-react';

interface ContractGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Proposta selecionada (contexto cliente/título). */
  proposal?: {
    id?: string;
    title?: string;
    clientId?: string;
    clientName?: string;
    totalValue?: number;
  } | null;
  onSuccess?: () => void;
}

const fmtBRL = (v?: number) =>
  typeof v === 'number' && isFinite(v)
    ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—';

/**
 * PRD 1.0 - Módulo 2 (RF-02.1/RF-02.2/RF-02.3):
 * geração de minuta contratual alimentada pela precificação aprovada do Módulo 1.
 */
export const ContractGenerationModal: React.FC<ContractGenerationModalProps> = ({
  open,
  onOpenChange,
  proposal,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [simulations, setSimulations] = useState<CostSimulation[]>([]);
  const [contracts, setContracts] = useState<GeneratedContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState<string>('');
  const [simulationId, setSimulationId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [contractorCnpj, setContractorCnpj] = useState('');
  const [contractorAddress, setContractorAddress] = useState('');
  const [electedForum, setElectedForum] = useState('comarca de Belo Horizonte/MG');

  const loadContracts = async (clientId?: string) => {
    if (!clientId) {
      setContracts([]);
      return;
    }
    try {
      setContracts(await contractTemplateService.listGenerated({ clientId }));
    } catch {
      setContracts([]);
    }
  };

  useEffect(() => {
    if (!open) return;
    contractTemplateService.listTemplates()
      .then((list) => {
        setTemplates(list);
        if (list.length > 0) setTemplateId(list[0].id);
      })
      .catch(() => setTemplates([]));

    costSimulationService.getAll()
      .then((all) => {
        // M1→M2: somente simulações aprovadas pela Diretoria alimentam contratos
        setSimulations(all.filter((s) => s.status === 'APPROVED'));
      })
      .catch(() => setSimulations([]));

    setTitle(proposal?.title ? `Contrato — ${proposal.title}` : '');
    setContractorName('');
    setContractorCnpj('');
    setContractorAddress('');
    loadContracts(proposal?.clientId);
  }, [open, proposal]);

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const selectedSimulation = simulations.find((s) => s.id === simulationId);

  const handleGenerate = async () => {
    if (!templateId || !simulationId || !proposal?.clientId) {
      toast({
        title: 'Atenção',
        description: 'Selecione o modelo contratual e a simulação de custos aprovada.',
        variant: 'destructive',
      });
      return;
    }
    setGenerating(true);
    try {
      const created = await contractTemplateService.generate({
        templateId,
        clientId: proposal.clientId,
        costSimulationId: simulationId,
        title: title || undefined,
        contractorName: contractorName || undefined,
        contractorCnpj: contractorCnpj || undefined,
        contractorAddress: contractorAddress || undefined,
        electedForum: electedForum || undefined,
      } as GeneratedContract);
      toast({
        title: 'Minuta gerada',
        description: `${created.title} v${created.version} criada com as cláusulas obrigatórias.`,
      });
      await loadContracts(proposal.clientId);
      onSuccess?.();
    } catch (e: any) {
      toast({
        title: 'Erro',
        description: e?.response?.data?.message || 'Falha ao gerar minuta contratual.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id: string) => {
    setDownloadId(id);
    try {
      const res = await contractTemplateService.downloadPdf(id);
      const url = URL.createObjectURL(res.data as Blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast({ title: 'Erro', description: 'Falha ao baixar PDF da minuta.', variant: 'destructive' });
    } finally {
      setDownloadId(null);
    }
  };

  const handleSend = async (id: string) => {
    try {
      await contractTemplateService.markSent(id, 'DocuSign');
      toast({ title: 'Enviada', description: 'Minuta enviada para assinatura digital (DocuSign).' });
      loadContracts(proposal?.clientId);
    } catch {
      toast({ title: 'Erro', description: 'Falha ao enviar para assinatura.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Minuta Contratual — {proposal?.clientName || 'Cliente'}</DialogTitle>
          <DialogDescription>
            Gera o contrato a partir de um dos 3 modelos do PRD com cláusulas obrigatórias,
            usando a precificação aprovada no Módulo 1.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção de template (RF-02.1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Modelo Contratual *</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="Selecione o modelo" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {TEMPLATE_TYPE_LABELS[t.templateType] ?? t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate?.description && (
                <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Simulação Aprovada (Módulo 1) *</Label>
              <Select value={simulationId} onValueChange={setSimulationId}>
                <SelectTrigger><SelectValue placeholder="Selecione a simulação" /></SelectTrigger>
                <SelectContent>
                  {simulations.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Nenhuma simulação aprovada pela Diretoria.
                    </div>
                  )}
                  {simulations.map((s) => (
                    <SelectItem key={s.id} value={s.id!}>
                      {s.name} — {fmtBRL(s.monthlyPrice)}/mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSimulation && (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>Franquia: {selectedSimulation.franchiseKm?.toLocaleString('pt-BR')} km ·
                    Diária: {fmtBRL(selectedSimulation.dailyRate)} ·
                    KM exc.: {fmtBRL(selectedSimulation.excessKmRate)}/km</p>
                </div>
              )}
            </div>
          </div>

          {/* Dados da minuta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Título do Contrato</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contrato de Prestação de Serviços" />
            </div>
            <div className="space-y-1.5">
              <Label>Foro Eleito</Label>
              <Input value={electedForum} onChange={(e) => setElectedForum(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Contratada (Razão Social)</Label>
              <Input value={contractorName} onChange={(e) => setContractorName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Contratada (CNPJ)</Label>
              <Input value={contractorCnpj} onChange={(e) => setContractorCnpj(e.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Contratada (Endereço)</Label>
              <Input value={contractorAddress} onChange={(e) => setContractorAddress(e.target.value)} />
            </div>
          </div>

          {/* Minutas já geradas */}
          {contracts.length > 0 && (
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium mb-2">Minutas geradas ({contracts.length})</p>
              <div className="space-y-2">
                {contracts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 text-sm border-b last:border-0 pb-2 last:pb-0">
                    <div>
                      <p className="font-medium">
                        {c.title} <Badge variant="outline">v{c.version}</Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.referenceNumber} · {c.status ? CONTRACT_STATUS_LABELS[c.status] : '—'} ·
                        {' '}{fmtBRL(c.monthlyPrice)}/mês
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleDownload(c.id!)} disabled={downloadId === c.id}>
                        <FileDown className="h-4 w-4" />
                      </Button>
                      {c.status === 'DRAFT' && (
                        <Button size="sm" variant="outline" onClick={() => handleSend(c.id!)} title="Enviar para assinatura">
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={handleGenerate} disabled={generating || !simulationId}>
            <FileText className="h-4 w-4 mr-2" />
            {generating ? 'Gerando...' : 'Gerar Minuta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContractGenerationModal;
