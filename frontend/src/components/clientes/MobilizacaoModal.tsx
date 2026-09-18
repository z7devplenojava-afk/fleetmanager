import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { clientService } from '@/services/clientService';
import { Client } from '@/types/client';
import {
  Rocket,
  Building2,
  Users,
  Car,
  MapPin,
  Calendar,
  FileCheck2,
  ShieldCheck,
  Wrench,
  Package,
  DollarSign,
  Send,
  BellRing,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

interface MobilizacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client;
  onSuccess?: () => void;
}

const AVAILABLE_SECTORS = [
  {
    id: 'OPERACIONAL',
    name: 'Operacional',
    description: 'Mobilização de postos, rotas, escalas e alocação de motoristas/vigilantes',
    icon: Users,
    color: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    accent: 'bg-blue-500',
  },
  {
    id: 'MANUTENCAO',
    name: 'Manutenção',
    description: 'Preparação técnica de veículos, revisões preventivas e checklist de frota',
    icon: Wrench,
    color: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
    accent: 'bg-amber-500',
  },
  {
    id: 'SST',
    name: 'Segurança SST',
    description: 'Exames admissionais (ASO), fichas de EPI, PGR/PCMSO e treinamentos NR',
    icon: ShieldCheck,
    color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
    accent: 'bg-emerald-500',
  },
  {
    id: 'ALMOXARIFADO',
    name: 'Almoxarifado',
    description: 'Separação e entrega de uniformes, crachás, insumos e equipamentos de trabalho',
    icon: Package,
    color: 'border-purple-500/50 bg-purple-500/10 text-purple-400',
    accent: 'bg-purple-500',
  },
  {
    id: 'FINANCEIRO',
    name: 'Financeiro',
    description: 'Abertura de centro de custos, faturamento, condições comerciais e garantias',
    icon: DollarSign,
    color: 'border-rose-500/50 bg-rose-500/10 text-rose-400',
    accent: 'bg-rose-500',
  },
];

export const MobilizacaoModal: React.FC<MobilizacaoModalProps> = ({
  isOpen,
  onClose,
  client,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);

  const [formData, setFormData] = useState({
    clientName: '',
    contractNumber: '',
    workPostCount: 1,
    vehicleCount: 1,
    headcount: 1,
    targetStartDate: '',
    notes: '',
    selectedSectors: ['OPERACIONAL', 'MANUTENCAO', 'SST', 'ALMOXARIFADO', 'FINANCEIRO'],
  });

  useEffect(() => {
    if (client) {
      setFormData((prev) => ({
        ...prev,
        clientName: client.name || '',
        contractNumber: `CT-${new Date().getFullYear()}-${client.name.substring(0, 3).toUpperCase()}`,
        targetStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }));
      setDispatchedSuccess(false);
    }
  }, [client, isOpen]);

  const handleToggleSector = (sectorId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedSectors.includes(sectorId);
      if (exists) {
        if (prev.selectedSectors.length === 1) return prev; // Keep at least one
        return { ...prev, selectedSectors: prev.selectedSectors.filter((id) => id !== sectorId) };
      } else {
        return { ...prev, selectedSectors: [...prev.selectedSectors, sectorId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      toast({
        title: 'Atenção',
        description: 'Informe o nome do cliente para a mobilização.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await clientService.triggerMobilization({
        clientId: client?.id,
        clientName: formData.clientName,
        contractNumber: formData.contractNumber,
        workPostCount: Number(formData.workPostCount) || 1,
        vehicleCount: Number(formData.vehicleCount) || 0,
        headcount: Number(formData.headcount) || 1,
        targetStartDate: formData.targetStartDate,
        notes: formData.notes,
        targetSectors: formData.selectedSectors,
      });

      setDispatchedSuccess(true);
      toast({
        title: 'Mobilização Disparada!',
        description: `Notificações e mensagens enviadas aos 5 setores (Operacional, Manutenção, SST, Almoxarifado, Financeiro) com sucesso!`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error triggering mobilization:', error);
      toast({
        title: 'Erro ao disparar mobilização',
        description: error.response?.data?.message || 'Ocorreu um erro ao comunicar os setores.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-black/95 border-gray-700/60 backdrop-blur-xl text-white shadow-2xl p-6">
        <DialogHeader className="border-b border-gray-800 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-seguranca-red to-orange-600 text-white shadow-lg shadow-seguranca-red/30">
                <Rocket className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Mobilização Multissetorial de Cliente
                  <Badge variant="outline" className="border-seguranca-yellow/40 text-seguranca-yellow text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                    Comercial ➔ Operações
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-gray-400 text-xs mt-1">
                  Dispare automaticamente o plano de mobilização de início de contrato via In-App (WebSocket), E-mail e WhatsApp para os 5 departamentos da empresa.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {dispatchedSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="h-16 w-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Mobilização Enviada com Sucesso!</h3>
            <p className="text-sm text-gray-400 max-w-lg mx-auto">
              Todas as equipes (Operacional, Manutenção, SST, Almoxarifado e Financeiro) receberam o dossiê de início para o cliente <strong className="text-seguranca-yellow">{formData.clientName}</strong>.
            </p>

            {/* Channels summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-xl mx-auto pt-4">
              <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-lg flex items-center gap-3 text-left">
                <BellRing className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="text-xs font-bold text-gray-200">Painel & Notificações</div>
                  <div className="text-[10px] text-gray-400">WebSocket / Sino Ativo</div>
                </div>
              </div>
              <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-lg flex items-center gap-3 text-left">
                <Mail className="h-5 w-5 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold text-gray-200">E-mails Corporativos</div>
                  <div className="text-[10px] text-gray-400">Dossiê e Checklist enviados</div>
                </div>
              </div>
              <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-lg flex items-center gap-3 text-left">
                <MessageSquare className="h-5 w-5 text-green-400" />
                <div>
                  <div className="text-xs font-bold text-gray-200">WhatsApp Evolution</div>
                  <div className="text-[10px] text-gray-400">Alerta nos grupos gestores</div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button
                onClick={onClose}
                className="bg-seguranca-red hover:bg-seguranca-red/90 text-white font-semibold px-8"
              >
                Concluir e Fechar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* Top Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-seguranca-red" />
                  Nome do Cliente / Razão Social
                </Label>
                <Input
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Ex: Petrobras S.A."
                  className="bg-seguranca-graphite/40 border-gray-700 text-white font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <FileCheck2 className="h-3.5 w-3.5 text-seguranca-yellow" />
                  Número do Contrato / Proposta Aprovada
                </Label>
                <Input
                  value={formData.contractNumber}
                  onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                  placeholder="Ex: CT-2026-PETR-01"
                  className="bg-seguranca-graphite/40 border-gray-700 text-white font-medium"
                />
              </div>
            </div>

            {/* Scope metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-blue-400" />
                  Qtd. Postos / Frentes
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.workPostCount}
                  onChange={(e) => setFormData({ ...formData, workPostCount: parseInt(e.target.value) || 1 })}
                  className="bg-seguranca-black/80 border-gray-700 text-white font-bold h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                  <Car className="h-3 w-3 text-amber-400" />
                  Qtd. Veículos
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.vehicleCount}
                  onChange={(e) => setFormData({ ...formData, vehicleCount: parseInt(e.target.value) || 0 })}
                  className="bg-seguranca-black/80 border-gray-700 text-white font-bold h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                  <Users className="h-3 w-3 text-emerald-400" />
                  Efetivo / Pessoal
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.headcount}
                  onChange={(e) => setFormData({ ...formData, headcount: parseInt(e.target.value) || 1 })}
                  className="bg-seguranca-black/80 border-gray-700 text-white font-bold h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-purple-400" />
                  Início Previsto
                </Label>
                <Input
                  type="date"
                  value={formData.targetStartDate}
                  onChange={(e) => setFormData({ ...formData, targetStartDate: e.target.value })}
                  className="bg-seguranca-black/80 border-gray-700 text-white font-bold h-9"
                />
              </div>
            </div>

            {/* Target sectors checklist */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-seguranca-yellow" />
                  Setores que Receberão o Alerta de Mobilização:
                </span>
                <span className="text-[11px] text-gray-400">
                  {formData.selectedSectors.length} de {AVAILABLE_SECTORS.length} selecionados
                </span>
              </Label>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {AVAILABLE_SECTORS.map((sector) => {
                  const Icon = sector.icon;
                  const isChecked = formData.selectedSectors.includes(sector.id);
                  return (
                    <div
                      key={sector.id}
                      onClick={() => handleToggleSector(sector.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? `${sector.color} shadow-sm`
                          : 'border-gray-800 bg-gray-900/30 opacity-60 hover:opacity-100 hover:border-gray-700'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleToggleSector(sector.id)}
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5" />
                          {sector.name}
                        </div>
                        <p className="text-[10px] text-gray-400 line-clamp-2 leading-tight">
                          {sector.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes & Briefing */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-300">
                Observações Adicionais & Requisitos Especiais da Proposta
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ex: Cliente exige vigilantes com CNH B e experiência em ambiente portuário; 2 viaturas 4x4 caracterizadas com rastreamento ativo..."
                className="bg-seguranca-graphite/40 border-gray-700 text-white min-h-[80px] text-xs"
              />
            </div>

            {/* Channels and alert preview */}
            <div className="p-3 bg-seguranca-yellow/10 border border-seguranca-yellow/30 rounded-xl flex items-start gap-3 text-xs text-amber-200">
              <AlertTriangle className="h-4 w-4 text-seguranca-yellow flex-shrink-0 mt-0.5" />
              <div>
                Ao clicar em <strong>Disparar Mobilização</strong>, o sistema enviará instantaneamente notificações via
                <strong> WebSocket (Painel em tempo real)</strong>, <strong>E-mails corporativos</strong> e
                <strong> WhatsApp</strong> para os responsáveis dos departamentos selecionados.
              </div>
            </div>

            <DialogFooter className="border-t border-gray-800 pt-4 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-seguranca-red to-orange-600 hover:from-seguranca-red/90 hover:to-orange-500 text-white font-bold shadow-lg shadow-seguranca-red/20 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-1">⏳</span>
                    Disparando Alertas...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Disparar Mobilização Multissetorial
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
