import React, { useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import CentroCustosTab from '@/components/financeiro/CentroCustosTab';

const CentrosDeCusto: React.FC = () => {
  useEffect(() => {
    console.log('✅ CentrosDeCusto component mounted');
  }, []);

  return (
    <StandardLayout title="Centros de Custos">
      <CentroCustosTab />
    </StandardLayout>
  );
};

export default CentrosDeCusto;


