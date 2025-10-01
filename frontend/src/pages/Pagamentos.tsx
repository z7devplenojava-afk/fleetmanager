import React from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Pagamentos as PagamentosComponent } from '@/components/financeiro/Pagamentos';

const Pagamentos: React.FC = () => {
  return (
    <StandardLayout>
      <div className="container mx-auto p-6">
        <PagamentosComponent />
      </div>
    </StandardLayout>
  );
};

export default Pagamentos;


