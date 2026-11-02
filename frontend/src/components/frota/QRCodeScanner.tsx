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

import { UniversalQrScannerModal } from '@/components/common/UniversalQrScannerModal';

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
    open,
    onOpenChange,
    onScan,
}) => {
    const handleScanSuccess = useCallback(
        (decodedText: string) => {
            console.log('📡 QR Code detectado:', decodedText);
            const result = parseQRContent(decodedText);
            console.log('🔍 Resultado do parse:', result);
            if (result) {
                onScan(result);
                onOpenChange(false);
            } else {
                onScan({ rawText: decodedText });
                onOpenChange(false);
            }
        },
        [onScan, onOpenChange]
    );

    return (
        <UniversalQrScannerModal
            isOpen={open}
            onClose={() => onOpenChange(false)}
            onScanSuccess={handleScanSuccess}
            title="Ler QR Code da Portaria / Frota"
            description="Aponte a câmera para o QR Code do motorista ou do veículo"
            placeholderManual="Digite a placa, ID ou cole o conteúdo do QR Code..."
            allowManualInput={true}
        />
    );
};
