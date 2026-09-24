import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Plus,
  History,
  Award,
  AlertTriangle,
  UserPlus,
  MapPin,
  CalendarDays,
  Trash2,
} from 'lucide-react';
import { Employee, EmployeeHistoryItem } from '@/types/employee';
import { employeeHistoryService } from '@/services/employeeHistoryService';
import { useToast } from '@/hooks/use-toast';

interface EmployeeHistoryTimelineProps {
  employee: Employee | null;
}

const typeConfig: Record<
  EmployeeHistoryItem['type'],
  { label: string; color: string; icon: React.ReactNode }
> = {
  admissao: {
    label: 'Admissão',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: <UserPlus className="h-3.5 w-3.5" />,
  },
  remanejamento: {
    label: 'Remanejamento',
    color: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    icon: <MapPin className="h-3.5 w-3.5" />,
  },
  premiacao: {
    label: 'Premiação',
    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    icon: <Award className="h-3.5 w-3.5" />,
  },
  advertencia: {
    label: 'Advertência',
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  falta: {
    label: 'Falta',
    color: 'bg-red-500/20 text-red-300 border-red-500/30',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  afastamento: {
    label: 'Afastamento',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: <CalendarDays className="h-3.5 w-3.5" />,
  },
};

export const EmployeeHistoryTimeline: React.FC<EmployeeHistoryTimelineProps> = ({ employee }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<EmployeeHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState<EmployeeHistoryItem['type']>('admissao');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newDescription, setNewDescription] = useState('');

  const load = async () => {
    if (!employee?.id) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await employeeHistoryService.getHistory(employee);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [employee?.id, employee?.status, employee?.updatedAt]);

  const handleAdd = async () => {
    if (!employee?.id || !newDescription.trim() || !newDate) return;
    try {
      await employeeHistoryService.addItem(employee.id, {
        type: newType,
        date: newDate,
        description: newDescription.trim(),
      });
      setNewDescription('');
      setShowForm(false);
      await load();
      toast({ title: 'Item adicionado', description: 'Histórico atualizado.' });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o item ao histórico.',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!employee?.id) return;
    await employeeHistoryService.removeItem(employee.id, itemId);
    await load();
  };

  if (!employee?.id) {
    return (
      <div className="text-center py-10 text-gray-400">
        <History className="mx-auto h-10 w-10 mb-3 opacity-50" />
        <p>Salve o funcionário para visualizar o histórico.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-seguranca-yellow" />
          <h3 className="font-semibold text-white">Histórico do Funcionário</h3>
          <Badge className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
            {items.length}
          </Badge>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowForm(v => !v)}
          className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite"
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo item
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-600 bg-seguranca-black/40 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">Tipo</Label>
            <Select value={newType} onValueChange={v => setNewType(v as EmployeeHistoryItem['type'])}>
              <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600">
                {Object.entries(typeConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key} className="text-seguranca-lightgray">
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">Data</Label>
            <Input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label className="text-xs text-gray-400">Descrição</Label>
            <div className="flex gap-2">
              <Input
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Ex: Remanejamento para posto X"
                className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
              />
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!newDescription.trim()}
                className="bg-seguranca-red hover:bg-seguranca-darkred text-white"
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando histórico...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-gray-500 border border-dashed border-gray-600 rounded-lg">
          Nenhum evento no histórico.
        </div>
      ) : (
        <ol className="relative border-l border-gray-600/60 ml-3 space-y-5">
          {items.map(item => {
            const cfg = typeConfig[item.type] || typeConfig.afastamento;
            return (
              <li key={item.id} className="ml-4">
                <span className="absolute -left-[7px] mt-1.5 h-3.5 w-3.5 rounded-full bg-seguranca-red border border-seguranca-yellow/40" />
                <div className="rounded-lg border border-gray-600/50 bg-seguranca-black/40 p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`${cfg.color} px-2 py-0.5 border text-xs inline-flex items-center gap-1`}>
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {item.date
                          ? new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR')
                          : '—'}
                      </span>
                    </div>
                    <p className="text-sm text-seguranca-lightgray mt-1.5">{item.description}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(item.id)}
                    className="text-gray-500 hover:text-red-400 shrink-0"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

export default EmployeeHistoryTimeline;
