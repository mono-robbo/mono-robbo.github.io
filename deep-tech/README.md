# MONO deep-tech offer page

Public route: `https://monohq.co/deep-tech/` on the existing static MONO website.

The page follows 01 WHO, 02 HOW, 03 PRESENT and 04 SUPPORT. SUPPORT uses the eyebrow “Presentation support”, the shared stage heading layout and full-width service rows for Refresh (Existing deck), Design (Charts, tables & diagrams) and Build (New deck). The rows stack on smaller screens. Refresh starts at $750 using a 10-slide deck as a reference; Design is quoted as an addition to the Refresh package; Build is custom quoted. Existing WHO/HOW prices are unchanged.

The page displays offers, indicative prices and quote labels. It has no cart, enquiry submission or payment flow; the closing action opens an email to MONO. The GitHub repository is public.

## Preview

From the repository root, run `npm run dev` (no package installation required) and open `http://localhost:4173/deep-tech/`. The page uses browser ES modules and must be served over HTTP.

## Offer architecture

The page has two foundation packs, finished formats and presentation support:

1. **WHO Pack:** Photography and Micro Design System. These build visual foundations around the existing company story. The team brings its company name and story, people and workplace, visual references, identity constraints and the materials it needs next.
2. **HOW Pack:** Static Visuals, Animated Visualisation and Detailed Explainers. These make the science, technology and applications understandable through diagrams, motion and a deeper explanation with copy, visuals and selected available footage. New filming belongs in PRESENT.
3. **PRESENT:** send-aheads, scrollers, leave-behinds, pitch decks, landing pages, press kits, explainer films and interviews turn the reusable source elements into polished, audience-ready pieces. Each format is scoped separately. Updating source elements supports a new hypothesis, sector or funder mission without rebuilding everything.

4. **SUPPORT:** refresh an existing deck, add specific visual design work to a deck refresh or build a new deck from the team’s narrative, notes and evidence. Design reworks tables, flowcharts, Gantt charts and graphs while retaining the technical detail.

Both foundation packs develop through short, incremental conversations and reviews alongside production, at the pace of the company. There is no standalone long workshop offer.

The core elements of each foundation pack can also be considered individually. The WHO Pack starts with Photography for two people ($500) and Micro Design System ($1,500). Each additional photography subject adds $150. The WHO Pack receives the existing 10% discount off the combined individual prices, starting at $1,800 for two people. HOW includes Static Visuals ($750), Animated Visualisation (from $950, dependent on complexity) and Detailed Explainers (custom quote); the complete HOW Pack is custom quoted. Pack work can be scheduled to build the assets within 90 days, subject to agreed scope and scheduling. This period does not limit subsequent use of delivered assets. The offer page is not a shopping site.

## Content and pricing

- `offers.js`: pack structure, item details, containers and future prices.
- `index.html`: page structure and static copy.
- `deep-tech.js`: offer cards, details and illustrative content directions.
- `visuals.js`: content-neutral SVG studies and the selected Higgsfield-generated review images for WHO and HOW.
- `deep-tech.css`: styling and responsive layouts.

Item base prices are integer AUD cents. A `null` price means the item needs a custom quote or remains to be priced. The WHO Pack total is calculated from its two base prices, with the 10% discount rounded once to the nearest cent. Additional photography subjects change the subtotal before the discount. The HOW Pack remains custom quoted even if its individually priced items have values. PRESENT formats remain unpriced. Confirm scope, GST treatment, timing, licensing, travel and hosting before publishing amounts.

The graphic panels in the two pack sections are **illustrative examples**, not completed client work. Static Visuals uses a labelled SVG process; Animated Visualisation is an interactive CSS 3D study; Detailed Explainers has a play cue for an eventual film example. The selected Higgsfield images for Photography, Micro Design System and Detailed Explainers load from its media CDN, with editable SVG fallbacks. Replace generated images when approved client material is available. The page makes no promise of continuous monitoring or grant success. Narrative and visual source files should be editable where practical; container-specific hosting and ongoing support are separate.

## Verification

```sh
npm run test:deep-tech
```

The tests cover pack membership and pricing. Manually check the item dialog, focus restoration, desktop/mobile layouts and price labels.

## Ongoing checks

1. Confirm scopes, GST treatment, timing, licensing, travel and hosting in each quote.
2. Keep illustrative concepts clearly labelled until replaced with approved work.
3. Keep the public email destination current.
