const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Lista completa de correções
    const fixes = [
      // Corrigir "usestáate" → "useState"
      [/usestáate/g, 'useState'],
      [/usestáááate/g, 'useState'],
      
      // Corrigir mensagem WhatsApp
      [/'Olá! Seu holerite está disponível para download\. Acesse o sistema FluxBus para visualizar\. Em caso de dúvidas, entre em contato com o RH\.'/, 
       "'Olá! Seu holerite está disponível para download. Acesse o sistema FluxBus para visualizar. Em caso de dúvidas, entre em contato com o RH.'"],
      
      // Corrigir comentários
      [/\/\/ estáados para unio de documentos/g, '// Estados para união de documentos'],
      [/\/\/ Estados para unio de documentos/g, '// Estados para união de documentos'],
      [/\/\/ Funo para lidar com sucesso da unio de documentos/g, '// Função para lidar com sucesso da união de documentos'],
      [/\/\/ Opcionalmente, adicionar o resultado lista de documentos unificados/g, '// Opcionalmente, adicionar o resultado à lista de documentos unificados'],
      [/\/\/ Estados para unificao individual/g, '// Estados para unificação individual'],
      [/\/\/ Validao de contatos para envio em lote \(holerites\)/g, '// Validação de contatos para envio em lote (holerites)'],
      [/\/\/ Visualizao de PDF unificado/g, '// Visualização de PDF unificado'],
      [/\/\/ Estados para excluso de documentos unificados/g, '// Estados para exclusão de documentos unificados'],
      [/\/\/ Limpar estados primeiro para garantir que no h dados antigos/g, '// Limpar estados primeiro para garantir que não há dados antigos'],
      [/\/\/ Carregar holerites processados via API \(sempre buscar do backend, no usar cache\)/g, '// Carregar holerites processados via API (sempre buscar do backend, não usar cache)'],
      [/\/\/ Funo para lidar com mudanas no termo de busca \(com debounce\)/g, '// Função para lidar com mudanças no termo de busca (com debounce)'],
      [/\/\/ Funo para lidar com filtros avanados/g, '// Função para lidar com filtros avançados'],
      
      // Remover caracteres duplicados/corrompidos
      [/estááá/g, 'está'],
      [/estáá/g, 'está'],
      [/disponívelvel/g, 'disponível'],
    ];
    
    // Aplicar todas as correções
    for (const [pattern, replacement] of fixes) {
      content = content.replace(pattern, replacement);
    }
    
    // Salvar com UTF-8
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
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

