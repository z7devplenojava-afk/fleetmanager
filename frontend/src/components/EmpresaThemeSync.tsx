import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Componente invisível que sincroniza a cor da empresa
 * do AuthContext para o ThemeContext.
 * Deve ser renderizado dentro de ambos os providers.
 */
export function EmpresaThemeSync() {
  const { empresa } = useAuth();
  const { setEmpresaColor } = useTheme();

  useEffect(() => {
    setEmpresaColor(empresa?.temaCor ?? null);
  }, [empresa?.temaCor, setEmpresaColor]);

  return null;
}
