import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, Edit, Trash2, Eye, User, Mail, Phone, MapPin, 
  Calendar, Building, FileText, UserPlus, AlertCircle, UserMinus, Briefcase,
  ArrowUpDown, ArrowUp, ArrowDown, QrCode, Check
} from 'lucide-react';
import { Employee } from '@/types/employee';

type SortField = 'name' | 'hireDate' | 'terminationDate' | 'position';
type SortDirection = 'asc' | 'desc';

interface FuncionariosTableProps {
  employees: Employee[];
  onView?: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onTerminate: (employee: Employee) => void;
  onViewDocuments: (employee: Employee) => void;
  onViewDependents: (employee: Employee) => void;
  onCracha?: (employee: Employee) => void;
  isLoading?: boolean;
}

export const getEmployeeTerminationDate = (employee: Employee): string | undefined =>
  employee.terminationDate || employee.dataRescisao || undefined;

export const FuncionariosTable: React.FC<FuncionariosTableProps> = ({
  employees,
  onView,
  onEdit,
  onDelete,
  onTerminate,
  onViewDocuments,
  onViewDependents,
  onCracha,
  isLoading = false
}) => {
  const [sortField, setSortField] = useState<SortField>('hireDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'name' || field === 'position' ? 'asc' : 'desc');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === employees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employees.map(e => e.id)));
    }
  };

  const sortedEmployees = useMemo(() => {
    if (!employees?.length) return [];
    return [...employees].sort((a, b) => {
      if (sortField === 'name') {
        const cmp = (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      if (sortField === 'position') {
        const cmp = (a.position?.name || '').localeCompare(b.position?.name || '', 'pt-BR', { sensitivity: 'base' });
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      const valA = sortField === 'hireDate' ? (a.hireDate || '') : (getEmployeeTerminationDate(a) || '');
      const valB = sortField === 'hireDate' ? (b.hireDate || '') : (getEmployeeTerminationDate(b) || '');
      const cmp = valA.localeCompare(valB, 'pt-BR');
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [employees, sortField, sortDirection]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-40 group-hover/head:opacity-100 transition-opacity inline ml-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-seguranca-yellow font-bold inline ml-1" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-seguranca-yellow font-bold inline ml-1" />
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Ativo
          </span>
        );
      case 'TERMINATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/60 border border-rose-500/40 text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Demitido
          </span>
        );
      case 'VACATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/60 border border-blue-500/40 text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Férias
          </span>
        );
      case 'MEDICAL_CERTIFICATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/60 border border-purple-500/40 text-purple-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Atestado
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-950/60 border border-orange-500/40 text-orange-400">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Suspenso
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-800/80 border border-gray-600 text-gray-300">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Inativo
          </span>
        );
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    try {
      const clean = date.includes('T') ? date : (date.length === 10 ? `${date}T00:00:00` : date);
      const parsed = new Date(clean);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('pt-BR');
      }
    } catch {}
    return '-';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="h-20 bg-seguranca-black/50 animate-pulse rounded-xl border border-gray-700/40"
          />
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-16">
        <User className="h-16 w-16 mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg font-medium">Nenhum funcionário encontrado</p>
        <p className="text-gray-500 text-sm mt-2">
          Tente ajustar os filtros ou adicione um novo funcionário
        </p>
      </div>
    );
  }

  const allSelected = employees.length > 0 && selectedIds.size === employees.length;

  return (
    <>
      {/* Desktop View - Table (Exatamente como na Imagem 1 e 2) */}
      <div className="hidden lg:block rounded-2xl border border-gray-800/80 overflow-hidden bg-[#12141a]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#161820] hover:bg-[#1a1d26] border-b border-gray-800/90">
              
              {/* Checkbox Circular */}
              <TableHead className="w-[50px] text-center">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className={`w-4 h-4 rounded-full border transition-colors inline-flex items-center justify-center cursor-pointer ${
                    allSelected 
                      ? 'border-seguranca-red bg-seguranca-red text-white' 
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  title="Selecionar todos"
                >
                  {allSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </button>
              </TableHead>

              {/* Funcionário */}
              <TableHead 
                className="text-amber-400 font-bold text-xs uppercase tracking-wider cursor-pointer select-none group/head"
                onClick={() => handleSort('name')}
              >
                Funcionário{renderSortIcon('name')}
              </TableHead>

              {/* Cargo/Função */}
              <TableHead 
                className="text-amber-400 font-bold text-xs uppercase tracking-wider cursor-pointer select-none group/head"
                onClick={() => handleSort('position')}
              >
                Cargo/Função{renderSortIcon('position')}
              </TableHead>

              {/* Empresa */}
              <TableHead className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                Empresa
              </TableHead>

              {/* Setor de Trabalho */}
              <TableHead className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                Setor de Trabalho
              </TableHead>

              {/* Escala */}
              <TableHead className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                Escala
              </TableHead>

              {/* Horário */}
              <TableHead className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                Horário
              </TableHead>

              {/* Admissão */}
              <TableHead 
                className="text-amber-400 font-bold text-xs uppercase tracking-wider cursor-pointer select-none group/head"
                onClick={() => handleSort('hireDate')}
              >
                Admissão{renderSortIcon('hireDate')}
              </TableHead>

              {/* Demissão */}
              <TableHead 
                className="text-amber-400 font-bold text-xs uppercase tracking-wider cursor-pointer select-none group/head"
                onClick={() => handleSort('terminationDate')}
              >
                Demissão{renderSortIcon('terminationDate')}
              </TableHead>

              {/* Status */}
              <TableHead className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                Status
              </TableHead>

              {/* Ações */}
              <TableHead className="text-amber-400 font-bold text-xs uppercase tracking-wider w-[90px] text-right pr-4">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedEmployees.map((employee, index) => {
              const isSelected = selectedIds.has(employee.id);
              const workSector = (employee as any).department?.name || employee.unit?.name || employee.workPost?.name;
              const companySigla = employee.company?.sigla || (employee as any).empresaNome || (employee as any).companyName || 'VIG';
              const escala = employee.escalaTrabalho || employee.currentScale || employee.diasTrabalho;
              const horario = employee.horarioTrabalho || (employee as any).workSchedule;

              return (
                <TableRow 
                  key={employee.id}
                  onClick={() => onView?.(employee)}
                  className={`border-b border-gray-800/60 hover:bg-[#1a1e29] cursor-pointer transition-colors duration-150 group ${
                    isSelected ? 'bg-red-950/20' : ''
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Checkbox Circular */}
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggleSelect(employee.id)}
                      className={`w-4 h-4 rounded-full border transition-colors inline-flex items-center justify-center cursor-pointer ${
                        isSelected 
                          ? 'border-seguranca-red bg-seguranca-red text-white' 
                          : 'border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </button>
                  </TableCell>

                  {/* Funcionário (Avatar Vermelho + Nome Caixa Alta + CPF) */}
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-600/15 border border-red-500/30 flex items-center justify-center shrink-0 text-red-500">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white text-xs sm:text-sm uppercase tracking-wide group-hover:text-amber-300 transition-colors truncate max-w-[220px]">
                          {employee.name}
                        </div>
                        {employee.cpf ? (
                          <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                            CPF: {employee.cpf}
                          </div>
                        ) : employee.registrationNumber ? (
                          <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                            Mat: {employee.registrationNumber}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>

                  {/* Cargo/Função */}
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300 font-medium">
                      <Building className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                      <span className="truncate max-w-[180px]">{employee.position?.name || 'Não definido'}</span>
                    </div>
                  </TableCell>

                  {/* Empresa */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white">
                      <Building className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                      <span>{companySigla}</span>
                    </div>
                  </TableCell>

                  {/* Setor de Trabalho */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-300">
                      <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="truncate max-w-[200px] uppercase font-medium">
                        {workSector || <span className="italic text-gray-500 lowercase">não definido</span>}
                      </span>
                    </div>
                  </TableCell>

                  {/* Escala */}
                  <TableCell>
                    <span className="text-xs sm:text-sm font-medium text-gray-300 uppercase">
                      {escala || <span className="text-gray-500 italic text-xs lowercase">não definida</span>}
                    </span>
                  </TableCell>

                  {/* Horário */}
                  <TableCell>
                    <span className="text-xs sm:text-sm font-medium text-gray-300">
                      {horario || <span className="text-gray-500 italic text-xs">-</span>}
                    </span>
                  </TableCell>

                  {/* Admissão */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-300">
                      <Calendar className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                      <span>{formatDate(employee.hireDate)}</span>
                    </div>
                  </TableCell>

                  {/* Demissão */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-300">
                      <Calendar className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                      <span>{formatDate(getEmployeeTerminationDate(employee))}</span>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {getStatusBadge(employee.status || 'INACTIVE')}
                  </TableCell>

                  {/* Ações: Olho + Menu Dropdown (Exatamente como nas Imagens 1 e 2) */}
                  <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {/* Botão de Olho (Visualizar) Direto na Linha */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView?.(employee);
                        }}
                        className="h-8 w-8 p-0 text-sky-400 hover:text-sky-300 hover:bg-sky-500/15 rounded-lg transition-colors"
                        title="Visualizar Detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Menu 3 Pontinhos */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent 
                          align="end" 
                          className="bg-[#12141c]/95 border-gray-800 w-56 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md"
                        >
                          {/* 1. Visualizar Detalhes */}
                          <DropdownMenuItem 
                            onClick={() => onView?.(employee)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300 cursor-pointer rounded-xl text-xs font-semibold"
                          >
                            <Eye className="h-4 w-4" />
                            Visualizar Detalhes
                          </DropdownMenuItem>

                          {/* 2. Editar Funcionário */}
                          <DropdownMenuItem 
                            onClick={() => onEdit(employee)}
                            className="flex items-center gap-2.5 px-3 py-2 text-gray-200 hover:bg-gray-800 hover:text-white cursor-pointer rounded-xl text-xs font-medium"
                          >
                            <Edit className="h-4 w-4 text-gray-400" />
                            Editar Funcionário
                          </DropdownMenuItem>

                          {/* 3. Ver Documentos */}
                          <DropdownMenuItem 
                            onClick={() => onViewDocuments(employee)}
                            className="flex items-center gap-2.5 px-3 py-2 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 cursor-pointer rounded-xl text-xs font-medium"
                          >
                            <FileText className="h-4 w-4" />
                            Ver Documentos
                          </DropdownMenuItem>

                          {/* 4. Crachá / QR Code */}
                          <DropdownMenuItem 
                            onClick={() => onCracha ? onCracha(employee) : onView?.(employee)}
                            className="flex items-center gap-2.5 px-3 py-2 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 cursor-pointer rounded-xl text-xs font-medium"
                          >
                            <QrCode className="h-4 w-4" />
                            Crachá / QR Code
                          </DropdownMenuItem>

                          {/* 5. Ver Dependentes */}
                          <DropdownMenuItem 
                            onClick={() => onViewDependents(employee)}
                            className="flex items-center gap-2.5 px-3 py-2 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 cursor-pointer rounded-xl text-xs font-medium"
                          >
                            <UserPlus className="h-4 w-4" />
                            Ver Dependentes
                          </DropdownMenuItem>

                          {/* 6. Demitir / Excluir */}
                          {employee.status !== 'TERMINATED' ? (
                            <DropdownMenuItem 
                              onClick={() => onTerminate(employee)}
                              className="flex items-center gap-2.5 px-3 py-2 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 cursor-pointer rounded-xl text-xs font-medium border-t border-gray-800/80 mt-1 pt-2"
                            >
                              <UserMinus className="h-4 w-4" />
                              Demitir Funcionário
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => onDelete(employee)}
                              className="flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 cursor-pointer rounded-xl text-xs font-medium border-t border-gray-800/80 mt-1 pt-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir Funcionário
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View - Cards */}
      <div className="lg:hidden space-y-4">
        {sortedEmployees.map((employee, index) => {
          const workSector = (employee as any).department?.name || employee.unit?.name || employee.workPost?.name;
          const companySigla = employee.company?.sigla || (employee as any).empresaNome || (employee as any).companyName || 'VIG';
          const escala = employee.escalaTrabalho || employee.currentScale || employee.diasTrabalho;
          const horario = employee.horarioTrabalho || (employee as any).workSchedule;

          return (
            <Card 
              key={employee.id}
              onClick={() => onView?.(employee)}
              className="bg-[#161820] border-gray-800 hover:border-red-500/40 cursor-pointer transition-all duration-300 overflow-hidden group rounded-2xl"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-xl bg-red-600/15 border border-red-500/30 text-red-500 shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white uppercase text-sm tracking-wide truncate group-hover:text-amber-300 transition-colors">
                        {employee.name}
                      </h3>
                      {employee.cpf ? (
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          CPF: {employee.cpf}
                        </p>
                      ) : employee.registrationNumber ? (
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          Mat: {employee.registrationNumber}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {getStatusBadge(employee.status || 'INACTIVE')}
                </div>

                {/* Info */}
                <div className="space-y-2 text-xs text-gray-300 pt-1">
                  {employee.position?.name && (
                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                      <span>{employee.position.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span className="font-bold text-white">Empresa: {companySigla}</span>
                  </div>
                  {workSector && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="uppercase">{workSector}</span>
                    </div>
                  )}
                  {escala && (
                    <div className="flex items-center gap-2 text-amber-400 font-medium">
                      <span>Escala: {escala}</span>
                      {horario && <span className="text-gray-400">• {horario}</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-gray-400 pt-1 border-t border-gray-800">
                    <span>Adm: {formatDate(employee.hireDate)}</span>
                    {getEmployeeTerminationDate(employee) && (
                      <span>Dem: {formatDate(getEmployeeTerminationDate(employee))}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-800" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView?.(employee)}
                    className="border-sky-500/40 text-sky-400 hover:bg-sky-500/10 flex-1 text-xs"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Visualizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(employee)}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 flex-1 text-xs"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDocuments(employee)}
                    className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 flex-1 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Docs
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
