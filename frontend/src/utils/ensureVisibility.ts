/**
 * Utilitário para garantir que TODO conteúdo seja visível
 * Fallback de segurança caso as animações falhem
 */

export const ensureAllContentVisible = () => {
  // Aguardar 500ms para o GSAP tentar animar
  setTimeout(() => {
    // Selecionar todos os elementos com data-animate
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    animatedElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      
      // Forçar visibilidade
      htmlElement.style.opacity = '1';
      htmlElement.style.visibility = 'visible';
      htmlElement.style.transform = 'none';
    });

    // Garantir que todas as sections estejam visíveis
    const sections = document.querySelectorAll('section');
    sections.forEach((section) => {
      const htmlSection = section as HTMLElement;
      htmlSection.style.opacity = '1';
      htmlSection.style.visibility = 'visible';
    });

    console.log('✅ Fallback de visibilidade aplicado!', {
      animatedElements: animatedElements.length,
      sections: sections.length
    });
  }, 500);
};

export default ensureAllContentVisible;

