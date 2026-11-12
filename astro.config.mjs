import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// TODO: trocar pelo domínio real antes do deploy. O sitemap e as URLs
// canônicas são gerados a partir daqui.
const SITE = 'https://narcizoamaral.adv.br';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'never',

  build: {
    // URLs limpas: /escritorio em vez de /escritorio/index.html
    format: 'file',
    inlineStylesheets: 'auto',
  },

  integrations: [
    sitemap({
      i18n: undefined,
      filter: (page) => !page.includes('/404'),
      changefreq: 'monthly',
      lastmod: new Date(),
    }),
  ],

  // Fontes self-hosted: baixadas no build, com preload e métricas de
  // fallback automáticas (CLS zero). Substitui o <link> do Google Fonts.
  fonts: [
    {
      name: 'Newsreader',
      cssVariable: '--font-serif',
      provider: fontProviders.google(),
      weights: [300, 400, 500],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
      optimizedFallbacks: true,
      display: 'swap',
    },
    {
      name: 'Instrument Sans',
      cssVariable: '--font-sans',
      provider: fontProviders.google(),
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
      optimizedFallbacks: true,
      display: 'swap',
    },
  ],

  image: {
    // Gera srcset e dimensões automaticamente para evitar CLS.
    layout: 'constrained',
    objectFit: 'cover',
    objectPosition: 'center',
    breakpoints: [360, 480, 640, 768, 1024, 1280, 1536, 1920],
    responsiveStyles: true,
  },

  // Pré-carrega os links visíveis: navegação praticamente instantânea.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  devToolbar: { enabled: false },
});
