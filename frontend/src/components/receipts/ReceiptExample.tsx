import React, { useState } from 'react';
import PaymentReceiptTemplate from './PaymentReceiptTemplate';
import { PaymentReceiptData } from '@/services/receiptTemplateService';
import './ReceiptExample.css';

const ReceiptExample: React.FC = () => {
  const [showReceipt, setShowReceipt] = useState(false);

  // Dados de exemplo baseados na imagem fornecida
  const exampleData = {
    // Dados da conta debitada (empresa)
    debitedAgency: "0925",
    debitedAccount: "98240 - 7",
    debitedName: "SECURE GUARD VIGILANCIA PATRIMONIAL",
    
    // Dados da conta creditada (funcionário)
    creditedAgency: "3804",
    creditedAccount: "68007 - 6",
    creditedName: "VARLEI MARCELINO DE OLIVEIRA",
    
    // Valor da transação
    amount: 4500.00,
    
    // Data e hora da transação
    transactionDate: "2025-07-04",
    transactionTime: "19:10:47",
    
    // Número de controle
    controlNumber: "988802476000307",
    
    // Código de autenticação
    authenticationCode: "DA2734C044771B57CF2F520A0EF4322491CBDBE6",
    
    // Identificação no extrato
    statementIdentification: "SECURE GUARD SALARIOS"
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Aqui você pode implementar a lógica para gerar PDF
    // Por exemplo, usando html2pdf.js ou jsPDF
    alert('Funcionalidade de download PDF será implementada');
  };

  const generateRandomReceipt = () => {
    // Função para gerar dados aleatórios para demonstração
    const employees = [
      "JOSE MARIO RAMOS",
      "CLAUDINEI BATISTA DA SILVA", 
      "VARLEI MARCELINO DE OLIVEIRA",
      "DANILO IGOR",
      "MOISES VIEIRA DA SILVA FRANCA"
    ];
    
    const randomEmployee = employees[Math.floor(Math.random() * employees.length)];
    const randomAmount = Math.floor(Math.random() * 5000) + 1000;
    const randomControl = Math.floor(Math.random() * 900000000000000) + 100000000000000;
    
    return {
      ...exampleData,
      creditedName: randomEmployee,
      amount: randomAmount,
      controlNumber: randomControl.toString(),
      authenticationCode: Math.random().toString(36).substring(2, 42).toUpperCase()
    };
  };

  return (
    <div className="receipt-example-container">
      <div className="example-controls">
        <h2>Template de Comprovante de Pagamento</h2>
        <p>Este é um template baseado na estrutura de comprovantes bancários para gerar recibos de pagamento.</p>
        
        <div className="control-buttons">
          <button 
            onClick={() => setShowReceipt(!showReceipt)}
            className="control-button toggle-button"
          >
            {showReceipt ? '🔽 Ocultar Recibo' : '🔼 Mostrar Recibo'}
          </button>
          
          <button 
            onClick={() => {
              // Atualizar com dados aleatórios
              const newData = generateRandomReceipt();
              // Aqui você pode atualizar o estado com novos dados
            }}
            className="control-button random-button"
          >
            🎲 Gerar Dados Aleatórios
          </button>
        </div>
      </div>

      {showReceipt && (
        <PaymentReceiptTemplate
          data={exampleData}
          onPrint={handlePrint}
          onDownload={handleDownload}
        />
      )}

      <div className="template-info">
        <h3>Características do Template:</h3>
        <ul>
          <li>✅ Design responsivo que funciona em desktop e mobile</li>
          <li>✅ Campos dinâmicos para todos os dados do recibo</li>
          <li>✅ Formatação automática de moeda brasileira (R$)</li>
          <li>✅ Formatação de data no padrão brasileiro</li>
          <li>✅ Código de autenticação destacado</li>
          <li>✅ Linha de corte para impressão</li>
          <li>✅ Botões para imprimir e baixar PDF</li>
          <li>✅ Estilos otimizados para impressão</li>
        </ul>

        <h3>Como usar:</h3>
        <ol>
          <li>Importe o componente <code>PaymentReceiptTemplate</code></li>
          <li>Prepare os dados no formato <code>PaymentReceiptData</code></li>
          <li>Passe os dados como prop <code>data</code></li>
          <li>Opcionalmente, passe funções <code>onPrint</code> e <code>onDownload</code></li>
        </ol>

        <h3>Próximos passos:</h3>
        <ul>
          <li>🔧 Integrar com a API de recibos existente</li>
          <li>🔧 Implementar geração de PDF usando html2pdf.js</li>
          <li>🔧 Adicionar validação de dados</li>
          <li>🔧 Implementar cache de templates</li>
          <li>🔧 Adicionar suporte a múltiplos idiomas</li>
        </ul>
      </div>
    </div>
  );
};

export default ReceiptExample;
