import api from '@/lib/axios';

export interface QRCodeWorkPost {
  id: string;
  workPost: any;
  qrCode: string;
  description?: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  radiusMeters: number;
  createdAt: string;
}

export const qrCodeService = {
  async generateQRCode(workPostId: string, description: string, createdById: string, 
                       latitude?: number, longitude?: number, radiusMeters?: number) {
    const response = await api.post('/qrcode-work-posts/generate', {
      workPostId,
      description,
      createdById,
      latitude,
      longitude,
      radiusMeters
    });
    return response.data;
  },

  async getQRCodeImage(id: string): Promise<string> {
    const response = await api.get(`/qrcode-work-posts/${id}/image`, {
      responseType: 'blob'
    });
    return URL.createObjectURL(response.data);
  },

  async getQRCodesByWorkPost(workPostId: string) {
    const response = await api.get(`/qrcode-work-posts/work-post/${workPostId}`);
    return response.data;
  },

  async getActiveQRCodes() {
    const response = await api.get('/qrcode-work-posts/active');
    return response.data;
  },

  async toggleQRCode(id: string) {
    const response = await api.put(`/qrcode-work-posts/${id}/toggle`);
    return response.data;
  },

  async validateQRCode(qrCode: string) {
    const response = await api.post('/qrcode-work-posts/validate', { qrCode });
    return response.data;
  }
};

export default qrCodeService;

