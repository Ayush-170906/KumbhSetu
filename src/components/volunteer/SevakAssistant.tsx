"use client";

import { useState } from "react";
import type { Volunteer, Zone, Task, Incident, Facility } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { SimTag } from "@/components/ui/SimTag";
import { statusLabel } from "@/lib/incidentMeta";

interface Message {
  from: "volunteer" | "assistant";
  text: string;
}

export function SevakAssistant({
  volunteer,
  zone,
  task,
  incident,
  facilities,
}: {
  volunteer: Volunteer;
  zone?: Zone;
  task?: Task;
  incident?: Incident;
  facilities: Facility[];
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "assistant",
      text: `Hi ${volunteer.name.split(" ")[0]}, I'm the Sevak Assistant — ask me about your current task, nearby facilities for a pilgrim you're helping, or escalation steps. I act on this demo's data, not a live backend.`,
    },
  ]);

  function ask(question: string) {
    const answer = answerFor(question, { volunteer, zone, task, incident, facilities });
    setMessages((m) => [...m, { from: "volunteer", text: question }, { from: "assistant", text: answer }]);
  }

  const suggestions = task
    ? ["What's my current task status?", "Nearest medical camp?", "How do I escalate this?"]
    : ["Am I available for tasks?", "Nearest medical camp?", "What are the protocols for a lost child?"];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 pt-3">
        <SimTag label="RULE-BASED · ACTS ON REAL DATA" />
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-3 space-y-3">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.from === "volunteer" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-sm px-3 py-2 text-sm leading-relaxed ${
                m.from === "volunteer" ? "bg-primary text-white" : "bg-surface border border-border text-ink"
              }`}
            >
              {m.text}
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

function answerFor(
  question: string,
  ctx: { volunteer: Volunteer; zone?: Zone; task?: Task; incident?: Incident; facilities: Facility[] }
): string {
  const q = question.toLowerCase();
  const { volunteer, zone, task, incident, facilities } = ctx;

  if (q.includes("status")) {
    if (!task || !incident) return "You have no active task right now — you're clear to help the next SOS that comes in.";
    return `${incident.code} is currently "${statusLabel(incident.status)}". Task state: ${task.state}. ${
      incident.matchQuality && incident.matchQuality !== "nearest" ? `You were matched on ${incident.matchQuality.replace("_", " + ")}.` : ""
    }`;
  }
  if (q.includes("medical")) {
    const camp = facilities.find((f) => f.type === "medical" && f.zoneId === (zone?.id ?? volunteer.zoneId)) ?? facilities.find((f) => f.type === "medical");
    return camp ? `${camp.name} — ${camp.status}, ${camp.load} load. Direct the pilgrim there or radio it in.` : "No medical camp found in this demo dataset.";
  }
  if (q.includes("escalate")) {
    return task
      ? 'Use "Escalate" on your active task screen once you\'ve arrived — this immediately flags the control room and keeps the case open rather than closing it as resolved.'
      : "Escalation only applies once you've accepted and arrived at a task — nothing active to escalate right now.";
  }
  if (q.includes("available")) {
    return `Your status is currently "${volunteer.availability.replace("_", " ")}". Toggle it from the header above.`;
  }
  if (q.includes("lost child") || q.includes("child")) {
    return "Take the child to the nearest Help Desk, log a Found-Person report from that desk's Pilgrim view (or ask control room to log it), and stay with the child until control room confirms a match or guardian pickup.";
  }
  return "That's outside what this prototype's rule-based assistant can answer — a full deployment would connect this to authorized protocol documents and live control-room guidance.";
}
