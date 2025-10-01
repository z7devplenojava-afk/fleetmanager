import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  FileText, 
  X, 
  Building2, 
  Calendar, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  User
} from 'lucide-react';
import { BankReconciliation } from '@/types/bankReconciliation';

interface ReconciliationViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reconciliation: BankReconciliation | null;
  onRefresh: () => void;
}

const ReconciliationViewModal: React.FC<ReconciliationViewModalProps> = ({
  isOpen,
  onClose,
  reconciliation,
  onRefresh
}) => {
  if (!reconciliation) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { label: 'Pendente', color: 'bg-gray-600', icon: Clock },
      'IN_PROGRESS': { label: 'Em Andamento', color: 'bg-blue-600', icon: Clock },
      'COMPLETED': { label: 'Concluída', color: 'bg-green-600', icon: CheckCircle },
      'CANCELLED': { label: 'Cancelada', color: 'bg-red-600', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} text-white`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes da Conciliação Bancária
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Visualização completa da conciliação bancária e seus itens
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais */}
          <Card className="bg-seguranca-black border-gray-600">
            <CardHeader className="pb-4">
              <CardTitle className="text-seguranca-lightgray text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informações da Conciliação
                </div>
                {getStatusBadge(reconciliation.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Conta Bancária</h4>
                  <div className="text-seguranca-lightgray">
                    <div className="font-semibold">{reconciliation.account.name}</div>
                    <div className="text-sm text-gray-400">
                      {reconciliation.account.bank} - {reconciliation.account.agency} / {reconciliation.account.accountNumber}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Data de Referência</h4>
                  <div className="flex items-center gap-2 text-seguranca-lightgray">
                    <Calendar className="h-4 w-4" />
                    {formatDate(reconciliation.referenceDate)}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Criado por</h4>
                  <div className="flex items-center gap-2 text-seguranca-lightgray">
                    <User className="h-4 w-4" />
                    {reconciliation.createdBy}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Data de Criação</h4>
                  <div className="text-seguranca-lightgray">
                    {formatDateTime(reconciliation.createdAt)}
                  </div>
                </div>
              </div>

              {reconciliation.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Observações</h4>
                  <div className="text-seguranca-lightgray bg-seguranca-graphite p-3 rounded border border-gray-600">
                    {reconciliation.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo Financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-seguranca-black border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 font-medium">Saldo Sistema</p>
                    <p className="text-xl font-bold text-blue-400">
                      {formatCurrency(reconciliation.systemBalance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-black border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 font-medium">Saldo Banco</p>
                    <p className="text-xl font-bold text-green-400">
                      {formatCurrency(reconciliation.bankBalance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-black border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    reconciliation.difference === 0 
                      ? 'bg-green-500/20' 
                      : 'bg-red-500/20'
                  }`}>
                    <DollarSign className={`h-5 w-5 ${
                      reconciliation.difference === 0 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 font-medium">Diferença</p>
                    <p className={`text-xl font-bold ${
                      reconciliation.difference === 0 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {formatCurrency(reconciliation.difference)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-seguranca-black border-gray-600">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-seguranca-yellow/20 rounded-lg">
                    <FileText className="h-5 w-5 text-seguranca-yellow" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 font-medium">Itens</p>
                    <p className="text-xl font-bold text-seguranca-yellow">
                      {reconciliation.reconciliationItems?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Itens de Conciliação */}
          {reconciliation.reconciliationItems && reconciliation.reconciliationItems.length > 0 && (
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Itens de Conciliação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reconciliation.reconciliationItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-seguranca-graphite rounded border border-gray-600">
                      <div className="flex-1">
                        <div className="font-medium text-seguranca-lightgray">{item.description}</div>
                        <div className="text-sm text-gray-400">
                          {formatDate(item.date)} • {item.type}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-seguranca-lightgray">
                          {formatCurrency(item.amount)}
                        </div>
                        <Badge 
                          variant={item.status === 'CONFIRMED' ? 'default' : 'secondary'}
                          className={item.status === 'CONFIRMED' ? 'bg-green-600' : 'bg-gray-600'}
                        >
                          {item.status === 'CONFIRMED' ? 'Confirmado' : 
                           item.status === 'REJECTED' ? 'Rejeitado' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botão de Fechar */}
          <div className="flex justify-end pt-4 border-t border-gray-600">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-600 text-gray-400 hover:bg-gray-700"
            >
              <X size={16} className="mr-2" />
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReconciliationViewModal;