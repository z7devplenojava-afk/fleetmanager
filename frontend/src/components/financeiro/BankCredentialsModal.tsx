import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, ShieldCheck, Landmark, CheckCircle2, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { contasAPagarService, BankCredential } from '@/services/contasAPagarService';

interface BankCredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BankCredentialsModal: React.FC<BankCredentialsModalProps> = ({
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<BankCredential[]>([]);
  
  // Form State
  const [bankCode, setBankCode] = useState<string>('077');
  const [bankName, setBankName] = useState<string>('Banco Inter');
  const [clientId, setClientId] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [pixKey, setPixKey] = useState<string>('');
  const [environment, setEnvironment] = useState<string>('SANDBOX');
  const [certificatePem, setCertificatePem] = useState<string>('');

  const bankOptions = [
    { code: '077', name: 'Banco Inter', label: 'Banco Inter (DDA + API Pix)' },
    { code: '403', name: 'Cora Sociedade de Crédito', label: 'Cora (DDA + Extrato Direct API)' },
    { code: '341', name: 'Itaú Unibanco', label: 'Itaú Unibanco (DDA CIP)' },
    { code: '001', name: 'Banco do Brasil', label: 'Banco do Brasil (DDA Open Finance)' },
    { code: 'MOCK_CIP', name: 'Simulador DDA (Demonstração)', label: '🧪 Simulador DDA Teste Sandbox' }
  ];

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const data = await contasAPagarService.getBankCredentials();
      setCredentials(data || []);
    } catch (err) {
      console.error('Erro ao carregar credenciais bancárias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadCredentials();
    }
  }, [open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim()) {
      toast({ title: 'Atenção', description: 'Informe o Client ID ou identificador da chave.', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      await contasAPagarService.saveBankCredential({
        bankCode,
        bankName,
        clientId,
        clientSecret,
        pixKey,
        environment,
        certificatePem,
        active: true
      });
      toast({
        title: 'Credencial Salva com Sucesso!',
        description: `Credencial bancária para ${bankName} configurada e pronta para busca de DDA.`
      });
      setClientId('');
      setClientSecret('');
      setPixKey('');
      setCertificatePem('');
      loadCredentials();
    } catch (err) {
      console.error('Erro ao salvar credencial bancária:', err);
      toast({ title: 'Erro ao Salvar', description: 'Não foi possível salvar a credencial bancária.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const res = await contasAPagarService.testBankConnection(id);
      if (res.success) {
        toast({
          title: 'Conexão Estabelecida com Sucesso! 🟢',
          description: res.message || 'API Bancária autenticada e DDA operacional.'
        });
      } else {
        toast({
          title: 'Erro na Conexão',
          description: res.message || 'Falha ao autenticar na API Bancária.',
          variant: 'destructive'
        });
      }
      loadCredentials();
    } catch (err) {
      toast({ title: 'Erro de Teste', description: 'Falha na comunicação com o servidor bancário.', variant: 'destructive' });
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await contasAPagarService.deleteBankCredential(id);
      toast({ title: 'Credencial Removida', description: 'A integração bancária foi desativada.' });
      loadCredentials();
    } catch (err) {
      toast({ title: 'Erro ao Excluir', description: 'Não foi possível remover a credencial.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border border-zinc-700/80 shadow-2xl text-zinc-100 rounded-2xl p-6">
        <DialogHeader className="pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Landmark size={22} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                Integrações Bancárias & Motor DDA
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  CIP Nacional / Open Finance
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                Cadastre suas credenciais do Banco Inter, Cora, Itaú, BB ou ative o Simulador DDA para listar boletos emitidos contra o CNPJ da empresa.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-3">
          {/* Formulário de Adicionar Nova Credencial */}
          <form onSubmit={handleSave} className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-4">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound size={14} /> Cadastrar Nova Credencial Bancária
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase">Instituição Bancária *</label>
                <Select
                  value={bankCode}
                  onValueChange={(code) => {
                    setBankCode(code);
                    const b = bankOptions.find(opt => opt.code === code);
                    setBankName(b ? b.name : 'Banco');
                  }}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    {bankOptions.map(b => (
                      <SelectItem key={b.code} value={b.code} className="hover:bg-zinc-800">
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase">Ambiente *</label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectItem value="SANDBOX">🧪 Sandbox / Homologação (Testes)</SelectItem>
                    <SelectItem value="PRODUCTION">🚀 Produção (API Real)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase">Client ID / App Key *</label>
                <Input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="ID da aplicação no portal de desenvolvedor..."
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 rounded-xl h-10 font-mono text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase">Client Secret (Criptografado)</label>
                <Input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 rounded-xl h-10 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 uppercase">Chave PIX da Empresa (opcional)</label>
                <Input
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="CNPJ, E-mail ou Chave Aleatória PIX..."
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 rounded-xl h-10 font-mono text-xs"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl h-10"
                >
                  {loading ? 'Salvando...' : 'Salvar Credencial Bancária'}
                </Button>
              </div>
            </div>
          </form>

          {/* Lista de Credenciais Cadastradas */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span>Credenciais Configuradas ({credentials.length})</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadCredentials}
                className="text-xs text-amber-400 hover:text-amber-300 h-7 px-2"
              >
                <RefreshCw size={12} className="mr-1" /> Atualizar Lista
              </Button>
            </div>

            {credentials.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/30">
                <AlertCircle className="mx-auto text-zinc-500 mb-2" size={24} />
                <p className="text-xs text-zinc-400">Nenhuma integração bancária cadastrada para a empresa atual.</p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Cadastre o Simulador DDA (Demonstração) para testar a busca automática de boletos CIP.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {credentials.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                        {c.bankCode}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                          {c.bankName}
                          <span className={`text-[10px] px-2 py-0.2 rounded border font-mono ${c.environment === 'PRODUCTION' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'}`}>
                            {c.environment}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 flex items-center gap-3 mt-0.5">
                          <span>Client ID: <code className="text-zinc-300">{c.clientId}</code></span>
                          {c.lastSyncAt && (
                            <span className="text-zinc-500">
                              Último DDA: {new Date(c.lastSyncAt).toLocaleString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={testingId === c.id}
                        onClick={() => handleTestConnection(c.id!)}
                        className="text-xs border-zinc-700 text-zinc-200 hover:bg-zinc-800 h-8 rounded-lg"
                      >
                        {testingId === c.id ? (
                          <RefreshCw className="animate-spin text-amber-400 mr-1" size={13} />
                        ) : (
                          <ShieldCheck className="text-emerald-400 mr-1" size={14} />
                        )}
                        Testar Conexão
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(c.id!)}
                        className="text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8 p-0 rounded-lg"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BankCredentialsModal;
