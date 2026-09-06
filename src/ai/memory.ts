// Short-lived session memory for the companion (§9/§32).
//
// Setu resolves "she", "there", "the child" within a conversation, but that
// context must not live forever — it expires on an idle timeout and on an
// explicit end-of-session. Nothing here is persisted to disk.

import type { LanguageCode, GroundReportCategory } from "@/lib/types";

const DEFAULT_TTL_MS = 8 * 60 * 1000; // 8 minutes idle → context cleared

export interface SessionMemory {
  entities: Record<string, string>;
  translationPair?: { volunteer: LanguageCode; other: LanguageCode };
  pendingReportCategory?: GroundReportCategory;
  /** Setu just asked "which language is the pilgrim speaking?" and is waiting
   *  for a bare answer like "marathi" that wouldn't classify on its own. */
  awaitingTranslationLanguage?: boolean;
  lastActivityAt: number;
}

function empty(): SessionMemory {
  return { entities: {}, lastActivityAt: Date.now() };
}

export class SetuMemory {
  private mem: SessionMemory = empty();
  private ttl: number;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttl = ttlMs;
  }

  private gcIfStale() {
    if (Date.now() - this.mem.lastActivityAt > this.ttl) {
      this.mem = empty();
    }
  }

  touch() {
    this.mem.lastActivityAt = Date.now();
  }

  snapshot(): SessionMemory {
    this.gcIfStale();
    return {
      entities: { ...this.mem.entities },
      translationPair: this.mem.translationPair,
      pendingReportCategory: this.mem.pendingReportCategory,
      awaitingTranslationLanguage: this.mem.awaitingTranslationLanguage,
      lastActivityAt: this.mem.lastActivityAt,
    };
  }

  /** Pull simple referents out of a message so later turns can resolve them. */
  observe(message: string) {
    this.gcIfStale();
    this.touch();
    const m = this.mem;

    const person = message.match(
      /\b(my|her|his|their|the)\s+(mother|father|son|daughter|wife|husband|child|kid|friend|brother|sister|grandmother|grandfather|elder)\b/i
    );
    if (person) m.entities.subject = `${person[1].toLowerCase()} ${person[2].toLowerCase()}`;

    const loc = message.match(
      /\b(?:near|at|by|beside|outside|inside)\s+((?:gate|ghat|camp|block|desk|bridge|tower|sector|zone)\s*[a-z0-9-]+)\b/i
    );
    if (loc) m.entities.location = loc[1].replace(/\s+/g, " ").trim();

    const named = message.match(/\bnamed?\s+([A-Z][a-z]+)\b/);
    if (named) m.entities.name = named[1];
  }

  setEntity(key: string, value: string) {
    this.touch();
    this.mem.entities[key] = value;
  }

  startTranslation(volunteer: LanguageCode, other: LanguageCode) {
    this.touch();
    this.mem.translationPair = { volunteer, other };
    this.mem.awaitingTranslationLanguage = false;
  }

  endTranslation() {
    this.touch();
    this.mem.translationPair = undefined;
    this.mem.awaitingTranslationLanguage = false;
  }

  /** Setu asked which language the pilgrim speaks; the next turn should be
   *  read as the answer even if it's just "marathi". */
  setAwaitingTranslationLanguage(value: boolean) {
    this.touch();
    this.mem.awaitingTranslationLanguage = value;
  }

  setPendingReport(category: GroundReportCategory | undefined) {
    this.touch();
    this.mem.pendingReportCategory = category;
  }

  /** Full reset — called when the volunteer ends the session (§9/§32). */
  clear() {
    this.mem = empty();
  }
}
