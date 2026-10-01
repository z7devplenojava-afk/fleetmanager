/**
 * Sanitiza HTML vindo do servidor para impedir XSS (injeção de scripts,
 * event handlers, URLs perigosas e rastreadores).
 *
 * Extraído do EmailModule para reuso (ex.: QuotationDetailModal).
 * Para proteção mais robusta, considere instalar o DOMPurify.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?<\/embed>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<base[^>]*>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<math[\s\S]*?<\/math>/gi, '')
    .replace(/on\w+\s*=\s*("|')[^"|']*("|')/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/style\s*=\s*("|')[^"']*expression[^"']*("|')/gi, '')
    .replace(/<img([^>]*)\bsrc\s*=\s*("|')([^"']*)?("|')/gi, (match, attrs, q1, src, q2) =>
      // remove rastreadores de pixel (imagens 1x1) e fontes remotas suspeitas
      (src && src.toLowerCase().includes('pixel')) ? '' : match
    );
}
