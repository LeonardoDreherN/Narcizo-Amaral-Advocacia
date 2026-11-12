import type { APIRoute } from 'astro';
import { INDEXAVEL } from '~/data/site';

/**
 * robots.txt gerado no build.
 *
 * Enquanto o site não estiver no domínio definitivo, ele bloqueia os
 * buscadores por inteiro. Indexar um endereço provisório cria URLs que depois
 * competem com as do domínio real e precisam ser removidas na mão.
 *
 * Para liberar, defina INDEXAR=true no ambiente de build.
 */
export const GET: APIRoute = ({ site }) => {
  const corpo = INDEXAVEL
    ? ['User-agent: *', 'Allow: /', '', `Sitemap: ${new URL('sitemap-index.xml', site)}`].join('\n')
    : [
        '# Site em endereço provisório, fora do domínio definitivo.',
        '# Indexar aqui criaria URLs concorrentes com as do domínio real.',
        'User-agent: *',
        'Disallow: /',
      ].join('\n');

  return new Response(`${corpo}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
