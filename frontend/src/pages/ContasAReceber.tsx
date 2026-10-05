import React from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import ContasAReceberTab from '@/components/financeiro/ContasAReceberTab';

const ContasAReceber: React.FC = () => {
  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <ContasAReceberTab />
      </div>
    </StandardLayout>
  );
};

export default ContasAReceber;
