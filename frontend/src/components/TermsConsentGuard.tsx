import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import TermsConsentModal from './TermsConsentModal';
import api from '@/lib/axios';

interface TermsConsentGuardProps {
  children: React.ReactNode;
}

export const TermsConsentGuard: React.FC<TermsConsentGuardProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkTermsConsent();
  }, []);

  const checkTermsConsent = async () => {
    try {
      setChecking(true);
      
      // Verificar flag do localStorage
      const needsConsent = localStorage.getItem('needsTermsConsent');
      
      if (needsConsent === 'true' && user) {
        // Verificar no backend
        const response = await api.get(`/api/user-terms-consent/check/${user.id}/EMPLOYEE`);
        
        if (!response.data.hasAccepted) {
          setShowModal(true);
        } else {
          // Já aceitou, limpar flag
          localStorage.removeItem('needsTermsConsent');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar termos:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleAccept = async () => {
    try {
      setLoading(true);

      await api.post('/api/user-terms-consent/accept', {
        userId: user?.id,
        userType: 'EMPLOYEE',
        userCpf: user?.username || '',
        accepted: true
      });

      toast({
        title: "Termos Aceitos!",
        description: "Bem-vindo ao sistema SecuredGuard.",
        variant: "default",
      });

      // Limpar flag e fechar modal
      localStorage.removeItem('needsTermsConsent');
      setShowModal(false);

    } catch (error: any) {
      console.error('Erro ao aceitar termos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar seu aceite. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    toast({
      title: "Termos não aceitos",
      description: "Você será desconectado do sistema.",
      variant: "destructive",
    });

    // Registrar recusa e fazer logout
    try {
      api.post('/api/user-terms-consent/accept', {
        userId: user?.id,
        userType: 'EMPLOYEE',
        userCpf: user?.username || '',
        accepted: false
      });
    } catch (error) {
      console.error('Erro ao registrar recusa:', error);
    }

    // Logout e voltar para login
    setTimeout(() => {
      logout();
      navigate('/login');
    }, 2000);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-seguranca-yellow mx-auto mb-4"></div>
          <p className="text-seguranca-lightgray">Verificando termos de uso...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <TermsConsentModal
        isOpen={showModal}
        onAccept={handleAccept}
        onDecline={handleDecline}
        userName={user?.name}
        loading={loading}
      />
    </>
  );
};

export default TermsConsentGuard;

