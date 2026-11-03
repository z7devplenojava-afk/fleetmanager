import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Client, ClientStatus } from '@/types/client';
import { MapPin, Phone, Mail, User, Building, Calendar, FileText, Briefcase, Truck, Users, Loader2 } from 'lucide-react';
import ClientWorkPostsTab from './ClientWorkPostsTab';
import ClientContractsTab from './ClientContractsTab';
import ClientVehiclesTab from './ClientVehiclesTab';
import ClientEmployeesTab from './ClientEmployeesTab';

interface ClientViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client;
}

export const ClientViewModal: React.FC<ClientViewModalProps> = ({
  isOpen,
  onClose,
  client
}) => {
  const [activeTab, setActiveTab] = useState('dados');

  useEffect(() => {
    if (isOpen) setActiveTab('dados');
  }, [isOpen]);

  if (!client) return null;

  const getStatusBadge = (status: ClientStatus) => {
    const statusConfig = {
      [ClientStatus.ACTIVE]: { label: 'Ativo', variant: 'default' as const },
      [ClientStatus.INACTIVE]: { label: 'Inativo', variant: 'secondary' as const },
      [ClientStatus.SUSPENDED]: { label: 'Suspenso', variant: 'destructive' as const },
      [ClientStatus.PENDING]: { label: 'Pendente', variant: 'outline' as const }
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCnpj = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {client.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="dados" className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white">
                <Building className="h-4 w-4 mr-1" /> Dados
              </TabsTrigger>
              <TabsTrigger value="funcionarios" className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white">
                <Users className="h-4 w-4 mr-1" /> Colaboradores
              </TabsTrigger>
              <TabsTrigger value="postos" className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white">
                <Briefcase className="h-4 w-4 mr-1" /> Postos / Obras
              </TabsTrigger>
              <TabsTrigger value="veiculos" className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white">
                <Truck className="h-4 w-4 mr-1" /> Veículos Alocados
              </TabsTrigger>
              <TabsTrigger value="contratos" className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white">
                <FileText className="h-4 w-4 mr-1" /> Contratos
              </TabsTrigger>
            </TabsList>

          {/* === TAB: DADOS === */}
          <TabsContent value="dados" className="space-y-6 mt-4">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h2 className="text-xl font-semibold">{client.name}</h2>
              <p className="text-sm text-gray-600 font-mono">{formatCnpj(client.cnpj)}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(client.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações da Empresa */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informações da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Razão Social</label>
                  <p className="text-base">{client.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">CNPJ</label>
                  <p className="text-base font-mono">{formatCnpj(client.cnpj)}</p>
                </div>
                {client.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Endereço
                    </label>
                    <p className="text-base">
                      {client.address}
                      {client.city && `, ${client.city}`}
                      {client.state && ` - ${client.state}`}
                      {client.zipCode && ` (CEP: ${client.zipCode})`}
                    </p>
                  </div>
                )}
                {client.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Telefone da Empresa
                    </label>
                    <p className="text-base">{client.phone}</p>
                  </div>
                )}
                {client.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email da Empresa
                    </label>
                    <p className="text-base">{client.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dados do Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.contactName ? (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nome do Contato</label>
                    <p className="text-base">{client.contactName}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Nenhum contato informado</p>
                )}
                {client.contactPhone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Telefone do Contato
                    </label>
                    <p className="text-base">{client.contactPhone}</p>
                  </div>
                )}
                {client.mobile && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      Celular do Contato
                    </label>
                    <p className="text-base">{client.mobile}</p>
                  </div>
                )}
                {client.contactEmail && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email do Contato
                    </label>
                    <p className="text-base">{client.contactEmail}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Observações */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Data de Criação</label>
                <p className="text-base">{formatDate(client.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Última Atualização</label>
                <p className="text-base">{formatDate(client.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          {/* === TAB: COLABORADORES / FUNCIONÁRIOS DO CLIENTE === */}
          <TabsContent value="funcionarios" className="mt-4">
            <ClientEmployeesTab clientId={client.id} clientName={client.name} />
          </TabsContent>

          {/* === TAB: POSTOS / OBRAS === */}
          <TabsContent value="postos" className="mt-4">
            <ClientWorkPostsTab clientId={client.id} clientName={client.name} />
          </TabsContent>

          {/* === TAB: VEÍCULOS ALOCADOS === */}
          <TabsContent value="veiculos" className="mt-4">
            <ClientVehiclesTab clientId={client.id} clientName={client.name} />
          </TabsContent>

          {/* === TAB: CONTRATOS === */}
          <TabsContent value="contratos" className="mt-4">
            <ClientContractsTab clientId={client.id} clientName={client.name} />
          </TabsContent>

          </Tabs>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientViewModal;
