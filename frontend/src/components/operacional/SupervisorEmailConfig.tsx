import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Settings, Mail, Save } from 'lucide-react';

interface SupervisorEmailConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SupervisorEmailConfig: React.FC<SupervisorEmailConfigProps> = ({
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('supervisor.operacional@empresa.com');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Email Inválido',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Salvar configuração no localStorage (em produção, seria no backend)
      localStorage.setItem('supervisorEmail', email);
      
      toast({
        title: 'Configuração Salva!',
        description: 'Email do supervisor atualizado com sucesso.',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração de Email do Supervisor
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure o email do supervisor de Operacional para receber notificações de advertências.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supervisorEmail" className="text-seguranca-lightgray">
              Email do Supervisor de Operacional
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="supervisorEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                placeholder="supervisor.operacional@empresa.com"
              />
            </div>
            <p className="text-xs text-gray-400">
              Este email receberá notificações automáticas quando funcionários atingirem 3 advertências.
            </p>
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
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupervisorEmailConfig; 