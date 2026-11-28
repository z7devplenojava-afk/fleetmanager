import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import api from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  onAccepted: () => void;
}

/** LGPD: aceite específico para criação de e-mail profissional. */
export const ProfessionalEmailConsentModal: React.FC<Props> = ({ open, onClose, onAccepted }) => {
  const { toast } = useToast();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAccept = async () => {
    if (!accepted) return;
    setSaving(true);
    try {
      await api.post('/lgpd/consent', {
        consentType: 'PROFESSIONAL_EMAIL',
        termVersion: '1.0',
        latitude: null,
        longitude: null,
      });
      toast({ title: 'Consentimento registrado', description: 'Você já pode criar a caixa profissional.' });
      onAccepted();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar consentimento',
        description: error?.response?.data?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-seguranca-graphite border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Uso profissional de e-mail — LGPD</DialogTitle>
          <DialogDescription className="text-gray-400">
            Antes de criar uma caixa de e-mail corporativo, leia e aceite as condições abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-gray-300">
          <p>A caixa de e-mail é destinada exclusivamente a atividades profissionais da empresa.</p>
          <p>É permitido o monitoramento de segurança (antivírus, anti-phishing, retenção de logs) para proteger o sistema e os dados da empresa.</p>
          <p>É proibido usar a caixa para atividades pessoais, fins ilícitos ou envio de marketing não solicitado.</p>
          <p>Os e-mails e anexos podem ser arquivados e incluídos em rotinas de backup da empresa.</p>
        </div>

        <label className="flex items-start gap-3 pt-2 cursor-pointer">
          <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(Boolean(v))} />
          <span className="text-sm">Li e aceito as condições de uso profissional de e-mail (versão 1.0).</span>
        </label>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAccept} disabled={!accepted || saving}>
            {saving ? 'Registrando...' : 'Aceitar e continuar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
