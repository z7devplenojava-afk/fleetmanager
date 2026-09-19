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
    driverName?: string;
    driverCnh?: string;
    vehicleId?: string;
    clientId?: string;
    plate?: string;
    odometer?: number;
    rawText?: string;
}

interface QRCodeScannerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScan: (result: QRScanResult) => void;
}

/**
 * Formatos aceitos no QR Code:
 * - JSON: {"driverId":"uuid","driverName":"nome","cnh":"123","vehicleId":"uuid","plate":"ABC1D23"}
 * - Passaporte de Veículo / Crachá formatado (com chaves VEICULO, MOTORISTA/RESP, CNH, KM, ID)
 * - driver:uuid ou driver:cnh
 * - vehicle:uuid ou vehicle:plate
 * - ABC-1234 ou ABC1D23 - placa direta Mercosul / antiga
 * - UUID direto
 * - qualquer texto - fallback como rawText
 */
const parseQRContent = (decodedText: string): QRScanResult | null => {
    const trimmed = decodedText.trim();
    if (!trimmed) return null;

    try {
        // Formato JSON
        if (trimmed.startsWith('{')) {
            const obj = JSON.parse(trimmed) as Record<string, any>;
            const result: QRScanResult = { rawText: trimmed };
            if (obj.driverId) result.driverId = String(obj.driverId);
            if (obj.driverName || obj.motorista || obj.driver) {
                result.driverName = String(obj.driverName || obj.motorista || obj.driver);
            }
            if (obj.cnh || obj.driverCnh) result.driverCnh = String(obj.cnh || obj.driverCnh);
            if (obj.vehicleId || obj.id) result.vehicleId = String(obj.vehicleId || obj.id);
            if (obj.plate || obj.placa) {
                result.plate = String(obj.plate || obj.placa).toUpperCase().replace(/[^A-Z0-9]/g, '');
            }
            if (obj.clientId) result.clientId = String(obj.clientId);
            if (obj.odometer || obj.km) result.odometer = Number(obj.odometer || obj.km);
            return result;
        }

        // Formato de texto multi-linha (ex: passaporte de crachá do veículo ou condutor)
        if (trimmed.includes('\n') || trimmed.includes('|') || trimmed.includes(':')) {
            const result: QRScanResult = { rawText: trimmed };

            // Extrair ID de veículo
            const idMatch = trimmed.match(/(?:ID|VEICULO_ID|VEHICLE_ID):\s*([0-9a-fA-F-]{36})/i);
            if (idMatch) result.vehicleId = idMatch[1].trim();

            // Extrair Placa
            const plateMatch = trimmed.match(/(?:VEICULO|VEÍCULO|PLACA|PLATE):\s*([A-Z0-9-]{7,8})/i);
            if (plateMatch) {
                result.plate = plateMatch[1].toUpperCase().replace(/[^A-Z0-9]/g, '');
            }

            // Extrair Motorista/Responsável
            const driverMatch = trimmed.match(/(?:MOTORISTA\/RESP|MOTORISTA|CONDUTOR|DRIVER):\s*([^\n\r|]+)/i);
            if (driverMatch) {
                const dName = driverMatch[1].trim();
                if (dName && !dName.toLowerCase().includes('não atribuído') && !dName.toLowerCase().includes('nao atribuido')) {
                    result.driverName = dName;
                }
            }

            // Extrair CNH
            const cnhMatch = trimmed.match(/CNH:\s*([0-9]+)/i);
            if (cnhMatch) result.driverCnh = cnhMatch[1].trim();

            // Extrair KM
            const kmMatch = trimmed.match(/(?:KM|ODÔMETRO|ODOMETRO):\s*(\d+)/i);
            if (kmMatch) result.odometer = Number(kmMatch[1]);

            if (result.vehicleId || result.plate || result.driverName || result.driverCnh) {
                return result;
            }
        }

        if (trimmed.toLowerCase().startsWith('client:')) {
            const id = trimmed.slice(7).trim();
            return id ? { clientId: id, rawText: trimmed } : null;
        }
        if (trimmed.toLowerCase().startsWith('driver:')) {
            const val = trimmed.slice(7).trim();
            return val ? { driverId: val, rawText: trimmed } : null;
        }
        if (trimmed.toLowerCase().startsWith('cnh:')) {
            const val = trimmed.slice(4).trim();
            return val ? { driverCnh: val, rawText: trimmed } : null;
        }
        if (trimmed.toLowerCase().startsWith('vehicle:')) {
            const val = trimmed.slice(8).trim();
            return val ? { vehicleId: val, rawText: trimmed } : null;
        }
        if (trimmed.toLowerCase().startsWith('plate:')) {
            const val = trimmed.slice(6).trim().toUpperCase();
            return val ? { plate: val, rawText: trimmed } : null;
        }

        // Reconhecimento de placa brasileira padrão ou Mercosul
        const clean = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(clean) || /^[A-Z]{3}[0-9]{4}$/.test(clean)) {
            return { plate: clean, rawText: trimmed };
        }

        // UUID direto
        if (/^[0-9a-fA-F-]{36}$/.test(trimmed)) {
            return { vehicleId: trimmed, rawText: trimmed };
        }

        return { rawText: trimmed, vehicleId: trimmed };
    } catch {
        return { rawText: trimmed, vehicleId: trimmed };
    }
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
