import React from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import ContasAReceberComponent from '@/components/financeiro/ContasAReceber';

const ContasAReceber: React.FC = () => {
  return (
    <StandardLayout>
      <div className="container mx-auto p-6">
        <ContasAReceberComponent />
      </div>
    </StandardLayout>
  );
};

export default ContasAReceber;


