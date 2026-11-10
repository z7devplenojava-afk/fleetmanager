import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de cache em memória
      gcTime: 1000 * 60 * 30, // 30 minutos retido na memória (garbage collection)
      refetchOnWindowFocus: false, // Evita travamentos ao alternar abas do navegador
      refetchOnMount: false, // Utiliza os dados já carregados imediatamente ao trocar de tela
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 404) {
          return false;
        }
        return failureCount < 1;
      }, // Evita retentar erros de permissão/autenticação e limita falhas de rede
    },
  },
});

export default queryClient;
