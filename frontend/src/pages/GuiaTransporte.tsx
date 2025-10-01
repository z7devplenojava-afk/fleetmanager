import React from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import TransportGuideTab from '@/components/operacional/TransportGuideTab';

const GuiaTransporte: React.FC = () => {
  return (
    <StandardLayout>
      <div className="space-y-6">
        <TransportGuideTab />
      </div>
    </StandardLayout>
  );
};

export default GuiaTransporte;
