/**
 * Normalização de caminho.
 *
 * Com `build.format: 'file'`, o Astro grava `/escritorio.html` e o
 * `Astro.url.pathname` passa a terminar em `.html` durante o build — mas não no
 * servidor de desenvolvimento, que serve `/escritorio`. A Cloudflare Pages
 * serve o arquivo na URL sem a extensão, então a URL pública é sempre a limpa.
 *
 * Tudo que compara ou publica caminhos (canônica, Open Graph, item de menu
 * ativo) precisa usar a forma limpa, ou dev e produção divergem.
 */
export function caminhoLimpo(pathname: string): string {
  let p = pathname;

  // /sobre/index.html -> /sobre
  p = p.replace(/\/index\.html$/, '');
  // /sobre.html -> /sobre
  p = p.replace(/\.html$/, '');
  // /sobre/ -> /sobre
  if (p.length > 1) p = p.replace(/\/$/, '');

  return p === '' ? '/' : p;
}
