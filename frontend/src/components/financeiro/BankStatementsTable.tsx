import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { BankAccount } from '@/types/bankReconciliation';

interface BankStatementsTableProps {
  accounts: BankAccount[];
  accountFilter: string;
  searchTerm: string;
}

const BankStatementsTable: React.FC<BankStatementsTableProps> = ({
  accounts,
  accountFilter,
  searchTerm
}) => {
  // Por enquanto, vamos mostrar uma tabela placeholder
  // Em uma implementação real, você buscaria os extratos do backend
  
  return (
    <Card className="bg-seguranca-graphite border-gray-600">
      <CardHeader>
        <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Extratos Bancários
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-gray-400 py-12">
          <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-lg font-medium">Funcionalidade em Desenvolvimento</p>
          <p className="text-sm">
            A visualização de extratos bancários será implementada em breve.
            <br />
            Por enquanto, use a importação de extratos nas contas bancárias.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BankStatementsTable;