import React from 'react';
import { Company } from '@/types/company';

interface StandardReportTemplateProps {
    company?: Company | null;
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}

export const StandardReportTemplate: React.FC<StandardReportTemplateProps> = ({
    company,
    children,
    title,
    subtitle
}) => {

    // Default company info if none provided (or fallback to Promover Vigilancia specific hardcodes if needed as seen in other files)
    const companyName = company?.tradeName || company?.name || 'VIGILÂNCIA PATRIMONIAL';
    const companyCnpj = company?.cnpj || '';
    const companyAddress = company?.address
        ? company.address
        : `${company?.enderecoRua || ''}, ${company?.enderecoNumero || ''} - ${company?.city || ''}/${company?.state || ''}`;

    return (
        <div className="w-full bg-white text-black p-8" id="report-template-container">
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-6 flex flex-col items-center justify-center text-center">
                {company?.logoUrl && (
                    <img src={company.logoUrl} alt="Logo" className="h-16 mb-2 object-contain" />
                )}
                {!company?.logoUrl && (
                    <h1 className="text-xl font-bold uppercase tracking-wide text-gray-900">{companyName}</h1>
                )}

                <div className="text-xs text-gray-600 mt-2 space-y-1">
                    {companyCnpj && <p>CNPJ: {companyCnpj}</p>}
                    {companyAddress && companyAddress.length > 5 && <p>{companyAddress}</p>}
                    {company?.phone && <p>Tel: {company?.phone} {company?.email ? `| Email: ${company.email}` : ''}</p>}
                </div>
            </div>

            {/* Title Section */}
            {(title || subtitle) && (
                <div className="text-center mb-8">
                    {title && <h2 className="text-lg font-bold uppercase mb-1">{title}</h2>}
                    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                    <div className="w-24 h-px bg-gray-300 mx-auto mt-2"></div>
                </div>
            )}

            {/* Content */}
            <div className="report-content">
                {children}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-4 border-t border-gray-300 text-center text-[10px] text-gray-400">
                <p>{companyName} - Sistema de Gestão de Frota</p>
                <p>Documento gerado em {new Date().toLocaleString()}</p>
            </div>
        </div>
    );
};
