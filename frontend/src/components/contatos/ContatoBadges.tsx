
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ContatoBadgesProps {
  status?: string;
  tipo?: string;
}

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    ativo: 'bg-green-500',
    inativo: 'bg-red-500'
  };
  
  return (
    <Badge className={`${colors[status as keyof typeof colors] || 'bg-gray-500'} text-white`}>
      {status}
    </Badge>
  );
};

export const TipoBadge: React.FC<{ tipo: string }> = ({ tipo }) => {
  const colors = {
    cliente: 'bg-blue-500',
    fornecedor: 'bg-purple-500',
    parceiro: 'bg-green-500',
    outro: 'bg-gray-500'
  };
  
  return (
    <Badge className={`${colors[tipo as keyof typeof colors] || 'bg-gray-500'} text-white`}>
      {tipo}
    </Badge>
  );
};
