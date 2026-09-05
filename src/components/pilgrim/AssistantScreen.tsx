"use client";

import { useState } from "react";
import type { Zone, RiskSnapshot, Facility } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { SimTag } from "@/components/ui/SimTag";
import { bandLabel } from "@/components/ui/StatusPill";
import type { PilgrimScreen } from "./PilgrimApp";

interface Message {
  from: "user" | "assistant";
  text: string;
  action?: { label: string; screen: PilgrimScreen };
}

export function AssistantScreen({
  zone,
  snapshot,
  facilities,
  onNavigate,
}: {
  zone: Zone;
  snapshot?: RiskSnapshot;
  facilities: Facility[];
  onNavigate: (screen: PilgrimScreen) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "assistant",
      text: `Hi, I'm the Kumbh Setu agent — I can answer questions AND act on them (raise your SOS, open the facility list) using this demo's live data. I don't have a real backend LLM behind me, just this session's data and a few clear rules.`,
    },
  ]);

  function ask(question: string) {
    const result = answerFor(question, zone, snapshot, facilities);
    setMessages((m) => [...m, { from: "user", text: question }, { from: "assistant", text: result.text, action: result.action }]);
  }

  const suggestions = [
    `Is ${zone.shortName} crowded right now?`,
    "Where is the nearest medical camp?",
    "I need help right now",
    "Where can I find drinking water?",
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-4 pt-3">
        <SimTag label="AGENTIC · ACTS ON REAL DATA" />
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-3">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-sm px-3 py-2 text-sm leading-relaxed ${
                m.from === "user" ? "bg-primary text-white" : "bg-surface border border-border text-ink"
              }`}
            >
              {m.text}
              {m.action && (
                <button
                  onClick={() => onNavigate(m.action!.screen)}
                  className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-primary hover:text-primary-dark"
                >
                  {m.action.label}
                  <Icon name="arrow-right" className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="text-xs rounded-sm border border-border bg-surface px-3 py-1.5 text-ink-muted hover:border-primary hover:text-ink transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface AnswerResult {
  text: string;
  action?: { label: string; screen: PilgrimScreen };
}

function answerFor(question: string, zone: Zone, snapshot: RiskSnapshot | undefined, facilities: Facility[]): AnswerResult {
  const q = question.toLowerCase();
  if (q.includes("help") || q.includes("emergency") || q.includes("sos")) {
    return {
      text: "This sounds urgent. I can take you straight to the SOS flow — your location and the situation type will reach the nearest volunteer and the control room immediately.",
      action: { label: "Open SOS now", screen: "sos-type" },
    };
  }
  if (q.includes("crowded")) {
    if (!snapshot) return { text: "I don't have a current reading for that zone." };
    return { text: `${zone.shortName} is currently reading ${bandLabel(snapshot.band)} (score ${snapshot.score}/100). ${snapshot.narrative}` };
  }
  if (q.includes("medical")) {
    const camp = facilities.find((f) => f.type === "medical" && f.zoneId === zone.id) ?? facilities.find((f) => f.type === "medical");
    return {
      text: camp ? `The nearest medical camp is ${camp.name} — currently ${camp.status}, ${camp.load} load.` : "I couldn't find a medical camp in this demo dataset.",
      action: { label: "See all facilities", screen: "facilities" },
    };
  }
  if (q.includes("water")) {
    const water = facilities.find((f) => f.type === "water" && f.zoneId === zone.id) ?? facilities.find((f) => f.type === "water");
    return {
      text: water ? `${water.name} is the closest water point — ${water.status}, ${water.load} load.` : "No water point found in this demo dataset for your zone.",
      action: { label: "See all facilities", screen: "facilities" },
    };
  }
  return { text: "That's outside what this prototype can answer with simulated data — in a real deployment this would be backed by authorized, live event information." };
}
