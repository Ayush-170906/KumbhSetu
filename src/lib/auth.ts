"use client";

// Demo authentication for the prototype.
//
// This is NOT real auth — there is no server, no password hashing, no tokens.
// It exists so the three role apps can be opened as three separate signed-in
// tabs for a walkthrough. The session is kept in `sessionStorage`, which is
// per-tab, so tab 1 can be a Pilgrim while tab 2 is a Volunteer and tab 3 is
// Management at the same time. Production replaces this file with SSO + RBAC
// (see docs / PROTOTYPE.md); the `role` here already lines up with the store's
// Role type and the Setu persona.

export type DemoRole = "pilgrim" | "volunteer" | "management";

export interface DemoAccount {
  username: string;
  password: string;
  role: DemoRole;
  label: string;
  /** Where a successful sign-in lands. */
  home: string;
  blurb: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: "pilgrim",
    password: "kumbh2027",
    role: "pilgrim",
    label: "Pilgrim",
    home: "/pilgrim",
    blurb: "Mobile app — map, SOS, facilities, Lost & Found, and Kumbh Setu AI.",
  },
  {
    username: "volunteer",
    password: "kumbh2027",
    role: "volunteer",
    label: "Volunteer (Sevak)",
    home: "/field",
    blurb: "Field companion — voice, translation, ground reports, tasks.",
  },
  {
    username: "management",
    password: "kumbh2027",
    role: "management",
    label: "Organization / Control Room",
    home: "/management",
    blurb: "Control room — live ops, Kumbh Pulse, Ops Copilot, advisories, audit log.",
  },
];

export interface DemoSession {
  username: string;
  role: DemoRole;
  label: string;
  home: string;
  at: string;
}

const KEY = "kumbh-setu-session-v1";

function isBrowser() {
  return typeof window !== "undefined";
}

export function login(username: string, password: string): DemoSession | null {
  const u = username.trim().toLowerCase();
  const acct = DEMO_ACCOUNTS.find((a) => a.username === u && a.password === password);
  if (!acct) return null;
  const session: DemoSession = {
    username: acct.username,
    role: acct.role,
    label: acct.label,
    home: acct.home,
    at: new Date().toISOString(),
  };
  if (isBrowser()) {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(session));
    } catch {
      /* private mode — session just won't persist across a reload */
    }
  }
  return session;
}

export function getSession(): DemoSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as DemoSession;
    if (s && typeof s.role === "string") return s;
    return null;
  } catch {
    return null;
  }
}

export function logout() {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/** Roles allowed to view a given app area. */
export function roleCanAccess(role: DemoRole, area: DemoRole): boolean {
  return role === area;
}
