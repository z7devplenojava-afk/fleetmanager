import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OrderOfService } from '@/types/orderOfService';
import { FileText, Download, Eye, Calendar, DollarSign, User, Building, MapPin } from 'lucide-react';

interface OrdemServicoViewModalProps {
  open: boolean;
  onClose: () => void;
  orderOfService: OrderOfService | null;
}

const OrdemServicoViewModal: React.FC<OrdemServicoViewModalProps> = ({ 
  open, 
  onClose, 
  orderOfService 
}) => {
  if (!orderOfService) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600">
        <DialogHeader>
          <DialogTitle className="text-seguranca-lightgray text-xl">
            Ordem de Serviço - {orderOfService.employeeName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações do Funcionário */}
          <div className="bg-seguranca-black/50 p-4 rounded-lg">
            <h3 className="text-seguranca-yellow font-semibold mb-3 flex items-center gap-2">
              <User size={20} />
              Informações do Funcionário
            </h3>
            <div className="grid grid-cols-2 gap-4 text-seguranca-lightgray">
              <div>
                <span className="text-gray-400 text-sm">Nome:</span>
                <p className="font-medium">{orderOfService.employeeName}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">CPF:</span>
                <p className="font-medium">{orderOfService.employeeCpf}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Função:</span>
                <p className="font-medium">{orderOfService.role}</p>
              </div>
            </div>
          </div>

          {/* Informações da Empresa */}
          <div className="bg-seguranca-black/50 p-4 rounded-lg">
            <h3 className="text-seguranca-yellow font-semibold mb-3 flex items-center gap-2">
              <Building size={20} />
              Informações da Empresa
            </h3>
            <div className="grid grid-cols-2 gap-4 text-seguranca-lightgray">
              <div>
                <span className="text-gray-400 text-sm">Empresa Contratante:</span>
                <p className="font-medium">{orderOfService.company}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Cliente Final:</span>
                <p className="font-medium">{orderOfService.client}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 text-sm">Posto de Trabalho:</span>
                <p className="font-medium">{orderOfService.workplace}</p>
              </div>
            </div>
          </div>

          {/* Informações Financeiras */}
          <div className="bg-seguranca-black/50 p-4 rounded-lg">
            <h3 className="text-seguranca-yellow font-semibold mb-3 flex items-center gap-2">
              <DollarSign size={20} />
              Informações Financeiras
            </h3>
            <div className="text-seguranca-lightgray">
              <span className="text-gray-400 text-sm">Salário:</span>
              <p className="font-medium text-lg text-seguranca-yellow">
                {formatCurrency(orderOfService.salary)}
              </p>
            </div>
          </div>

          {/* Período de Trabalho */}
          <div className="bg-seguranca-black/50 p-4 rounded-lg">
            <h3 className="text-seguranca-yellow font-semibold mb-3 flex items-center gap-2">
              <Calendar size={20} />
              Período de Trabalho
            </h3>
            <div className="grid grid-cols-2 gap-4 text-seguranca-lightgray">
              <div>
                <span className="text-gray-400 text-sm">Data de Início:</span>
                <p className="font-medium">{formatDate(orderOfService.startDate)}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Data de Término:</span>
                <p className="font-medium">
                  {orderOfService.endDate ? formatDate(orderOfService.endDate) : 'Indefinido'}
                </p>
              </div>
            </div>
          </div>

          {/* Status e Documento */}
          <div className="bg-seguranca-black/50 p-4 rounded-lg">
            <h3 className="text-seguranca-yellow font-semibold mb-3 flex items-center gap-2">
              <FileText size={20} />
              Status e Documento
            </h3>
            <div className="grid grid-cols-2 gap-4 text-seguranca-lightgray">
              <div>
                <span className="text-gray-400 text-sm">Status:</span>
                <p className={`font-medium ${orderOfService.signed ? 'text-green-400' : 'text-red-400'}`}>
                  {orderOfService.signed ? 'Assinada' : 'Não Assinada'}
                </p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Documento:</span>
                {orderOfService.documentUrl ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-seguranca-yellow border-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black"
                      onClick={() => window.open(orderOfService.documentUrl, '_blank')}
                    >
                      <Eye size={16} className="mr-1" />
                      Visualizar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-seguranca-yellow border-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = orderOfService.documentUrl!;
                        link.download = `OS_${orderOfService.employeeName}_${orderOfService.id}.pdf`;
                        link.click();
                      }}
                    >
                      <Download size={16} className="mr-1" />
                      Download
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhum documento</p>
                )}
              </div>
            </div>
          </div>

          {/* Informações do Sistema */}
          <div className="bg-seguranca-black/30 p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
              <div>
                <span>Criada em:</span>
                <p>{formatDate(orderOfService.createdAt)}</p>
              </div>
              <div>
                <span>Atualizada em:</span>
                <p>{formatDate(orderOfService.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrdemServicoViewModal; 