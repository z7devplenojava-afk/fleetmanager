import React from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { FluxoCaixa as FluxoCaixaComponent } from '@/components/financeiro/FluxoCaixa';

const FluxoCaixa: React.FC = () => {
  return (
    <StandardLayout>
      <div className="container mx-auto p-6">
        <FluxoCaixaComponent />
      </div>
    </StandardLayout>
  );
};

export default FluxoCaixa;


