/**
 * Gera as imagens sociais a partir da identidade do site.
 *
 *   node scripts/gerar-imagens-sociais.mjs
 *
 * Produz:
 *   public/og.jpg              1200x630, usada no WhatsApp, LinkedIn e afins
 *   public/apple-touch-icon.png  180x180, ícone ao salvar na tela inicial
 *
 * Rodar de novo sobrescreve os arquivos. Só precisa ser executado quando a
 * foto de capa, as cores ou o nome mudarem.
 */

import { Buffer } from 'node:buffer';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entrada = path.join(raiz, 'src/assets/img/hero.jpg');
const saida = path.join(raiz, 'public');

/** Mesmas cores de src/styles/tokens.css. */
const COR = {
  tinta: '#1D2023',
  claro: '#F1F1EC',
  bronze: '#D0A46C',
  suave: '#9FB1B3',
};

const OG = { largura: 1200, altura: 630 };

/** Serifa com alternativas, porque a fonte varia conforme o sistema. */
const SERIFA = "Georgia, 'Times New Roman', 'Liberation Serif', serif";
const SANS = "'Segoe UI', Arial, 'Liberation Sans', sans-serif";

const escapar = (s) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c],
  );

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

  <text x="72" y="238" font-family="${SERIFA}" font-size="76" fill="${COR.claro}">
    ${escapar('Narcizo & Amaral')}
  </text>

  <text x="74" y="286" font-family="${SANS}" font-size="21"
        letter-spacing="7" fill="${COR.suave}">
    ADVOGADOS ASSOCIADOS
  </text>

  <rect x="74" y="330" width="88" height="2" fill="${COR.bronze}"/>

  <text x="72" y="408" font-family="${SERIFA}" font-size="40" fill="${COR.claro}">
    Para cada problema, uma solução.
  </text>

  <text x="74" y="556" font-family="${SANS}" font-size="22" fill="${COR.suave}">
    Palhoça · Santa Catarina · Atendimento em todo o Brasil
  </text>
</svg>`);
}

/** Monograma do ícone. */
function iconeSvg(lado) {
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}">
  <rect width="${lado}" height="${lado}" fill="${COR.tinta}"/>
  <text x="50%" y="68%" text-anchor="middle"
        font-family="${SERIFA}" font-size="${Math.round(lado * 0.46)}"
        fill="${COR.bronze}">NA</text>
</svg>`);
}

await mkdir(saida, { recursive: true });

// Open Graph: foto recortada, escurecida e com o texto por cima.
const og = path.join(saida, 'og.jpg');
await sharp(entrada)
  .resize(OG.largura, OG.altura, { fit: 'cover', position: 'right top' })
  .composite([{ input: camadaOg(), top: 0, left: 0 }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(og);

// Ícone para a tela inicial do iOS.
const icone = path.join(saida, 'apple-touch-icon.png');
await sharp(iconeSvg(180)).png({ compressionLevel: 9 }).toFile(icone);

for (const arquivo of [og, icone]) {
  const { size } = await sharp(arquivo).metadata().then(
    async (m) => ({ size: (await sharp(arquivo).toBuffer()).length, ...m }),
  );
  const m = await sharp(arquivo).metadata();
  console.log(
    `${path.relative(raiz, arquivo).replace(/\\/g, '/')}  ${m.width}x${m.height}  ${Math.round(size / 1024)} kB`,
  );
}
