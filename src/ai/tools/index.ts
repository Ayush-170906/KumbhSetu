// The single controlled entry point for running a tool (§12/§13).
//
// Flow: authorize → validate args → (policy: high-risk must be pre-confirmed)
// → run → write audit event. Nothing else in the app is allowed to call a
// tool's `run` directly.

import { TOOL_BY_NAME, type ToolContext, type ToolResult, type RiskClass } from "./registry";

export { TOOLS, TOOL_BY_NAME, toolRiskClass } from "./registry";
export type { ToolContext, ToolResult, RiskClass, ToolName } from "./registry";

export interface ExecuteOptions {
  /** Set once the volunteer has approved a high-risk call in the confirm card. */
  confirmed?: boolean;
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
  opts: ExecuteOptions = {}
): Promise<ToolResult> {
  const tool = TOOL_BY_NAME[name];
  if (!tool) {
    return { ok: false, summary: `Unknown tool "${name}".`, error: "unknown_tool" };
  }

  if (!tool.authorize(ctx)) {
    return { ok: false, summary: "You're not authorized to do that from here.", error: "unauthorized" };
  }

  const check = tool.validate(args, ctx);
  if (!check.ok) {
    return { ok: false, summary: `I couldn't run that: ${check.errors.join("; ")}.`, error: "invalid_args" };
  }

  if (tool.riskClass === "high_write" && !opts.confirmed) {
    return {
      ok: false,
      summary: tool.describe(check.value, ctx),
      error: "confirmation_required",
    };
  }

  let result: ToolResult;
  try {
    result = await tool.run(check.value, ctx);
  } catch (err) {
    return {
      ok: false,
      summary: "That action failed — nothing was changed.",
      error: err instanceof Error ? err.message : "run_failed",
    };
  }

  if (result.ok && result.audit) {
    ctx.store.recordSetuAudit({
      actor: ctx.actor.label,
      action: result.audit.action,
      entity: result.audit.entity,
      entityId: result.audit.entityId,
      metadata: result.audit.metadata,
    });
  }

  return result;
}

/** Whether a proposed tool call needs the confirm card before it can run. */
export function needsConfirmation(name: string): boolean {
  return TOOL_BY_NAME[name]?.riskClass === "high_write";
}

export function riskClassOf(name: string): RiskClass | undefined {
  return TOOL_BY_NAME[name]?.riskClass;
}
