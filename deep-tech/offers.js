// Prices are integer AUD cents. A null price needs a scoped quote.
export const terms = Object.freeze({ discount: 0.15, usageDays: 90, currency: 'AUD' });

// Fictional company used only to demonstrate the Profile Build deliverable.
export const fictionalCompany = Object.freeze({
  name: 'Morrowcell Hydrogen',
  sector: 'Green hydrogen',
  card: 'Modular electrolysers designed to make renewable hydrogen near industrial demand.',
  short: 'Morrowcell Hydrogen is developing modular electrolysers that use renewable electricity to produce hydrogen near industrial demand. The team is working with prospective partners to identify practical applications and validate the system design.',
  long: 'Morrowcell Hydrogen is a fictional company developing modular water electrolysers for industrial sites with access to renewable electricity. The concept is to produce hydrogen close to the point of use, so prospective customers can assess it within the realities of their energy supply, operations and infrastructure. The team is exploring where locally produced hydrogen could serve as a fuel or industrial feedstock. Its next work is to validate the system design with technical partners and test the economics of specific applications. Those questions remain open; this profile describes a proposed direction rather than proven performance.'
});

export const stages = [
  {
    id: 'who', number: '01', title: 'WHO', short: 'Company identity',
    packageName: 'WHO Pack', packagePricePrefix: 'From',
    description: 'Who is behind the science, the technology, the big ideas? Give the company photos, design and a strong narrative to earn the next conversation.',
    coreIds: ['photo-suite', 'words-pack', 'micro-design'],
    extensionIds: [],
    inputs: ['What your technology does today', 'Industries and customers you are exploring', 'Your route to market and useful shortcuts', 'Grants, funding and near-term milestones'],
    preview: [
      { number: '01', label: 'People', headline: 'Photography', visual: 'people', detail: 'The team behind the work: headshots, group portraits and the team working together.' },
      { number: '02', label: 'Narrative', headline: 'Profile\nBuild', visual: 'profile', detail: 'Short and long company write-ups that keep early materials consistent.' },
      { number: '03', label: 'Design', headline: 'Micro\nDesign\nSystem', visual: 'design', detail: 'A micro logo, typography, colours and a simple design language for early decks and materials.' }
    ]
  },
  {
    id: 'how', number: '02', title: 'HOW', short: 'Technical explanation',
    packageName: 'HOW Pack', packagePriceLabel: 'Custom quote', pricingMode: 'custom',
    description: 'Across a series of conversations, explain the science, the technology and its applications through visuals, animation and a deeper explainer. Develop the narrative as the evidence and company evolve.',
    coreIds: ['visual-explanation', 'technology-visualisation', 'detailed-explainer'],
    extensionIds: [],
    inputs: ['The current approach and its limits', 'Your mechanism and technical references', 'Evidence, claims and open questions', 'Applications and the audiences you need to reach'],
    preview: [
      { number: '01', label: 'Visuals', headline: 'Static Visuals', visual: 'staticVisual', detail: 'Simple visuals for the technology, science and applications.' },
      { number: '02', label: 'Motion', headline: 'Animated Visualisation', visual: 'motion', detail: 'Animation that shows how the technology works.' },
      { number: '03', label: 'Deep dive', headline: 'Detailed\nExplainers', visual: 'explainer', detail: 'Copy, visuals and selected footage for a more developed HOW narrative.' }
    ]
  }
];

export const items = [
  { id: 'photo-suite', title: 'Photography', format: 'People & workplace photography', priceCents: 50000, pricePrefix: 'From', priceNote: 'Two people included; +$150 for each additional person.',
    description: 'Headshots, group portraits and team collaboration photos that show the real people behind world-changing work.',
    useful: 'The company needs authentic images for introductions, decks and a first web presence.',
    deliverables: ['Founder and team headshots', 'Group and team-at-work portraits', 'Selected lab, workplace and technology images where useful', 'Edited images in web and high-resolution formats'],
    input: 'People, a suitable location, access to work that can be shown and an agreed shot list.',
    process: 'Short planning conversations → schedule the shoot → select and edit → review together → deliver. Team size, image count and travel are scoped before booking.',
    handoff: 'Organised image masters and exports for use across future materials.' },
  { id: 'micro-design', title: 'Micro Design System', format: 'Logo & visual foundations', priceCents: 150000,
    description: 'A micro logo, typography, colours and simple design language for early decks, documents and a company page.',
    useful: 'The spin-out needs a consistent, credible visual starting point without commissioning a full brand programme.',
    deliverables: ['A simple wordmark or symbol direction', 'Colour, type and graphic rules', 'Vector and image logo exports', 'A compact editable usage sheet'],
    input: 'Company name, practical applications, references and any existing identity constraints.',
    process: 'Short brief and check-ins → concept direction → refine as the company develops → prepare working files and exports.',
    handoff: 'Editable source files and a visual system that can carry through diagrams, decks and pages.' },
  { id: 'words-pack', title: 'Profile Build', format: 'Company narrative & profile', priceCents: 75000,
    example: { type: 'copy', ...fictionalCompany },
    description: 'Through a series of short workshops, clarify WHO you are talking to, HOW your technology works and WHY it matters to them. Build short and long profiles from that thinking.',
    useful: 'The team needs a dependable company profile and a working position it can revisit as sectors, customers or funding paths change.',
    deliverables: ['A working audience and positioning hypothesis', 'A one-line company description', 'Short and long company profiles for decks and other early materials', 'Founder and team bios, where needed', 'Questions and evidence to test next'],
    input: 'Working answers about the technology, industry, ideal customers, route to market, useful shortcuts, grants and funding targets. Existing notes, slides and uncertainties are welcome.',
    process: 'Start with what the team knows → hold short working sessions as the story takes shape → draft and refine profiles → check accuracy and tone → hand over working versions.',
    handoff: 'Editable short and long profiles, with a working decision record that can change as the team learns.' },
  { id: 'visual-explanation', title: 'Static Visuals', format: 'Images & diagrams', priceCents: 75000,
    description: 'Simple images and diagrams that explain the technology, the science and its applications.',
    useful: 'Judges, investors and partners need a clear visual starting point for unfamiliar science.',
    deliverables: ['Simple technology and science diagrams', 'Application visuals', 'Agreed captions and annotations', 'Exports for decks and web'],
    input: 'Technical references, current evidence, likely applications and someone who can review accuracy.',
    process: 'Short technical conversations → sketch the visual logic → review accuracy → design in the micro design language → refine.',
    handoff: 'Layered editable sources, exports and notes on claims and assumptions.' },
  { id: 'technology-visualisation', title: 'Animated Visualisation', format: 'Animation & motion', priceCents: 50000, pricePrefix: 'From', priceNote: 'Final price depends on complexity.',
    description: 'Animation that shows how the technology works when a still image cannot explain it clearly.',
    useful: 'The subject is microscopic, internal, unfinished or easier to understand as a sequence.',
    deliverables: ['An agreed visual direction and storyboard', 'A technically reviewed animation', 'Agreed text and sound treatment', 'A finished sequence in scoped formats', 'Notes on illustrative assumptions'],
    input: 'Current technical explanation, visual references and someone who can review accuracy.',
    process: 'Short technical conversations → choose one mechanism → storyboard → accuracy review → animate and refine. AI may assist where appropriate.',
    handoff: 'Final animation and available working files, with illustrative assumptions identified.' },
  { id: 'detailed-explainer', title: 'Detailed Explainers', format: 'Copy, visuals & footage', priceLabel: 'Custom quote',
    description: 'A deeper explanation that brings together copy, visuals and selected footage as the HOW narrative becomes more established.',
    useful: 'The company is ready to explain its science, mechanism, applications and evidence in greater depth.',
    deliverables: ['A structured long-form explanation', 'Plain-language and technical copy', 'Supporting diagrams and visual sequences', 'Selected footage or interview excerpts where available', 'A claims and evidence record with open questions'],
    input: 'Current technical references, evidence, intended audiences, available footage and someone who can check scientific accuracy.',
    process: 'Build on the visual work through short conversations → develop the deeper narrative → select the strongest visuals and available footage → review accuracy → refine.',
    handoff: 'Editable copy and visual sources, with selected footage and a source narrative ready for audience-specific formats. New filming is scoped in PRESENT.' }
].map(item => ({ priceCents: null, example: null, ...item }));

export const containers = [
  { id: 'send-ahead', title: 'Send-ahead', moment: 'Before the meeting', description: 'A small deck that gives people the preamble before your meeting.',
    useful: 'A particular person needs context and a reason to pay attention before the conversation starts.',
    deliverables: ['A short, audience-specific slide sequence', 'Relevant problem, opportunity and proof', 'A clear reason to meet', 'Shareable deck and PDF'],
    input: 'Who will receive it, what matters to them and the conversation sought.', process: 'Select the message and evidence → write → design → review.', handoff: 'Editable short deck and a version ready to send.' },
  { id: 'scroller', title: 'Scroller', moment: 'Ready on your phone', description: 'A scrolling explainer on your phone, ready for off-the-cuff conversations.',
    useful: 'A founder needs to show one important idea quickly at an event, meeting or chance encounter.',
    deliverables: ['Focused visual narrative', 'Phone-friendly scrolling sequence', 'An agreed next step', 'Source repository and update guide'],
    input: 'The audience, approved explanation, available imagery and intended next action.', process: 'Outline → design and build → phone review → approved launch.', handoff: 'Client-maintainable source code. Hosting, domain and ongoing support are scoped separately.' },
  { id: 'leave-behind', title: 'Leave-behind', moment: 'After the meeting', description: 'A self-contained story a champion can share with someone who was not there.',
    useful: 'A meeting attendee needs to explain the opportunity internally without repeating your whole pitch.',
    deliverables: ['Self-contained summary', 'Relevant technical explanation and evidence', 'Answers to agreed common questions', 'Clear next step'],
    input: 'The meeting context, likely internal audience and decision still to be made.', process: 'Identify what must travel → write and design → test without narration → approve.', handoff: 'Editable source and a forwardable PDF.' },
  { id: 'pitch-deck', title: 'Pitch deck', moment: 'In the room', description: 'A clear, editable sequence for a particular audience and decision.',
    useful: 'An investor, partner or customer meeting needs a story the speaker can lead and the audience can follow.',
    deliverables: ['Audience-specific structure', 'Designed editable slides', 'Relevant evidence and approved visuals', 'Presenter notes for key explanations'],
    input: 'The audience, decision sought, existing material and approved source elements.', process: 'Structure → content review → design → rehearsal feedback → finalise.', handoff: 'Editable deck and PDF. Slide count and new visual production are scoped before work begins.' },
  { id: 'landing-page', title: 'Landing page', moment: 'Find and understand you', description: 'A current, simple home for the company story, technology and next step.',
    useful: 'Someone looks up the company and needs a credible, current explanation.',
    deliverables: ['One responsive page', 'Company and technology sections from approved sources', 'An agreed contact action', 'Source repository and update guide'],
    input: 'Approved words, imagery and any domain or hosting requirements.', process: 'Outline → design and build → desktop/mobile review → approved launch.', handoff: 'Editable content and source code. Hosting and ongoing support are agreed separately.' },
  { id: 'press-materials', title: 'Press Kit', moment: 'At a news moment', description: 'A backgrounder, facts, bios and approved angles for a specific milestone.',
    useful: 'A real milestone gives journalists or a communications partner a reason to understand the company.',
    deliverables: ['Proposed story angle', 'Company backgrounder and key facts', 'Spokesperson bios and draft quotes', 'Image captions and credits'],
    input: 'The milestone, supporting evidence, approved facts and photography.', process: 'Identify the angle → draft → fact-check → finalise.', handoff: 'Editable press files. Media outreach and placement are scoped separately.' },
  { id: 'explainer-film', title: 'Explainer film', moment: 'Show how it works', description: 'A finished film that makes one approved technical story clear for a chosen audience.',
    useful: 'Movement, voice and context will help an audience grasp the mechanism or application.',
    deliverables: ['Audience-specific script and storyboard', 'Approved visuals, animation and footage plan', 'Technical and editorial review', 'Finished film and captions in scoped formats'],
    input: 'Approved WHO and HOW material, available footage, filming access if needed and a technical reviewer.', process: 'Choose one explanation → script and storyboard → create or select visuals and footage → edit → review → finish.', handoff: 'Final film, captions and transferable project files within the agreed scope.' },
  { id: 'interviews', title: 'Interviews', moment: 'Hear from the team', description: 'Filmed conversations with founders and technical leads, shaped into clear, shareable stories.',
    useful: 'The people behind the work can bring credibility, perspective and a human voice to the technology.',
    deliverables: ['Interview themes and questions', 'Filmed founder or technical lead interviews', 'Selected workplace or lab footage where useful', 'Edited interview clips in scoped formats'],
    input: 'Spokespeople, location access, filming permissions, approved claims and intended audiences.', process: 'Plan short conversations → film → select and edit → review for accuracy and permissions.', handoff: 'Finished interview clips, captions and agreed footage files for reuse in future formats.' }
].map(container => ({ priceCents: null, ...container }));

export const itemById = Object.fromEntries([...items, ...containers].map(item => [item.id, item]));

export function packageQuote(stage, catalog = itemById) {
  if (stage.pricingMode === 'custom') return null;
  const prices = stage.coreIds.map(id => catalog[id]?.priceCents);
  if (prices.some(value => !Number.isInteger(value) || value < 0)) return null;
  const subtotal = prices.reduce((sum, value) => sum + value, 0);
  const saving = Math.round(subtotal * terms.discount);
  return { subtotal, saving, total: subtotal - saving };
}
