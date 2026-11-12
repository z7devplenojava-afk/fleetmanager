import React, { useState, useEffect } from 'react';
import { 
  Award, 
  HeartPulse, 
  Utensils, 
  Bus, 
  Shield, 
  Gift, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  Search, 
  Loader2,
  Info,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';

export interface BenefitItem {
  id: string;
  name: string;
  description?: string;
  type?: string;
  value?: number;
  percentage?: number;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export const Benefits: React.FC = () => {
  const { toast } = useToast();
  const [benefits, setBenefits] = useState<BenefitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBenefit, setSelectedBenefit] = useState<BenefitItem | null>(null);

  useEffect(() => {
    loadBenefits();
  }, []);

  const loadBenefits = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/employee-portal/benefits');
      setBenefits(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar benefícios:', error);
      toast({
        title: 'Aviso',
        description: 'Não foi possível carregar os benefícios no momento.',
        variant: 'destructive',
      });
      setBenefits([]);
    } finally {
      setLoading(false);
    }
  };

  const getBenefitIcon = (type?: string, name?: string) => {
    const t = (type || name || '').toUpperCase();
    if (t.includes('HEALTH') || t.includes('SAUDE') || t.includes('MÉDIC') || t.includes('MEDIC') || t.includes('ODONTO') || t.includes('DENTAL')) {
      return <HeartPulse className="h-5 w-5 text-rose-500" />;
    }
    if (t.includes('MEAL') || t.includes('ALIMENT') || t.includes('REFEI') || t.includes('VR') || t.includes('VA')) {
      return <Utensils className="h-5 w-5 text-amber-500" />;
    }
    if (t.includes('TRANSPORT') || t.includes('VT') || t.includes('VALE') || t.includes('PASS')) {
      return <Bus className="h-5 w-5 text-blue-500" />;
    }
    if (t.includes('LIFE') || t.includes('SEGURO') || t.includes('PREV')) {
      return <Shield className="h-5 w-5 text-emerald-500" />;
    }
    return <Gift className="h-5 w-5 text-purple-500" />;
  };

  const getBenefitCategoryLabel = (type?: string, name?: string) => {
    const t = (type || name || '').toUpperCase();
    if (t.includes('HEALTH') || t.includes('SAUDE')) return 'Plano de Saúde';
    if (t.includes('DENTAL') || t.includes('ODONTO')) return 'Plano Odontológico';
    if (t.includes('MEAL') || t.includes('REFEI') || t.includes('ALIMENT')) return 'Alimentação / Refeição';
    if (t.includes('TRANSPORT') || t.includes('VT')) return 'Vale Transporte';
    if (t.includes('LIFE') || t.includes('SEGURO')) return 'Seguro de Vida';
    return 'Benefício Corporativo';
  };

  const filteredBenefits = benefits.filter(b => {
    const term = searchTerm.toLowerCase();
    const nameMatch = b.name?.toLowerCase().includes(term);
    const descMatch = b.description?.toLowerCase().includes(term);
    const typeMatch = b.type?.toLowerCase().includes(term);
    return nameMatch || descMatch || typeMatch || !term;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Meus Benefícios
          </h2>
          <p className="text-sm text-muted-foreground">
            Consulte os benefícios ativos vinculados ao seu contrato de trabalho e cargo na Viação São Silvestre
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar benefícios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
      </div>

      {/* Conteúdo Principal */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm">Carregando seus benefícios...</p>
        </div>
      ) : filteredBenefits.length === 0 ? (
        <Card className="border-dashed border-border bg-card/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Award className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Nenhum benefício encontrado</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {searchTerm 
                ? 'Nenhum resultado corresponde à sua busca.' 
                : 'Não há benefícios cadastrados no momento para o seu cargo.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBenefits.map((benefit) => {
            const category = getBenefitCategoryLabel(benefit.type, benefit.name);
            const icon = getBenefitIcon(benefit.type, benefit.name);

            return (
              <Card 
                key={benefit.id} 
                className="border-border bg-card hover:border-primary/40 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted/80 flex items-center justify-center border border-border/60">
                        {icon}
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                          {category}
                        </span>
                        <CardTitle className="text-base font-bold text-foreground leading-tight">
                          {benefit.name}
                        </CardTitle>
                      </div>
                    </div>
                    <Badge variant={benefit.isActive !== false ? 'default' : 'secondary'} className="text-[11px] font-bold">
                      {benefit.isActive !== false ? 'ATIVO' : 'INATIVO'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {benefit.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {benefit.description}
                    </p>
                  )}

                  <div className="bg-muted/40 rounded-xl p-3 border border-border/50 text-xs space-y-1.5">
                    {benefit.value != null && benefit.value > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Valor / Subsídio:</span>
                        <span className="font-mono font-bold text-foreground">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(benefit.value)}
                        </span>
                      </div>
                    )}
                    {benefit.percentage != null && benefit.percentage > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Cobertura / Desconto:</span>
                        <span className="font-mono font-bold text-foreground">{benefit.percentage}%</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      <span>Status do Vínculo:</span>
                      <span className="text-emerald-500 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Concedido pelo RH
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBenefit(benefit)}
                    className="w-full text-xs h-9 border-border hover:bg-muted"
                  >
                    <Info className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    Ver Detalhes do Benefício
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes do Benefício */}
      {selectedBenefit && (
        <Dialog open={Boolean(selectedBenefit)} onOpenChange={(open) => !open && setSelectedBenefit(null)}>
          <DialogContent className="max-w-lg bg-card border-border text-foreground">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Award className="h-5 w-5" />
                Benefício do Colaborador
              </div>
              <DialogTitle className="text-xl font-bold">
                {selectedBenefit.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {getBenefitCategoryLabel(selectedBenefit.type, selectedBenefit.name)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm mt-2">
              <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categoria:</span>
                  <span className="font-bold text-foreground">{getBenefitCategoryLabel(selectedBenefit.type, selectedBenefit.name)}</span>
                </div>
                {selectedBenefit.value != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Concedido:</span>
                    <span className="font-bold text-emerald-500 font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedBenefit.value)}
                    </span>
                  </div>
                )}
                {selectedBenefit.percentage != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Percentual de Participação:</span>
                    <span className="font-bold text-foreground">{selectedBenefit.percentage}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Situação:</span>
                  <Badge variant={selectedBenefit.isActive !== false ? 'default' : 'secondary'} className="text-[10px]">
                    {selectedBenefit.isActive !== false ? 'ATIVO EM FOLHA' : 'INATIVO'}
                  </Badge>
                </div>
              </div>

              {selectedBenefit.description && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Descrição & Cobertura
                  </h4>
                  <p className="text-xs text-foreground bg-muted/20 p-3 rounded-xl border border-border/50 leading-relaxed">
                    {selectedBenefit.description}
                  </p>
                </div>
              )}

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-400 leading-relaxed flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Para inclusão de dependentes, upgrade de plano ou alteração de endereço do Vale Transporte, abra uma solicitação junto ao Departamento de Recursos Humanos.
                </span>
              </div>
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setSelectedBenefit(null)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Benefits;

