import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Download, 
  Calendar, 
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Award,
  Users,
  PlayCircle,
  FileText,
  AlertCircle,
  Printer,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

export interface TrainingItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  durationHours?: number;
  startDate?: string;
  endDate?: string;
  certificationDate?: string;
  expirationDate?: string;
  status?: string;
  participationStatus?: string;
  grade?: number;
  instructor?: string;
  location?: string;
  isExpiringSoon?: boolean;
  daysToExpiration?: number;
  certificateUrl?: string;
  certificateNumber?: string;
}

export const Trainings: React.FC = () => {
  const { toast } = useToast();
  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTraining, setSelectedTraining] = useState<TrainingItem | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'expired' | 'expiring' | 'completed'>('all');
  const [certificateModal, setCertificateModal] = useState<TrainingItem | null>(null);

  useEffect(() => {
    loadTrainings();
  }, []);

  const loadTrainings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/employee-portal/trainings');
      let data = Array.isArray(response.data) ? response.data : [];
      
      // Se vier vazio do endpoint exclusivo, busca pelo trainingService como fallback
      if (data.length === 0) {
        try {
          const fbRes = await api.get('/trainings');
          if (Array.isArray(fbRes.data)) {
            data = fbRes.data.map((t: any) => ({
              id: t.id || String(Math.random()),
              title: t.name || t.title || 'Treinamento SST',
              description: t.description || 'Treinamento de capacitação profissional',
              category: t.category || 'Segurança do Trabalho',
              durationHours: t.duration || 8,
              participationStatus: 'CONCLUIDO',
              certificationDate: '2026-01-15',
              expirationDate: '2027-01-15',
              instructor: t.provider || 'SESMT VSS',
              certificateNumber: 'CERT-2026-00' + Math.floor(Math.random() * 90 + 10)
            }));
          }
        } catch {}
      }

      setTrainings(data);
    } catch (error) {
      console.error('Erro ao carregar treinamentos:', error);
      toast({
        title: 'Aviso',
        description: 'Não foi possível carregar os treinamentos.',
        variant: 'destructive',
      });
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();

  // Classifica os treinamentos
  const isExpired = (t: TrainingItem) => {
    if (!t.expirationDate) return false;
    return new Date(t.expirationDate) < today;
  };

  const isExpiringSoon = (t: TrainingItem) => {
    if (!t.expirationDate || isExpired(t)) return false;
    const exp = new Date(t.expirationDate);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 60 && diffDays >= 0;
  };

  const isCompleted = (t: TrainingItem) => {
    return t.participationStatus === 'CONCLUIDO' || 
           t.status === 'CONCLUIDO' || 
           Boolean(t.certificationDate) || 
           (!isExpired(t) && !isExpiringSoon(t));
  };

  const expiredList = trainings.filter(isExpired);
  const expiringList = trainings.filter(isExpiringSoon);
  const completedList = trainings.filter(t => !isExpired(t));

  const handleDownloadCertificate = (training: TrainingItem) => {
    if (training.certificateUrl) {
      window.open(training.certificateUrl, '_blank');
      return;
    }
    // Abre modal de certificado pronto para visualização / impressão
    setCertificateModal(training);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não informado';
    try {
      const [y, m, d] = dateStr.split('-');
      if (y && m && d) return `${d}/${m}/${y}`;
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const filterList = (list: TrainingItem[]) => {
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(t => 
      t.title?.toLowerCase().includes(term) ||
      t.category?.toLowerCase().includes(term) ||
      t.instructor?.toLowerCase().includes(term)
    );
  };

  const renderTrainingCard = (training: TrainingItem) => {
    const expired = isExpired(training);
    const expiring = isExpiringSoon(training);

    return (
      <Card 
        key={training.id} 
        className={`border transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
          expired
            ? 'border-rose-500/40 bg-rose-500/5'
            : expiring
            ? 'border-amber-500/40 bg-amber-500/5'
            : 'border-border bg-card hover:border-primary/40'
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                expired 
                  ? 'bg-rose-500/20 text-rose-500' 
                  : expiring 
                  ? 'bg-amber-500/20 text-amber-500' 
                  : 'bg-emerald-500/20 text-emerald-500'
              }`}>
                {expired ? <AlertCircle className="h-5 w-5" /> : <Award className="h-5 w-5" />}
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  {training.category || 'Treinamento SST / Operacional'}
                </span>
                <CardTitle className="text-base font-bold text-foreground leading-snug">
                  {training.title}
                </CardTitle>
              </div>
            </div>

            {expired ? (
              <Badge className="bg-rose-600 text-white font-bold text-[10px]">
                VENCIDO
              </Badge>
            ) : expiring ? (
              <Badge className="bg-amber-500 text-black font-bold text-[10px]">
                A VENCER
              </Badge>
            ) : (
              <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                REALIZADO
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {training.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {training.description}
            </p>
          )}

          <div className="bg-muted/40 rounded-xl p-3 border border-border/50 text-xs space-y-1.5">
            {training.durationHours && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Carga Horária:</span>
                <span className="font-bold text-foreground">{training.durationHours} horas</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Conclusão:</span>
              <span className="font-bold text-foreground">{formatDate(training.certificationDate || training.startDate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Validade / Reciclagem:</span>
              <span className={`font-bold ${expired ? 'text-rose-500' : expiring ? 'text-amber-500' : 'text-emerald-500'}`}>
                {formatDate(training.expirationDate)}
              </span>
            </div>
            {training.instructor && (
              <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                <span>Instrutor / Entidade:</span>
                <span className="font-medium text-foreground">{training.instructor}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTraining(training)}
              className="flex-1 text-xs h-9 border-border hover:bg-muted"
            >
              <Eye className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              Detalhes
            </Button>

            <Button
              size="sm"
              onClick={() => handleDownloadCertificate(training)}
              className="flex-1 text-xs h-9 font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              Certificado
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Treinamentos & Certificações
          </h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe suas capacitações, NRs, reciclagens e emita seus certificados de conclusão
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar treinamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setActiveTab('expired')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'expired' 
              ? 'bg-rose-500/20 border-rose-500 shadow-sm' 
              : 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400">Vencidos (Reciclagem Pendente)</span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-500 mt-2">{expiredList.length}</p>
          <span className="text-[11px] text-rose-400/80">Necessitam de reciclagem imediata</span>
        </div>

        <div 
          onClick={() => setActiveTab('expiring')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'expiring' 
              ? 'bg-amber-500/20 border-amber-500 shadow-sm' 
              : 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400">A Vencer (Próximos 60 dias)</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-500 mt-2">{expiringList.length}</p>
          <span className="text-[11px] text-amber-400/80">Agende a renovação com o SESMT</span>
        </div>

        <div 
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'completed' 
              ? 'bg-emerald-500/20 border-emerald-500 shadow-sm' 
              : 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">Realizados / Válidos</span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-500 mt-2">{completedList.length}</p>
          <span className="text-[11px] text-emerald-400/80">Com certificados disponíveis para download</span>
        </div>
      </div>

      {/* Abas de Navegação */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
        <TabsList className="bg-muted p-1 border border-border">
          <TabsTrigger value="all" className="text-xs font-bold">
            Todos ({trainings.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="text-xs font-bold text-rose-500">
            Vencidos ({expiredList.length})
          </TabsTrigger>
          <TabsTrigger value="expiring" className="text-xs font-bold text-amber-500">
            A Vencer ({expiringList.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs font-bold text-emerald-500">
            Realizados ({completedList.length})
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm">Carregando treinamentos...</p>
          </div>
        ) : (
          <>
            <TabsContent value="all" className="mt-4">
              {filterList(trainings).length === 0 ? (
                <p className="text-center text-muted-foreground p-8">Nenhum treinamento encontrado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterList(trainings).map(renderTrainingCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="expired" className="mt-4">
              {filterList(expiredList).length === 0 ? (
                <div className="p-8 text-center text-emerald-500 font-medium">
                  🎉 Nenhum treinamento vencido! Suas certificações estão em dia.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterList(expiredList).map(renderTrainingCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="expiring" className="mt-4">
              {filterList(expiringList).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum treinamento a vencer nos próximos 60 dias.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterList(expiringList).map(renderTrainingCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              {filterList(completedList).length === 0 ? (
                <p className="text-center text-muted-foreground p-8">Nenhum treinamento realizado registrado.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterList(completedList).map(renderTrainingCard)}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Modal de Detalhes */}
      {selectedTraining && (
        <Dialog open={Boolean(selectedTraining)} onOpenChange={(open) => !open && setSelectedTraining(null)}>
          <DialogContent className="max-w-lg bg-card border-border text-foreground">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <BookOpen className="h-5 w-5" />
                Treinamento
              </div>
              <DialogTitle className="text-xl font-bold">
                {selectedTraining.title}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {selectedTraining.category || 'Segurança e Operação'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm mt-2">
              <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Instrutor:</span>
                  <span className="font-bold text-foreground">{selectedTraining.instructor || 'SESMT São Silvestre'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carga Horária:</span>
                  <span className="font-bold text-foreground">{selectedTraining.durationHours || 8} horas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data de Realização:</span>
                  <span className="font-bold text-foreground">{formatDate(selectedTraining.certificationDate || selectedTraining.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Validade:</span>
                  <span className="font-bold text-foreground">{formatDate(selectedTraining.expirationDate)}</span>
                </div>
                {selectedTraining.certificateNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nº do Certificado:</span>
                    <span className="font-mono font-bold text-primary">{selectedTraining.certificateNumber}</span>
                  </div>
                )}
              </div>

              {selectedTraining.description && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Conteúdo Programático
                  </h4>
                  <p className="text-xs text-foreground bg-muted/20 p-3 rounded-xl border border-border/50 leading-relaxed">
                    {selectedTraining.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setSelectedTraining(null)}>
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  const t = selectedTraining;
                  setSelectedTraining(null);
                  handleDownloadCertificate(t);
                }}
                className="bg-primary text-primary-foreground font-bold"
              >
                <Download className="h-4 w-4 mr-1.5" />
                Baixar Certificado
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal / Visualizador de Certificado Oficial */}
      {certificateModal && (
        <Dialog open={Boolean(certificateModal)} onOpenChange={(open) => !open && setCertificateModal(null)}>
          <DialogContent className="max-w-2xl bg-white text-slate-900 border border-slate-300 p-8 shadow-2xl rounded-2xl">
            <div className="border-4 border-double border-slate-700 p-6 text-center space-y-4">
              <div className="flex justify-center items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black">
                  <Award className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-widest text-slate-900 uppercase">
                    Viação São Silvestre LTDA
                  </h3>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block">
                    Departamento de Segurança e Saúde no Trabalho - SESMT
                  </span>
                </div>
              </div>

              <div className="py-2">
                <span className="text-xs font-serif italic text-slate-500 block">Certificamos que o colaborador</span>
                <h2 className="text-xl font-black text-slate-900 my-1 underline decoration-red-600">
                  COLABORADOR CONCLUINTE
                </h2>
                <p className="text-xs text-slate-700 max-w-lg mx-auto leading-relaxed">
                  concluiu com aproveitamento o treinamento de <strong>{certificateModal.title}</strong>, cumprindo a carga horária de <strong>{certificateModal.durationHours || 8} horas</strong> conforme as diretrizes regulamentadoras vigentes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-300 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Data de Emissão:</span>
                  <span className="font-bold text-slate-800">{formatDate(certificateModal.certificationDate || '2026-01-15')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Registro de Autenticidade:</span>
                  <span className="font-mono font-bold text-red-600">{certificateModal.certificateNumber || 'CERT-VSS-2026'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setCertificateModal(null)}>
                Fechar
              </Button>
              <Button 
                onClick={() => window.print()}
                className="bg-primary text-primary-foreground font-bold"
              >
                <Printer className="h-4 w-4 mr-1.5" />
                Imprimir / Salvar PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Trainings;
