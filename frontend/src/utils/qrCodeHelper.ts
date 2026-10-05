// Utilitário de Geração de QR Code em SVG/DataURI no Frontend

export function generateQrCodeSvgUri(text: string, size: number = 220): string {
    const encoded = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=2`;
}

export function generateQrCodeDataPayload(type: 'PASSENGER' | 'DRIVER' | 'TRIP', payload: Record<string, any>): string {
    return JSON.stringify({
        type,
        ...payload,
        createdAt: new Date().toISOString()
    });
}
