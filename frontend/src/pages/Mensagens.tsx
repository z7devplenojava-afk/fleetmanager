import React from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import MessageDashboard from '../components/mensagens/MessageDashboard';
import { useAOS } from '../hooks/use-aos';

const Mensagens: React.FC = () => {
  useAOS();

  return (
    <StandardLayout 
      title="Mensagens"
      subtitle="Gerencie as mensagens e comunicações do sistema"
    >
      <div data-aos="fade-up" data-aos-delay="100">
        <MessageDashboard />
      </div>
    </StandardLayout>
  );
};

export default Mensagens; 