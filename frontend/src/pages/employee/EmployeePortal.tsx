import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Clock, 
  FileText, 
  BookOpen, 
  Calendar, 
  Bell,
  LogOut,
  Menu,
  X,
  Home,
  UserCircle,
  CreditCard,
  Building2,
  Bus,
  ShieldCheck,
  Award,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Component imports
import EmployeeProfile from '@/components/employee/EmployeeProfile';
import TimeRecords from '@/components/employee/TimeRecords';
import Payslips from '@/components/employee/Payslips';
import Documents from '@/components/employee/Documents';
import Trainings from '@/components/employee/Trainings';
import Vacations from '@/components/employee/Vacations';
import Notifications from '@/components/employee/Notifications';
import EmployeeDashboard from '@/components/employee/EmployeeDashboard';
import ClientPassengerPortalContent from '@/components/employee/ClientPassengerPortalContent';
import Benefits from '@/components/employee/Benefits';
import EpiForms from '@/components/employee/EpiForms';
import YearCalendarModal from '@/components/employee/YearCalendarModal';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';

interface EmployeePortalProps {}

const EmployeePortal: React.FC<EmployeePortalProps> = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Detecta se o funcionário é de uma empresa cliente (passageiro de fretado)
  const isAutoDetectedClient = Boolean(
    (user as any)?.isClientUser ||
    (user as any)?.contractType === 'CLIENT' ||
    user?.company?.isClient ||
    ((user as any)?.companyName && !(user as any)?.companyName.toLowerCase().includes('silvestre'))
  );

  const [isClientEmployee, setIsClientEmployee] = useState<boolean>(() => {
    const saved = localStorage.getItem('employee_portal_mode');
    if (saved !== null) {
      return saved === 'client';
    }
    return isAutoDetectedClient;
  });

  const [activeTab, setActiveTab] = useState(() => (isClientEmployee ? 'fretamento' : 'dashboard'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  const today = new Date();
  const formattedTodayShort = today.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const handleToggleMode = (mode: 'operator' | 'client') => {
    const isClient = mode === 'client';
    setIsClientEmployee(isClient);
    localStorage.setItem('employee_portal_mode', mode);
    setActiveTab(isClient ? 'fretamento' : 'dashboard');
    toast({
      title: isClient ? 'Modo: Colaborador de Cliente' : 'Modo: Funcionário VSS',
      description: isClient 
        ? 'Exibindo funcionalidades exclusivas de passageiro de fretamento corporativo.'
        : 'Exibindo funcionalidades da equipe interna da Viação São Silvestre.',
    });
  };

  // Menu para funcionários internos da Viação São Silvestre
  const operatorMenuItems = [
    { id: 'dashboard', label: 'Início', icon: Home },
    { id: 'profile', label: 'Meu Perfil', icon: UserCircle },
    { id: 'time-records', label: 'Ponto Eletrônico', icon: Clock },
    { id: 'payslips', label: 'Holerites', icon: FileText },
    { id: 'benefits', label: 'Benefícios', icon: Award },
    { id: 'epi', label: 'Fichas de EPI', icon: ShieldCheck },
    { id: 'documents', label: 'Documentos', icon: CreditCard },
    { id: 'trainings', label: 'Treinamentos', icon: BookOpen },
    { id: 'vacations', label: 'Férias', icon: Calendar },
    { id: 'notifications', label: 'Notificações do RH', icon: Bell },
  ];

  // Menu para colaboradores de empresas clientes (Passageiros do fretado)
  const clientMenuItems = [
    { id: 'fretamento', label: 'Fretamento & Rota', icon: Bus },
    { id: 'profile', label: 'Meu Perfil', icon: UserCircle },
    { id: 'documents', label: 'Documentos', icon: CreditCard },
    { id: 'notifications', label: 'Notificações', icon: Bell },
  ];

  const currentMenuItems = isClientEmployee ? clientMenuItems : operatorMenuItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    if (isClientEmployee && activeTab === 'fretamento') {
      return <ClientPassengerPortalContent />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <EmployeeDashboard />;
      case 'profile':
        return <EmployeeProfile />;
      case 'time-records':
        return <TimeRecords />;
      case 'payslips':
        return <Payslips />;
      case 'benefits':
        return <Benefits />;
      case 'epi':
        return <EpiForms />;
      case 'documents':
        return <Documents />;
      case 'trainings':
        return <Trainings />;
      case 'vacations':
        return <Vacations />;
      case 'notifications':
        return <Notifications />;
      default:
        return isClientEmployee ? <ClientPassengerPortalContent /> : <EmployeeDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header / Navbar do Funcionário */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-40 backdrop-blur-md">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-black">
                  <Bus className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black text-foreground leading-tight">Portal do Funcionário</h1>
                  <span className="text-[11px] text-muted-foreground block">
                    {isClientEmployee ? 'Passageiro de Empresa Cliente' : 'Viação São Silvestre (Operadora)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Botão de Calendário do Sistema (com destaque do mês/dia atual) */}
              <button
                type="button"
                onClick={() => setCalendarModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-xs font-semibold border border-border transition-colors text-foreground"
                title="Abrir Calendário Anual"
              >
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="capitalize hidden sm:inline">{formattedTodayShort}</span>
              </button>

              {/* Sino de Notificações com Badge */}
              <div className="relative">
                <NotificationBell />
              </div>

              {/* Seletor Rápido de Contexto: Empresa Operadora vs Cliente */}
              <div className="hidden sm:flex items-center p-1 bg-muted rounded-xl border border-border text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleMode('operator')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    !isClientEmployee
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5 text-blue-500" />
                  Equipe VSS
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMode('client')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    isClientEmployee
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Bus className="h-3.5 w-3.5 text-emerald-500" />
                  Cliente Fretado
                </button>
              </div>

              <div className="hidden lg:flex items-center space-x-2 pl-1 border-l border-border/50">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-medium text-foreground max-w-[120px] truncate">{user?.name}</span>
              </div>

              <ThemeToggle />

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 h-9 px-3 border-border hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-64 bg-card shadow-sm min-h-screen border-r border-border shrink-0`}>
          <div className="p-4 border-b border-border/50 block sm:hidden">
            <span className="text-xs text-muted-foreground block mb-1 font-bold">Tipo de Perfil:</span>
            <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg text-xs">
              <button
                onClick={() => handleToggleMode('operator')}
                className={`py-1 rounded font-bold ${!isClientEmployee ? 'bg-card text-foreground' : 'text-muted-foreground'}`}
              >
                Equipe VSS
              </button>
              <button
                onClick={() => handleToggleMode('client')}
                className={`py-1 rounded font-bold ${isClientEmployee ? 'bg-card text-foreground' : 'text-muted-foreground'}`}
              >
                Cliente
              </button>
            </div>
          </div>

          <nav className="mt-4 px-3">
            <div className="space-y-1">
              {currentMenuItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="mr-3 h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 bg-background min-w-0">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Modal de Calendário Completo Anual */}
      <YearCalendarModal 
        isOpen={calendarModalOpen} 
        onClose={() => setCalendarModalOpen(false)} 
      />
    </div>
  );
};

export default EmployeePortal;
