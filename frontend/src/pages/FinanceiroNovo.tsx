import React from 'react';
import { MainLayout } from '@/components/MainLayout';
import { ModuloFinanceiro } from '@/components/financeiro';

export default function FinanceiroNovo() {
  return (
    <MainLayout title="Módulo Financeiro" subtitle="Gestão completa das finanças">
      <ModuloFinanceiro />
    </MainLayout>
  );
}
