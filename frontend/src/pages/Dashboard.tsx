import React from 'react';
import { Layout } from '@/components/Layout';
import { DashboardCard, DashboardGrid } from '@/components/DashboardCard';
import Chart from '../components/Chart';
import { Users, FileText, DollarSign, ClipboardList, Bell, AlertTriangle, Key } from 'lucide-react';
import { useAOS } from '@/hooks/use-aos';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const aos = useAOS();
  const navigate = useNavigate();
  
  const dashboardData = {
    cards: [
      {
        title: 'Total de contratos ativos',
        value: 48,
        icon: FileText,
        color: 'red' as const,
        change: { value: 8, isPositive: true }
      },
      {
        title: 'Funcionários em serviço',
        value: 124,
        icon: Users,
        color: 'yellow' as const,
        change: { value: 12, isPositive: true }
      },
      {
        title: 'Pagamentos pendentes',
        value: 'R$ 54.350,00',
        icon: DollarSign,
        color: 'darkred' as const,
        change: { value: 5, isPositive: false }
      },
      {
        title: 'Serviços em andamento',
        value: 37,
        icon: ClipboardList,
        color: 'light' as const,
        change: { value: 3, isPositive: true }
      },
      {
        title: 'Gerenciar Roles',
        value: '',
        icon: Key,
        color: 'red' as const,
        action: {
          label: 'Acessar Roles',
          onClick: () => navigate('/roles'),
          variant: 'default'
        }
      }
    ],
    chartData: [
      { name: 'Seg', 'Diurno': 18, 'Noturno': 12 },
      { name: 'Ter', 'Diurno': 16, 'Noturno': 14 },
      { name: 'Qua', 'Diurno': 17, 'Noturno': 15 },
      { name: 'Qui', 'Diurno': 15, 'Noturno': 13 },
      { name: 'Sex', 'Diurno': 21, 'Noturno': 19 },
      { name: 'Sáb', 'Diurno': 12, 'Noturno': 18 },
      { name: 'Dom', 'Diurno': 10, 'Noturno': 16 }
    ],
    alerts: [
      {
        id: 1,
        title: 'Contrato a vencer',
        message: 'Contrato #2458 com Shopping Center Norte vencerá em 7 dias',
        time: '2 horas atrás',
        type: 'warning'
      },
      {
        id: 2,
        title: 'Funcionário sem escala',
        message: 'Carlos Oliveira não possui escala definida para a próxima semana',
        time: '5 horas atrás',
        type: 'alert'
      },
      {
        id: 3,
        title: 'Pagamento recebido',
        message: 'Pagamento de R$ 12.480,00 do cliente Condomínio Park Avenue foi confirmado',
        time: '8 horas atrás',
        type: 'success'
      }
    ]
  };

  return (
    <Layout activePage="dashboard">
      <div className="space-y-6">
        <div data-aos={aos.fadeDown}>
          <h1 className="text-2xl font-bold text-seguranca-lightgray mb-2">Dashboard</h1>
          <p className="text-gray-400">Visão geral do sistema de controle</p>
        </div>
        
        <DashboardGrid>
          {dashboardData.cards.map((card, index) => (
            <div key={index} data-aos={aos.fadeUp} data-aos-delay={index * 100}>
              <DashboardCard 
                title={card.title}
                value={card.value}
                icon={card.icon}
                trend={card.change ? {
                  value: card.change.value,
                  isPositive: card.change.isPositive,
                  label: 'em relação ao mês passado'
                } : undefined}
              />
            </div>
          ))}
        </DashboardGrid>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2" data-aos={aos.fadeRight}>
            <Chart 
              title="Escalas de Trabalho - Últimos 7 dias"
              data={dashboardData.chartData}
              dataKeys={[
                { key: 'Diurno', color: '#FFCC00', name: 'Turno Diurno' },
                { key: 'Noturno', color: '#DD0000', name: 'Turno Noturno' }
              ]}
            />
          </div>
          
          <div className="bg-seguranca-graphite rounded-lg p-6 border border-gray-600" data-aos={aos.fadeLeft}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-seguranca-lightgray">Notificações Recentes</h3>
              <Bell size={18} className="text-seguranca-yellow" />
            </div>
            
            <div className="space-y-4">
              {dashboardData.alerts.map((alert, index) => (
                <div key={alert.id} className="p-3 bg-seguranca-black rounded-lg border-l-4 border-seguranca-yellow"
                     data-aos={aos.fadeUp} data-aos-delay={index * 100}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <AlertTriangle size={16} className="text-seguranca-yellow" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-seguranca-lightgray">{alert.title}</h4>
                      <p className="text-sm text-gray-400 my-1">{alert.message}</p>
                      <span className="text-xs text-gray-500">{alert.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="text-seguranca-yellow hover:underline text-sm mt-4 w-full text-center">
              Ver todas as notificações
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
