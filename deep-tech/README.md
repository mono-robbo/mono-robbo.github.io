# MONO deep tech offer page — review branch

Target route: `/deep-tech/` on the existing static MONO website.

**Review only. Do not merge into the publishing branch or deploy without Robin's explicit approval.** The page is `noindex,nofollow`; no home-page navigation, sitemap, analytics, payment flow, email endpoint or deployment configuration has been changed. The enquiry flow previews and copies text locally. It does not send anything. GitHub source is public, as is the existing repository; this branch is not a private staging site.

## Preview

From the repository root, run `npm run dev` (no dependencies to install), or use any static web server, for example:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/deep-tech/`. The page uses browser ES modules, so serve it over HTTP rather than opening it as a `file://` URL. No package installation or production build is required.

## Content and commercial rules

- `offers.js`: all item details, stage/package membership, examples and future prices.
- `index.html`: page structure, introduction, ongoing workspace explanation and enquiry fields.
- `deep-tech.css`: page-specific MONO styling, responsive layouts and dialogs.
- `deep-tech.js`: item details, package builder and enquiry preview.

Three complete packages include **every item listed in their stage**. The technology stage lists static visual explanation and the 15-second motion explainer as separate purchasable modules, alongside visualisation and interview. The basic logo and landing page are standalone additions outside package discounts.

Complete packages receive 10% off the combined individual item prices. Items can be used separately within 90 days **from purchase**. Selecting a package removes duplicate individual selections. Removing one included item converts the remaining package items to individual selections and removes the package discount. Selecting every item individually offers an explicit upgrade to the complete package.

All `priceCents` fields are currently `null`; the UI reserves the price positions with an em dash. No prices, including historical headshot pricing, are published. To add prices, set integer AUD cents on items. The package total is calculated from its members; the discount is rounded once to the nearest cent. A package containing any unpriced item remains unpriced. A mixed selection shows only a labelled priced subtotal plus a pricing-to-be-confirmed notice. Confirm GST display/treatment before entering or publishing amounts.

Deliverables are proposed product definitions for review. Final quantities, production complexity, revisions, turnaround, shoot logistics, licensing and account/hosting responsibilities need to be costed and agreed before they become fixed offers. No precise delivery promise or automatic ongoing monitoring is included.

## Adding content examples

Every item and stage has `example: null`. The intentional placeholders say “Example to be added”. Supply cleared examples before public launch. Use a local asset path or HTTPS URL and this shape:

```js
example: {
  type: 'image', // image, video, or link (interactive external preview)
  src: './assets/example.webp',
  alt: 'Describe the actual example',
  credit: 'Client / project, used with permission',
  // poster: './assets/example-poster.webp' // optional for video
}
```

Stage examples appear in the gallery; item examples appear in the detail dialog. A `link` opens a real preview in a new tab. Videos use native controls with no autoplay. The example areas do not claim that a placeholder is completed client work.

Add `priceCents` and `example` directly inside the relevant item object to override its empty defaults. Keep each item's unique ID stable.

## Verification

```sh
node --test deep-tech/tests/selection.test.mjs
```

The regression tests cover package membership, duplicate prevention, splitting packages into individual items, 10% calculation and unpriced totals. Manually/browser-test item dialogs, keyboard dismissal and focus restoration, desktop/mobile overflow, package removal, milestone entry, and enquiry preview/copy.

## Before publication

1. Agree scopes and prices, GST display and 90-day scheduling terms.
2. Replace intentional example placeholders with cleared content.
3. Connect and verify the agreed enquiry destination; the current preview does not send.
4. Remove review-only labels and `noindex,nofollow`, add canonical metadata and navigation/sitemap entries as approved.
5. Obtain explicit approval before merging/deploying.
