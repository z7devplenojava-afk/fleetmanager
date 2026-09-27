/**
 * Utilitário para compressão e redimensionamento client-side de imagens antes do upload
 */
export async function compressImageIfNeeded(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<File> {
  // SVGs e arquivos vetoriais ou ícones não devem ser rasterizados/comprimidos via canvas
  if (
    file.type === 'image/svg+xml' ||
    file.name.toLowerCase().endsWith('.svg') ||
    file.name.toLowerCase().endsWith('.ico')
  ) {
    return file;
  }

  // Se o arquivo já for pequeno (menor que 500KB) e não for imagem grande, retorna direto
  if (file.size <= 500 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width <= maxWidth && height <= maxHeight && file.size <= 1024 * 1024) {
          resolve(file);
          return;
        }

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // PNGs no canvas ignoram o parâmetro de qualidade (lossless), podendo gerar arquivos imensos (>10MB).
        // Se a imagem for grande (>800KB) e sofrer redimensionamento, exportar como JPEG garante redução drástica (<500KB).
        const isPng = file.type === 'image/png';
        const outType = isPng && file.size <= 800 * 1024 ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const outName = isPng && outType === 'image/jpeg'
              ? file.name.replace(/\.png$/i, '.jpg')
              : file.name;
            const compressedFile = new File([blob], outName, {
              type: outType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outType,
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
