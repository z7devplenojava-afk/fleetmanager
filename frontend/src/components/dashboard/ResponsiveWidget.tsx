import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResponsiveWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<any>;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'outline';
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ResponsiveWidget: React.FC<ResponsiveWidgetProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'bg-blue-500',
  trend,
  action,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const textSizes = {
    sm: {
      title: 'text-sm',
      value: 'text-lg',
      subtitle: 'text-xs'
    },
    md: {
      title: 'text-sm',
      value: 'text-2xl',
      subtitle: 'text-xs'
    },
    lg: {
      title: 'text-base',
      value: 'text-3xl',
      subtitle: 'text-sm'
    }
  };

  return (
    <Card className={cn(
      'bg-seguranca-black border-gray-700 hover:border-seguranca-yellow transition-all duration-200 hover:shadow-lg',
      className
    )}>
      <CardContent className={sizeClasses[size]}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-gray-400 truncate',
              textSizes[size].title
            )}>
              {title}
            </p>
            <p className={cn(
              'font-bold text-seguranca-lightgray mt-1',
              textSizes[size].value
            )}>
              {value}
            </p>
            {subtitle && (
              <p className={cn(
                'text-gray-400 mt-1',
                textSizes[size].subtitle
              )}>
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="flex items-center mt-2">
                <span className={cn(
                  'text-xs flex items-center gap-1',
                  trend.isPositive ? 'text-green-400' : 'text-red-400'
                )}>
                  <svg 
                    className={cn(
                      'h-3 w-3',
                      !trend.isPositive && 'rotate-180'
                    )} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l10-10M7 7h10v10" />
                  </svg>
                  {Math.abs(trend.value)}%
                  {trend.label && <span className="text-gray-500 ml-1">{trend.label}</span>}
                </span>
              </div>
            )}
          </div>
          
          {Icon && (
            <div className={cn(
              'flex-shrink-0 ml-4',
              color,
              'rounded-lg p-2'
            )}>
              <Icon className={cn(iconSizes[size], 'text-white')} />
            </div>
          )}
        </div>
        
        {action && (
          <div className="mt-4">
            <Button
              onClick={action.onClick}
              variant={action.variant || 'outline'}
              size="sm"
              className="w-full text-xs"
            >
              {action.label}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResponsiveWidget;
