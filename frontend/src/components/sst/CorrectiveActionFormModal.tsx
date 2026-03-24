import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CorrectiveAction, CreateCorrectiveActionDTO } from '@/services/sstService';
import { Loader2, Target, AlertTriangle, Calendar, User, FileText } from 'lucide-react';

interface CorrectiveActionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: CorrectiveAction | null;
  onSubmit: (data: CreateCorrectiveActionDTO) => Promise<void>;
}

export default function CorrectiveActionFormModal({
  open,
  onOpenChange,
  action,
  onSubmit,
}: CorrectiveActionFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados do formulário
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [origin, setOrigin] = useState<'INSPECAO' | 'ACIDENTE' | 'AUDITORIA' | 'NAO_CONFORMIDADE' | 'OUTROS'>('INSPECAO');
  const [priority, setPriority] = useState<'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'>('MEDIA');
  const [status, setStatus] = useState<'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'>('PENDENTE');
  const [responsibleName, setResponsibleName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [department, setDepartment] = useState('');
  const [notes, setNotes] = useState('');

  // Carregar dados da ação quando for edição
  useEffect(() => {
    if (action) {
      setTitle(action.title);
      setDescription(action.description);
      setOrigin(action.origin);
      setPriority(action.priority);
      setStatus(action.status);
      setResponsibleName(action.responsibleName || '');
      setDueDate(action.dueDate ? action.dueDate.split('T')[0] : '');
      setDepartment(action.department || '');
      setNotes(action.notes || '');
    } else {
      // Reset form
      setTitle('');
      setDescription('');
      setOrigin('INSPECAO');
      setPriority('MEDIA');
      setStatus('PENDENTE');
      setResponsibleName('');
      setDueDate('');
      setDepartment('');
      setNotes('');
    }
  }, [action, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !dueDate) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        origin,
        priority,
        status,
        responsibleName: responsibleName || undefined,
        dueDate,
        department: department || undefined,
        notes: notes || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar ação corretiva:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader className="bg-gradient-to-r from-seguranca-red to-red-600 p-4 sm:p-6 -m-6 mb-4 rounded-t-lg">
          <DialogTitle className="text-white text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
              <Target className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            {action ? 'Editar Ação Corretiva' : 'Nova Ação Corretiva'}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm sm:text-base">
            {action ? 'Atualize as informações da ação corretiva' : 'Registre uma nova ação corretiva para correção de não conformidades'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Seção: Informações Básicas */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                </div>
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                  Título <span className="text-seguranca-red">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Ex: Correção de instalação elétrica"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-seguranca-lightgray font-medium text-sm sm:text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Descrição <span className="text-seguranca-red">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhadamente a ação corretiva necessária"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[100px] text-sm sm:text-base resize-y"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                    Origem <span className="text-seguranca-red">*</span>
                  </Label>
                  <Select value={origin} onValueChange={(value: any) => setOrigin(value)}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="INSPECAO" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Inspeção</SelectItem>
                      <SelectItem value="ACIDENTE" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Acidente</SelectItem>
                      <SelectItem value="AUDITORIA" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Auditoria</SelectItem>
                      <SelectItem value="NAO_CONFORMIDADE" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Não Conformidade</SelectItem>
                      <SelectItem value="OUTROS" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                    Prioridade <span className="text-seguranca-red">*</span>
                  </Label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="BAIXA" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Baixa</SelectItem>
                      <SelectItem value="MEDIA" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Média</SelectItem>
                      <SelectItem value="ALTA" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Alta</SelectItem>
                      <SelectItem value="CRITICA" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção: Responsável e Prazo */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                </div>
                Responsável e Prazo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsibleName" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                    Responsável
                  </Label>
                  <Input
                    id="responsibleName"
                    placeholder="Nome do responsável"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-seguranca-lightgray font-medium text-sm sm:text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data de Vencimento <span className="text-seguranca-red">*</span>
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                  Departamento/Setor
                </Label>
                <Input
                  id="department"
                  placeholder="Ex: Manutenção, Segurança"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>

              {action && (
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                    Status
                  </Label>
                  <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                    <SelectTrigger className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray focus:border-seguranca-yellow h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                      <SelectItem value="PENDENTE" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Pendente</SelectItem>
                      <SelectItem value="EM_ANDAMENTO" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Em Andamento</SelectItem>
                      <SelectItem value="CONCLUIDA" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Concluída</SelectItem>
                      <SelectItem value="CANCELADA" className="text-seguranca-lightgray hover:bg-seguranca-red/20">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seção: Observações */}
          <Card className="bg-gradient-to-r from-seguranca-graphite to-gray-700 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-seguranca-lightgray flex items-center gap-2">
                <div className="p-1.5 bg-seguranca-red/20 rounded-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-seguranca-red" />
                </div>
                Observações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-seguranca-lightgray font-medium text-sm sm:text-base">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Observações adicionais sobre a ação corretiva (opcional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow min-h-[100px] text-sm sm:text-base"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-seguranca-red to-red-600 hover:from-seguranca-red/90 hover:to-red-600/90 text-white font-semibold shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                action ? 'Atualizar Ação' : 'Criar Ação'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}




