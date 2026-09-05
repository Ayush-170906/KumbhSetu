// Intent taxonomy (§10) and a transparent keyword/pattern classifier.
//
// This is deliberately rule-based and inspectable. A hosted-LLM provider would
// replace `classifyIntent` with a model call that returns the same `SetuIntent`
// union, so nothing downstream changes.

export type SetuIntent =
  | "navigation"
  | "medical"
  | "lost_person"
  | "water"
  | "food"
  | "toilet"
  | "transport"
  | "accommodation"
  | "religious_information"
  | "accessibility"
  | "safety"
  | "crowd"
  | "complaint"
  | "emergency"
  | "volunteer_task"
  | "resource"
  | "translation"
  | "ground_report"
  | "information"
  | "zone_intelligence"
  | "other";

interface IntentRule {
  intent: SetuIntent;
  /** Any match promotes the intent; weight breaks ties. */
  patterns: RegExp[];
  weight: number;
}

// Order matters only for readability; scoring picks the winner.
const RULES: IntentRule[] = [
  {
    intent: "emergency",
    weight: 10,
    patterns: [
      /\b(unconscious|not breathing|no pulse|collapsed|cardiac|heart attack|seizure|stroke|bleeding badly|drown(ing|ed)?|stampede|crush|not responding|fainted)\b/i,
      /\b(emergency|urgent help|life threatening)\b/i,
    ],
  },
  {
    intent: "translation",
    weight: 8,
    patterns: [
      /\b(translate|translation|interpret|say (this|that) in|tell (him|her|them|the pilgrim)|what did (he|she|they) say)\b/i,
      /\b(help me (talk|communicate|speak) (to|with))\b/i,
      /\b(tamil|marathi|hindi|telugu|kannada|bengali|gujarati)[- ]speaking\b/i,
      /\b(convert|say|put|write|change)\b[^.?!]*\b(in|into|to)\s+(english|hindi|marathi|tamil)\b/i,
      /\b(in|into)\s+(english|hindi|marathi|tamil)\b[^.?!]*\bfor (my|me)\b/i,
      /\bhow (do|to) (i|you) say\b/i,
    ],
  },
  {
    intent: "lost_person",
    weight: 7,
    patterns: [
      /\b(lost|missing|found)\s+(child|kid|boy|girl|man|woman|person|elder|elderly|father|mother|son|daughter)\b/i,
      /\b(separated from (my|her|his|their) family|can'?t find my)\b/i,
      /\bmissing[- ]person\b/i,
    ],
  },
  {
    intent: "ground_report",
    weight: 8,
    patterns: [
      /\b(report|log|flag|raise)\b.*\b(issue|problem|shortage|broken|damaged|overflow|blocked|leak|outage|not arrived|not working|missing|spill)\b/i,
      /\b(there is|there'?s|i see|i found|noticed|spotted)\b.*\b(no water|water shortage|overflowing|broken|damaged|barricade|blocked|garbage|no lights?|leak)\b/i,
      /\breport (a|an|the)\b/i,
      /\b(no water|water shortage|out of water|ran out of|overflow(ing)?|sewage|garbage piling|blocked (path|route|exit)|broken (tap|pipe|barricade|light|gate)|not working|leaking)\b/i,
      /\b(tanker|supply|delivery|bins?|toilets?|lights?)\b.*\b(has ?n'?t|have ?n'?t|not)\s+(arrived|come|been|refilled|cleared|working|fixed)\b/i,
      /\b(people|pilgrims|crowd)\b.*\b(waiting|stuck|stranded)\b/i,
    ],
  },
  {
    intent: "medical",
    weight: 6,
    patterns: [
      /\b(medical camp|first aid|ambulance|doctor|nurse|medicine|injured|injury|wound|fever|dehydrat|heat stroke|dizzy|nausea|vomit|faint|bp|blood pressure|diabetic|asthma|oxygen|wheelchair|stretcher)\b/i,
      /\b(someone (is|feels) (sick|ill|unwell))\b/i,
    ],
  },
  {
    intent: "volunteer_task",
    weight: 6,
    patterns: [
      /\b(my tasks?|pending tasks?|next tasks?|active tasks?|assigned to me|what should i do next|task status|how long has (it|this|the incident) been)\b/i,
      /\bmark\b[^.?!]*\b(arrived|resolved|complete|completed|done|accepted|escalated?)\b/i,
      /\b(accept|decline|resolve|escalate)\b[^.?!]*\b(the|this|my)?\s*task\b/i,
    ],
  },
  {
    intent: "zone_intelligence",
    weight: 6,
    patterns: [
      /\b(what'?s (happening|going on)|situation) (here|around me|in (this|my) (zone|sector|area))\b/i,
      /\b(zone status|sector status|brief me|status report|why is (this|that) zone (red|yellow|amber))\b/i,
      /\b(around here|around me)\b/i,
    ],
  },
  {
    intent: "crowd",
    weight: 5,
    patterns: [
      /\b(crowd|crowding|congestion|density|too many people|packed|bottleneck|surge|pushing|queue is (huge|massive|long))\b/i,
    ],
  },
  {
    intent: "resource",
    weight: 5,
    patterns: [
      /\b(stretcher|barricade|first[- ]aid kit|water tanker|pa system|announcement unit|supplies|inventory|stock|resources?)\b/i,
      /\b(do we have|how many .* (left|available)|run(ning)? (low|out) of)\b/i,
    ],
  },
  {
    intent: "navigation",
    weight: 4,
    patterns: [
      /\b(where is|how do i (get|reach)|route to|directions? to|way to|take me to|nearest (route|path)|which way)\b/i,
    ],
  },
  { intent: "water", weight: 5, patterns: [/\b(drinking water|water point|water station|piyau|piau|thirsty)\b/i] },
  { intent: "toilet", weight: 5, patterns: [/\b(toilet|washroom|restroom|sanitation block|urinal|latrine)\b/i] },
  { intent: "food", weight: 5, patterns: [/\b(food|langar|bhojan|prasad|meal|eat|hungry|annadान|annadan)\b/i] },
  { intent: "transport", weight: 4, patterns: [/\b(bus|shuttle|parking|car|auto|taxi|train|station|pickup point|drop point)\b/i] },
  { intent: "accommodation", weight: 3, patterns: [/\b(accommodation|tent|dharamshala|stay|lodging|where (can|do) i sleep|room)\b/i] },
  {
    intent: "religious_information",
    weight: 3,
    patterns: [/\b(aarti|arti|snan|shahi snan|muhurat|darshan|ghat timing|puja|ritual|temple timing|ramkund|kushavarta)\b/i],
  },
  {
    intent: "accessibility",
    weight: 4,
    patterns: [/\b(wheelchair|disabled|divyang|blind|deaf|elderly assistance|mobility|ramp|can'?t walk|old age)\b/i],
  },
  { intent: "safety", weight: 4, patterns: [/\b(fight|theft|pickpocket|harass|suspicious|unsafe|fire|hazard|electrical|open drain|police)\b/i] },
  { intent: "complaint", weight: 2, patterns: [/\b(complaint|complain|unhappy|rude staff|poor service|dirty|smell)\b/i] },
  {
    intent: "information",
    weight: 1,
    patterns: [/\b(what (is|are)|tell me about|how does|procedure for|protocol for|sop|guideline|rule)\b/i],
  },
];

export interface IntentResult {
  intent: SetuIntent;
  confidence: number; // 0-1
  matched: string[]; // the rule fragments that fired, for transparency
}

export function classifyIntent(text: string): IntentResult {
  const scores = new Map<SetuIntent, number>();
  const matched: string[] = [];

  for (const rule of RULES) {
    for (const p of rule.patterns) {
      const m = text.match(p);
      if (m) {
        scores.set(rule.intent, (scores.get(rule.intent) ?? 0) + rule.weight);
        matched.push(m[0]);
        break;
      }
    }
  }

  if (scores.size === 0) {
    return { intent: "other", confidence: 0.3, matched: [] };
  }

  let best: SetuIntent = "other";
  let bestScore = 0;
  let total = 0;
  for (const [intent, score] of scores) {
    total += score;
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  // Confidence: dominant share of matched weight, floored so a single clear
  // hit still reads as reasonably confident.
  const confidence = Math.min(0.97, 0.45 + (bestScore / Math.max(total, 1)) * 0.5);
  return { intent: best, confidence, matched };
}

/** Intents that should switch the UI into its high-priority layout (§15). */
export function isEmergencyIntent(intent: SetuIntent): boolean {
  return intent === "emergency";
}

export const INTENT_LABELS: Record<SetuIntent, string> = {
  navigation: "Navigation",
  medical: "Medical",
  lost_person: "Lost person",
  water: "Water",
  food: "Food",
  toilet: "Sanitation",
  transport: "Transport",
  accommodation: "Accommodation",
  religious_information: "Religious information",
  accessibility: "Accessibility",
  safety: "Safety",
  crowd: "Crowd",
  complaint: "Complaint",
  emergency: "Emergency",
  volunteer_task: "My tasks",
  resource: "Resources",
  translation: "Translation",
  ground_report: "Ground report",
  information: "Information",
  zone_intelligence: "Zone brief",
  other: "General",
};
