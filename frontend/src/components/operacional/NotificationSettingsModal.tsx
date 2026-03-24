import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Mail,
  Moon,
  Shield,
  Users,
  Calendar,
  AlertTriangle,
  FileText,
  Car,
  Clock,
  MapPin,
  Save,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export interface NotificationSettings {
  // Tipos de notificações
  equipamentos: boolean;
  escalas: boolean;
  ocorrencias: boolean;
  visitas: boolean;
  plantao: boolean;
  transporte: boolean;
  atividades: boolean;
  sistema: boolean;
  
  // Canais
  inApp: boolean;
  email: boolean;
  
  // Preferências
  naoPerturbe: boolean;
  naoPerturbeInicio: string;
  naoPerturbeFim: string;
  
  // Prioridade mínima
  apenasUrgentes: boolean;
}

const defaultSettings: NotificationSettings = {
  equipamentos: true,
  escalas: true,
  ocorrencias: true,
  visitas: true,
  plantao: true,
  transporte: true,
  atividades: true,
  sistema: true,
  inApp: true,
  email: false,
  naoPerturbe: false,
  naoPerturbeInicio: '22:00',
  naoPerturbeFim: '07:00',
  apenasUrgentes: false,
};

interface NotificationSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const { toast } = useToast();

  // Carregar configurações do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    toast({
      title: '✅ Configurações salvas',
      description: 'Suas preferências de notificação foram atualizadas.',
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast({
      title: '🔄 Configurações redefinidas',
      description: 'As configurações padrão foram restauradas.',
    });
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateTimeRange = (field: 'naoPerturbeInicio' | 'naoPerturbeFim', value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const notificationTypes = [
    { key: 'equipamentos' as const, label: 'Equipamentos', icon: Shield, color: 'text-blue-500' },
    { key: 'escalas' as const, label: 'Escalas', icon: Calendar, color: 'text-green-500' },
    { key: 'ocorrencias' as const, label: 'Ocorrências', icon: AlertTriangle, color: 'text-red-500' },
    { key: 'visitas' as const, label: 'Visitas', icon: MapPin, color: 'text-purple-500' },
    { key: 'plantao' as const, label: 'Troca de Plantão', icon: Clock, color: 'text-orange-500' },
    { key: 'transporte' as const, label: 'Transporte', icon: Car, color: 'text-indigo-500' },
    { key: 'atividades' as const, label: 'Atividades', icon: FileText, color: 'text-teal-500' },
    { key: 'sistema' as const, label: 'Sistema', icon: Bell, color: 'text-gray-500' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configurações de Notificações
          </DialogTitle>
          <DialogDescription>
            Personalize como você deseja receber alertas e notificações do sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tipos de Notificações */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Tipos de Notificações
            </h3>
            <div className="space-y-3">
              {notificationTypes.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <Label htmlFor={key} className="cursor-pointer font-medium">
                      {label}
                    </Label>
                  </div>
                  <Switch
                    id={key}
                    checked={settings[key]}
                    onCheckedChange={() => toggleSetting(key)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Canais de Comunicação */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Canais de Comunicação
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-blue-500" />
                  <div>
                    <Label htmlFor="inApp" className="cursor-pointer font-medium">
                      Notificações In-App
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receber alertas dentro do sistema
                    </p>
                  </div>
                </div>
                <Switch
                  id="inApp"
                  checked={settings.inApp}
                  onCheckedChange={() => toggleSetting('inApp')}
                />
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-green-500" />
                  <div>
                    <Label htmlFor="email" className="cursor-pointer font-medium">
                      E-mail
                      <Badge variant="outline" className="ml-2 text-xs">Em breve</Badge>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receber cópia por e-mail
                    </p>
                  </div>
                </div>
                <Switch
                  id="email"
                  checked={settings.email}
                  onCheckedChange={() => toggleSetting('email')}
                  disabled
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Modo Não Perturbe */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Modo Não Perturbe
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div>
                  <Label htmlFor="naoPerturbe" className="cursor-pointer font-medium">
                    Ativar Não Perturbe
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Silenciar notificações em horários específicos
                  </p>
                </div>
                <Switch
                  id="naoPerturbe"
                  checked={settings.naoPerturbe}
                  onCheckedChange={() => toggleSetting('naoPerturbe')}
                />
              </div>

              {settings.naoPerturbe && (
                <div className="pl-4 space-y-2 animate-in fade-in-50 duration-200">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor="inicio" className="text-xs text-muted-foreground">
                        Início
                      </Label>
                      <input
                        id="inicio"
                        type="time"
                        value={settings.naoPerturbeInicio}
                        onChange={(e) => updateTimeRange('naoPerturbeInicio', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-background border rounded-md"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="fim" className="text-xs text-muted-foreground">
                        Fim
                      </Label>
                      <input
                        id="fim"
                        type="time"
                        value={settings.naoPerturbeFim}
                        onChange={(e) => updateTimeRange('naoPerturbeFim', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-background border rounded-md"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    💡 Notificações críticas sempre serão exibidas
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Prioridade */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Filtros de Prioridade
            </h3>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div>
                <Label htmlFor="apenasUrgentes" className="cursor-pointer font-medium">
                  Apenas Urgentes
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receber somente notificações de alta prioridade
                </p>
              </div>
              <Switch
                id="apenasUrgentes"
                checked={settings.apenasUrgentes}
                onCheckedChange={() => toggleSetting('apenasUrgentes')}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Redefinir
          </Button>
          <Button
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettingsModal;

