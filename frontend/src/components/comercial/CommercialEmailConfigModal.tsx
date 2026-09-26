import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import commercialEmailService, { CommercialEmailConfig } from '@/services/commercialEmailService';
import {
  Mail,
  Server,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Info
} from 'lucide-react';

interface CommercialEmailConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigSaved?: () => void;
}

export const CommercialEmailConfigModal: React.FC<CommercialEmailConfigModalProps> = ({
  open,
  onOpenChange,
  onConfigSaved
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ ok?: boolean; message?: string } | null>(null);

  const [formData, setFormData] = useState<CommercialEmailConfig>({
    emailAddress: 'comercialvss@viacaosaosilvestre.com.br',
    displayName: 'Comercial Viação São Silvestre',
    username: 'comercialvss@viacaosaosilvestre.com.br',
    password: 'Comerci@l2026',
    imapHost: 'mail.viacaosaosilvestre.com.br',
    imapPort: 993,
    imapSsl: true,
    smtpHost: 'mail.viacaosaosilvestre.com.br',
    smtpPort: 465,
    smtpSsl: true,
  });

  useEffect(() => {
    if (open) {
      setLoading(true);
      setTestResult(null);
      commercialEmailService.getConfig()
        .then((cfg) => {
          if (cfg) {
            setFormData({
              ...cfg,
              emailAddress: cfg.emailAddress || 'comercialvss@viacaosaosilvestre.com.br',
              displayName: cfg.displayName || 'Comercial Viação São Silvestre',
              username: cfg.username || cfg.emailAddress || 'comercialvss@viacaosaosilvestre.com.br',
              password: cfg.password || 'Comerci@l2026',
              imapHost: cfg.imapHost || 'mail.viacaosaosilvestre.com.br',
              imapPort: cfg.imapPort || 993,
              imapSsl: cfg.imapSsl ?? true,
              smtpHost: cfg.smtpHost || 'mail.viacaosaosilvestre.com.br',
              smtpPort: cfg.smtpPort || 465,
              smtpSsl: cfg.smtpSsl ?? true,
            });
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleChange = (field: keyof CommercialEmailConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await commercialEmailService.testConnection(formData);
      setTestResult({
        ok: res.ok !== false,
        message: res.message || 'Conexão IMAP/SMTP validada com sucesso com os servidores da São Silvestre!'
      });
      if (res.ok !== false) {
        toast({
          title: 'Conexão Bem-Sucedida',
          description: 'Servidor de entrada e saída responderam positivamente.',
        });
      } else {
        toast({
          title: 'Falha na Conexão',
          description: res.message || 'Não foi possível autenticar no servidor.',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Erro ao testar conexão';
      setTestResult({ ok: false, message: msg });
      toast({
        title: 'Erro de Conexão',
        description: msg,
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await commercialEmailService.saveConfig(formData);
      toast({
        title: 'Configuração Salva',
        description: 'Credenciais do e-mail comercial salvas e ativas para sincronização de cotações.',
      });
      if (onConfigSaved) onConfigSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Erro ao Salvar',
        description: err.response?.data?.message || 'Falha ao salvar configurações',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/10 border border-red-600/30 rounded-xl text-red-500">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <span>Configuração do E-mail Comercial</span>
                <Badge variant="outline" className="border-red-500/40 text-red-400 text-xs">
                  IMAP / SMTP
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-0.5">
                Gerencie as credenciais corporativas para captura automática e monitoramento de cotações de transporte.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
            <p className="text-xs text-slate-400">Carregando configurações do servidor...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 py-2">
            {/* Informações da Conta */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-red-400" />
                Credenciais da Conta Comercial
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">E-mail Comercial</Label>
                  <Input
                    value={formData.emailAddress}
                    onChange={(e) => handleChange('emailAddress', e.target.value)}
                    placeholder="comercialvss@viacaosaosilvestre.com.br"
                    className="bg-slate-950 border-slate-700 text-xs h-9 text-slate-100"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Nome de Exibição</Label>
                  <Input
                    value={formData.displayName || ''}
                    onChange={(e) => handleChange('displayName', e.target.value)}
                    placeholder="Comercial Viação São Silvestre"
                    className="bg-slate-950 border-slate-700 text-xs h-9 text-slate-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Usuário de Login (IMAP/SMTP)</Label>
                  <Input
                    value={formData.username || ''}
                    onChange={(e) => handleChange('username', e.target.value)}
                    placeholder="comercialvss@viacaosaosilvestre.com.br"
                    className="bg-slate-950 border-slate-700 text-xs h-9 text-slate-100"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Senha</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password || ''}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="••••••••••••"
                      className="bg-slate-950 border-slate-700 text-xs h-9 text-slate-100 pr-9"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Servidores de Conexão */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Server className="h-4 w-4 text-emerald-400" />
                Servidores de Entrada & Saída
              </h4>

              {/* IMAP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pb-3 border-b border-slate-800/80">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs text-slate-300">Servidor de Entrada (IMAP)</Label>
                  <Input
                    value={formData.imapHost}
                    onChange={(e) => handleChange('imapHost', e.target.value)}
                    placeholder="mail.viacaosaosilvestre.com.br"
                    className="bg-slate-950 border-slate-700 text-xs h-9 text-slate-100"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 space-y-1.5">
                    <Label className="text-xs text-slate-300">Porta</Label>
                    <Input
                      type="number"
                      value={formData.imapPort}
                      onChange={(e) => handleChange('imapPort', Number(e.target.value))}
                      className="bg-slate-950 border-slate-700 text-xs h-9 text-slate-100"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-1.5 pt-6">
                    <Switch
                      checked={formData.imapSsl}
                      onCheckedChange={(val) => handleChange('imapSsl', val)}
                    />
                    <span className="text-[11px] text-slate-400 font-medium">SSL</span>
                  </div>
                </div>
              </div>

              {/* SMTP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs text-slate-300">Servidor de Saída (SMTP)</Label>
                  <Input
                    value={formData.smtpHost || ''}
                    onChange={(e) => handleChange('smtpHost', e.target.value)}
                    placeholder="mail.viacaosaosilvestre.com.br"
                    className="bg-slate-950 border-slate-700 text-xs h-9 text-slate-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 space-y-1.5">
                    <Label className="text-xs text-slate-300">Porta</Label>
                    <Input
                      type="number"
                      value={formData.smtpPort || 465}
                      onChange={(e) => handleChange('smtpPort', Number(e.target.value))}
                      className="bg-slate-950 border-slate-700 text-xs h-9 text-slate-100"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 pt-6">
                    <Switch
                      checked={formData.smtpSsl ?? true}
                      onCheckedChange={(val) => handleChange('smtpSsl', val)}
                    />
                    <span className="text-[11px] text-slate-400 font-medium">SSL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback de Teste */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.ok
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{testResult.ok ? 'Servidor Conectado' : 'Falha na Validação'}</p>
                  <p className="text-[11px] opacity-90 mt-0.5">{testResult.message}</p>
                </div>
              </div>
            )}

            {/* Status da Última Sincronização */}
            {formData.lastSyncAt && (
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-400" />
                  <span>Última sincronização: <strong>{new Date(formData.lastSyncAt).toLocaleString('pt-BR')}</strong></span>
                </div>
                <Badge variant="outline" className="border-slate-700 text-[10px]">
                  {formData.lastSyncTotal || 0} e-mails lidos
                </Badge>
              </div>
            )}

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-9 rounded-xl"
              >
                Cancelar
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs h-9 rounded-xl gap-1.5"
                >
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Testar Conexão
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-9 rounded-xl shadow-lg shadow-red-600/20"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                  Salvar Credenciais
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CommercialEmailConfigModal;
