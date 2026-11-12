/** Formatação de datas e cálculo de tempo de leitura. */

const MESES = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
] as const;

/** "28 out 2026" — formato curto usado nas listagens e no topo dos artigos. */
export function dataCurta(d: Date): string {
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "2026-10-28" — para o atributo datetime do elemento <time>. */
export function dataISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Tempo de leitura estimado a partir do corpo em Markdown.
 * 200 palavras por minuto, descontando a marcação.
 */
export function tempoLeitura(markdown: string): string {
  const texto = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|-]/g, ' ');
  const palavras = texto.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(palavras / 200))} min`;
}
