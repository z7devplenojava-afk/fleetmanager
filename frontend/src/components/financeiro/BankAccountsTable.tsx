import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  Upload, 
  Eye, 
  MoreHorizontal,
  Building2,
  DollarSign,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BankAccount } from '@/types/bankReconciliation';
import { useToast } from '@/hooks/use-toast';
import bankReconciliationService from '@/services/bankReconciliationService';

interface BankAccountsTableProps {
  accounts: BankAccount[];
  isLoading: boolean;
  onEdit: (account: BankAccount) => void;
  onImportStatement: (accountId: string) => void;
  onRefresh: () => void;
  searchTerm: string;
}

const BankAccountsTable: React.FC<BankAccountsTableProps> = ({
  accounts,
  isLoading,
  onEdit,
  onImportStatement,
  onRefresh,
  searchTerm
}) => {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filtrar contas baseado no termo de busca
  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountNumber.includes(searchTerm) ||
    account.agency.includes(searchTerm)
  );

  const handleDelete = async (account: BankAccount) => {
    if (!window.confirm(`Tem certeza que deseja excluir a conta "${account.name}"?`)) {
      return;
    }

    try {
      setDeletingId(account.id);
      await bankReconciliationService.deleteBankAccount(account.id);
      toast({
        title: "Sucesso",
        description: "Conta bancária excluída com sucesso!",
        variant: "default"
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao excluir conta bancária",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (account: BankAccount) => {
    try {
      setTogglingId(account.id);
      await bankReconciliationService.toggleBankAccountStatus(account.id);
      toast({
        title: "Sucesso",
        description: `Conta ${account.isActive ? 'desativada' : 'ativada'} com sucesso!`,
        variant: "default"
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao alterar status da conta",
        variant: "destructive"
      });
    } finally {
      setTogglingId(null);
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      'CHECKING': 'Conta Corrente',
      'SAVINGS': 'Poupança',
      'INVESTMENT': 'Investimento'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-seguranca-lightgray">Carregando contas bancárias...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-seguranca-graphite border-gray-600">
      <CardHeader>
        <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Contas Bancárias ({filteredAccounts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-600 hover:bg-gray-700/50">
                <TableHead className="text-seguranca-lightgray font-semibold">Nome</TableHead>
                <TableHead className="text-seguranca-lightgray font-semibold">Banco</TableHead>
                <TableHead className="text-seguranca-lightgray font-semibold">Agência</TableHead>
                <TableHead className="text-seguranca-lightgray font-semibold">Conta</TableHead>
                <TableHead className="text-seguranca-lightgray font-semibold">Tipo</TableHead>
                <TableHead className="text-seguranca-lightgray font-semibold text-right">Saldo</TableHead>
                <TableHead className="text-seguranca-lightgray font-semibold text-center">Status</TableHead>
                <TableHead className="text-seguranca-lightgray font-semibold text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-12">
                    <div className="flex flex-col items-center space-y-2">
                      <Building2 className="h-8 w-8 text-gray-500" />
                      <p className="text-lg font-medium">Nenhuma conta encontrada</p>
                      <p className="text-sm">Crie uma nova conta bancária para começar</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id} className="border-gray-600 hover:bg-gray-700/50 transition-colors">
                    <TableCell className="text-seguranca-lightgray font-medium">
                      {account.name}
                    </TableCell>
                    <TableCell className="text-seguranca-lightgray">
                      {account.bank}
                    </TableCell>
                    <TableCell className="text-seguranca-lightgray font-mono">
                      {account.agency}
                    </TableCell>
                    <TableCell className="text-seguranca-lightgray font-mono">
                      {account.accountNumber}
                    </TableCell>
                    <TableCell className="text-seguranca-lightgray">
                      <Badge variant="outline" className="border-blue-500 text-blue-400">
                        {getAccountTypeLabel(account.accountType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${account.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(account.balance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={account.isActive ? "default" : "secondary"}
                        className={account.isActive ? "bg-green-600 text-white" : "bg-gray-600 text-gray-300"}
                      >
                        {account.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-seguranca-black border-gray-600">
                          <DropdownMenuItem
                            onClick={() => onEdit(account)}
                            className="text-seguranca-lightgray hover:bg-gray-700"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onImportStatement(account.id)}
                            className="text-seguranca-lightgray hover:bg-gray-700"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Importar Extrato
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(account)}
                            disabled={togglingId === account.id}
                            className="text-seguranca-lightgray hover:bg-gray-700"
                          >
                            {account.isActive ? (
                              <ToggleLeft className="mr-2 h-4 w-4" />
                            ) : (
                              <ToggleRight className="mr-2 h-4 w-4" />
                            )}
                            {account.isActive ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(account)}
                            disabled={deletingId === account.id}
                            className="text-red-400 hover:bg-red-900/20"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default BankAccountsTable;