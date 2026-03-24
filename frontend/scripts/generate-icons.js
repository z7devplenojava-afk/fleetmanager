import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar ícones PWA a partir do SVG existente
// Este é um placeholder - em produção, você usaria uma biblioteca como sharp ou jimp

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Criar um ícone PNG simples baseado no SVG
const createIcon = (size) => {
  // Em produção, você converteria o SVG para PNG
  // Por enquanto, vamos criar um arquivo placeholder
  const svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="192" height="192" rx="24" fill="#dc2626"/>
    <path d="M48 48h96v96H48V48z" fill="#ffffff"/>
    <path d="M64 64h64v64H64V64z" fill="#dc2626"/>
    <circle cx="96" cy="96" r="16" fill="#ffffff"/>
    <path d="M88 88h16v16H88V88z" fill="#dc2626"/>
  </svg>`;
  
  return svgContent;
};

// Criar diretório de ícones se não existir
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Gerar ícones SVG para cada tamanho
iconSizes.forEach(size => {
  const iconContent = createIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, iconContent);
  console.log(`Criado: ${filename}`);
});

console.log('Ícones PWA criados com sucesso!');
