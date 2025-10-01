
import React, { useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ContatoTableRow } from './ContatoTableRow';
import { ContatoDeleteDialog } from './ContatoDeleteDialog';

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

interface ContatosTableProps {
  contatos: Contato[];
  onEdit: (contato: Contato) => void;
  onDelete: () => void;
}

export const ContatosTable: React.FC<ContatosTableProps> = ({
  contatos,
  onEdit,
  onDelete
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contatoToDelete, setContatoToDelete] = useState<Contato | null>(null);

  const handleDeleteClick = (contato: Contato) => {
    setContatoToDelete(contato);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    onDelete();
    setContatoToDelete(null);
  };

  return (
    <>
      <div className="rounded-lg border border-gray-600 bg-seguranca-graphite">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-600">
              <TableHead className="text-seguranca-lightgray">Nome</TableHead>
              <TableHead className="text-seguranca-lightgray">Contato</TableHead>
              <TableHead className="text-seguranca-lightgray">Empresa</TableHead>
              <TableHead className="text-seguranca-lightgray">Tipo</TableHead>
              <TableHead className="text-seguranca-lightgray">Status</TableHead>
              <TableHead className="text-seguranca-lightgray text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contatos.map((contato) => (
              <ContatoTableRow
                key={contato.id}
                contato={contato}
                onEdit={onEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <ContatoDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        contato={contatoToDelete}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
};
