# Template de Fundo para Relatórios

Este diretório contém o template de fundo usado em todos os relatórios PDF do sistema.

## Arquivo Necessário

- **Nome do arquivo:** `report-background-template.png`
- **Localização:** `backend/src/main/resources/templates/reports/report-background-template.png`

## Especificações do Template

O template de fundo deve conter:

1. **Gradiente horizontal no topo** (amarelo → laranja → vermelho)
2. **Forma curva escura** no canto superior esquerdo
3. **Marca d'água translúcida** (formas abstratas tipo "p") no centro da página
4. **Linha gradiente fina** na parte inferior (amarelo → laranja → vermelho)
5. **Fundo branco** para o conteúdo do relatório

## Dimensões

- **Formato:** PNG com transparência
- **Resolução:** Recomendado 300 DPI para qualidade de impressão
- **Tamanho:** A4 (210mm × 297mm ou 595pt × 842pt)

## Elementos Dinâmicos Adicionados Sobre o Template

O sistema adiciona automaticamente sobre o template:

- **Logo da empresa** (297x217px) no canto superior esquerdo
- **Título do relatório** (centralizado no topo)
- **Nome da empresa e CNPJ** (no cabeçalho)
- **Tabela de dados** (no corpo do relatório)
- **Informações do rodapé** (endereço, telefone, email, CNPJ)
- **Data de geração** (no rodapé)

## Como Adicionar o Template

1. Salve a imagem do template como `report-background-template.png`
2. Coloque o arquivo neste diretório: `backend/src/main/resources/templates/reports/`
3. Reinicie a aplicação para que o template seja carregado

## Fallback

Se o template não for encontrado, o sistema usará um fallback programático para desenhar os elementos básicos (gradiente e forma curva), mas a marca d'água não será exibida.
