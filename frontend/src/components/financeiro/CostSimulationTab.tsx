import React, { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  costSimulationService,
  CostSimulation,
} from '@/services/costSimulationService';
import { clientService } from '@/services/clientService';
import { SEED_ROUTE_TEMPLATES } from '@/services/costSeedData';
import { CostSummaryTab, SelectedFleetItem } from './CostSummaryTab';
import { CostLaunchTab } from './CostLaunchTab';
import {
  Calculator,
  FileSpreadsheet,
  Plus,
  Bus,
} from 'lucide-react';

interface ClientOption {
  id: string;
  name: string;
}

export type SelectedSimulationFleetItem = SelectedFleetItem;

interface CostSimulationTabProps {
  onGenerateProposal?: (simulation: CostSimulation) => void;
  onGenerateMultiProposal?: (items: SelectedSimulationFleetItem[]) => void;
}

export const CostSimulationTab: React.FC<CostSimulationTabProps> = ({
  onGenerateProposal,
  onGenerateMultiProposal,
}) => {
  const { toast } = useToast();
  const [subTab, setSubTab] = useState<'resumo' | 'lancamento'>('resumo');
  const [simulations, setSimulations] = useState<CostSimulation[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingSimulation, setEditingSimulation] = useState<CostSimulation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CostSimulation | null>(null);

  const loadSimulations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await costSimulationService.getAll();
      if (Array.isArray(data) && data.length > 0) {
        setSimulations(data);
      } else {
        // Se a base estiver vazia, pré-carregar os templates reais das planilhas (orçamento.xlsx e Planilha de Custo.xlsx)
        setSimulations(SEED_ROUTE_TEMPLATES);
      }
    } catch {
      // Fallback para modelos das planilhas em caso de indisponibilidade
      setSimulations(SEED_ROUTE_TEMPLATES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSimulations();
    Promise.all([
      clientService.getClients().catch(() => []),
      import('@/services/leadService').then((m) => m.default.getAllLeads().catch(() => [])),
    ]).then(([clientRes, leadRes]: [any, any]) => {
      const clientList = Array.isArray(clientRes) ? clientRes : clientRes?.content || [];
      const leadList = Array.isArray(leadRes) ? leadRes : leadRes?.content || [];

      const mappedClients: ClientOption[] = clientList.map((c: any) => ({
        id: String(c.id),
        name: `🏢 ${c.name || c.nome}`,
      }));

      const mappedLeads: ClientOption[] = leadList.map((l: any) => ({
        id: String(l.id),
        name: `🎯 Lead: ${l.company || l.name || l.nome}`,
      }));

      setClients([...mappedClients, ...mappedLeads]);
    }).catch(() => setClients([]));
  }, [loadSimulations]);

  const handleNewSimulation = () => {
    setEditingSimulation(null);
    setSubTab('lancamento');
  };

  const handleEditSimulation = (simulation: CostSimulation) => {
    setEditingSimulation(simulation);
    setSubTab('lancamento');
  };

  const handleDeleteSimulation = (simulation: CostSimulation) => {
    setDeleteTarget(simulation);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.id && !deleteTarget.id.startsWith('seed-')) {
        await costSimulationService.delete(deleteTarget.id);
      }
      setSimulations((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast({
        title: 'Operação Excluída',
        description: `A rota "${deleteTarget.name}" foi removida da tabela consolidada.`,
      });
    } catch {
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir a simulação do servidor.',
        variant: 'destructive',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSaved = (saved: CostSimulation) => {
    // Atualizar estado local
    setSimulations((prev) => {
      const exists = prev.some((s) => s.id === saved.id);
      if (exists) {
        return prev.map((s) => (s.id === saved.id ? saved : s));
      }
      return [saved, ...prev];
    });
    // Voltar para a tabela consolidada
    setSubTab('resumo');
  };

  return (
    <div className="space-y-6">
      {/* Sub-abas de Navegação: Lançamento de Custos & Resumo de Custos */}
      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as 'resumo' | 'lancamento')} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto p-1.5 bg-card/80 backdrop-blur-md border border-border/60 rounded-2xl h-auto shadow-md">
          <TabsTrigger
            value="lancamento"
            className="py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all data-[state='active']:bg-red-600 data-[state='active']:text-white data-[state='active']:shadow-md flex items-center justify-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            <span>Lançamento de Custos</span>
          </TabsTrigger>
          <TabsTrigger
            value="resumo"
            className="py-2.5 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all data-[state='active']:bg-red-600 data-[state='active']:text-white data-[state='active']:shadow-md flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Resumo de Custos</span>
          </TabsTrigger>
        </TabsList>

        {/* ABA 2: RESUMO DE CUSTOS (TABELA CONSOLIDADA & ORÇAMENTO) */}
        <TabsContent value="resumo" className="mt-6">
          <CostSummaryTab
            simulations={simulations}
            loading={loading}
            onEditSimulation={handleEditSimulation}
            onDeleteSimulation={handleDeleteSimulation}
            onNewSimulation={handleNewSimulation}
            onGenerateProposal={onGenerateProposal}
            onGenerateMultiProposal={onGenerateMultiProposal}
          />
        </TabsContent>

        {/* ABA 1: LANÇAMENTO DE CUSTOS (INPUT DE DADOS & ENGENHARIA DE CUSTOS) */}
        <TabsContent value="lancamento" className="mt-6">
          <CostLaunchTab
            initialData={editingSimulation}
            clients={clients}
            onSaved={handleSaved}
            onGoToSummary={() => setSubTab('resumo')}
            onGenerateProposal={onGenerateProposal}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Operação Orçada</DialogTitle>
            <DialogDescription>
              Deseja realmente remover a rota "{deleteTarget?.name}"? Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CostSimulationTab;
