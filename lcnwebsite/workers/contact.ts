/**
 * POST application/x-www-form-urlencoded from the static site contact form.
 * Sends email via Resend, then redirects back to the site with ?success=1 or ?error=1.
 */
export interface Env {
  RESEND_API_KEY: string;
  /** Where contact mail is delivered (e.g. your inbox). */
  CONTACT_TO_EMAIL: string;
  /** Must be a verified sender in Resend (domain or onboarding address). */
  MAIL_FROM: string;
  /** Full URL, e.g. https://levelchinese.app/contact?success=1 */
  CONTACT_SUCCESS_REDIRECT: string;
  /** Full URL on send failure, e.g. https://levelchinese.app/contact?error=1 */
  CONTACT_ERROR_REDIRECT: string;
}

const MAX_MESSAGE = 12_000;

function badRequest(msg: string) {
  return new Response(msg, { status: 400, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const ct = request.headers.get('content-type') || '';
    if (!ct.includes('application/x-www-form-urlencoded')) {
      return badRequest('Expected application/x-www-form-urlencoded');
    }

    const body = await request.text();
    const params = new URLSearchParams(body);
    const honeypot = (params.get('website') || '').trim();
    if (honeypot.length > 0) {
      return Response.redirect(env.CONTACT_SUCCESS_REDIRECT, 302);
    }

    const email = (params.get('email') || '').trim();
    const message = (params.get('message') || '').trim();

    if (!email || !message) {
      return Response.redirect(env.CONTACT_ERROR_REDIRECT, 302);
    }

    if (message.length > MAX_MESSAGE) {
      return Response.redirect(env.CONTACT_ERROR_REDIRECT, 302);
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return Response.redirect(env.CONTACT_ERROR_REDIRECT, 302);
    }

    if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.MAIL_FROM) {
      return Response.redirect(env.CONTACT_ERROR_REDIRECT, 302);
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [env.CONTACT_TO_EMAIL],
        reply_to: email,
        subject: 'LevelChinese News contact form',
        text: `From: ${email}\n\n${message}`,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('Resend error', res.status, errText);
      return Response.redirect(env.CONTACT_ERROR_REDIRECT, 302);
    }

    return Response.redirect(env.CONTACT_SUCCESS_REDIRECT, 302);
  },
};
