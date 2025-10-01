import React from 'react';
import './PaymentReceiptTemplate.css';
import { PaymentReceiptData } from '@/services/receiptTemplateService';

interface PaymentReceiptTemplateProps {
  data: PaymentReceiptData;
  onPrint?: () => void;
  onDownload?: () => void;
}

const PaymentReceiptTemplate: React.FC<PaymentReceiptTemplateProps> = ({ 
  data, 
  onPrint, 
  onDownload 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <div className="payment-receipt-container">
      <div className="payment-receipt">
        {/* Header com logo e branding */}
        <div className="receipt-header">
          <div className="logo-section">
            <div className="logo">Itaú</div>
            <div className="brand-tagline">Sistema Bancário</div>
          </div>
          <div className="time-indicator">
            <div className="time-number">30</div>
            <div className="time-text">horas</div>
          </div>
        </div>

        {/* Linha separadora */}
        <div className="separator-line"></div>

        {/* Título principal */}
        <div className="main-title-section">
          <div className="main-title">
            <span>Comprovante de Operação</span>
            <span>- Transferência de Conta Corrente para Conta Corrente</span>
          </div>
        </div>

        {/* Identificação no extrato */}
        <div className="statement-identification">
          Identificação no Extrato: {data.statementIdentification}
        </div>

        {/* Dados da conta debitada */}
        <div className="account-section">
          <h2 className="section-title">Dados da conta a ser debitada:</h2>
          <div className="account-info">
            <div className="info-row">
              <span className="label">Agência:</span>
              <span className="value">{data.debitedAgency}</span>
            </div>
            <div className="info-row">
              <span className="label">Conta:</span>
              <span className="value">{data.debitedAccount}</span>
            </div>
            <div className="info-row">
              <span className="label">Nome:</span>
              <span className="value">{data.debitedName}</span>
            </div>
          </div>
        </div>

        {/* Dados da conta creditada */}
        <div className="account-section">
          <h2 className="section-title">Dados da conta a ser creditada:</h2>
          <div className="account-info">
            <div className="info-row">
              <span className="label">Agência:</span>
              <span className="value">{data.creditedAgency}</span>
            </div>
            <div className="info-row">
              <span className="label">Conta:</span>
              <span className="value">{data.creditedAccount}</span>
            </div>
            <div className="info-row">
              <span className="label">Nome:</span>
              <span className="value">{data.creditedName}</span>
            </div>
          </div>
        </div>

        {/* Valor da transação */}
        <div className="transaction-value">
          <span className="value-label">Valor:</span>
          <span className="value-amount">{formatCurrency(data.amount)}</span>
        </div>

        {/* Informações da transação */}
        <div className="transaction-details">
          <h2 className="section-title">Informações fornecidas pelo pagador:</h2>
          <div className="transaction-info">
            <p>
              Transferência realizada em {formatDate(data.transactionDate)} às {formatTime(data.transactionTime)}, 
              via Sispag, CTRL {data.controlNumber}
            </p>
            <div className="authentication">
              <span className="auth-label">Autenticação:</span>
              <span className="auth-code">{data.authenticationCode}</span>
            </div>
          </div>
        </div>

        {/* Linha de corte */}
        <div className="cut-line">
          <div className="dashed-line"></div>
          <div className="cut-text">Cortar aqui</div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="receipt-actions">
        {onPrint && (
          <button onClick={onPrint} className="action-button print-button">
            🖨️ Imprimir
          </button>
        )}
        {onDownload && (
          <button onClick={onDownload} className="action-button download-button">
            📥 Download PDF
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentReceiptTemplate;
