/**
 * Gera as imagens sociais a partir da identidade do site.
 *
 *   node scripts/gerar-imagens-sociais.mjs
 *
 * Produz:
 *   public/og.jpg              1200x630, usada no WhatsApp, LinkedIn e afins
 *   public/apple-touch-icon.png  180x180, ícone ao salvar na tela inicial
 *   public/favicon.png           64x64, ícone da aba do navegador
 *
 * As logos vêm de public/marca (versões oficiais do escritório, em branco
 * sobre transparente).
 *
 * Rodar de novo sobrescreve os arquivos. Só precisa ser executado quando a
 * foto de capa, as cores ou o nome mudarem.
 */

import { Buffer } from 'node:buffer';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entrada = path.join(raiz, 'src/assets/img/hero-moldura.jpg');
const MARCA = path.join(raiz, 'public/marca');
const saida = path.join(raiz, 'public');

/** Mesmas cores de src/styles/tokens.css. */
const COR = {
  tinta: '#1D2023',
  marca: '#08003C',
  claro: '#F1F1EC',
  bronze: '#D0A46C',
  suave: '#A3ADC2',
};

const OG = { largura: 1200, altura: 630 };

/** Serifa com alternativas, porque a fonte varia conforme o sistema. */
const SERIFA = "Georgia, 'Times New Roman', 'Liberation Serif', serif";
const SANS = "'Segoe UI', Arial, 'Liberation Sans', sans-serif";

/** Camada de texto e gradiente sobre a foto. */
function camadaOg() {
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${OG.largura}" height="${OG.altura}">
  <defs>
    <linearGradient id="v" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${COR.tinta}" stop-opacity="0.97"/>
      <stop offset="62%"  stop-color="${COR.tinta}" stop-opacity="0.86"/>
      <stop offset="100%" stop-color="${COR.tinta}" stop-opacity="0.40"/>
    </linearGradient>
  </defs>

  <rect width="100%" height="100%" fill="url(#v)"/>



  <rect x="74" y="330" width="88" height="2" fill="${COR.bronze}"/>

  <text x="72" y="408" font-family="${SERIFA}" font-size="40" fill="${COR.claro}">
    Para cada problema, uma solução.
  </text>

  <text x="74" y="556" font-family="${SANS}" font-size="22" fill="${COR.suave}">
    Palhoça · Santa Catarina · Atendimento em todo o Brasil
  </text>
</svg>`);
}

/** Ícone: as letras N&A da logo oficial, em branco sobre o azul da marca. */
async function icone(lado) {
  const letras = await sharp(path.join(MARCA, 'letras.png'))
    .resize({ width: Math.round(lado * 0.74) })
    .toBuffer();
  return sharp({
    create: { width: lado, height: lado, channels: 4, background: COR.marca },
  }).composite([{ input: letras, gravity: 'center' }]);
}

await mkdir(saida, { recursive: true });

// Open Graph: foto recortada, escurecida e com o texto por cima.
const og = path.join(saida, 'og.jpg');
await sharp(entrada)
  .resize(OG.largura, OG.altura, { fit: 'cover', position: 'right top' })
  .composite([
    { input: camadaOg(), top: 0, left: 0 },
    {
      input: await sharp(path.join(MARCA, 'horizontal.png')).resize({ width: 540 }).toBuffer(),
      top: 214,
      left: 72,
    },
  ])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(og);

// Ícone para a tela inicial do iOS e ícone da aba.
const apple = path.join(saida, 'apple-touch-icon.png');
await (await icone(180)).png({ compressionLevel: 9 }).toFile(apple);
const favicon = path.join(saida, 'favicon.png');
await (await icone(64)).png({ compressionLevel: 9 }).toFile(favicon);

for (const arquivo of [og, apple, favicon]) {
  // O tamanho vem do arquivo gravado. Medir com toBuffer() daria o resultado
  // de uma nova codificação em memória, que não é o que foi para o disco.
  const [{ size }, { width, height }] = await Promise.all([
    stat(arquivo),
    sharp(arquivo).metadata(),
  ]);
  const nome = path.relative(raiz, arquivo).replace(/\\/g, '/');
  console.log(`${nome}  ${width}x${height}  ${(size / 1024).toFixed(1)} kB`);
}
