# Selected work launch and GA4 measurement

Prepared destination: https://monohq.co/selected-work/ (the slashless path redirects normally on GitHub Pages).
Source: `selected-work/`. Deployment adds this route to the existing production repository and preserves MONO's other pages and DNS. The separate Sites review stays owner-private.

**Status: public-media publication approved by Robin on 14 October 2026; final monochrome refinement and launch verification underway.** The earlier client-media upload approval block was resolved by Robin’s explicit approval for the selected films and posters in the public site and GitHub repository.

## Media

The selected 13 social/motion cuts and two case studies from Robin's Frame.io collections are included. H.264/AAC web copies total 56.5 MB. Lazy JPEG posters total about 617 KB. Video sources are assigned only after clicking, with fast-start MP4 metadata, native ratios and a single shared player. Close/Escape unloads the selected film. Case studies remain below the three-column social masonry gallery, and the email is robin@monohq.co.

Updated covers use real frames for KFC, Phone’s Eye View and both case studies. Sennheiser is limited to the portrait campaign and 15-second Sound cut; both six-second cuts and the widescreen duplicate are removed.

## Existing measurement

Reuses MONO HQ's existing GA4 `G-NHGGBL110F`, property `526213052`, stream `13674827784`. Windsor.ai read access confirms that stream belongs to MONO HQ and already receives events. No new property, credential, account access or consent grant is created. Existing opt-out, query sanitization and typed event-field allowlists apply. Local previews send no data to Google.

One configured GA4 pageview per document; no second custom page_view. Portfolio events:

- `portfolio_page_loaded`, `portfolio_section_view`, `portfolio_work_view`
- `portfolio_scroll_depth`: 25, 50, 75, 90 and 100 percent, once per threshold/document
- `portfolio_dwell`: additive visible-page milliseconds, flushed every 15 seconds and on hide/exit
- `portfolio_cta_click`: social/case navigation, back to top, MONO home and email intent
- `portfolio_video_request`, `portfolio_video_open`, `portfolio_video_start` with measured `startup_ms`
- `portfolio_video_pause`, `portfolio_video_resume`, `portfolio_video_seek`
- `portfolio_video_progress`: 10, 25, 50, 75, 90 percent based on played ranges, plus 100 after full playback; seeking ahead does not fabricate watching
- `portfolio_video_complete`, `portfolio_video_summary`, `portfolio_video_close` with watched seconds and close reason
- `portfolio_video_buffer`, `portfolio_video_error`, `portfolio_video_play_blocked`
- `portfolio_video_fullscreen`, `portfolio_video_rate`, `portfolio_video_volume`

Each film has a stable `film_id`. No arbitrary URLs, names, email addresses, footage filenames or form values are sent. Completion means the player reached its end; use played-range seconds/progress to distinguish a fully watched film from a seek to the end. Email clicks mean intent, not a sent email or lead.

## Outreach attribution

This route accepts single-valued, bounded campaign parameters for the current campaign:

- `utm_source`: `superhaus`, `supersolid`, or `mono_outreach`
- `utm_medium`: `email`
- `utm_campaign`: `social_editor_202610`
- optional `utm_content`: `portfolio`, `reply`, `initial`, or `followup_1` through `followup_4`

Source/medium/campaign are supplied to Google's standard campaign configuration and every custom event. Unknown/duplicate cohorts and other query text are removed before Google loads. Existing campaigns on other MONO routes retain their prior contracts.

Prepared links (not live until approved publication):

- https://monohq.co/selected-work/?utm_source=superhaus&utm_medium=email&utm_campaign=social_editor_202610&utm_content=reply
- https://monohq.co/selected-work/?utm_source=supersolid&utm_medium=email&utm_campaign=social_editor_202610&utm_content=reply

## Verification and reporting

71 dependency-free tests pass: existing site regression tests, exact company attribution, duplicate/unknown attribution rejection, opt-out, single loader, correct startup/buffer accounting, played-range progress and cleanup that does not fabricate pause events. Local native-browser verification captures page/section/work exposure, video request/open/start/progress/completion/summary/close and scroll thresholds through a local-only DOM log. No Google loader is loaded in that preview.

After approved deployment, verify actual `/selected-work/` HTTP responses, video playback and GA collection requests, then check MONO HQ Realtime/DebugView. Local event generation and unit tests do not prove Google's receipt. Reporting can take time to populate and blockers/opt-out affect collection. Existing Enhanced Measurement scroll/outbound events remain separate; do not sum them with these custom events.

For persistent per-film reports, register desired event-scoped dimensions such as `film_id`, `section_id`, `action`, and `cta`, and custom metrics such as `seconds`, `startup_ms`, `buffer_ms`, and `visible_time_ms` if not already defined. GA Admin definitions and dashboard settings have not been changed. The normal page/event counts and standard session campaign dimensions remain available without those additional definitions.

References: [Google event setup](https://developers.google.com/analytics/devguides/collection/ga4/events) and [GA4 event parameters](https://developers.google.com/analytics/devguides/collection/ga4/parameters).

Thumbnail treatment: black and white at rest; full colour on hover and visible keyboard focus. MONO electric-blue controls remain. Reduced motion removes the 240ms fade, and touch opens the full-colour video on tap. Existing lazy-loaded JPEGs are reused.

The public Uber Eats AO case study uses a 960×540 H.264/AAC web copy (9.69 MB, 700 kbps peak video and 80 kbps audio) to stay below the connector’s 16 MiB request limit after base64 encoding. Duration stays 120 seconds. Private review retains its earlier 1280×720 copy.
