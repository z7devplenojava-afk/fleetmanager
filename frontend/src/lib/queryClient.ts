import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de cache em memória
      gcTime: 1000 * 60 * 30, // 30 minutos retido na memória (garbage collection)
      refetchOnWindowFocus: false, // Evita travamentos ao alternar abas do navegador
      refetchOnMount: false, // Utiliza os dados já carregados imediatamente ao trocar de tela
      retry: 1, // Limita tentativas de falhas de rede para não travar a UI
    },
  },
});

export default queryClient;
