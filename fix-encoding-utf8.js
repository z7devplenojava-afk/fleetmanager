const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  try {
    // Ler arquivo como buffer para manipular bytes
    const buffer = fs.readFileSync(filePath);
    let content = buffer.toString('utf8');
    const originalContent = content;
    
    // Corrigir sequências UTF-8 duplicadas/corrompidas
    // Padrão: c3a1c3a1c3a1 (múltiplos "á" corrompidos) → á
    content = content.replace(/\u00e1\u00e1\u00e1/g, 'á');
    content = content.replace(/\u00e1\u00e1/g, 'á');
    content = content.replace(/\u00e3\u00e3/g, 'ã');
    content = content.replace(/\u00e7\u00e7/g, 'ç');
    content = content.replace(/\u00e9\u00e9/g, 'é');
    content = content.replace(/\u00f3\u00f3/g, 'ó');
    
    // Remover caracteres de substituição UTF-8 ()
    content = content.replace(/\uFFFD/g, '');
    
    // Corrigir padrões específicos encontrados
    const fixes = [
      // Linha 87 - mensagem WhatsApp
      [/usestáááate\(/g, 'useState('],
      [/'Olá! Seu holerite estááá disponível/g, "'Olá! Seu holerite está disponível"],
      [/estááá/g, 'está'],
      [/disponível para download\. Acesse o sistema FluxBus para visualizar\. Em caso de d[^\x20-\x7E]vidas/g, 'disponível para download. Acesse o sistema FluxBus para visualizar. Em caso de dúvidas'],
      
      // Comentários com caracteres corrompidos
      [/\/\/ Estados para unio[^\x20-\x7E] de documentos/g, '// Estados para união de documentos'],
      [/\/\/ Fun[^\x20-\x7E][^\x20-\x7E]o para lidar com sucesso da unio[^\x20-\x7E] de documentos/g, '// Função para lidar com sucesso da união de documentos'],
      [/\/\/ Opcionalmente, adicionar o resultado [^\x20-\x7E] lista de documentos unificados/g, '// Opcionalmente, adicionar o resultado à lista de documentos unificados'],
      [/\/\/ Estados para unificao[^\x20-\x7E] individual/g, '// Estados para unificação individual'],
      [/\/\/ Validao[^\x20-\x7E] de contatos para envio em lote \(holerites\)/g, '// Validação de contatos para envio em lote (holerites)'],
      [/\/\/ Visualizao[^\x20-\x7E] de PDF unificado/g, '// Visualização de PDF unificado'],
      [/\/\/ Estados para excluso[^\x20-\x7E] de documentos unificados/g, '// Estados para exclusão de documentos unificados'],
      [/\/\/ Limpar estados primeiro para garantir que no[^\x20-\x7E] h[^\x20-\x7E] dados antigos/g, '// Limpar estados primeiro para garantir que não há dados antigos'],
      [/\/\/ Carregar holerites processados via API \(sempre buscar do backend, no[^\x20-\x7E] usar cache\)/g, '// Carregar holerites processados via API (sempre buscar do backend, não usar cache)'],
    ];
    
    // Aplicar todas as correções
    for (const [pattern, replacement] of fixes) {
      content = content.replace(pattern, replacement);
    }
    
    // Salvar com UTF-8
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      const changes = (content.match(/\n/g) || []).length - (originalContent.match(/\n/g) || []).length;
      console.log(`✅ Corrigido: ${filePath}`);
      console.log(`   Tamanho original: ${originalContent.length} caracteres`);
      console.log(`   Tamanho corrigido: ${content.length} caracteres`);
      return true;
    } else {
      console.log(`⏭️  OK: ${filePath} (nenhuma correção necessária)`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    console.error(error.stack);
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

