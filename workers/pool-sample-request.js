const allowedOrigins = new Set(['https://monohq.co', 'https://www.monohq.co']);
const allowedFileTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']);
const maxAttachmentBytes = 12 * 1024 * 1024;

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

function safeHeader(value) {
  return String(value).replace(/[\r\n]+/g, ' ').slice(0, 180);
}

function encodeMessage(message) {
  return btoa(unescape(encodeURIComponent(message))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function emailMessage({ from, to, subject, text, html, replyTo, attachments = [] }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${safeHeader(subject)}`,
    'MIME-Version: 1.0',
    ...(replyTo ? [`Reply-To: ${replyTo}`] : [])
  ];
  if (!attachments.length) {
    headers.push('Content-Type: text/html; charset="UTF-8"');
    return encodeMessage(`${headers.join('\r\n')}\r\n\r\n${html || text.replace(/\n/g, '<br>')}`);
  }
  const boundary = `mono-${crypto.randomUUID()}`;
  headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  const parts = [
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    html || text.replace(/\n/g, '<br>')
  ];
  for (const file of attachments) {
    const filename = file.filename.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 100) || 'project-file';
    const lines = file.data.match(/.{1,76}/g)?.join('\r\n') || '';
    parts.push(
      `--${boundary}`,
      `Content-Type: ${file.contentType}; name="${filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${filename}"`,
      '',
      lines
    );
  }
  parts.push(`--${boundary}--`, '');
  return encodeMessage(`${headers.join('\r\n')}\r\n\r\n${parts.join('\r\n')}`);
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

function attachmentBytes(data) {
  if (typeof data !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)) return -1;
  const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0;
  return Math.floor(data.length * 3 / 4) - padding;
}

function poolBriefHtml(project, attachments) {
  const rows = [
    ['Company', project.company], ['Phone', project.phone || '—'], ['Pool shape', project.shape],
    ['Approximate size', project.size], ['Hero site photo', `Photo ${Number(project.heroPhotoIndex) + 1}`],
    ['Position', project.position || '—'], ['Finish', project.finish || '—'],
    ['Coping / paving', project.coping || '—'], ['Fencing', project.fencing || '—'],
    ['Landscaping / features', Array.isArray(project.features) ? project.features.join(', ') : '—'],
    ['Additional notes', project.notes || '—'],
    ['Site photos', attachments.filter(file => file.category === 'site').map(file => file.filename).join(', ')],
    ['Plans / references', attachments.filter(file => file.category === 'reference').map(file => file.filename).join(', ')]
  ];
  return `<p><strong>New free pool concept request</strong></p><p>Name: ${escapeHtml(project.fullName)}<br>Email: <a href="mailto:${escapeHtml(project.email)}">${escapeHtml(project.email)}</a></p><table>${rows.map(([label, value]) => `<tr><th align="left" valign="top">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}</table><p>Uploaded files are attached to this email.</p>`;
}

function validateProject(payload) {
  const project = payload.project || {};
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];
  const sitePhotos = attachments.filter(file => file?.category === 'site');
  const references = attachments.filter(file => file?.category === 'reference');
  if (!String(project.company || '').trim() || !String(project.shape || '').trim() || !String(project.size || '').trim()) return { error: 'Please add your company, pool shape and approximate size.' };
  if (sitePhotos.length < 1 || sitePhotos.length > 10 || references.length < 1 || attachments.length > 20) return { error: 'Upload 1–10 site photos and at least one plan or reference image.' };
  const heroPhotoIndex = Number(project.heroPhotoIndex);
  if (!Number.isInteger(heroPhotoIndex) || heroPhotoIndex < 0 || heroPhotoIndex >= sitePhotos.length) return { error: 'Choose a main site photo for the concept.' };
  let totalBytes = 0;
  for (const file of attachments) {
    if (!file || !allowedFileTypes.has(file.contentType) || typeof file.filename !== 'string' || !file.filename.trim()) return { error: 'One of your files has an unsupported format. Use JPG, PNG, WebP, HEIC or PDF.' };
    const bytes = attachmentBytes(file.data);
    if (bytes < 1) return { error: 'One of your files could not be read. Please select it again.' };
    totalBytes += bytes;
    if (totalBytes > maxAttachmentBytes) return { error: 'Your files are larger than the 12 MB total limit. Remove a file or choose smaller images.' };
  }
  return { project, attachments, sitePhotos, heroPhotoIndex };
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
    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > 20 * 1024 * 1024) return json({ error: 'Your files are too large to submit. Please keep all files under 12 MB total.' }, 413, request);

    let payload;
    try { payload = await request.json(); } catch (_) { return json({ error: 'Please check the form and try again.' }, 400, request); }
    const firstName = String(payload.firstName || '').trim().slice(0, 80);
    const lastName = String(payload.lastName || '').trim().slice(0, 80);
    const email = String(payload.email || '').trim().toLowerCase().slice(0, 254);
    if (payload.website || !firstName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter your name and a valid email address.' }, 400, request);
    const projectResult = payload.project ? validateProject(payload) : null;
    if (projectResult?.error) return json({ error: projectResult.error }, 400, request);
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REFRESH_TOKEN || !env.GMAIL_SENDER || !env.NOTIFY_EMAIL) return json({ error: 'Requests are not available right now. Please email robin@monohq.co.' }, 503, request);

    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    const safeFirstName = escapeHtml(firstName);
    const accessToken = await gmailToken(env);
    const from = `Robin at MONO <${env.GMAIL_SENDER}>`;
    if (projectResult) {
      const { project, attachments, heroPhotoIndex } = projectResult;
      project.fullName = fullName;
      project.email = email;
      project.heroPhotoIndex = heroPhotoIndex;
      project.company = String(project.company).trim().slice(0, 160);
      project.phone = String(project.phone || '').trim().slice(0, 60);
      for (const key of ['shape', 'size', 'position', 'finish', 'coping', 'fencing', 'notes']) project[key] = String(project[key] || '').trim().slice(0, 1200);
      project.features = Array.isArray(project.features) ? project.features.slice(0, 20).map(item => String(item).slice(0, 80)) : [];
      const customer = {
        from, to: email, subject: 'We received your MONO pool project', replyTo: env.GMAIL_SENDER,
        text: `Hi ${firstName},\n\nYour project is in. We’ll email you when your first concept is ready.\n\nWe’ll review your photos and pool brief and get in touch if anything essential is missing.\n\nRobin\nMONO`,
        html: `<p>Hi ${safeFirstName},</p><p><strong>Your project is in.</strong></p><p>We’ll email you when your first concept is ready.</p><p>We’ll review your photos and pool brief and get in touch if anything essential is missing.</p><p>Robin<br>MONO</p>`
      };
      const internal = {
        from, to: env.NOTIFY_EMAIL, subject: `New free pool concept project — ${fullName} — ${project.company}`, replyTo: email,
        text: `New free pool concept project\n\nName: ${fullName}\nEmail: ${email}\nCompany: ${project.company}\nPool shape: ${project.shape}\nApproximate size: ${project.size}\nHero photo: ${heroPhotoIndex + 1}\nPosition: ${project.position || '—'}\nFinish: ${project.finish || '—'}\nCoping / paving: ${project.coping || '—'}\nFencing: ${project.fencing || '—'}\nLandscaping / features: ${project.features.join(', ') || '—'}\nAdditional notes: ${project.notes || '—'}\n\nUploaded files are attached.`,
        html: poolBriefHtml(project, attachments),
        attachments: attachments.map(file => ({ ...file, filename: file.filename.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 100) || 'project-file' }))
      };
      try { await Promise.all([sendGmail(accessToken, customer), sendGmail(accessToken, internal)]); }
      catch (_) { return json({ error: 'We could not send your project. Please try again or email robin@monohq.co.' }, 502, request); }
      return json({ ok: true }, 202, request);
    }

    // Keep the existing name-and-email sample request path working for older forms.
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
