# Como trabalhar neste repositório

## Fluxo

A branch `main` é a que vai para o ar: cada merge publica o site na Cloudflare
Pages. Por isso nada é commitado direto nela.

```
main ──┬─────────────────────────── merge ──▶
       └── feat/alguma-coisa ── PR ──┘
```

1. Crie uma branch a partir da `main`
2. Faça os commits
3. Abra um Pull Request
4. Depois do merge, apague a branch

## Nomes de branch

| Prefixo | Quando usar |
| --- | --- |
| `feat/` | funcionalidade ou página nova |
| `fix/` | correção de algo quebrado |
| `content/` | texto, publicações, dados do escritório |
| `chore/` | dependências, configuração, infraestrutura |
| `perf/` | desempenho |
| `a11y/` | acessibilidade |

Exemplo: `content/artigo-guarda-compartilhada`

## Mensagens de commit

Primeira linha no imperativo, até 72 caracteres, descrevendo o efeito e não os
arquivos tocados:

```
Corrige URL canonica e marcacao de pagina atual no build
```

O corpo explica **por quê**, não o quê — o diff já mostra o quê. Se resolve uma
issue, encerre com `Resolve #12`.

## Antes de abrir o PR

```bash
npm run check   # tipos do site e da function, 0 erros esperado
npm run build   # precisa concluir
npm run dev     # confira no navegador
```

## O que exige atenção redobrada

- **Mudar ou remover uma URL.** O site depende de busca local. URL que muda sem
  redirecionamento perde o posicionamento conquistado.
- **Adicionar JavaScript.** O site hoje envia 16 kB. Antes de incluir uma
  biblioteca, verifique se CSS resolve.
- **Texto das publicações.** O Provimento 205/2021 do CFOAB proíbe captação de
  clientela e promessa de resultado. Mantenha o tom informativo e o aviso ao fim.
- **Imagens.** Sempre importe de `src/assets/` para passarem pelo pipeline do
  Astro. Arquivo solto em `public/` não é otimizado.
