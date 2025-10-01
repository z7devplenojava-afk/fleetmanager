import React, { useState } from 'react';
import { Button } from '../ui/button';
import TermoValeTransporteForm from './TermoValeTransporteForm';
import FichaEntregaEPIForm from './FichaEntregaEPIForm';
import FichaRegistroFuncionarioForm from './FichaRegistroFuncionarioForm';
import TermoResponsabilidadeEquipamentoForm from './TermoResponsabilidadeEquipamentoForm';
import TermoLGPDForm from './TermoLGPDForm';
import ContratosTrabalhoForm from './ContratosTrabalhoForm';
import OrdemServicosForm from './OrdemServicosForm';
import AdvertenciaDisciplinarForm from './AdvertenciaDisciplinarForm';
import DeclaracaoForm from './DeclaracaoForm';
import TermoCienciaPrestadorForm from './TermoCienciaPrestadorForm';
import OrdemServicoForm from './OrdemServicoForm';
import ModelosDocumentosForm from './ModelosDocumentosForm';

const tipos = [
  { key: 'modelos', label: 'Modelos de Documentos' },
  { key: 'vt', label: 'Termo de Compromisso de Vale-Transporte' },
  { key: 'epi', label: 'Ficha de Entrega de EPI' },
  { key: 'registro', label: 'Ficha de Registro do Funcionário' },
  { key: 'equipamento', label: 'Termo de Responsabilidade de Equipamento' },
  { key: 'lgpd', label: 'Termo de Consentimento LGPD' },
  { key: 'contratos', label: 'Contratos de Trabalho' },
  { key: 'ordens', label: 'Ordem de Serviços' },
  { key: 'advertencia', label: 'Advertência Disciplinar' },
  { key: 'declaracao', label: 'Declaração' },
  { key: 'termo-ciencia', label: 'Termo de Ciência do Prestador de Serviços' },
  { key: 'ordem-servico-completa', label: 'Ordem de Serviço Completa (CRUD)' },
];

const DocumentosGerarTab = () => {
  const [tipo, setTipo] = useState('modelos');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {tipos.map(t => (
          <Button key={t.key} variant={tipo === t.key ? 'default' : 'outline'} onClick={() => setTipo(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>
      <div>
        {tipo === 'modelos' && <ModelosDocumentosForm />}
        {tipo === 'vt' && <TermoValeTransporteForm />}
        {tipo === 'epi' && <FichaEntregaEPIForm />}
        {tipo === 'registro' && <FichaRegistroFuncionarioForm />}
        {tipo === 'equipamento' && <TermoResponsabilidadeEquipamentoForm />}
        {tipo === 'lgpd' && <TermoLGPDForm />}
        {tipo === 'contratos' && <ContratosTrabalhoForm />}
        {tipo === 'ordens' && <OrdemServicosForm />}
        {tipo === 'advertencia' && <AdvertenciaDisciplinarForm />}
        {tipo === 'declaracao' && <DeclaracaoForm />}
        {tipo === 'termo-ciencia' && <TermoCienciaPrestadorForm />}
        {tipo === 'ordem-servico-completa' && <OrdemServicoForm />}
      </div>
    </div>
  );
};

export default DocumentosGerarTab; 