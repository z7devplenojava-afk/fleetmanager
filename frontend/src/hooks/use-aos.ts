import { useEffect, useMemo } from 'react';
import AOS from 'aos';

export const useAOS = () => {
  useEffect(() => {
    // Usar requestAnimationFrame para melhor performance
    const refreshAOS = () => {
      requestAnimationFrame(() => {
        AOS.refresh();
      });
    };
    
    refreshAOS();
  }, []);

  // Memoizar os valores para evitar recriação desnecessária
  return useMemo(() => ({
    fadeUp: 'fade-up',
    fadeDown: 'fade-down',
    fadeLeft: 'fade-left',
    fadeRight: 'fade-right',
    zoomIn: 'zoom-in',
    zoomOut: 'zoom-out',
    slideUp: 'slide-up',
    slideDown: 'slide-down',
    slideLeft: 'slide-left',
    slideRight: 'slide-right',
    flipLeft: 'flip-left',
    flipRight: 'flip-right',
    flipUp: 'flip-up',
    flipDown: 'flip-down'
  }), []);
};

export const aosConfig = {
  duration: 800,
  easing: 'ease-in-out',
  once: true,
  mirror: false,
  offset: 50,
  delay: 100
}; 