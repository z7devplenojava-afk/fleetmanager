import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  X, 
  FileText,
  Globe,
  Phone,
  MapPin,
  Calendar,
  Edit
} from 'lucide-react';
import { Bank } from '@/services/bankAgencyService';

interface BankViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bank: Bank | null;
  onEdit?: (bank: Bank) => void;
}

export const BankViewModal: React.FC<BankViewModalProps> = ({
  open,
  onOpenChange,
  bank,
  onEdit
}) => {
  if (!bank) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-green-500 text-white', label: 'Ativo' },
      'INACTIVE': { color: 'bg-gray-500 text-white', label: 'Inativo' },
      'SUSPENDED': { color: 'bg-red-500 text-white', label: 'Suspenso' }
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
            {bank.name}
          </DialogTitle>
          <DialogDescription className="text-seguranca-lightgray/70">
            Detalhes do banco cadastrado no sistema
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
                <h3 className="text-xl font-bold text-seguranca-lightgray">{bank.name}</h3>
                <p className="text-seguranca-lightgray/70">Código: {bank.code}</p>
                {bank.shortName && (
                  <p className="text-seguranca-lightgray/70">Abrev: {bank.shortName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(bank.status)}
              {onEdit && (
                <Button
                  onClick={() => onEdit(bank)}
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
                <label className="text-sm font-medium text-seguranca-lightgray/70">Código do Banco</label>
                <p className="text-seguranca-lightgray">{bank.code}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray/70">Nome Completo</label>
                <p className="text-seguranca-lightgray">{bank.name}</p>
              </div>
              
              {bank.shortName && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-seguranca-lightgray/70">Nome Abreviado</label>
                  <p className="text-seguranca-lightgray">{bank.shortName}</p>
                </div>
              )}
              
              {bank.cnpj && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-seguranca-lightgray/70">CNPJ</label>
                  <p className="text-seguranca-lightgray">{bank.cnpj}</p>
                </div>
              )}
            </div>
            
            {bank.description && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray/70">Descrição</label>
                <p className="text-seguranca-lightgray">{bank.description}</p>
              </div>
            )}
          </div>

          {/* Informações de Contato */}
          {(bank.website || bank.phone) && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-seguranca-lightgray flex items-center">
                <Phone className="w-4 h-4 mr-2 text-seguranca-yellow" />
                Informações de Contato
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bank.website && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-seguranca-lightgray/70">Website</label>
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-gray-400" />
                      <a 
                        href={bank.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-seguranca-yellow hover:underline"
                      >
                        {bank.website}
                      </a>
                    </div>
                  </div>
                )}
                
                {bank.phone && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-seguranca-lightgray/70">Telefone</label>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-seguranca-lightgray">{bank.phone}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Endereço */}
          {(bank.address || bank.city || bank.state || bank.zipCode) && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-seguranca-lightgray flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-seguranca-yellow" />
                Endereço
              </h4>
              
              <div className="space-y-2">
                {bank.address && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-seguranca-lightgray/70">Endereço</label>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-seguranca-lightgray">{bank.address}</span>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {bank.city && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-seguranca-lightgray/70">Cidade</label>
                      <p className="text-seguranca-lightgray">{bank.city}</p>
                    </div>
                  )}
                  
                  {bank.state && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-seguranca-lightgray/70">Estado</label>
                      <p className="text-seguranca-lightgray">{bank.state}</p>
                    </div>
                  )}
                  
                  {bank.zipCode && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-seguranca-lightgray/70">CEP</label>
                      <p className="text-seguranca-lightgray">{bank.zipCode}</p>
                    </div>
                  )}
                </div>
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
                <p className="text-seguranca-lightgray">{formatDate(bank.createdAt)}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray/70">Atualizado em</label>
                <p className="text-seguranca-lightgray">{formatDate(bank.updatedAt)}</p>
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
