import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Client, ClientStatus } from '@/types/client';
import { MapPin, Phone, Mail, User, Building, Calendar, FileText, Briefcase, Loader2 } from 'lucide-react';
import ClientWorkPostsTab from './ClientWorkPostsTab';
import ClientContractsTab from './ClientContractsTab';

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
            <TabsList className="grid w-full grid-cols-3 bg-gray-100">
              <TabsTrigger value="dados" className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white">
                <Building className="h-4 w-4 mr-1" /> Dados
              </TabsTrigger>
              <TabsTrigger value="postos" className="data-[state='active']:bg-seguranca-red data-[state='active']:text-white">
                <Briefcase className="h-4 w-4 mr-1" /> Postos / Obras
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
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Informações da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-gray-600">{client.email}</p>
                    </div>
                  </div>
                )}
                
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Telefone</p>
                      <p className="text-sm text-gray-600">{client.phone}</p>
                    </div>
                  </div>
                )}
                
                {client.mobile && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Celular</p>
                      <p className="text-sm text-gray-600">{client.mobile}</p>
                    </div>
                  </div>
                )}
                
                {client.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Endereço</p>
                      <p className="text-sm text-gray-600">
                        {client.address}
                        {client.city && `, ${client.city}`}
                        {client.state && ` - ${client.state}`}
                        {client.zipCode && `, ${client.zipCode}`}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações do Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Dados do Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.contactName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Nome do Contato</p>
                      <p className="text-sm text-gray-600">{client.contactName}</p>
                    </div>
                  </div>
                )}
                
                {client.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Email do Contato</p>
                      <p className="text-sm text-gray-600">{client.contactEmail}</p>
                    </div>
                  </div>
                )}
                
                {client.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Telefone do Contato</p>
                      <p className="text-sm text-gray-600">{client.contactPhone}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Observações */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Data de Criação</p>
                  <p className="text-sm text-gray-600">{formatDate(client.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Última Atualização</p>
                  <p className="text-sm text-gray-600">{formatDate(client.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          {/* === TAB: POSTOS DE TRABALHO === */}
          <TabsContent value="postos" className="mt-4">
            <ClientWorkPostsTab clientId={client.id} clientName={client.name} />
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