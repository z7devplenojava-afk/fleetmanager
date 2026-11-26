import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, Users, Car, AlertTriangle, UserCheck } from 'lucide-react';
import GestaoChecklistCliente from './GestaoChecklistCliente';
import GestaoChecklistVeiculo from './GestaoChecklistVeiculo';
import GestaoChecklistMotorista from './GestaoChecklistMotorista';
import DriverChecklist from '../driver/DriverChecklist';
import DamageReportManagement from '../maintenance/DamageReportManagement';

export const GestaoChecklistHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const initialTab =
    tabParam === 'veiculo' || tabParam === 'veiculos'
      ? 'veiculo'
      : tabParam === 'avarias' || tabParam === 'avaria'
      ? 'avarias'
      : tabParam === 'motorista' || tabParam === 'motoristas'
      ? 'motorista'
      : 'cliente';

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [avariasSubTab, setAvariasSubTab] = useState<'checklist' | 'reports'>('checklist');

  useEffect(() => {
    if (tabParam) {
      if (tabParam === 'veiculo' || tabParam === 'veiculos') {
        setActiveTab('veiculo');
      } else if (tabParam === 'avarias' || tabParam === 'avaria') {
        setActiveTab('avarias');
      } else if (tabParam === 'cliente' || tabParam === 'clientes') {
        setActiveTab('cliente');
      } else if (tabParam === 'motorista' || tabParam === 'motoristas') {
        setActiveTab('motorista');
      }
    }
  }, [tabParam]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };

  return (
    <StandardLayout
      title="Gestão de Checklists"
      subtitle="Central unificada de checklists: por cliente, por veículo, controle de avarias e por motorista."
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 max-w-4xl bg-muted/70 p-1 rounded-xl">
            <TabsTrigger
              value="cliente"
              className="flex items-center justify-center gap-2 py-2.5 data-[state=active]:bg-seguranca-yellow data-[state=active]:text-black data-[state=active]:font-semibold transition-all"
            >
              <Users className="h-4 w-4" />
              <span>Checklist por Cliente</span>
            </TabsTrigger>
            <TabsTrigger
              value="veiculo"
              className="flex items-center justify-center gap-2 py-2.5 data-[state=active]:bg-seguranca-yellow data-[state=active]:text-black data-[state=active]:font-semibold transition-all"
            >
              <Car className="h-4 w-4" />
              <span>Checklist por Veículo</span>
            </TabsTrigger>
            <TabsTrigger
              value="avarias"
              className="flex items-center justify-center gap-2 py-2.5 data-[state=active]:bg-seguranca-yellow data-[state=active]:text-black data-[state=active]:font-semibold transition-all"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Checklist por Avarias</span>
            </TabsTrigger>
            <TabsTrigger
              value="motorista"
              className="flex items-center justify-center gap-2 py-2.5 data-[state=active]:bg-seguranca-yellow data-[state=active]:text-black data-[state=active]:font-semibold transition-all"
            >
              <UserCheck className="h-4 w-4" />
              <span>Checklist por Motorista</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="cliente" className="mt-0 focus-visible:outline-hidden">
              <GestaoChecklistCliente embedded />
            </TabsContent>

            <TabsContent value="veiculo" className="mt-0 focus-visible:outline-hidden">
              <GestaoChecklistVeiculo embedded />
            </TabsContent>

            <TabsContent value="avarias" className="mt-0 focus-visible:outline-hidden space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/50">
                <div className="inline-flex rounded-xl bg-muted/60 p-1 border border-border/60">
                  <button
                    type="button"
                    onClick={() => setAvariasSubTab('checklist')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                      avariasSubTab === 'checklist'
                        ? 'bg-seguranca-yellow text-black font-bold shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    <span>Vistoria & Checklist (Planta 4 Vistas)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvariasSubTab('reports')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                      avariasSubTab === 'reports'
                        ? 'bg-seguranca-yellow text-black font-bold shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Painel de Relatórios de Avarias</span>
                  </button>
                </div>
              </div>

              {avariasSubTab === 'checklist' ? (
                <DriverChecklist embedded />
              ) : (
                <DamageReportManagement embedded />
              )}
            </TabsContent>

            <TabsContent value="motorista" className="mt-0 focus-visible:outline-hidden">
              <GestaoChecklistMotorista embedded />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </StandardLayout>
  );
};

export default GestaoChecklistHub;
