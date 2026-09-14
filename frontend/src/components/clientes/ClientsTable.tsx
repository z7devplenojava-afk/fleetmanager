import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye, Building2, Mail, Phone, MapPin, User, Sparkles, TrendingUp, Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Client, ClientStatus } from '@/types/client';

type SortField = 'name' | 'cnpj' | 'contactName' | 'status';
type SortDirection = 'asc' | 'desc';

interface ClientsTableProps {
  clients: Client[];
  selectedClientIds?: string[];
  onSelectClient?: (clientId: string, selected: boolean) => void;
  onSelectAllClients?: (selected: boolean) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onView: (client: Client) => void;
  isLoading?: boolean;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({
  clients,
  selectedClientIds = [],
  onSelectClient,
  onSelectAllClients,
  onEdit,
  onDelete,
  onView,
  isLoading = false
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedClients = useMemo(() => {
    if (!clients || clients.length === 0) return [];
    return [...clients].sort((a, b) => {
      let valA = '';
      let valB = '';
      if (sortField === 'name') {
        valA = a.name || '';
        valB = b.name || '';
      } else if (sortField === 'cnpj') {
        valA = a.cnpj || '';
        valB = b.cnpj || '';
      } else if (sortField === 'contactName') {
        valA = a.contactName || '';
        valB = b.contactName || '';
      } else if (sortField === 'status') {
        valA = a.status || '';
        valB = b.status || '';
      }

      const cmp = valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base', numeric: true });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [clients, sortField, sortDirection]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-40 group-hover/head:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-seguranca-yellow font-bold" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-seguranca-yellow font-bold" />
    );
  };

  const getStatusBadge = (status: ClientStatus) => {
    const statusConfig = {
      [ClientStatus.ACTIVE]: { 
        label: 'Ativo', 
        variant: 'default' as const,
        className: 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/50 shadow-md shadow-emerald-950/50 font-bold',
        icon: TrendingUp
      },
      [ClientStatus.INACTIVE]: { 
        label: 'Inativo', 
        variant: 'secondary' as const,
        className: 'bg-slate-900/90 text-slate-300 border border-slate-600/50 shadow-md font-bold',
        icon: Users
      },
      [ClientStatus.SUSPENDED]: { 
        label: 'Suspenso', 
        variant: 'destructive' as const,
        className: 'bg-rose-950/90 text-rose-400 border border-rose-500/50 shadow-md shadow-rose-950/50 font-bold',
        icon: Users
      },
      [ClientStatus.PENDING]: { 
        label: 'Pendente', 
        variant: 'outline' as const,
        className: 'bg-amber-950/90 text-amber-400 border border-amber-500/50 shadow-md shadow-amber-950/50 font-bold',
        icon: Sparkles
      }
    };

    const config = statusConfig[status];
    const IconComponent = config.icon;
    
    return (
      <Badge 
        variant={config.variant} 
        className={`${config.className} px-3 py-1.5 font-bold flex items-center gap-1.5 shadow-lg text-xs`}
      >
        <IconComponent className="h-3.5 w-3.5" />
        {config.label}
      </Badge>
    );
  };

  const formatCnpj = (cnpj: string) => {
    if (!cnpj) return '-';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return '-';
    return phone;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="h-28 bg-gradient-to-r from-seguranca-black/30 via-seguranca-graphite/20 to-seguranca-black/30 animate-pulse rounded-xl border border-gray-600/20 shadow-lg"
          />
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-seguranca-red/10 to-seguranca-yellow/10 rounded-full blur-3xl scale-150"></div>
          <Building2 className="relative h-20 w-20 mx-auto text-gray-500 mb-6" />
        </div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhum cliente encontrado</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Tente ajustar os filtros de pesquisa ou adicione um novo cliente para começar
        </p>
      </div>
    );
  }

  const isAllSelected = sortedClients.length > 0 && selectedClientIds.length === sortedClients.length && sortedClients.every(c => selectedClientIds.includes(c.id));

  return (
    <>
      {/* Desktop View */}
      <div className="hidden lg:block rounded-xl border border-gray-600/20 shadow-2xl bg-gradient-to-br from-seguranca-black/40 to-seguranca-graphite/20 overflow-x-auto">
        <Table className="w-full min-w-[980px]">
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-seguranca-graphite/90 to-seguranca-black/80 hover:from-seguranca-graphite to-seguranca-black border-b border-gray-600/30">
              <TableHead className="py-4 w-12 text-center select-none">
                <Checkbox 
                  checked={isAllSelected}
                  onCheckedChange={(checked) => onSelectAllClients?.(!!checked)}
                  className="border-gray-500 data-[state=checked]:bg-seguranca-red data-[state=checked]:border-seguranca-red"
                  title="Selecionar todos os clientes"
                />
              </TableHead>
              <TableHead 
                onClick={() => handleSort('name')}
                className="text-seguranca-yellow font-bold text-sm uppercase tracking-wider py-4 min-w-[220px] cursor-pointer select-none group/head hover:text-white transition-colors"
                title="Clique para ordenar por Nome (A-Z / Z-A)"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Cliente</span>
                  {renderSortIcon('name')}
                </div>
              </TableHead>
              <TableHead 
                onClick={() => handleSort('cnpj')}
                className="text-seguranca-yellow font-bold text-sm uppercase tracking-wider py-4 min-w-[140px] cursor-pointer select-none group/head hover:text-white transition-colors"
                title="Clique para ordenar por CNPJ"
              >
                <div className="flex items-center gap-2">
                  <span>CNPJ</span>
                  {renderSortIcon('cnpj')}
                </div>
              </TableHead>
              <TableHead 
                onClick={() => handleSort('contactName')}
                className="text-seguranca-yellow font-bold text-sm uppercase tracking-wider py-4 min-w-[160px] cursor-pointer select-none group/head hover:text-white transition-colors"
                title="Clique para ordenar por Contato"
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Contato</span>
                  {renderSortIcon('contactName')}
                </div>
              </TableHead>
              <TableHead className="text-seguranca-yellow font-bold text-sm uppercase tracking-wider py-4 min-w-[140px] select-none">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefones
                </div>
              </TableHead>
              <TableHead 
                onClick={() => handleSort('status')}
                className="text-seguranca-yellow font-bold text-sm uppercase tracking-wider py-4 min-w-[110px] cursor-pointer select-none group/head hover:text-white transition-colors"
                title="Clique para ordenar por Status"
              >
                <div className="flex items-center gap-2">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </TableHead>
              <TableHead className="text-seguranca-yellow font-bold text-sm uppercase tracking-wider py-4 min-w-[220px] text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedClients.map((client, index) => {
              const isSelected = selectedClientIds.includes(client.id);
              return (
                <TableRow 
                  key={client.id}
                  className={`border-gray-600/20 transition-all duration-300 cursor-pointer group backdrop-blur-sm ${
                    isSelected ? 'bg-seguranca-red/15 border-l-4 border-l-seguranca-red' : 'hover:bg-gradient-to-r hover:from-seguranca-black/40 hover:to-seguranca-graphite/20'
                  }`}
                  onClick={() => onView(client)}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <TableCell className="py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelectClient?.(client.id, !!checked)}
                      className="border-gray-500 data-[state=checked]:bg-seguranca-red data-[state=checked]:border-seguranca-red"
                    />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-2 rounded-lg bg-gradient-to-br from-seguranca-red/20 to-seguranca-red/10 border border-seguranca-red/30 group-hover:from-seguranca-red/30 group-hover:to-seguranca-red/20 transition-all duration-300 shadow-lg shadow-seguranca-red/10 flex-shrink-0">
                        <Building2 className="h-4 w-4 text-seguranca-red" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base text-seguranca-lightgray group-hover:text-white transition-colors mb-1 truncate">
                          {client.name}
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                            <Mail className="h-3 w-3 text-seguranca-red/60 flex-shrink-0" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        )}
                        {client.city && client.state && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            <span className="truncate">{client.city}/{client.state}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="font-mono text-xs text-seguranca-lightgray bg-gradient-to-r from-seguranca-black/60 to-seguranca-graphite/40 px-2.5 py-1 rounded border border-gray-600/30 shadow-inner inline-block whitespace-nowrap">
                      {formatCnpj(client.cnpj)}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    {client.contactName ? (
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-semibold text-sm text-seguranca-lightgray mb-1">
                          <User className="h-3 w-3 text-seguranca-red/60 flex-shrink-0" />
                          <span className="truncate">{client.contactName}</span>
                        </div>
                        {client.contactEmail && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Mail className="h-3 w-3 text-gray-500 flex-shrink-0" />
                            <span className="truncate">{client.contactEmail}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 italic text-xs">Sem contato</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="space-y-1">
                      {client.phone && (
                        <div className="flex items-center gap-2 text-xs text-seguranca-lightgray whitespace-nowrap">
                          <Phone className="h-3 w-3 text-seguranca-red/60 flex-shrink-0" />
                          <span>{formatPhone(client.phone)}</span>
                        </div>
                      )}
                      {client.mobile && (
                        <div className="flex items-center gap-2 text-xs text-gray-400 whitespace-nowrap">
                          <Phone className="h-3 w-3 text-gray-500 flex-shrink-0" />
                          <span>{formatPhone(client.mobile)}</span>
                        </div>
                      )}
                      {!client.phone && !client.mobile && (
                        <span className="text-gray-500 italic text-xs">Sem telefone</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 whitespace-nowrap">
                    {getStatusBadge(client.status)}
                  </TableCell>
                  <TableCell className="py-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onView(client)}
                        className="h-8 px-2.5 text-xs font-semibold text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-400/50 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                        title="Visualizar Detalhes do Cliente"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Ver</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onEdit(client)}
                        className="h-8 px-2.5 text-xs font-semibold text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-400/50 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                        title="Editar Cadastro do Cliente"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Editar</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onDelete(client)}
                        className="h-8 px-2.5 text-xs font-semibold text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400/50 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                        title="Excluir Registro do Cliente"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View - Cards */}
      <div className="lg:hidden space-y-6">
        {/* Mobile Sort Control & Select All */}
        <div className="flex items-center justify-between bg-seguranca-black/40 p-3 rounded-xl border border-gray-600/20 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={isAllSelected}
              onCheckedChange={(checked) => onSelectAllClients?.(!!checked)}
              className="border-gray-500 data-[state=checked]:bg-seguranca-red data-[state=checked]:border-seguranca-red"
            />
            <span className="text-white font-medium">Todos</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-seguranca-graphite border border-gray-600/30 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-seguranca-red"
            >
              <option value="name">Nome (Cliente)</option>
              <option value="cnpj">CNPJ</option>
              <option value="contactName">Contato</option>
              <option value="status">Status</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              className="h-7 px-2 text-xs text-seguranca-yellow hover:bg-seguranca-graphite"
            >
              {sortDirection === 'asc' ? 'A-Z ↑' : 'Z-A ↓'}
            </Button>
          </div>
        </div>

        {sortedClients.map((client, index) => {
          const isSelected = selectedClientIds.includes(client.id);
          return (
            <Card 
              key={client.id}
              className={`bg-gradient-to-br from-seguranca-black/60 to-seguranca-graphite/30 border-gray-600/20 hover:border-seguranca-red/50 transition-all duration-500 overflow-hidden group cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-seguranca-red/10 backdrop-blur-sm ${
                isSelected ? 'ring-2 ring-seguranca-red border-seguranca-red' : ''
              }`}
              onClick={() => onView(client)}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div onClick={(e) => e.stopPropagation()} className="pt-1">
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelectClient?.(client.id, !!checked)}
                        className="border-gray-500 data-[state=checked]:bg-seguranca-red data-[state=checked]:border-seguranca-red"
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-seguranca-red/20 to-seguranca-red/10 border border-seguranca-red/30 group-hover:from-seguranca-red/30 group-hover:to-seguranca-red/20 transition-all duration-300 shadow-lg shadow-seguranca-red/10">
                      <Building2 className="h-6 w-6 text-seguranca-red" />
                    </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-seguranca-lightgray group-hover:text-white transition-colors mb-1 truncate">
                      {client.name}
                    </h3>
                    <p className="text-sm text-gray-400 font-mono bg-gradient-to-r from-seguranca-black/60 to-seguranca-graphite/40 px-2 py-1 rounded border border-gray-600/30">
                      {formatCnpj(client.cnpj)}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(client.status)}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 text-sm">
                {client.email && (
                  <div className="flex items-center gap-3 text-gray-400 bg-seguranca-black/30 px-3 py-2 rounded-lg border border-gray-600/20">
                    <Mail className="h-4 w-4 flex-shrink-0 text-seguranca-red/60" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3 text-gray-400 bg-seguranca-black/30 px-3 py-2 rounded-lg border border-gray-600/20">
                    <Phone className="h-4 w-4 flex-shrink-0 text-seguranca-red/60" />
                    <span>{formatPhone(client.phone)}</span>
                  </div>
                )}
                {client.mobile && (
                  <div className="flex items-center gap-3 text-gray-400 bg-seguranca-black/30 px-3 py-2 rounded-lg border border-gray-600/20">
                    <Phone className="h-4 w-4 flex-shrink-0 text-gray-500" />
                    <span>{formatPhone(client.mobile)}</span>
                  </div>
                )}
                {client.city && client.state && (
                  <div className="flex items-center gap-3 text-gray-400 bg-seguranca-black/30 px-3 py-2 rounded-lg border border-gray-600/20">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-gray-500" />
                    <span>{client.city}/{client.state}</span>
                  </div>
                )}
                {client.contactName && (
                  <div className="flex items-center gap-3 text-gray-400 bg-seguranca-black/30 px-3 py-2 rounded-lg border border-gray-600/20">
                    <User className="h-4 w-4 flex-shrink-0 text-seguranca-red/60" />
                    <span className="truncate">{client.contactName}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div 
                className="flex gap-3 pt-4 border-t border-gray-600/20"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(client)}
                  className="flex-1 border-gray-600/30 text-seguranca-lightgray hover:bg-gradient-to-r hover:from-seguranca-graphite hover:to-seguranca-black hover:text-white hover:border-seguranca-red/50 transition-all duration-300"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(client)}
                  className="flex-1 border-gray-600/30 text-seguranca-lightgray hover:bg-gradient-to-r hover:from-seguranca-graphite hover:to-seguranca-black hover:text-white hover:border-seguranca-red/50 transition-all duration-300"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(client)}
                  className="border-red-600/30 text-red-400 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-red-600/10 hover:border-red-500/50 hover:text-red-300 transition-all duration-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
          );
        })}
      </div>
    </>
  );
};
