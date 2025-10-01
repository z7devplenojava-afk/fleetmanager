import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value?: string | number;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  className?: string;
  loading?: boolean;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-seguranca-yellow',
  trend,
  action,
  className = '',
  loading = false
}) => {
  return (
    <Card className={`hover:shadow-lg transition-all duration-300 border-gray-700 bg-seguranca-graphite ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-seguranca-lightgray">
          {title}
        </CardTitle>
        {Icon && (
          <div className={`p-2 rounded-lg bg-seguranca-black/50 ${iconColor}`}>
            <Icon size={20} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded animate-pulse w-2/3"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-seguranca-lightgray">
              {value || '0'}
            </div>
            
            {description && (
              <p className="text-xs text-gray-400 mt-1">
                {description}
              </p>
            )}
            
            {trend && (
              <div className="flex items-center mt-2">
                <span className={`text-xs font-medium ${
                  trend.isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-gray-400 ml-1">
                  {trend.label}
                </span>
              </div>
            )}
            
            {action && (
              <Button
                variant={action.variant || 'default'}
                size="sm"
                onClick={action.onClick}
                className="mt-3 w-full bg-seguranca-red hover:bg-seguranca-darkred text-white"
              >
                {action.label}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {children}
    </div>
  );
};
