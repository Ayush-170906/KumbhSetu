// Saves the store to localStorage on every change and restores it on load,
// so refreshing the page mid-demo (or a judge accidentally reloading) does
// not silently reset every incident/task back to the seed data. "Reset
// simulation" in Management still clears this deliberately via resetAll().
//
// Deliberately self-contained (no import of useAppStore or sync.ts) to keep
// this a one-directional dependency: useAppStore -> persist.

const STORAGE_KEY = "kumbh-setu-state-v1";

// Keep this list of action/function keys in sync with sync.ts's ACTION_KEYS
// — both exist to strip functions out of the state before serializing it.
const ACTION_KEYS = new Set([
  "initSimulation",
  "tick",
  "setConnectivity",
  "createIncident",
  "triageIncident",
  "dispatchIncident",
  "submitSOS",
  "acceptTask",
  "declineTask",
  "arriveTask",
  "resolveTask",
  "setVolunteerAvailability",
  "enrollVolunteer",
  "startDemo",
  "pauseDemo",
  "resumeDemo",
  "skipDemoStep",
  "restartDemo",
  "exitDemo",
  "resetDemo",
  "resetAll",
  "setLanguage",
  "publishAdvisory",
  "retractAdvisory",
  "reportFoundPerson",
  "confirmLostFoundMatch",
  "attachPhoto",
  "sendZoneMessage",
  "submitFeedback",
  "issueEPass",
  "createFamilyGroup",
  "addFamilyMember",
  "removeFamilyMember",
  "setFamilyMeetingPoint",
  "createGroundReport",
  "corroborateGroundReport",
  "updateGroundReportStatus",
  "promoteReportToIncident",
  "flushOfflineReports",
  "recordSetuAudit",
]);

function extractPersistableData(state: object): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(state)) {
    if (!ACTION_KEYS.has(key)) data[key] = value;
  }
  return data;
}

export function loadPersistedState(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

let initialized = false;

export function initPersistence(store: { subscribe: (fn: (state: object) => void) => void }) {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  store.subscribe((state) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(extractPersistableData(state)));
    } catch {
      // Storage full/unavailable (private browsing, quota) — demo still
      // works in-memory for the session, it just won't survive a reload.
    }
  });
}
