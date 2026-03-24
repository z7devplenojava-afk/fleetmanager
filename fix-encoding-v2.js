const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  try {
    // Ler arquivo como buffer primeiro para ver o encoding real
    const buffer = fs.readFileSync(filePath);
    
    // Tentar diferentes encodings
    let content = null;
    let usedEncoding = 'utf8';
    
    try {
      content = buffer.toString('utf8');
      usedEncoding = 'utf8';
    } catch (e) {
      try {
        content = buffer.toString('latin1');
        usedEncoding = 'latin1';
      } catch (e2) {
        content = buffer.toString('cp1252');
        usedEncoding = 'cp1252';
      }
    }
    
    const originalContent = content;
    
    // Mapeamento mais abrangente de caracteres corrompidos
    // Procurar por padrões comuns de corrupção UTF-8
    const fixes = [
      // Padrões específicos encontrados
      [/Ol[^\x20-\x7E]!/g, 'Olá!'],
      [/est[^\x20-\x7E]/g, 'está'],
      [/dispon[^\x20-\x7E]vel/g, 'disponível'],
      [/d[^\x20-\x7E]vidas/g, 'dúvidas'],
      [/unio[^\x20-\x7E]/g, 'união'],
      [/Funo[^\x20-\x7E]/g, 'Função'],
      [/unificao[^\x20-\x7E]/g, 'unificação'],
      [/Validao[^\x20-\x7E]/g, 'Validação'],
      [/Visualizao[^\x20-\x7E]/g, 'Visualização'],
      [/excluso[^\x20-\x7E]/g, 'exclusão'],
      [/no h[^\x20-\x7E]/g, 'não há'],
      [/no usar/g, 'não usar'],
      [/resultado [^\x20-\x7E]/g, 'resultado à'],
      
      // Padrões genéricos de corrupção UTF-8
      [/\xE3\x83/g, ''], // Remove caracteres corrompidos comuns
      [/\xE3\xA3/g, 'ã'],
      [/\xE3\xA7/g, 'ç'],
      [/\xE3\xA9/g, 'é'],
      [/\xE3\xB3/g, 'ó'],
      [/\xE3\xAD/g, 'í'],
      [/\xE3\xBA/g, 'ú'],
      [/\xC3\xA3/g, 'ã'],
      [/\xC3\xA7/g, 'ç'],
      [/\xC3\xA9/g, 'é'],
      [/\xC3\xB3/g, 'ó'],
      [/\xC3\xAD/g, 'í'],
      [/\xC3\xBA/g, 'ú'],
      [/\xC3\xA1/g, 'á'],
      [/\xC3\xAA/g, 'ê'],
      [/\xC3\xB4/g, 'ô'],
      [/\xC3\xA0/g, 'à'],
    ];
    
    // Aplicar correções
    for (const [pattern, replacement] of fixes) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
      }
    }
    
    // Salvar com UTF-8
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigido: ${filePath} (encoding original: ${usedEncoding})`);
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

