import React from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import MessageDashboard from '../components/mensagens/MessageDashboard';
import { useGSAP } from '@/hooks/use-gsap';

const Mensagens: React.FC = () => {
  useGSAP();

  return (
    <StandardLayout 
      title="Mensagens"
      subtitle="Gerencie as mensagens e comunicações do sistema"
    >
      <div data-animate="fadeUp" data-delay="100">
        <MessageDashboard />
      </div>
    </StandardLayout>
  );
};

export default Mensagens; 