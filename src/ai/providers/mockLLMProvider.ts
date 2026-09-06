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

    const urgency: Urgency = EMERGENCY_RE.test(text) || intent === "emergency" ? "emergency" : intent === "medical" || intent === "crowd" || intent === "safety" ? "elevated" : "routine";

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
