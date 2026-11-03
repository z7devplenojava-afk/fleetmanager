import React, { useEffect } from 'react';

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => void;
    };
  }
}

export const VLibrasWidget: React.FC = () => {
  useEffect(() => {
    // Verificar se o script já foi adicionado
    const existingScript = document.getElementById('vlibras-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'vlibras-script';
      script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
      script.async = true;
      script.onload = () => {
        if (window.VLibras) {
          try {
            new window.VLibras.Widget('https://vlibras.gov.br/app');
          } catch (e) {
            console.warn('Erro ao inicializar VLibras Widget:', e);
          }
        }
      };
      document.body.appendChild(script);
    } else if (window.VLibras) {
      try {
        new window.VLibras.Widget('https://vlibras.gov.br/app');
      } catch (e) {
        console.warn('Erro ao reinicializar VLibras Widget:', e);
      }
    }
  }, []);

  return (
    <>
      <style>{`
        /* Reposiciona o botão flutuante nativo do VLibras para o canto inferior */
        /* Evita sobrepor o centro da tela, textos e formulários no celular */
        [vw-access-button] {
          top: auto !important;
          bottom: 20px !important;
          right: 16px !important;
          transform: none !important;
          width: 44px !important;
          height: 44px !important;
          border-radius: 50% !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45) !important;
          z-index: 9990 !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
        }
        [vw-access-button]:hover {
          transform: scale(1.08) !important;
        }
        @media (max-width: 640px) {
          [vw-access-button] {
            bottom: 16px !important;
            right: 12px !important;
            width: 40px !important;
            height: 40px !important;
          }
        }
      `}</style>
      <div
        {...({ vw: 'true' } as any)}
        className="enabled z-[9999]"
        aria-label="Acessibilidade em Língua Brasileira de Sinais (VLibras)"
      >
        <div {...({ 'vw-access-button': 'true' } as any)} className="active" />
        <div {...({ 'vw-plugin-wrapper': 'true' } as any)}>
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>
    </>
  );
};

export default VLibrasWidget;
