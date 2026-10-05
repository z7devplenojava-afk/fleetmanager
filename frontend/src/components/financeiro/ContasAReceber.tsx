import React from 'react';
import ContasAReceberTab from './ContasAReceberTab';
import { ContasAReceberGuard } from './FinanceiroPermissionGuard';

export const ContasAReceber: React.FC = () => {
  return (
    <ContasAReceberGuard requiredPermission="VIEW_ACCOUNTS_RECEIVABLE">
      <ContasAReceberTab />
    </ContasAReceberGuard>
  );
};

export default ContasAReceber;
