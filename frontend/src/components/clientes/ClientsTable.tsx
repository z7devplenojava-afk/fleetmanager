import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { Client, ClientStatus } from '@/types/client';

interface ClientsTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onView: (client: Client) => void;
  isLoading?: boolean;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({
  clients,
  onEdit,
  onDelete,
  onView,
  isLoading = false
}) => {
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

  const formatPhone = (phone?: string) => {
    if (!phone) return '-';
    return phone;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhum cliente encontrado</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CNPJ</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{client.name}</div>
                  {client.email && (
                    <div className="text-sm text-gray-500">{client.email}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">{formatCnpj(client.cnpj)}</span>
              </TableCell>
              <TableCell>
                <div>
                  {client.contactName ? (
                    <>
                      <div className="font-medium">{client.contactName}</div>
                      {client.contactEmail && (
                        <div className="text-sm text-gray-500">{client.contactEmail}</div>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  {client.phone && (
                    <div className="text-sm">{formatPhone(client.phone)}</div>
                  )}
                  {client.mobile && (
                    <div className="text-sm text-gray-500">{formatPhone(client.mobile)}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(client.status)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(client)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(client)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(client)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}; 