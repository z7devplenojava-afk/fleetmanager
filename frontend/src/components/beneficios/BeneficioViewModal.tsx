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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Detalhes do Benefício
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome</label>
                  <p className="text-lg font-semibold text-gray-900">{benefit.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo</label>
                  <div className="mt-1">
                    <Badge className={getTypeColor(benefit.type)}>
                      {getTypeLabel(benefit.type)}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {benefit.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Descrição</label>
                  <p className="text-gray-700 mt-1">{benefit.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <div>
                   <label className="text-sm font-medium text-gray-500">Valor</label>
                   <p className="text-lg font-semibold text-green-600">
                     R$ {benefit.value?.toFixed(2) || '0.00'}
                   </p>
                   <p className="text-sm text-gray-500">
                     Valor Fixo
                   </p>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-gray-500">Status</label>
                   <div className="mt-1">
                     <Badge variant={benefit.isActive ? "default" : "secondary"}>
                       {benefit.isActive ? 'Ativo' : 'Inativo'}
                     </Badge>
                   </div>
                 </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">ID</label>
                  <p className="text-sm text-gray-600 font-mono">{benefit.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Informações de Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações de Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Data de Criação</label>
                  <p className="text-gray-700">{formatDate(benefit.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Última Atualização</label>
                  <p className="text-gray-700">{formatDate(benefit.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumo Estatístico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">-</div>
                  <div className="text-sm text-blue-600">Cargos</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">-</div>
                  <div className="text-sm text-green-600">Unidades</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {benefit.isActive ? (
                      <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 mx-auto text-red-600" />
                    )}
                  </div>
                  <div className="text-sm text-purple-600">
                    {benefit.isActive ? 'Ativo' : 'Inativo'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t">
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BeneficioViewModal; 