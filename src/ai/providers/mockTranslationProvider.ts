// Offline translation provider (§7).
//
// Two layers:
//   1. A field phrasebook — exact + fuzzy matches for the phrases that
//      actually come up between a volunteer and a pilgrim (directions,
//      medical triage, reassurance). These are real translations.
//   2. A transparent fallback for anything else: the text is returned with a
//      clear "[offline · not translated]" marker so the UI never passes off
//      an untranslated string as a translation.
//
// A real deployment swaps this for Bhashini / a NMT service behind the same
// `TranslationProvider` interface (src/ai/providers/index.ts).

import type { LanguageCode } from "@/lib/types";
import type {
  TranslationProvider,
  TranslationResult,
  ProviderInfo,
} from "./types";

interface PhraseEntry {
  keys: string[]; // english trigger phrases / keywords (lowercased)
  translations: Record<LanguageCode, string>;
}

// A compact, purpose-built field phrasebook. Devanagari for hi/mr, Tamil script
// for ta. Kept deliberately small and practical.
const PHRASEBOOK: PhraseEntry[] = [
  {
    keys: ["are you okay", "are you alright", "is everything okay", "how are you feeling"],
    translations: {
      en: "Are you okay?",
      hi: "क्या आप ठीक हैं?",
      mr: "तुम्ही ठीक आहात का?",
      ta: "நீங்கள் நலமாக இருக்கிறீர்களா?",
    },
  },
  {
    keys: ["do you need medical help", "do you need a doctor", "do you need medical assistance"],
    translations: {
      en: "Do you need medical help?",
      hi: "क्या आपको चिकित्सा सहायता चाहिए?",
      mr: "तुम्हाला वैद्यकीय मदत हवी आहे का?",
      ta: "உங்களுக்கு மருத்துவ உதவி தேவையா?",
    },
  },
  {
    keys: ["can you walk", "are you able to walk"],
    translations: {
      en: "Can you walk?",
      hi: "क्या आप चल सकते हैं?",
      mr: "तुम्ही चालू शकता का?",
      ta: "உங்களால் நடக்க முடியுமா?",
    },
  },
  {
    keys: ["is the person conscious", "are they conscious", "is she conscious", "is he conscious"],
    translations: {
      en: "Is the person conscious?",
      hi: "क्या व्यक्ति होश में है?",
      mr: "व्यक्ती शुद्धीत आहे का?",
      ta: "நபர் சுயநினைவுடன் இருக்கிறாரா?",
    },
  },
  {
    keys: ["please come with me", "come with me", "follow me"],
    translations: {
      en: "Please come with me.",
      hi: "कृपया मेरे साथ आइए।",
      mr: "कृपया माझ्यासोबत या.",
      ta: "தயவுசெய்து என்னுடன் வாருங்கள்.",
    },
  },
  {
    keys: ["the medical camp is this way", "medical camp is this way", "first aid is this way"],
    translations: {
      en: "The medical camp is this way.",
      hi: "चिकित्सा शिविर इस ओर है।",
      mr: "वैद्यकीय शिबिर या दिशेला आहे.",
      ta: "மருத்துவ முகாம் இந்தப் பக்கம் உள்ளது.",
    },
  },
  {
    keys: ["drinking water is available there", "water is available there", "water point is there"],
    translations: {
      en: "Drinking water is available there.",
      hi: "वहाँ पीने का पानी उपलब्ध है।",
      mr: "तिथे पिण्याचे पाणी उपलब्ध आहे.",
      ta: "அங்கே குடிநீர் கிடைக்கும்.",
    },
  },
  {
    keys: ["the toilet is that way", "toilet is that way", "washroom is that way"],
    translations: {
      en: "The toilet is that way.",
      hi: "शौचालय उस ओर है।",
      mr: "स्वच्छतागृह त्या दिशेला आहे.",
      ta: "கழிப்பறை அந்தப் பக்கம் உள்ளது.",
    },
  },
  {
    keys: ["what is your name", "tell me your name"],
    translations: {
      en: "What is your name?",
      hi: "आपका नाम क्या है?",
      mr: "तुमचे नाव काय आहे?",
      ta: "உங்கள் பெயர் என்ன?",
    },
  },
  {
    keys: ["where did you last see", "where did you last see the child", "where were you separated"],
    translations: {
      en: "Where did you last see them?",
      hi: "आपने उन्हें आखिरी बार कहाँ देखा था?",
      mr: "तुम्ही त्यांना शेवटचे कुठे पाहिले?",
      ta: "நீங்கள் அவர்களை கடைசியாக எங்கே பார்த்தீர்கள்?",
    },
  },
  {
    keys: ["please wait here", "wait here", "stay here"],
    translations: {
      en: "Please wait here.",
      hi: "कृपया यहाँ प्रतीक्षा करें।",
      mr: "कृपया इथे थांबा.",
      ta: "தயவுசெய்து இங்கே காத்திருங்கள்.",
    },
  },
  {
    keys: ["help is coming", "help is on the way", "a volunteer is coming"],
    translations: {
      en: "Help is on the way.",
      hi: "मदद आ रही है।",
      mr: "मदत येत आहे.",
      ta: "உதவி வந்து கொண்டிருக்கிறது.",
    },
  },
  {
    keys: ["do not worry", "don't worry", "it will be okay", "stay calm"],
    translations: {
      en: "Please don't worry, it will be okay.",
      hi: "कृपया चिंता न करें, सब ठीक हो जाएगा।",
      mr: "कृपया काळजी करू नका, सर्व ठीक होईल.",
      ta: "கவலைப்பட வேண்டாம், எல்லாம் சரியாகிவிடும்.",
    },
  },
  {
    keys: ["yes", "haan", "ho"],
    translations: { en: "Yes.", hi: "हाँ।", mr: "होय.", ta: "ஆம்." },
  },
  {
    keys: ["no", "nahi", "nahin"],
    translations: { en: "No.", hi: "नहीं।", mr: "नाही.", ta: "இல்லை." },
  },
  {
    keys: ["thank you", "dhanyavaad", "shukriya"],
    translations: { en: "Thank you.", hi: "धन्यवाद।", mr: "धन्यवाद.", ta: "நன்றி." },
  },
  {
    keys: ["i am looking for a hotel", "i want to look for a hotel", "i need a hotel", "where can i find a hotel", "looking for a room", "i need a room"],
    translations: {
      en: "I am looking for a hotel / room to stay.",
      hi: "मुझे ठहरने के लिए होटल / कमरा चाहिए।",
      mr: "मला राहण्यासाठी हॉटेल / खोली हवी आहे.",
      ta: "தங்குவதற்கு ஹோட்டல் / அறை தேடுகிறேன்.",
    },
  },
  {
    keys: ["where is the bus stand", "where is the bus stop", "where can i get a bus", "where is the shuttle"],
    translations: {
      en: "Where is the bus stand / shuttle pickup?",
      hi: "बस स्टैंड / शटल कहाँ है?",
      mr: "बस स्थानक / शटल कुठे आहे?",
      ta: "பேருந்து நிலையம் / ஷட்டில் எங்கே?",
    },
  },
  {
    keys: ["how much is this", "what is the price", "how much does it cost"],
    translations: {
      en: "How much is this?",
      hi: "यह कितने का है?",
      mr: "हे किती रुपयांना आहे?",
      ta: "இது எவ்வளவு?",
    },
  },
  {
    keys: ["i need help", "please help me", "can you help me"],
    translations: {
      en: "I need help.",
      hi: "मुझे मदद चाहिए।",
      mr: "मला मदत हवी आहे.",
      ta: "எனக்கு உதவி தேவை.",
    },
  },
  {
    keys: ["please show me the way", "which way to go", "how do i get there", "show me the route"],
    translations: {
      en: "Please show me the way.",
      hi: "कृपया मुझे रास्ता दिखाइए।",
      mr: "कृपया मला रस्ता दाखवा.",
      ta: "தயவுசெய்து வழியைக் காட்டுங்கள்.",
    },
  },
  {
    keys: ["i have lost my ticket", "i lost my ticket", "i lost my bag", "i have lost my phone"],
    translations: {
      en: "I have lost my belongings.",
      hi: "मेरा सामान खो गया है।",
      mr: "माझं सामान हरवलं आहे.",
      ta: "என் பொருட்கள் தொலைந்துவிட்டன.",
    },
  },
  {
    keys: ["where is the temple", "how do i reach the ghat", "which way to the ghat", "where is the bathing area"],
    translations: {
      en: "Which way to the temple / ghat?",
      hi: "मंदिर / घाट किस ओर है?",
      mr: "मंदिर / घाट कोणत्या दिशेला आहे?",
      ta: "கோயில் / படித்துறை எந்தப் பக்கம்?",
    },
  },
  {
    keys: ["where is the nearest water point", "where can i get drinking water", "where is the nearest drinking water", "where is the water point"],
    translations: {
      en: "Where is the nearest drinking-water point?",
      hi: "सबसे नज़दीकी पेयजल केंद्र कहाँ है?",
      mr: "जवळचे पिण्याच्या पाण्याचे केंद्र कुठे आहे?",
      ta: "அருகிலுள்ள குடிநீர் நிலையம் எங்கே?",
    },
  },
  {
    keys: ["where is the nearest medical camp", "where is the nearest first aid", "where can i find a doctor", "where is the medical camp"],
    translations: {
      en: "Where is the nearest medical camp?",
      hi: "सबसे नज़दीकी चिकित्सा शिविर कहाँ है?",
      mr: "जवळचे वैद्यकीय शिबिर कुठे आहे?",
      ta: "அருகிலுள்ள மருத்துவ முகாம் எங்கே?",
    },
  },
  {
    keys: ["where is the nearest toilet", "where is the washroom", "where is the nearest washroom", "where is the sanitation block"],
    translations: {
      en: "Where is the nearest toilet?",
      hi: "सबसे नज़दीकी शौचालय कहाँ है?",
      mr: "जवळचे स्वच्छतागृह कुठे आहे?",
      ta: "அருகிலுள்ள கழிப்பறை எங்கே?",
    },
  },
];

/**
 * Word-level glossary for the word-by-word fallback. Not a substitute for real
 * translation — it produces an understandable gist and is labelled as such.
 */
const GLOSSARY: Record<string, Partial<Record<LanguageCode, string>>> = {
  hotel: { hi: "होटल", mr: "हॉटेल", ta: "ஹோட்டல்" },
  room: { hi: "कमरा", mr: "खोली", ta: "அறை" },
  stay: { hi: "ठहरना", mr: "राहणे", ta: "தங்க" },
  water: { hi: "पानी", mr: "पाणी", ta: "தண்ணீர்" },
  food: { hi: "खाना", mr: "जेवण", ta: "உணவு" },
  toilet: { hi: "शौचालय", mr: "स्वच्छतागृह", ta: "கழிப்பறை" },
  doctor: { hi: "डॉक्टर", mr: "डॉक्टर", ta: "மருத்துவர்" },
  medical: { hi: "चिकित्सा", mr: "वैद्यकीय", ta: "மருத்துவம்" },
  hospital: { hi: "अस्पताल", mr: "रुग्णालय", ta: "மருத்துவமனை" },
  bus: { hi: "बस", mr: "बस", ta: "பேருந்து" },
  station: { hi: "स्टेशन", mr: "स्थानक", ta: "நிலையம்" },
  train: { hi: "ट्रेन", mr: "रेल्वे", ta: "ரயில்" },
  temple: { hi: "मंदिर", mr: "मंदिर", ta: "கோயில்" },
  ghat: { hi: "घाट", mr: "घाट", ta: "படித்துறை" },
  help: { hi: "मदद", mr: "मदत", ta: "உதவி" },
  lost: { hi: "खोया", mr: "हरवले", ta: "தொலைந்தது" },
  child: { hi: "बच्चा", mr: "मूल", ta: "குழந்தை" },
  where: { hi: "कहाँ", mr: "कुठे", ta: "எங்கே" },
  "how much": { hi: "कितना", mr: "किती", ta: "எவ்வளவு" },
  ticket: { hi: "टिकट", mr: "तिकीट", ta: "டிக்கெட்" },
  parking: { hi: "पार्किंग", mr: "पार्किंग", ta: "வாகன நிறுத்தம்" },
  police: { hi: "पुलिस", mr: "पोलीस", ta: "காவல்துறை" },
  near: { hi: "पास", mr: "जवळ", ta: "அருகில்" },
  "i want": { hi: "मुझे चाहिए", mr: "मला हवे आहे", ta: "எனக்கு வேண்டும்" },
  "i need": { hi: "मुझे चाहिए", mr: "मला हवे आहे", ta: "எனக்கு தேவை" },
  "looking for": { hi: "ढूँढ रहा हूँ", mr: "शोधत आहे", ta: "தேடுகிறேன்" },
  "thank you": { hi: "धन्यवाद", mr: "धन्यवाद", ta: "நன்றி" },
};

// Script-based language detection — good enough for the four MVP languages,
// since hi/mr share Devanagari we bias on a few Marathi-only markers.
const TAMIL_RE = /[஀-௿]/;
const DEVANAGARI_RE = /[ऀ-ॿ]/;
const MARATHI_MARKERS = /(आहे|नाही|तुम्ही|माझ्या|कृपया|होय|मला|काय)/;

function tokenize(s: string): string[] {
  return s.toLowerCase().replace(/[.?!,]/g, "").split(/\s+/).filter(Boolean);
}

function fuzzyScore(query: string, key: string): number {
  const q = new Set(tokenize(query));
  const k = tokenize(key);
  if (k.length === 0) return 0;
  let hit = 0;
  for (const w of k) if (q.has(w)) hit++;
  return hit / k.length;
}

export class MockTranslationProvider implements TranslationProvider {
  readonly info: ProviderInfo = { name: "Offline field phrasebook", simulated: true };

  getSupportedLanguages(): LanguageCode[] {
    return ["en", "hi", "mr", "ta"];
  }

  async detectLanguage(text: string): Promise<LanguageCode> {
    if (TAMIL_RE.test(text)) return "ta";
    if (DEVANAGARI_RE.test(text)) return MARATHI_MARKERS.test(text) ? "mr" : "hi";
    return "en";
  }

  async translate(text: string, to: LanguageCode, from?: LanguageCode): Promise<TranslationResult> {
    const detectedSource = from ?? (await this.detectLanguage(text));
    const norm = normalize(text);

    if (detectedSource === to) {
      return { text, detectedSource, confidence: 1, fromPhrasebook: false };
    }

    // 1) phrasebook — matched against the SOURCE language column, so it works
    //    in both directions (en↔ta, hi↔mr, …).
    const hit = matchEntry(norm, detectedSource);
    if (hit) {
      const out = hit.entry.translations[to];
      return {
        text: out,
        detectedSource,
        confidence: hit.exact ? 0.96 : 0.7 + hit.score * 0.22,
        fromPhrasebook: true,
      };
    }

    // 2) word-by-word gloss via an English pivot — a usable gist, labelled.
    const gloss = wordGloss(norm, detectedSource, to);
    if (gloss.hits >= 1) {
      return {
        text: `${gloss.text}  (word-by-word)`,
        detectedSource,
        confidence: Math.min(0.55, 0.3 + gloss.hits * 0.08),
        fromPhrasebook: false,
      };
    }

    // 3) transparent fallback — never pretend this was translated
    return {
      text: `${text}  —  [offline · couldn't translate this phrase]`,
      detectedSource,
      confidence: 0.2,
      fromPhrasebook: false,
    };
  }
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[.?!,।]+$/g, "");
}

interface EntryMatch {
  entry: PhraseEntry;
  exact: boolean;
  score: number;
}

/** Find the phrasebook entry whose `lang` phrasing matches `norm`. */
function matchEntry(norm: string, lang: LanguageCode): EntryMatch | null {
  // exact / contains
  for (const entry of PHRASEBOOK) {
    const src = normalize(entry.translations[lang] ?? "");
    if (src && (src === norm || norm.includes(src) || src.includes(norm))) {
      return { entry, exact: true, score: 1 };
    }
    if (lang === "en" && entry.keys.some((k) => k === norm || norm.includes(k))) {
      return { entry, exact: true, score: 1 };
    }
  }
  // fuzzy — strong token overlap + similar length
  const qLen = tokenize(norm).length;
  let best: EntryMatch | null = null;
  for (const entry of PHRASEBOOK) {
    const candidates = lang === "en" ? entry.keys : [entry.translations[lang] ?? ""];
    for (const c of candidates) {
      if (!c) continue;
      const cLen = tokenize(c).length;
      if (cLen === 0 || Math.abs(qLen - cLen) > 2) continue;
      const score = fuzzyScore(norm, c);
      if (score >= 0.74 && (!best || score > best.score)) best = { entry, exact: false, score };
    }
  }
  return best;
}

/** Reverse index: target-script word → English key. Built once. */
const GLOSS_REVERSE: Record<LanguageCode, Record<string, string>> = { en: {}, hi: {}, mr: {}, ta: {} };
for (const [en, langs] of Object.entries(GLOSSARY)) {
  for (const [lang, word] of Object.entries(langs)) {
    if (word) GLOSS_REVERSE[lang as LanguageCode][word.toLowerCase()] = en;
  }
}

/** Word-by-word gloss between any two supported languages, via English. */
function wordGloss(norm: string, from: LanguageCode, to: LanguageCode): { text: string; hits: number } {
  // Step 1: get an English form of the phrase.
  let english = norm;
  let hits = 0;
  if (from !== "en") {
    let out = ` ${norm} `;
    const rev = GLOSS_REVERSE[from];
    for (const word of Object.keys(rev).sort((a, b) => b.length - a.length)) {
      const re = new RegExp(escapeRe(word), "g");
      if (re.test(out)) {
        out = out.replace(re, ` ${rev[word]} `);
        hits++;
      }
    }
    english = out.replace(/\s+/g, " ").trim();
    if (hits === 0) return { text: norm, hits: 0 };
  }

  if (to === "en") return { text: english, hits: Math.max(hits, 1) };

  // Step 2: English → target words.
  let out = ` ${english} `;
  let outHits = 0;
  for (const key of Object.keys(GLOSSARY).sort((a, b) => b.length - a.length)) {
    const rep = GLOSSARY[key][to];
    if (!rep) continue;
    const re = new RegExp(`\\b${escapeRe(key)}\\b`, "g");
    if (re.test(out)) {
      out = out.replace(re, ` ${rep} `);
      outHits++;
    }
  }
  return { text: out.replace(/\s+/g, " ").trim(), hits: Math.max(hits, outHits) };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
