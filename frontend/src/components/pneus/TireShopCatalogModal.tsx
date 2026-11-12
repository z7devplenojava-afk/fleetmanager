import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import tireShopService, { TireShopCatalogItem } from '@/services/tireShopService';
import { Check, Edit2, Plus, Trash2, Wrench } from 'lucide-react';

interface TireShopCatalogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCreated?: (item: TireShopCatalogItem) => void;
}

export const TireShopCatalogModal: React.FC<TireShopCatalogModalProps> = ({
  open,
  onOpenChange,
  onSelectCreated,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingItem, setEditingItem] = useState<TireShopCatalogItem | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [defaultPrice, setDefaultPrice] = useState<number>(0);
  const [requiresPickup, setRequiresPickup] = useState(false);
  const [description, setDescription] = useState('');

  const { data: catalog = [], isLoading } = useQuery({
    queryKey: ['tire-shop-catalog'],
    queryFn: tireShopService.getCatalog,
    enabled: open,
    staleTime: 30_000,
  });

  const resetForm = () => {
    setEditingItem(null);
    setName('');
    setCode('');
    setDefaultPrice(0);
    setRequiresPickup(false);
    setDescription('');
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Informe o nome do serviço de borracharia.');
      const payload = {
        name: name.trim(),
        code: code.trim() || undefined,
        defaultPrice: Number(defaultPrice) || 0,
        requiresPickup,
        description: description.trim() || undefined,
      };
      if (editingItem?.id) {
        return tireShopService.updateCatalogItem(editingItem.id, payload);
      }
      return tireShopService.createCatalogItem(payload);
    },
    onSuccess: (saved) => {
      toast({
        title: editingItem ? 'Serviço atualizado!' : 'Serviço cadastrado na tabela!',
      });
      queryClient.invalidateQueries({ queryKey: ['tire-shop-catalog'] });
      if (!editingItem && onSelectCreated) {
        onSelectCreated(saved);
      }
      resetForm();
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao salvar serviço',
        description: err?.response?.data?.message || err?.message || 'Falha ao salvar.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tireShopService.deleteCatalogItem(id),
    onSuccess: () => {
      toast({ title: 'Serviço removido da tabela.' });
      queryClient.invalidateQueries({ queryKey: ['tire-shop-catalog'] });
    },
  });

  const startEdit = (item: TireShopCatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setCode(item.code || '');
    setDefaultPrice(Number(item.defaultPrice) || 0);
    setRequiresPickup(Boolean(item.requiresPickup));
    setDescription(item.description || '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[88vh] overflow-y-auto bg-seguranca-graphite border-gray-700 text-white p-4 sm:p-6 z-[10120]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-seguranca-yellow">
            <Wrench className="h-5 w-5" />
            Tabela de Serviços de Borracharia
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-300">
            Cadastre e padronize os serviços de borracharia e recapagem usados nos lançamentos financeiros e nas listas de coleta para fornecedores.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="rounded-xl border border-gray-700 bg-seguranca-black/60 p-3.5 space-y-3"
        >
          <div className="text-xs font-bold text-white uppercase tracking-wide">
            {editingItem ? `Editando: ${editingItem.name}` : 'Novo Serviço na Tabela'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="space-y-1">
              <Label className="text-xs text-gray-200">Código</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: BOR-007"
                className="bg-seguranca-black border-gray-600 font-mono text-xs text-white h-9"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs text-gray-200">Nome do Serviço *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex: Recapagem Borrachudo 295/80"
                className="bg-seguranca-black border-gray-600 text-xs text-white h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-200">Valor Ref. (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(Number(e.target.value))}
                className="bg-seguranca-black border-gray-600 font-mono text-xs text-white h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição técnica opcional..."
              className="bg-seguranca-black border-gray-600 text-xs text-white h-9"
            />
            <label className="flex items-center gap-2 text-xs text-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresPickup}
                onChange={(e) => setRequiresPickup(e.target.checked)}
                className="h-4 w-4 accent-amber-400"
              />
              Serviço externo / exige coleta do fornecedor
            </label>
          </div>

          <div className="flex justify-end gap-2">
            {editingItem && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={resetForm}
                className="border-gray-600 text-gray-200 text-xs h-8"
              >
                Cancelar Edição
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={saveMutation.isPending}
              className="bg-seguranca-yellow hover:bg-amber-400 text-black font-bold text-xs h-8"
            >
              {editingItem ? <Check className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
              {saveMutation.isPending ? 'Salvando...' : editingItem ? 'Atualizar Serviço' : 'Adicionar à Tabela'}
            </Button>
          </div>
        </form>

        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {isLoading ? (
            <p className="text-xs text-gray-400 text-center py-6">Carregando tabela...</p>
          ) : catalog.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Nenhum serviço cadastrado ainda.</p>
          ) : (
            catalog.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-gray-700 bg-seguranca-black/50 p-2.5 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.code && (
                      <span className="font-mono text-[11px] font-bold text-seguranca-yellow">
                        {item.code}
                      </span>
                    )}
                    <span className="font-semibold text-white">{item.name}</span>
                    {item.requiresPickup && (
                      <Badge className="bg-amber-950/70 text-amber-300 border border-amber-600/50 text-[10px] py-0">
                        Coleta Fornecedor
                      </Badge>
                    )}
                    {Number(item.defaultPrice || 0) > 0 && (
                      <span className="font-mono text-emerald-300 text-[11px]">
                        R$ {Number(item.defaultPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(item)}
                    className="h-7 w-7 p-0 text-amber-300 hover:bg-amber-500/20"
                    title="Editar serviço"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Desativar o serviço "${item.name}"?`)) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/20"
                    title="Remover serviço"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="border-t border-gray-700 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-600 text-gray-200 text-xs"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

