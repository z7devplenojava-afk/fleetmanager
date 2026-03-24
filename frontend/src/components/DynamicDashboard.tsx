import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, Users, Shield, UserCheck, HeartPulse, Receipt, 
  MapPin, Calendar, AlertCircle, Route, Car, DollarSign, FileText,
  TrendingUp, Building, FileSignature, Package, ShoppingCart, 
  MessageSquare, MessagesSquare, BarChart, Settings, Activity,
  User, Palmtree, Loader2, ChevronRight
} from 'lucide-react';
import api from '@/lib/axios';
import { categories } from '@/services/roleFunctionalityService';

interface Functionality {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  category: string;
  order: number;
}

const iconMap: Record<string, any> = {
  LayoutDashboard, Users, Shield, UserCheck, HeartPulse, Receipt,
  MapPin, Calendar, AlertCircle, Route, Car, DollarSign, FileText,
  TrendingUp, Building, FileSignature, Package, ShoppingCart,
  MessageSquare, MessagesSquare, BarChart, Settings, Activity,
  User, Palmtree, UsersRound: Users
};

export const DynamicDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [functionalities, setFunctionalities] = useState<Functionality[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFunctionalities();
  }, []);

  const loadFunctionalities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/profile/functionalities');
      setFunctionalities(response.data);
    } catch (error) {
      console.error('Erro ao carregar funcionalidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByCategory = (funcs: Functionality[]) => {
    const grouped: Record<string, Functionality[]> = {};
    funcs.forEach(func => {
      if (!grouped[func.category]) {
        grouped[func.category] = [];
      }
      grouped[func.category].push(func);
    });
    return grouped;
  };

  const getCategoryInfo = (category: string) => {
    return categories[category] || { name: category, color: 'bg-gray-600', icon: 'Grid' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
        <span className="ml-2 text-seguranca-lightgray">Carregando...</span>
      </div>
    );
  }

  const groupedFunctionalities = groupByCategory(functionalities);

  return (
    <div className="space-y-8">
      {/* Boas-vindas - Padrão SST */}
      <div className="bg-seguranca-red rounded-xl p-4 sm:p-6 text-white border border-seguranca-darkred">
        <h2 className="text-lg sm:text-xl font-bold mb-2">Olá, {user?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-xs sm:text-sm text-seguranca-lightgray">
          Bem-vindo ao seu painel personalizado
        </p>
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
          {user?.roles?.map((role) => (
            <Badge key={role} className="bg-white/20 text-white text-xs">
              {role}
            </Badge>
          ))}
        </div>
      </div>

      {/* Funcionalidades agrupadas por categoria */}
      {Object.entries(groupedFunctionalities).map(([category, funcs]) => {
        const categoryInfo = getCategoryInfo(category);
        
        return (
          <div key={category}>
            <h3 className="text-base sm:text-lg font-bold text-seguranca-lightgray mb-3 sm:mb-4 flex items-center gap-2">
              <div className={`w-1 h-5 sm:h-6 ${categoryInfo.color} rounded-full`}></div>
              <span className="text-sm sm:text-base">{categoryInfo.name}</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {funcs.map((func) => {
                const IconComponent = iconMap[func.icon] || LayoutDashboard;
                
                return (
                  <Card
                    key={func.id}
                    className="bg-seguranca-graphite border-gray-600 hover:border-seguranca-yellow transition-colors cursor-pointer group"
                    onClick={() => navigate(func.route)}
                  >
                    <CardHeader className="pb-2 sm:pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-2 sm:p-2.5 ${categoryInfo.color} rounded-lg`}>
                          <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-seguranca-yellow transition-colors" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <CardTitle className="text-seguranca-lightgray text-sm sm:text-base mb-1 sm:mb-2">
                        {func.name}
                      </CardTitle>
                      <CardDescription className="text-gray-400 text-xs sm:text-sm">
                        {func.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {functionalities.length === 0 && (
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
            <p className="text-xs sm:text-sm text-gray-400 text-center px-4">
              Nenhuma funcionalidade disponível para seu perfil.
              <br className="hidden sm:block" />
              Entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DynamicDashboard;

