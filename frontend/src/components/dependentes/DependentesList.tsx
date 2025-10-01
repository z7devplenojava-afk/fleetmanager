import React, { useEffect, useState } from 'react';
import { Dependent, RELATIONSHIP_TYPES } from '@/types/dependent';
import { dependentService } from '@/services/dependentService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DependentesListProps {
  employeeId: string;
  onEdit?: (dependent: Dependent) => void;
  onDelete?: (dependent: Dependent) => void;
}

const DependentesList: React.FC<DependentesListProps> = ({ 
  employeeId,
  onEdit,
  onDelete
}) => {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDependents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dependentService.getDependentsByEmployeeId(employeeId);
        setDependents(data);
      } catch (err) {
        console.error('Erro ao buscar dependentes:', err);
        setError('Não foi possível carregar os dependentes. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchDependents();
    }
  }, [employeeId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  const getRelationshipLabel = (relationship: string) => {
    return (RELATIONSHIP_TYPES as Record<string, string>)[relationship] || relationship;
  };

  if (loading) {
    return <div className="p-4 text-center">Carregando dependentes...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (dependents.length === 0) {
    return <div className="p-4 text-center">Nenhum dependente cadastrado.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nome
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Parentesco
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Data de Nascimento
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              CPF
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              RG
            </th>
            {(onEdit || onDelete) && (
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {dependents.map((dependent) => (
            <tr key={dependent.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {dependent.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getRelationshipLabel(dependent.relationship)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(dependent.birthDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {dependent.cpf}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {dependent.rg || '-'}
              </td>
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(dependent)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(dependent)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DependentesList;