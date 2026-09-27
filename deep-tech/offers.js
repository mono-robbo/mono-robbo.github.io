// Prices are integer AUD cents. null reserves the space without publishing a price.
// Keep examples null until a cleared asset is ready; see README.md for the schema.
export const terms = Object.freeze({ discount: 0.10, usageDays: 90, currency: 'AUD', reviewOnly: true });

export const stages = [
  { id: 'credibility', number: '01', title: 'Build credibility.', short: 'Build credibility',
    promise: '',
    description: 'Let people see the team, the work and the ambition behind the science.',
    packageName: 'Credibility package', exampleTitle: 'Real people. Real work.',
    exampleDescription: 'A collection of portraits, collaboration, lab and technology photography.',
    exampleLabels: ['Headshots', 'Team at work', 'Lab & technology'], example: null,
    itemIds: ['photo-suite', 'company-introduction', 'press-profile', 'language-kit'] },
  { id: 'technology', number: '02', title: 'Explain the technology.', short: 'Explain the technology',
    promise: 'Make the difficult part understandable.',
    description: 'Work through the science with us. Turn your mechanism, breakthrough or application into visuals and stories that someone outside your field can follow.',
    packageName: 'Technology package', exampleTitle: 'From complex to clear.',
    exampleDescription: 'Space for diagrams, visualisations, motion and interview work.',
    exampleLabels: ['Visual explanation', 'Visualisation', 'Motion & interviews'], example: null,
    itemIds: ['visual-explanation', 'technology-visualisation', 'short-explainer', 'technical-interview'] },
  { id: 'conversation', number: '03', title: 'Leave the room\nwanting more.', short: 'Leave the room wanting more',
    promise: 'Start the conversation. Lead it well. Give it somewhere to go.',
    description: 'Materials for the moments before, during and after a meeting. Help your audience understand the opportunity and share it with the next person.',
    packageName: 'Conversation package', exampleTitle: 'Make the story travel.',
    exampleDescription: 'Space for an interactive scroller, a send-ahead, a pitch deck and a leave-behind.',
    exampleLabels: ['Scroller', 'Send-ahead & deck', 'Leave-behind'], example: null,
    itemIds: ['scroller', 'send-ahead', 'pitch-deck', 'leave-behind'] }
];

export const items = [
  { id: 'photo-suite', title: 'Photo suite', format: 'Photography',
    description: 'The people, collaboration and technology that make your company real.',
    useful: 'Your website and introductions need authentic images of the people and work behind the company.',
    deliverables: ['Founder and team headshots', 'Team collaboration and people working', 'Lab, workplace, equipment and technology photographs', 'A selected, edited image collection in web and high-resolution formats'],
    input: 'People, an agreed location and access to the work you can show. We plan the shot list together.',
    process: 'Shot list → scheduled shoot → image selection → edit and delivery. Team size, image count, travel and feedback rounds are agreed before booking.',
    handoff: 'Edited image masters and web exports, organised for reuse. Additional people and later shoots can be scoped separately.' },
  { id: 'company-introduction', title: 'Company introduction', format: 'Company write-up',
    description: 'A clear introduction to who you are, what you are building and why it matters.',
    useful: 'You need a coherent first account of the company for your website, partners or introductory material.',
    deliverables: ['An initial company write-up', 'The problem, your approach and your current stage', 'The team’s background and the company’s ambition'],
    input: 'An existing deck or notes, a founder conversation and supporting facts.',
    process: 'Briefing → first draft → consolidated feedback → approved version. Length and revision rounds are agreed at briefing.',
    handoff: 'An editable document that can grow with the company.' },
  { id: 'press-profile', title: 'Press profile kit', format: 'PR foundations',
    description: 'Give a journalist or communications partner the story and facts to work with.',
    useful: 'A milestone or media opportunity is approaching and your basic press materials are scattered or missing.',
    deliverables: ['A potential story angle and company backgrounder', 'Founder bios and key facts', 'Draft quotes for approval', 'A caption and credit sheet for the photographs you supply'],
    input: 'The relevant milestone, evidence, spokesperson details and approved photography.',
    process: 'Identify the angle → draft the materials → fact-check with your team → finalise. Media outreach and placement are separate services.',
    handoff: 'Editable press documents and an organised press folder. Photography can be added through the photo suite.' },
  { id: 'language-kit', title: 'Company language kit', format: 'Reusable copy',
    description: 'A useful range of words for your team, science, technology and vision.',
    useful: 'Every introduction sounds different, or your team keeps rewriting the same descriptions.',
    deliverables: ['Short and extended company descriptions', 'Descriptions of the team, science and technology', 'A clear vision statement', 'Adaptations for an introduction email, event bio and website'],
    input: 'Your current descriptions, intended audiences and approved technical facts.',
    process: 'Collect the current language → write a consistent set → review with your team → hand over.',
    handoff: 'An editable language bank with labels showing where each version can be used.' },
  { id: 'visual-explanation', title: 'Visual explanation set', format: 'Diagrams & slides',
    description: 'Show today’s approach, its limitation and what your technology changes.',
    useful: 'People struggle to follow the mechanism, even after you have explained it.',
    deliverables: ['A visual of the current approach', 'A diagram of the bottleneck or problem', 'Your mechanism and what changes', 'An outcome visual with agreed claims'],
    input: 'A technical conversation, reference material and a person who can approve accuracy.',
    process: 'Understand the mechanism → sketch the explanation → technical review → design and finish.',
    handoff: 'Layered, editable visual source files and exports for decks and web. The approved explanation travels with the files.' },
  { id: 'technology-visualisation', title: 'Technology visualisation', format: 'Product & application imagery',
    description: 'Make something hard to photograph or imagine tangible.',
    useful: 'The technology is microscopic, internal, unfinished or difficult to see in its intended environment.',
    deliverables: ['One agreed visual direction', 'A product view, cutaway or application scene', 'Final image and agreed crops', 'Notes on illustrative assumptions'],
    input: 'References, technical constraints and the intended use. Model construction and image count are scoped to the brief.',
    process: 'Interpret the references → select a production approach → review the visual → finish. AI may support production where appropriate.',
    handoff: 'High-resolution masters and available working files. Generated imagery is delivered as raster imagery; editable annotations remain separate.' },
  { id: 'short-explainer', title: '15-second explainer', format: 'Short motion piece',
    description: 'One mechanism, idea or difference, brought into motion.',
    useful: 'A short moving sequence would explain a process more clearly than a still image.',
    deliverables: ['A short script or sequence outline', 'Storyboard for one core idea', 'A 15-second finished motion piece', 'On-screen text and agreed sound treatment'],
    input: 'The core idea, technical references and any approved visuals. New 3D work, voiceover and extra formats are scoped separately.',
    process: 'Outline → storyboard and accuracy approval → animation → review and finish.',
    handoff: 'Final video and transferable project files with an asset and licence list.' },
  { id: 'technical-interview', title: 'Founder or scientist interview', format: 'Interview film',
    description: 'Let the person who understands the work explain why it matters.',
    useful: 'Your audience needs both a clear explanation and a connection with the person behind it.',
    deliverables: ['Interview preparation and question outline', 'An agreed remote or on-location recording', 'An edited explanation with supporting visuals', 'Captioned delivery'],
    input: 'A spokesperson, supporting material and time to record. Duration, location, capture and visual requirements are agreed together.',
    process: 'Prepare → interview → story edit → technical review → final delivery.',
    handoff: 'Finished film and an approved transcript. Transferable edit files are included within the agreed scope.' },
  { id: 'scroller', title: 'Interactive scroller', format: 'A visual web conversation',
    description: 'An explanation people can explore on their phone, at their own pace.',
    useful: 'You need a quick way to start a conversation at an event or share the story in a link.',
    deliverables: ['A focused visual narrative', 'Responsive sections with purposeful scrolling interactions', 'An agreed next step or contact action', 'A live page when approved, plus its source repository'],
    input: 'The audience, approved explanation and existing assets. New visual production is selected separately or reused from your package.',
    process: 'Outline → layout and interactions → desktop and mobile review → approved launch.',
    handoff: 'Source code in GitHub, editable content and a short update guide. Hosting, domain and ongoing support are agreed separately.' },
  { id: 'send-ahead', title: 'Send-ahead', format: 'Before the meeting',
    description: 'Give someone a reason to take the meeting and a useful place to start.',
    useful: 'You are requesting an introduction or preparing someone for an upcoming discussion.',
    deliverables: ['A concise audience-specific introduction', 'The problem, relevance and essential proof', 'A clear reason to meet', 'A designed, shareable PDF'],
    input: 'Who is receiving it, why they should care and what you want to discuss.',
    process: 'Agree the audience → select the message and evidence → design → review.',
    handoff: 'Editable source and PDF, ready to adapt for the next audience.' },
  { id: 'pitch-deck', title: 'Pitch deck', format: 'In the room',
    description: 'Lead the conversation with a clear sequence and visuals that do real work.',
    useful: 'You have a consequential meeting and need the material to support the discussion.',
    deliverables: ['An audience-specific presentation structure', 'Designed, editable slides', 'Integration of your approved visuals and evidence', 'Presenter notes for key explanations'],
    input: 'Existing material, the audience and the decision you are seeking. Slide count and new visual requirements are agreed before production.',
    process: 'Structure → content approval → slide design → rehearsal feedback and final amendments within the agreed scope.',
    handoff: 'An editable deck in the agreed presentation format and a PDF copy.' },
  { id: 'leave-behind', title: 'Leave-behind', format: 'After the meeting',
    description: 'Help your champion remember the story and explain it to the next person.',
    useful: 'The person in the room needs to share the opportunity with colleagues who were not there.',
    deliverables: ['A self-contained account of the opportunity', 'The technical explanation and essential proof', 'Answers to agreed common questions', 'A clear next step and contact details'],
    input: 'The discussion, the likely internal audience and the information they need to act.',
    process: 'Identify what must travel → write and design → check it works without narration → approve.',
    handoff: 'Editable source and a forwardable PDF. Page count is agreed to suit the conversation.' },
  { id: 'basic-logo', title: 'Basic logo design', format: 'Additional item',
    description: 'A simple, usable visual identity for a company getting started.',
    useful: 'You need a consistent mark for the first deck, website and company materials.',
    deliverables: ['An agreed wordmark or simple symbol direction', 'Colour and monochrome versions', 'Vector and image exports', 'A compact usage sheet'],
    input: 'The company name, references and practical applications.',
    process: 'Brief → agreed concept exploration → refine → deliver. Naming and full brand strategy are separate scopes.',
    handoff: 'Editable vector source and reusable exports.' },
  { id: 'landing-page', title: 'Basic landing page', format: 'Additional item',
    description: 'A clear home for who you are, what you do and how to engage.',
    useful: 'Someone looks up your company and needs to find a credible, current introduction.',
    deliverables: ['One responsive company page', 'Company explanation, team and approved evidence', 'An agreed contact action', 'Source repository and update guide'],
    input: 'Approved wording, imagery and domain access for a later approved launch.',
    process: 'Outline → design and build → desktop and mobile review → approved launch.',
    handoff: 'Source code in GitHub and editable content. Hosting, domain and ongoing support are agreed separately.' }
].map(item => ({ priceCents: null, example: null, ...item }));

export const itemById = Object.fromEntries(items.map(item => [item.id, item]));
export const stageById = Object.fromEntries(stages.map(stage => [stage.id, stage]));

export function packageQuote(stage, catalog = itemById) {
  const prices = stage.itemIds.map(id => catalog[id].priceCents);
  if (prices.some(value => !Number.isInteger(value) || value < 0)) return null;
  const subtotal = prices.reduce((sum, value) => sum + value, 0);
  const saving = Math.round(subtotal * terms.discount);
  return { subtotal, saving, total: subtotal - saving };
}

export function createSelection() { return { packages: new Set(), individuals: new Set() }; }
export function addPackage(state, id) {
  if (!stageById[id]) return;
  state.packages.add(id);
  stageById[id].itemIds.forEach(item => state.individuals.delete(item));
}
export function selectedIds(state) {
  return new Set([...state.individuals, ...[...state.packages].flatMap(id => stageById[id].itemIds)]);
}
export function removeItem(state, id) {
  for (const packageId of [...state.packages]) {
    const pack = stageById[packageId];
    if (pack.itemIds.includes(id)) {
      state.packages.delete(packageId);
      pack.itemIds.filter(item => item !== id).forEach(item => state.individuals.add(item));
    }
  }
  state.individuals.delete(id);
}
export function selectionQuote(state, catalog = itemById) {
  let knownTotal = 0, saving = 0, unpriced = 0;
  for (const id of state.packages) {
    const quote = packageQuote(stageById[id], catalog);
    if (quote) { knownTotal += quote.total; saving += quote.saving; }
    else unpriced++;
  }
  for (const id of state.individuals) {
    const price = catalog[id].priceCents;
    if (Number.isInteger(price) && price >= 0) knownTotal += price;
    else unpriced++;
  }
  return { knownTotal, saving, unpriced };
}
