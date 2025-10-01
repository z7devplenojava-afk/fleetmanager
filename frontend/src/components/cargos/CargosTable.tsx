import React, { useState } from 'react';
import { Position } from '@/services/positionService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface CargosTableProps {
  cargos: Position[];
  isLoading: boolean;
  onEdit: (cargo: Position) => void;
  onDelete: (cargo: Position) => void;
  onRefresh: () => void;
}

const CargosTable: React.FC<CargosTableProps> = ({ cargos, isLoading, onEdit, onDelete }) => {
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="animate-spin mr-2" /> Carregando...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-seguranca-black/50 border-gray-700">
            <TableHead className="text-seguranca-yellow font-medium">Nome</TableHead>
            <TableHead className="text-seguranca-yellow font-medium">Descrição</TableHead>
            <TableHead className="text-seguranca-yellow font-medium">Salário Base</TableHead>
            <TableHead className="text-seguranca-yellow font-medium">Status</TableHead>
            <TableHead className="text-right text-seguranca-yellow font-medium">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cargos.length > 0 ? (
            cargos.map(cargo => (
              <TableRow key={cargo.id} className="border-gray-700 text-seguranca-lightgray hover:bg-seguranca-black transition-colors">
                <TableCell className="font-medium text-white">{cargo.name}</TableCell>
                <TableCell className="text-seguranca-lightgray">{cargo.description || 'N/A'}</TableCell>
                <TableCell className="text-seguranca-lightgray">{formatCurrency(cargo.baseSalary)}</TableCell>
                <TableCell>
                  <Badge className="bg-green-500 text-white text-xs">
                    Ativo
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-seguranca-lightgray hover:bg-seguranca-black">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <DropdownMenuItem onClick={() => onEdit(cargo)} className="hover:bg-seguranca-graphite">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(cargo)} className="hover:bg-seguranca-graphite text-red-500 hover:text-red-400">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-seguranca-lightgray py-8">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-lg">Nenhum cargo encontrado</p>
                  <p className="text-sm text-gray-400">Crie um novo cargo para começar</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CargosTable;
