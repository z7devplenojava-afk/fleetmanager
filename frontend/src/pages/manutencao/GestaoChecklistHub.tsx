import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardCheck, Users, Car, AlertTriangle } from 'lucide-react';
import GestaoChecklistCliente from './GestaoChecklistCliente';
import GestaoChecklistVeiculo from './GestaoChecklistVeiculo';
import DamageReportManagement from '../maintenance/DamageReportManagement';

export const GestaoChecklistHub: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const initialTab =
    tabParam === 'veiculo' || tabParam === 'veiculos'
      ? 'veiculo'
      : tabParam === 'avarias' || tabParam === 'avaria'
      ? 'avarias'
      : 'cliente';

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (tabParam) {
      if (tabParam === 'veiculo' || tabParam === 'veiculos') {
        setActiveTab('veiculo');
      } else if (tabParam === 'avarias' || tabParam === 'avaria') {
        setActiveTab('avarias');
      } else if (tabParam === 'cliente' || tabParam === 'clientes') {
        setActiveTab('cliente');
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
      subtitle="Central unificada de checklists: por cliente, por veículo e controle de avarias."
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 max-w-2xl bg-muted/70 p-1 rounded-xl">
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
          </TabsList>

          <div className="mt-6">
            <TabsContent value="cliente" className="mt-0 focus-visible:outline-hidden">
              <GestaoChecklistCliente embedded />
            </TabsContent>

            <TabsContent value="veiculo" className="mt-0 focus-visible:outline-hidden">
              <GestaoChecklistVeiculo embedded />
            </TabsContent>

            <TabsContent value="avarias" className="mt-0 focus-visible:outline-hidden">
              <DamageReportManagement embedded />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </StandardLayout>
  );
};

export default GestaoChecklistHub;
