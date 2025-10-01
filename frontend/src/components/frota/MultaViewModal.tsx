import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Car, 
  X,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  User,
  CreditCard,
  Download
} from 'lucide-react';

interface Multa {
  id: string;
  veiculo_id: string;
  placa: string;
  marca: string;
  modelo: string;
  motorista_id?: string;
  motorista_nome?: string;
  motorista_cnh?: string;
  data_infracao: string;
  data_vencimento: string;
  valor: number;
  pontos: number;
  tipo_infracao: string;
  local_infracao: string;
  status: 'pendente' | 'paga' | 'vencida';
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

interface MultaViewModalProps {
  multa: Multa | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerateReport?: (multaId: string, format: 'pdf' | 'excel') => void;
}

const MultaViewModal: React.FC<MultaViewModalProps> = ({
  multa,
  isOpen,
  onClose,
  onGenerateReport,
}) => {
  if (!multa) return null;

  // Debug: Log dos dados da multa para verificar se o motorista está presente
  console.log('🔍 MultaViewModal - Dados da multa:', multa);
  console.log('🔍 MultaViewModal - Motorista nome:', multa.motorista_nome);
  console.log('🔍 MultaViewModal - Motorista ID:', multa.motorista_id);
  console.log('🔍 MultaViewModal - Motorista CNH:', multa.motorista_cnh);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paga':
        return 'bg-green-100 text-green-800';
      case 'vencida':
        return 'bg-red-100 text-red-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paga':
        return 'Paga';
      case 'vencida':
        return 'Vencida';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paga':
        return <CheckCircle className="h-4 w-4" />;
      case 'vencida':
        return <XCircle className="h-4 w-4" />;
      case 'pendente':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const isVencida = (dataVencimento: string) => {
    return new Date(dataVencimento) < new Date();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-seguranca-red" />
            Detalhes da Multa
          </DialogTitle>
          <DialogDescription className="text-seguranca-lightgray">
            Informações completas sobre a multa registrada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status da Multa */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                Status da Multa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Badge className={`${getStatusColor(multa.status)} flex items-center gap-2`}>
                  {getStatusIcon(multa.status)}
                  {getStatusText(multa.status)}
                </Badge>
                {isVencida(multa.data_vencimento) && multa.status !== 'paga' && (
                  <Badge className="bg-red-100 text-red-800">
                    VENCIDA
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Veículo */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Car className="h-5 w-5" />
                Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Placa</label>
                  <p className="text-seguranca-lightgray font-semibold">{multa.placa}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Marca</label>
                  <p className="text-seguranca-lightgray">{multa.marca}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Modelo</label>
                  <p className="text-seguranca-lightgray">{multa.modelo}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Motorista - TESTE: Sempre mostrar */}
          {true && (
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Motorista
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Nome</label>
                    <p className="text-seguranca-lightgray font-semibold">
                      {multa.motorista_nome || 'Nome não disponível'}
                    </p>
                  </div>
                  {multa.motorista_cnh && (
                    <div>
                      <label className="text-sm font-medium text-gray-400 flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        CNH
                      </label>
                      <p className="text-seguranca-lightgray">{multa.motorista_cnh}</p>
                    </div>
                  )}
                  {multa.motorista_id && !multa.motorista_nome && (
                    <div>
                      <label className="text-sm font-medium text-gray-400">ID do Motorista</label>
                      <p className="text-seguranca-lightgray text-sm">{multa.motorista_id}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detalhes da Infração */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhes da Infração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Tipo de Infração</label>
                  <p className="text-seguranca-lightgray font-semibold">{multa.tipo_infracao}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-400">Local da Infração</label>
                    <p className="text-seguranca-lightgray">{multa.local_infracao}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Valor da Multa</label>
                    <p className="text-seguranca-lightgray font-semibold text-lg">
                      {formatCurrency(multa.valor)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Pontos na CNH</label>
                    <p className="text-seguranca-lightgray font-semibold">{multa.pontos} pontos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Datas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Data da Infração</label>
                  <p className="text-seguranca-lightgray">{formatDate(multa.data_infracao)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Data de Vencimento</label>
                  <p className={`font-semibold ${isVencida(multa.data_vencimento) ? 'text-red-500' : 'text-seguranca-lightgray'}`}>
                    {formatDate(multa.data_vencimento)}
                    {isVencida(multa.data_vencimento) && (
                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        VENCIDA
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {multa.observacoes && (
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-seguranca-lightgray whitespace-pre-wrap">
                  {multa.observacoes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Informações do Sistema */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-seguranca-lightgray text-sm">
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-400">Criado em</label>
                  <p className="text-seguranca-lightgray">{formatDateTime(multa.created_at)}</p>
                </div>
                <div>
                  <label className="text-gray-400">Última atualização</label>
                  <p className="text-seguranca-lightgray">{formatDateTime(multa.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center">
          {/* Botões de Relatórios */}
          {onGenerateReport && (
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => onGenerateReport(multa.id, 'pdf')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Relatório PDF
              </Button>
              <Button
                onClick={() => onGenerateReport(multa.id, 'excel')}
                variant="outline"
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Relatório Excel
              </Button>
            </div>
          )}
          
          {/* Botão Fechar */}
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MultaViewModal; 