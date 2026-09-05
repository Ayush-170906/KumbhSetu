// Central mock-backend abstraction.
//
// UI components should read/write through these functions rather than
// reaching into the store or seed data directly. Today every function is a
// thin wrapper over the in-memory Zustand store (see src/store/useAppStore.ts)
// with a small artificial delay to mimic network latency. Swapping this file
// for real HTTP/WebSocket calls later would not require changing any screen.

import { useAppStore, type ReportIncidentInput } from "@/store/useAppStore";
import { initCrossTabSync } from "@/store/sync";

const LATENCY_MS = 180;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

export async function getZones() {
  return delay(useAppStore.getState().zones);
}

export async function getIncidents() {
  return delay(useAppStore.getState().incidents);
}

export async function getVolunteers() {
  return delay(useAppStore.getState().volunteers);
}

export async function getFacilities() {
  return delay(useAppStore.getState().facilities);
}

export async function getRiskSnapshots() {
  return delay(useAppStore.getState().riskSnapshots);
}

export async function getResources() {
  return delay(useAppStore.getState().resources);
}

export async function createIncident(input: ReportIncidentInput) {
  const incident = useAppStore.getState().submitSOS(input);
  return delay(incident);
}

export async function assignVolunteer(incidentId: string) {
  useAppStore.getState().dispatchIncident(incidentId);
  return delay(true);
}

export async function updateIncidentStatus(taskId: string, action: "accept" | "decline" | "arrive" | "resolve" | "escalate") {
  const store = useAppStore.getState();
  if (action === "accept") store.acceptTask(taskId);
  if (action === "decline") store.declineTask(taskId);
  if (action === "arrive") store.arriveTask(taskId);
  if (action === "resolve") store.resolveTask(taskId, "resolved");
  if (action === "escalate") store.resolveTask(taskId, "escalated");
  return delay(true);
}

/**
 * Subscribes to the realtime event simulator. In a production deployment
 * this would open a WebSocket/SSE connection; here it starts the local
 * interval-based simulator that gently drifts zone density/risk and moves
 * on-task volunteers toward their assigned incident, and wires up
 * cross-tab sync so Pilgrim/Volunteer/Management stay connected when
 * opened in separate browser tabs.
 *
 * Only one tab should "drive" the ambient simulation tick — pass
 * `drive: true` from the Management control room. Every tab still reacts
 * instantly to real actions (SOS, accept, arrive, resolve) regardless of
 * which tab is driving the ambient tick.
 */
export function subscribeToRealtimeEvents(options: { drive?: boolean } = {}) {
  initCrossTabSync();
  if (options.drive) {
    useAppStore.getState().initSimulation();
  }
}
