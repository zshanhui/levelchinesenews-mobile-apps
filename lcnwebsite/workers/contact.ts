/**
 * POST application/x-www-form-urlencoded from the static site contact form.
 * Sends email via Resend, then redirects back to the site with ?success=1 or ?error=1.
 */

const MAX_MESSAGE = 12_000;

function badRequest(msg: string) {
  return new Response(msg, { status: 400, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

function seemsLikeBugReport(text: string) {
  const lower = text.toLowerCase();
  return lower.includes('bug') && lower.includes('report')
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

    let subject = 'LevelChinese News contact form'
    if (seemsLikeBugReport(message)) {
      subject = `LCN BUG REPORT`
      // handle bug report email forward
      console.log(`this might be a bug report: ${message}, create a cursor agent to investigate the issue...`)
      // maybe some other string checks for easy to catch security, prompt injection attacks here

      // if general spam filters are cleared, then
      // passes the bugfix agent cf worker to node service to launch investigation workflow

    }
    // we always send the notification email to `CONTACT_TO_EMAIL` whether
    // bug report or regular contact/feedback email
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
        subject: subject,
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
  // handles bugreport@levelchinese.app emails
  // async email(message, env, ctx): Promise<void> {
  //   const subject = message.headers.get('subject') || '';
  //   console.log(`From: ${message.from}, To: ${message.to}, Subject: ${subject}`);

  //   await message.forward(env.CONTACT_TO_EMAIL)
  // }
} satisfies ExportedHandler<Env>;
