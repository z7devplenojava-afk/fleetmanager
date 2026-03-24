'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, X } from 'lucide-react';

export interface QRScanResult {
    driverId?: string;
    vehicleId?: string;
    clientId?: string;
}

interface QRCodeScannerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScan: (result: QRScanResult) => void;
}

/**
 * Formatos aceitos no QR Code:
 * - {"driverId":"uuid","vehicleId":"uuid"} - preenche ambos
 * - {"driverId":"uuid"} - preenche apenas motorista
 * - {"vehicleId":"uuid"} - preenche apenas veículo
 * - driver:uuid - formato simples para motorista
 * - vehicle:uuid - formato simples para veículo
 */
const parseQRContent = (decodedText: string): QRScanResult | null => {
    const trimmed = decodedText.trim();
    if (!trimmed) return null;

    try {
        if (trimmed.startsWith('{')) {
            const obj = JSON.parse(trimmed) as Record<string, string>;
            const result: QRScanResult = {};
            if (obj.driverId) result.driverId = obj.driverId;
            if (obj.vehicleId) result.vehicleId = obj.vehicleId;
            if (obj.clientId) result.clientId = obj.clientId;
            return Object.keys(result).length > 0 ? result : null;
        }
        if (trimmed.toLowerCase().startsWith('client:')) {
            const id = trimmed.slice(7).trim();
            return id ? { clientId: id } : null;
        }
        if (trimmed.toLowerCase().startsWith('driver:')) {
            const id = trimmed.slice(7).trim();
            return id ? { driverId: id } : null;
        }
        if (trimmed.toLowerCase().startsWith('vehicle:')) {
            const id = trimmed.slice(8).trim();
            return id ? { vehicleId: id } : null;
        }
    } catch {
        return null;
    }
    return null;
};

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
    open,
    onOpenChange,
    onScan,
}) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [error, setError] = useState<string | null>(null);
    const containerId = 'portaria-qr-scanner';

    const handleScanSuccess = useCallback(
        (decodedText: string) => {
            console.log('📡 QR Code detectado:', decodedText);
            const result = parseQRContent(decodedText);
            console.log('🔍 Resultado do parse:', result);
            if (result) {
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(() => { });
                    scannerRef.current = null;
                }
                onScan(result);
                onOpenChange(false);
            } else {
                setError('QR Code inválido. Use o formato de motorista/veículo.');
            }
        },
        [onScan, onOpenChange]
    );

    const handleScanError = useCallback(() => { /* ignorar erros de scan contínuo */ }, []);

    const initScanner = useCallback(() => {
        if (scannerRef.current) return;
        const scanner = new Html5QrcodeScanner(
            containerId,
            { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
            false
        );
        scanner.render(handleScanSuccess, handleScanError);
        scannerRef.current = scanner;
    }, [handleScanSuccess, handleScanError]);

    useEffect(() => {
        if (!open) {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => { });
                scannerRef.current = null;
            }
            setError(null);
            return;
        }
        setError(null);
        const timer = setTimeout(() => {
            try {
                initScanner();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro ao iniciar câmera.');
            }
        }, 100);
        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => { });
                scannerRef.current = null;
            }
        };
    }, [open, initScanner]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-seguranca-graphite border-gray-600">
                <DialogHeader>
                    <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-seguranca-yellow" />
                        Ler QR Code
                    </DialogTitle>
                    <DialogDescription>
                        Aponte a câmera para o QR Code do motorista ou do veículo para preencher automaticamente.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div
                        id={containerId}
                        className="min-h-[250px] rounded-lg overflow-hidden bg-black"
                    />
                    {error && (
                        <p className="text-sm text-amber-500">{error}</p>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-gray-600"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
