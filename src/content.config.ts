import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const NUCLEO = z.enum(['civil', 'penal']);

/** Áreas de atuação. O corpo do arquivo descreve como é o atendimento. */
const areas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/areas' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      nucleo: NUCLEO,
      /** Resumo curto, usado nos cards e listagens. */
      short: z.string(),
      /** Texto de apresentação, usado no hero da página da área. */
      text: z.string(),
      /** Observação adicional destacada na página. */
      extra: z.string().optional(),
      /** Lista "Em que podemos ajudar". */
      items: z.array(z.string()).min(1),
      photo: image(),
      /** Fotos do núcleo penal são exibidas em preto e branco. */
      grayscale: z.boolean().default(false),
      order: z.number().int(),
    }),
});

/** Publicações informativas. O corpo é o texto do artigo em Markdown. */
const publicacoes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publicacoes' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      area: reference('areas'),
      date: z.coerce.date(),
      /** Linha de abertura, destacada antes do corpo. */
      intro: z.string(),
      photo: image(),
      draft: z.boolean().default(false),
    }),
});

/** Sócios. O corpo do arquivo é a biografia. */
const socios = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/socios' }),
  schema: ({ image }) =>
    z.object({
      /** Nome completo, sem tratamento. */
      name: z.string(),
      /** Nome com tratamento, para uso corrente no texto. */
      treat: z.string(),
      /** Forma curta: "Dr. Eduardo". */
      first: z.string(),
      oab: z.string(),
      nucleo: NUCLEO,
      role: z.string(),
      lead: z.string(),
      photo: image(),
      /** Temas em que também atua, fora das áreas do núcleo. */
      also: z.array(z.string()),
      background: z.array(z.string()),
      order: z.number().int(),
    }),
});

export const collections = { areas, publicacoes, socios };
