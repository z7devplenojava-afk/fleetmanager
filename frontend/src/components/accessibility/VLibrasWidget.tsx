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
  );
};

export default VLibrasWidget;

