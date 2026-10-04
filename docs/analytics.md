# MONO website measurement

The shared `assets/analytics.js` uses the existing GA4 tag **G-NHGGBL110F** (MONO HQ, property 526213052, stream 13674827784). There is no second property, tag manager container, build step or new credential.

## Coverage

Tracked public content routes:

- `/`, `/deep-tech/`, `/earth-ai/`, `/motion-graphics/`, `/rollout/`
- `/visualise/`, `/visualise/uk/`, `/visualise/us/`
- `/visualise/pools/`, `/visualise/pools/intake.html`, `/visualise/pools/privacy.html`, `/visualise/pools/terms.html`
- `/visualise/pools-wip/`, `/wip-page/`

`/sennheiser-case-study.html` immediately redirects to `/#work`; measure the destination only. `/visualise/internal-analytics.html` is an opt-out utility and deliberately unmeasured. Historical GA paths `/privacy-policy` and `/terms-of-trade` have no corresponding served files in this repository; this change does not create routes for them.

Each content document loads the shared script once in its head. It only activates on HTTPS `monohq.co`/`www.monohq.co` for known routes; local and preview hosts never send analytics. `/index.html` aliases normalize to directory paths. New content routes must be added to the known-route set as well as including the shared script.

The homepage and Motion Graphics replace their complete HTML document at runtime. The shared boot guard lives on `window`, delegated listeners live on `document`, and the same Google script node is retained after replacement. Old per-page Google initialization has been removed, including the one in Motion Graphics’ encoded template. One config command requests the initial pageview; there is no second custom `page_view` event and no custom history/anchor pageview listener.

The retired dummy `/water-water/` route and all five files under its directory are removed from publication; source remains recoverable through Git history only. There are no links to it elsewhere in the site or sitemap.

## Funnel events

| Event | Meaning |
| --- | --- |
| `contact_intent` | Click to a contact/quote section; not a lead |
| `contact_section_view` | Contact section enters the viewport, once per section/document |
| `email_click` | A mailto link is activated; no claim that an email was sent |
| `enquiry_start` | First input interaction with a supported enquiry form/wizard |
| `form_step_view` | Pools wizard displays a numbered step, including returns to a step |
| `form_submit_attempt` | A valid submission begins; not a lead |
| `form_submit_error` | Submission could not be acknowledged; generic error category only |
| `generate_lead` | Backend-accepted enquiry, once per successful form/document |

`generate_lead` has `method=form` and one of `form_id=pool-project-intake`, `pool-sample-request`, `motion-graphics-enquiry`. Pools requires an HTTP success and the worker’s explicit `{ok:true}` acknowledgement. Motion Graphics uses Formspree’s documented HTTP-success contract. No submission reference, form value, uploaded filename, email address or brief is included in analytics.

The existing `pool_*`, `rollout_*`, `outreach_landing`, `select_content` and `view_more_work` events remain available through the shared field allowlist. Dynamic media filenames were intentionally removed from diagnostics. The deprecated homepage interpretation of `generate_lead=mailto click` and Motion Graphics’ `manual_event_SUBMIT_LEAD_FORM` end at deployment; annotate that date when comparing reports. GA4 key-event/custom-dimension configuration is not changed by this code.

## Deep-tech section reach and visible dwell

Only `/deep-tech/` (including its `/index.html` alias) adds these two custom events:

| Event | Parameters | Meaning |
| --- | --- | --- |
| `deeptech_section_reached` | `section_id` | A named section overlaps the viewport by at least 1 CSS pixel in both axes while the document is visible, once per section/document |
| `deeptech_dwell` | `visible_time_ms`, `dwell_reason` | An additive, non-overlapping integer-millisecond interval of visible-page time |

Eight stable section IDs are instrumented:

- `deep-tech-hero`: From lab to market
- `deep-tech-who`: WHO / company foundation (rendered by the offer module)
- `deep-tech-how`: HOW / technical foundation (rendered by the offer module)
- `deep-tech-present`: PRESENT / decks, pages and films
- `deep-tech-support`: SUPPORT / presentation support
- `deep-tech-credentials`: MONO experience and client logos
- `deep-tech-keep-building`: reusable source story and ongoing updates
- `deep-tech-contact`: closing conversation/email invitation

Scroll/resize checks are animation-frame throttled; DOM updates and visible-page resumption also check current geometry. This deliberately uses pixels rather than a percentage of a whole section, so long WHO/HOW sections can be reached on mobile. Wrappers, individual offer cards, the navigation, dialogs and footer are not separate sections. A fast jump that never displays a section does not count it. Repeated scrolling, DOM replacement and back/forward-cache restoration do not create a second reach in the same document; a real reload/new document resets the count.

The existing `contact_section_view` with `section_id=deep-tech-contact` remains intact for the sitewide contact funnel. It is a separate event from the closing section's `deeptech_section_reached`; filter the desired event rather than adding both to a reach total. Neither is a lead or proof that the content was read. These events do not track navigation clicks, offer selection or video playback.

Visible dwell starts when the tracker initializes in a visible document. It flushes every 15 seconds (`dwell_reason=interval`) and flushes the outstanding partial interval on `visibilitychange` to hidden (`hidden`) or `pagehide` (`pagehide`). A monotonic clock measures actual elapsed time, rather than assuming the timer fired punctually. Hidden time and time away in the back/forward cache are excluded; returning resumes the same measurement without emitting a new pageview. Repeated lifecycle events do not resend prior intervals. Opt-out discards any unsent time and stops the timer immediately when detected.

`visible_time_ms` values are **deltas**, not running totals: sum them for measured visible time and divide by 1,000 for seconds. Do not average the lengths of the 15-second/partial flush events to calculate average visit duration. In GA reporting, select `event_name=deeptech_dwell`; after publication, register `visible_time_ms` as a custom metric and `section_id`/`dwell_reason` as event-scoped dimensions if needed. No GA Admin settings or definitions are changed by this patch.

This code never emits `user_engagement` or supplies Google's reserved `engagement_time_msec`. GA4 continues calculating its own engagement metrics independently. Do not add the custom visible-time total to GA's built-in engagement time.

Limits: visible time includes quiet reading, an open detail dialog and unattended time in a visible tab; there is deliberately no mouse/keyboard idle cutoff. It measures browser-reported visibility, not actual attention or focus. Section reach requires no minimum reading duration and does not account for visual occlusion by dialogs/other windows. Collection is best effort: blocking/consent, an unloaded Google tag, abrupt closure, device sleep, delayed lifecycle callbacks or lost final requests can affect results. The 15-second flush reduces reliance on an exit event but cannot guarantee delivery. No direct analytics network endpoint, visitor identifier, form value or text content is added.

## Privacy, attribution and opt-out

- The existing `mono_analytics_opt_out=1` browser choice applies sitewide, including the homepage and Motion Graphics. Dispatch checks it again; privacy-page activation and cross-tab storage changes also disable the loaded tag immediately. Re-enabling through the internal utility takes effect on reload
- No existing consent grant/denial is overwritten, and no new consent banner or grant is introduced. This preserves the existing opt-out behavior; it is not a compliance assessment
- Unknown query values and unrecognized hashes are removed with `replaceState` before Google loads. Recognized navigation anchors and history state survive. The current site has no query-driven router. Future query-driven functionality must be considered before adding it
- Existing strict outreach contracts are preserved: trade cohorts require their entire matching campaign/cohort/content set; homepage campaign and persona/industry/quarter/content agree; Pools uses its established allowlist
- Bounded, single-valued opaque `gclid`, `gbraid` and `wbraid` tokens survive in the sanitized landing URL for Google Ads attribution, never as custom dimensions. Arbitrary UTMs, site-search terms, names, email addresses, referrer paths/queries and unknown parameters do not
- Motion Graphics’ existing form-provider attribution is captured separately before URL filtering. It goes only with the existing authorised enquiry submission, never into GA events
- The custom event API uses a fixed event-name and typed field allowlist. Google advertising signals/personalisation are disabled by the shared config

## Tests and deployment verification

Run `npm test` for dependency-free unit, syntax, route-inventory and actual-handler mocked submission tests. These never submit a real lead or email.

`tests/analytics-browser.mjs` is an additional intercepted Playwright harness. It requires Playwright and Chromium and blocks external collection/submission endpoints. Do not run it against a real form handler. Local previews intentionally do not initialize GA; the harness supplies production-origin documents from local files.

Before a production rollout, review the change and the complete tests. After an authorised deployment:

1. Verify the deployed commit and the shared script response on all content routes
2. Use a non-opted-out browser and GA DebugView/Realtime to verify one pageview on load, contact/scroll/email events, all eight deep-tech section IDs, additive visible-time deltas and known campaign attribution
3. Inspect actual collection requests for no private values, including generated email links; test opted-out state again
4. Inspect stream Enhanced Measurement settings. History pageviews and automatic forms/outbound-link events run independently of this custom event API. Do not interpret Google's automatic `form_submit` as a completed enquiry. Consider turning off automatic history/form/outbound measurement where the explicit events cover the intended measurement, after reviewing existing reporting needs
5. Mark only the intended successful `generate_lead` as a lead/key event, and register desired reporting dimensions such as `form_id`/`section_id` if required. Do not designate `contact_intent` or `email_click` as submitted leads

Check hiding/resuming the deep-tech tab and back/forward navigation without duplicate intervals or hidden elapsed time. Check a real mobile viewport for WHO/HOW reach.

Google's live collection behavior, Enhanced Measurement settings and key-event designations must be verified separately; a mocked browser or command-queue test cannot prove reception in GA4. Avoid sending production test enquiries merely to test measurement.

References: [Google pageview behavior](https://developers.google.com/analytics/devguides/collection/ga4/views), [Enhanced Measurement](https://support.google.com/analytics/answer/9216061), [Formspree HTTP-success example](https://formspree.io/blog/formspree-ajax/).

Lifecycle references: [Page visibility](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event), [bfcache-compatible pagehide](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event), [GA4 user engagement](https://support.google.com/analytics/answer/11109416).
