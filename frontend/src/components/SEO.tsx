import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noindex?: boolean;
  nofollow?: boolean;
}

const SEO: React.FC<SEOProps> = ({
  title = 'Promover Vigilância - Sistema de Gestão',
  description = 'Sistema completo de gestão para empresas de vigilância patrimonial. Controle de funcionários, clientes, contratos, financeiro e muito mais.',
  keywords = 'vigilância, segurança, gestão, funcionários, clientes, contratos, financeiro',
  image = '/icons/icon-192x192.svg',
  url = window.location.href,
  type = 'website',
  author = 'Promover Vigilância',
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  noindex = false,
  nofollow = false,
}) => {
  const siteName = 'Promover Vigilância';
  const fullTitle = title === siteName ? title : `${title} | ${siteName}`;
  
  const robots = [];
  if (noindex) robots.push('noindex');
  if (nofollow) robots.push('nofollow');
  if (robots.length === 0) robots.push('index, follow');

  return (
    <Helmet>
      {/* Meta tags básicas */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={robots.join(', ')} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@promover_vigilancia" />
      
      {/* Article specific meta tags */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Additional meta tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#2563eb" />
      <meta name="msapplication-TileColor" content="#2563eb" />
      
      {/* Structured Data - Organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Promover Vigilância",
          "url": "https://promover.com.br",
          "logo": "https://promover.com.br/icons/icon-192x192.svg",
          "description": "Empresa especializada em vigilância patrimonial e segurança",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "BR"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service"
          }
        })}
      </script>
      
      {/* Structured Data - WebSite */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Promover Vigilância",
          "url": "https://promover.com.br",
          "description": description,
          "publisher": {
            "@type": "Organization",
            "name": "Promover Vigilância"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEO; 