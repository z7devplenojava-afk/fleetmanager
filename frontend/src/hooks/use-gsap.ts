import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Hook customizado para animações GSAP otimizadas
 */
export const useGSAP = () => {
  const triggersRef = useRef<ScrollTrigger[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('[data-animate]');
      if (elements.length === 0) {
        return;
      }

      elements.forEach((element) => {
        const animationType = element.getAttribute('data-animate') || 'fadeUp';
        const delay = parseFloat(element.getAttribute('data-delay') || '0');
        const duration = parseFloat(element.getAttribute('data-duration') || '0.15');

        gsap.set(element, { opacity: 1, visibility: 'visible' });

        const animationConfig: any = {
          duration,
          delay: delay / 1000,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 100%',
            toggleActions: 'play none none none',
            once: true
          }
        };

        let tween: gsap.core.Tween | null = null;

        switch (animationType) {
          case 'fadeUp':
            tween = gsap.from(element, { ...animationConfig, opacity: 0, y: 12 });
            break;
          case 'fadeDown':
            tween = gsap.from(element, { ...animationConfig, opacity: 0, y: -12 });
            break;
          case 'fadeLeft':
            tween = gsap.from(element, { ...animationConfig, opacity: 0, x: -12 });
            break;
          case 'fadeRight':
            tween = gsap.from(element, { ...animationConfig, opacity: 0, x: 12 });
            break;
          case 'zoomIn':
            tween = gsap.from(element, { ...animationConfig, opacity: 0, scale: 0.96 });
            break;
          case 'zoomOut':
            tween = gsap.from(element, { ...animationConfig, opacity: 0, scale: 1.04 });
            break;
          default:
            tween = gsap.from(element, { ...animationConfig, opacity: 0 });
        }

        if (tween?.scrollTrigger) {
          triggersRef.current.push(tween.scrollTrigger);
        }
      });
    }, 20);

    return () => {
      clearTimeout(timer);
      triggersRef.current.forEach((t) => t.kill());
      triggersRef.current = [];
    };
  }, []);

  return {
    fadeUp: 'fadeUp',
    fadeDown: 'fadeDown',
    fadeLeft: 'fadeLeft',
    fadeRight: 'fadeRight',
    zoomIn: 'zoomIn',
    zoomOut: 'zoomOut'
  };
};

export default useGSAP;
