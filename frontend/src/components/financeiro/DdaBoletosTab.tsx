import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, Landmark, CheckCircle2, AlertCircle, FilePlus, Link2, 
  Zap, Search, Sparkles, DollarSign, CalendarDays, ShieldCheck 
} from 'lucide-react';
import { contasAPagarService, DdaInvoice } from '@/services/contasAPagarService';
import BankCredentialsModal from './BankCredentialsModal';

export const DdaBoletosTab: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [ddaList, setDdaList] = useState<DdaInvoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const loadDdaInvoices = async () => {
    try {
      setLoading(true);
      const data = await contasAPagarService.getDdaInvoices();
      setDdaList(data || []);
    } catch (err) {
      console.error('Erro ao buscar boletos DDA:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDdaInvoices();
  }, []);

  const handleSyncDda = async () => {
    setSyncing(true);
    try {
      const updated = await contasAPagarService.syncDdaInvoices();
      setDdaList(updated || []);
      toast({
        title: 'Varredura DDA Concluída! 🚀',
        description: `Buscados ${updated?.length || 0} boletos emitidos contra a sua empresa no CIP/Bancos.`
      });
    } catch (err) {
      console.error('Erro ao sincronizar DDA:', err);
      toast({
        title: 'Erro na Busca DDA',
        description: 'Verifique se há credenciais bancárias ativas configuradas.',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleImportAsInvoice = async (ddaId: string) => {
    try {
      await contasAPagarService.importDdaAsInvoice(ddaId);
      toast({
        title: 'Boleto Importado!',
        description: 'O boleto DDA foi registrado no Contas a Pagar.'
      });
      loadDdaInvoices();
    } catch (err) {
      toast({ title: 'Erro ao Importar', description: 'Não foi possível converter o boleto em conta a pagar.', variant: 'destructive' });
    }
  };

  const handlePay1Click = async (ddaId: string) => {
    setPayingId(ddaId);
    try {
      const res = await contasAPagarService.payDdaInvoice(ddaId, 'PIX');
      if (res.success) {
        toast({
          title: 'Pagamento Realizado com Sucesso! ⚡',
          description: res.message || 'Comprovante Pix gerado e boleto liquidado via DDA.'
        });
        loadDdaInvoices();
      } else {
        toast({ title: 'Erro no Pagamento', description: res.message, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao processar pagamento via API.', variant: 'destructive' });
    } finally {
      setPayingId(null);
    }
  };

  const filteredDda = ddaList.filter(d => {
    const q = searchQuery.toLowerCase();
    return (
      (d.issuerName || '').toLowerCase().includes(q) ||
      (d.issuerCnpj || '').includes(q) ||
      (d.barcode || '').includes(q) ||
      (d.amount ? d.amount.toString() : '').includes(q)
    );
  });

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Banner / Header do DDA */}
      <div className="bg-gradient-to-r from-zinc-900 via-amber-950/30 to-zinc-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                <Landmark size={18} />
              </span>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                Débito Direto Autorizado (DDA) - CIP Bancária
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  Sincronização Automática
                </span>
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Todos os boletos emitidos por fornecedores contra o CNPJ da sua empresa são capturados via CIP sem necessidade de digitação.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => setCredentialsModalOpen(true)}
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 rounded-xl text-xs h-10"
            >
              <ShieldCheck className="text-amber-400 mr-1.5" size={15} />
              Configurar Credenciais Bancárias
            </Button>
            <Button
              onClick={handleSyncDda}
              disabled={syncing}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-xs h-10 px-4"
            >
              <RefreshCw className={`mr-1.5 size-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Buscando Boletos na CIP...' : 'Buscar Boletos DDA'}
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex items-center justify-between gap-4 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por Beneficiário, CNPJ ou Linha Digitável..."
            className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-100 rounded-xl text-xs h-9"
          />
        </div>

        <div className="text-xs text-zinc-400 font-mono">
          Exibindo <span className="text-amber-400 font-bold">{filteredDda.length}</span> boleto(s) DDA
        </div>
      </div>

      {/* Tabela de Boletos DDA */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-zinc-400">
            <RefreshCw className="animate-spin mx-auto text-amber-400 mb-2" size={24} />
            <p className="text-xs">Carregando boletos DDA da CIP...</p>
          </div>
        ) : filteredDda.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <AlertCircle className="mx-auto text-zinc-500 mb-2" size={28} />
            <p className="text-sm font-semibold text-zinc-300">Nenhum boleto DDA encontrado.</p>
            <p className="text-xs text-zinc-500 mt-1">
              Clique em "Buscar Boletos DDA" ou configure credenciais no botão acima.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase font-semibold">
                  <th className="p-3.5">Cedente / Beneficiário</th>
                  <th className="p-3.5">Emissão</th>
                  <th className="p-3.5">Vencimento</th>
                  <th className="p-3.5">Valor (R$)</th>
                  <th className="p-3.5">Status Conciliação</th>
                  <th className="p-3.5 text-right">Ações DDA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredDda.map((dda) => (
                  <tr key={dda.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-zinc-100 flex items-center gap-2">
                        {dda.issuerName}
                        {dda.nfeKey && (
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded">
                            Com NF-e
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        CNPJ: {dda.issuerCnpj}
                      </div>
                      {dda.barcode && (
                        <div className="text-[10px] text-zinc-400 font-mono truncate max-w-xs mt-0.5">
                          {dda.barcode}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-zinc-300 font-mono">
                      {new Date(dda.issueDate).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="p-3.5 font-mono font-bold text-amber-300">
                      {new Date(dda.dueDate).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="p-3.5 font-bold font-mono text-emerald-400 text-sm">
                      {formatBRL(dda.amount)}
                    </td>

                    <td className="p-3.5">
                      {dda.status === 'CONCILIADO' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px]">
                          <CheckCircle2 size={13} /> Conciliado no Contas a Pagar
                        </span>
                      ) : dda.status === 'PAGO' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold text-[11px]">
                          <Zap size={13} /> Liquidado via PIX
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold text-[11px]">
                          <AlertCircle size={13} /> Aguardando Importação/Vínculo
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {dda.status === 'NAO_CONCILIADO' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleImportAsInvoice(dda.id!)}
                              className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10 h-8 rounded-lg"
                            >
                              <FilePlus size={13} className="mr-1" /> Importar Conta
                            </Button>
                            <Button
                              size="sm"
                              disabled={payingId === dda.id}
                              onClick={() => handlePay1Click(dda.id!)}
                              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-8 rounded-lg"
                            >
                              {payingId === dda.id ? (
                                <RefreshCw className="animate-spin mr-1" size={13} />
                              ) : (
                                <Zap size={13} className="mr-1" />
                              )}
                              Pagar 1-Clique PIX
                            </Button>
                          </>
                        )}
                        {dda.status === 'CONCILIADO' && (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                            <Link2 size={13} /> Vinculado
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Configuração de Credenciais */}
      <BankCredentialsModal
        open={credentialsModalOpen}
        onOpenChange={setCredentialsModalOpen}
      />
    </div>
  );
};

export default DdaBoletosTab;
