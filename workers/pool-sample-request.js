const allowedOrigins = new Set(['https://monohq.co', 'https://www.monohq.co']);

function cors(request) {
  const origin = request.headers.get('Origin');
  return allowedOrigins.has(origin)
    ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
    : {};
}

function json(body, status, request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(request) }
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function encodeMessage(message) {
  return btoa(unescape(encodeURIComponent(message))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function emailMessage({ from, to, subject, text, html, replyTo }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    ...(replyTo ? [`Reply-To: ${replyTo}`] : [])
  ];
  return encodeMessage(`${headers.join('\r\n')}\r\n\r\n${html || text.replace(/\n/g, '<br>')}`);
}

async function gmailToken(env) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });
  if (!response.ok) throw new Error('Could not authorize Gmail delivery');
  return (await response.json()).access_token;
}

async function sendGmail(accessToken, message) {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: emailMessage(message) })
  });
  if (!response.ok) throw new Error('Gmail could not send the request email');
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { ...cors(request), 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });
    }
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true }, 200, request);
    if (request.method !== 'POST' || url.pathname !== '/sample-request') return json({ error: 'Not found' }, 404, request);
    if (!allowedOrigins.has(request.headers.get('Origin'))) return json({ error: 'Origin not allowed' }, 403, request);

    let payload;
    try { payload = await request.json(); } catch (_) { return json({ error: 'Please check the form and try again.' }, 400, request); }
    const firstName = String(payload.firstName || '').trim().slice(0, 80);
    const lastName = String(payload.lastName || '').trim().slice(0, 80);
    const email = String(payload.email || '').trim().toLowerCase().slice(0, 254);
    if (payload.website || !firstName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter your first name and a valid email address.' }, 400, request);
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REFRESH_TOKEN || !env.GMAIL_SENDER || !env.NOTIFY_EMAIL) return json({ error: 'Sample requests are not ready yet. Please email robin@monohq.co.' }, 503, request);

    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    const safeFirstName = escapeHtml(firstName);
    const accessToken = await gmailToken(env);
    const from = `Robin at MONO <${env.GMAIL_SENDER}>`;
    const customer = {
      from, to: email, subject: 'Your MONO pool image sample request', replyTo: env.GMAIL_SENDER,
      text: `Hi ${firstName},\n\nThanks for requesting your free pool image. Reply to this email with 3–6 clear backyard photos and a few lines about the pool you’re proposing.\n\nHelpful details: pool shape or size, where it sits in the yard, finishes or features that matter, and any plans, quotes or references you already have.\n\nWe’ll review it and get in touch if anything essential is missing.\n\nRobin\nMONO`,
      html: `<p>Hi ${safeFirstName},</p><p>Thanks for requesting your free pool image.</p><p>Reply to this email with <strong>3–6 clear backyard photos</strong> and a few lines about the pool you’re proposing.</p><p>Helpful details:</p><ul><li>pool shape or size</li><li>where it sits in the yard</li><li>finishes or features that matter</li><li>any plans, quotes or references you already have</li></ul><p>We’ll review it and get in touch if anything essential is missing.</p><p>Robin<br>MONO</p>`
    };
    const internal = {
      from, to: env.NOTIFY_EMAIL, subject: `New MONO sample request - ${fullName}`, replyTo: email,
      text: `New free pool image request\n\nName: ${fullName}\nEmail: ${email}\nSource: ${String(payload.placement || 'website').slice(0, 80)}\n\nThe customer has been sent the photo-and-brief request.`,
      html: `<p><strong>New free pool image request</strong></p><p>Name: ${escapeHtml(fullName)}<br>Email: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a><br>Source: ${escapeHtml(String(payload.placement || 'website').slice(0, 80))}</p><p>The customer has been sent the photo-and-brief request.</p>`
    };
    try { await Promise.all([sendGmail(accessToken, customer), sendGmail(accessToken, internal)]); }
    catch (_) { return json({ error: 'We could not send your request. Please try again or email robin@monohq.co.' }, 502, request); }
    return json({ ok: true }, 202, request);
  }
};
