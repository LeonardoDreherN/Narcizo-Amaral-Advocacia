/** Dados fixos do escritório, usados em metadados, rodapé e dados estruturados. */

/**
 * O site só deve ser indexado quando estiver no domínio definitivo. Enquanto
 * roda num endereço provisório, as páginas saem com noindex e o robots.txt
 * bloqueia tudo, para não criar URLs que depois competem com as do domínio
 * real. Para liberar, defina INDEXAR=true no ambiente de build.
 */
export const INDEXAVEL = import.meta.env.INDEXAR === 'true';

export const SITE = {
  name: 'Narcizo & Amaral',
  legalName: 'Narcizo & Amaral Advogados Associados',
  tagline: 'Advogados Associados',
  description:
    'Narcizo & Amaral Advogados Associados. Sede em Palhoça, Santa Catarina, com atendimento presencial ou on-line em todo o Brasil.',
  /** Registro da sociedade na OAB/SC. */
  oab: 'OAB/SC nº 6673',
  locale: 'pt-BR',
} as const;

export const CONTACT = {
  phone: '(48) 98458-6534',
  /** Formato E.164, para links tel: e WhatsApp. */
  phoneRaw: '+5548984586534',
  whatsapp: 'https://wa.me/5548984586534',
  instagram: 'https://www.instagram.com/advogado.eduardo/',
  instagramHandle: '@advogado.eduardo',
  hours: 'Com hora marcada, até as 19h',
} as const;

export const ADDRESS = {
  street: 'R. Najla Carone Guedert, 1080, sala 102',
  district: 'Pagani',
  city: 'Palhoça',
  state: 'SC',
  zip: '88132-150',
  country: 'BR',
  reference: 'Próximo ao Fórum da Comarca de Palhoça',
  lat: -27.6419025,
  lon: -48.6772373,
  /** Endereço em uma linha. */
  get full() {
    return `${this.street}, ${this.district}, ${this.city}/${this.state}, ${this.zip}`;
  },
} as const;

export const MAPS = {
  google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'R. Najla Carone Guedert, 1080, Palhoça SC',
  )}`,
  waze: `https://waze.com/ul?ll=${ADDRESS.lat},${ADDRESS.lon}&navigate=yes`,
  apple: `https://maps.apple.com/?q=${encodeURIComponent('Narcizo & Amaral')}&ll=${ADDRESS.lat},${ADDRESS.lon}`,
} as const;

/** Os dois núcleos de atuação. São poucos e estáveis, por isso não são uma coleção. */
export const NUCLEOS = {
  civil: {
    id: 'civil',
    title: 'Núcleo de Direito Civil',
    intro:
      'Questões imobiliárias, familiares e sucessórias, relações de consumo e o acesso à saúde, com soluções práticas e seguras construídas a partir da realidade de cada cliente.',
  },
  penal: {
    id: 'penal',
    title: 'Núcleo de Direito Penal',
    intro:
      'Defesa técnica em inquéritos policiais, audiências de custódia, ações penais e recursos, sempre pautada pelo respeito às garantias fundamentais.',
  },
} as const;

export type NucleoId = keyof typeof NUCLEOS;

/** Aviso exigido pelo Provimento 205/2021 do CFOAB nos conteúdos informativos. */
export const DISCLAIMER =
  'Conteúdo informativo, conforme o Provimento 205/2021 do Conselho Federal da OAB. Não substitui a análise individual do caso por um advogado.';

export const NAV = [
  { href: '/escritorio', label: 'Escritório' },
  { href: '/socios', label: 'Sócios' },
  { href: '/atuacao', label: 'Atuação' },
  { href: '/publicacoes', label: 'Publicações' },
  { href: '/contato', label: 'Contato' },
] as const;
