import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { accountingFormService } from '@/services/accountingFormService';
import { useToast } from '@/hooks/use-toast';

interface AccountingFormButtonProps {
  employeeId: string;
  employeeName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  disabled?: boolean;
}

export const AccountingFormButton: React.FC<AccountingFormButtonProps> = ({
  employeeId,
  employeeName,
  variant = 'outline',
  size = 'default',
  className = '',
  disabled = false
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDownloadPdf = async () => {
    setLoading(true);
    try {
      await accountingFormService.downloadPdf(employeeId, employeeName);
      toast({
        title: "✅ Ficha Gerada",
        description: "Ficha de contabilidade com todos os dados foi gerada e está sendo baixada",
      });
    } catch (error) {
      console.error('Erro ao gerar ficha de contabilidade:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao gerar ficha de contabilidade. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size}
      className={`${className} truncate`}
      disabled={loading || disabled || !employeeId}
      onClick={handleDownloadPdf}
    >
      {loading ? (
        <>
          <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
          <span className="truncate">Gerando...</span>
        </>
      ) : (
        <>
          <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">Ficha Contabilidade</span>
        </>
      )}
    </Button>
  );
};

export default AccountingFormButton;

