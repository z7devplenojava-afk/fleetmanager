import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Droplets, Plus, Trash2, Edit2, Loader2, Save, MapPin, Phone, Mail, DollarSign, Building2
} from 'lucide-react';
import { carWashService, CarWash } from '@/services/carWashService';

interface CarWashManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCarWash?: (carWash: CarWash) => void;
}

export const CarWashManagerModal: React.FC<CarWashManagerModalProps> = ({
  isOpen,
  onClose,
  onSelectCarWash,
}) => {
  const { toast } = useToast();
  const [carWashes, setCarWashes] = useState<CarWash[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Formulário de Cadastro / Edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [priceInternal, setPriceInternal] = useState('');
  const [priceExternal, setPriceExternal] = useState('');
  const [priceComplete, setPriceComplete] = useState('');
  const [priceSanitary, setPriceSanitary] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCarWashes = async () => {
    setIsLoading(true);
    try {
      const data = await carWashService.list();
      setCarWashes(data);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar lava-jatos cadastrados', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCarWashes();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCnpj('');
    setPhone('');
    setEmail('');
    setAddress('');
    setPriceInternal('');
    setPriceExternal('');
    setPriceComplete('');
    setPriceSanitary('');
    setNotes('');
  };

  const handleEdit = (cw: CarWash) => {
    setEditingId(cw.id);
    setName(cw.name || '');
    setCnpj(cw.cnpj || '');
    setPhone(cw.phone || '');
    setEmail(cw.email || '');
    setAddress(cw.address || '');
    setPriceInternal(cw.priceInternal != null ? cw.priceInternal.toString() : '');
    setPriceExternal(cw.priceExternal != null ? cw.priceExternal.toString() : '');
    setPriceComplete(cw.priceComplete != null ? cw.priceComplete.toString() : '');
    setPriceSanitary(cw.priceSanitary != null ? cw.priceSanitary.toString() : '');
    setNotes(cw.notes || '');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Atenção', description: 'Informe o nome do Lava-Jato / Prestador', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: Partial<CarWash> = {
        name: name.trim(),
        cnpj: cnpj.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        priceInternal: priceInternal ? parseFloat(priceInternal) : undefined,
        priceExternal: priceExternal ? parseFloat(priceExternal) : undefined,
        priceComplete: priceComplete ? parseFloat(priceComplete) : undefined,
        priceSanitary: priceSanitary ? parseFloat(priceSanitary) : undefined,
        notes: notes.trim() || undefined,
        active: true,
      };

      let saved: CarWash;
      if (editingId) {
        saved = await carWashService.update(editingId, payload);
        toast({ title: 'Sucesso', description: 'Lava-Jato atualizado com sucesso!' });
      } else {
        saved = await carWashService.create(payload);
        toast({ title: 'Sucesso', description: 'Lava-Jato cadastrado com sucesso!' });
      }

      resetForm();
      loadCarWashes();

      if (onSelectCarWash) {
        onSelectCarWash(saved);
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao salvar prestador', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este Lava-Jato cadastrado?')) return;
    try {
      await carWashService.delete(id);
      toast({ title: 'Sucesso', description: 'Lava-Jato removido' });
      loadCarWashes();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao remover prestador', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-h-[90vh] overflow-y-auto max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Droplets size={20} className="text-sky-400" /> Cadastro de Lava-Jatos e Prestadores Externos
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-3">
          {/* Formulário Coluna 1 (7 cols) */}
          <div className="md:col-span-7 space-y-3 bg-seguranca-black/40 p-4 rounded-xl border border-gray-700/60">
            <h3 className="text-sm font-semibold text-seguranca-yellow flex items-center gap-1.5 uppercase tracking-wide">
              {editingId ? <Edit2 size={15} /> : <Plus size={15} />}
              {editingId ? 'Editar Prestador' : 'Novo Lava-Jato / Prestador'}
            </h3>

            <div>
              <label className="text-xs text-gray-300 block mb-1 font-medium">Nome do Lava-Jato / Razão Social *</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex.: Lava-Jato Express Moeda"
                className="bg-seguranca-black border-gray-700 text-white text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-300 block mb-1">CNPJ (opcional)</label>
                <Input
                  value={cnpj}
                  onChange={e => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="bg-seguranca-black border-gray-700 text-white text-xs h-9"
                />
              </div>
              <div>
                <label className="text-xs text-gray-300 block mb-1">Telefone / WhatsApp</label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(31) 99999-0000"
                  className="bg-seguranca-black border-gray-700 text-white text-xs h-9"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-300 block mb-1">Endereço Completo</label>
              <Input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Av. Principal, 500 - Bairro Industrial"
                className="bg-seguranca-black border-gray-700 text-white text-xs h-9"
              />
            </div>

            {/* Tabela de Preços Acordados por Tipo */}
            <div className="pt-2 border-t border-gray-700/60 space-y-2">
              <span className="text-xs font-semibold text-sky-400 block uppercase">
                Valores Acordados por Tipo de Limpeza (R$)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gray-400 block">Externa (Carroceria)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={priceExternal}
                    onChange={e => setPriceExternal(e.target.value)}
                    placeholder="R$ 50,00"
                    className="bg-seguranca-black border-gray-700 text-white text-xs h-8"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block">Higienização Interna</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={priceInternal}
                    onChange={e => setPriceInternal(e.target.value)}
                    placeholder="R$ 80,00"
                    className="bg-seguranca-black border-gray-700 text-white text-xs h-8"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block">Completa (Int + Ext)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={priceComplete}
                    onChange={e => setPriceComplete(e.target.value)}
                    placeholder="R$ 120,00"
                    className="bg-seguranca-black border-gray-700 text-white text-xs h-8"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block">Descarte Sanitário</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={priceSanitary}
                    onChange={e => setPriceSanitary(e.target.value)}
                    placeholder="R$ 40,00"
                    className="bg-seguranca-black border-gray-700 text-white text-xs h-8"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="border-gray-700 text-gray-300 text-xs h-9 flex-1"
                >
                  Cancelar
                </Button>
              )}
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs h-9 flex-1 font-semibold"
              >
                {isSubmitting ? <Loader2 size={15} className="animate-spin mr-1" /> : <Save size={15} className="mr-1" />}
                {editingId ? 'Salvar Alterações' : 'Cadastrar Lava-Jato'}
              </Button>
            </div>
          </div>

          {/* Lista de Prestadores Cadastrados (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center justify-between uppercase tracking-wide">
              <span>Prestadores Cadastrados</span>
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                {carWashes.length}
              </Badge>
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-sky-400" size={24} />
              </div>
            ) : carWashes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border border-dashed border-gray-800 rounded-lg text-xs">
                Nenhum Lava-Jato cadastrado ainda.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {carWashes.map(cw => (
                  <div
                    key={cw.id}
                    className="bg-seguranca-black/60 p-3 rounded-lg border border-gray-800 hover:border-sky-500/50 transition-all flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-white text-xs truncate">{cw.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(cw)}
                            className="p-1 text-gray-400 hover:text-sky-400 transition-colors"
                            title="Editar prestador"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(cw.id)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            title="Remover prestador"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {cw.address && (
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-gray-500" /> {cw.address}
                        </p>
                      )}
                      {cw.phone && (
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone size={10} className="text-gray-500" /> {cw.phone}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px] bg-seguranca-black/80 p-2 rounded border border-gray-800/80">
                      <div><span className="text-gray-500">Externa:</span> <strong className="text-emerald-400">R$ {cw.priceExternal ?? '—'}</strong></div>
                      <div><span className="text-gray-500">Interna:</span> <strong className="text-emerald-400">R$ {cw.priceInternal ?? '—'}</strong></div>
                      <div><span className="text-gray-500">Completa:</span> <strong className="text-emerald-400">R$ {cw.priceComplete ?? '—'}</strong></div>
                      <div><span className="text-gray-500">Sanitário:</span> <strong className="text-emerald-400">R$ {cw.priceSanitary ?? '—'}</strong></div>
                    </div>

                    {onSelectCarWash && (
                      <Button
                        size="sm"
                        onClick={() => {
                          onSelectCarWash(cw);
                          onClose();
                        }}
                        className="w-full bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/40 text-[11px] h-7"
                      >
                        Selecionar para Solicitação
                      </Button>
                    )}
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
