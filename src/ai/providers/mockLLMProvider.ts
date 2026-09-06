// Reasoning provider — deterministic, rule-based, offline (§43/§44/§57).
//
// Implements the SAME `AIProvider` interface a hosted model would. It reads the
// grounded request (retrieved knowledge + a live operational summary + session
// memory) and returns a validated `SetuTurn`: an intent, an urgency, a reply
// keyed by language, an optional proposed tool call, and — for anything
// risky — a confirmation requirement. It never executes a tool.
//
// The prompts a hosted model would use live in src/ai/prompts.ts; this file is
// the honest local stand-in the guidelines require us to be able to explain
// line by line.

import type { LanguageCode } from "@/lib/types";
import type { AIProvider, ProviderInfo } from "./types";
import {
  type SetuTurn,
  type SetuTurnRequest,
  type Urgency,
  type GroundReportDraft,
} from "@/ai/schemas";
import { classifyIntent, type SetuIntent } from "@/ai/intents";
import { KB } from "@/ai/knowledge/kb";
import type { ToolName } from "@/ai/tools/registry";
import type { GroundReportCategory } from "@/lib/types";

// --- multilingual canned lines (data/KB answers stay in the ops language) ----

type Line = Partial<Record<LanguageCode, string>>;
const L = (en: string, hi?: string, mr?: string, ta?: string): Line => ({ en, hi, mr, ta });

const LINES = {
  onIt: L("On it.", "अभी देखता हूँ।", "लगेच बघतो.", "உடனே பார்க்கிறேன்."),
  hereYouGo: L("Here's what I have:", "यह रहा:", "हे पहा:", "இதோ:"),
  needOneThing: L("I need one thing:", "एक बात बतायें:", "एक गोष्ट सांगा:", "ஒரு விஷயம் சொல்லுங்கள்:"),
  noVerified: L(
    "I don't have verified information for that yet. Check with the control room.",
    "इसकी पुष्टि की गई जानकारी अभी मेरे पास नहीं है। नियंत्रण कक्ष से पूछें।",
    "याची खात्रीशीर माहिती माझ्याकडे अजून नाही. नियंत्रण कक्षाला विचारा.",
    "இதற்கான உறுதிசெய்யப்பட்ட தகவல் இன்னும் இல்லை. கட்டுப்பாட்டு அறையிடம் கேளுங்கள்."
  ),
  emergencyLead: L(
    "This may be serious. Quick questions only.",
    "यह गंभीर हो सकता है। सिर्फ ज़रूरी सवाल।",
    "हे गंभीर असू शकते. फक्त आवश्यक प्रश्न.",
    "இது கடுமையாக இருக்கலாம். அவசியமான கேள்விகள் மட்டும்."
  ),
  preparedIncident: L(
    "I've prepared a high-priority incident. Confirm to submit.",
    "मैंने एक उच्च-प्राथमिकता घटना तैयार की है। भेजने के लिए पुष्टि करें।",
    "मी एक उच्च-प्राधान्य घटना तयार केली आहे. पाठवण्यासाठी पुष्टी करा.",
    "நான் ஒரு அவசர சம்பவத்தை தயார் செய்துள்ளேன். சமர்ப்பிக்க உறுதிப்படுத்துங்கள்."
  ),
  reportReady: L(
    "I've structured your report. Review and submit.",
    "मैंने आपकी रिपोर्ट तैयार कर दी है। जाँचें और भेजें।",
    "मी तुमचा अहवाल तयार केला आहे. तपासा आणि पाठवा.",
    "உங்கள் அறிக்கையை தயார் செய்துள்ளேன். சரிபார்த்து சமர்ப்பியுங்கள்."
  ),
  translationOn: L(
    "Live translation is on. Speak, and I'll relay each side.",
    "लाइव अनुवाद चालू है। बोलिए, मैं दोनों ओर पहुँचाऊँगा।",
    "थेट भाषांतर सुरू आहे. बोला, मी दोन्ही बाजू पोहोचवतो.",
    "நேரடி மொழிபெயர்ப்பு இயக்கத்தில் உள்ளது. பேசுங்கள், இரு பக்கமும் தெரிவிக்கிறேன்."
  ),
  askPilgrimLang: L(
    "Which language is the pilgrim speaking?",
    "तीर्थयात्री कौन सी भाषा बोल रहे हैं?",
    "यात्रेकरू कोणती भाषा बोलत आहेत?",
    "யாத்ரீகர் எந்த மொழி பேசுகிறார்?"
  ),
  didntGet: L(
    "I didn't catch that. Try a short phrase, or type it.",
    "समझ नहीं आया। छोटा वाक्य बोलें या टाइप करें।",
    "समजले नाही. छोटे वाक्य बोला किंवा टाइप करा.",
    "புரியவில்லை. சிறு சொற்றொடர் சொல்லுங்கள் அல்லது தட்டச்சு செய்யுங்கள்."
  ),
};

function reply(volunteerLanguage: LanguageCode, line: Line, extra?: string): Partial<Record<LanguageCode, string>> {
  const en = [line.en, extra].filter(Boolean).join(" ");
  const loc = [line[volunteerLanguage] ?? line.en, extra].filter(Boolean).join(" ");
  const out: Partial<Record<LanguageCode, string>> = { en };
  if (volunteerLanguage !== "en") out[volunteerLanguage] = loc;
  return out;
}

// --- keyword maps ----------------------------------------------------------

const EMERGENCY_RE =
  /\b(unconscious|not breathing|no pulse|collapsed|cardiac|heart attack|seizure|stroke|bleeding badly|choking|drowning|stampede|crush(ed|ing)?|not responding|fainted|fell and)\b/i;

// "Give me the steps / what do I do IF …" — a training/procedure question, not a
// live report. Routed to handleProcedure so Setu returns a numbered SOP even
// when the sentence also contains emergency words ("what if someone faints").
const PROCEDURE_RE = new RegExp(
  [
    /what (should|do|would|can) i do (if|when|for|about|next|now|here)/,
    /what (do|should) i do\s*[?.!]*$/, // trailing "…, what do I do?"
    /what happens if|what if (someone|somebody|a |an |there)/,
    /how (do|should|can|would) i (handle|deal with|respond to|react to|manage|help|assist|support|guide|proceed|escalate|report)/,
    /how to (handle|deal with|respond|react|manage|help|assist|support|guide|proceed|escalate|report)/,
    /\bsteps?\b.{0,12}\b(for|to|when|if)\b|give me the steps|list the steps|step by step/,
    /walk me through|talk me through|guide me through|take me through/,
    /(procedure|protocol|process|sop|checklist)\b.{0,10}\b(for|to|when|is|when)\b/,
    /\b(the |what.?s the |what is the )?(escalation|reporting|dispatch|handover|radio|evacuation|first[- ]aid) (procedure|protocol|process|steps?)/,
    /what.?s the (right |correct )?(procedure|protocol|process|sop|first step|next step)/,
  ].map((r) => r.source).join("|"),
  "i"
);

/** True when the message reads as something happening NOW in front of the
 *  volunteer (not a "what if" question) — then the emergency flow wins. */
function looksLive(text: string): boolean {
  return (
    EMERGENCY_RE.test(text) &&
    /\b(here|right now|in front of me|next to me|right here|at (the )?(gate|ghat|camp|block|steps|bridge)|near me)\b/i.test(text) &&
    !/\bwhat (if|should i do if|do i do if|happens if)\b/i.test(text)
  );
}

const OTHER_LANG_RE: [RegExp, LanguageCode][] = [
  [/\btamil\b/i, "ta"],
  [/\bhindi\b/i, "hi"],
  [/\bmarathi\b/i, "mr"],
  [/\benglish\b/i, "en"],
];

const FACILITY_INTENT_TYPE: Partial<Record<SetuIntent, string>> = {
  medical: "medical",
  water: "water",
  toilet: "toilet",
  food: "food",
  transport: "parking",
};

/** For a bare "where is …" — pull the facility type out of the sentence. */
function sniffFacilityType(text: string): string | undefined {
  if (/\b(toilet|washroom|restroom|latrine|sanitation)\b/i.test(text)) return "toilet";
  if (/\b(water point|drinking water|piau|piyau)\b/i.test(text)) return "water";
  if (/\b(medical|first aid|doctor|camp|ambulance)\b/i.test(text)) return "medical";
  if (/\b(food|langar|meal|prasad)\b/i.test(text)) return "food";
  if (/\b(parking|car park|shuttle|bus)\b/i.test(text)) return "parking";
  if (/\b(help desk|helpdesk|information desk|lost and found)\b/i.test(text)) return "help_desk";
  return undefined;
}

const REPORT_CATEGORY_RE: [RegExp, GroundReportCategory][] = [
  [/\bwater|tanker|piau|piyau|thirsty|drinking water\b/i, "water"],
  [/\btoilet|sanitation|drain|sewage|overflow|garbage|waste|latrine\b/i, "toilet"],
  [/\bfood|langar|meal|prasad|bhojan\b/i, "food"],
  [/\bcrowd|congestion|surge|bottleneck|packed|pushing\b/i, "crowd"],
  [/\bbarricade|fence|railing|sign|board|light|pole|structure|broken|damaged|hazard\b/i, "infrastructure"],
  [/\bfight|theft|unsafe|fire|electrical|suspicious|harass\b/i, "safety"],
  [/\bwheelchair|ramp|divyang|disabled|elderly access\b/i, "accessibility"],
  [/\bmedical|first aid|injury|sick\b/i, "medical"],
];

function detectCategory(text: string): GroundReportCategory {
  for (const [re, cat] of REPORT_CATEGORY_RE) if (re.test(text)) return cat;
  return "other";
}

function firstNumber(text: string): number | undefined {
  // Prefer a count that reads as a headcount…
  const headcount =
    text.match(/(?:about|around|approx(?:\.|imately)?|roughly|~|nearly|some)\s+(\d{1,5})/i) ||
    text.match(/(\d{1,5})\s*(?:\+|or so)?\s*(?:people|persons?|pilgrims?|folks?|waiting|affected|stuck|stranded|in the queue)/i);
  if (headcount) return Number(headcount[1]);

  // …otherwise any number that isn't part of a place name (Gate 4, Zone 04, Ghat 2).
  const re = /(\d{1,5})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const before = text.slice(Math.max(0, m.index - 12), m.index).toLowerCase();
    if (/\b(gate|ghat|zone|camp|block|sector|tower|lane|z0|ward|stall|platform)\s*$/.test(before)) continue;
    return Number(m[1]);
  }

  const words: Record<string, number> = { "a few": 5, "a dozen": 12, "a couple": 2, several: 8, dozens: 40 };
  for (const [w, n] of Object.entries(words)) if (text.toLowerCase().includes(w)) return n;
  if (/\bhundreds\b/i.test(text)) return 200;
  if (/\bthousands\b/i.test(text)) return 1000;
  return undefined;
}

function severityFrom(text: string, urgency: Urgency, people?: number): "low" | "moderate" | "high" {
  if (urgency === "emergency") return "high";
  if (people !== undefined && people >= 100) return "high";
  if (/\b(serious|urgent|danger|many|hundreds|large|badly|critical|surging)\b/i.test(text)) return "high";
  if (people !== undefined && people >= 30) return "moderate";
  if (/\b(minor|small|slight|just one|a couple)\b/i.test(text)) return "low";
  return "moderate";
}

// --- provider ------------------------------------------------------------

export class MockLLMProvider implements AIProvider {
  readonly info: ProviderInfo = { name: "Setu rule engine (local)", simulated: true };

  async planTurn(req: SetuTurnRequest): Promise<SetuTurn> {
    const text = req.message.trim();
    const lang = req.volunteerLanguage;
    const lower = text.toLowerCase();
    const cls = classifyIntent(text);
    let intent = cls.intent;

    // Setu just asked which language the pilgrim speaks — read this turn as the
    // answer (e.g. a bare "marathi") unless it's an emergency.
    if (req.memory.awaitingTranslationLanguage && !EMERGENCY_RE.test(text)) {
      intent = "translation";
    }

    // Continue an in-progress ground report even if this turn's words alone
    // wouldn't classify as one.
    if (req.memory.pendingReportCategory && intent !== "emergency" && intent !== "translation") {
      intent = "ground_report";
    }
    // Continue translation mode: while a live session is active, plain speech
    // is content to relay — NOT a new command — unless it's an explicit
    // instruction to Setu (emergency, end translation, raise an incident, file
    // a report, check tasks).
    if (req.memory.translationPair) {
      const isSetuCommand =
        EMERGENCY_RE.test(text) ||
        /\b(stop|end|exit|finish)\b[^.?!]*\btranslat/i.test(lower) ||
        /\bcreate (an? )?incident\b|\braise (an? )?incident\b/i.test(lower) ||
        /\breport (a|an|the)\b/i.test(lower) ||
        /\bmy tasks?\b|\bmark (arrived|resolved|done)\b/i.test(lower);
      if (!isSetuCommand) intent = "translation";
    }

    // "What do I do if… / give me the steps for…" — a procedure question. Answer
    // with the SOP as a numbered list, even if it mentions emergency words.
    // (An actual live report — "someone HAS collapsed at Gate 4" — has no "if"
    // and still routes to handleEmergency below.)
    if (
      PROCEDURE_RE.test(text) &&
      !looksLive(text) &&
      !req.memory.pendingReportCategory &&
      !req.memory.translationPair &&
      !req.memory.awaitingTranslationLanguage
    ) {
      return this.handleProcedure(req, text, lang);
    }

    // Asking for a precise live figure Setu cannot have (headcount, exact number
    // right now). Do not answer from static knowledge — say so (§23).
    if (
      /\b(exact|precise|current|live|real[- ]time)\b[^.?!]*\b(count|number|figure|headcount|head count|tally|total|how many)\b/i.test(text) ||
      /\bhow many people\b[^.?!]*\b(now|right now|currently|at (the )?(moment|ghat|gate))\b/i.test(text) ||
      /\b(headcount|head count)\b[^.?!]*\b(now|right now|currently)\b/i.test(text)
    ) {
      return { ...this.base(intent, "routine"), reply: reply(lang, LINES.noVerified) };
    }

    const urgency: Urgency = EMERGENCY_RE.test(text) || intent === "emergency" ? "emergency" : intent === "medical" || intent === "crowd" || intent === "safety" ? "elevated" : "routine";

    // Persona-specific routing. Translation and knowledge/procedure answers are
    // shared; what differs is what each role is allowed to *do*.
    if (req.persona === "pilgrim" && intent !== "translation") {
      const t = this.pilgrimTurn(req, intent, text, lang, urgency);
      if (t) return t;
    }
    if (req.persona === "management" && intent !== "translation") {
      const t = this.managementTurn(req, intent, text, lang, lower);
      if (t) return t;
    }

    switch (intent) {
      case "emergency":
        return this.handleEmergency(req, text, lang);
      case "translation":
        return this.handleTranslation(req, text, lang, lower);
      case "ground_report":
        return this.handleGroundReport(req, text, lang, urgency);
      case "lost_person":
        return this.handleLostPerson(req, text, lang);
      case "volunteer_task":
        return this.handleTask(req, lower, lang);
      case "zone_intelligence":
        return this.handleZone(req, lang);
      case "resource":
        return this.readTool(req, lang, "get_resource_status", {}, "Resource records");
      case "navigation":
      case "water":
      case "toilet":
      case "food":
      case "transport": {
        const ftype = FACILITY_INTENT_TYPE[intent] ?? sniffFacilityType(text);
        if (ftype) return this.readTool(req, lang, "find_nearest_facility", { type: ftype }, "Live facility database");
        return this.knowledgeAnswer(req, lang, intent);
      }
      case "medical":
        return this.handleMedical(req, text, lang);
      case "crowd":
      case "safety":
      case "accessibility":
      case "religious_information":
      case "information":
        return this.knowledgeAnswer(req, lang, intent);
      default:
        return this.fallback(req, lang);
    }
  }

  // ---- handlers ---------------------------------------------------------

  private base(intent: SetuIntent, urgency: Urgency): Pick<SetuTurn, "intent" | "urgency" | "requiresConfirmation"> {
    return { intent, urgency, requiresConfirmation: false };
  }

  // ---- PILGRIM persona ------------------------------------------------
  // Pilgrims get answers and gentle direction, and are handed off to the SOS /
  // Report / Lost-&-Found screens for anything that changes operational state —
  // they never file a control-room incident from the assistant.
  private pilgrimTurn(
    req: SetuTurnRequest,
    intent: SetuIntent,
    text: string,
    lang: LanguageCode,
    urgency: Urgency
  ): SetuTurn | null {
    if (intent === "emergency" || urgency === "emergency" || /\bhelp me\b|\bi need help\b/i.test(text)) {
      return {
        ...this.base("emergency", "emergency"),
        reply: reply(
          lang,
          L(
            "This sounds urgent. Use SOS — one tap sends your location and the problem to the nearest volunteer and the control room, and keeps trying if the signal is weak.",
            "यह ज़रूरी लगता है। एसओएस दबाएँ — एक टैप में आपकी लोकेशन और समस्या नज़दीकी स्वयंसेवक और नियंत्रण कक्ष तक पहुँच जाती है।",
            "हे तातडीचे वाटते. एसओएस दाबा — एका टॅपमध्ये तुमचे ठिकाण आणि समस्या जवळच्या स्वयंसेवक व नियंत्रण कक्षाला पोहोचते.",
            "இது அவசரமாகத் தெரிகிறது. SOS ஐ அழுத்துங்கள் — ஒரே தட்டலில் உங்கள் இருப்பிடமும் பிரச்சினையும் அருகிலுள்ள தொண்டர் மற்றும் கட்டுப்பாட்டு அறைக்குச் செல்லும்."
          )
        ),
        navHint: { screen: "sos-type", label: "Open SOS now" },
        provenance: "Source: Kumbh Setu — getting help",
      };
    }

    if (intent === "lost_person") {
      const kb = req.context.knowledge.find((k) => k.id === "kb-lost-found-pilgrim" || k.id === "kb-children-safety");
      return {
        ...this.base("lost_person", "elevated"),
        reply: {
          en:
            (kb?.body ??
              "Go to the nearest Help Desk or volunteer and give a description and where you last saw them. The control room matches this against found-person reports and makes announcements.") ,
          ...(lang !== "en" ? { [lang]: kb?.body ?? "" } : {}),
        },
        navHint: { screen: "lost-found", label: "Open Lost & Found" },
        provenance: kb ? `Source: ${kb.source}` : "Source: Kumbh Setu — lost & found",
      };
    }

    if (intent === "ground_report" || intent === "complaint") {
      return {
        ...this.base("ground_report", "routine"),
        reply: reply(
          lang,
          L(
            "You can report this with a photo — it goes to the control room as a case, no need to find a desk.",
            "आप इसे फ़ोटो के साथ दर्ज कर सकते हैं — यह नियंत्रण कक्ष तक केस के रूप में पहुँचता है।",
            "तुम्ही हे फोटोसह नोंदवू शकता — ते नियंत्रण कक्षाला केस म्हणून पोहोचते.",
            "இதை புகைப்படத்துடன் பதிவு செய்யலாம் — இது கட்டுப்பாட்டு அறைக்கு வழக்காகச் செல்லும்."
          )
        ),
        navHint: { screen: "report-issue", label: "Report an issue" },
      };
    }

    // Facilities: answer with the nearest one AND offer the full list.
    const ftype = FACILITY_INTENT_TYPE[intent] ?? sniffFacilityType(text);
    if (ftype) {
      return {
        ...this.base(intent, "routine"),
        reply: reply(lang, LINES.onIt),
        tool: { name: "find_nearest_facility", arguments: { type: ftype } },
        navHint: { screen: "facilities", label: "See all facilities" },
        provenance: "Source: Live facility database",
      };
    }

    if (intent === "crowd" || intent === "zone_intelligence") {
      return {
        ...this.base("crowd", "routine"),
        reply: reply(lang, LINES.onIt),
        tool: { name: "get_crowd_status", arguments: {} },
        provenance: "Source: live crowd reading · synthetic demo data",
      };
    }

    // Anything else (religious info, transport facts, general questions,
    // translation) is fine on the shared path.
    return null;
  }

  // ---- MANAGEMENT persona ------------------------------------------------
  private managementTurn(
    req: SetuTurnRequest,
    intent: SetuIntent,
    text: string,
    lang: LanguageCode,
    lower: string
  ): SetuTurn | null {
    const readTurn = (name: ToolName, args: Record<string, unknown>, prov: string): SetuTurn => ({
      ...this.base(intent === "other" ? "zone_intelligence" : intent, "routine"),
      reply: reply(lang, LINES.hereYouGo),
      tool: { name, arguments: args },
      provenance: `Source: ${prov}`,
    });

    if (/\b(signal|signals|emerging|corroborat\w*)\b/i.test(lower) && !/\bpromote|act on\b/i.test(lower)) {
      return readTurn("get_emerging_signals", {}, "Kumbh Pulse · aggregated field reports");
    }

    if (/\bpromote\b|\bact on (the|this|that) signal\b|\bturn (the|this|that) signal into\b|\bdispatch (on|for) (the|this) signal\b/i.test(lower)) {
      const cat = detectCategory(text);
      return {
        ...this.base("zone_intelligence", "elevated"),
        reply: reply(lang, LINES.onIt),
        tool: { name: "promote_signal_to_incident", arguments: cat !== "other" ? { category: cat } : {} },
        requiresConfirmation: true,
        confirmationPrompt: "Promote the emerging signal to a dispatchable incident and page the nearest fit volunteer?",
        provenance: "Kumbh Pulse → dispatch",
      };
    }

    if (/\b(advisory|advise the|notice to|announce|broadcast|tell the pilgrims|put out a|issue a)\b/i.test(lower)) {
      const parsed = this.parseAdvisory(text, req.context);
      if (!parsed.message) {
        return {
          ...this.base("information", "routine"),
          reply: reply(lang, L("I can draft an advisory.", "मैं एक सूचना तैयार कर सकता हूँ।", "मी एक सूचना तयार करू शकतो.", "நான் ஒரு அறிவிப்பை உருவாக்க முடியும்.")),
          followUp: "Tell me what it should say, and which zone (or 'all zones').",
        };
      }
      return {
        ...this.base("information", "elevated"),
        reply: reply(lang, L("Here's the advisory ready to publish:", "यह प्रकाशित करने के लिए तैयार सूचना है:", "प्रकाशित करण्यासाठी तयार सूचना:", "வெளியிட தயாராக உள்ள அறிவிப்பு:"), `“${parsed.message}” → ${parsed.scopeLabel}`),
        tool: {
          name: "publish_advisory",
          arguments: { scope: parsed.scope, severity: parsed.severity, message: parsed.message },
        },
        requiresConfirmation: true,
        confirmationPrompt: `Publish this ${parsed.severity} to ${parsed.scopeLabel}? It goes live on every pilgrim phone in scope.`,
        provenance: "Kumbh Setu operations guide — advisories",
      };
    }

    if (/\bvolunteers?\b/i.test(lower) && /\b(available|free|spare|how many|roster|on task|deployed)\b/i.test(lower)) {
      return readTurn("get_available_volunteers", {}, "Volunteer roster");
    }

    if (
      intent === "zone_intelligence" ||
      /\b(overview|sitrep|situation report|status report|whole (picture|ground)|brief me|everything|across the (site|ground)|all zones|which zones|zones at risk|at risk|hotspot|red zones|how (are|is) (things|it) (looking|going))\b/i.test(lower)
    ) {
      // If they named a specific zone, let the shared single-zone tool handle it.
      const namedZone = req.context.operational && /\b(ghat|kushavarta|transit|pontoon|tapovan|ramkund)\b/i.test(lower);
      if (!namedZone) {
        return readTurn("get_operational_overview", {}, "Live operational state · synthetic demo data");
      }
    }

    return null;
  }

  private parseAdvisory(
    text: string,
    context: SetuTurnRequest["context"]
  ): { message: string; scope: string; scopeLabel: string; severity: "info" | "advisory" | "warning" } {
    const severity: "info" | "advisory" | "warning" = /\b(police warning|warning|urgent|danger)\b/i.test(text)
      ? "warning"
      : /\b(notice|fyi|info|information)\b/i.test(text)
      ? "info"
      : "advisory";

    // scope: an explicit "all/everyone/event-wide", or a named zone.
    let scope = "all";
    let scopeLabel = "all zones";
    if (!/\b(all zones|everyone|event[- ]wide|whole (event|site)|all pilgrims)\b/i.test(text)) {
      const zoneWord = text.match(/\b(ghat\s*\d|kushavarta|transit corridor|pontoon bridge|tapovan|ramkund|ghat \d)\b/i);
      if (zoneWord) {
        scope = zoneWord[0].replace(/\s+/g, " ").trim();
        scopeLabel = scope;
      }
    }

    // message: prefer a quoted string, then text after "say/saying/that says/:".
    const quoted = text.match(/["'“”‘’](.+?)["'“”‘’]/);
    let message = quoted?.[1]?.trim() ?? "";
    if (!message) {
      const after = text.match(/\b(?:saying|that says|to say|which says|message|:)\s*[:\-—]?\s*(.+)$/i);
      if (after) message = after[1].trim().replace(/^["'“”‘’]|["'“”‘’]$/g, "");
    }
    // strip a leading "publish/draft an advisory for X" wrapper if the whole
    // thing was one sentence with the instruction inline
    if (!message && !/\bfor (ghat|all|zone|kushavarta|transit|pontoon|tapovan|ramkund)\b/i.test(text)) {
      const stripped = text
        .replace(/^.*?\b(advisory|notice|announce(ment)?|broadcast)\b\s*(for [a-z0-9 ]+?)?\s*[:\-—]?\s*/i, "")
        .trim();
      if (stripped.split(/\s+/).length >= 3) message = stripped;
    }
    void context;
    return { message, scope, scopeLabel, severity };
  }

  private handleEmergency(req: SetuTurnRequest, text: string, lang: LanguageCode): SetuTurn {
    const hasLocation = /\b(here|gate|ghat|near|at|block|camp|bridge|sector|zone)\b/i.test(text) || Boolean(req.memory.entities.location);
    const kb = req.context.knowledge.find((k) => k.id.startsWith("kb-medical") || k.id === "kb-crowd-pressure");
    const isCrowd = /\b(stampede|crush|surge|pressure|too many people)\b/i.test(text);

    if (!hasLocation) {
      return {
        ...this.base("emergency", "emergency"),
        reply: reply(lang, LINES.emergencyLead),
        followUp: "Where are you? Nearest gate, ghat or landmark.",
        provenance: kb ? `Guidance: ${kb.source}` : undefined,
      };
    }

    const summary = `Setu emergency report: ${text}`.slice(0, 240);
    return {
      ...this.base("emergency", "emergency"),
      reply: reply(lang, LINES.preparedIncident, kb ? kb.body.split(".")[0] + "." : undefined),
      tool: {
        name: "create_incident",
        arguments: {
          type: isCrowd ? "crowd_pressure" : "medical",
          severity: "critical",
          summary,
          zoneId: req.memory.entities.zoneId ?? undefined,
          preferredLanguage: req.memory.translationPair?.other,
          dispatch: true,
        },
      },
      requiresConfirmation: true,
      confirmationPrompt: `Create a CRITICAL ${isCrowd ? "crowd-pressure" : "medical"} incident and page the nearest responder + control room now?`,
      provenance: kb ? `Guidance: ${kb.source}` : undefined,
    };
  }

  private handleTranslation(req: SetuTurnRequest, text: string, lang: LanguageCode, lower: string): SetuTurn {
    // ---- one-shot translation ("translate X into Marathi", "how do I say X in Tamil",
    //      "... in Hindi for my understanding") — no session needed.
    const oneShot = this.parseOneShotTranslation(text, lang, req.memory.translationPair?.other);
    if (oneShot && !/\bhelp me (talk|communicate|speak)\b/i.test(lower)) {
      if (!oneShot.payload) {
        return {
          ...this.base("translation", "routine"),
          reply: reply(lang, L("What should I translate?", "क्या अनुवाद करूँ?", "काय भाषांतर करू?", "எதை மொழிபெயர்க்கட்டும்?")),
          followUp: `Give me the phrase, and the language (e.g. "into Marathi").`,
        };
      }
      return {
        ...this.base("translation", "routine"),
        reply: reply(lang, L("Translating…", "अनुवाद…", "भाषांतर…", "மொழிபெயர்ப்பு…")),
        tool: { name: "translate_text", arguments: { text: oneShot.payload, to: oneShot.to } },
        provenance: "Auto-detects the source language · offline phrasebook",
      };
    }

    if (/\b(stop|end|exit|done|finished)\b/i.test(lower) && req.memory.translationPair) {
      return {
        ...this.base("translation", "routine"),
        reply: reply(lang, L("Translation ended.", "अनुवाद समाप्त।", "भाषांतर संपले.", "மொழிபெயர்ப்பு முடிந்தது.")),
        exitTranslationMode: true,
        tool: { name: "end_translation_session", arguments: {} },
      };
    }

    // Already in a session: this text is content to relay.
    if (req.memory.translationPair) {
      const pair = req.memory.translationPair;
      return {
        ...this.base("translation", "routine"),
        reply: reply(lang, L("Relaying…", "पहुँचा रहा हूँ…", "पोहोचवतो…", "தெரிவிக்கிறேன்…")),
        tool: { name: "translate_text", arguments: { text, to: pair.other, from: pair.volunteer } },
        provenance: "Offline field phrasebook",
      };
    }

    // Establishing a session.
    let other: LanguageCode | undefined;
    for (const [re, code] of OTHER_LANG_RE) if (re.test(text)) other = code;
    if (!other) {
      return {
        ...this.base("translation", "routine"),
        reply: reply(lang, LINES.askPilgrimLang),
        followUp: "Say: Tamil, Hindi, Marathi or English.",
      };
    }
    return {
      ...this.base("translation", "routine"),
      reply: reply(lang, LINES.translationOn),
      enterTranslationMode: { other },
      tool: { name: "start_translation_session", arguments: { other } },
    };
  }

  private parseOneShotTranslation(
    text: string,
    volunteerLang: LanguageCode,
    sessionOther?: LanguageCode
  ): { payload: string; to: LanguageCode } | null {
    const LANG_WORD: Record<string, LanguageCode> = {
      english: "en",
      hindi: "hi",
      marathi: "mr",
      tamil: "ta",
    };
    const isCommand = /\b(translate|convert|say|how (do|to) (i|you) say|what('| i)?s .+ in\b)\b/i.test(text);
    const targetM = text.match(/\b(?:in|into|to)\s+(english|hindi|marathi|tamil)\b/i);
    const forMe = /\bfor (my|me)\b|\bfor my understanding\b/i.test(text);
    if (!isCommand && !targetM && !forMe) return null;

    let to: LanguageCode | undefined = targetM ? LANG_WORD[targetM[1].toLowerCase()] : undefined;
    if (!to && forMe) to = volunteerLang;
    if (!to) to = sessionOther ?? (volunteerLang !== "en" ? "en" : undefined);
    if (!to) return null;

    // quoted payload always wins
    const quoted = text.match(/["'“”‘’](.+?)["'“”‘’]/);
    if (quoted) return { payload: quoted[1].trim(), to };

    const clean = (s: string) => s.replace(/^[\s,;:.\-—]+|[\s,;:.\-—?!]+$/g, "").trim();

    // Case A: the phrase comes BEFORE a trailing command clause
    //   "I want a hotel, convert this into Marathi" / "... in Marathi for my understanding"
    const trailing =
      text.match(/^(.*?)[\s,;-]+(?:can you\s+)?(?:please\s+)?(?:convert|translate|say|put|change|write)\s+(?:this|that|it)\b/i) ||
      text.match(/^(.*?)[\s,;-]+(?:in|into)\s+(?:english|hindi|marathi|tamil)\b/i) ||
      text.match(/^(.*?)[\s,;-]+for (?:my|me)\b/i);
    if (trailing && clean(trailing[1]).split(/\s+/).length >= 2) {
      return { payload: clean(trailing[1]), to };
    }

    // Case B: leading command — "translate X into Marathi", "how do I say X in Tamil"
    let payload = text
      .replace(/^.*?\b(?:translate|convert|say|put|change|write)\b\s*(?:this|that|the following|it|the phrase|the sentence)?\s*(?:that|:|-|—)?\s*/i, "")
      .replace(/\bhow (?:do|to) (?:i|you) say\b\s*(?:that|:)?\s*/i, "")
      .replace(/\bwhat(?:'| i)?s\b\s*/i, "")
      .replace(/\b(?:in|into|to)\s+(?:english|hindi|marathi|tamil)\b.*$/i, "")
      .replace(/\bfor (?:my|me)\b.*$/i, "");
    payload = clean(payload);
    return { payload, to };
  }

  private handleGroundReport(req: SetuTurnRequest, text: string, lang: LanguageCode, urgency: Urgency): SetuTurn {
    const category = req.memory.pendingReportCategory ?? detectCategory(text);
    const people = firstNumber(text);
    const severity = severityFrom(text, urgency, people);

    // Is there enough substance to summarise?
    const meaningful = text
      .replace(/^\s*(please\s+)?(can you\s+)?(report|log|flag|raise|note)\b/i, "")
      .replace(/^\s*(that|this|the following|it|a|an|the)\s+/i, "")
      .replace(/\b(issue|problem)\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    const hasWhat = meaningful.length >= 8;

    const missing: string[] = [];
    if (!hasWhat) missing.push("what you observed");
    if (people === undefined && (category === "water" || category === "food" || category === "crowd" || category === "toilet")) {
      missing.push("roughly how many people are affected");
    }

    const draft: GroundReportDraft = {
      category,
      summary: hasWhat ? this.summariseReport(category, meaningful, people) : "",
      detail: hasWhat ? text : undefined,
      severity,
      estimatedPeopleAffected: people,
      missing,
      aiConfidence: hasWhat ? 0.82 : 0.4,
    };

    if (missing.length > 0) {
      return {
        ...this.base("ground_report", urgency),
        reply: reply(lang, LINES.needOneThing),
        followUp: missing.length === 1 ? `Tell me ${missing[0]}.` : `Tell me: ${missing.join(", and ")}.`,
        reportDraft: draft,
      };
    }

    return {
      ...this.base("ground_report", urgency),
      reply: reply(lang, LINES.reportReady),
      reportDraft: draft,
      tool: {
        name: "create_ground_report",
        arguments: {
          category: draft.category,
          summary: draft.summary,
          detail: draft.detail,
          severity: draft.severity,
          estimatedPeopleAffected: draft.estimatedPeopleAffected,
          aiConfidence: draft.aiConfidence,
        },
      },
      requiresConfirmation: true,
      confirmationPrompt: "Submit this field report to the control room?",
      provenance: "Structured by Setu from your words + GPS + time",
    };
  }

  private summariseReport(category: GroundReportCategory, text: string, people?: number): string {
    const head: Record<GroundReportCategory, string> = {
      water: "Water issue",
      food: "Food service issue",
      toilet: "Sanitation issue",
      medical: "Medical concern",
      crowd: "Crowd build-up",
      infrastructure: "Infrastructure fault",
      safety: "Safety concern",
      lost_person: "Lost person",
      accessibility: "Accessibility gap",
      other: "Field observation",
    };
    const clause = text.length > 120 ? text.slice(0, 117) + "…" : text;
    return `${head[category]}: ${clause}${people ? ` (~${people} affected)` : ""}`;
  }

  private handleLostPerson(req: SetuTurnRequest, text: string, lang: LanguageCode): SetuTurn {
    const kb = req.context.knowledge.find((k) => k.id === "kb-lost-child");
    const wantsCase = /\b(create|start|open|register|file)\b.*\b(case|report|record)\b/i.test(text) || /\bmissing[- ]person\b/i.test(text);
    const details = [
      req.memory.entities.subject,
      req.memory.entities.name,
      req.memory.entities.location,
      /\b(wearing|shirt|dress|red|blue|green|yellow|black|white|frock|kurta)\b/i.test(text) ? "clothing noted" : undefined,
      /\b(year|yr|age|old)\b/i.test(text) ? "age noted" : undefined,
    ].filter(Boolean);

    if (!wantsCase && details.length < 2) {
      return {
        ...this.base("lost_person", "elevated"),
        reply: reply(
          lang,
          L(
            "I can open a missing-person case. Keep the person with you.",
            "मैं गुमशुदगी का मामला दर्ज कर सकता हूँ। व्यक्ति को अपने साथ रखें।",
            "मी हरवल्याची नोंद उघडू शकतो. व्यक्तीला सोबत ठेवा.",
            "தொலைந்தவர் வழக்கை திறக்க முடியும். நபரை உங்களுடன் வைத்திருங்கள்."
          )
        ),
        followUp: "Give me: approx age, what they're wearing, and where they were last seen.",
        provenance: kb ? `Guidance: ${kb.source}` : undefined,
      };
    }

    const summary =
      `Missing person — ${req.memory.entities.subject ?? "person"}${req.memory.entities.name ? ` (${req.memory.entities.name})` : ""}. ${text}`.slice(0, 240);
    return {
      ...this.base("lost_person", "elevated"),
      reply: reply(lang, L("I've prepared the case. Confirm to open it.", "मामला तैयार है। खोलने के लिए पुष्टि करें।", "नोंद तयार आहे. उघडण्यासाठी पुष्टी करा.", "வழக்கு தயார். திறக்க உறுதிப்படுத்துங்கள்.")),
      tool: {
        name: "create_incident",
        arguments: {
          type: "lost_person",
          severity: "moderate",
          summary,
          preferredLanguage: req.memory.translationPair?.other,
          dispatch: true,
        },
      },
      requiresConfirmation: true,
      confirmationPrompt: "Open a HIGH-priority missing-person case and notify the reunification desk?",
      provenance: kb ? `Guidance: ${kb.source}` : undefined,
    };
  }

  private handleTask(req: SetuTurnRequest, lower: string, lang: LanguageCode): SetuTurn {
    // Accept words between "mark" and the state ("mark this task resolved"), and
    // match on stems so "resolved"/"arrived" work.
    const stem = lower.match(/\b(?:mark\b[^.?!]*?\b)?(accept|arriv|resolv|escalat|complet|done)\w*/);
    const action = stem
      ? stem[1].startsWith("arriv")
        ? "arrive"
        : stem[1].startsWith("resolv") || stem[1].startsWith("complet") || stem[1] === "done"
        ? "resolve"
        : stem[1].startsWith("accept")
        ? "accept"
        : "escalate"
      : undefined;

    if (action) {
      const risky = action === "resolve" || action === "escalate";
      return {
        ...this.base("volunteer_task", "routine"),
        reply: reply(lang, LINES.onIt),
        tool: { name: "update_task_status", arguments: { status: action } },
        requiresConfirmation: risky,
        confirmationPrompt: risky ? `Mark your active task "${action}d"? This updates the incident and the control room.` : undefined,
      };
    }

    if (/\bnext\b/.test(lower) || /\bwhat should i do\b/.test(lower)) {
      return this.readTool(req, lang, "get_my_tasks", {}, "Your task queue", "If you're clear, the next dispatch will come to you automatically.");
    }
    return this.readTool(req, lang, "get_my_tasks", {}, "Your task queue");
  }

  private handleZone(req: SetuTurnRequest, lang: LanguageCode): SetuTurn {
    return {
      ...this.base("zone_intelligence", "routine"),
      reply: reply(lang, LINES.hereYouGo),
      tool: { name: "get_zone_status", arguments: {} },
      provenance: "Live operational state · synthetic demo data",
    };
  }

  private handleMedical(req: SetuTurnRequest, text: string, lang: LanguageCode): SetuTurn {
    const wantsCamp = /\b(where|nearest|find|route|located|how do i (get|reach))\b/i.test(text);
    if (wantsCamp) {
      return this.readTool(req, lang, "find_nearest_facility", { type: "medical" }, "Live facility database");
    }
    // Describes a person needing help → KB guidance + offer to raise it.
    const kb = req.context.knowledge.find((k) => k.id.startsWith("kb-medical"));
    return {
      ...this.base("medical", "elevated"),
      reply: reply(lang, L("Here's what to do.", "यह करें।", "हे करा.", "இதைச் செய்யுங்கள்."), kb?.body),
      followUp: "If it's not improving, say \"raise a medical incident\" and I'll page the response team.",
      provenance: kb ? `Source: ${kb.source}` : "Source: verified knowledge base",
    };
  }

  private knowledgeAnswer(req: SetuTurnRequest, lang: LanguageCode, intent: SetuIntent): SetuTurn {
    const hit = req.context.knowledge[0];
    if (!hit) {
      return { ...this.base(intent, "routine"), reply: reply(lang, LINES.noVerified) };
    }
    return {
      ...this.base(intent, "routine"),
      reply: { en: hit.body, ...(lang !== "en" ? { [lang]: hit.body } : {}) },
      provenance: `Source: ${hit.source}`,
    };
  }

  /** "What do I do if… / give me the steps for…" — return the matching SOP as a
   *  numbered list (§23). Topic is matched directly so a live demo is reliable;
   *  the retrieved KB hit is the fallback. Always ends with the nudge that turns
   *  a training question into a real action if it's happening now. */
  private handleProcedure(req: SetuTurnRequest, text: string, lang: LanguageCode): SetuTurn {
    const TOPIC_KB: [RegExp, string][] = [
      [/\b(not breathing|no pulse|cpr|choking|seizure|convuls\w*|bleeding badly|cardiac|chest pain|heart attack|unconscious|unresponsive|not responding|collaps\w*|passed out)\b/i, "kb-medical-escalation"],
      [/\b(faint\w*|dizzy|light[- ]?headed|heat ?stroke|heat exhaustion|dehydrat\w*|overheat\w*|sun ?stroke)\b/i, "kb-medical-heat"],
      [/\b(child|kid|boy|girl|elder|parent)\b[^.?!]*\b(lost|missing|separated|gone|wander\w*)\b|\b(lost|missing|separated|found)\b[^.?!]*\b(child|kid|boy|girl|person|elder|parent|family|man|woman)\b|\bmissing[- ]person\b/i, "kb-lost-child"],
      [/\b(crowd|crush\w*|stampede|surge|pressure|bottleneck|congestion|too many people|pushing)\b/i, "kb-crowd-pressure"],
      [/\b(wheelchair|elderly|divyang|disabled|mobility|can.?t walk|old (man|woman|person)|blind|deaf|ramp)\b/i, "kb-accessibility"],
      [/\b(escalat\w*|radio protocol|report an incident|not resolving|control room|hand ?over)\b/i, "kb-radio-protocol"],
      [/\b(water|tanker|shortage|thirsty|piau|piyau)\b/i, "kb-water-points"],
      [/\b(toilet|sanitation|overflow|drain|sewage|garbage|waste|latrine)\b/i, "kb-sanitation"],
      [/\b(ground truth|field report|report an issue|report a (problem|issue)|evidence|corroborat\w*|verif\w*|good report)\b/i, "kb-ground-report-quality"],
    ];

    const id = TOPIC_KB.find(([re]) => re.test(text))?.[1];
    const entry =
      (id ? KB.find((e) => e.id === id) : undefined) ??
      KB.find((e) => e.id === req.context.knowledge[0]?.id);

    if (!entry) {
      return {
        ...this.base("information", "routine"),
        reply: reply(lang, LINES.noVerified),
        followUp: "Tell me the situation in a few words and I'll give you the steps.",
      };
    }

    const KB_INTENT: Record<string, SetuIntent> = {
      "kb-medical-escalation": "medical",
      "kb-medical-heat": "medical",
      "kb-lost-child": "lost_person",
      "kb-crowd-pressure": "crowd",
      "kb-accessibility": "accessibility",
      "kb-radio-protocol": "volunteer_task",
      "kb-water-points": "water",
      "kb-sanitation": "toilet",
      "kb-ground-report-quality": "ground_report",
    };
    const outIntent: SetuIntent = KB_INTENT[entry.id] ?? "information";

    const nudge =
      entry.id === "kb-medical-escalation" || entry.id === "kb-medical-heat" || entry.id === "kb-crowd-pressure"
        ? 'If this is happening now, tell me where you are and say "raise an incident".'
        : 'If you want me to act on this now, just say so.';

    const stepBlock = entry.steps?.length
      ? entry.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : entry.body;
    const full = `${entry.title}\n\n${stepBlock}\n\n${nudge}`;

    return {
      ...this.base(outIntent, "routine"),
      reply: { en: full, ...(lang !== "en" ? { [lang]: full } : {}) },
      provenance: `Source: ${entry.source}`,
    };
  }

  private readTool(
    req: SetuTurnRequest,
    lang: LanguageCode,
    name: string,
    args: Record<string, unknown>,
    provenance: string,
    tail?: string
  ): SetuTurn {
    return {
      ...this.base(classifyIntent(req.message).intent, "routine"),
      reply: reply(lang, LINES.onIt, tail),
      tool: { name: name as ToolName, arguments: args },
      requiresConfirmation: false,
      provenance: `Source: ${provenance}`,
    };
  }

  private fallback(req: SetuTurnRequest, lang: LanguageCode): SetuTurn {
    return {
      ...this.base("other", "routine"),
      reply: reply(
        lang,
        L(
          "I can find facilities, brief you on your zone, translate for a pilgrim, log a field report, or raise an incident. What do you need?",
          "मैं सुविधाएँ ढूँढ सकता हूँ, ज़ोन की जानकारी दे सकता हूँ, अनुवाद कर सकता हूँ, रिपोर्ट दर्ज कर सकता हूँ, या घटना बना सकता हूँ। क्या चाहिए?",
          "मी सुविधा शोधू शकतो, झोनची माहिती देऊ शकतो, भाषांतर करू शकतो, अहवाल नोंदवू शकतो, किंवा घटना तयार करू शकतो. काय हवं?",
          "வசதிகளைத் தேட, உங்கள் மண்டலத்தைப் பற்றி சொல்ல, மொழிபெயர்க்க, அறிக்கை பதிவு செய்ய, சம்பவம் உருவாக்க முடியும். என்ன வேண்டும்?"
        )
      ),
    };
  }
}
