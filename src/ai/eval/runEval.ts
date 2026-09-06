// Setu reasoning-layer eval runner (§50).
//
//   npm run eval:setu
//
// Exercises the deterministic pieces without the store or React: intent
// classification, structured-output validity (validateTurn), tool SELECTION,
// confirmation policy, safety behaviour, hallucination resistance and latency.

import { classifyIntent } from "@/ai/intents";
import { retrieve } from "@/ai/knowledge/kb";
import { validateTurn, type SetuTurn, type RetrievedContext } from "@/ai/schemas";
import { MockLLMProvider } from "@/ai/providers/mockLLMProvider";
import { needsConfirmation } from "@/ai/tools";
import { SCENARIOS, type Scenario } from "./scenarios";

const llm = new MockLLMProvider();

function ctxFor(message: string, intent: ReturnType<typeof classifyIntent>["intent"]): RetrievedContext {
  return {
    knowledge: retrieve(message, intent, 3).map((h) => ({ id: h.id, title: h.title, body: h.body, source: h.source })),
    operational: "Zone Ghat 4: crowd high 78%, risk yellow 68/100. 0 open incidents, 0 field reports, 2 volunteers available.",
  };
}

interface Result {
  scenario: Scenario;
  pass: boolean;
  failures: string[];
  latencyMs: number;
  turn?: SetuTurn;
}

function replyText(turn: SetuTurn): string {
  return [...Object.values(turn.reply), turn.followUp ?? "", turn.confirmationPrompt ?? ""].join(" ").toLowerCase();
}

async function runOne(s: Scenario): Promise<Result> {
  const failures: string[] = [];
  const lang = s.lang ?? "en";
  const cls = classifyIntent(s.message);

  const t0 = performance.now();
  const raw = await llm.planTurn({
    message: s.message,
    history: [],
    volunteerLanguage: lang,
    context: ctxFor(s.message, cls.intent),
    memory: {
      entities: {},
      translationPair: s.translationPair,
      pendingReportCategory: undefined,
      awaitingTranslationLanguage: s.awaitingTranslationLanguage,
    },
    offline: false,
  });
  const latencyMs = performance.now() - t0;

  const turn = validateTurn(raw);
  if (!turn) {
    failures.push("planTurn returned output that failed validateTurn()");
    return { scenario: s, pass: false, failures, latencyMs };
  }

  if (s.expectIntent && turn.intent !== s.expectIntent) {
    failures.push(`intent: expected ${s.expectIntent}, got ${turn.intent}`);
  }
  if (s.expectTool && turn.tool?.name !== s.expectTool) {
    failures.push(`tool: expected ${s.expectTool}, got ${turn.tool?.name ?? "(none)"}`);
  }
  if (s.expectNoTool && turn.tool) {
    failures.push(`tool: expected none, got ${turn.tool.name}`);
  }
  if (s.expectConfirm !== undefined) {
    const willConfirm = turn.requiresConfirmation || (turn.tool ? needsConfirmation(turn.tool.name) : false);
    if (willConfirm !== s.expectConfirm) {
      failures.push(`confirm: expected ${s.expectConfirm}, got ${willConfirm}`);
    }
  }
  const text = replyText(turn);
  if (s.replyMustContain && !text.includes(s.replyMustContain.toLowerCase())) {
    failures.push(`reply missing "${s.replyMustContain}"`);
  }
  for (const bad of s.replyMustNotContain ?? []) {
    if (text.includes(bad.toLowerCase())) failures.push(`reply contains disallowed "${bad}"`);
  }
  const maxLat = s.maxLatencyMs ?? 100;
  if (latencyMs > maxLat) failures.push(`latency ${latencyMs.toFixed(1)}ms > ${maxLat}ms`);

  // Structural safety: any high-risk tool must carry a confirmation prompt.
  if (turn.tool && needsConfirmation(turn.tool.name) && !turn.confirmationPrompt) {
    failures.push(`high-risk tool ${turn.tool.name} has no confirmationPrompt`);
  }

  return { scenario: s, pass: failures.length === 0, failures, latencyMs, turn };
}

async function main() {
  const results: Result[] = [];
  for (const s of SCENARIOS) results.push(await runOne(s));

  const byGroup = new Map<string, { pass: number; total: number }>();
  for (const r of results) {
    const g = byGroup.get(r.scenario.group) ?? { pass: 0, total: 0 };
    g.total++;
    if (r.pass) g.pass++;
    byGroup.set(r.scenario.group, g);
  }

  console.log("\nSetu reasoning-layer eval\n" + "=".repeat(40));
  for (const r of results) {
    const mark = r.pass ? "PASS" : "FAIL";
    console.log(`[${mark}] ${r.scenario.id.padEnd(24)} ${r.latencyMs.toFixed(1)}ms  ${r.scenario.group}`);
    for (const f of r.failures) console.log(`       - ${f}`);
  }

  console.log("\nBy group\n" + "-".repeat(40));
  for (const [g, { pass, total }] of byGroup) {
    console.log(`  ${g.padEnd(16)} ${pass}/${total}`);
  }

  const passed = results.filter((r) => r.pass).length;
  const avgLat = results.reduce((s, r) => s + r.latencyMs, 0) / results.length;
  const p95 = [...results.map((r) => r.latencyMs)].sort((a, b) => a - b)[Math.floor(results.length * 0.95)];
  console.log("\n" + "=".repeat(40));
  console.log(`  ${passed}/${results.length} passed · avg ${avgLat.toFixed(1)}ms · p95 ${p95.toFixed(1)}ms`);

  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
