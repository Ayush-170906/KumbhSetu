"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Icon } from "@/components/ui/Icon";
import {
  VOLUNTEER_WHATSAPP_INVITE,
  VOLUNTEER_GROUP_NAME,
  VOLUNTEER_WELCOME_LINE,
  HAS_VOLUNTEER_GROUP,
} from "@/lib/volunteerProgram";

/**
 * The "join the volunteer group" card shown after a successful enrolment.
 * QR on screen + a tap-through button, so it works whether the person is
 * reading this on a laptop (scan with phone) or already on their phone.
 */
export function VolunteerJoinCard({ volunteerId }: { volunteerId?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(VOLUNTEER_WHATSAPP_INVITE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the QR and button still work */
    }
  }

  return (
    <div className="w-full max-w-xs rounded-md border border-border bg-surface shadow-card overflow-hidden">
      <div className="bg-primary-soft px-4 py-3 text-center">
        <div className="text-xs font-semibold text-primary-soft-ink">{VOLUNTEER_GROUP_NAME}</div>
        <div className="text-[10px] uppercase tracking-wide text-primary-dark/70 mt-0.5">
          WhatsApp group
        </div>
      </div>

      <div className="p-4 flex flex-col items-center gap-3">
        <div className="rounded-sm bg-white p-3 border border-border">
          <QRCodeSVG
            value={VOLUNTEER_WHATSAPP_INVITE}
            size={168}
            level="M"
            marginSize={0}
            fgColor="#241a12"
            bgColor="#ffffff"
          />
        </div>

        <p className="text-[11px] text-ink-muted text-center leading-relaxed">
          {VOLUNTEER_WELCOME_LINE}
        </p>

        {volunteerId && (
          <p className="text-[11px] text-ink-soft text-center">
            Say hello with your volunteer ID{" "}
            <span className="font-mono-num text-ink">{volunteerId}</span> so a coordinator can add
            you to your zone.
          </p>
        )}

        <a
          href={VOLUNTEER_WHATSAPP_INVITE}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-primary text-white text-sm font-medium py-2.5 hover:bg-primary-dark transition-colors"
        >
          <Icon name="phone" className="h-4 w-4" />
          Open WhatsApp to join
        </a>

        <button
          onClick={copy}
          className="text-[11px] text-ink-soft hover:text-ink inline-flex items-center gap-1.5"
        >
          <Icon name={copied ? "check" : "qr"} className="h-3.5 w-3.5" />
          {copied ? "Link copied" : "Copy invite link"}
        </button>

        {!HAS_VOLUNTEER_GROUP && (
          <p className="text-[10px] text-status-red text-center leading-relaxed">
            Demo placeholder link. Add the real group invite in
            <span className="font-mono-num"> src/lib/volunteerProgram.ts</span>.
          </p>
        )}
      </div>
    </div>
  );
}
