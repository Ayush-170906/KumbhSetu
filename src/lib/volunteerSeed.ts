import type { LanguageCode, Volunteer, VolunteerCategory, VolunteerGender } from "./types";
import { VOLUNTEERS, ZONES } from "./seed";
import type {
  Accommodation,
  AccommodationAssignment,
  AttendanceRecord,
  AttendanceStatus,
  Deployment,
  FieldActivity,
  FieldActivityType,
  IdentityVerificationEvent,
  MealAllocation,
  MealDistributionStatus,
  MealType,
  Ngo,
  RosterAssignment,
  SavedVolunteerFilter,
  TrainingEnrollment,
  TrainingSession,
} from "./volunteerTypes";

const TODAY = "2026-10-31";

export const INITIAL_NGOS: Ngo[] = [
  {
    id: "ngo-01",
    name: "Seva Bharati Nashik",
    registrationId: "MH/2021/SBN-441",
    authorizedRepresentative: "Suresh Joshi",
    contactPerson: "Anand Deshmukh",
    email: "ops@seva-bharati.example.test",
    phone: "9123456701",
    address: "Panchavati, Nashik",
    state: "Maharashtra",
    district: "Nashik",
    volunteerCountDeclared: 45,
    areasOfOperation: ["Ramkund", "Tapovan", "Godavari North"],
    documentsOnFile: true,
    status: "approved",
    createdAt: "2026-09-12T08:00:00.000Z",
    updatedAt: "2026-09-18T08:00:00.000Z",
  },
  {
    id: "ngo-02",
    name: "Godavari Relief Collective",
    registrationId: "MH/2019/GRC-118",
    authorizedRepresentative: "Rajendra Patil",
    contactPerson: "Meena Kale",
    email: "desk@godavari-relief.example.test",
    phone: "9123456702",
    address: "College Road, Nashik",
    state: "Maharashtra",
    district: "Nashik",
    volunteerCountDeclared: 35,
    areasOfOperation: ["Transit corridor", "Pontoon bridges", "Ghat approaches"],
    documentsOnFile: true,
    status: "approved",
    createdAt: "2026-10-02T08:00:00.000Z",
    updatedAt: "2026-10-20T08:00:00.000Z",
  },
  {
    id: "ngo-03",
    name: "Trimbak Youth Corps",
    registrationId: "MH/2023/TYC-077",
    authorizedRepresentative: "Kiran Gite",
    contactPerson: "Nilesh Shinde",
    email: "hello@trimbak-youth.example.test",
    phone: "9123456703",
    address: "Kushavarta Road, Trimbakeshwar",
    state: "Maharashtra",
    district: "Nashik",
    volunteerCountDeclared: 30,
    areasOfOperation: ["Temple perimeter", "Kushavarta Ghat", "Approach roads"],
    documentsOnFile: true,
    status: "approved",
    createdAt: "2026-08-21T08:00:00.000Z",
    updatedAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "ngo-04",
    name: "Panchavati Samiti Sevaks",
    registrationId: "MH/2022/PSS-309",
    authorizedRepresentative: "Vasantrao Kulkarni",
    contactPerson: "Dipak Sonawane",
    email: "seva@panchavati-samiti.example.test",
    phone: "9123456704",
    address: "Ramkund Marg, Nashik",
    state: "Maharashtra",
    district: "Nashik",
    volunteerCountDeclared: 25,
    areasOfOperation: ["Ramkund", "Sita Gumpha", "Tapovan"],
    documentsOnFile: true,
    status: "approved",
    createdAt: "2026-09-10T08:00:00.000Z",
    updatedAt: "2026-09-15T08:00:00.000Z",
  },
  {
    id: "ngo-05",
    name: "Maharashtra Disaster Relief Volunteers (MDRV)",
    registrationId: "MH/2018/MDR-902",
    authorizedRepresentative: "Col. S. Thorat (Retd.)",
    contactPerson: "Sunil Pawar",
    email: "deploy@mdrv-nashik.example.test",
    phone: "9123456705",
    address: "CIDCO Sector 4, Nashik",
    state: "Maharashtra",
    district: "Nashik",
    volunteerCountDeclared: 30,
    areasOfOperation: ["All 5 Sectors", "Emergency Medical Line", "Bridge Overpasses"],
    documentsOnFile: true,
    status: "approved",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-10T08:00:00.000Z",
  },
  {
    id: "ngo-06",
    name: "Bharat Scouts & Guides Nashik",
    registrationId: "MH/2015/BSG-012",
    authorizedRepresentative: "Mrs. V. Bhalerao",
    contactPerson: "Ganesh More",
    email: "scouts@bsg-nashik.example.test",
    phone: "9123456706",
    address: "Mahatma Nagar, Nashik",
    state: "Maharashtra",
    district: "Nashik",
    volunteerCountDeclared: 20,
    areasOfOperation: ["Information Desks", "Lost & Found Booths", "Tapovan"],
    documentsOnFile: true,
    status: "approved",
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-05T08:00:00.000Z",
  },
  {
    id: "ngo-07",
    name: "Riverbank Seva Draft",
    registrationId: "PENDING-MH-2027",
    authorizedRepresentative: "Rameshwar Dhumal",
    contactPerson: "Rameshwar Dhumal",
    email: "draft@seva.example.test",
    phone: "9123456707",
    address: "Dindori Road, Nashik",
    state: "Maharashtra",
    district: "Nashik",
    volunteerCountDeclared: 10,
    areasOfOperation: ["Ramkund"],
    documentsOnFile: false,
    status: "submitted",
    createdAt: "2026-10-28T08:00:00.000Z",
    updatedAt: "2026-10-28T08:00:00.000Z",
  },
];

export const INITIAL_TRAINING: TrainingSession[] = [
  {
    id: "tr-01",
    title: "Crowd marshalling for ghat approaches",
    description: "Lane discipline, one-way pedestrian flow, barrier control and surge de-escalation.",
    category: "crowd_management",
    mode: "hybrid",
    trainer: "Chief Warden K. Bhosale",
    venueOrLink: "Seva hall · Panchavati / meet.kumbhsetu.org/crowd",
    startAt: "2026-10-20T09:00:00.000Z",
    endAt: "2026-10-20T13:00:00.000Z",
    capacity: 60,
    attendanceRequired: true,
    completionCriteria: "Attend the full session and pass the 8-question briefing check.",
    lifecycle: "completed",
    createdAt: "2026-10-10T08:00:00.000Z",
  },
  {
    id: "tr-02",
    title: "First aid & heat exhaustion emergency response",
    description: "Stabilize patient, administer ORS, triage burns/fractures, coordinate with medical post.",
    category: "first_aid",
    mode: "offline",
    trainer: "Dr. Anand Deshmukh (Civil Hospital)",
    venueOrLink: "Medical Camp 1 — Ramkund Compound",
    startAt: "2026-10-24T08:00:00.000Z",
    endAt: "2026-10-24T12:00:00.000Z",
    capacity: 45,
    attendanceRequired: true,
    completionCriteria: "Attend and complete practical CPR & splinting stations.",
    lifecycle: "completed",
    createdAt: "2026-10-14T08:00:00.000Z",
  },
  {
    id: "tr-03",
    title: "Kumbh operations orientation & Setu protocols",
    description: "Zone geography, supervisor hierarchy, Setu app telemetry and incident hand-off.",
    category: "kumbh_orientation",
    mode: "online",
    trainer: "Control Room Ops Lead",
    venueOrLink: "meet.kumbhsetu.org/ops-orientation",
    startAt: "2026-10-28T10:00:00.000Z",
    endAt: "2026-10-28T12:00:00.000Z",
    capacity: 100,
    attendanceRequired: true,
    completionCriteria: "Attend live session or approved recording with 80% quiz score.",
    lifecycle: "completed",
    createdAt: "2026-10-20T08:00:00.000Z",
  },
  {
    id: "tr-04",
    title: "Missing-person desk & child protection protocol",
    description: "Intake form, wristband verification, announcement PA system, parent reunification.",
    category: "missing_person",
    mode: "offline",
    trainer: "Smt. V. Bhalerao (BSG)",
    venueOrLink: "Central Lost & Found Booth — Ghat 4",
    startAt: "2026-10-30T14:00:00.000Z",
    endAt: "2026-10-30T17:00:00.000Z",
    capacity: 35,
    attendanceRequired: true,
    completionCriteria: "Attend and shadow sample child intake exercise.",
    lifecycle: "completed",
    createdAt: "2026-10-25T08:00:00.000Z",
  },
  {
    id: "tr-05",
    title: "Riverbank safety & pontoon bridge crowd management",
    description: "Pontoon bridge load balancing, riverbank slip prevention and rope cordon safety.",
    category: "volunteer_safety",
    mode: "offline",
    trainer: "Col. S. Thorat (MDRV)",
    venueOrLink: "Godavari Pontoon Bridge No. 2",
    startAt: "2026-10-31T09:00:00.000Z",
    endAt: "2026-10-31T12:00:00.000Z",
    capacity: 40,
    attendanceRequired: true,
    completionCriteria: "Physical drill on pontoon evacuation and life-jacket readiness.",
    lifecycle: "in_progress",
    createdAt: "2026-10-26T08:00:00.000Z",
  },
  {
    id: "tr-06",
    title: "Multilingual pilgrim translation & empathy communication",
    description: "Assisting devotees speaking Hindi, Tamil, Telugu, Gujarati with local directions.",
    category: "communication",
    mode: "hybrid",
    trainer: "Prof. S. Joshi (Languages Dept)",
    venueOrLink: "meet.kumbhsetu.org/language",
    startAt: "2026-11-03T14:00:00.000Z",
    endAt: "2026-11-03T16:00:00.000Z",
    capacity: 50,
    attendanceRequired: true,
    completionCriteria: "Complete conversational translation test.",
    lifecycle: "scheduled",
    createdAt: "2026-10-28T08:00:00.000Z",
  },
];

export const INITIAL_DEPLOYMENTS: Deployment[] = [
  {
    id: "dep-01",
    name: "Ramkund North Ghat Morning Crowd Line",
    location: "Ramkund Ghat north steps approach",
    zoneId: "z01",
    sector: "S1-Ghat",
    dutyCategory: "crowd_management",
    shift: "morning",
    date: TODAY,
    startTime: "06:00",
    endTime: "14:00",
    requiredCount: 16,
    skillsRequired: ["crowd_marshal"],
    languagesPreferred: ["mr", "hi"],
    supervisor: "Inspector Anand Deshmukh",
    priority: "high",
    status: "active",
    requireVerified: true,
    requireTrained: true,
    createdAt: "2026-10-29T08:00:00.000Z",
  },
  {
    id: "dep-02",
    name: "Trimbakeshwar Temple Perimeter Medical Escort",
    location: "Trimbakeshwar Temple east queue",
    zoneId: "z04",
    sector: "S4-Temple",
    dutyCategory: "medical_support",
    shift: "morning",
    date: TODAY,
    startTime: "06:00",
    endTime: "14:00",
    requiredCount: 12,
    skillsRequired: ["first_aid", "medical_escort"],
    languagesPreferred: ["hi", "mr", "en"],
    supervisor: "Dr. K. Gite",
    priority: "high",
    status: "active",
    requireVerified: true,
    requireTrained: true,
    createdAt: "2026-10-29T08:00:00.000Z",
  },
  {
    id: "dep-03",
    name: "Tapovan Holding Area Shuttle & Queue Management",
    location: "Tapovan Sadhugram staging ground",
    zoneId: "z02",
    sector: "S2-Transit",
    dutyCategory: "crowd_management",
    shift: "afternoon",
    date: TODAY,
    startTime: "14:00",
    endTime: "22:00",
    requiredCount: 14,
    skillsRequired: ["crowd_marshal"],
    languagesPreferred: ["mr", "hi"],
    supervisor: "Sunil Pawar (MDRV)",
    priority: "high",
    status: "active",
    requireVerified: true,
    requireTrained: true,
    createdAt: "2026-10-29T08:00:00.000Z",
  },
  {
    id: "dep-04",
    name: "Panchavati River Corridor Night Watch & Escort",
    location: "Godavari River walkway corridor",
    zoneId: "z03",
    sector: "S3-Riverbank",
    dutyCategory: "general",
    shift: "night",
    date: TODAY,
    startTime: "22:00",
    endTime: "06:00",
    requiredCount: 10,
    skillsRequired: ["crowd_marshal"],
    languagesPreferred: ["mr", "hi"],
    supervisor: "Officer R. Patil",
    priority: "normal",
    status: "published",
    requireVerified: true,
    requireTrained: true,
    createdAt: "2026-10-29T08:00:00.000Z",
  },
  {
    id: "dep-05",
    name: "Ramkund South Ghat Holy Dip Afternoon Rotation",
    location: "Ramkund South steps & barricades",
    zoneId: "z01",
    sector: "S1-South",
    dutyCategory: "crowd_management",
    shift: "afternoon",
    date: TODAY,
    startTime: "14:00",
    endTime: "22:00",
    requiredCount: 14,
    skillsRequired: ["crowd_marshal"],
    languagesPreferred: ["mr", "hi"],
    supervisor: "Dipak Sonawane",
    priority: "high",
    status: "active",
    requireVerified: true,
    requireTrained: true,
    createdAt: "2026-10-30T08:00:00.000Z",
  },
  {
    id: "dep-06",
    name: "Kushavarta Kund Elderly & Family Assistance Desk",
    location: "Kushavarta Kund Main Gate",
    zoneId: "z04",
    sector: "S4-Kund",
    dutyCategory: "help_desk",
    shift: "morning",
    date: TODAY,
    startTime: "06:00",
    endTime: "14:00",
    requiredCount: 8,
    skillsRequired: ["translation", "help_desk"],
    languagesPreferred: ["mr", "hi", "ta", "en"],
    supervisor: "Nilesh Shinde",
    priority: "normal",
    status: "active",
    requireVerified: true,
    requireTrained: false,
    createdAt: "2026-10-30T08:00:00.000Z",
  },
  {
    id: "dep-07",
    name: "Tapovan Outer Highway Shuttle & Parking Marshalling",
    location: "Nashik-Dindori Road Holding Point 3",
    zoneId: "z05",
    sector: "S5-Parking",
    dutyCategory: "logistics",
    shift: "morning",
    date: TODAY,
    startTime: "06:00",
    endTime: "14:00",
    requiredCount: 8,
    skillsRequired: ["logistics"],
    languagesPreferred: ["mr", "hi"],
    supervisor: "Warden S. Thorat",
    priority: "normal",
    status: "active",
    requireVerified: false,
    requireTrained: false,
    createdAt: "2026-10-30T08:00:00.000Z",
  },
  {
    id: "dep-08",
    name: "Central Lost & Found Child Tagging & Help Desk",
    location: "Ramkund Control Post No. 1",
    zoneId: "z01",
    sector: "S1-Booth",
    dutyCategory: "lost_found",
    shift: "afternoon",
    date: TODAY,
    startTime: "14:00",
    endTime: "22:00",
    requiredCount: 8,
    skillsRequired: ["lost_found", "translation"],
    languagesPreferred: ["hi", "mr", "en"],
    supervisor: "Mrs. V. Bhalerao",
    priority: "high",
    status: "active",
    requireVerified: true,
    requireTrained: true,
    createdAt: "2026-10-30T08:00:00.000Z",
  },
];

export const INITIAL_ACCOMMODATION: Accommodation[] = [
  { id: "ac-01", name: "Seva Dormitory · Panchavati Central", address: "Panchavati Ghat Road, Nashik", type: "dormitory", zoneId: "z01", capacity: 60 },
  { id: "ac-02", name: "Trimbakeshwar Staging Camp No. 1", address: "Approach Road, Trimbakeshwar", type: "staging_camp", zoneId: "z04", capacity: 40 },
  { id: "ac-03", name: "Tapovan Transit Volunteer Barracks", address: "Sadhugram Sector 2, Tapovan", type: "staging_camp", zoneId: "z02", capacity: 50 },
  { id: "ac-04", name: "Godavari Riverbank Scout Shelter", address: "Near Old Pontoon, Godavari", type: "shared_room", zoneId: "z03", capacity: 30 },
];

// Names catalog for generating realistic Indian volunteer personnel
const FIRST_NAMES_MALE = [
  "Sachin", "Rahul", "Rohan", "Aditya", "Nikhil", "Aarav", "Vivek", "Rajesh",
  "Tanmay", "Aniket", "Amit", "Sagar", "Swapnil", "Manoj", "Pranav", "Tejas",
  "Vishal", "Vikram", "Chetan", "Mahesh", "Gaurav", "Akshay", "Shrikant",
  "Santosh", "Mayur", "Bhushan", "Harish", "Deepak", "Nitin", "Prashant",
  "Dinesh", "Kunal", "Tushar", "Siddharth", "Yogesh", "Ajay", "Devendra"
];

const FIRST_NAMES_FEMALE = [
  "Priya", "Sneha", "Neha", "Pooja", "Anjali", "Shreya", "Tanvi", "Kavita",
  "Rutuja", "Meera", "Smita", "Swati", "Manasi", "Deepali", "Aarti", "Vaishali",
  "Radhika", "Preeti", "Shweta", "Archana", "Jyoti", "Pallavi", "Ashwini",
  "Rupali", "Madhuri", "Sunita", "Sarita", "Namrata", "Kalyani", "Gayatri"
];

const LAST_NAMES = [
  "Patil", "Deshmukh", "Kulkarni", "Shinde", "Pawar", "Joshi", "Gaikwad", "More",
  "Chavan", "Jadhav", "Bhosale", "Kale", "Wagh", "Gite", "Salunke", "Phadke",
  "Sonawane", "Dhumal", "Jagtap", "Bhalerao", "Thorat", "Mahajan", "Khairnar",
  "Tambe", "Mishra", "Sharma", "Yadav", "Patel", "Shah", "Nair", "Iyer", "Rao"
];

const CATEGORIES: VolunteerCategory[] = [
  "crowd_management",
  "medical_support",
  "help_desk",
  "logistics",
  "lost_found",
  "general",
];

const ZONES_LIST = ["z01", "z02", "z03", "z04", "z05"];
const NGOS_LIST = ["ngo-01", "ngo-02", "ngo-03", "ngo-04", "ngo-05", "ngo-06", ""];

export function generateSyntheticVolunteerForce(targetCount = 115): {
  volunteers: Volunteer[];
  enrollments: TrainingEnrollment[];
  assignments: RosterAssignment[];
  attendance: AttendanceRecord[];
  meals: MealAllocation[];
  beds: AccommodationAssignment[];
  activities: FieldActivity[];
  verificationEvents: IdentityVerificationEvent[];
} {
  const volunteers: Volunteer[] = [];
  const enrollments: TrainingEnrollment[] = [];
  const assignments: RosterAssignment[] = [];
  const attendance: AttendanceRecord[] = [];
  const meals: MealAllocation[] = [];
  const beds: AccommodationAssignment[] = [];
  const activities: FieldActivity[] = [];
  const verificationEvents: IdentityVerificationEvent[] = [];

  // Track deployment headcount
  const depSlotCount: Record<string, number> = {};

  for (let i = 0; i < targetCount; i++) {
    const idNum = 301 + i;
    const id = `V-${idNum}`;
    const isFemale = i % 3 === 0;
    const firstName = isFemale
      ? FIRST_NAMES_FEMALE[i % FIRST_NAMES_FEMALE.length]
      : FIRST_NAMES_MALE[i % FIRST_NAMES_MALE.length];
    const lastName = LAST_NAMES[(i * 3 + (isFemale ? 5 : 2)) % LAST_NAMES.length];
    const name = `${firstName} ${lastName}`;

    const zoneId = ZONES_LIST[i % ZONES_LIST.length];
    const ngoId = NGOS_LIST[i % NGOS_LIST.length] || undefined;
    const category = CATEGORIES[i % CATEGORIES.length];

    const yob = String(1975 + (i % 31)); // 1975 to 2005 (Age 21 to 51)
    const gender: VolunteerGender = isFemale ? "female" : "male";

    const langChoice: LanguageCode[] =
      i % 7 === 0
        ? ["mr", "hi", "en", "ta"]
        : i % 4 === 0
        ? ["mr", "hi", "en"]
        : i % 3 === 0
        ? ["mr", "hi"]
        : ["mr", "en"];
    const preferredLanguage = langChoice[0];

    const skills: string[] =
      category === "crowd_management"
        ? ["crowd_marshal", "translation"]
        : category === "medical_support"
        ? ["first_aid", "medical_escort"]
        : category === "lost_found"
        ? ["lost_found", "translation"]
        : category === "help_desk"
        ? ["translation", "help_desk"]
        : ["logistics", "crowd_marshal"];

    // Verification status distribution
    // 68% verified, 16% manual_review, 8% verification_pending, 4% failed, 4% consent_pending
    const vMod = i % 25;
    let vStatus: Volunteer["identityVerificationStatus"] = "verified";
    if (vMod === 21 || vMod === 22) vStatus = "manual_review";
    else if (vMod === 23) vStatus = "verification_pending";
    else if (vMod === 24) vStatus = "failed";
    else if (vMod === 20) vStatus = "consent_pending";

    // Field duty status distribution
    // 25% on_duty, 15% checked_in, 15% assigned, 10% awaiting_checkin, 15% shift_complete, 4% needs_assistance, 3% absent, rest not_deployed
    const fMod = i % 20;
    let fStatus: Volunteer["fieldDutyStatus"] = "not_deployed";
    if (vStatus === "verified") {
      if (fMod <= 5) fStatus = "on_duty";
      else if (fMod <= 8) fStatus = "checked_in";
      else if (fMod <= 11) fStatus = "assigned";
      else if (fMod <= 13) fStatus = "awaiting_checkin";
      else if (fMod <= 16) fStatus = "shift_complete";
      else if (fMod === 17) fStatus = "needs_assistance";
      else if (fMod === 18) fStatus = "absent";
    }

    const phone = `9${String(800000000 + i * 137).slice(0, 9)}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@kumbhseva.demo.test`;

    const dayEnrolled = String(10 + (i % 18)).padStart(2, "0");
    const enrolledAt = `2026-10-${dayEnrolled}T08:30:00.000Z`;

    // Coordinates jitter inside zone
    const posX = 120 + ((i * 37) % 650);
    const posY = 140 + ((i * 29) % 550);

    const shiftStart = i % 3 === 0 ? "06:00" : i % 3 === 1 ? "14:00" : "22:00";
    const shiftEnd = i % 3 === 0 ? "14:00" : i % 3 === 1 ? "22:00" : "06:00";

    const volunteer: Volunteer = {
      id,
      name,
      zoneId,
      position: { x: posX, y: posY },
      availability: fStatus === "absent" ? "off_duty" : fStatus === "on_duty" ? "on_task" : "available",
      skills,
      languages: langChoice,
      shiftStart,
      shiftEnd,
      lastSeen: fStatus === "on_duty" || fStatus === "checked_in" ? "moments ago" : "2 hours ago",
      ngoId,
      category,
      preferredLanguage,
      yearOfBirth: yob,
      gender,
      phone,
      email,
      emergencyContactName: `${LAST_NAMES[(i + 4) % LAST_NAMES.length]} (Family)`,
      addressLine: `${(i % 14) + 1}, Shanti Nagar, Panchavati`,
      state: "Maharashtra",
      district: "Nashik",
      experience: i % 2 === 0 ? "Simhastha 2015 volunteer / NSS volunteer" : "Civil defense certified",
      availabilityWindow: i % 4 === 0 ? "weekends" : "full_time",
      preferredArea: zoneId === "z01" ? "Ramkund Ghats" : zoneId === "z04" ? "Trimbakeshwar Temple" : "Tapovan Sadhugram",
      hasAccessibilityNeed: i % 19 === 0,
      identityVerificationStatus: vStatus,
      identityVerificationRef: vStatus === "verified" ? `VR-DEMO-${idNum}` : undefined,
      identityConsentAt: enrolledAt,
      identityMethod: "manual_document_review",
      fieldDutyStatus: fStatus,
      supervisorName: zoneId === "z04" ? "Dr. K. Gite" : "Inspector A. Deshmukh",
      reportingPoint: zoneId === "z01" ? "Ramkund North Gate" : zoneId === "z04" ? "Kushavarta Point" : "Tapovan Gate 2",
      sector: `Sector-${(i % 5) + 1}`,
      registrationComplete: true,
      isSyntheticDemo: true, // Prominent synthetic indicator
    };

    volunteers.push(volunteer);

    // 1. Verification History Logs
    if (vStatus === "verified") {
      verificationEvents.push({
        id: `ve-demo-${idNum}`,
        volunteerId: id,
        status: "verified",
        at: enrolledAt,
        actor: "Desk Officer · Collectorate Oversight",
        note: "Verified photo identity against official NGO credential list. No biometrics stored.",
        reference: `VR-DEMO-${idNum}`,
      });
    } else if (vStatus === "manual_review") {
      verificationEvents.push({
        id: `ve-demo-${idNum}`,
        volunteerId: id,
        status: "manual_review",
        at: enrolledAt,
        actor: "Auto Verification Gate",
        note: "Awaiting physical document verification at Panchavati Control Desk.",
      });
    } else if (vStatus === "failed") {
      verificationEvents.push({
        id: `ve-demo-${idNum}`,
        volunteerId: id,
        status: "failed",
        at: enrolledAt,
        actor: "Desk Officer · Collectorate Oversight",
        note: "Discrepancy in declared credentials or minimum age policy check.",
      });
    }

    // 2. Training Enrollments
    if (vStatus === "verified" || vStatus === "manual_review") {
      const sess = INITIAL_TRAINING[i % INITIAL_TRAINING.length];
      const isCompleted = i % 5 !== 0;
      enrollments.push({
        id: `te-demo-${idNum}`,
        sessionId: sess.id,
        volunteerId: id,
        status: isCompleted ? "completed" : "attended",
        enrolledAt,
        attendedAt: `${TODAY}T09:00:00.000Z`,
        completedAt: isCompleted ? `${TODAY}T12:00:00.000Z` : undefined,
        assessmentScore: isCompleted ? 82 + (i % 17) : undefined,
        certificateIssued: isCompleted,
      });
    }

    // 3. Deployment Roster Assignments
    if (["on_duty", "checked_in", "assigned", "awaiting_checkin", "shift_complete", "needs_assistance"].includes(fStatus)) {
      const matchingDep = INITIAL_DEPLOYMENTS.find((d) => d.zoneId === zoneId) || INITIAL_DEPLOYMENTS[0];
      const currentCount = depSlotCount[matchingDep.id] || 0;
      if (currentCount < matchingDep.requiredCount * 1.5) {
        depSlotCount[matchingDep.id] = currentCount + 1;
        assignments.push({
          id: `ra-demo-${idNum}`,
          deploymentId: matchingDep.id,
          volunteerId: id,
          slotIndex: currentCount + 1,
          assignedAt: "2026-10-30T10:00:00.000Z",
          assignedBy: "Auto-Roster Engine",
        });
      }
    }

    // 4. Attendance Today
    if (["on_duty", "checked_in", "shift_complete", "needs_assistance", "absent"].includes(fStatus)) {
      const attStatus: AttendanceStatus =
        fStatus === "absent"
          ? "absent"
          : i % 9 === 0
          ? "late"
          : i % 17 === 0
          ? "leave"
          : "present";

      attendance.push({
        id: `att-demo-${idNum}`,
        volunteerId: id,
        kind: "deployment",
        sessionId: "morning-shift",
        date: TODAY,
        markedAt: `${TODAY}T${attStatus === "late" ? "06:45" : "06:05"}:00.000Z`,
        status: attStatus,
        markedBy: "Duty Officer (Supervisor QR Scan)",
        method: "qr",
        checkInAt: attStatus !== "absent" && attStatus !== "leave" ? `${TODAY}T06:05:00.000Z` : undefined,
        checkOutAt: fStatus === "shift_complete" ? `${TODAY}T14:10:00.000Z` : undefined,
        corrections: [],
      });
    }

    // 5. Meals for Today
    if (["on_duty", "checked_in", "shift_complete", "needs_assistance"].includes(fStatus)) {
      const mealType: MealType = i % 3 === 0 ? "breakfast" : i % 3 === 1 ? "lunch" : "dinner";
      const mStatus: MealDistributionStatus = i % 7 === 0 ? "entitled" : i % 13 === 0 ? "skipped" : "issued";

      meals.push({
        id: `meal-demo-${idNum}`,
        volunteerId: id,
        date: TODAY,
        meal: mealType,
        location: zoneId === "z04" ? "Langar Seva — Kushavarta Ghat" : "Central Volunteer Langar #1 — Panchavati",
        shift: shiftStart === "06:00" ? "morning" : shiftStart === "14:00" ? "afternoon" : "night",
        entitled: true,
        status: mStatus,
      });
    }

    // 6. Beds & Accommodation
    if (i % 2 === 0) {
      const acc = INITIAL_ACCOMMODATION[i % INITIAL_ACCOMMODATION.length];
      const bedNum = ((i * 2) % acc.capacity) + 1;
      beds.push({
        id: `bed-demo-${idNum}`,
        accommodationId: acc.id,
        volunteerId: id,
        bedLabel: `${acc.id === "ac-01" ? "A" : acc.id === "ac-02" ? "T" : "B"}-${String(bedNum).padStart(2, "0")}`,
        checkInAt: "2026-10-30T21:00:00.000Z",
      });
    }

    // 7. Field Activity Logs
    if (fStatus === "on_duty" || fStatus === "needs_assistance" || fStatus === "shift_complete") {
      const actType: FieldActivityType =
        fStatus === "needs_assistance"
          ? "assistance_request"
          : fStatus === "shift_complete"
          ? "complete_shift"
          : i % 2 === 0
          ? "start_duty"
          : "field_note";

      const note =
        actType === "assistance_request"
          ? "High pilgrim surge at west lane; requesting 2 additional marshals."
          : actType === "complete_shift"
          ? "Shift completed cleanly, handed over barrier log to next rotation."
          : actType === "start_duty"
          ? "Reported to post, radio check verified."
          : "Corridor queue flowing orderly; drinking water post replenished.";

      activities.push({
        id: `fa-demo-${idNum}`,
        volunteerId: id,
        type: actType,
        at: `${TODAY}T${String(7 + (i % 7)).padStart(2, "0")}:15:00.000Z`,
        note,
      });
    }
  }

  return {
    volunteers,
    enrollments,
    assignments,
    attendance,
    meals,
    beds,
    activities,
    verificationEvents,
  };
}

export const INITIAL_SAVED_FILTERS: SavedVolunteerFilter[] = [
  { id: "sf-01", name: "Manual Review Queue", query: { verification: "manual_review" } },
  { id: "sf-02", name: "On Field Volunteers", query: { fieldStatus: "on_duty" } },
  { id: "sf-03", name: "Medical Escort Qualified", query: { skill: "first_aid" } },
  { id: "sf-04", name: "Trimbakeshwar Sector", query: { zoneId: "z04" } },
];

export function volunteerOpsSeed() {
  const generated = generateSyntheticVolunteerForce(120);

  // Combine base with rich 120-person synthetic force
  const enrichedBase = VOLUNTEERS.map((v) => ({
    ...v,
    isSyntheticDemo: true,
    identityVerificationStatus: "verified" as const,
    fieldDutyStatus: "on_duty" as const,
    registrationComplete: true,
  }));

  const allVolunteers = [...enrichedBase, ...generated.volunteers];

  return {
    volunteers: allVolunteers,
    ngos: INITIAL_NGOS,
    trainingSessions: INITIAL_TRAINING,
    trainingEnrollments: generated.enrollments,
    deployments: INITIAL_DEPLOYMENTS,
    rosterAssignments: generated.assignments,
    attendanceRecords: generated.attendance,
    mealAllocations: generated.meals,
    accommodations: INITIAL_ACCOMMODATION,
    accommodationAssignments: generated.beds,
    fieldActivities: generated.activities,
    identityEvents: generated.verificationEvents,
    savedVolunteerFilters: INITIAL_SAVED_FILTERS,
    volunteerSeq: 550,
  };
}

export { ZONES };
