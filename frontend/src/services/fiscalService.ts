import api from '@/lib/axios';

export interface FiscalDocument {
    id: string;
    key: string;
    number: string;
    series: string;
    type: 'NF_E' | 'NFS_E' | 'CT_E' | 'NFC_E';
    status: 'PENDING' | 'IMPORTED' | 'VALIDATED' | 'CANCELLED';
    emissionDate: string;
    totalAmount: number;
    issuerTaxId: string;
    issuerName: string;
    recipientTaxId?: string;
    xmlPath?: string;
    pdfPath?: string;
    notes?: string;
}

class FiscalService {
    async findAll(): Promise<FiscalDocument[]> {
        const response = await api.get('/api/fiscal');
        return response.data;
    }

    async findById(id: string): Promise<FiscalDocument> {
        const response = await api.get(`/api/fiscal/${id}`);
        return response.data;
    }

    async upload(file: File): Promise<FiscalDocument> {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/api/fiscal/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await api.delete(`/api/fiscal/${id}`);
    }
}

export default new FiscalService();
