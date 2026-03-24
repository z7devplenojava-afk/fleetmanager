import api from '@/lib/axios';

export interface FacialRecognitionResult {
  success: boolean;
  cpf?: string;
  employeeId?: string;
  confidence?: number;
  quality?: number;
  employee?: {
    id: string;
    name: string;
    cpf: string;
    email?: string;
    phone?: string;
    position?: string;
    unit?: string;
    status?: string;
  };
  error?: string;
}

export interface RegisterFaceRequest {
  employeeId: string;
  cpf: string;
  image: File;
}

export interface RegisterFaceResult {
  success: boolean;
  message?: string;
  faceId?: string;
  cpf?: string;
  quality?: number;
  error?: string;
}

class FacialRecognitionService {
  /**
   * Reconhece uma face e retorna o CPF correspondente
   */
  async recognizeFace(imageFile: File): Promise<FacialRecognitionResult> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post('/facial-recognition/recognize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro no reconhecimento facial:', error);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        error: 'Erro de conexão com o servidor'
      };
    }
  }

  /**
   * Registra uma face para um funcionário
   */
  async registerFace(request: RegisterFaceRequest): Promise<RegisterFaceResult> {
    try {
      const formData = new FormData();
      formData.append('employeeId', request.employeeId);
      formData.append('cpf', request.cpf);
      formData.append('image', request.image);

      const response = await api.post('/facial-recognition/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Erro no registro de face:', error);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        error: 'Erro de conexão com o servidor'
      };
    }
  }

  /**
   * Remove uma face registrada
   */
  async removeFace(cpf: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.delete(`/facial-recognition/remove/${cpf}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao remover face:', error);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        error: 'Erro de conexão com o servidor'
      };
    }
  }

  /**
   * Lista todas as faces registradas
   */
  async getAllFaces(): Promise<any[]> {
    try {
      const response = await api.get('/facial-recognition/faces');
      return response.data;
    } catch (error: any) {
      console.error('Erro ao listar faces:', error);
      return [];
    }
  }

  /**
   * Busca uma face específica por CPF
   */
  async getFaceByCpf(cpf: string): Promise<any | null> {
    try {
      const response = await api.get(`/facial-recognition/faces/${cpf}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar face por CPF:', error);
      return null;
    }
  }

  /**
   * Testa se o serviço está funcionando
   */
  async test(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await api.get('/facial-recognition/test');
      return response.data;
    } catch (error: any) {
      console.error('Erro no teste do serviço:', error);
      return {
        success: false,
        message: 'Serviço indisponível'
      };
    }
  }

  /**
   * Converte uma imagem do canvas para File
   */
  canvasToFile(canvas: HTMLCanvasElement, filename: string = 'face.jpg', quality: number = 0.8): File {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], filename, { type: 'image/jpeg' });
          resolve(file);
        }
      }, 'image/jpeg', quality);
    }) as any;
  }

  /**
   * Captura uma imagem da câmera
   */
  async captureFromCamera(video: HTMLVideoElement): Promise<File | null> {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Não foi possível obter contexto do canvas');
      }

      // Configurar canvas com as dimensões do vídeo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Desenhar o frame atual do vídeo no canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Converter para File
      return this.canvasToFile(canvas, 'captured_face.jpg', 0.8);
    } catch (error) {
      console.error('Erro ao capturar imagem da câmera:', error);
      return null;
    }
  }

  /**
   * Valida se um arquivo é uma imagem válida
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Verificar se é um arquivo
    if (!file) {
      return { valid: false, error: 'Nenhum arquivo selecionado' };
    }

    // Verificar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Tipo de arquivo inválido. Use JPG, PNG ou WebP' };
    }

    // Verificar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'Arquivo muito grande. Máximo 5MB' };
    }

    return { valid: true };
  }
}

export const facialRecognitionService = new FacialRecognitionService();
export default facialRecognitionService;
