import api from '@/lib/axios';

export interface BiliFluxChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface BiliFluxChatResult {
  reply: string;
  source: 'ai' | 'fallback';
  aiAvailable: boolean;
}

export interface BiliFluxChatRequest {
  message: string;
  userName?: string;
  history?: { role: string; content: string }[];
}

export const bilifluxService = {
  async chat(request: BiliFluxChatRequest, timeoutMs = 30000): Promise<BiliFluxChatResult> {
    const { data } = await api.post<BiliFluxChatResult>('/v1/biliflux/chat', request, {
      timeout: timeoutMs
    });
    return data;
  },

  async health(): Promise<BiliFluxChatResult> {
    const { data } = await api.get<BiliFluxChatResult>('/v1/biliflux/health', {
      timeout: 8000
    });
    return data;
  }
};

export default bilifluxService;
