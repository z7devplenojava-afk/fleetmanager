const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  try {
    // Ler arquivo
    const content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fixed = content;
    
    // Lista de substituições baseadas nos padrões encontrados
    // Os caracteres corrompidos aparecem como sequências específicas
    const replacements = [
      // Mensagem WhatsApp linha 87
      [/'Ol[^\x20-\x7E]! Seu holerite est[^\x20-\x7E] dispon[^\x20-\x7E]vel para download\. Acesse o sistema FluxBus para visualizar\. Em caso de d[^\x20-\x7E]vidas, entre em contato com o RH\.'/, 
       "'Olá! Seu holerite está disponível para download. Acesse o sistema FluxBus para visualizar. Em caso de dúvidas, entre em contato com o RH.'"],
      
      // Comentários
      [/\/\/ Estados para unio[^\x20-\x7E] de documentos/, '// Estados para união de documentos'],
      [/\/\/ Fun[^\x20-\x7E][^\x20-\x7E]o para lidar com sucesso da unio[^\x20-\x7E] de documentos/, '// Função para lidar com sucesso da união de documentos'],
      [/\/\/ Opcionalmente, adicionar o resultado [^\x20-\x7E] lista de documentos unificados/, '// Opcionalmente, adicionar o resultado à lista de documentos unificados'],
      [/\/\/ Estados para unificao[^\x20-\x7E] individual/, '// Estados para unificação individual'],
      [/\/\/ Validao[^\x20-\x7E] de contatos para envio em lote \(holerites\)/, '// Validação de contatos para envio em lote (holerites)'],
      [/\/\/ Visualizao[^\x20-\x7E] de PDF unificado/, '// Visualização de PDF unificado'],
      [/\/\/ Estados para excluso[^\x20-\x7E] de documentos unificados/, '// Estados para exclusão de documentos unificados'],
      [/\/\/ Limpar estados primeiro para garantir que no[^\x20-\x7E] h[^\x20-\x7E] dados antigos/, '// Limpar estados primeiro para garantir que não há dados antigos'],
      [/\/\/ Carregar holerites processados via API \(sempre buscar do backend, no[^\x20-\x7E] usar cache\)/, '// Carregar holerites processados via API (sempre buscar do backend, não usar cache)'],
    ];
    
    // Aplicar substituições
    for (const [pattern, replacement] of replacements) {
      fixed = fixed.replace(pattern, replacement);
    }
    
    // Salvar apenas se houver mudanças
    if (fixed !== originalContent) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
      console.log(`   Mudanças aplicadas: ${(fixed.match(/\n/g) || []).length} linhas processadas`);
      return true;
    } else {
      console.log(`⏭️  OK: ${filePath} (nenhuma correção necessária)`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

// Arquivo específico para corrigir
const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'Holerites.tsx');

if (!fs.existsSync(filePath)) {
  console.error(`❌ Arquivo não encontrado: ${filePath}`);
  process.exit(1);
}

console.log(`🔧 Corrigindo encoding de ${filePath}...`);
fixFile(filePath);
console.log('✅ Concluído!');

