/**
 * Recebe o formulário de contato.
 *
 * Roda como Cloudflare Pages Function: o arquivo em functions/api/contato.ts
 * atende POST em /api/contato, junto do site estático, sem servidor próprio.
 *
 * Variáveis de ambiente necessárias (painel da Cloudflare, em
 * Settings > Environment variables):
 *   RESEND_API_KEY  chave da API do Resend
 *   MAIL_TO         e-mail que recebe as mensagens
 *   MAIL_FROM       remetente em domínio verificado no Resend
 *
 * Sem RESEND_API_KEY a função não quebra o envio: registra no log e segue
 * para a página de confirmação, para o site poder ir ao ar antes do e-mail
 * estar configurado.
 */

interface Env {
  RESEND_API_KEY?: string;
  MAIL_TO?: string;
  MAIL_FROM?: string;
}

/** Limites de tamanho, alinhados aos maxlength do formulário. */
const LIMITES = {
  nome: 120,
  email: 180,
  telefone: 20,
  assunto: 80,
  mensagem: 2000,
} as const;

/** O runtime de Workers devolve File ou string; só interessa string. */
const texto = (v: File | string | null, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

function redirect(url: URL, path: string, status = 303): Response {
  return new Response(null, { status, headers: { Location: new URL(path, url).href } });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirect(url, '/contato?erro=formato');
  }

  // Campo-armadilha: preenchido significa robô. Responde como sucesso para
  // não entregar ao robô a informação de que foi barrado.
  if (texto(form.get('url'), 200) !== '') {
    return redirect(url, '/contato/enviado');
  }

  const nome = texto(form.get('nome'), LIMITES.nome);
  const email = texto(form.get('email'), LIMITES.email);
  const telefone = texto(form.get('telefone'), LIMITES.telefone);
  const assunto = texto(form.get('assunto'), LIMITES.assunto) || 'Não informado';
  const mensagem = texto(form.get('mensagem'), LIMITES.mensagem);
  const lgpd = texto(form.get('lgpd'), 10);

  // Revalidação no servidor: a validação do navegador pode ser contornada.
  if (!nome || !mensagem || lgpd !== 'sim') {
    return redirect(url, '/contato?erro=campos');
  }
  // É preciso ao menos uma forma de retorno.
  if (!email && !telefone) {
    return redirect(url, '/contato?erro=contato');
  }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return redirect(url, '/contato?erro=email');
  }

  const recebidoEm = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());

  const corpo = [
    `<p><strong>Assunto:</strong> ${escapeHtml(assunto)}</p>`,
    `<p><strong>Nome:</strong> ${escapeHtml(nome)}</p>`,
    email ? `<p><strong>E-mail:</strong> ${escapeHtml(email)}</p>` : '',
    telefone ? `<p><strong>Telefone:</strong> ${escapeHtml(telefone)}</p>` : '',
    `<p><strong>Mensagem:</strong></p>`,
    `<p>${escapeHtml(mensagem).replace(/\n/g, '<br>')}</p>`,
    `<hr><p style="color:#666;font-size:12px">Enviado pelo site em ${recebidoEm}.</p>`,
  ]
    .filter(Boolean)
    .join('\n');

  if (!env.RESEND_API_KEY || !env.MAIL_TO || !env.MAIL_FROM) {
    console.warn('[contato] variaveis de e-mail ausentes; mensagem nao enviada', {
      assunto,
      temEmail: Boolean(email),
      temTelefone: Boolean(telefone),
    });
    return redirect(url, '/contato/enviado');
  }

  try {
    const resposta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [env.MAIL_TO],
        reply_to: email || undefined,
        subject: `Site — ${assunto} — ${nome}`,
        html: corpo,
      }),
    });

    if (!resposta.ok) {
      console.error('[contato] Resend respondeu', resposta.status, await resposta.text());
      return redirect(url, '/contato?erro=envio');
    }
  } catch (e) {
    console.error('[contato] falha ao enviar', e);
    return redirect(url, '/contato?erro=envio');
  }

  return redirect(url, '/contato/enviado');
};

/** GET em /api/contato não tem uso: manda de volta ao formulário. */
export const onRequestGet: PagesFunction<Env> = ({ request }) =>
  redirect(new URL(request.url), '/contato', 302);
