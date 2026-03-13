/**
 * Sends email and/or SMS to the challenged opponent after a Gaucho Duel is issued.
 *
 * Required env vars:
 *   RESEND_API_KEY          — from resend.com (free tier: 100 emails/day)
 *   TWILIO_ACCOUNT_SID      — from twilio.com
 *   TWILIO_AUTH_TOKEN       — from twilio.com
 *   TWILIO_FROM_NUMBER      — your Twilio phone number, e.g. +18055550100
 *   NEXT_PUBLIC_SITE_URL    — already set, e.g. https://gaucho-lax.vercel.app
 *
 * Neither service requires an npm package — both are called via fetch.
 */

import { NextResponse } from 'next/server';

interface NotifyBody {
  challengerName: string;
  opponentName: string;
  opponentEmail?: string | null;
  opponentPhone?: string | null;
  playerName: string;
  statType: string;
  line: number;
  challengerSide: 'over' | 'under';
  pledgeAmount: number;
}

function opponentSide(challengerSide: 'over' | 'under') {
  return challengerSide === 'over' ? 'UNDER' : 'OVER';
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

// ── Email via Resend REST API ─────────────────────────────────────────────────

async function sendEmail(body: NotifyBody, siteUrl: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !body.opponentEmail) return false;

  const opSide = opponentSide(body.challengerSide);
  const threshold = body.challengerSide === 'over'
    ? `< ${body.line}`
    : `> ${body.line}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020f1f;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020f1f;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#0c1e36;border:1px solid #1e3a5f;border-radius:16px;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#001f3f,#003660);padding:28px 28px 20px;text-align:center;">
          <p style="color:#FEBC11;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin:0 0 8px">Gaucho Duel · UCSB Lacrosse</p>
          <h1 style="color:#f8fafc;font-size:28px;font-weight:900;margin:0 0 6px;line-height:1.1">⚔️ You've Been<br>Challenged</h1>
          <p style="color:#94a3b8;font-size:14px;margin:0">${body.challengerName} just threw down the gauntlet.</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:24px 28px;">

          <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;line-height:1.6">
            <strong style="color:#f8fafc">${body.challengerName}</strong> has issued a Gaucho Duel and
            placed you on the <strong style="color:#FEBC11">${opSide}</strong>.
          </p>

          <!-- Prop box -->
          <table width="100%" style="background:#060f1c;border:1px solid #1e3a5f;border-radius:12px;margin-bottom:20px;">
            <tr><td style="padding:20px;text-align:center;">
              <p style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 6px">${body.playerName}</p>
              <p style="color:#FEBC11;font-size:42px;font-weight:900;margin:0 0 2px;line-height:1">${body.line}</p>
              <p style="color:#94a3b8;font-size:14px;margin:0">${body.statType}</p>
            </td></tr>
          </table>

          <!-- Sides -->
          <table width="100%" style="border-collapse:collapse;margin-bottom:20px;">
            <tr>
              <td width="50%" style="padding:10px 12px;background:${body.challengerSide === 'over' ? '#FEBC11' : '#1e3a5f'};border-radius:8px 0 0 8px;text-align:center;">
                <p style="margin:0;font-size:11px;font-weight:700;color:${body.challengerSide === 'over' ? '#003660' : '#64748b'};text-transform:uppercase;letter-spacing:.06em">OVER</p>
                <p style="margin:4px 0 0;font-size:13px;font-weight:700;color:${body.challengerSide === 'over' ? '#003660' : '#94a3b8'}">${body.challengerName}</p>
              </td>
              <td width="50%" style="padding:10px 12px;background:${opSide === 'UNDER' ? '#FEBC11' : '#1e3a5f'};border-radius:0 8px 8px 0;text-align:center;">
                <p style="margin:0;font-size:11px;font-weight:700;color:${opSide === 'UNDER' ? '#003660' : '#64748b'};text-transform:uppercase;letter-spacing:.06em">UNDER</p>
                <p style="margin:4px 0 0;font-size:13px;font-weight:700;color:${opSide === 'UNDER' ? '#003660' : '#94a3b8'}">${body.opponentName}</p>
              </td>
            </tr>
          </table>

          <p style="color:#94a3b8;font-size:13px;margin:0 0 20px;line-height:1.6">
            You're locked in on the <strong style="color:#FEBC11">${opSide}</strong>
            (${threshold} ${body.statType.toLowerCase()}).
            The loser donates <strong style="color:#f8fafc">$${body.pledgeAmount}</strong> directly to
            UCSB Men's Lacrosse.
          </p>

          <!-- CTA -->
          <table width="100%" style="margin-bottom:20px;">
            <tr><td align="center">
              <a href="${siteUrl}/duels"
                style="display:inline-block;background:#FEBC11;color:#003660;font-weight:800;font-size:15px;text-decoration:none;padding:13px 32px;border-radius:8px;letter-spacing:.02em">
                View the Prop Board →
              </a>
            </td></tr>
          </table>

          <p style="color:#475569;font-size:11px;margin:0;line-height:1.6;text-align:center">
            Gaucho Duel is a voluntary donation challenge. All payments go directly to
            UCSB Men's Lacrosse, a registered 501(c)(3). No money is exchanged between participants.
          </p>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Gaucho Duel <onboarding@resend.dev>',
      to: [body.opponentEmail],
      subject: `⚔️ ${body.challengerName} challenged you to a Gaucho Duel`,
      html,
    }),
  });

  if (!res.ok) console.error('[Resend]', await res.text());
  return res.ok;
}

// ── SMS via Twilio REST API ───────────────────────────────────────────────────

async function sendSms(body: NotifyBody, siteUrl: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from || !body.opponentPhone) return false;

  const opSide = opponentSide(body.challengerSide);
  const threshold = body.challengerSide === 'over'
    ? `<${body.line}`
    : `>${body.line}`;

  const message =
    `⚔️ GAUCHO DUEL\n` +
    `${body.challengerName} just challenged you!\n\n` +
    `Prop: ${body.playerName} — ${body.line} ${body.statType}\n` +
    `You're on the ${opSide} (${threshold} ${body.statType.toLowerCase()})\n` +
    `Pledge: $${body.pledgeAmount} to Gaucho Lax\n\n` +
    `Loser donates. No excuses.\n` +
    `${siteUrl}/duels`;

  const to = normalizePhone(body.opponentPhone);
  const creds = Buffer.from(`${sid}:${token}`).toString('base64');

  const params = new URLSearchParams({ To: to, From: from, Body: message });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );

  return res.ok;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body: NotifyBody = await req.json();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const [emailSent, smsSent] = await Promise.all([
    sendEmail(body, siteUrl).catch(() => false),
    sendSms(body, siteUrl).catch(() => false),
  ]);

  return NextResponse.json({ emailSent, smsSent });
}
