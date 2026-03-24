import React from 'react';
import { X, Award, Calendar, DollarSign, Users, Building, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Benefit } from '@/services/benefitService';

interface BeneficioViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  benefit: Benefit | null;
}

const BeneficioViewModal: React.FC<BeneficioViewModalProps> = ({
  isOpen,
  onClose,
  benefit
}) => {
  if (!isOpen || !benefit) return null;

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'TRANSPORT': 'Transporte',
      'MEAL': 'Refeição',
      'HEALTH': 'Saúde',
      'DENTAL': 'Odontológico',
      'LIFE_INSURANCE': 'Seguro de Vida',
      'OTHER': 'Outro'
    };
    return types[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'TRANSPORT': 'bg-blue-100 text-blue-800',
      'MEAL': 'bg-green-100 text-green-800',
      'HEALTH': 'bg-red-100 text-red-800',
      'DENTAL': 'bg-purple-100 text-purple-800',
      'LIFE_INSURANCE': 'bg-orange-100 text-orange-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-seguranca-graphite border border-gray-600 text-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-seguranca-yellow" />
            <h2 className="text-xl font-semibold text-seguranca-yellow">
              Detalhes do Benefício
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-white hover:bg-seguranca-black"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-seguranca-black/40 border border-gray-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                <Award className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">Nome</label>
                  <p className="text-lg font-semibold text-white">{benefit.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">Tipo</label>
                  <div className="mt-1">
                    <Badge className={getTypeColor(benefit.type)}>
                      {getTypeLabel(benefit.type)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {benefit.description && (
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">Descrição</label>
                  <p className="text-seguranca-lightgray mt-1">{benefit.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-red-400">Valor</label>
                  <p className="text-lg font-semibold text-red-300">
                     R$ {benefit.value?.toFixed(2) || '0.00'}
                   </p>
                  <p className="text-sm text-seguranca-lightgray">
                     Valor Fixo
                   </p>
                 </div>
                 <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">Status</label>
                   <div className="mt-1">
                     <Badge variant={benefit.isActive ? "default" : "secondary"}>
                       {benefit.isActive ? 'Ativo' : 'Inativo'}
                     </Badge>
                   </div>
                 </div>
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">ID</label>
                  <p className="text-sm text-seguranca-lightgray font-mono">{benefit.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Informações de Sistema */}
          <Card className="bg-seguranca-black/40 border border-gray-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                <Calendar className="h-5 w-5" />
                Informações de Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">Data de Criação</label>
                  <p className="text-seguranca-lightgray">{formatDate(benefit.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">Última Atualização</label>
                  <p className="text-seguranca-lightgray">{formatDate(benefit.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo Estatístico */}
          <Card className="bg-seguranca-black/40 border border-gray-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                <DollarSign className="h-5 w-5" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-seguranca-black/30 rounded-lg border border-gray-700">
                  <div className="text-2xl font-bold text-seguranca-yellow">-</div>
                  <div className="text-sm text-seguranca-lightgray">Cargos</div>
                </div>
                <div className="text-center p-4 bg-seguranca-black/30 rounded-lg border border-gray-700">
                  <div className="text-2xl font-bold text-seguranca-yellow">-</div>
                  <div className="text-sm text-seguranca-lightgray">Unidades</div>
                </div>
                <div className="text-center p-4 bg-seguranca-black/30 rounded-lg border border-gray-700">
                  <div className="text-2xl font-bold">
                    {benefit.isActive ? (
                      <CheckCircle className="h-8 w-8 mx-auto text-green-400" />
                    ) : (
                      <XCircle className="h-8 w-8 mx-auto text-red-500" />
                    )}
                  </div>
                  <div className="text-sm text-seguranca-lightgray">
                    {benefit.isActive ? 'Ativo' : 'Inativo'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-600">
          <Button onClick={onClose} className="border-gray-600 text-white hover:bg-seguranca-black" variant="outline">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BeneficioViewModal; 