// Static, curated planning content for the pilgrim "Plan my Kumbh" dashboard.
//
// Simhastha Kumbh Mela 2027 is at Nashik (Ramkund / Godavari ghats) and
// Trimbakeshwar (Kushavarta Kund). Operational specifics — exact dates, tent
// bookings, shuttle routes, queue systems — are set by the Nashik–Trimbak
// Kumbhmela Authority (NTKMA) and published on the official portal closer to
// the event. Entries below that depend on that are marked `official: true` so
// the UI can show a "confirm on the official portal" note.

export interface GuideLink {
  label: string;
  href: string;
  /** true = URL is illustrative / to-be-published, show a (verify) hint */
  tentative?: boolean;
}

export interface GuideCard {
  title: string;
  body: string;
  tips?: string[];
  links?: GuideLink[];
  /** depends on NTKMA/official confirmation */
  official?: boolean;
}

export interface GuideSection {
  id: "travel" | "stay" | "darshan" | "eat";
  label: string;
  icon: "route" | "map-pin" | "pilgrim" | "food";
  intro: string;
  cards: GuideCard[];
}

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "travel",
    label: "Travel",
    icon: "route",
    intro:
      "Nashik is ~165 km from Mumbai and ~210 km from Pune. Trimbakeshwar is ~28 km west of Nashik. On principal bath days the core near the ghats is closed to private vehicles — plan to park outside and walk or shuttle in.",
    cards: [
      {
        title: "By train",
        body:
          "Nashik Road (station code NK) is the main railhead, ~8 km from Ramkund, with frequent trains from Mumbai, Pune, Delhi, Bhusaval and Manmad junction. Additional special trains are usually run for the Mela — check railway notices before principal snan dates.",
        tips: [
          "Book reserved tickets early; snan-week trains fill weeks ahead.",
          "Keep your return flexible — a Tatkal or a later confirmed ticket beats being stuck.",
          "From Nashik Road station take a pre-paid auto, city bus or the Mela shuttle toward Panchavati / Ramkund.",
        ],
        links: [
          { label: "IRCTC — train booking", href: "https://www.irctc.co.in/" },
          { label: "Indian Railways — trains at a station", href: "https://enquiry.indianrail.gov.in/" },
        ],
      },
      {
        title: "By road & bus",
        body:
          "MSRTC and private operators run buses to Nashik Central Bus Stand (CBS) and Mahamarg (Thakkar) bus stand from across Maharashtra and neighbouring states. Nashik sits on the Mumbai–Agra highway (NH-3/NH-160).",
        tips: [
          "For Trimbakeshwar, take a shared jeep or ST bus from Nashik CBS / Old CBS — the last stretch is hilly and slow on Mela days.",
          "If you drive in, use the designated park-and-ride grounds; do not attempt the ghat roads on a snan day.",
        ],
        links: [
          { label: "MSRTC — Maharashtra State buses", href: "https://msrtc.maharashtra.gov.in/" },
          { label: "Maharashtra Tourism (MTDC)", href: "https://www.maharashtratourism.gov.in/" },
        ],
      },
      {
        title: "By air",
        body:
          "Nashik's Ozar (ISK) airport has limited domestic flights. Mumbai (BOM) ~170 km and Pune (PNQ) ~210 km are the practical gateways, then train or road to Nashik.",
        tips: ["Allow 4–5 hrs Mumbai airport → Nashik by road, more on Mela weekends."],
      },
      {
        title: "Getting around during the Mela",
        body:
          "Expect one-way pedestrian routes, barricaded lanes and vehicle bans near the ghats on major days. Park-and-ride lots feed shuttle buses toward the entry gates; the final approach to the water is on foot.",
        official: true,
        tips: [
          "Follow the coloured lane markings and marshals — do not shortcut against the flow.",
          "Note your parking lot name/number and the nearest landmark before you walk in.",
          "Agree a family meeting point (a named gate or tower) before entering the crowd.",
        ],
      },
    ],
  },
  {
    id: "stay",
    label: "Stay",
    icon: "map-pin",
    intro:
      "Base yourself in Nashik city for the Ramkund / Godavari cluster, or in Trimbakeshwar town for Kushavarta — Trimbakeshwar has far fewer rooms, so book months ahead. Rates rise sharply around bath dates.",
    cards: [
      {
        title: "Mela tent township & pilgrim accommodation",
        body:
          "The authority sets up a temporary township (sadhugram) and pilgrim tent accommodation near the ghats for the Mela period, alongside akhara camps. Capacity and booking open on the official portal closer to the event.",
        official: true,
        tips: ["Carry your booking confirmation and ID; keep a digital copy too."],
      },
      {
        title: "Dharamshalas, maths & trust lodging",
        body:
          "Panchavati and Tapovan have many dharamshalas and math-run rest houses, often tied to specific regions or communities. These are budget-friendly and close to Ramkund.",
        tips: [
          "Book directly with the trust by phone; many do not appear on booking sites.",
          "Rooms are basic — carry your own bedsheet and lock.",
        ],
      },
      {
        title: "Hotels & lodges",
        body:
          "Nashik has hotels across College Road, Gangapur Road, the old city and near Nashik Road station, from budget lodges to business hotels. Book early for snan week.",
        links: [
          { label: "MTDC resorts & B&B", href: "https://www.maharashtratourism.gov.in/" },
          { label: "MakeMyTrip — Nashik hotels", href: "https://www.makemytrip.com/hotels/nashik-hotels.html" },
          { label: "Booking.com — Nashik", href: "https://www.booking.com/city/in/nashik.html" },
        ],
      },
      {
        title: "Homestays & farm stays",
        body:
          "Nashik's wine-country homestays and MTDC's registered Bed & Breakfast homes are a quieter option a short drive from the ghats.",
        links: [{ label: "MTDC — registered homestays", href: "https://www.maharashtratourism.gov.in/", tentative: true }],
      },
    ],
  },
  {
    id: "darshan",
    label: "Darshan",
    icon: "pilgrim",
    intro:
      "The two snan tirthas are Ramkund on the Godavari in Nashik and Kushavarta Kund at Trimbakeshwar. Around them sits a dense circuit of temples. On procession days, watch the akhara marches only from the public viewing areas — never cross a procession route.",
    cards: [
      {
        title: "Ramkund, Nashik",
        body:
          "The principal bathing kund on the Godavari at Panchavati. Traditionally associated with Rama's stay and with asthi-visarjan (immersion of ashes). The surrounding Panchavati ghats hold the main Nashik snan crowds.",
        links: [{ label: "Ramkund — background", href: "https://en.wikipedia.org/wiki/Ramkund" }],
      },
      {
        title: "Trimbakeshwar Jyotirlinga & Kushavarta",
        body:
          "One of the twelve Jyotirlingas of Shiva, at the source of the Godavari. Kushavarta Kund in the temple town is the snan tirtha for the Trimbakeshwar cluster. Queues are long on Mela days; a paid quick-darshan line is usually available.",
        tips: [
          "The sanctum has dress and entry norms — check current rules at the gate.",
          "Trimbakeshwar town is small; arrive very early or stay overnight for a snan day.",
        ],
        links: [
          { label: "Trimbakeshwar Temple — background", href: "https://en.wikipedia.org/wiki/Trimbakeshwar_Shiva_Temple" },
          { label: "Kushavarta Kund", href: "https://en.wikipedia.org/wiki/Kushavarta" },
        ],
      },
      {
        title: "Nashik temple circuit",
        body:
          "Within walking distance of Ramkund: Kalaram Temple and Sita Gufaa (Panchavati), Kapaleshwar Mahadev (above Ramkund, famously without a Nandi), Sundarnarayan, Naroshankar and Muktidham a little further out.",
        tips: ["Do the circuit on a non-snan day when lanes are calmer."],
      },
      {
        title: "Akhara processions & Amrit Snan",
        body:
          "The akharas enter the water first, in ceremonial order, on the principal Amrit Snan days. These processions (peshwai / shahi marg) move on fixed routes with their own security.",
        official: true,
        tips: [
          "Stand only in the marked public viewing zones.",
          "Keep children close and hold hands; the crush near a procession builds fast.",
        ],
      },
      {
        title: "At the ghat — etiquette",
        body:
          "Dress modestly and expect to change in the open or in shared enclosures. Keep the river clean.",
        tips: [
          "No soap, shampoo or oil in the river.",
          "Carry the minimum — a waist pouch, not a bag.",
          "Bathe quickly and move on so others can use the steps; follow the marshals.",
        ],
      },
    ],
  },
  {
    id: "eat",
    label: "Eat",
    icon: "food",
    intro:
      "Free community meals (annakshetra / bhandara) run near the ghats through the Mela. In the heat and the crowd, water safety matters more than anything on the menu.",
    cards: [
      {
        title: "Annakshetra & bhandara",
        body:
          "Akharas, trusts and the administration serve free sattvic meals — usually dal, rice, roti, a vegetable — at kitchens near the ghats and camps. Simple, filling and safe when freshly served hot.",
        tips: ["Eat at the served mealtimes when food is fresh; avoid anything sitting out."],
      },
      {
        title: "Nashik street food",
        body:
          "Away from the ghats, Nashik is known for misal pav, sabudana khichdi/vada, chivda and Maharashtrian thalis around Main Road, College Road and the old city.",
      },
      {
        title: "Water & hygiene — read this",
        body:
          "Heat, walking and crowd stress cause more pilgrim illness than food does. Treat water as the priority.",
        tips: [
          "Drink only sealed bottled water or water from a clearly-marked safe / UV point.",
          "Carry ORS sachets; start sipping before you feel thirsty.",
          "Eat only freshly cooked hot food; skip cut fruit and cold chutneys from open stalls.",
          "Carry your own steel tumbler and a small hand sanitiser.",
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Kumbh resources & platforms — one place for the official portals, live maps,
// helplines, language tools and other civic-tech around the Mela.
// ---------------------------------------------------------------------------

export interface ResourceEntry {
  label: string;
  href: string;
  note: string;
  tentative?: boolean;
}
export interface ResourceGroup {
  title: string;
  entries: ResourceEntry[];
}

export const KUMBH_RESOURCES: ResourceGroup[] = [
  {
    title: "Official & government",
    entries: [
      {
        label: "Simhastha / Kumbh official portal (NTKMA)",
        href: "https://kumbhmela.gov.in/",
        note: "The Nashik–Trimbak Kumbhmela Authority's portal is the authoritative source for dates, bookings, routes and rules. Prefer it once the 2027 site is live.",
        tentative: true,
      },
      { label: "Nashik Municipal Corporation", href: "https://nmc.gov.in/", note: "City services, ward info, civic notices." },
      { label: "Maharashtra Tourism (MTDC)", href: "https://www.maharashtratourism.gov.in/", note: "Stays, resorts, registered homestays, tour info." },
      { label: "Incredible India — tourist helpline", href: "https://www.incredibleindia.gov.in/", note: "24×7 multilingual helpline 1363." },
      { label: "IRCTC", href: "https://www.irctc.co.in/", note: "Train tickets, special Mela trains, catering." },
      { label: "MSRTC", href: "https://msrtc.maharashtra.gov.in/", note: "Maharashtra State Road Transport buses." },
    ],
  },
  {
    title: "Maps & live information",
    entries: [
      { label: "Nashik Monitor v2", href: "https://nashik-monitor-v2.vercel.app/", note: "Open civic map of Nashik — hospitals, temples, wards, 36 datasets. Community project." },
      { label: "OpenStreetMap — Nashik", href: "https://www.openstreetmap.org/#map=13/19.99/73.79", note: "Editable base map; works well offline in OSM apps." },
      { label: "Google Maps — Ramkund", href: "https://www.google.com/maps/search/?api=1&query=Ramkund%20Nashik", note: "Live directions and place details." },
    ],
  },
  {
    title: "Language help",
    entries: [
      { label: "Bhashini", href: "https://bhashini.gov.in/", note: "Government of India translation / speech mission — powers many Indic-language apps." },
      { label: "Google Translate", href: "https://translate.google.com/", note: "Offline language packs for Marathi, Hindi and more." },
    ],
  },
  {
    title: "Safety & emergency",
    entries: [
      { label: "Emergency — 112", href: "tel:112", note: "Single national emergency number (police, fire, medical)." },
      { label: "Ambulance — 108", href: "tel:108", note: "Free emergency ambulance in Maharashtra." },
      { label: "Childline — 1098", href: "tel:1098", note: "For lost, unaccompanied or distressed children." },
      { label: "Tourist helpline — 1363", href: "tel:1363", note: "Ministry of Tourism, multilingual, 24×7." },
    ],
  },
  {
    title: "Research & community",
    entries: [
      { label: "MIT Media Lab — Kumbhathon", href: "https://www.media.mit.edu/projects/kumbhathon/overview/", note: "Years of Nashik Kumbh innovation research and prototypes." },
      { label: "Kumbhathon", href: "https://kumbhathon.in/", note: "Nashik's civic innovation sprint — the community this platform comes from.", tentative: true },
    ],
  },
  {
    title: "Kumbh Setu — this platform",
    entries: [
      { label: "Pilgrim app", href: "/pilgrim", note: "Navigation, facilities, SOS, lost & found, this planner." },
      { label: "Common Operations Board", href: "/board", note: "Live incidents, zone status, notices and helplines in one view." },
      { label: "Ask Kumbh Setu AI", href: "/pilgrim", note: "Multilingual assistant for on-the-ground questions (in the pilgrim app)." },
      { label: "Reference links", href: "https://github.com/Ayush-170906/KumbhSetu/blob/main/docs/REFERENCES.md", note: "Every source behind this build." },
    ],
  },
];

export const GUIDE_DISCLAIMER =
  "This guide is general orientation compiled for the demo — distances, options and customs, not official instructions. Dates, bookings, routes, queue systems and rules for Simhastha 2027 are set by the Nashik–Trimbak Kumbhmela Authority and announced on the official portal and on-site notice boards. Always follow marshals and posted signage.";
