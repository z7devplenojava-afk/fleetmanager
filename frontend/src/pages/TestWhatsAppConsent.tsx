import React, { useState } from 'react';
import { WhatsAppConsentModal } from '@/components/WhatsAppConsentModal';
import { WhatsAppConsentSettings } from '@/components/WhatsAppConsentSettings';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

/**
 * PÁGINA DE TESTE - Consentimento WhatsApp
 * 
 * Para testar:
 * 1. Adicionar rota em App.tsx: <Route path="/test-consent" element={<TestWhatsAppConsent />} />
 * 2. Acessar: http://localhost:5173/test-consent
 * 3. Testar modal e configurações
 */
export const TestWhatsAppConsent: React.FC = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (!user) {
    return <div className="p-8">Faça login para testar</div>;
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">🧪 Teste - Consentimento WhatsApp</h1>
        <p className="text-muted-foreground">
          Página temporária para testar os componentes de consentimento WhatsApp
        </p>
      </div>

      {/* Botão para abrir modal */}
      <div className="bg-muted p-6 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">1. Testar Modal de Consentimento</h2>
        <p className="text-sm text-muted-foreground">
          Clique para ver o modal que será exibido aos funcionários
        </p>
        <Button onClick={() => setShowModal(true)}>
          Abrir Modal de Consentimento
        </Button>
      </div>

      {/* Configurações de consentimento */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">2. Testar Configurações</h2>
        <WhatsAppConsentSettings
          userId={user.id}
          userName={user.name}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <WhatsAppConsentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          userId={user.id}
          userName={user.name}
          currentWhatsApp={user.whatsapp}
          onConsentGranted={() => {
            console.log('Consentimento concedido!');
            // Recarregar dados do usuário se necessário
          }}
        />
      )}

      {/* Informações do usuário */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg space-y-2">
        <h3 className="font-semibold text-blue-900">ℹ️ Dados do Usuário Atual:</h3>
        <div className="text-sm text-blue-800 space-y-1 font-mono">
          <div><strong>ID:</strong> {user.id}</div>
          <div><strong>Nome:</strong> {user.name}</div>
          <div><strong>Username:</strong> {user.username}</div>
          <div><strong>WhatsApp:</strong> {user.whatsapp || 'Não cadastrado'}</div>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Esta é uma página de TESTE</h3>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>Não deixar em produção</li>
          <li>Usar apenas para validar componentes</li>
          <li>Deletar após integração nas páginas reais</li>
        </ul>
      </div>
    </div>
  );
};

