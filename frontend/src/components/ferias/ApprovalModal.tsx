import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { feriasService } from '@/services/feriasService';
import { 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  Clock,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    employeeName: string;
    dataInicio: string;
    dataFim: string;
    tipo: string;
    status: string;
    motivo?: string;
    observacoes?: string;
  } | null;
  type: 'ferias' | 'afastamento';
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({ isOpen, onClose, item, type }) => {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!item) return null;

  const handleApprove = async () => {
    try {
      setLoading(true);
      
      if (type === 'ferias') {
        await feriasService.approveFerias(item.id, observacoes);
        toast({
          title: "Sucesso",
          description: "Solicitação de férias aprovada com sucesso!",
          variant: "default"
        });
        queryClient.invalidateQueries({ queryKey: ['ferias'] });
      } else {
        await feriasService.approveAfastamento(item.id, observacoes);
        toast({
          title: "Sucesso",
          description: "Afastamento aprovado com sucesso!",
          variant: "default"
        });
        queryClient.invalidateQueries({ queryKey: ['afastamentos'] });
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      
      if (type === 'ferias') {
        await feriasService.rejectFerias(item.id, observacoes);
        toast({
          title: "Sucesso",
          description: "Solicitação de férias rejeitada com sucesso!",
          variant: "default"
        });
        queryClient.invalidateQueries({ queryKey: ['ferias'] });
      } else {
        await feriasService.rejectAfastamento(item.id, observacoes);
        toast({
          title: "Sucesso",
          description: "Afastamento rejeitado com sucesso!",
          variant: "default"
        });
        queryClient.invalidateQueries({ queryKey: ['afastamentos'] });
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400">Pendente</Badge>;
      case 'APROVADO':
        return <Badge className="bg-green-500/20 text-green-400 border-green-400">Aprovado</Badge>;
      case 'CANCELADO':
        return <Badge className="bg-red-500/20 text-red-400 border-red-400">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-400">{status}</Badge>;
    }
  };

  const getTypeIcon = () => {
    if (type === 'ferias') {
      return <Calendar className="h-5 w-5 text-blue-400" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-orange-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            {getTypeIcon()}
            Aprovar/Rejeitar {type === 'ferias' ? 'Férias' : 'Afastamento'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Solicitação */}
          <Card className="bg-gray-800 border-gray-600">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-seguranca-yellow" />
                  <span className="text-gray-400">Funcionário:</span>
                  <span className="text-seguranca-lightgray font-medium">{item.employeeName}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-seguranca-yellow" />
                  <span className="text-gray-400">Status:</span>
                  {getStatusBadge(item.status)}
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-seguranca-yellow" />
                  <span className="text-gray-400">Data Início:</span>
                  <span className="text-seguranca-lightgray">{item.dataInicio}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-seguranca-yellow" />
                  <span className="text-gray-400">Data Fim:</span>
                  <span className="text-seguranca-lightgray">{item.dataFim}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-seguranca-yellow" />
                  <span className="text-gray-400">Tipo:</span>
                  <span className="text-seguranca-lightgray">{item.tipo}</span>
                </div>
              </div>
              
              {item.motivo && (
                <div className="mt-4">
                  <span className="text-gray-400">Motivo:</span>
                  <p className="text-seguranca-lightgray mt-1">{item.motivo}</p>
                </div>
              )}
              
              {item.observacoes && (
                <div className="mt-4">
                  <span className="text-gray-400">Observações:</span>
                  <p className="text-seguranca-lightgray mt-1">{item.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações de Aprovação/Rejeição */}
          {item.status === 'PENDENTE' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={() => setAction('approve')}
                  className={`flex-1 ${action === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                  } text-white`}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar
                </Button>
                
                <Button
                  onClick={() => setAction('reject')}
                  className={`flex-1 ${action === 'reject' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                  } text-white`}
                  disabled={loading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </div>

              {action && (
                <div className="space-y-2">
                  <Label htmlFor="observacoes" className="text-gray-300">
                    Observações da {action === 'approve' ? 'aprovação' : 'rejeição'}:
                  </Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder={`Digite suas observações sobre a ${action === 'approve' ? 'aprovação' : 'rejeição'}...`}
                    className="bg-gray-900/50 border-gray-600 text-white min-h-[100px]"
                  />
                </div>
              )}

              {action && (
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => {
                      setAction(null);
                      setObservacoes('');
                    }}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  
                  <Button
                    onClick={action === 'approve' ? handleApprove : handleReject}
                    className={`${action === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                    } text-white`}
                    disabled={loading || !observacoes.trim()}
                  >
                    {loading ? 'Processando...' : 
                      action === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'
                    }
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Status já processado */}
          {item.status !== 'PENDENTE' && (
            <div className="text-center py-4">
              <p className="text-gray-400">
                Esta solicitação já foi {item.status.toLowerCase()} e não pode ser alterada.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApprovalModal;
