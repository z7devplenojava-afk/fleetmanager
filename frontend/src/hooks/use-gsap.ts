import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registrar plugin ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Hook customizado para animações GSAP em páginas públicas
 * Substitui o AOS Animate com uma solução mais robusta
 */
export const useGSAP = () => {
  const elementsRef = useRef<Element[]>([]);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Evitar inicialização múltipla
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    console.log('🎬 GSAP: Inicializando animações...');

    // Aguardar o DOM estar pronto
    const timer = setTimeout(() => {
      // Selecionar todos os elementos com data-animate
      const elements = document.querySelectorAll('[data-animate]');
      console.log(`🎬 GSAP: ${elements.length} elementos encontrados para animar`);
      
      elementsRef.current = Array.from(elements);

      // Se não houver elementos, garantir que tudo está visível
      if (elements.length === 0) {
        console.warn('⚠️ GSAP: Nenhum elemento [data-animate] encontrado!');
        return;
      }

      elements.forEach((element, index) => {
        const animationType = element.getAttribute('data-animate') || 'fadeUp';
        const delay = parseFloat(element.getAttribute('data-delay') || '0');
        const duration = parseFloat(element.getAttribute('data-duration') || '0.15');

        // IMPORTANTE: Garantir que o elemento está visível desde o início
        gsap.set(element, { opacity: 1, visibility: 'visible' });

        // Configurações de animação baseadas no tipo
        let animationConfig: any = {
          duration,
          delay: delay / 1000, // Converter ms para segundos
          ease: 'power2.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 100%', // Inicia imediatamente quando o elemento entra na tela
            toggleActions: 'play none none none',
            once: true,
          },
        };

        // Diferentes tipos de animação
        switch (animationType) {
          case 'fadeUp':
            gsap.from(element, {
              ...animationConfig,
              opacity: 0,
              y: 12,
            });
            break;

          case 'fadeDown':
            gsap.from(element, {
              ...animationConfig,
              opacity: 0,
              y: -12,
            });
            break;

          case 'fadeLeft':
            gsap.from(element, {
              ...animationConfig,
              opacity: 0,
              x: -12,
            });
            break;

          case 'fadeRight':
            gsap.from(element, {
              ...animationConfig,
              opacity: 0,
              x: 12,
            });
            break;

          case 'zoomIn':
            gsap.from(element, {
              ...animationConfig,
              opacity: 0,
              scale: 0.96,
            });
            break;

          case 'zoomOut':
            gsap.from(element, {
              ...animationConfig,
              opacity: 0,
              scale: 1.04,
            });
            break;

          default:
            // Sem animação específica, apenas fade in rápido
            gsap.from(element, {
              ...animationConfig,
              opacity: 0,
            });
        }
      });

      console.log('✅ GSAP: Animações configuradas!');
    }, 10);

    return () => {
      clearTimeout(timer);
      // Limpar ScrollTriggers ao desmontar
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      hasInitialized.current = false;
    };
  }, []);

  // Retornar função helper para aplicar data-attributes facilmente
  return {
    fadeUp: 'fadeUp',
    fadeDown: 'fadeDown',
    fadeLeft: 'fadeLeft',
    fadeRight: 'fadeRight',
    zoomIn: 'zoomIn',
    zoomOut: 'zoomOut',
  };
};

export default useGSAP;

