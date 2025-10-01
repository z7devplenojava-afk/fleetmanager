
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Mail, Phone } from 'lucide-react';
import { StatusBadge, TipoBadge } from './ContatoBadges';

interface Contato {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  cargo: string;
  endereco: string;
  observacoes: string;
  tipo: string;
  status: string;
  created_at: string;
}

interface ContatoTableRowProps {
  contato: Contato;
  onEdit: (contato: Contato) => void;
  onDelete: (contato: Contato) => void;
}

export const ContatoTableRow: React.FC<ContatoTableRowProps> = ({
  contato,
  onEdit,
  onDelete
}) => {
  return (
    <TableRow className="border-gray-600">
      <TableCell className="text-seguranca-lightgray">
        <div>
          <div className="font-medium">{contato.nome}</div>
          {contato.cargo && (
            <div className="text-sm text-gray-400">{contato.cargo}</div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-seguranca-lightgray">
        <div className="space-y-1">
          {contato.email && (
            <div className="flex items-center gap-1 text-sm">
              <Mail size={12} />
              {contato.email}
            </div>
          )}
          {contato.telefone && (
            <div className="flex items-center gap-1 text-sm">
              <Phone size={12} />
              {contato.telefone}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-seguranca-lightgray">
        {contato.empresa || '-'}
      </TableCell>
      <TableCell>
        <TipoBadge tipo={contato.tipo} />
      </TableCell>
      <TableCell>
        <StatusBadge status={contato.status} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(contato)}
            className="text-seguranca-yellow hover:bg-seguranca-black"
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(contato)}
            className="text-red-500 hover:bg-seguranca-black"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
