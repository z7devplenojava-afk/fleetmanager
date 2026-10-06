import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, Truck, UserCheck, ShieldCheck, Download, FolderCheck, 
  Building2, Image as ImageIcon, Camera, CheckCircle2, Eye, Upload, 
  FileUp, X, ExternalLink, FileCheck, Building, User, ChevronRight,
  Shield, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import { generateMobilizationDossierPDF, MobilizationDossierData } from '@/utils/mobilizationDossierPdfGenerator';
import type { TransportMobilization } from '@/types/mobilization';

interface MobilizationDossierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobilization?: TransportMobilization | null;
}

// Estrutura de Documento Interativo com Suporte a Upload, Visualização e Download
interface DossierDocumentItem {
  id: string;
  title: string;
  category: 'VEICULO' | 'MOTORISTA' | 'SST' | 'EMPRESA';
  fileName: string;
  description: string;
  issuer: string;
  validUntil: string;
  status: 'ANEXADO' | 'PENDENTE';
  fileBlobUrl?: string;
  customFile?: File;
}

// Dados dos Clientes com Veículos e Motoristas da Mobilização
const CLIENT_DATA_MAP: Record<string, {
  clientName: string;
  workPost: string;
  cnpj: string;
  contract: string;
  vehicles: Array<{ plate: string; model: string; brand: string; chassis: string }>;
  drivers: Array<{ name: string; cpf: string; cnh: string; cnhCat: string; cnhDueDate: string }>;
}> = {
  'c1': {
    clientName: 'Vale S.A.',
    workPost: 'Mina de Brucutu',
    cnpj: '33.592.510/0001-54',
    contract: 'CTR-2026-VALE-8849',
    vehicles: [
      { plate: 'OPP0A67', model: 'Induscar Apache U', brand: 'Mercedes-Benz', chassis: '9BM384078EB938022' },
      { plate: 'OVQ6C30', model: 'Ideale 770', brand: 'Marcopolo', chassis: '9BM384078EB991102' }
    ],
    drivers: [
      { name: 'Jean Carlos de Souza', cpf: '109.845.237-00', cnh: '04891238910', cnhCat: 'D', cnhDueDate: '14/09/2028' },
      { name: 'Rosana Lima Dionísio', cpf: '088.192.445-12', cnh: '05912399120', cnhCat: 'D', cnhDueDate: '22/11/2027' }
    ]
  },
  'c2': {
    clientName: 'Aperam South America',
    workPost: 'Usina Timóteo',
    cnpj: '00.490.283/0001-01',
    contract: 'CTR-2026-APERAM-4410',
    vehicles: [
      { plate: 'PUG1214', model: 'Fly 9', brand: 'Volare', chassis: '9BM384078EB773391' }
    ],
    drivers: [
      { name: 'Marcos Antônio Ribeiro', cpf: '077.291.883-99', cnh: '06129844102', cnhCat: 'D', cnhDueDate: '08/04/2029' }
    ]
  },
  'c3': {
    clientName: 'CSN Mineração',
    workPost: 'Mina Casa de Pedra',
    cnpj: '08.902.291/0001-88',
    contract: 'CTR-2026-CSN-9912',
    vehicles: [
      { plate: 'OPP0A67', model: 'Induscar Apache U', brand: 'Mercedes-Benz', chassis: '9BM384078EB938022' }
    ],
    drivers: [
      { name: 'Jean Carlos de Souza', cpf: '109.845.237-00', cnh: '04891238910', cnhCat: 'D', cnhDueDate: '14/09/2028' }
    ]
  }
};

// Documentos Padrão da Empresa Viação São Silvestre Ltda.
const DEFAULT_COMPANY_DOCS: DossierDocumentItem[] = [
  {
    id: 'emp-1',
    title: 'CARTÃO CNPJ DA EMPRESA',
    category: 'EMPRESA',
    fileName: 'CARTAO_CNPJ_SAO_SILVESTRE_71055644000125.pdf',
    description: 'Comprovante de Inscrição e de Situação Cadastral Ativa',
    issuer: 'Receita Federal do Brasil',
    validUntil: 'Vigente 2026',
    status: 'ANEXADO'
  },
  {
    id: 'emp-2',
    title: 'LICENÇA OPERACIONAL ANTT / DER-MG',
    category: 'EMPRESA',
    fileName: 'LICENCA_OPERACIONAL_ANTT_DER_RNTRC_04912049.pdf',
    description: 'Termo de Autorização de Fretamento Coletivo de Passageiros',
    issuer: 'ANTT / DER-MG',
    validUntil: '31/12/2027',
    status: 'ANEXADO'
  },
  {
    id: 'emp-3',
    title: 'APÓLICE DE SEGURO RESP. CIVIL (PASSAGEIROS)',
    category: 'EMPRESA',
    fileName: 'APOLICE_SEGURO_EZZE_1062800034517.pdf',
    description: 'Seguro de Responsabilidade Civil Facultativa de Veículos e Passageiros',
    issuer: 'Ezze Seguros S/A',
    validUntil: '15/10/2026',
    status: 'ANEXADO'
  },
  {
    id: 'emp-4',
    title: 'CERTIDÃO NEGATIVA FEDERAL & FGTS',
    category: 'EMPRESA',
    fileName: 'CND_CONJUNTA_FEDERAL_FGTS_2026.pdf',
    description: 'Certidão Conjunta de Débitos Relativos a Tributos Federais e à Dívida Ativa',
    issuer: 'PGFN / Caixa Econômica Federal',
    validUntil: '18/12/2026',
    status: 'ANEXADO'
  },
  {
    id: 'emp-5',
    title: 'PROGRAMA DE GERENCIAMENTO DE RISCOS (PGR)',
    category: 'EMPRESA',
    fileName: 'PGR_INSTITUCIONAL_SAO_SILVESTRE_2026.pdf',
    description: 'Documento Base PGR em Conformidade com a NR-01',
    issuer: 'Engenharia de Segurança São Silvestre',
    validUntil: '01/03/2027',
    status: 'ANEXADO'
  },
  {
    id: 'emp-6',
    title: 'PCMSO INSTITUCIONAL DA EMPRESA',
    category: 'EMPRESA',
    fileName: 'PCMSO_INSTITUCIONAL_SAO_SILVESTRE_2026.pdf',
    description: 'Programa de Controle Médico de Saúde Ocupacional em Conformidade com NR-07',
    issuer: 'Médico do Trabalho - CRM/MG 48192',
    validUntil: '01/03/2027',
    status: 'ANEXADO'
  },
  {
    id: 'emp-7',
    title: 'CONTRATO SOCIAL CONSOLIDADO',
    category: 'EMPRESA',
    fileName: 'CONTRATO_SOCIAL_SAO_SILVESTRE_LTDA.pdf',
    description: 'Última Alteração Contratual Consolidada na JUCEMG',
    issuer: 'Junta Comercial do Estado de MG (JUCEMG)',
    validUntil: 'Vigente',
    status: 'ANEXADO'
  }
];

export const MobilizationDossierModal: React.FC<MobilizationDossierModalProps> = ({
  open,
  onOpenChange,
  mobilization
}) => {
  const { toast } = useToast();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seleção de Cliente (Vale S.A., Aperam, CSN)
  const [selectedClientId, setSelectedClientId] = useState<string>('c1');
  
  // Dados dinâmicos baseados no Cliente selecionado
  const activeClientInfo = CLIENT_DATA_MAP[selectedClientId] || CLIENT_DATA_MAP['c1'];

  // Seleção do Veículo e Motorista ativo no Dossiê
  const [selectedPlate, setSelectedPlate] = useState<string>(activeClientInfo.vehicles[0]?.plate || 'OPP0A67');
  const [selectedDriverName, setSelectedDriverName] = useState<string>(activeClientInfo.drivers[0]?.name || 'Jean Carlos de Souza');

  // Atualiza selects quando o cliente muda
  useEffect(() => {
    const info = CLIENT_DATA_MAP[selectedClientId] || CLIENT_DATA_MAP['c1'];
    if (info.vehicles.length > 0) setSelectedPlate(info.vehicles[0].plate);
    if (info.drivers.length > 0) setSelectedDriverName(info.drivers[0].name);
  }, [selectedClientId]);

  // Se a prop mobilization foi enviada com dados, sincroniza com o select de cliente
  useEffect(() => {
    if (mobilization?.clientId && CLIENT_DATA_MAP[mobilization.clientId]) {
      setSelectedClientId(mobilization.clientId);
    }
    if (mobilization?.vehiclePlate) {
      setSelectedPlate(mobilization.vehiclePlate);
    }
    if (mobilization?.driverName) {
      setSelectedDriverName(mobilization.driverName);
    }
  }, [mobilization]);

  // Dados do Veículo e Motorista atualmente selecionados
  const currentVehicle = activeClientInfo.vehicles.find(v => v.plate === selectedPlate) || activeClientInfo.vehicles[0];
  const currentDriver = activeClientInfo.drivers.find(d => d.name === selectedDriverName) || activeClientInfo.drivers[0];

  // Estado dos Documentos do Veículo
  const [vehicleDocs, setVehicleDocs] = useState<DossierDocumentItem[]>([
    { id: 'v-1', title: 'CRLV DO VEÍCULO 2026', category: 'VEICULO', fileName: `CRLV_2026_${selectedPlate}.pdf`, description: 'Licenciamento e Certificado de Registro e Licenciamento (Detran-MG)', issuer: 'Detran-MG', validUntil: '31/10/2026', status: 'ANEXADO' },
    { id: 'v-2', title: 'LAUDO DE CONFORMIDADE TÉCNICA', category: 'VEICULO', fileName: `LAUDO_CONFORMIDADE_${selectedPlate}.pdf`, description: 'Vistoria Mecânica, Elétrica e Estrutural Completa com Laudo Fotográfico', issuer: 'Engenharia Mecânica CREA/MG', validUntil: '15/04/2027', status: 'ANEXADO' },
    { id: 'v-3', title: 'LAUDO DE FUMAÇA (OPACIDADE)', category: 'VEICULO', fileName: `LAUDO_OPACIDADE_${selectedPlate}.pdf`, description: 'Análise de Emissões e Fumaça Preta (Escala Ringelmann / Norma Ambiental)', issuer: 'Laboratório Ecológico', validUntil: '20/11/2026', status: 'ANEXADO' },
    { id: 'v-4', title: 'APRECIAÇÃO DE RISCO DO EQUIPAMENTO', category: 'VEICULO', fileName: `APR_EQUIPAMENTO_${selectedPlate}.pdf`, description: 'Análise Preliminar de Risco de Operação do Ônibus / Van', issuer: 'Engenheiro de Segurança', validUntil: '31/12/2026', status: 'ANEXADO' },
    { id: 'v-5', title: 'OS PREVENTIVA EXECUTADA', category: 'VEICULO', fileName: `ORDEM_SERVICO_MANUTENCAO_${selectedPlate}.pdf`, description: 'Última Manutenção Preventiva de Freios, Suspensão e Direção Executada na Base', issuer: 'Oficina Central São Silvestre', validUntil: 'Vigente', status: 'ANEXADO' },
    { id: 'v-6', title: 'PLANO DE MANUTENÇÃO PERIÓDICA', category: 'VEICULO', fileName: `PMP_DETALHADO_${selectedPlate}.pdf`, description: 'PMP Detalhado por Quilometragem e Tempo com Histórico de Lubrificação', issuer: 'Gerência de Manutenção', validUntil: 'Vigente', status: 'ANEXADO' },
    { id: 'v-7', title: 'ART ASSINADA POR ENG. MECÂNICO', category: 'VEICULO', fileName: `ART_CREA_ENG_MECANICO_${selectedPlate}.pdf`, description: 'Anotação de Responsabilidade Técnica (Engenheiro Mecânico - CREA nº 20260948)', issuer: 'CREA-MG', validUntil: '31/12/2026', status: 'ANEXADO' },
    { id: 'v-8', title: 'ATF (AUTORIZAÇÃO ANTT / DER)', category: 'VEICULO', fileName: `ATF_LICENCA_TRAFEGO_${selectedPlate}.pdf`, description: 'Autorização de Tráfego de Fretamento Coletivo de Passageiros', issuer: 'ANTT / DER-MG', validUntil: '10/08/2027', status: 'ANEXADO' }
  ]);

  // Estado dos Documentos do Motorista
  const [driverDocs, setDriverDocs] = useState<DossierDocumentItem[]>([
    { id: 'd-1', title: 'CARTEIRA DE HABILITAÇÃO (CNH)', category: 'MOTORISTA', fileName: `CNH_CAT_D_${currentDriver.name.replace(/\s+/g, '_').toUpperCase()}.pdf`, description: `CNH Categoria ${currentDriver.cnhCat} Vigente com EAR (Exercício de Atividade Remunerada)`, issuer: 'Detran-MG', validUntil: currentDriver.cnhDueDate, status: 'ANEXADO' },
    { id: 'd-2', title: 'CERTIFICADO TRANSPORTE COLETIVO 50H', category: 'MOTORISTA', fileName: `CERTIFICADO_COLETIVO_50H_${currentDriver.name.replace(/\s+/g, '_').toUpperCase()}.pdf`, description: 'Curso de Especialização para Condutores de Veículos de Transporte Coletivo de Passageiros', issuer: 'SEST / SENAT', validUntil: '15/06/2028', status: 'ANEXADO' },
    { id: 'd-3', title: 'CONTRATO DE TRABALHO / ADMISSÃO', category: 'MOTORISTA', fileName: `CONTRATO_TRABALHO_${currentDriver.name.replace(/\s+/g, '_').toUpperCase()}.pdf`, description: 'Contrato Individual de Trabalho registrado e assinado', issuer: 'RH São Silvestre', validUntil: 'Vigente', status: 'ANEXADO' },
    { id: 'd-4', title: 'FICHA DE REGISTRO DO EMPREGADO', category: 'MOTORISTA', fileName: `FICHA_REGISTRO_${currentDriver.name.replace(/\s+/g, '_').toUpperCase()}.pdf`, description: 'Ficha de Registro de Empregado contendo histórico funcional', issuer: 'RH São Silvestre', validUntil: 'Vigente', status: 'ANEXADO' },
    { id: 'd-5', title: 'CADASTRO DIGITAL eSOCIAL / CTPS', category: 'MOTORISTA', fileName: `ESOCIAL_CTPS_${currentDriver.name.replace(/\s+/g, '_').toUpperCase()}.pdf`, description: 'Comprovante de Cadastramento eSocial e Carteira de Trabalho Digital', issuer: 'Ministério do Trabalho', validUntil: 'Vigente', status: 'ANEXADO' },
    { id: 'd-6', title: 'PONTUAÇÃO ATUALIZADA DA CNH', category: 'MOTORISTA', fileName: `CERTIDAO_PONTUACAO_CNH_${currentDriver.name.replace(/\s+/g, '_').toUpperCase()}.pdf`, description: 'Certidão Negativa de Pontuação e Prontuário do Condutor', issuer: 'Detran-MG', validUntil: '30/11/2026', status: 'ANEXADO' },
    { id: 'd-7', title: 'DOCUMENTO RG E CPF', category: 'MOTORISTA', fileName: `RG_CPF_${currentDriver.name.replace(/\s+/g, '_').toUpperCase()}.pdf`, description: 'Cópia autenticada do Documento de Identidade RG e CPF', issuer: 'SSP-MG', validUntil: 'Vitalício', status: 'ANEXADO' }
  ]);

  // Estado dos Documentos de SST & NR-01
  const [sstDocs, setSstDocs] = useState<DossierDocumentItem[]>([
    { id: 's-1', title: 'ATESTADO DE SAÚDE OCUPACIONAL (ASO)', category: 'SST', fileName: `ASO_VIGENTE_${currentDriver.name.replace(/\s+/g, '_').toUpperCase()}.pdf`, description: 'ASO Periódico Apto para Função de Motorista de Ônibus', issuer: 'Clínica Ocupacional São Silvestre', validUntil: '10/05/2027', status: 'ANEXADO' },
    { id: 's-2', title: 'EXAME TOXICOLÓGICO DE LARGA JANELA', category: 'SST', fileName: `EXAME_TOXICOLOGICO_${currentDriver.name.replace(/\s+/g, '_').toUpperCase()}.pdf`, description: 'Laudo Toxicológico de Larga Janela Queratina com Resultado Negativo', issuer: 'Laboratório Credenciado SENATRAN', validUntil: '14/09/2028', status: 'ANEXADO' },
    { id: 's-3', title: 'ORDEM DE SERVIÇO NR-01 (PGR / PCMSO)', category: 'SST', fileName: `ORDEM_SERVICO_NR01_${currentDriver.name.replace(/\s+/g, '_').toUpperCase()}.pdf`, description: 'Ordem de Serviço Integrada de Segurança e Saúde com Ciência Assinada pelo Colaborador', issuer: 'SST São Silvestre', validUntil: '31/12/2026', status: 'ANEXADO' },
    { id: 's-4', title: 'FICHA DE ENTREGA DE EPI (ASSINADA)', category: 'SST', fileName: `FICHA_EPI_${currentDriver.name.replace(/\s+/g, '_').toUpperCase()}.pdf`, description: 'Ficha de Registro e Controle de Entrega de Equipamentos de Proteção Individual', issuer: 'Segurança do Trabalho', validUntil: 'Vigente', status: 'ANEXADO' },
    { id: 's-5', title: 'COMPROVANTE DE VACINAÇÃO ATUALIZADO', category: 'SST', fileName: `CARTAO_VACINA_${currentDriver.name.replace(/\s+/g, '_').toUpperCase()}.pdf`, description: 'Cartão de Vacinação com Doses em Dia (Tétano, Hepatite B, Influenza)', issuer: 'SUS / Ministério da Saúde', validUntil: 'Vigente', status: 'ANEXADO' },
    { id: 's-6', title: 'TERMO ÁLCOOL E DROGAS & REGRAS DE OURO', category: 'SST', fileName: `TERMO_ALCOOL_DROGAS_${currentDriver.name.replace(/\s+/g, '_').toUpperCase()}.pdf`, description: 'Termo de Política de Tolerância Zero para Álcool e Drogas Assinado', issuer: 'Compliance / SST', validUntil: 'Vigente', status: 'ANEXADO' },
    { id: 's-7', title: 'TREINAMENTO RAC 02 (VEÍCULOS LEVES E PESADOS)', category: 'SST', fileName: `CERTIFICADO_RAC02_${currentDriver.name.replace(/\s+/g, '_').toUpperCase()}.pdf`, description: 'Treinamento de Requisito de Atividade Crítica (RAC 02) com Direção Defensiva', issuer: 'Instrutor Técnico Credenciado', validUntil: '18/02/2027', status: 'ANEXADO' }
  ]);

  // Estado dos Documentos da Empresa São Silvestre
  const [companyDocs, setCompanyDocs] = useState<DossierDocumentItem[]>(DEFAULT_COMPANY_DOCS);

  // Modal de Visualização Interna de Documentos
  const [previewDoc, setPreviewDoc] = useState<DossierDocumentItem | null>(null);
  const [uploadTargetId, setUploadTargetId] = useState<{ id: string; category: string } | null>(null);

  // Handler para Upload de Arquivos de Documentos
  const handleUploadClick = (id: string, category: string) => {
    setUploadTargetId({ id, category });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;

    const fileUrl = URL.createObjectURL(file);
    const updater = (prev: DossierDocumentItem[]) => prev.map(doc => {
      if (doc.id === uploadTargetId.id) {
        return {
          ...doc,
          fileName: file.name,
          status: 'ANEXADO' as const,
          customFile: file,
          fileBlobUrl: fileUrl
        };
      }
      return doc;
    });

    if (uploadTargetId.category === 'VEICULO') setVehicleDocs(updater);
    if (uploadTargetId.category === 'MOTORISTA') setDriverDocs(updater);
    if (uploadTargetId.category === 'SST') setSstDocs(updater);
    if (uploadTargetId.category === 'EMPRESA') setCompanyDocs(updater);

    toast({
      title: 'Arquivo Anexado!',
      description: `O arquivo ${file.name} foi associado com sucesso a este item do dossiê.`,
    });
    setUploadTargetId(null);
  };

  // Função para Abrir/Visualizar o Documento
  const handleViewDocument = (doc: DossierDocumentItem) => {
    setPreviewDoc(doc);
  };

  // Função para Baixar o Documento
  const handleDownloadDocument = (doc: DossierDocumentItem) => {
    if (doc.fileBlobUrl) {
      const a = document.createElement('a');
      a.href = doc.fileBlobUrl;
      a.download = doc.fileName;
      a.click();
      return;
    }

    // Se for arquivo simulado, cria um Blob TXT/HTML representativo com a marca d'água oficial da São Silvestre
    const simulatedContent = `================================================================================
VIAÇÃO SÃO SILVESTRE LTDA. - DEPARTAMENTO DE MOBILIZAÇÃO E SST
================================================================================
DOCUMENTO OFICIAL INTEGRANTE DO DOSSIÊ DE MOBILIZAÇÃO

TÍTULO DO DOCUMENTO: ${doc.title}
NOME DO ARQUIVO: ${doc.fileName}
CATEGORIA: ${doc.category}
EMISSOR / ÓRGÃO: ${doc.issuer}
VALIDADE / SITUAÇÃO: ${doc.validUntil}
CLIENTE DESTINATÁRIO: ${activeClientInfo.clientName} (${activeClientInfo.workPost})
CONTRATO: ${activeClientInfo.contract}

VEÍCULO ASSOCIADO: ${currentVehicle.plate} (${currentVehicle.brand} ${currentVehicle.model})
CHASSI: ${currentVehicle.chassis}

MOTORISTA ASSOCIADO: ${currentDriver.name}
CPF: ${currentDriver.cpf} | CNH: ${currentDriver.cnh} (Cat. ${currentDriver.cnhCat})

DESCRIÇÃO TÉCNICA:
${doc.description}

STATUS DE AUDITORIA:
[X] DOCUMENTO AUDITADO E CONFORME COM EXIGÊNCIAS CONTRATUAIS DO CLIENTE ${activeClientInfo.clientName.toUpperCase()}
[X] CHAVE DE AUTENTICIDADE DIGITAL: VSS-MOB-${Math.random().toString(36).substring(2, 10).toUpperCase()}-2026

Emitido em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}
================================================================================`;

    const blob = new Blob([simulatedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Download Concluído',
      description: `Arquivo ${doc.fileName} baixado com sucesso.`
    });
  };

  // Handler de Exportação do PDF Completo para o Cliente
  const handleExportPdf = async () => {
    setDownloadingPdf(true);
    try {
      const payload: MobilizationDossierData = {
        id: mobilization?.id || `mob-${Date.now()}`,
        vehiclePlate: currentVehicle.plate,
        vehicleModel: currentVehicle.model,
        vehicleBrand: currentVehicle.brand,
        chassisNumber: currentVehicle.chassis,
        driverName: currentDriver.name,
        driverCpf: currentDriver.cpf,
        driverCnh: currentDriver.cnh,
        cnhCategory: currentDriver.cnhCat,
        cnhDueDate: currentDriver.cnhDueDate,
        clientName: activeClientInfo.clientName,
        workPostName: activeClientInfo.workPost,
        occurredAt: mobilization?.occurredAt || new Date().toISOString(),
        kmReading: mobilization?.kmReading || 148520,
        crlv2026: true,
        laudoConformidade: true,
        laudoFumaca: true,
        osPreventiva: true,
        planoManutencao: true,
        artEngenheiroMecanico: true,
        atfAnttDer: true,
        apreciacaoRisco: true,
        fichaRegistro: true,
        contratoTrabalho: true,
        fichaESocial: true,
        rgDocument: true,
        ctpsDocument: true,
        asoVigente: true,
        exameToxicologico: true,
        cartaoVacina: true,
        ordemServicoSstNr01: true,
        fichaEpi: true,
        termoAlcoolDroga: true,
        regraDeOuro: true,
        treinamentoAmbiental: true,
        treinamentoRac02: true,
        certificadoColetivo50h: true,
        certificadoColetivo16h: true,
        treinamentoPrimeirosSocorros: true
      };

      await generateMobilizationDossierPDF(payload);
      toast({
        title: 'Dossiê Completo Exportado!',
        description: `Dossiê de Mobilização para ${activeClientInfo.clientName} baixado com sucesso.`
      });
    } catch (e) {
      console.error('Erro ao gerar PDF do Dossiê:', e);
      toast({
        title: 'Erro no Download',
        description: 'Não foi possível gerar o PDF do dossiê.',
        variant: 'destructive'
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-zinc-950/95 backdrop-blur-md border border-zinc-800 shadow-2xl text-zinc-100 rounded-2xl p-4 sm:p-6">
        
        {/* Elemento Oculto de Upload de Arquivos */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" 
        />

        {/* Cabeçalho do Modal com Seleção por Cliente */}
        <DialogHeader className="pb-3 border-b border-zinc-800 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <FolderCheck size={22} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                  Dossiê Completo de Mobilização
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Auditado & Pronto p/ Envio
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                  Organização por Cliente com documentação de Veículos, Motoristas, SST e Viação São Silvestre Ltda.
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleExportPdf}
              disabled={downloadingPdf}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/20 rounded-xl h-9 px-4 text-xs shrink-0 flex items-center gap-1.5"
            >
              {downloadingPdf ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-zinc-950"></div>
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download size={14} />
                  Gerar Dossiê Master (PDF Cliente)
                </>
              )}
            </Button>
          </div>

          {/* Barra de Seleção de Cliente, Veículo e Motorista (Controle por Cliente) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl text-xs">
            {/* 1. SELETOR DE CLIENTE */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Building size={12} /> Cliente Destinatário:
              </label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="bg-zinc-950 border-zinc-700 h-8 text-xs font-semibold text-zinc-100">
                  <SelectValue placeholder="Selecione o Cliente" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  <SelectItem value="c1">Vale S.A. (Mina de Brucutu)</SelectItem>
                  <SelectItem value="c2">Aperam South America (Usina Timóteo)</SelectItem>
                  <SelectItem value="c3">CSN Mineração (Casa de Pedra)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 2. SELETOR DE VEÍCULO DO CLIENTE */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Truck size={12} /> Veículo Mobilizado:
              </label>
              <Select value={selectedPlate} onValueChange={setSelectedPlate}>
                <SelectTrigger className="bg-zinc-950 border-zinc-700 h-8 text-xs font-semibold text-zinc-100">
                  <SelectValue placeholder="Selecione o Veículo" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  {activeClientInfo.vehicles.map(v => (
                    <SelectItem key={v.plate} value={v.plate}>
                      {v.plate} - {v.brand} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. SELETOR DE MOTORISTA DO CLIENTE */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <User size={12} /> Motorista Escalado:
              </label>
              <Select value={selectedDriverName} onValueChange={setSelectedDriverName}>
                <SelectTrigger className="bg-zinc-950 border-zinc-700 h-8 text-xs font-semibold text-zinc-100">
                  <SelectValue placeholder="Selecione o Motorista" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  {activeClientInfo.drivers.map(d => (
                    <SelectItem key={d.name} value={d.name}>
                      {d.name} (CNH {d.cnhCat})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        {/* Abas das Pastas do Dossiê */}
        <Tabs defaultValue="veiculo" className="space-y-4 pt-2">
          <TabsList className="bg-zinc-950 border border-zinc-800 p-1 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-1">
            <TabsTrigger value="veiculo" className="text-xs font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 rounded-lg">
              🚍 Veículo & Laudos
            </TabsTrigger>
            <TabsTrigger value="motorista" className="text-xs font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 rounded-lg">
              👨‍✈️ Motorista (Documentos)
            </TabsTrigger>
            <TabsTrigger value="sst" className="text-xs font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 rounded-lg">
              🛡️ SST & NR-01 (Riscos)
            </TabsTrigger>
            <TabsTrigger value="empresa" className="text-xs font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-zinc-950 rounded-lg">
              🏢 Empresa (São Silvestre)
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: VEÍCULO & LAUDOS TÉCNICOS */}
          <TabsContent value="veiculo" className="space-y-4">
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Truck size={15} /> Documentos do Veículo [{currentVehicle.plate}] - {currentVehicle.brand} {currentVehicle.model}
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                  8 de 8 Arquivos Anexados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {vehicleDocs.map((doc) => (
                  <div key={doc.id} className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl hover:border-amber-500/40 transition-all flex flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-zinc-100 flex items-center gap-1.5 text-xs">
                          <FileText size={14} className="text-amber-400 shrink-0" />
                          <span className="truncate">{doc.title}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">{doc.fileName}</div>
                        <div className="text-[10px] text-zinc-500 mt-1 line-clamp-1">{doc.description}</div>
                      </div>
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={11} /> Anexado
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px]">
                      <span className="text-zinc-500">Validade: <strong className="text-zinc-300">{doc.validUntil}</strong></span>
                      <div className="flex items-center gap-1.5">
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewDocument(doc)}
                          className="h-7 px-2 text-[10px] bg-zinc-950 border-zinc-700 text-zinc-300 hover:text-amber-400 hover:border-amber-500/50 rounded-lg flex items-center gap-1"
                        >
                          <Eye size={12} /> Visualizar
                        </Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDownloadDocument(doc)}
                          className="h-7 px-2 text-[10px] bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 rounded-lg flex items-center gap-1"
                        >
                          <Download size={12} /> Baixar
                        </Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleUploadClick(doc.id, 'VEICULO')}
                          className="h-7 px-2 text-[10px] bg-zinc-950 border-zinc-700 text-amber-400 hover:bg-amber-500/10 rounded-lg flex items-center gap-1"
                          title="Anexar ou substituir arquivo"
                        >
                          <Upload size={12} /> Anexar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Galeria de Fotos e Vídeos do Veículo */}
              <div className="pt-3 border-t border-zinc-800">
                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Camera size={14} className="text-amber-400" /> Galeria de Fotos e Inspeção Visual do Veículo ({currentVehicle.plate})
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="aspect-video bg-zinc-900 border border-zinc-700/80 rounded-xl flex flex-col items-center justify-center p-2 text-center text-[10px] text-zinc-300 hover:border-amber-500/50 cursor-pointer group">
                    <ImageIcon size={22} className="text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-zinc-100">Foto Frontal com Placa</span>
                    <span className="text-[9px] text-emerald-400 font-semibold mt-0.5">🟢 Aprovado</span>
                  </div>
                  <div className="aspect-video bg-zinc-900 border border-zinc-700/80 rounded-xl flex flex-col items-center justify-center p-2 text-center text-[10px] text-zinc-300 hover:border-amber-500/50 cursor-pointer group">
                    <ImageIcon size={22} className="text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-zinc-100">Lateral Direita & Janelas</span>
                    <span className="text-[9px] text-emerald-400 font-semibold mt-0.5">🟢 Trava 15cm OK</span>
                  </div>
                  <div className="aspect-video bg-zinc-900 border border-zinc-700/80 rounded-xl flex flex-col items-center justify-center p-2 text-center text-[10px] text-zinc-300 hover:border-amber-500/50 cursor-pointer group">
                    <ImageIcon size={22} className="text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-zinc-100">Salão Interno & Cintos</span>
                    <span className="text-[9px] text-emerald-400 font-semibold mt-0.5">🟢 100% Cintos OK</span>
                  </div>
                  <div className="aspect-video bg-zinc-900 border border-zinc-700/80 rounded-xl flex flex-col items-center justify-center p-2 text-center text-[10px] text-zinc-300 hover:border-amber-500/50 cursor-pointer group">
                    <ImageIcon size={22} className="text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-zinc-100">Banda de Pneus & Estepe</span>
                    <span className="text-[9px] text-emerald-400 font-semibold mt-0.5">🟢 Sulco Bom</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: MOTORISTA E PASTAS COMPLETA DE DOCUMENTOS */}
          <TabsContent value="motorista" className="space-y-4">
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck size={15} /> Pasta Completa do Colaborador: {currentDriver.name}
                </span>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
                  CPF: {currentDriver.cpf} | CNH Cat. {currentDriver.cnhCat}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {driverDocs.map((doc) => (
                  <div key={doc.id} className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl hover:border-amber-500/40 transition-all flex flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-zinc-100 flex items-center gap-1.5 text-xs">
                          <FileText size={14} className="text-blue-400 shrink-0" />
                          <span className="truncate">{doc.title}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">{doc.fileName}</div>
                        <div className="text-[10px] text-zinc-500 mt-1 line-clamp-1">{doc.description}</div>
                      </div>
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={11} /> OK
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px]">
                      <span className="text-zinc-500">Validade: <strong className="text-zinc-300">{doc.validUntil}</strong></span>
                      <div className="flex items-center gap-1.5">
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewDocument(doc)}
                          className="h-7 px-2 text-[10px] bg-zinc-950 border-zinc-700 text-zinc-300 hover:text-amber-400 hover:border-amber-500/50 rounded-lg flex items-center gap-1"
                        >
                          <Eye size={12} /> Visualizar
                        </Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDownloadDocument(doc)}
                          className="h-7 px-2 text-[10px] bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 rounded-lg flex items-center gap-1"
                        >
                          <Download size={12} /> Baixar
                        </Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleUploadClick(doc.id, 'MOTORISTA')}
                          className="h-7 px-2 text-[10px] bg-zinc-950 border-zinc-700 text-amber-400 hover:bg-amber-500/10 rounded-lg flex items-center gap-1"
                        >
                          <Upload size={12} /> Anexar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: SST & ORDEM DE SERVIÇO NR-01 */}
          <TabsContent value="sst" className="space-y-4">
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={15} /> Documentos de SST & Ordem de Serviço NR-01 ({currentDriver.name})
                </span>
                <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30 font-semibold">
                  PGR & PCMSO Vigentes
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {sstDocs.map((doc) => (
                  <div key={doc.id} className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl hover:border-amber-500/40 transition-all flex flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-zinc-100 flex items-center gap-1.5 text-xs">
                          <Shield size={14} className="text-purple-400 shrink-0" />
                          <span className="truncate">{doc.title}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">{doc.fileName}</div>
                        <div className="text-[10px] text-zinc-500 mt-1 line-clamp-1">{doc.description}</div>
                      </div>
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={11} /> Conforme
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px]">
                      <span className="text-zinc-500">Validade: <strong className="text-zinc-300">{doc.validUntil}</strong></span>
                      <div className="flex items-center gap-1.5">
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewDocument(doc)}
                          className="h-7 px-2 text-[10px] bg-zinc-950 border-zinc-700 text-zinc-300 hover:text-amber-400 hover:border-amber-500/50 rounded-lg flex items-center gap-1"
                        >
                          <Eye size={12} /> Visualizar
                        </Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDownloadDocument(doc)}
                          className="h-7 px-2 text-[10px] bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 rounded-lg flex items-center gap-1"
                        >
                          <Download size={12} /> Baixar
                        </Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleUploadClick(doc.id, 'SST')}
                          className="h-7 px-2 text-[10px] bg-zinc-950 border-zinc-700 text-amber-400 hover:bg-amber-500/10 rounded-lg flex items-center gap-1"
                        >
                          <Upload size={12} /> Anexar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Matriz Sintética da Ordem de Serviço NR-01 */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2 text-xs">
                <div className="font-bold text-amber-400 uppercase text-[11px] flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Espelho Sintético da Ordem de Serviço NR-01 (Motorista)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    <div className="font-bold text-amber-300 mb-1">Riscos Físicos & Ergonômicos</div>
                    <div className="text-zinc-400 text-[10px]">Vibração de corpo inteiro, postura sentada prolongada e esforço repetitivo de condução.</div>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    <div className="font-bold text-emerald-300 mb-1">Medidas de Proteção Coletiva</div>
                    <div className="text-zinc-400 text-[10px]">Cintos de 3 pontos em 100% dos assentos, trava de segurança 15cm nas janelas e limitação de velocidade.</div>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    <div className="font-bold text-blue-300 mb-1">Equipamentos Individuais (EPI)</div>
                    <div className="text-zinc-400 text-[10px]">Calçado de segurança com biqueira, colete refletivo com faixas de alta visibilidade e protetor auricular.</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: DOCUMENTAÇÃO INSTITUCIONAL DA VIAÇÃO SÃO SILVESTRE LTDA. */}
          <TabsContent value="empresa" className="space-y-4">
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-amber-400" />
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                      Documentação Institucional da Empresa (Viação São Silvestre Ltda.)
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">CNPJ: 71.055.644/0001-25 • Inscrição Estadual: 062.918.410-0012</span>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-semibold">
                  Regularidade Fiscal 100%
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {companyDocs.map((doc) => (
                  <div key={doc.id} className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl hover:border-amber-500/40 transition-all flex flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-zinc-100 flex items-center gap-1.5 text-xs">
                          <Building2 size={14} className="text-amber-400 shrink-0" />
                          <span className="truncate">{doc.title}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">{doc.fileName}</div>
                        <div className="text-[10px] text-zinc-500 mt-1 line-clamp-1">{doc.description}</div>
                      </div>
                      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={11} /> Vigente
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px]">
                      <span className="text-zinc-500">Emissor: <strong className="text-zinc-300">{doc.issuer}</strong></span>
                      <div className="flex items-center gap-1.5">
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewDocument(doc)}
                          className="h-7 px-2 text-[10px] bg-zinc-950 border-zinc-700 text-zinc-300 hover:text-amber-400 hover:border-amber-500/50 rounded-lg flex items-center gap-1"
                        >
                          <Eye size={12} /> Visualizar
                        </Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDownloadDocument(doc)}
                          className="h-7 px-2 text-[10px] bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 rounded-lg flex items-center gap-1"
                        >
                          <Download size={12} /> Baixar
                        </Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleUploadClick(doc.id, 'EMPRESA')}
                          className="h-7 px-2 text-[10px] bg-zinc-950 border-zinc-700 text-amber-400 hover:bg-amber-500/10 rounded-lg flex items-center gap-1"
                        >
                          <Upload size={12} /> Anexar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal Secundário de Visualização do Documento (In-App Viewer) */}
        {previewDoc && (
          <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
            <DialogContent className="max-w-2xl bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-2xl p-6 shadow-2xl">
              <DialogHeader className="border-b border-zinc-800 pb-3">
                <DialogTitle className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  <FileText size={20} /> {previewDoc.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 font-mono">
                  {previewDoc.fileName} • {previewDoc.issuer}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex justify-between items-center text-zinc-400 border-b border-zinc-800 pb-2">
                    <span>Categoria: <strong className="text-zinc-200">{previewDoc.category}</strong></span>
                    <span>Validade: <strong className="text-emerald-400">{previewDoc.validUntil}</strong></span>
                  </div>
                  <div className="text-zinc-300 pt-1">
                    <strong className="text-zinc-100 block mb-0.5">Descrição / Finalidade:</strong>
                    {previewDoc.description}
                  </div>
                  <div className="text-zinc-400 pt-1 text-[11px]">
                    <span>Cliente Ativo: <strong className="text-blue-400">{activeClientInfo.clientName} ({activeClientInfo.workPost})</strong></span>
                  </div>
                </div>

                {/* Exibição se for imagem/blob carregado pelo usuário */}
                {previewDoc.fileBlobUrl ? (
                  <div className="border border-zinc-800 rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[250px]">
                    <iframe src={previewDoc.fileBlobUrl} className="w-full h-[350px]" title={previewDoc.title} />
                  </div>
                ) : (
                  <div className="bg-zinc-900/60 border border-dashed border-amber-500/40 rounded-xl p-6 text-center space-y-3">
                    <FileCheck size={40} className="mx-auto text-amber-400 animate-pulse" />
                    <div>
                      <h4 className="font-bold text-zinc-100 text-sm">Documento Verificado e Válido</h4>
                      <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                        Este documento foi auditado pelo sistema de mobilização da Viação São Silvestre Ltda. e atende a todos os requisitos da {activeClientInfo.clientName}.
                      </p>
                    </div>
                    <div className="pt-2 flex justify-center gap-2">
                      <Button 
                        type="button" 
                        onClick={() => handleDownloadDocument(previewDoc)}
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs h-8 px-4 rounded-lg flex items-center gap-1.5"
                      >
                        <Download size={14} /> Baixar Arquivo em Disco
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MobilizationDossierModal;

