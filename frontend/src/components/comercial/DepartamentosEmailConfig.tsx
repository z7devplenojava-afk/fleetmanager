import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Settings, Mail, Save, Building2, Users, UserCheck, DollarSign } from 'lucide-react';
import { DepartamentoConfig } from '@/services/notificationService';

interface DepartamentosEmailConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DepartamentosEmailConfig: React.FC<DepartamentosEmailConfigProps> = ({
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<DepartamentoConfig>({
    operacional: 'operacional@empresa.com',
    pessoal: 'pessoal@empresa.com',
    rh: 'rh@empresa.com',
    financeiro: 'financeiro@empresa.com'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Carregar configuração salva
    const saved = localStorage.getItem('departamentosConfig');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  }, []);

  const handleSave = async () => {
    // Validar emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emails = Object.values(config);
    
    for (const email of emails) {
      if (!email || !emailRegex.test(email)) {
        toast({
          title: 'Email Inválido',
          description: 'Por favor, insira emails válidos para todos os departamentos.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      // Salvar configuração
      localStorage.setItem('departamentosConfig', JSON.stringify(config));
      
      toast({
        title: 'Configuração Salva!',
        description: 'Emails dos departamentos atualizados com sucesso.',
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a configuração.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof DepartamentoConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const departamentos = [
    {
      key: 'operacional' as keyof DepartamentoConfig,
      label: 'Operacional',
      icon: Building2,
      description: 'Recebe notificações sobre novos contratos e ações operacionais'
    },
    {
      key: 'pessoal' as keyof DepartamentoConfig,
      label: 'Departamento Pessoal',
      icon: Users,
      description: 'Recebe notificações sobre gestão de pessoal e recursos humanos'
    },
    {
      key: 'rh' as keyof DepartamentoConfig,
      label: 'Recursos Humanos',
      icon: UserCheck,
      description: 'Recebe notificações sobre compliance e políticas de RH'
    },
    {
      key: 'financeiro' as keyof DepartamentoConfig,
      label: 'Financeiro',
      icon: DollarSign,
      description: 'Recebe notificações sobre gestão financeira e contábil'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração de Emails dos Departamentos
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure os emails dos departamentos para receber notificações automáticas sobre novos contratos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4">
            {departamentos.map((dept) => {
              const IconComponent = dept.icon;
              return (
                <Card key={dept.key} className="bg-seguranca-black border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-seguranca-lightgray flex items-center gap-2 text-sm">
                      <IconComponent className="h-4 w-4" />
                      {dept.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={dept.key} className="text-seguranca-lightgray text-sm">
                        Email do {dept.label}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id={dept.key}
                          type="email"
                          value={config[dept.key]}
                          onChange={(e) => handleInputChange(dept.key, e.target.value)}
                          className="pl-10 bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
                          placeholder={`${dept.label.toLowerCase()}@empresa.com`}
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        {dept.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="bg-seguranca-yellow/10 border border-seguranca-yellow/20 rounded-lg p-4">
            <h4 className="font-medium text-seguranca-yellow mb-2">Informações Importantes</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Todos os departamentos receberão notificações quando um novo contrato for registrado</li>
              <li>• As notificações incluem detalhes do contrato e ações específicas para cada departamento</li>
              <li>• Os emails devem ser válidos e acessíveis pelos respectivos departamentos</li>
              <li>• As configurações são salvas localmente no navegador</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Salvando...' : 'Salvar Configuração'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepartamentosEmailConfig; 