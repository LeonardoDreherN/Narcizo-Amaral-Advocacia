# Narcizo & Amaral Advogados

Site institucional do escritório Narcizo & Amaral Advogados Associados, com sede em
Palhoça, Santa Catarina.

Construído em [Astro](https://astro.build) com saída estática: cada página é um arquivo
HTML pré-renderizado, servido direto da CDN.

## Requisitos

- Node 26.13.1 (a versão está fixada em `.node-version`)
- npm 11+

O projeto usa [fnm](https://github.com/Schniz/fnm) para gerenciar a versão do Node.
Com o fnm ativo no shell, basta entrar na pasta que ele troca para a versão correta.

Para ativar o fnm automaticamente no PowerShell, acrescente ao seu
`$PROFILE.CurrentUserAllHosts`:

```powershell
# fnm: usa a versão do Node do .node-version ao entrar na pasta
$fnmExe = "$env:LOCALAPPDATA\Microsoft\WinGet\Links\fnm.exe"
if (Test-Path $fnmExe) {
  & $fnmExe env --use-on-cd --shell power-shell | Out-String | Invoke-Expression
}
```

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm install` | instala as dependências |
| `npm run dev` | sobe o servidor de desenvolvimento em `localhost:4321` |
| `npm run build` | gera o site em `dist/` |
| `npm run preview` | serve o `dist/` localmente, como em produção |
| `npm run check` | checagem de tipos do site e da function |
| `node scripts/gerar-imagens-sociais.mjs` | regenera `og.jpg` e o ícone |

## Estrutura

```
src/
├─ assets/img/        imagens originais; o Astro gera WebP e srcset no build
├─ components/        blocos reutilizáveis (.astro)
├─ content/           o conteúdo do site, em Markdown
│  ├─ areas/          7 áreas de atuação
│  ├─ publicacoes/    artigos
│  └─ socios/         perfis dos sócios
├─ data/site.ts       endereço, telefone, núcleos e textos fixos
├─ layouts/Base.astro casca HTML, SEO e dados estruturados
├─ lib/               formatação de data, tempo de leitura e JSON-LD
├─ pages/             as rotas; o caminho do arquivo é a URL
└─ styles/            CSS por área, agregado em global.css
functions/api/        função que recebe o formulário de contato
public/               arquivos servidos como estão (robots, headers, favicon)
```

## Publicar um artigo novo

Crie um arquivo em `src/content/publicacoes/`, por exemplo
`src/content/publicacoes/guarda-compartilhada.md`:

```markdown
---
title: "Guarda compartilhada: como funciona na prática"
area: familia-sucessoes
date: 2026-11-20
intro: Uma frase de abertura que também é usada como descrição nas buscas.
photo: ../../assets/img/familia.jpg
---

## Primeiro subtítulo

O texto do artigo em Markdown.
```

O nome do arquivo vira a URL (`/publicacoes/guarda-compartilhada`). O campo `area`
precisa corresponder ao nome de um arquivo em `src/content/areas/` — se não
corresponder, o build falha, em vez de gerar um link quebrado.

Para deixar um rascunho fora do site, acrescente `draft: true` ao frontmatter.

O tempo de leitura e a data formatada são calculados automaticamente, e a publicação
já aparece na home, na listagem, na página da área e no sitemap.

## Deploy na Cloudflare Pages

1. No painel da Cloudflare, vá em **Workers & Pages → Create → Pages → Connect to Git**
   e selecione este repositório.
2. Configuração de build:
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** defina a variável `NODE_VERSION` com `26.13.1`
3. Cada push na branch `main` publica automaticamente.

### Formulário de contato

O formulário é recebido por `functions/api/contato.ts`, que roda como Pages Function
e envia a mensagem por e-mail via [Resend](https://resend.com).

Defina em **Settings → Environment variables**:

| Variável | Valor |
| --- | --- |
| `RESEND_API_KEY` | chave da API do Resend |
| `MAIL_TO` | e-mail que recebe as mensagens |
| `MAIL_FROM` | remetente em domínio verificado no Resend |

Sem essas variáveis o site funciona e o visitante vê a página de confirmação, mas
**a mensagem não é enviada** — só registrada no log da função. Configure antes de
divulgar o site.

O formulário tem campo-armadilha contra robôs e revalidação no servidor. Se o volume
de spam crescer, o próximo passo é o [Turnstile](https://www.cloudflare.com/products/turnstile/)
da Cloudflare.

## Pendências antes de ir ao ar

- [ ] Trocar o domínio em `astro.config.mjs` (`SITE`) e em `public/robots.txt`
- [x] ~~Criar a imagem de compartilhamento em `public/og.jpg` (1200×630)~~
- [x] ~~Criar `public/apple-touch-icon.png` (180×180)~~
- [ ] Configurar as variáveis do Resend
- [ ] Cadastrar o site no Google Search Console e enviar o sitemap

## Decisões técnicas

- **Saída estática, não SPA.** O protótipo usava rotas em hash (`#area-imobiliario`),
  o que deixava o site inteiro em uma única URL para os buscadores. Agora cada página
  é uma URL real e indexável, o que é o ponto central para a busca local.
- **Animações com GSAP, ScrollTrigger e Lenis, como aprimoramento.** Ficam em
  `src/scripts/motion.ts`: abertura na primeira visita, cortina entre páginas (ligada
  ao ClientRouter), títulos palavra por palavra, revelação e parallax das fotos,
  rolagem suave, header que some ao rolar, rodapé revelado e cursores nos sócios e na
  lista de áreas. O conteúdo nunca depende de JavaScript para aparecer: sem o script,
  ou com "reduzir movimento" ativo, valem as scroll-driven animations do CSS em
  `motion.css`, e tudo fica visível.
- **CSS próprio, não Tailwind.** Os estilos vieram do layout original, que já era
  enxuto e baseado em tokens no `:root`.
- **Fontes self-hosted** pela API de Fontes do Astro, com preload e métricas de
  fallback, em vez do `<link>` do Google Fonts no caminho crítico.
- **Filtros como páginas, não como JavaScript.** O filtro de publicações por área e o
  campo Assunto pré-selecionado são rotas estáticas.

## Conformidade

O conteúdo segue o Provimento 205/2021 do Conselho Federal da OAB: os textos são
informativos e trazem o aviso de que não substituem a análise individual do caso.
Evite linguagem de captação de clientela ou promessa de resultado ao escrever
publicações novas.
