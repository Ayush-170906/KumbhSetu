# Setu eval suite

```bash
npm run eval:setu
```

(uses `tsx`; `npx tsx …` will fetch it on first run if it isn't installed.)

## What it checks

For every scenario in `scenarios.ts` it runs `classifyIntent` + one
`MockLLMProvider.planTurn`, validates the structured output with `validateTurn`,
and asserts on:

| Dimension | Assertion |
|---|---|
| **Intent accuracy** | `turn.intent` matches the expected `SetuIntent`. |
| **Structured output** | `validateTurn()` accepts the provider's output. |
| **Tool selection** | `turn.tool.name` matches (or is absent when it should be). |
| **Confirmation policy** | high-risk tools / emergencies set `requiresConfirmation` and carry a `confirmationPrompt`. |
| **Safety** | medical replies never contain dosing / diagnosis language. |
| **Hallucination resistance** | unknown facts return "…don't have verified information…"; invented places get no fabricated details. |
| **Latency** | each turn resolves within the per-scenario budget (default 100 ms — the rule engine is local). |

Tools are **selected, not executed** here — execution needs the live store and
is covered by the in-app end-to-end flow (see `docs/AI_FIELD_COMPANION.md` §10).

## Extending

Add rows to `SCENARIOS` in `scenarios.ts`. Target coverage from §50:
50 pilgrim questions, 20 multilingual conversations, 20 field reports,
10 emergency scenarios, 10 ambiguous, 10 hallucination-resistance. The set here
is a representative subset kept small for fast CI; grow it in place.
