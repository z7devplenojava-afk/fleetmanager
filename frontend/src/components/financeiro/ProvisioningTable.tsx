import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, RefreshCw, Eye, Edit, Trash2, Calculator, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Provisioning } from '@/types/provisioning';
import { provisioningService } from '@/services/provisioningService';

interface ProvisioningTableProps {
  onView: (prov: Provisioning) => void;
  onEdit: (prov: Provisioning) => void;
  onDelete: (prov: Provisioning) => void;
  onCreate: () => void;
}

const ProvisioningTable: React.FC<ProvisioningTableProps> = ({
  onView,
  onEdit,
  onDelete,
  onCreate
}) => {
  const { toast } = useToast();
  const [provisionings, setProvisionings] = useState<Provisioning[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadProvisionings = async () => {
    try {
      setLoading(true);
      const data = await provisioningService.getProvisionings();
      setProvisionings(
        data.filter(p =>
          p.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as simulações de provisionamento.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProvisionings();
    // eslint-disable-next-line
  }, [searchTerm]);

  const handleRefresh = async () => {
    await loadProvisionings();
    toast({ title: 'Lista atualizada!' });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <RefreshCw className="mx-auto h-12 w-12 text-gray-400 animate-spin mb-4" />
        <p className="text-seguranca-lightgray">Carregando simulações de provisionamento...</p>
      </div>
    );
  }

  if (provisionings.length === 0 && !loading) {
    return (
      <Card className="bg-seguranca-graphite border-gray-700">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Calculator className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
              Nenhuma simulação encontrada
            </h3>
            <p className="text-sm text-gray-400">
              Ainda não há simulações de provisionamento para exibir.
            </p>
            <Button 
              onClick={onCreate}
              className="mt-6 bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Simulação
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros em Card */}
      <Card className="bg-seguranca-graphite border-gray-700">
        <CardContent className="py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Buscar por serviço ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:ring-seguranca-red"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                onClick={onCreate}
                className="bg-seguranca-red hover:bg-seguranca-darkred"
              >
                <Plus size={18} className="mr-2" /> 
                Nova Simulação
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Tabela de Simulações */}
      <div className="rounded-md border border-gray-700 bg-seguranca-graphite">
        <Table>
          <TableHeader>
            <TableRow className="border-b-gray-700">
              <TableHead className="text-gray-400">Serviço</TableHead>
              <TableHead className="text-gray-400">Descrição</TableHead>
              <TableHead className="text-gray-400">Criado em</TableHead>
              <TableHead className="text-gray-400">Valor Mensal</TableHead>
              <TableHead className="text-gray-400">Valor Anual</TableHead>
              <TableHead className="text-gray-400 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {provisionings.map((prov) => (
              <TableRow key={prov.id} className="border-b-gray-700 hover:bg-seguranca-black/50">
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calculator className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-seguranca-lightgray font-medium">{prov.serviceName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-400">{prov.description}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-400">{new Date(prov.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-seguranca-yellow">
                    {prov.totalMonthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-seguranca-yellow">
                    {prov.totalYearly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onView(prov)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(prov)}
                      className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(prov)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProvisioningTable; 