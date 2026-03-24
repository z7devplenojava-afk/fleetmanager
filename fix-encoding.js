const fs = require('fs');
const path = require('path');

// Mapeamento de caracteres corrompidos para corretos
const replacements = {
  'Ol!': 'Olá!',
  'est': 'está',
  'disponvel': 'disponível',
  'dvidas': 'dúvidas',
  'unio': 'união',
  'Funo': 'Função',
  'unificao': 'unificação',
  'Validao': 'Validação',
  'Visualizao': 'Visualização',
  'excluso': 'exclusão',
  'no h': 'não há',
  'no usar': 'não usar',
  'resultado': 'resultado à',
};

function fixFile(filePath) {
  try {
    // Ler arquivo
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Aplicar substituições
    for (const [old, new_] of Object.entries(replacements)) {
      if (content.includes(old)) {
        content = content.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), new_);
      }
    }
    
    // Salvar apenas se houver mudanças
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigido: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  OK: ${filePath}`);
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

