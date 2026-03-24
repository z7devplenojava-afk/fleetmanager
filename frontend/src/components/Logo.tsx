import { Bus } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', showText = true }) => {
  const sizeClasses = {
    sm: { container: 'h-8', icon: 16, text: 'text-lg' },
    md: { container: 'h-12', icon: 24, text: 'text-2xl' },
    lg: { container: 'h-16', icon: 32, text: 'text-3xl' },
    xl: { container: 'h-20', icon: 40, text: 'text-4xl' }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      <div className={`${currentSize.container} aspect-square bg-[#821414] rounded-xl flex items-center justify-center shadow-lg shadow-[#821414]/20 transform transition-transform hover:rotate-3`}>
        <Bus size={currentSize.icon} className="text-white" />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${currentSize.text} font-black tracking-tighter italic flex items-baseline text-white`}>
            Flex<span className="text-opacity-90 ml-0.5" style={{ color: 'hsl(var(--primary))' }}>Bus</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 mt-0.5 leading-none">
            Fleet Management
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
