import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
import { FileText, Shield, FileSignature, FileCheck, UserX, File, ClipboardList } from 'lucide-react';

const tipos = [
  { key: 'modelos', label: 'Modelos de Documentos', icon: FileText, shortLabel: 'Modelos' },
  { key: 'vt', label: 'Termo de Compromisso de Vale-Transporte', icon: FileText, shortLabel: 'Vale-Transporte' },
  { key: 'epi', label: 'Ficha de Entrega de EPI', icon: Shield, shortLabel: 'EPI' },
  { key: 'registro', label: 'Ficha de Registro do Funcionário', icon: ClipboardList, shortLabel: 'Registro' },
  { key: 'equipamento', label: 'Termo de Responsabilidade de Equipamento', icon: Shield, shortLabel: 'Equipamento' },
  { key: 'lgpd', label: 'Termo de Consentimento LGPD', icon: FileCheck, shortLabel: 'LGPD' },
  { key: 'contratos', label: 'Contratos de Trabalho', icon: FileSignature, shortLabel: 'Contratos' },
  { key: 'ordens', label: 'Ordem de Serviços', icon: FileText, shortLabel: 'Ordens' },
  { key: 'advertencia', label: 'Advertência Disciplinar', icon: UserX, shortLabel: 'Advertência' },
  { key: 'declaracao', label: 'Declaração', icon: FileCheck, shortLabel: 'Declaração' },
  { key: 'termo-ciencia', label: 'Termo de Ciência do Prestador de Serviços', icon: File, shortLabel: 'Termo Ciência' },
  { key: 'ordem-servico-completa', label: 'Ordem de Serviço Completa (CRUD)', icon: FileText, shortLabel: 'OS Completa' },
];

const DocumentosGerarTab = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tipoFromUrl = params.get('tipo');
  const [tipo, setTipo] = useState(tipoFromUrl || 'modelos');
  
  // Atualizar tipo quando mudar na URL
  useEffect(() => {
    if (tipoFromUrl) {
      setTipo(tipoFromUrl);
    }
  }, [tipoFromUrl]);

  return (
    <div className="space-y-6">
      {/* Header com título */}
      <div>
        <h2 className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
          <FileText className="h-6 w-6 text-seguranca-red" />
          <span>Gerar Documentos</span>
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Selecione o tipo de documento que deseja gerar
        </p>
      </div>

      {/* Botões de seleção de tipo */}
      <div className="w-full">
        <div className="flex flex-wrap gap-2 md:gap-3">
          {tipos.map(t => {
            const Icon = t.icon;
            const isActive = tipo === t.key;
            return (
              <Button
                key={t.key}
                variant={isActive ? 'default' : 'outline'}
                onClick={() => setTipo(t.key)}
                className={`
                  flex items-center gap-2 
                  text-sm 
                  px-4 md:px-5 
                  py-2.5 
                  h-10 
                  whitespace-nowrap
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-seguranca-red hover:bg-seguranca-red/90 text-white border-seguranca-red shadow-lg shadow-seguranca-red/20' 
                    : 'bg-seguranca-black border-gray-600 text-gray-400 hover:text-seguranca-lightgray hover:border-gray-500'
                  }
                  flex-shrink-0
                `}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.shortLabel}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo do formulário selecionado */}
      <div>
        {tipo === 'modelos' && <ModelosDocumentosForm />}
        {tipo === 'vt' && <TermoValeTransporteForm />}
        {tipo === 'epi' && <FichaEntregaEPIForm employeeId={params.get('employeeId') || undefined} />}
        {tipo === 'registro' && <FichaRegistroFuncionarioForm employeeId={params.get('employeeId') || undefined} />}
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