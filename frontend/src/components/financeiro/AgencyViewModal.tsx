import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  X, 
  FileText,
  Phone,
  MapPin,
  Calendar,
  Edit,
  User,
  Mail
} from 'lucide-react';
import { Agency } from '@/services/bankAgencyService';

interface AgencyViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agency: Agency | null;
  onEdit?: (agency: Agency) => void;
}

export const AgencyViewModal: React.FC<AgencyViewModalProps> = ({
  open,
  onOpenChange,
  agency,
  onEdit
}) => {
  if (!agency) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-green-500 text-white', label: 'Ativa' },
      'INACTIVE': { color: 'bg-gray-500 text-white', label: 'Inativa' },
      'SUSPENDED': { color: 'bg-red-500 text-white', label: 'Suspensa' },
      'MAINTENANCE': { color: 'bg-yellow-500 text-white', label: 'Manutenção' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.INACTIVE;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-gray-700 text-seguranca-lightgray">
        <DialogHeader>
          <DialogTitle className="flex items-center text-seguranca-lightgray">
            <Building className="w-5 h-5 mr-2 text-seguranca-yellow" />
            {agency.name}
          </DialogTitle>
          <DialogDescription className="text-seguranca-lightgray/70">
            {agency.bankName} - Agência {agency.code}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header com status */}
          <div className="flex items-center justify-between p-4 bg-seguranca-black rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-seguranca-yellow/20 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-seguranca-yellow" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-seguranca-lightgray">{agency.name}</h3>
                <p className="text-seguranca-lightgray/70">{agency.bankName}</p>
                <p className="text-seguranca-lightgray/70">Código: {agency.code}</p>
                {agency.shortName && (
                  <p className="text-seguranca-lightgray/70">Abrev: {agency.shortName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(agency.status)}
              {onEdit && (
                <Button
                  onClick={() => onEdit(agency)}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-seguranca-lightgray flex items-center">
              <FileText className="w-4 h-4 mr-2 text-seguranca-yellow" />
              Informações Básicas
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray/70">Banco</label>
                <p className="text-seguranca-lightgray">{agency.bankName} ({agency.bankCode})</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray/70">Código da Agência</label>
                <p className="text-seguranca-lightgray">{agency.code}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray/70">Nome da Agência</label>
                <p className="text-seguranca-lightgray">{agency.name}</p>
              </div>
              
              {agency.shortName && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-seguranca-lightgray/70">Nome Abreviado</label>
                  <p className="text-seguranca-lightgray">{agency.shortName}</p>
                </div>
              )}
            </div>
            
            {agency.description && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray/70">Descrição</label>
                <p className="text-seguranca-lightgray">{agency.description}</p>
              </div>
            )}
          </div>

          {/* Informações de Contato */}
          {agency.phone && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-seguranca-lightgray flex items-center">
                <Phone className="w-4 h-4 mr-2 text-seguranca-yellow" />
                Informações de Contato
              </h4>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray/70">Telefone da Agência</label>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-seguranca-lightgray">{agency.phone}</span>
                </div>
              </div>
            </div>
          )}

          {/* Endereço */}
          {(agency.address || agency.city || agency.state || agency.zipCode) && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-seguranca-lightgray flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-seguranca-yellow" />
                Endereço
              </h4>
              
              <div className="space-y-2">
                {agency.address && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-seguranca-lightgray/70">Endereço</label>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-seguranca-lightgray">{agency.address}</span>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {agency.city && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-seguranca-lightgray/70">Cidade</label>
                      <p className="text-seguranca-lightgray">{agency.city}</p>
                    </div>
                  )}
                  
                  {agency.state && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-seguranca-lightgray/70">Estado</label>
                      <p className="text-seguranca-lightgray">{agency.state}</p>
                    </div>
                  )}
                  
                  {agency.zipCode && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-seguranca-lightgray/70">CEP</label>
                      <p className="text-seguranca-lightgray">{agency.zipCode}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Informações do Gerente */}
          {(agency.manager || agency.managerPhone || agency.managerEmail) && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-seguranca-lightgray flex items-center">
                <User className="w-4 h-4 mr-2 text-seguranca-yellow" />
                Informações do Gerente
              </h4>
              
              <div className="space-y-4">
                {agency.manager && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-seguranca-lightgray/70">Nome do Gerente</label>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-seguranca-lightgray">{agency.manager}</span>
                    </div>
                  </div>
                )}
                
                {agency.managerPhone && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-seguranca-lightgray/70">Telefone do Gerente</label>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-seguranca-lightgray">{agency.managerPhone}</span>
                    </div>
                  </div>
                )}
                
                {agency.managerEmail && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-seguranca-lightgray/70">Email do Gerente</label>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-seguranca-yellow">{agency.managerEmail}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observações */}
          {agency.notes && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-seguranca-lightgray flex items-center">
                <FileText className="w-4 h-4 mr-2 text-seguranca-yellow" />
                Observações
              </h4>
              
              <div className="space-y-2">
                <p className="text-seguranca-lightgray whitespace-pre-wrap">{agency.notes}</p>
              </div>
            </div>
          )}

          {/* Informações do Sistema */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-seguranca-lightgray flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-seguranca-yellow" />
              Informações do Sistema
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray/70">Criado em</label>
                <p className="text-seguranca-lightgray">{formatDate(agency.createdAt)}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray/70">Atualizado em</label>
                <p className="text-seguranca-lightgray">{formatDate(agency.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-700">
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
            >
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
