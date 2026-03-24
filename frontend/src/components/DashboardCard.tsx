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
  iconColor = 'text-primary',
  trend,
  action,
  className = '',
  loading = false
}) => {
  return (
    <Card className={`hover:border-primary/40 transition-all duration-300 border-[#27272a] bg-[#18181b] overflow-hidden group hover:shadow-lg ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-6 px-6">
        <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 transition-colors">
          {title}
        </CardTitle>
        {Icon && (
          <div className={`p-2.5 rounded bg-[#27272a] border border-[#3f3f46] ${iconColor} group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all duration-300`}>
            <Icon size={18} />
          </div>
        )}
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {loading ? (
          <div className="space-y-3">
            <div className="h-10 bg-white/5 rounded-lg animate-pulse"></div>
            <div className="h-4 bg-white/5 rounded-lg animate-pulse w-2/3"></div>
          </div>
        ) : (
          <>
            <div className="text-3xl font-black text-white tracking-tighter mb-1">
              {value || '0'}
            </div>

            {description && (
              <p className="text-[11px] text-muted-foreground font-bold tracking-tight opacity-70 group-hover:opacity-100 transition-opacity">
                {description}
              </p>
            )}

            {trend && (
              <div className="flex items-center mt-3 bg-white/5 w-fit px-2 py-1 rounded-full border border-white/5">
                <span className={`text-[10px] font-black ${trend.isPositive ? 'text-green-400' : 'text-red-400'
                  }`}>
                  {trend.isPositive ? '↑' : '↓'} {trend.value}%
                </span>
                <span className="text-[9px] text-muted-foreground ml-1 uppercase font-bold tracking-wider">
                  {trend.label}
                </span>
              </div>
            )}

            {action && (
              <Button
                variant={action.variant || 'default'}
                size="sm"
                onClick={action.onClick}
                className="mt-6 w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-widest rounded transition-all active:scale-95 shadow-sm"
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
