import assert from "node:assert/strict";

async function main() {
const values = new Map<string, string>();
const localStorage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, value); },
  removeItem: (key: string) => { values.delete(key); },
  clear: () => values.clear(),
};

class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  messages: unknown[] = [];
  constructor() { FakeBroadcastChannel.instances.push(this); }
  postMessage(message: unknown) {
    structuredClone(message);
    this.messages.push(message);
  }
  close() {}
}

const fakeWindow = {
  localStorage,
  BroadcastChannel: FakeBroadcastChannel,
  addEventListener() {},
} as unknown as Window;
Object.assign(globalThis, { window: fakeWindow, BroadcastChannel: FakeBroadcastChannel });

const { useAppStore } = await import("../src/store/useAppStore");
const { initCrossTabSync } = await import("../src/store/sync");
initCrossTabSync();
const channel = FakeBroadcastChannel.instances[0];

const store = useAppStore.getState();
store.resetAll();
assert.doesNotThrow(() => useAppStore.getState().setDemoScenario("medical"), "scenario selection broadcasts only serializable state");
assert.equal(useAppStore.getState().demo.scenario, "medical");
useAppStore.getState().setDemoScenario("missing");
const sentinel = store.createIncident({
  type: "facility",
  severity: "low",
  zoneId: "z02",
  reportedBy: { role: "management", label: "Existing normal simulation" },
  summary: "Data that must survive a demo run.",
});
const beforeDemo = localStorage.getItem("kumbh-setu-state-v1");
assert.ok(beforeDemo, "normal application state is persisted before the demo");

function advance(steps: number) {
  for (let i = 0; i < steps; i += 1) useAppStore.getState().skipDemoStep();
}

function verifyResponseLifecycle(expectedType: "medical" | "crowd_pressure") {
  const state = useAppStore.getState();
  const incident = state.incidents.find((item) => item.id === state.demo.activeIncidentId);
  assert.ok(incident, `${expectedType} incident is created by the demo workflow`);
  assert.equal(incident.type, expectedType);
  assert.equal(incident.status, "resolved");
  assert.ok(incident.assignedVolunteerId, "an available volunteer is assigned");
  assert.ok(state.tasks.some((task) => task.id === state.demo.activeTaskId && task.state === "resolved"));
  assert.deepEqual(
    incident.timeline.filter((event) => ["triaged", "dispatched", "acknowledged", "responding", "resolved"].includes(event.status)).map((event) => event.status),
    ["triaged", "dispatched", "acknowledged", "responding", "resolved"],
  );
}

// Medical scenario: verify normal storage and cross-tab traffic stay untouched.
store.startDemo("medical");
assert.equal(useAppStore.getState().demo.isolationActive, true);
assert.equal(localStorage.getItem("kumbh-setu-state-v1"), beforeDemo, "demo state does not overwrite local storage");
const messageCount = channel.messages.length;
channel.onmessage?.({ data: { incidents: [{ id: "remote-normal-tab" }] } } as MessageEvent);
assert.ok(!useAppStore.getState().incidents.some((item) => item.id === "remote-normal-tab"), "normal-tab updates do not enter the demo view");
advance(4);
const medicalState = useAppStore.getState();
const medicalTask = medicalState.tasks.find((item) => item.id === medicalState.demo.activeTaskId);
assert.ok(medicalTask, "medical workflow creates an assignable task");
useAppStore.getState().addIncidentNote(medicalTask.incidentId, "Responder en route to the reported location.", "Test volunteer");
assert.ok(useAppStore.getState().incidents.find((item) => item.id === medicalTask.incidentId)?.timeline.some((event) => event.status === "note" && event.detail === "Responder en route to the reported location."), "response note is appended to the incident timeline");
advance(3);
verifyResponseLifecycle("medical");
assert.equal(channel.messages.length, messageCount, "demo state is not broadcast to normal tabs");
useAppStore.getState().exitDemo();
assert.ok(useAppStore.getState().incidents.some((item) => item.id === sentinel.id), "exit restores existing application data");

// Crowd scenario: replay and scenario switching reset only the isolated copy.
useAppStore.getState().startDemo("crowd");
advance(7);
verifyResponseLifecycle("crowd_pressure");
useAppStore.getState().restartDemo("medical");
assert.equal(useAppStore.getState().demo.scenario, "medical", "scenario switching restarts with the selected scenario");
assert.equal(useAppStore.getState().demo.activeIncidentId, undefined, "scenario switch clears the previous scenario records");
advance(4);
const escalationTask = useAppStore.getState().tasks.find((task) => task.id === useAppStore.getState().demo.activeTaskId);
assert.ok(escalationTask);
useAppStore.getState().resolveTask(escalationTask.id, "escalated");
assert.equal(useAppStore.getState().incidents.find((item) => item.id === escalationTask.incidentId)?.status, "escalated", "field escalation is recorded");
useAppStore.getState().restartDemo("missing");
assert.equal(useAppStore.getState().demo.activeIncidentId, undefined, "scenario switch clears escalated scenario state");
useAppStore.getState().exitDemo();

// Preserve and verify the original two-report missing-child guided scenario.
useAppStore.getState().startDemo("missing");
advance(18);
const state = useAppStore.getState();
const missingIncident = state.incidents.find((item) => item.id === state.demo.activeIncidentId);
assert.ok(missingIncident);
assert.equal(missingIncident.type, "lost_person");
assert.equal(missingIncident.status, "resolved");
assert.equal(state.groundReports.filter((report) => report.category === "lost_person").length, 2);
useAppStore.getState().exitDemo();
assert.ok(useAppStore.getState().incidents.some((item) => item.id === sentinel.id), "missing-person exit also restores normal data");

console.log("Demo workflow tests passed: medical, crowd congestion, preserved missing-child flow, replay, scenario switching, persistence isolation, BroadcastChannel isolation, and restore.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
