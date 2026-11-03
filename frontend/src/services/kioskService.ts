import api from './api';
import {
  KioskDevice,
  KioskMediaAsset,
  KioskPresentation,
  KioskPublication,
  KioskDeviceEvent,
  KioskPairingCodeResponse,
} from '@/types/kiosk';

export const kioskService = {
  // Dispositivos
  async getDevices(): Promise<KioskDevice[]> {
    const response = await api.get('/kiosks');
    return response.data;
  },

  async getDeviceById(id: string): Promise<KioskDevice> {
    const response = await api.get(`/kiosks/${id}`);
    return response.data;
  },

  async createDevice(data: Partial<KioskDevice>): Promise<KioskDevice> {
    const response = await api.post('/kiosks', data);
    return response.data;
  },

  async updateDevice(id: string, data: Partial<KioskDevice>): Promise<KioskDevice> {
    const response = await api.patch(`/kiosks/${id}`, data);
    return response.data;
  },

  async generatePairingCode(deviceId: string): Promise<KioskPairingCodeResponse> {
    const response = await api.post(`/kiosks/${deviceId}/pairing-code`);
    return response.data;
  },

  async revokeDevice(deviceId: string): Promise<void> {
    await api.post(`/kiosks/${deviceId}/revoke`);
  },

  async deleteDevice(deviceId: string): Promise<void> {
    await api.delete(`/kiosks/${deviceId}`);
  },

  // Mídias
  async getMediaAssets(): Promise<KioskMediaAsset[]> {
    const response = await api.get('/kiosk-media');
    return response.data;
  },

  async uploadMedia(file: File, name: string): Promise<KioskMediaAsset> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    const response = await api.post('/kiosk-media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteMedia(id: string): Promise<void> {
    await api.delete(`/kiosk-media/${id}`);
  },

  // Apresentações
  async getPresentations(): Promise<KioskPresentation[]> {
    const response = await api.get('/kiosk-presentations');
    return response.data;
  },

  async getPresentationById(id: string): Promise<KioskPresentation> {
    const response = await api.get(`/kiosk-presentations/${id}`);
    return response.data;
  },

  async createPresentation(data: Partial<KioskPresentation>): Promise<KioskPresentation> {
    const response = await api.post('/kiosk-presentations', data);
    return response.data;
  },

  async updatePresentation(id: string, data: Partial<KioskPresentation>): Promise<KioskPresentation> {
    const response = await api.put(`/kiosk-presentations/${id}`, data);
    return response.data;
  },

  async saveSlide(presentationId: string, slideData: any): Promise<any> {
    const response = await api.post(`/kiosk-presentations/${presentationId}/slides`, slideData);
    return response.data;
  },

  async deleteSlide(presentationId: string, slideId: string): Promise<void> {
    await api.delete(`/kiosk-presentations/${presentationId}/slides/${slideId}`);
  },

  async publishPresentation(id: string, deviceIds: string[], scheduledAt?: string): Promise<KioskPublication[]> {
    const response = await api.post(`/kiosk-presentations/${id}/publish`, {
      deviceIds,
      scheduledAt,
    });
    return response.data;
  },

  // Publicações & Monitoramento
  async getPublications(): Promise<KioskPublication[]> {
    const response = await api.get('/kiosk-publications');
    return response.data;
  },

  async getDeviceEvents(deviceId: string): Promise<KioskDeviceEvent[]> {
    const response = await api.get(`/kiosks/${deviceId}/events`);
    return response.data;
  },
};

export default kioskService;

