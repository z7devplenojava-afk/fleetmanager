import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, Truck, UserCheck, ShieldCheck, Download, Sparkles, CheckCircle2, 
  FolderCheck, HardHat, HeartPulse, Award, Building2, Image as ImageIcon, Camera,
  Link2, Check, AlertCircle, Eye, FileSpreadsheet, Lock
} from 'lucide-react';
import { generateMobilizationDossierPDF, MobilizationDossierData } from '@/utils/mobilizationDossierPdfGenerator';
import type { TransportMobilization } from '@/types/mobilization';

interface MobilizationDossierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobilization?: TransportMobilization | null;
}

export const MobilizationDossierModal: React.FC<MobilizationDossierModalProps> = ({
  open,
  onOpenChange,
  mobilization
}) => {
  const { toast } = useToast();
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Estados dos documentos do Veículo
  const [crlvOk, setCrlvOk] = useState(true);
  const [laudoConformidadeOk, setLaudoConformidadeOk] = useState(true);
  const [laudoFumacaOk, setLaudoFumacaOk] = useState(true);
  const [osPreventivaOk, setOsPreventivaOk] = useState(true);
  const [planoManutencaoOk, setPlanoManutencaoOk] = useState(true);
  const [artEngMecanicoOk, setArtEngMecanicoOk] = useState(true);
  const [atfOk, setAtfOk] = useState(true);
  const [apreciacaoRiscoOk, setApreciacaoRiscoOk] = useState(true);

  // Estados dos documentos do Funcionário (Pastas das Imagens)
  const [fichaRegistroOk, setFichaRegistroOk] = useState(true);
  const [contratoExpOk, setContratoExpOk] = useState(true);
  const [fichaESocialOk, setFichaESocialOk] = useState(true);
  const [rgOk, setRgOk] = useState(true);
  const [cnhOk, setCnhOk] = useState(true);
  const [ctpsOk, setCtpsOk] = useState(true);
  const [fotoOk, setFotoOk] = useState(true);

  // Saúde & SST
  const [asoOk, setAsoOk] = useState(true);
  const [toxicoOk, setToxicoOk] = useState(true);
  const [vacinaOk, setVacinaOk] = useState(true);
  const [ordemServicoSstOk, setOrdemServicoSstOk] = useState(true);
  const [fichaEpiOk, setFichaEpiOk] = useState(true);
  const [termoAlcoolOk, setTermoAlcoolOk] = useState(true);
  const [regraOuroOk, setRegraOuroOk] = useState(true);

  // Treinamentos
  const [treinAmbientalOk, setTreinAmbientalOk] = useState(true);
  const [treinRac02Ok, setTreinRac02Ok] = useState(true);
  const [coletivo50hOk, setColetivo50hOk] = useState(true);
  const [coletivo16hOk, setColetivo16hOk] = useState(true);
  const [primeirosSocorrosOk, setPrimeirosSocorrosOk] = useState(true);

  const vehiclePlate = mobilization?.vehiclePlate || 'OPP0A67';
  const driverName = mobilization?.driverName || 'Jean Carlos de Souza';
  const clientName = mobilization?.clientName || 'Vale S.A.';
  const workPostName = mobilization?.workPostName || 'Mina de Brucutu';

  const handleExportPdf = async () => {
    setDownloadingPdf(true);
    try {
      const payload: MobilizationDossierData = {
        id: mobilization?.id,
        vehiclePlate,
        vehicleModel: 'Induscar Apache U',
        vehicleBrand: 'Mercedes-Benz',
        chassisNumber: '9BM384078EB938022',
        driverName,
        driverCpf: '109.845.237-00',
        driverCnh: '04891238910',
        cnhCategory: 'D',
        cnhDueDate: '14/09/2028',
        clientName,
        workPostName,
        occurredAt: mobilization?.occurredAt || new Date().toISOString(),
        kmReading: mobilization?.kmReading || 148520,
        crlv2026: crlvOk,
        laudoConformidade: laudoConformidadeOk,
        laudoFumaca: laudoFumacaOk,
        osPreventiva: osPreventivaOk,
        planoManutencao: planoManutencaoOk,
        artEngenheiroMecanico: artEngMecanicoOk,
        atfAnttDer: atfOk,
        apreciacaoRisco: apreciacaoRiscoOk,
        fichaRegistro: fichaRegistroOk,
        contratoTrabalho: contratoExpOk,
        fichaESocial: fichaESocialOk,
        rgDocument: rgOk,
        ctpsDocument: ctpsOk,
        asoVigente: asoOk,
        exameToxicologico: toxicoOk,
        cartaoVacina: vacinaOk,
        ordemServicoSstNr01: ordemServicoSstOk,
        fichaEpi: fichaEpiOk,
        termoAlcoolDroga: termoAlcoolOk,
        regraDeOuro: regraOuroOk,
        treinamentoAmbiental: treinAmbientalOk,
        treinamentoRac02: treinRac02Ok,
        certificadoColetivo50h: coletivo50hOk,
        certificadoColetivo16h: coletivo16hOk,
        treinamentoPrimeirosSocorros: primeirosSocorrosOk
      };

      await generateMobilizationDossierPDF(payload);
      toast({
        title: 'Dossiê Exportado!',
        description: `Dossiê de Mobilização para ${clientName} baixado com sucesso.`
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
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 shadow-2xl text-zinc-100 rounded-2xl p-5 sm:p-7">
        
        {/* Cabeçalho do Modal */}
        <DialogHeader className="pb-3 border-b border-zinc-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
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
                  Veículo <span className="font-mono text-amber-400 font-bold">[{vehiclePlate}]</span> • Motorista: <span className="text-zinc-200 font-bold">{driverName}</span> • Cliente: <span className="text-blue-400 font-bold">{clientName}</span>
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
                  Gerar Dossiê em PDF (Cliente)
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* Abas Organizadas por Pastas */}
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
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck size={14} /> Documentação Exigida do Veículo ({vehiclePlate})
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  7 de 7 Documentos Anexados
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {[
                  { title: 'CRLV DO VEÍCULO 2026', desc: 'Licenciamento e Certificado Vigente (Detran-MG)', status: crlvOk, setter: setCrlvOk },
                  { title: 'LAUDO DE CONFORMIDADE TÉCNICA', desc: 'Vistoria Mecânica e Estrutural Completa com Fotos', status: laudoConformidadeOk, setter: setLaudoConformidadeOk },
                  { title: 'LAUDO DE FUMAÇA (OPACIDADE)', desc: 'Análise de Emissões e Fumaça Preta (Norma Ambiental)', status: laudoFumacaOk, setter: setLaudoFumacaOk },
                  { title: 'APRECIAÇÃO DE RISCO DO EQUIPAMENTO', desc: 'APR Técnica de Operação do Ônibus / Van', status: apreciacaoRiscoOk, setter: setApreciacaoRiscoOk },
                  { title: 'OS PREVENTIVA EXECUTADA', desc: 'Última Manutenção Preventiva Executada na Base', status: osPreventivaOk, setter: setOsPreventivaOk },
                  { title: 'PLANO DE MANUTENÇÃO PERIÓDICA', desc: 'PMP Detalhado por Quilometragem / Tempo', status: planoManutencaoOk, setter: setPlanoManutencaoOk },
                  { title: 'ART ASSINADA POR ENG. MECÂNICO', desc: 'Anotação de Resp. Técnica (Engenheiro Mecânico - CREA)', status: artEngMecanicoOk, setter: setArtEngMecanicoOk },
                  { title: 'ATF (AUTORIZAÇÃO ANTT / DER)', desc: 'Licença de Tráfego e Fretamento Coletivo', status: atfOk, setter: setAtfOk },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                        <FileText size={13} className="text-amber-400 shrink-0" />
                        <span className="truncate">{doc.title}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">{doc.desc}</div>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Anexado
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Galeria de Fotos e Vídeos do Veículo */}
              <div className="pt-2 border-t border-zinc-800">
                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Camera size={13} className="text-amber-400" /> Galeria de Fotos e Inspeção Visual do Veículo
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="aspect-video bg-zinc-900 border border-zinc-700/80 rounded-lg flex flex-col items-center justify-center p-2 text-center text-[10px] text-zinc-400 hover:border-amber-500/50 cursor-pointer">
                    <ImageIcon size={20} className="text-amber-400 mb-1" />
                    <span>Foto Frontal com Placa</span>
                    <span className="text-[9px] text-emerald-400">🟢 Aprovado</span>
                  </div>
                  <div className="aspect-video bg-zinc-900 border border-zinc-700/80 rounded-lg flex flex-col items-center justify-center p-2 text-center text-[10px] text-zinc-400 hover:border-amber-500/50 cursor-pointer">
                    <ImageIcon size={20} className="text-amber-400 mb-1" />
                    <span>Lateral Direita & Janelas</span>
                    <span className="text-[9px] text-emerald-400">🟢 Trava 15cm OK</span>
                  </div>
                  <div className="aspect-video bg-zinc-900 border border-zinc-700/80 rounded-lg flex flex-col items-center justify-center p-2 text-center text-[10px] text-zinc-400 hover:border-amber-500/50 cursor-pointer">
                    <ImageIcon size={20} className="text-amber-400 mb-1" />
                    <span>Salão Interno & Cintos</span>
                    <span className="text-[9px] text-emerald-400">🟢 100% Cintos OK</span>
                  </div>
                  <div className="aspect-video bg-zinc-900 border border-zinc-700/80 rounded-lg flex flex-col items-center justify-center p-2 text-center text-[10px] text-zinc-400 hover:border-amber-500/50 cursor-pointer">
                    <ImageIcon size={20} className="text-amber-400 mb-1" />
                    <span>Banda de Pneus & Estepe</span>
                    <span className="text-[9px] text-emerald-400">🟢 Sulco Bom</span>
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
                  <UserCheck size={14} /> Pasta Completa do Colaborador: {driverName}
                </span>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  Organizado por Pastas de Auditoria
                </span>
              </div>

              {/* PASTA 1: DADOS PESSOAIS & REGISTRO */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  📁 1. DADOS PESSOAIS, REGISTRO & CNH (Vide Imagens Anexas)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {[
                    { name: 'CERTIFICADO DE COLETIVO.pdf', desc: 'Curso de Transp. Coletivo 50h/16h' },
                    { name: 'CNH.pdf', desc: 'Carteira de Habilitação Cat. D/E Vigente' },
                    { name: 'CONTRATO DE EXPERIENCIA.pdf', desc: 'Contrato de Trabalho / Admissão' },
                    { name: 'CTPS.pdf', desc: 'Carteira de Trabalho Digital / eSocial' },
                    { name: 'FICHA DE REGISTRO.pdf', desc: 'Ficha de Registro do Empregado' },
                    { name: 'FOTO.jpeg', desc: 'Foto 3x4 do Colaborador' },
                    { name: 'PONTUACAO CNH - JEAN CARLOS.pdf', desc: 'Consulta de Pontuação Atualizada' },
                    { name: 'RG.pdf', desc: 'Documento de Identidade RG / CPF' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-zinc-200 truncate">{f.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate">{f.desc}</div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0">
                        PDF/Img OK
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* PASTA 2: SAÚDE OCUPACIONAL & ASO */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  📁 2. SAÚDE OCUPACIONAL & EXAMES (ASO / RAC)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {[
                    { name: 'ASO.pdf', desc: 'Atestado de Saúde Ocupacional Admissional/Periódico' },
                    { name: 'EXAME TOXICOLOGICO.pdf', desc: 'Laudo Toxicológico de Larga Janela Aprovado' },
                    { name: 'FORMULARIO RAC.pdf', desc: 'Formulário de Requisitos de Atividades Críticas' },
                    { name: 'CARTAO DE VACINA.pdf', desc: 'Comprovante de Vacinação Atualizado' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-zinc-200 truncate">{f.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate">{f.desc}</div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0">
                        Vigente
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* PASTA 3: SEGURANÇA DO TRABALHO & TREINAMENTOS */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  📁 3. SEGURANÇA DO TRABALHO & TREINAMENTOS (SST / NR-01)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {[
                    { name: 'ORDEM DE SERVIÇO.pdf', desc: 'Ordem de Serviço NR-01 (PGR / PCMSO)' },
                    { name: 'REGRA DE OURO.pdf', desc: 'Ciência das Regras de Ouro de Segurança' },
                    { name: 'TERMO ALCOOL E DROGA.pdf', desc: 'Termo de Compromisso Álcool e Drogas' },
                    { name: 'TREINAMENTO AMBIENTAL.pdf', desc: 'Integração Ambiental & Segurança' },
                    { name: 'TREINAMENTO NR.pdf', desc: 'Normas Regulamentadoras Aplicáveis' },
                    { name: 'TREINAMENTO RAC 02.pdf', desc: 'Veículos Leves / Pesados & Direção Defensiva' },
                    { name: 'TREINAMENTOS PRIMEIROS SOCORROS.pdf', desc: 'Atendimento Emergencial' },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-zinc-200 truncate">{f.name}</div>
                        <div className="text-[10px] text-zinc-400 truncate">{f.desc}</div>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0">
                        Concluído
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: SST & ORDEM DE SERVIÇO NR-01 */}
          <TabsContent value="sst" className="space-y-4">
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Espelho da Ordem de Serviço de SST (NR-01 - PGR / PCMSO)
                </span>
                <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                  Função: Motorista de Ônibus
                </span>
              </div>

              {/* Layout da Imagem 5 (Ordem de Serviço) */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row justify-between gap-2 border-b border-zinc-800 pb-2">
                  <div>
                    <div className="font-bold text-zinc-100 text-sm">Colaborador: {driverName}</div>
                    <div className="text-zinc-400">Função: Motorista de Ônibus • Admissão: 15/04/2024</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-400">Ref: PGR / PCMSO</div>
                    <div className="text-[11px] text-zinc-400">NR 01 - Disposições Gerais</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-bold text-amber-300 text-[11px] uppercase">Riscos da Atividade:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                      <div className="font-semibold text-zinc-300">Físicos</div>
                      <div className="text-zinc-400 text-[10px]">Ruído contínuo / vibração de corpo inteiro</div>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                      <div className="font-semibold text-zinc-300">Químicos / Biol.</div>
                      <div className="text-zinc-400 text-[10px]">Não Aplicável</div>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                      <div className="font-semibold text-zinc-300">Ergonômicos</div>
                      <div className="text-zinc-400 text-[10px]">Postura sentado por longos períodos</div>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                      <div className="font-semibold text-zinc-300">Acidentes</div>
                      <div className="text-zinc-400 text-[10px]">Estresse, queda de nível e acidentes de trânsito</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-zinc-800">
                  <div className="font-bold text-emerald-400 text-[11px] uppercase">Medidas Preventivas & Controle:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                      <div className="font-semibold text-emerald-300">Controle Coletivo</div>
                      <div className="text-zinc-400 text-[10px]">Uso obrigatório de cinto de segurança por todos os ocupantes.</div>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                      <div className="font-semibold text-emerald-300">Controle Administrativo</div>
                      <div className="text-zinc-400 text-[10px]">Exames médicos PCMSO, plano de fadiga, pausas periódicas e Direção Defensiva.</div>
                    </div>
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                      <div className="font-semibold text-emerald-300">Controle Individual (EPI)</div>
                      <div className="text-zinc-400 text-[10px]">Calçado de segurança, colete refletivo e itens registrados na Ficha de EPI.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: DOCUMENTAÇÃO DA EMPRESA */}
          <TabsContent value="empresa" className="space-y-4">
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={14} /> Documentação Institucional da Empresa (Viação São Silvestre Ltda.)
                </span>
                <span className="text-[10px] text-zinc-400">CNPJ: 71.055.644/0001-25</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { title: 'CARTÃO CNPJ DA EMPRESA.pdf', desc: 'Comprovante de Inscrição e Situação Cadastral Ativa' },
                  { title: 'LICENÇA OPERACIONAL ANTT / DER.pdf', desc: 'Registro Nacional de Transportadores Rodoviários' },
                  { title: 'APÓLICE DE SEGURO RESP. CIVIL.pdf', desc: 'Ezze Seguros S/A • Apólice nº 1062800034517' },
                  { title: 'CERTIDÃO NEGATIVA FEDERAL & FGTS.pdf', desc: 'Certidão Conjunta de Débitos Tributários Vigente' },
                  { title: 'PROGRAMA DE GERENCIAMENTO DE RISCOS (PGR).pdf', desc: 'PGR Institucional Vigente 2026' },
                  { title: 'PCMSO DA EMPRESA.pdf', desc: 'Programa de Controle Médico de Saúde Ocupacional' },
                ].map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                        <FileText size={13} className="text-amber-400 shrink-0" />
                        <span className="truncate">{doc.title}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate">{doc.desc}</div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0">
                      Regular
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MobilizationDossierModal;
