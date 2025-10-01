# Template de Comprovante de Pagamento

Este template foi criado baseado na estrutura de comprovantes bancários para gerar recibos de pagamento profissionais e padronizados.

## 📋 Características

- ✅ **Design Responsivo**: Funciona perfeitamente em desktop e mobile
- ✅ **Campos Dinâmicos**: Todos os dados são configuráveis
- ✅ **Formatação Automática**: Moeda brasileira (R$) e datas no padrão brasileiro
- ✅ **Código de Autenticação**: Geração automática de códigos únicos
- ✅ **Linha de Corte**: Otimizado para impressão
- ✅ **Botões de Ação**: Imprimir e download PDF
- ✅ **Validação de Dados**: Verificação automática de campos obrigatórios

## 🚀 Como Usar

### 1. Importar o Componente

```tsx
import PaymentReceiptTemplate from './components/receipts/PaymentReceiptTemplate';
import ReceiptTemplateService from './services/receiptTemplateService';
```

### 2. Preparar os Dados

```tsx
const receiptData = {
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
```

### 3. Usar o Template

```tsx
const MyComponent = () => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implementar geração de PDF
    console.log('Gerando PDF...');
  };

  return (
    <PaymentReceiptTemplate
      data={receiptData}
      onPrint={handlePrint}
      onDownload={handleDownload}
    />
  );
};
```

### 4. Integração com API

```tsx
const ReceiptComponent = () => {
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadReceipt = async (receiptId: string) => {
    setLoading(true);
    try {
      const response = await ReceiptTemplateService.generateReceiptTemplate(receiptId);
      if (response.success) {
        setReceiptData(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar recibo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <div>Carregando...</div>}
      {receiptData && (
        <PaymentReceiptTemplate
          data={receiptData}
          onPrint={() => window.print()}
          onDownload={() => console.log('Download PDF')}
        />
      )}
    </div>
  );
};
```

## 📁 Estrutura de Arquivos

```
frontend/src/components/receipts/
├── PaymentReceiptTemplate.tsx    # Componente principal do template
├── PaymentReceiptTemplate.css    # Estilos do template
├── ReceiptExample.tsx            # Componente de exemplo/demonstração
├── ReceiptExample.css            # Estilos do exemplo
└── README.md                     # Esta documentação

frontend/src/services/
└── receiptTemplateService.ts     # Serviço para integração com API
```

## 🎨 Personalização

### Cores e Estilos

As cores principais podem ser alteradas no arquivo CSS:

```css
/* Cores principais */
--primary-color: #3498db;      /* Azul principal */
--secondary-color: #2c3e50;    /* Azul escuro */
--success-color: #27ae60;      /* Verde */
--danger-color: #e74c3c;       /* Vermelho */
--warning-color: #f39c12;      /* Laranja */
```

### Logo e Branding

Para alterar o logo e branding, edite o componente:

```tsx
<div className="logo-section">
  <div className="logo">SEU LOGO AQUI</div>
  <div className="brand-tagline">Sua Tagline</div>
</div>
```

## 🔧 Funcionalidades Avançadas

### Geração de PDF

Para implementar geração de PDF, instale e use uma biblioteca como `html2pdf.js`:

```bash
npm install html2pdf.js
```

```tsx
import html2pdf from 'html2pdf.js';

const handleDownload = () => {
  const element = document.querySelector('.payment-receipt');
  const opt = {
    margin: 1,
    filename: 'comprovante-pagamento.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(element).save();
};
```

### Validação de Dados

O serviço inclui validação automática:

```tsx
const validation = ReceiptTemplateService.validateTemplateData(receiptData);
if (!validation.isValid) {
  console.error('Erros de validação:', validation.errors);
}
```

### Múltiplos Recibos

Para gerar múltiplos recibos:

```tsx
const receiptIds = ['id1', 'id2', 'id3'];
const templates = await ReceiptTemplateService.generateMultipleReceiptTemplates(receiptIds);
```

## 📱 Responsividade

O template é totalmente responsivo e se adapta a diferentes tamanhos de tela:

- **Desktop**: Layout completo com todas as informações
- **Tablet**: Layout otimizado para telas médias
- **Mobile**: Layout compacto com informações essenciais

## 🖨️ Impressão

O template inclui estilos específicos para impressão:

```css
@media print {
  .receipt-actions { display: none; }
  .payment-receipt { box-shadow: none; }
}
```

## 🔒 Segurança

- Códigos de autenticação únicos gerados automaticamente
- Validação de dados para prevenir erros
- Formatação segura de valores monetários

## 🚀 Próximos Passos

1. **Integração Completa**: Conectar com a API de recibos existente
2. **Geração de PDF**: Implementar download de PDF
3. **Cache de Templates**: Otimizar performance
4. **Múltiplos Idiomas**: Suporte a diferentes idiomas
5. **Templates Personalizados**: Permitir customização por empresa

## 📞 Suporte

Para dúvidas ou sugestões sobre o template, entre em contato com a equipe de desenvolvimento.
