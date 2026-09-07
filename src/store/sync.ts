import { useAppStore } from "./useAppStore";

// Cross-tab synchronization. The store itself is an in-memory, per-tab
// Zustand instance — there is no backend. When a presenter opens Pilgrim,
// Volunteer and Management in three separate tabs (the realistic way to
// demo three role experiences side by side), this keeps them in sync via
// BroadcastChannel so an action in one tab is reflected in the others
// within the same browser, without needing a server round trip.

const CHANNEL_NAME = "kumbh-setu-sync-v1";

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

function extractData(state: object): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(state)) {
    if (!ACTION_KEYS.has(key)) data[key] = value;
  }
  return data;
}

let initialized = false;
let applyingRemote = false;

export function initCrossTabSync() {
  if (initialized || typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  initialized = true;

  const channel = new BroadcastChannel(CHANNEL_NAME);

  channel.onmessage = (event: MessageEvent) => {
    applyingRemote = true;
    useAppStore.setState(event.data);
    applyingRemote = false;
  };

  useAppStore.subscribe((state) => {
    if (applyingRemote) return;
    channel.postMessage(extractData(state));
  });

  window.addEventListener("beforeunload", () => channel.close());
}
