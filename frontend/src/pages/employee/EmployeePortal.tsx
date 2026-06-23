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
  Upload,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import ThemeToggle from '@/components/ThemeToggle';

interface EmployeePortalProps {}

const EmployeePortal: React.FC<EmployeePortalProps> = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Debug: Verificar se o componente está carregando
  console.log('🔍 EmployeePortal Debug:');
  console.log('- Component loaded');
  console.log('- User:', user);
  console.log('- Active tab:', activeTab);

  const menuItems = [
    { id: 'dashboard', label: 'Início', icon: Home },
    { id: 'profile', label: 'Meu Perfil', icon: UserCircle },
    { id: 'time-records', label: 'Ponto Eletrônico', icon: Clock },
    { id: 'payslips', label: 'Holerites', icon: FileText },
    { id: 'documents', label: 'Documentos', icon: CreditCard },
    { id: 'trainings', label: 'Treinamentos', icon: BookOpen },
    { id: 'vacations', label: 'Férias', icon: Calendar },
    { id: 'notifications', label: 'Notificações', icon: Bell },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    console.log('🔍 renderContent called with activeTab:', activeTab);
    switch (activeTab) {
      case 'dashboard':
        console.log('🔍 Rendering EmployeeDashboard');
        return <EmployeeDashboard />;
      case 'profile':
        console.log('🔍 Rendering EmployeeProfile');
        return <EmployeeProfile />;
      case 'time-records':
        console.log('🔍 Rendering TimeRecords');
        return <TimeRecords />;
      case 'payslips':
        console.log('🔍 Rendering Payslips');
        return <Payslips />;
      case 'documents':
        console.log('🔍 Rendering Documents');
        return <Documents />;
      case 'trainings':
        console.log('🔍 Rendering Trainings');
        return <Trainings />;
      case 'vacations':
        console.log('🔍 Rendering Vacations');
        return <Vacations />;
      case 'notifications':
        console.log('🔍 Rendering Notifications');
        return <Notifications />;
      default:
        console.log('🔍 Rendering default EmployeeDashboard');
        return <EmployeeDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <h1 className="ml-4 text-xl font-semibold text-foreground">Portal do Funcionário</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{user?.name}</span>
              </div>
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-64 bg-card shadow-sm min-h-screen border-r border-border`}>
          <nav className="mt-5 px-2">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary text-primary-foreground border-r-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-background">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeePortal;
