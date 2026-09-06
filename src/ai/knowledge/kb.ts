// Verified Kumbh knowledge base + transparent retrieval (§23/§46).
//
// These entries are the "verified knowledge" Setu is allowed to state as fact.
// They are synthetic reference content written for this prototype — clearly a
// demo knowledge set, not an official NTKMA document. Retrieval is keyword +
// field-weighted scoring (a real build would swap in embeddings + a vector
// store behind `retrieve()` with the same return shape).

import type { SetuIntent } from "@/ai/intents";

export type KBAudience = "pilgrim" | "volunteer" | "management";

export interface KBEntry {
  id: string;
  title: string;
  body: string;
  /** Where a real deployment would cite this from. */
  source: string;
  tags: string[];
  intents: SetuIntent[];
  /** Ordered actions, for "what do I do / give me the steps" questions.
   *  Setu renders these as a numbered list. */
  steps?: string[];
  /** Who this passage is written for. Absent = useful to everyone. Retrieval
   *  gives a small bonus to passages that match the asker's role. */
  audience?: KBAudience[];
}

export const KB: KBEntry[] = [
  {
    id: "kb-medical-escalation",
    title: "Medical escalation — when to call the response team",
    body: "Call the medical response team immediately for: unconsciousness, chest pain, difficulty breathing, heavy bleeding, seizure, suspected stroke (face droop / arm weakness / slurred speech), or heat stroke (hot dry skin, confusion). Do not move a collapsed person unless they are in immediate danger. Stay with them, keep the airway clear, note the time. For non-urgent cases (minor cuts, mild dehydration, blisters) escort or direct the person to the nearest medical camp.",
    source: "Kumbh Setu volunteer SOP — Medical (demo knowledge base)",
    tags: ["medical", "escalation", "first aid", "emergency", "unconscious", "breathing"],
    intents: ["medical", "emergency"],
    steps: [
      "Check danger — is the person or you at risk where they are? Only move them if staying is unsafe.",
      "Check response: tap the shoulders, ask loudly if they can hear you.",
      "If unresponsive or breathing is abnormal, call the medical response team now — give your exact location first.",
      "Open the airway (head tilt, chin lift). Note the time.",
      "Stay with them, keep bystanders back, and keep the path clear for responders.",
      "For minor cases (small cuts, mild dehydration, blisters) escort or direct them to the nearest medical camp.",
    ],
  },
  {
    id: "kb-medical-heat",
    title: "Heat exhaustion and heat stroke",
    body: "Heat exhaustion: heavy sweating, weakness, cool clammy skin, nausea. Move the person to shade, loosen clothing, give sips of water, fan them. Heat stroke is an emergency: body very hot, skin may be dry, confusion or fainting — cool aggressively (wet cloths, fanning) and call the medical response team now. Peak risk is 11:00–16:00 near open ghats.",
    source: "Kumbh Setu volunteer SOP — Medical (demo knowledge base)",
    tags: ["medical", "heat", "dehydration", "water", "fainting", "faint", "collapsed", "dizzy"],
    intents: ["medical"],
    steps: [
      "Move the person into shade and lay them down; raise the legs slightly.",
      "Loosen tight clothing. Fan them and put cool, wet cloths on the neck, armpits and groin.",
      "If conscious and not nauseous, give small sips of water.",
      "Watch for heat stroke — very hot skin, confusion, no sweating, fainting. If any of these, call the medical response team now and keep cooling aggressively.",
      "Do not leave them alone until they have recovered or a responder takes over. Note the time it started.",
    ],
  },
  {
    id: "kb-lost-child",
    title: "Lost child / missing person — first actions",
    body: "1) Keep the child with you and stay where you are first, then move to the nearest Help Desk. 2) Do not hand the child to anyone claiming to be a relative without Help Desk verification. 3) Note age, clothing colour, last-seen location and time. 4) Open a missing-person case (Setu can do this) with a photo only if the child is safe and it is appropriate. 5) Reassure the child; give water. Reunification is coordinated by the control room against found-person reports.",
    source: "Kumbh Setu volunteer SOP — Lost & Found (demo knowledge base)",
    tags: ["lost", "missing", "child", "reunification", "help desk"],
    intents: ["lost_person"],
    steps: [
      "Keep the child with you and stay where you are for a minute in case a guardian is right behind them.",
      "Move to the nearest Help Desk. Do not hand the child to anyone claiming to be a relative without Help Desk verification.",
      "Note the child's approximate age, clothing colours, and the last place and time they saw their family.",
      "Ask Setu to open a missing-person case (say \"start a missing-person case\"). Add a photo only if the child is safe and it is appropriate.",
      "Reassure the child, offer water, and stay with them until the control room confirms a match or a guardian pickup.",
    ],
  },
  {
    id: "kb-crowd-pressure",
    title: "Reading and reporting crowd pressure",
    body: "Warning signs: movement slows to a shuffle, you cannot raise your arms, involuntary swaying, shockwaves through the crowd. Do NOT push against flow. Report the location and direction of pressure immediately — control room can hold inflow upstream and open release routes. Encourage diagonal movement toward edges. Never announce 'do not panic' over a PA; give a specific instruction instead ('move left toward the blue gate').",
    source: "Kumbh Setu volunteer SOP — Crowd Safety (demo knowledge base)",
    tags: ["crowd", "pressure", "surge", "stampede", "density", "safety"],
    intents: ["crowd", "safety", "emergency"],
    steps: [
      "Read the signs: shuffling steps, people unable to raise their arms, involuntary swaying, shockwaves through the crowd.",
      "Do not push against the flow. Move diagonally toward the edge if you can.",
      "Report the location and direction of pressure to the control room immediately — they can hold inflow upstream and open release routes.",
      "If using a PA, give a specific instruction (\"move left toward the blue gate\"), never \"do not panic\".",
      "Help people up if anyone falls; keep a clear lane for responders.",
    ],
  },
  {
    id: "kb-water-points",
    title: "Drinking water points and shortages",
    body: "Every zone has at least one water point; temple-perimeter and transit zones have piaus along the main route. If a water point is dry or a tanker has not arrived, log a ground report with an estimate of people waiting — this feeds the resource team and Kumbh Pulse. Direct waiting pilgrims to the next nearest point rather than letting a queue build.",
    source: "Kumbh Setu facility guide — Water (demo knowledge base)",
    tags: ["water", "tanker", "shortage", "piau", "hydration"],
    intents: ["water", "ground_report", "resource"],
  },
  {
    id: "kb-sanitation",
    title: "Sanitation blocks",
    body: "Sanitation blocks are marked on the map in every zone. Report overflow, blocked drains or no-water conditions as a ground report with a photo where possible — sanitation crews are dispatched on report volume and severity. For accessibility, the Help Desk in each zone can direct people to the nearest accessible unit.",
    source: "Kumbh Setu facility guide — Sanitation (demo knowledge base)",
    tags: ["toilet", "sanitation", "overflow", "hygiene", "accessibility"],
    intents: ["toilet", "ground_report"],
  },
  {
    id: "kb-accessibility",
    title: "Assisting elderly and divyang pilgrims",
    body: "Wheelchairs and mobility support are staged at Help Desks and major medical camps. For a pilgrim who cannot walk the distance, request a wheelchair via the zone Help Desk or raise a task. Priority lanes for elderly and divyang pilgrims run at the main ghats — Help Desk staff can escort. Never leave a mobility-limited pilgrim alone in a dense area.",
    source: "Kumbh Setu volunteer SOP — Accessibility (demo knowledge base)",
    tags: ["accessibility", "wheelchair", "elderly", "divyang", "mobility", "escort"],
    intents: ["accessibility", "medical"],
    steps: [
      "Ask what they need and where they are trying to go — do not assume.",
      "If they cannot walk the distance, request a wheelchair from the zone Help Desk or a major medical camp, or raise a task.",
      "Use the priority lanes for elderly and divyang pilgrims at the main ghats; Help Desk staff can escort.",
      "Never leave a mobility-limited pilgrim alone in a dense area — wait with them until support arrives.",
    ],
  },
  {
    id: "kb-ghat-timings",
    title: "Bathing (snan) windows and ghat flow",
    body: "Main snan windows draw the heaviest crowds in the two hours around the muhurat; expect inflow to the ghats to peak beforehand and outflow to peak after. Between windows, ghat approaches run at moderate density. Guidance to pilgrims should route them to a less-crowded ghat when their nearest one is red, and avoid creating a new crowd by over-directing everyone to a single alternative.",
    source: "Kumbh Setu event information (demo knowledge base)",
    tags: ["snan", "aarti", "ghat", "timing", "muhurat", "darshan", "religious"],
    intents: ["religious_information", "navigation", "crowd"],
  },
  {
    id: "kb-transport",
    title: "Transport and parking",
    body: "Shuttle pickup points connect the Nashik ghats and the Trimbakeshwar cluster along the transit corridor. Parking zones are on the outer edge of each cluster; private vehicles are not allowed on ghat approaches during snan windows. Direct drivers to the signed parking zone for their cluster and to the shuttle for the last stretch.",
    source: "Kumbh Setu event information (demo knowledge base)",
    tags: ["transport", "shuttle", "parking", "bus", "corridor"],
    intents: ["transport", "navigation"],
  },
  {
    id: "kb-ground-report-quality",
    title: "What makes a good ground report",
    body: "A useful report has: a clear category (water, sanitation, medical, crowd, infrastructure, safety), the location (Setu attaches your GPS), a severity, and an estimate of people affected. A photo raises its weight. Reports start UNVERIFIED; when several volunteers report the same thing it becomes CORROBORATED and Kumbh Pulse may raise an emerging signal for the control room. Only the control room marks something VERIFIED.",
    source: "Kumbh Setu volunteer SOP — Ground Reporting (demo knowledge base)",
    tags: ["report", "ground truth", "verification", "evidence", "signal", "pulse"],
    intents: ["ground_report", "information"],
  },
  {
    id: "kb-radio-protocol",
    title: "Escalation and radio protocol",
    body: "Escalate to the control room when: a situation exceeds your training, a task needs more responders, or an incident is not resolving. Use Setu's Escalate action on an active task, or raise a new incident. Give location first, then nature, then what you need. Keep the channel short during a live incident.",
    source: "Kumbh Setu volunteer SOP — Communications (demo knowledge base)",
    tags: ["escalate", "radio", "control room", "protocol", "incident"],
    intents: ["volunteer_task", "safety", "information"],
    steps: [
      "Decide it needs escalation: it exceeds your training, needs more responders, or an incident is not resolving.",
      "On an active task, use Setu's Escalate action; otherwise say \"raise an incident\" and Setu will prepare one for your confirmation.",
      "Report in this order: location first, then what is happening, then what you need.",
      "Keep the channel short while the incident is live. Stay on scene unless told to move.",
    ],
  },
  {
    id: "kb-simulation-note",
    title: "About this environment",
    body: "This is a demonstration environment. Zones, facilities, volunteers, incidents, risk scores and this knowledge base are synthetic. Setu will tell you when it does not have verified information rather than guessing. Nothing here is live Nashik–Trimbakeshwar operational data.",
    source: "Kumbh Setu prototype",
    tags: ["simulation", "demo", "synthetic", "about"],
    intents: ["information", "other"],
  },

  // ======================================================================
  // KUMBH MELA — background knowledge (general, well-established tradition).
  // Written for this prototype's knowledge assistant. Specific dates, counts
  // and schedules are deliberately deferred to the mela authority / notice
  // boards / control room rather than stated as fact.
  // ======================================================================
  {
    id: "kb-kumbh-what",
    title: "What the Kumbh Mela is",
    body: "The Kumbh Mela is a Hindu pilgrimage of mass devotion centred on a sacred bath (snan) in a holy river. It is held in rotation at four places: Prayagraj (Ganga–Yamuna–Saraswati confluence), Haridwar (Ganga), Nashik with Trimbakeshwar (Godavari), and Ujjain (Shipra). Each site hosts a full Kumbh roughly every twelve years, with the exact timing fixed by the positions of Jupiter, the Sun and the Moon. It is one of the largest peaceful gatherings of people anywhere in the world.",
    source: "Kumbh Setu knowledge base — background",
    tags: ["kumbh", "mela", "what", "about", "pilgrimage", "prayagraj", "haridwar", "ujjain", "nashik", "snan", "history"],
    intents: ["religious_information", "information"],
  },
  {
    id: "kb-kumbh-origin",
    title: "The origin story of the Kumbh",
    body: "By tradition, the Kumbh recalls the Samudra Manthan — the churning of the cosmic ocean by the devas and asuras to obtain amrit, the nectar of immortality. In the struggle over the kumbh (pot) of amrit, drops are said to have fallen at four places on earth, which became the four Kumbh sites. The pursuit is said to have lasted twelve divine days — twelve human years — which is why each site's Kumbh returns about every twelve years.",
    source: "Kumbh Setu knowledge base — background",
    tags: ["origin", "story", "samudra manthan", "amrit", "nectar", "myth", "legend", "kumbh", "pot", "why twelve years"],
    intents: ["religious_information", "information"],
  },
  {
    id: "kb-simhastha-nashik",
    title: "Simhastha — the Nashik–Trimbakeshwar Kumbh",
    body: "At Nashik the Kumbh is called Simhastha, because it falls when Jupiter (Guru) is in the zodiac sign of Simha (Leo). The bathing is spread across two clusters about 28–30 km apart: the Godavari ghats in Nashik city (Ramkund, Tapovan and others) and the Trimbakeshwar temple town, where the Kushavarta Kund is revered as the source of the Godavari. A transit corridor and shuttle route connect the two.",
    source: "Kumbh Setu knowledge base — Nashik / Trimbakeshwar",
    tags: ["simhastha", "nashik", "trimbakeshwar", "godavari", "jupiter", "leo", "simha", "ramkund", "kushavarta", "corridor", "two clusters"],
    intents: ["religious_information", "navigation", "information"],
  },
  {
    id: "kb-shahi-snan",
    title: "Shahi Snan / Amrit Snan — the royal bath days",
    body: "The most auspicious bathing days are the Shahi Snan (now often called Amrit Snan). On these days the akharas process to the ghats in a fixed traditional order and bathe first, followed by the wider public. These are the highest-crowd days of the whole Mela. The exact dates and the akhara procession schedule are set by the Mela authority from the astrological calendar and published on notice boards and to the control room — Setu does not invent them.",
    source: "Kumbh Setu knowledge base — bathing days",
    tags: ["shahi snan", "amrit snan", "royal bath", "muhurat", "bathing day", "akhara procession", "auspicious", "peak crowd", "dates"],
    intents: ["religious_information", "crowd", "information"],
  },
  {
    id: "kb-akharas",
    title: "The akharas",
    body: "Akharas are monastic orders of ascetics, traditionally thirteen recognised, grouped broadly as Shaiva (Sanyasi), Vaishnava (Bairagi) and Udasin / Nirmal. Their organisation is traditionally credited to Adi Shankaracharya. At the Kumbh the akharas lead the processions to the river on the royal-bath days and bathe first, in an order fixed by long-standing precedence. During a procession, marshals hold the route for the akhara; the public bathes after it has passed.",
    source: "Kumbh Setu knowledge base — akharas",
    tags: ["akhara", "akharas", "sadhu", "naga", "ascetic", "shaiva", "vaishnava", "udasin", "shankaracharya", "procession", "peshwai"],
    intents: ["religious_information", "information", "crowd"],
  },
  {
    id: "kb-trimbakeshwar-temple",
    title: "Trimbakeshwar temple and Kushavarta",
    body: "The Trimbakeshwar temple enshrines one of the twelve Jyotirlingas of Shiva; its lingam is unusual in showing three faces, associated with Brahma, Vishnu and Shiva (Tryambaka). Nearby, the Kushavarta Kund is the sacred tank held to be the origin of the Godavari, which rises in the Brahmagiri hills above the town. Darshan queues at the temple are longest around festival days and the royal-bath windows.",
    source: "Kumbh Setu knowledge base — Trimbakeshwar",
    tags: ["trimbakeshwar", "temple", "jyotirlinga", "shiva", "kushavarta", "kund", "godavari", "brahmagiri", "darshan", "three faces"],
    intents: ["religious_information", "navigation", "information"],
  },
  {
    id: "kb-ramkund",
    title: "Ramkund and the Nashik ghats",
    body: "Ramkund, on the Godavari in Nashik city, is the central bathing spot and is also used for asthi-visarjan (immersion of ashes) and pind-daan rites; it is associated in tradition with Rama's stay in the region. Tapovan and other ghats spread the bathing load along the river. Follow the marked entry and exit lanes at each ghat, keep to the shallow marked area, and do not enter the water where lifeguards signal against it.",
    source: "Kumbh Setu knowledge base — Nashik ghats",
    tags: ["ramkund", "tapovan", "ghat", "nashik", "godavari", "asthi", "pind daan", "bathing", "rama", "lanes"],
    intents: ["religious_information", "navigation", "safety"],
  },
  {
    id: "kb-bathing-etiquette",
    title: "Bathing etiquette and river care",
    body: "Bathe in the marked shallow area and follow the entry/exit lanes. Do not use soap, shampoo or oil in the river, and do not leave clothing, plastic or offerings in the water — use the bins and designated immersion points. Keep bathing brief on high-crowd days so others can take their turn. Non-swimmers should stay where they can stand; children must be held at all times.",
    source: "Kumbh Setu knowledge base — river care",
    tags: ["bathing", "etiquette", "soap", "river", "clean", "plastic", "offerings", "immersion", "swimming", "lanes", "environment"],
    intents: ["religious_information", "safety", "information"],
  },
  {
    id: "kb-pilgrim-safety",
    title: "Staying safe in the crowd (for pilgrims)",
    body: "Keep to the left and keep moving; do not stop to gather or take photos on bridges, ramps or stairs. Agree a fixed meeting point with your group in case you are separated. Carry only what you need; keep valuables in a front pocket or pouch. Wear firm footwear you can walk long distances in. If the crowd around you tightens so you cannot move freely, stay upright, keep your arms in front of your chest, and move with the flow toward the nearest edge — do not push back against it.",
    source: "Kumbh Setu knowledge base — pilgrim safety",
    tags: ["safety", "crowd", "bridge", "photo", "meeting point", "valuables", "footwear", "separated", "pressure", "keep left"],
    intents: ["safety", "crowd", "information"],
    audience: ["pilgrim"],
  },
  {
    id: "kb-children-safety",
    title: "Keeping children safe",
    body: "Write your name and mobile number on a band or slip inside the child's clothing before you set out. Hold small children at the ghats and on stairs at all times. Show the child which uniform to look for (volunteers and police) and point out the nearest Help Desk when you arrive somewhere new. If a child is missing, go to the nearest Help Desk or volunteer immediately — do not spend time searching alone; the control room coordinates reunification against found-child reports.",
    source: "Kumbh Setu knowledge base — families",
    tags: ["child", "children", "kid", "family", "band", "wristband", "missing", "lost", "help desk", "reunification"],
    intents: ["lost_person", "safety", "information"],
  },
  {
    id: "kb-health-heat-hydration",
    title: "Health in the heat and the crowd",
    body: "Drink water regularly, but only from marked water points or sealed bottles — not from the river or unmarked taps. Rest in shade in the hottest hours (roughly 11:00–16:00). Watch for dizziness, a pounding heart, cramps or confusion in yourself and those with you, and move to a medical camp early rather than pushing on. People with heart conditions, breathing conditions or in late pregnancy should avoid the densest areas and the royal-bath peak.",
    source: "Kumbh Setu knowledge base — health",
    tags: ["health", "heat", "hydration", "water", "shade", "dizzy", "cramp", "medical camp", "heart", "pregnancy", "safe water"],
    intents: ["medical", "water", "information"],
  },
  {
    id: "kb-facilities-overview",
    title: "Facilities you can expect",
    body: "Each zone has at least one medical camp, water points (piaus), sanitation blocks, and a Help Desk; larger zones add food service (annakshetra / langar), cloakrooms for luggage, and lost-and-found. Facilities are marked on the map in the app. Status shown as 'limited' means it is open but busy. If a facility you need is closed or overloaded, ask Setu for the next nearest one rather than waiting.",
    source: "Kumbh Setu facility guide — overview",
    tags: ["facility", "facilities", "medical camp", "water point", "piau", "toilet", "sanitation", "help desk", "food", "langar", "cloakroom", "luggage", "lost and found"],
    intents: ["navigation", "information", "water", "toilet", "food"],
  },
  {
    id: "kb-luggage-cloakroom",
    title: "Luggage and cloakrooms",
    body: "Do not carry large bags to the ghats — the bathing areas are crowded and you cannot watch a bag while you bathe. Use a cloakroom near the transit points or your accommodation to leave luggage, keep the token safe, and take only essentials (ID, phone, a little cash, medication) in a small pouch. Bags left unattended in the crowd may be treated as a security concern and removed.",
    source: "Kumbh Setu facility guide — cloakrooms",
    tags: ["luggage", "bag", "cloakroom", "baggage", "token", "unattended", "belongings", "storage"],
    intents: ["navigation", "safety", "information"],
    audience: ["pilgrim"],
  },
  {
    id: "kb-transport-arrival",
    title: "Getting to and around the Mela",
    body: "Nashik is reached by road, rail (Nashik Road station) and the nearest airports; from the city, a shuttle corridor connects the Godavari ghats with the Trimbakeshwar cluster. Private vehicles are not allowed on ghat approaches during the royal-bath windows — park in the signed parking zone for your cluster and use the shuttle for the last stretch. Allow far more time than usual on high-crowd days, and note your parking zone and row before you walk in.",
    source: "Kumbh Setu knowledge base — transport",
    tags: ["transport", "arrive", "reach", "nashik road", "station", "airport", "shuttle", "bus", "parking", "corridor", "private vehicle", "route"],
    intents: ["transport", "navigation", "information"],
  },
  {
    id: "kb-lost-found-pilgrim",
    title: "If you lose a person or a belonging",
    body: "For a lost person: go to the nearest Help Desk or volunteer and give a description and where you last saw them; the control room matches this against found-person reports and public-address calls. For a lost belonging: report it at a Help Desk or the lost-and-found point with a description and where you think it was lost. Announcements are made from Help Desks; check back there rather than searching the crowd yourself.",
    source: "Kumbh Setu knowledge base — lost & found",
    tags: ["lost", "found", "missing", "belonging", "wallet", "phone", "bag", "person", "help desk", "announcement", "reunite"],
    intents: ["lost_person", "information"],
    audience: ["pilgrim"],
  },
  {
    id: "kb-get-help",
    title: "How to get help quickly",
    body: "The fastest help is the nearest volunteer (in uniform) or Help Desk — every zone has both. In the app, the SOS button sends your location and the type of problem to the nearest volunteer and the control room in one confirmed tap, and keeps trying on a fallback path if the network is weak. Use SOS for anything urgent: a medical problem, someone missing, feeling unsafe, or being caught in dangerous crowding.",
    source: "Kumbh Setu knowledge base — getting help",
    tags: ["help", "sos", "emergency", "volunteer", "help desk", "urgent", "assistance", "police", "uniform"],
    intents: ["emergency", "safety", "information"],
    audience: ["pilgrim"],
  },
  {
    id: "kb-etiquette-rules",
    title: "Rules and etiquette on site",
    body: "Carry a valid photo ID. No plastic bags or single-use plastic; use the bins and keep the ghats clean. Follow the one-way lanes and the directions of volunteers and police, especially near the ghats and on bridges. Photography of people bathing, and of the akharas without permission, is discouraged. Alcohol and drugs are prohibited. Queue patiently on darshan and bathing lines — pushing endangers everyone.",
    source: "Kumbh Setu knowledge base — rules",
    tags: ["rules", "etiquette", "id", "plastic", "photography", "one-way", "alcohol", "queue", "conduct", "prohibited"],
    intents: ["information", "safety"],
  },
  {
    id: "kb-vol-akhara-procession",
    title: "Working a royal-bath / akhara procession (for volunteers)",
    body: "On procession days your job is to hold the route and keep the public flow moving alongside it, not to stop everything. Keep the akhara corridor clear, keep pilgrims to the marked side, and keep them moving — a standing crowd along a barrier is where pressure builds. Coordinate hand-offs with the marshal ahead of and behind you so there are no gaps. Report the tail of the procession passing so downstream stages can reopen the crossing.",
    source: "Kumbh Setu volunteer SOP — Processions (demo knowledge base)",
    tags: ["procession", "akhara", "royal bath", "shahi snan", "route", "corridor", "barrier", "flow", "marshal", "handoff", "crossing"],
    intents: ["crowd", "safety", "volunteer_task"],
    audience: ["volunteer"],
  },
  {
    id: "kb-vol-shift-handover",
    title: "Shift start and handover (for volunteers)",
    body: "At shift start, check your zone brief in Setu, confirm your availability, and note where the nearest medical camp, Help Desk and water points are. Carry your ID and any first-response items issued to you. At handover, brief the next volunteer on anything open: active tasks, a facility that is limited or closed, a spot where crowding has been building, and any ground report you have raised that is not yet resolved.",
    source: "Kumbh Setu volunteer SOP — Shift (demo knowledge base)",
    tags: ["shift", "handover", "start", "brief", "availability", "handoff", "first response", "kit"],
    intents: ["volunteer_task", "information"],
    audience: ["volunteer"],
  },
  {
    id: "kb-vol-suspicious-item",
    title: "Unattended or suspicious items (for volunteers)",
    body: "Do not touch or move an unattended bag. Note its exact location and what it looks like, keep people a few metres back without causing a rush, and report it to the control room with the location — they involve police. If a nearby owner claims it, ask them to open it themselves in your sight. Most unattended bags are simply lost or set down; treat every one calmly but by the same procedure.",
    source: "Kumbh Setu volunteer SOP — Security (demo knowledge base)",
    tags: ["suspicious", "unattended", "bag", "item", "security", "police", "bomb", "package", "cordon"],
    intents: ["safety", "volunteer_task"],
    audience: ["volunteer"],
    steps: [
      "Do not touch or move it. Note its exact location and description.",
      "Move people a few metres back calmly — do not shout or cause a rush.",
      "Report to the control room with the precise location; they bring in police.",
      "If someone says it is theirs, ask them to open it themselves where you can see.",
      "Stay until police or a supervisor takes over.",
    ],
  },
  {
    id: "kb-mgmt-decision-support",
    title: "Reading Kumbh Pulse and acting on it (for the control room)",
    body: "Kumbh Pulse is decision support, not an instruction. A green zone means routine monitoring; yellow means raise attention and preventive readiness; red means a prominent alert for human review. An emerging signal aggregates several weak field reports — its confidence rises with independent corroboration. Verify against the resource feed and a call to the zone before acting, then promote the signal to an incident to dispatch. Every action is written to the event log with actor and time.",
    source: "Kumbh Setu operations guide — decision support (demo)",
    tags: ["pulse", "signal", "emerging", "confidence", "decision", "control room", "promote", "dispatch", "advisory", "corroborate", "band"],
    intents: ["zone_intelligence", "information", "resource"],
    audience: ["management"],
  },
  {
    id: "kb-mgmt-advisory-wording",
    title: "Writing an advisory that helps (for the control room)",
    body: "An advisory reaches every pilgrim phone in scope, so word it as a specific instruction, not a warning. Say what to do and where ('Use Gate 2 for Ramkund; Gate 1 approach is held'), keep it to one or two sentences, and avoid the words 'panic' or 'danger'. Choose the smallest scope that covers the situation — a single zone rather than event-wide — and retract it as soon as it no longer applies so advisories stay trusted.",
    source: "Kumbh Setu operations guide — advisories (demo)",
    tags: ["advisory", "notice", "warning", "wording", "instruction", "scope", "zone", "retract", "pilgrim", "communication"],
    intents: ["information"],
    audience: ["management"],
    steps: [
      "State the action and the place ('Use Gate 2 for Ramkund; Gate 1 is held').",
      "Keep it to one or two sentences; never use 'panic' or 'danger'.",
      "Pick the smallest scope that fits — one zone before event-wide.",
      "Publish, and tell the affected volunteers on the zone channel.",
      "Retract it the moment it no longer applies.",
    ],
  },
];

export interface Retrieval {
  id: string;
  title: string;
  body: string;
  source: string;
  score: number;
}

const STOP = new Set([
  "the", "a", "an", "is", "are", "to", "of", "in", "on", "at", "for", "and", "or",
  "i", "me", "my", "you", "your", "it", "this", "that", "with", "what", "where",
  "how", "do", "does", "can", "should", "near", "nearest", "please", "setu",
]);

function tokens(s: string): string[] {
  return (s.toLowerCase().match(/[a-z]{3,}/g) ?? []).filter((w) => !STOP.has(w));
}

/**
 * Retrieve the most relevant KB passages for a query. Scores on tag hits
 * (weighted), title hits, body hits, and an intent-match bonus. Returns at
 * most `k`, and only entries that clear a floor — so "no verified info" is a
 * real possible outcome (§23).
 */
export function retrieve(
  query: string,
  intent: SetuIntent,
  k = 3,
  audience?: KBAudience
): Retrieval[] {
  const q = tokens(query);
  if (q.length === 0 && intent === "other") return [];

  const scored = KB.map((e) => {
    let score = 0;
    const tagText = e.tags.join(" ");
    const titleTok = new Set(tokens(e.title));
    const bodyTok = new Set(tokens(e.body));

    for (const w of q) {
      if (e.tags.includes(w)) score += 5;
      else if (tagText.includes(w)) score += 3;
      if (titleTok.has(w)) score += 3;
      if (bodyTok.has(w)) score += 1;
    }
    if (e.intents.includes(intent)) score += 4;

    // Nudge role-specific passages toward the asker; gently push away passages
    // written for a different role so a pilgrim doesn't get a volunteer SOP.
    if (audience && e.audience) {
      score += e.audience.includes(audience) ? 3 : -4;
    }

    return { entry: e, score };
  });

  // Floor is above the intent-match bonus alone (4), so a passage needs real
  // keyword overlap to be retrieved — "no verified info" stays a real outcome.
  return scored
    .filter((s) => s.score >= 7)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => ({
      id: s.entry.id,
      title: s.entry.title,
      body: s.entry.body,
      source: s.entry.source,
      score: s.score,
    }));
}
