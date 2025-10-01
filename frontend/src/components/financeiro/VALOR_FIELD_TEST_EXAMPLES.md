// Exemplo de teste para o campo Valor
// Teste com diferentes valores de entrada:

// Entrada: "5.478,45"
// Processamento:
// 1. Remove caracteres não numéricos: "5478,45"
// 2. Mantém vírgula como separador decimal
// 3. Converte para número: 5478.45
// 4. Salva no banco: 5478.45
// 5. Exibe formatado: "5.478,45"

// Entrada: "1234.56" (formato americano)
// Processamento:
// 1. Remove caracteres não numéricos: "1234.56"
// 2. Converte ponto para vírgula: "1234,56"
// 3. Converte para número: 1234.56
// 4. Salva no banco: 1234.56
// 5. Exibe formatado: "1.234,56"

// Entrada: "100" (sem decimais)
// Processamento:
// 1. Remove caracteres não numéricos: "100"
// 2. Converte para número: 100
// 3. Salva no banco: 100.00
// 4. Exibe formatado: "100,00"

// Entrada: "0,50" (centavos)
// Processamento:
// 1. Remove caracteres não numéricos: "0,50"
// 2. Converte para número: 0.50
// 3. Salva no banco: 0.50
// 4. Exibe formatado: "0,50"
