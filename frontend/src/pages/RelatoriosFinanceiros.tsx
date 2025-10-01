import React, { useEffect, useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { FinanceiroRelatorios } from '@/components/financeiro/FinanceiroRelatorios';
import { financialService, FinancialTransaction, Invoice } from '@/services/financialService';

const RelatoriosFinanceiros: React.FC = () => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, i] = await Promise.all([
          financialService.getTransactions(),
          financialService.getInvoices(),
        ]);
        setTransactions(Array.isArray(t) ? t : []);
        setInvoices(Array.isArray(i) ? i : []);
      } catch (e) {
        setTransactions([]);
        setInvoices([]);
      }
    };
    load();
  }, []);

  return (
    <StandardLayout>
      <div className="container mx-auto p-6">
        <FinanceiroRelatorios
          transactions={transactions}
          invoices={invoices}
          refreshData={() => {}}
        />
      </div>
    </StandardLayout>
  );
};

export default RelatoriosFinanceiros;


