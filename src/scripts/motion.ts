/**
 * Animações do site: abertura, cortina entre páginas, títulos palavra por
 * palavra, revelação de fotos, parallax, rolagem suave e cursores.
 *
 * Tudo aqui é aprimoramento: o HTML já chega completo e visível. O script só
 * define estados iniciais quando roda; se ele falhar ou o visitante pedir
 * menos movimento, o site aparece estático, com as animações CSS de reserva
 * do motion.css.
 *
 * Funciona com o ClientRouter do Astro: o setup roda a cada `astro:page-load`
 * e é desfeito no `astro:before-swap`.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const CSS_SCROLL_TL = CSS.supports('animation-timeline: scroll()');
const EASE = 'expo.out';

/**
 * Sinaliza ao guarda do <head> que as animações assumiram o controle.
 * Só é marcado depois que a primeira página é configurada sem erro: antes
 * disso, qualquer falha precisa devolver o site ao estado estático.
 */
const marcarPronto = () => {
  (window as unknown as { __motionReady: boolean }).__motionReady = true;
};

/**
 * Desiste das animações e devolve o site ao estado estático.
 *
 * Remover `motion-js` reativa as regras de reserva do motion.css, mas os
 * elementos que o GSAP já tocou carregam estilo inline (`opacity: 0`), que
 * vence qualquer folha de estilo. Por isso eles são limpos aqui: sem essa
 * limpeza, uma falha no meio do setup deixaria trechos invisíveis para sempre.
 */
function desistir(motivo: unknown) {
  console.error('[motion] desativado apos falha:', motivo);
  (window as unknown as { __motionReady: boolean }).__motionReady = false;
  try {
    lenis?.destroy();
    lenis = null;
    ScrollTrigger.getAll().forEach((t) => t.kill());
    timelines.splice(0).forEach((t) => t.kill());
    gsap.killTweensOf('*');
    const tocados = all(
      '[data-up], [data-stagger-item], [data-title], [data-reveal], [data-line],' +
        ' [data-scrub], [data-parallax] img, .hero-media, .hero-in, .partner img,' +
        ' .place-map img, .phero-bg img, .prof-img img, .wi',
    );
    gsap.set(tocados, { clearProps: 'all' });
  } catch {
    /* na desistência, erro de limpeza não pode impedir o resto */
  }
  root.classList.remove('motion-js', 'motion-pending', 'has-loader');
  document.getElementById('loader')?.remove();
  document.getElementById('curtain')?.remove();
}

let lenis: Lenis | null = null;
let firstLoad = true;
let navigating = false;
let setupAt = 0;
let entryDelay = 0;
let lastY = 0;
const timelines: gsap.core.Timeline[] = [];

const all = <T extends Element = HTMLElement>(sel: string, scope: ParentNode = document) =>
  Array.from(scope.querySelectorAll<T>(sel));

/* ------------------------------------------------------------------ */
/* Inicialização                                                       */
/* ------------------------------------------------------------------ */

if (REDUCE) {
  root.classList.remove('motion-js', 'motion-pending', 'has-loader');
} else {
  try {
    boot();
  } catch (e) {
    desistir(e);
  }
}

function boot() {
  lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    // O menu mobile é um popover com rolagem própria.
    prevent: (node) => !!node.closest?.('[data-lenis-prevent], [popover]'),
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', footerReveal);
  window.addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  setupCursors();

  // Cortina: cobre a tela enquanto a próxima página carrega.
  document.addEventListener('astro:before-preparation', (e) => {
    const ev = e as TransitionBeforePreparationEvent;
    const load = ev.loader;
    ev.loader = async () => {
      await Promise.all([cover(), load()]);
    };
  });
  document.addEventListener('astro:before-swap', teardown);
  document.addEventListener('astro:after-swap', () => {
    // O <html> da página nova chega sem as classes desta sessão.
    root.classList.add('motion-js');
    lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
  });
  document.addEventListener('astro:page-load', onPageLoad);
}

function onPageLoad() {
  // O guarda do <head> já revelou a página porque o script demorou demais.
  // Voltar a escondê-la agora faria o conteúdo piscar e sumir.
  if ((window as unknown as { __motionGaveUp?: boolean }).__motionGaveUp) return;

  try {
    configurarPagina();
  } catch (e) {
    desistir(e);
  }
}

function configurarPagina() {
  root.classList.add('motion-js');
  lenis?.resize();
  lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
  lenis?.start();

  const isNav = !firstLoad;
  const withLoader = firstLoad && root.classList.contains('has-loader');
  entryDelay = isNav ? 0.55 : withLoader ? 1.9 : 0.15;
  setupAt = performance.now();

  setup();
  root.classList.remove('motion-pending');
  footerReveal();
  document.querySelector('.hdr')?.classList.remove('is-hidden');
  lastY = window.scrollY;

  if (firstLoad) {
    firstLoad = false;
    if (withLoader) runLoader();
    else intro(true);
  } else {
    uncover();
    intro(false);
  }

  // A página foi configurada por inteiro: só agora o guarda do <head> pode
  // confiar que as animações assumiram.
  marcarPronto();

  requestAnimationFrame(() => ScrollTrigger.refresh());
}

function teardown() {
  ScrollTrigger.getAll().forEach((t) => t.kill());
  timelines.splice(0).forEach((t) => t.kill());
  hideCursor();
  hideFloat();
}

/** Se a aba estiver em segundo plano, o requestAnimationFrame para; isso
 *  garante que nenhuma entrada fique escondida esperando um quadro. */
function settleLater(tl: gsap.core.Timeline, ms: number) {
  timelines.push(tl);
  window.setTimeout(() => {
    if (tl.progress() < 1) tl.progress(1);
  }, ms);
}

/* ------------------------------------------------------------------ */
/* Texto dividido em palavras                                          */
/* ------------------------------------------------------------------ */

function splitWords(el: HTMLElement, mask = true): HTMLElement[] {
  if (el.dataset.split === 'done') return all('.wi', el);
  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        (n.textContent ?? '').split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
            return;
          }
          const outer = document.createElement('span');
          outer.className = mask ? 'w' : 'w w-open';
          const inner = document.createElement('span');
          inner.className = 'wi';
          inner.textContent = part;
          outer.appendChild(inner);
          frag.appendChild(outer);
        });
        n.parentNode?.replaceChild(frag, n);
      } else if (n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName !== 'BR') {
        walk(n);
      }
    });
  };
  walk(el);
  el.dataset.split = 'done';
  return all('.wi', el);
}

/** Atraso de entrada: o que já está na tela espera a cortina ou a abertura. */
const delayNow = () => (performance.now() - setupAt < 400 ? entryDelay : 0);

/* ------------------------------------------------------------------ */
/* Animações de rolagem                                                */
/* ------------------------------------------------------------------ */

function setup() {
  // Títulos: cada palavra sobe de dentro de uma máscara.
  all('[data-title]').forEach((el) => {
    const words = splitWords(el);
    gsap.set(words, { yPercent: 115 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () =>
        gsap.to(words, { yPercent: 0, duration: 1.25, ease: EASE, stagger: 0.045, delay: delayNow() }),
    });
  });

  // Blocos de texto e itens de grade: sobem em sequência, por grupo.
  const rise = (sel: string, y: number, stagger: number) => {
    const els = all(sel);
    if (!els.length) return;
    gsap.set(els, { y, opacity: 0 });
    ScrollTrigger.batch(els, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { y: 0, opacity: 1, duration: 1.2, ease: EASE, stagger, delay: delayNow(), overwrite: true }),
    });
  };
  rise('[data-up]', 36, 0.08);
  rise('[data-stagger-item]', 56, 0.09);

  // Fotos: cortina de baixo para cima e a imagem assentando.
  all('[data-reveal]').forEach((el) => {
    const img = el.querySelector('img');
    const base = el.hasAttribute('data-parallax') ? 1.12 : 1;
    gsap.set(el, { clipPath: 'inset(100% 0% 0% 0%)' });
    if (img) gsap.set(img, { scale: base + 0.28 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        const d = delayNow();
        gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', delay: d });
        if (img) gsap.to(img, { scale: base, duration: 2, ease: EASE, delay: d });
      },
    });
  });

  // Parallax dentro da moldura.
  all('[data-parallax]').forEach((el) => {
    const img = el.querySelector('img');
    if (!img) return;
    if (!el.hasAttribute('data-reveal')) gsap.set(img, { scale: 1.12 });
    gsap.fromTo(
      img,
      { yPercent: -5 },
      { yPercent: 5, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });

  // Retratos dos sócios.
  all('.partner img').forEach((img) => {
    gsap.set(img, { scale: 1.1 });
    gsap.fromTo(
      img,
      { yPercent: -4 },
      { yPercent: 4, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });

  // Linha de destaque.
  all('[data-line]').forEach((el) => {
    gsap.set(el, { scaleX: 0, transformOrigin: 'left' });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 95%',
      once: true,
      onEnter: () => gsap.to(el, { scaleX: 1, duration: 1.2, ease: 'expo.inOut', delay: delayNow() + 0.3 }),
    });
  });

  // Manifesto: as palavras acendem conforme a leitura.
  all('[data-scrub]').forEach((el) => {
    const words = splitWords(el, false);
    gsap.fromTo(
      words,
      { opacity: 0.16 },
      { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: true } },
    );
  });

  // Mapa: aproxima devagar até o pino.
  all('.place-map img').forEach((img) => {
    gsap.set(img, { transformOrigin: '64% 40%' });
    gsap.fromTo(
      img,
      { scale: 1.14 },
      { scale: 1, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom 40%', scrub: true } },
    );
  });

  // Fundo dos topos internos e do perfil: desce mais devagar que a página.
  all('.phero-bg img, .prof-img img').forEach((img) => {
    const sec = img.closest('section');
    if (!sec) return;
    gsap.to(img, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom top', scrub: true } });
  });

  // Topo da home: foto e texto se afastam ao rolar.
  const hero = document.querySelector('.hero');
  if (hero) {
    gsap.to('.hero-media', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-in', { yPercent: -22, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  bindHoverTargets();
}

/* ------------------------------------------------------------------ */
/* Entrada de cada página                                              */
/* ------------------------------------------------------------------ */

function intro(first: boolean) {
  const tl = gsap.timeline({ delay: first ? 0 : 0.45 });
  const title = document.querySelector<HTMLElement>('.hero-title');

  if (title) {
    const words = splitWords(title);
    tl.fromTo('.hero-media img', { scale: 1.18 }, { scale: 1, duration: 2.4, ease: EASE }, 0)
      .from(words, { yPercent: 115, duration: 1.3, ease: EASE, stagger: 0.07 }, 0.15)
      .from('.hero-sub, .hero-actions, .hero-foot', { y: 24, opacity: 0, duration: 1.1, ease: EASE, stagger: 0.12 }, 0.65);
  }

  const bg = all('.phero-bg img, .prof-img img');
  if (bg.length) tl.fromTo(bg, { scale: 1.14 }, { scale: 1, duration: 2.2, ease: EASE }, 0);

  if (first) tl.from('.hdr-in > *', { y: -14, opacity: 0, duration: 0.9, ease: EASE, stagger: 0.06 }, 0.4);

  settleLater(tl, first ? 5200 : 3500);
}

function runLoader() {
  const loader = document.getElementById('loader');
  const name = loader?.querySelector<HTMLElement>('.ld-name');
  if (!loader || !name) {
    root.classList.remove('has-loader');
    intro(true);
    return;
  }

  const finish = () => {
    root.classList.remove('has-loader');
    try {
      sessionStorage.setItem('na-seen', '1');
    } catch {
      /* navegação privada: a abertura só repete na próxima visita */
    }
  };

  const tl = gsap
    .timeline({ onComplete: finish })
    .from(splitWords(name), { yPercent: 115, duration: 1, ease: EASE, stagger: 0.08 })
    .from('.ld-sub', { opacity: 0, y: 10, duration: 0.7, ease: EASE }, '-=.6')
    .to('.ld-bar i', { scaleX: 1, duration: 0.9, ease: 'expo.inOut' }, '-=.5')
    .to(loader, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '+=.1')
    .add(() => intro(true), '<');

  timelines.push(tl);
  window.setTimeout(() => {
    if (tl.progress() < 1) tl.progress(1);
    // A abertura dispara a entrada do topo; conclui também.
    timelines.forEach((t) => t.progress() < 1 && t.progress(1));
    finish();
  }, 5000);
}

/* ------------------------------------------------------------------ */
/* Cortina entre páginas                                               */
/* ------------------------------------------------------------------ */

function cover(): Promise<void> {
  const curtain = document.getElementById('curtain');
  navigating = true;
  closeMenu();
  lenis?.stop();
  if (!curtain) return Promise.resolve();

  const label = curtain.querySelector('span');
  return new Promise((resolve) => {
    const tl = gsap
      .timeline({ onComplete: () => resolve() })
      .set(curtain, { y: 0, yPercent: 100, visibility: 'visible' })
      .set(label, { opacity: 0, y: 20 })
      .to(curtain, { yPercent: 0, duration: 0.7, ease: 'expo.inOut' })
      .to(label, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=.25');
    window.setTimeout(() => {
      if (tl.progress() < 1) tl.progress(1);
      resolve();
    }, 1400);
  });
}

function uncover() {
  const curtain = document.getElementById('curtain');
  if (!curtain || !navigating) return;
  navigating = false;
  const label = curtain.querySelector('span');

  const tl = gsap
    .timeline()
    .to(label, { opacity: 0, y: -16, duration: 0.3, ease: 'power2.in' }, 0.1)
    .to(curtain, { yPercent: -100, duration: 0.85, ease: 'expo.inOut' }, 0.3)
    .set(curtain, { yPercent: 100, visibility: 'hidden' });
  window.setTimeout(() => {
    if (tl.progress() < 1) tl.progress(1);
  }, 2400);
}

function closeMenu() {
  const menu = document.getElementById('menu') as (HTMLElement & { hidePopover?: () => void }) | null;
  try {
    if (menu?.matches(':popover-open')) menu.hidePopover?.();
  } catch {
    /* navegador sem popover: o menu já não está aberto */
  }
}

/* ------------------------------------------------------------------ */
/* Header e rodapé                                                     */
/* ------------------------------------------------------------------ */

function onScroll() {
  const hdr = document.querySelector('.hdr');
  if (!hdr) return;
  const y = window.scrollY;
  if (!CSS_SCROLL_TL && !hdr.hasAttribute('data-solid')) hdr.classList.toggle('is-solid', y > 30);
  if (y > lastY + 4 && y > 320) hdr.classList.add('is-hidden');
  else if (y < lastY - 4 || y < 320) hdr.classList.remove('is-hidden');
  lastY = y;
}

/** O rodapé fica parado atrás da página e aparece quando ela termina. */
function footerReveal() {
  const ftr = document.querySelector<HTMLElement>('.ftr');
  const main = document.querySelector<HTMLElement>('main');
  if (!ftr || !main) return;
  root.classList.remove('reveal-footer');
  main.style.marginBottom = '';
  const h = ftr.offsetHeight;
  const ok = window.innerWidth >= 900 && h < window.innerHeight * 0.9;
  root.classList.toggle('reveal-footer', ok);
  main.style.marginBottom = ok ? `${h}px` : '';
}

/* ------------------------------------------------------------------ */
/* Cursores: "Ver perfil" e foto flutuante na lista de áreas           */
/* ------------------------------------------------------------------ */

let cursorX: ((v: number) => void) | null = null;
let cursorY: ((v: number) => void) | null = null;
let floatX: ((v: number) => void) | null = null;
let floatY: ((v: number) => void) | null = null;

function setupCursors() {
  if (!FINE) return;
  window.addEventListener(
    'mousemove',
    (e) => {
      const cursor = document.getElementById('cursor');
      const float = document.getElementById('float-img');
      if (cursor && !cursorX) {
        cursorX = gsap.quickTo(cursor, 'x', { duration: 0.5, ease: 'power3' });
        cursorY = gsap.quickTo(cursor, 'y', { duration: 0.5, ease: 'power3' });
      }
      if (float && !floatX) {
        gsap.set(float, { xPercent: -50, yPercent: -50 });
        floatX = gsap.quickTo(float, 'x', { duration: 0.7, ease: 'power3' });
        floatY = gsap.quickTo(float, 'y', { duration: 0.7, ease: 'power3' });
      }
      cursorX?.(e.clientX);
      cursorY?.(e.clientY);
      floatX?.(e.clientX + 40);
      floatY?.(e.clientY);
    },
    { passive: true },
  );
}

function hideCursor() {
  const cursor = document.getElementById('cursor');
  if (cursor) gsap.to(cursor, { scale: 0, opacity: 0, duration: 0.3, ease: EASE });
}
function hideFloat() {
  const float = document.getElementById('float-img');
  if (float) gsap.to(float, { autoAlpha: 0, scale: 0.85, rotation: 0, duration: 0.3, ease: EASE });
}

function bindHoverTargets() {
  if (!FINE) return;
  const cursor = document.getElementById('cursor');
  const float = document.getElementById('float-img');
  const floatImg = float?.querySelector('img');

  if (cursor) {
    gsap.set(cursor, { scale: 0, opacity: 0 });
    all('.partner, .pp-img').forEach((el) => {
      el.addEventListener('mouseenter', () => gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.5, ease: EASE }));
      el.addEventListener('mouseleave', hideCursor);
    });
  }

  if (float && floatImg) {
    gsap.set(float, { autoAlpha: 0, scale: 0.85 });
    all('.arow').forEach((row) => {
      const thumb = row.querySelector<HTMLImageElement>('.thumb');
      row.addEventListener('mouseenter', () => {
        const src = row.dataset.float || thumb?.currentSrc || thumb?.src;
        if (src) floatImg.src = src;
        float.classList.toggle('penal', row.classList.contains('penal'));
        gsap.to(float, { autoAlpha: 1, scale: 1, rotation: -2, duration: 0.6, ease: EASE });
      });
      row.addEventListener('mouseleave', hideFloat);
    });
  }
}
