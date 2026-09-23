/* Only campaign-level information may cross to Stripe. Never recipient PII. */
(function (root) {
  function buildCheckoutUrl(base, context) {
    const target = new URL(base);
    if (target.protocol !== 'https:' || target.hostname !== 'buy.stripe.com' || target.username || target.password || !/^\/[A-Za-z0-9_]+$/.test(target.pathname)) throw new Error('Unapproved checkout URL');
    target.search = '';
    target.hash = '';
    const safe = {};
    const patterns = {
      utm_source: /^mono_outreach$/, utm_medium: /^email$/,
      utm_campaign: /^(2026q3_pool_99|2026q3_pool99_batch02)$/, utm_content: /^(control|challenger|challenge)$/,
      outreach_variant: /^(control|challenger|challenge)$/,
      outreach_batch_id: /^mo_2026w[0-9]{2}_[0-9]{2}$/
    };
    for (const [key, pattern] of Object.entries(patterns)) {
      if (typeof context[key] === 'string' && pattern.test(context[key])) safe[key] = context[key];
    }
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
      if (safe[key]) target.searchParams.set(key, safe[key]);
    }
    // This is a batch-level label, not proof of payment or a unique order ID.
    target.searchParams.set('client_reference_id', ['grannyflat', safe.outreach_batch_id || 'unattributed', safe.outreach_variant || safe.utm_content || 'unknown'].join('_'));
    return target.href;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildCheckoutUrl };
  else root.MONOCheckout = { buildCheckoutUrl };
})(typeof window !== 'undefined' ? window : globalThis);
