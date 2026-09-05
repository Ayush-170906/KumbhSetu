import type { LanguageCode } from "./types";

// A small, honestly-scoped translation set for the highest-traffic Pilgrim
// screens (Home + SOS). This demonstrates real multilingual support rather
// than translating the entire app — see PROTOTYPE.md for what's covered.

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: "English",
  hi: "हिंदी",
  mr: "मराठी",
  ta: "தமிழ்",
};

/** Endonym + English name, for language pickers in the field companion. */
export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: "English",
  hi: "हिंदी (Hindi)",
  mr: "मराठी (Marathi)",
  ta: "தமிழ் (Tamil)",
};

const dict = {
  greetingMorning: { en: "Good morning.", hi: "सुप्रभात।", mr: "सुप्रभात." },
  greetingAfternoon: { en: "Good afternoon.", hi: "नमस्कार।", mr: "नमस्कार." },
  greetingEvening: { en: "Good evening.", hi: "शुभ संध्या।", mr: "शुभ संध्याकाळ." },
  howCanWeHelp: { en: "How can we help?", hi: "हम आपकी कैसे मदद करें?", mr: "आम्ही कशी मदत करू शकतो?" },
  sos: { en: "SOS", hi: "एसओएस", mr: "एसओएस" },
  findFacility: { en: "Find Facility", hi: "सुविधा खोजें", mr: "सुविधा शोधा" },
  myRoute: { en: "My Route", hi: "मेरा मार्ग", mr: "माझा मार्ग" },
  lostFound: { en: "Lost & Found", hi: "खोया-पाया", mr: "हरवले-सापडले" },
  darshan: { en: "Darshan", hi: "दर्शन", mr: "दर्शन" },
  reportIssue: { en: "Report Issue", hi: "समस्या दर्ज करें", mr: "समस्या नोंदवा" },
  askAssistant: { en: "Ask Kumbh Setu", hi: "कुंभ सेतु से पूछें", mr: "कुंभ सेतुला विचारा" },
  nearby: { en: "Nearby", hi: "आस-पास", mr: "जवळपास" },
  currentArea: { en: "Current Area", hi: "वर्तमान क्षेत्र", mr: "सध्याचे क्षेत्र" },
  confirmAssistanceTitle: { en: "Confirm Assistance Request", hi: "सहायता अनुरोध की पुष्टि करें", mr: "मदत विनंतीची पुष्टी करा" },
  confirmSend: { en: "Confirm & Send SOS", hi: "पुष्टि करें और एसओएस भेजें", mr: "पुष्टी करा आणि एसओएस पाठवा" },
  cancel: { en: "Cancel", hi: "रद्द करें", mr: "रद्द करा" },
  requestSent: { en: "Request Sent", hi: "अनुरोध भेजा गया", mr: "विनंती पाठवली" },
  locationShared: { en: "Location shared", hi: "स्थान साझा किया गया", mr: "स्थान सामायिक केले" },
  volunteerNotified: { en: "Volunteer notified", hi: "स्वयंसेवक को सूचित किया गया", mr: "स्वयंसेवकाला कळवले" },
  managementNotified: { en: "Management notified", hi: "प्रबंधन को सूचित किया गया", mr: "व्यवस्थापनाला कळवले" },
  // Tamil is not yet translated for the pilgrim Home/SOS strings — `t()` falls
  // back to English. The Setu companion carries its own Tamil field phrasebook
  // (src/ai/providers/mockTranslationProvider.ts) for live volunteer↔pilgrim use.
} satisfies Record<string, Partial<Record<LanguageCode, string>>>;

export type TranslationKey = keyof typeof dict;

export function t(key: TranslationKey, language: LanguageCode): string {
  const entry = dict[key] as Partial<Record<LanguageCode, string>>;
  return entry[language] ?? entry.en ?? key;
}
