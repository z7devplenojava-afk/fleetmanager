import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lista de rotas públicas da aplicação
const routes = [
  {
    url: '/',
    changefreq: 'daily',
    priority: 1.0,
    lastmod: new Date().toISOString()
  },
  {
    url: '/portal',
    changefreq: 'daily',
    priority: 0.9,
    lastmod: new Date().toISOString()
  },
  {
    url: '/portal/vagas',
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: new Date().toISOString()
  },
  {
    url: '/login',
    changefreq: 'monthly',
    priority: 0.5,
    lastmod: new Date().toISOString()
  }
];

// Configurações do sitemap
const sitemapConfig = {
  hostname: 'https://promover.com.br', // Altere para seu domínio
  cacheTime: 600000, // 10 minutos
  urls: routes
};

async function generateSitemap() {
  try {
    console.log('Gerando sitemap...');
    
    // Criar stream do sitemap
    const sitemap = new SitemapStream(sitemapConfig);
    
    // Adicionar rotas ao sitemap
    routes.forEach(route => {
      sitemap.write(route);
    });
    
    sitemap.end();
    
    // Converter para string
    const sitemapString = await streamToPromise(sitemap);
    
    // Salvar arquivo
    const outputPath = resolve(__dirname, '../public/sitemap.xml');
    const writeStream = createWriteStream(outputPath);
    
    writeStream.write(sitemapString.toString());
    writeStream.end();
    
    console.log(`Sitemap gerado com sucesso em: ${outputPath}`);
    console.log(`Total de URLs: ${routes.length}`);
    
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
  }
}

// Executar se chamado diretamente
generateSitemap();

export { generateSitemap, routes }; 