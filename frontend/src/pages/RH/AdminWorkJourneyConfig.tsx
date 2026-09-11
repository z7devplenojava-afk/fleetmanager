import React, { useState, useEffect, useCallback } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import PontoAdminNav from '@/components/ponto/PontoAdminNav';
import {
  Save,
  Loader2,
  Building2,
  Clock,
  Shield,
  RefreshCw,
  MapPin,
  Sun,
  Moon,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import workJourneyConfigService, { WorkJourneyConfig, CompanyConfigStatus } from '@/services/workJourneyConfigService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const AdminWorkJourneyConfig: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'FLEX_ADMIN';

  const [companies, setCompanies] = useState<CompanyConfigStatus[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [config, setConfig] = useState<WorkJourneyConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Form fields
  const [cargaHorariaDiaria, setCargaHorariaDiaria] = useState('8');
  const [toleranciaAtrasoMin, setToleranciaAtrasoMin] = useState('10');
  const [intervaloMin, setIntervaloMin] = useState('60');
  const [percentualHENormal, setPercentualHENormal] = useState('50');
  const [percentualHENoturna, setPercentualHENoturna] = useState('60');
  const [percentualHE100, setPercentualHE100] = useState('100');
  const [cargaHorariaSemanal, setCargaHorariaSemanal] = useState('44');
  const [inicioJornadaNoturna, setInicioJornadaNoturna] = useState('22');
  const [fimJornadaNoturna, setFimJornadaNoturna] = useState('5');
  const [bancoHorasAtivo, setBancoHorasAtivo] = useState(false);
  const [geoObrigatoria, setGeoObrigatoria] = useState(false);
  const [geoRaioMetros, setGeoRaioMetros] = useState('100');
  const [ativo, setAtivo] = useState(true);

  const markDirty = () => setDirty(true);

  // Load companies list
  useEffect(() => {
    if (!isSuperAdmin) return;
    let mounted = true;
    setLoadingList(true);
    workJourneyConfigService.getCompaniesWithConfigStatus()
      .then((res) => {
        if (!mounted) return;
        if (res.success) setCompanies(res.data);
      })
      .catch((err) => {
        console.error('Erro ao carregar empresas:', err);
        toast({ title: 'Erro', description: 'Não foi possível carregar lista de empresas', variant: 'destructive' });
      })
      .finally(() => {
        if (mounted) setLoadingList(false);
      });
    return () => { mounted = false; };
  }, [isSuperAdmin, toast]);

  // Load config when company changes
  const loadConfig = useCallback(async (companyId: string) => {
    if (!companyId) {
      setConfig(null);
      return;
    }
    try {
      setLoading(true);
      const res = await workJourneyConfigService.findByCompanyId(companyId);
      if (res.success) {
        const cfg = res.data;
        setConfig(cfg);
        setCargaHorariaDiaria(String(cfg.cargaHorariaDiaria));
        setToleranciaAtrasoMin(String(cfg.toleranciaAtrasoMin));
        setIntervaloMin(String(cfg.intervaloMin));
        setPercentualHENormal(String(cfg.percentualHENormal));
        setPercentualHENoturna(String(cfg.percentualHENoturna));
        setPercentualHE100(String(cfg.percentualHE100));
        setCargaHorariaSemanal(String(cfg.cargaHorariaSemanal));
        setInicioJornadaNoturna(String(cfg.inicioJornadaNoturna));
        setFimJornadaNoturna(String(cfg.fimJornadaNoturna));
        setBancoHorasAtivo(cfg.bancoHorasAtivo);
        setGeoObrigatoria(cfg.geoObrigatoria);
        setGeoRaioMetros(String(cfg.geoRaioMetros));
        setAtivo(cfg.ativo);
        setDirty(false);
      }
    } catch (error: any) {
      console.error('Erro ao carregar config:', error);
      toast({ title: 'Erro', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConfig(selectedCompanyId);
  }, [selectedCompanyId, loadConfig]);

  const handleSave = async () => {
    if (!selectedCompanyId) return;
    try {
      setSaving(true);
      const updates = {
        cargaHorariaDiaria: parseFloat(cargaHorariaDiaria) || 8,
        toleranciaAtrasoMin: parseInt(toleranciaAtrasoMin) || 10,
        intervaloMin: parseInt(intervaloMin) || 60,
        percentualHENormal: parseFloat(percentualHENormal) || 50,
        percentualHENoturna: parseFloat(percentualHENoturna) || 60,
        percentualHE100: parseFloat(percentualHE100) || 100,
        cargaHorariaSemanal: parseFloat(cargaHorariaSemanal) || 44,
        inicioJornadaNoturna: parseInt(inicioJornadaNoturna) || 22,
        fimJornadaNoturna: parseInt(fimJornadaNoturna) || 5,
        bancoHorasAtivo,
        geoObrigatoria,
        geoRaioMetros: parseInt(geoRaioMetros) || 100,
        ativo
      };
      const res = await workJourneyConfigService.saveOrUpdate(selectedCompanyId, updates);
      if (res.success) {
        toast({ title: '✅ Configuração salva', description: res.message || 'Configuração de jornada atualizada com sucesso' });
        setDirty(false);
        // Refresh config
        loadConfig(selectedCompanyId);
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({ title: 'Erro ao salvar', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  // Not SUPER_ADMIN
  if (!isSuperAdmin) {
    return (
      <StandardLayout>
        <div className="container mx-auto p-6 space-y-6">
          <PontoAdminNav title="Configuração de Jornada" subtitle="Configurar regras de ponto por empresa" />
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-8 text-center">
              <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-500 mb-2">Acesso Restrito</h2>
              <p className="text-seguranca-gray">Apenas SUPER_ADMIN pode configurar jornada de trabalho.</p>
            </CardContent>
          </Card>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <PontoAdminNav
          title="Configuração de Jornada"
          subtitle="Defina as regras de jornada de trabalho por empresa"
        />

        {/* Company Selector */}
        <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1 w-full">
                <Label className="text-seguranca-gray text-xs">Selecione a Empresa</Label>
                <Select
                  value={selectedCompanyId}
                  onValueChange={(val) => {
                    setSelectedCompanyId(val);
                    setDirty(false);
                  }}
                  disabled={loadingList}
                >
                  <SelectTrigger className="bg-seguranca-black border-seguranca-gray/30 mt-1 w-full">
                    <SelectValue placeholder={loadingList ? 'Carregando...' : 'Selecione uma empresa'} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{c.name}</span>
                          {c.sigla && <span className="text-seguranca-gray text-xs">({c.sigla})</span>}
                          {!c.hasConfig && (
                            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20 ml-2">
                              Padrão
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCompanyId && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => loadConfig(selectedCompanyId)}
                    disabled={loading}
                    className="border-seguranca-yellow/30"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Recarregar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || loading || !dirty}
                    className="bg-seguranca-yellow hover:bg-seguranca-yellow/80 text-seguranca-black font-bold"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!selectedCompanyId && (
          <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
            <CardContent className="p-12 text-center">
              <Settings className="h-16 w-16 mx-auto text-seguranca-gray/40 mb-4" />
              <h3 className="text-xl font-medium text-seguranca-gray mb-2">Selecione uma empresa</h3>
              <p className="text-seguranca-gray/60 text-sm">
                Escolha uma empresa no seletor acima para configurar sua jornada de trabalho.
              </p>
            </CardContent>
          </Card>
        )}

        {selectedCompanyId && loading && (
          <div className="text-center py-16">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-seguranca-yellow" />
            <p className="text-seguranca-gray mt-4">Carregando configurações...</p>
          </div>
        )}

        {selectedCompanyId && !loading && config !== null && (
          <>
            {/* Info Banner */}
            <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-seguranca-gray flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-seguranca-yellow" />
                    Configurando: <strong className="text-seguranca-lightgray">{selectedCompany?.name}</strong>
                    {!config.ativo && (
                      <Badge variant="outline" className="ml-2 bg-red-500/10 text-red-500 border-red-500/20">
                        INATIVO
                      </Badge>
                    )}
                  </span>
                  <Badge variant="outline" className={`${dirty ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                    {dirty ? '⚠️ Não salvo' : '✅ Salvo'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Jornada Diária */}
              <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                    <Clock className="mr-2 h-5 w-5 text-seguranca-yellow" />
                    Jornada Diária
                  </CardTitle>
                  <CardDescription>Configurações da carga horária diária</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-seguranca-gray text-xs">Carga Horária Diária (horas)</Label>
                    <Input
                      type="number" step="0.5" min="1" max="24"
                      value={cargaHorariaDiaria}
                      onChange={(e) => { setCargaHorariaDiaria(e.target.value); markDirty(); }}
                      className="bg-seguranca-black border-seguranca-gray/30 mt-1"
                    />
                    <p className="text-xs text-seguranca-gray mt-1">Ex: 8.0 = 8 horas, 6.0 = 6 horas</p>
                  </div>
                  <div>
                    <Label className="text-seguranca-gray text-xs">Tolerância para Atraso (minutos)</Label>
                    <Input
                      type="number" min="0" max="60"
                      value={toleranciaAtrasoMin}
                      onChange={(e) => { setToleranciaAtrasoMin(e.target.value); markDirty(); }}
                      className="bg-seguranca-black border-seguranca-gray/30 mt-1"
                    />
                    <p className="text-xs text-seguranca-gray mt-1">Tempo de tolerância antes de considerar atraso</p>
                  </div>
                  <div>
                    <Label className="text-seguranca-gray text-xs">Duração do Intervalo (minutos)</Label>
                    <Input
                      type="number" min="0" max="240" step="15"
                      value={intervaloMin}
                      onChange={(e) => { setIntervaloMin(e.target.value); markDirty(); }}
                      className="bg-seguranca-black border-seguranca-gray/30 mt-1"
                    />
                    <p className="text-xs text-seguranca-gray mt-1">Intrajornada: almoço/descanso (default: 60min)</p>
                  </div>
                </CardContent>
              </Card>

              {/* Horas Extras */}
              <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                    <DollarSign className="mr-2 h-5 w-5 text-orange-500" />
                    Horas Extras
                  </CardTitle>
                  <CardDescription>Percentuais de adicional para horas extras</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-seguranca-gray text-xs">HE Normal (%)</Label>
                    <Input
                      type="number" step="5" min="0" max="200"
                      value={percentualHENormal}
                      onChange={(e) => { setPercentualHENormal(e.target.value); markDirty(); }}
                      className="bg-seguranca-black border-seguranca-gray/30 mt-1"
                    />
                    <p className="text-xs text-seguranca-gray mt-1">Hora extra em dias úteis (ex: 50%)</p>
                  </div>
                  <div>
                    <Label className="text-seguranca-gray text-xs">HE Noturna (%)</Label>
                    <Input
                      type="number" step="5" min="0" max="200"
                      value={percentualHENoturna}
                      onChange={(e) => { setPercentualHENoturna(e.target.value); markDirty(); }}
                      className="bg-seguranca-black border-seguranca-gray/30 mt-1"
                    />
                    <p className="text-xs text-seguranca-gray mt-1">Adicional noturno (ex: 60%)</p>
                  </div>
                  <div>
                    <Label className="text-seguranca-gray text-xs">HE 100% (%)</Label>
                    <Input
                      type="number" step="5" min="0" max="200"
                      value={percentualHE100}
                      onChange={(e) => { setPercentualHE100(e.target.value); markDirty(); }}
                      className="bg-seguranca-black border-seguranca-gray/30 mt-1"
                    />
                    <p className="text-xs text-seguranca-gray mt-1">HE em domingos e feriados (ex: 100%)</p>
                  </div>
                </CardContent>
              </Card>

              {/* Jornada Semanal e Noturna */}
              <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                    <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                    Jornada Semanal & Noturna
                  </CardTitle>
                  <CardDescription>Carga horária semanal e horário noturno</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-seguranca-gray text-xs">Carga Horária Semanal (horas)</Label>
                    <Input
                      type="number" step="1" min="4" max="60"
                      value={cargaHorariaSemanal}
                      onChange={(e) => { setCargaHorariaSemanal(e.target.value); markDirty(); }}
                      className="bg-seguranca-black border-seguranca-gray/30 mt-1"
                    />
                    <p className="text-xs text-seguranca-gray mt-1">Ex: 44h (CLT padrão), 36h, etc.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-seguranca-gray text-xs flex items-center gap-1">
                        <Moon className="h-3 w-3" /> Início Noturno (h)
                      </Label>
                      <Input
                        type="number" min="18" max="23"
                        value={inicioJornadaNoturna}
                        onChange={(e) => { setInicioJornadaNoturna(e.target.value); markDirty(); }}
                        className="bg-seguranca-black border-seguranca-gray/30 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-seguranca-gray text-xs flex items-center gap-1">
                        <Sun className="h-3 w-3" /> Fim Noturno (h)
                      </Label>
                      <Input
                        type="number" min="0" max="7"
                        value={fimJornadaNoturna}
                        onChange={(e) => { setFimJornadaNoturna(e.target.value); markDirty(); }}
                        className="bg-seguranca-black border-seguranca-gray/30 mt-1"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-seguranca-gray">Horário noturno: {inicioJornadaNoturna}h às {fimJornadaNoturna}h</p>
                </CardContent>
              </Card>

              {/* Geotecnologia e Banco de Horas */}
              <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                    <Shield className="mr-2 h-5 w-5 text-purple-500" />
                    Banco de Horas & Geolocalização
                  </CardTitle>
                  <CardDescription>Configurações adicionais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Banco de Horas */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-seguranca-gray text-sm">Banco de Horas</Label>
                      <p className="text-xs text-seguranca-gray">Compensação de horas extras com folgas</p>
                    </div>
                    <Switch
                      checked={bancoHorasAtivo}
                      onCheckedChange={(v) => { setBancoHorasAtivo(v); markDirty(); }}
                    />
                  </div>

                  <Separator className="bg-seguranca-gray/20" />

                  {/* Geolocalização */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-seguranca-gray text-sm">Geolocalização Obrigatória</Label>
                      <p className="text-xs text-seguranca-gray">Exigir localização ao bater ponto</p>
                    </div>
                    <Switch
                      checked={geoObrigatoria}
                      onCheckedChange={(v) => { setGeoObrigatoria(v); markDirty(); }}
                    />
                  </div>

                  {geoObrigatoria && (
                    <div>
                      <Label className="text-seguranca-gray text-xs flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Raio de Validação (metros)
                      </Label>
                      <Input
                        type="number" min="10" max="1000" step="10"
                        value={geoRaioMetros}
                        onChange={(e) => { setGeoRaioMetros(e.target.value); markDirty(); }}
                        className="bg-seguranca-black border-seguranca-gray/30 mt-1"
                      />
                      <p className="text-xs text-seguranca-gray mt-1">Distância máxima permitida para registro de ponto</p>
                    </div>
                  )}

                  <Separator className="bg-seguranca-gray/20" />

                  {/* Ativo */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-seguranca-gray text-sm">Configuração Ativa</Label>
                      <p className="text-xs text-seguranca-gray">Desative para usar configurações padrão do sistema</p>
                    </div>
                    <Switch
                      checked={ativo}
                      onCheckedChange={(v) => { setAtivo(v); markDirty(); }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Save Bar */}
            <Card className={`sticky bottom-4 border transition-all duration-300 ${
              dirty ? 'bg-amber-500/10 border-amber-500/30' : 'bg-seguranca-darkgray/50 border-seguranca-gray/20'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {dirty ? (
                      <>
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <span className="text-amber-400 text-sm font-medium">Há alterações não salvas</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-green-400 text-sm font-medium">Configuração salva</span>
                      </>
                    )}
                    <span className="text-seguranca-gray text-xs ml-2">
                      {selectedCompany?.name}
                    </span>
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !dirty}
                    className={`font-bold transition-all ${
                      dirty
                        ? 'bg-seguranca-yellow hover:bg-seguranca-yellow/80 text-seguranca-black animate-pulse'
                        : 'bg-seguranca-gray/20 text-seguranca-gray cursor-not-allowed'
                    }`}
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar Configuração
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </StandardLayout>
  );
};

export default AdminWorkJourneyConfig;
