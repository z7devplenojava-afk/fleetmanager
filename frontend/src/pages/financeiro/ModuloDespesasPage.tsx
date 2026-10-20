import React from 'react';
import { useLocation } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import ModuloDespesasPanel, { ModuloSetor } from '@/components/financeiro/ModuloDespesasPanel';

interface ModuloDespesasPageProps {
  modulo?: ModuloSetor;
}

export const ModuloDespesasPage: React.FC<ModuloDespesasPageProps> = ({ modulo }) => {
  const location = useLocation();

  const resolvedModulo: ModuloSetor = React.useMemo(() => {
    if (modulo) return modulo;
    const path = location.pathname.toLowerCase();
    if (path.includes('manutencao')) return 'MANUTENCAO';
    if (path.includes('frota')) return 'FROTA';
    if (path.includes('sst')) return 'SST';
    if (path.includes('dp')) return 'DP';
    if (path.includes('rh')) return 'RH';
    if (path.includes('operacional')) return 'OPERACIONAL';
    if (path.includes('almoxarifado') || path.includes('estoque')) return 'ALMOXARIFADO';
    return 'MANUTENCAO';
  }, [modulo, location.pathname]);

  const titles: Record<ModuloSetor, { title: string; subtitle: string }> = {
    MANUTENCAO: {
      title: 'Despesas com Manutenção',
      subtitle: 'Controle de custos, peças e serviços vinculados à manutenção e ordens de serviço'
    },
    FROTA: {
      title: 'Despesas com Frotas',
      subtitle: 'Locações, seguros, rastreadores e custos operacionais de veículos'
    },
    RH: {
      title: 'Despesas de Recursos Humanos',
      subtitle: 'Lançamentos e gestão de custos com benefícios, convênios e gestão de pessoas'
    },
    DP: {
      title: 'Despesas do Departamento Pessoal',
      subtitle: 'Controle de encargos, guias, rescisões e obrigações trabalhistas'
    },
    SST: {
      title: 'Despesas com SST (Segurança do Trabalho)',
      subtitle: 'Aquisição de EPIs, uniformes, laudos e exames ocupacionais'
    },
    OPERACIONAL: {
      title: 'Despesas Operacionais',
      subtitle: 'Custos de viagem, combustível, pedágios e despesas de rotas e operações'
    },
    ALMOXARIFADO: {
      title: 'Despesas de Almoxarifado & Compras',
      subtitle: 'Aquisição de materiais de consumo, peças em estoque e suprimentos'
    }
  };

  const info = titles[resolvedModulo];

  return (
    <StandardLayout title={info.title} subtitle={info.subtitle}>
      <ModuloDespesasPanel modulo={resolvedModulo} hideHeaderTitle={true} />
    </StandardLayout>
  );
};

export default ModuloDespesasPage;
