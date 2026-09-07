# -*- coding: utf-8 -*-
"""Generate the Kumbh Setu Live Demo master document (PDF) with reportlab."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
    HRFlowable, ListFlowable, ListItem,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Windows ships Nirmala UI (Indic scripts incl. Tamil) as a .ttc collection.
try:
    pdfmetrics.registerFont(TTFont("Nirmala", r"C:\Windows\Fonts\Nirmala.ttc", subfontIndex=0))
    _TAMIL_OK = True
except Exception:
    _TAMIL_OK = False

_TA = "\u0b8e\u0ba9\u0bcd \u0b95\u0bc1\u0bb4\u0ba8\u0bcd\u0ba4\u0bc8\u0baf\u0bc8 \u0b95\u0bbe\u0ba3\u0bb5\u0bbf\u0bb2\u0bcd\u0bb2\u0bc8"
TA = (f'<font name="Nirmala">{_TA}</font>' if _TAMIL_OK else f"{_TA} [Tamil]")

OUT = r"C:\Users\ASUS\OneDrive\Desktop\KumbhSetu\docs\KumbhSetu-LiveDemo-MasterDoc.pdf"

# ---- palette -------------------------------------------------------------
INK = colors.HexColor("#241a12")
SOFT = colors.HexColor("#6b5d4f")
SAFFRON = colors.HexColor("#c2410c")
NIGHT = colors.HexColor("#1f2937")
LINE = colors.HexColor("#e5ddd2")
BG = colors.HexColor("#faf6f0")
GREEN = colors.HexColor("#2f7d46")
AMBER = colors.HexColor("#b45309")
RED = colors.HexColor("#a3302a")

styles = getSampleStyleSheet()

def S(name, **kw):
    base = kw.pop("parent", styles["Normal"])
    return ParagraphStyle(name, parent=base, **kw)

title_s   = S("t", parent=styles["Title"], textColor=INK, fontSize=24, leading=28, spaceAfter=4)
sub_s     = S("sub", textColor=SAFFRON, fontSize=11, leading=15, spaceAfter=2,
              fontName="Helvetica-Bold")
meta_s    = S("meta", textColor=SOFT, fontSize=9, leading=13)
h1_s      = S("h1", textColor=INK, fontSize=15, leading=19, spaceBefore=18, spaceAfter=6,
              fontName="Helvetica-Bold")
h2_s      = S("h2", textColor=SAFFRON, fontSize=11.5, leading=15, spaceBefore=12, spaceAfter=4,
              fontName="Helvetica-Bold")
body_s    = S("b", textColor=INK, fontSize=9.7, leading=14, spaceAfter=6, alignment=TA_LEFT)
small_s   = S("s", textColor=SOFT, fontSize=8.6, leading=12)
cell_s    = S("c", textColor=INK, fontSize=8.4, leading=11)
cellb_s   = S("cb", textColor=INK, fontSize=8.4, leading=11, fontName="Helvetica-Bold")
cellsoft_s= S("cs", textColor=SOFT, fontSize=8.1, leading=10.5)
quote_s   = S("q", textColor=NIGHT, fontSize=10.5, leading=15, leftIndent=10,
              borderColor=SAFFRON, borderWidth=0, spaceBefore=4, spaceAfter=8,
              fontName="Helvetica-Oblique")

def P(t, s=body_s): return Paragraph(t, s)
def bullets(items, s=body_s):
    return ListFlowable(
        [ListItem(Paragraph(i, s), leftIndent=12, value="•") for i in items],
        bulletType="bullet", bulletColor=SAFFRON, leftIndent=12, spaceBefore=2, spaceAfter=6,
    )

def hr():
    return HRFlowable(width="100%", thickness=0.6, color=LINE, spaceBefore=6, spaceAfter=6)

story = []

# ======================================================================
# COVER
# ======================================================================
story += [
    Spacer(1, 30*mm),
    P("KUMBH SETU", sub_s),
    P("Live Demo — Master Document", title_s),
    P("From Ground Observation to Coordinated Response", S("csub", textColor=SOFT, fontSize=12, leading=16, spaceAfter=14)),
    hr(),
    P("For the team — use this for demo-day script writing, the pitch deck, the live walkthrough, "
      "and judge Q&amp;A. It describes the automated <b>/demo</b> experience exactly as built and verified.", body_s),
    Spacer(1, 6*mm),
]
cover_facts = [
    ["What it is", "One scripted incident, driving the Pilgrim, Volunteer and Management screens together on one page — a self-running ~4-minute walkthrough of the whole closed loop."],
    ["Where", "Route: /demo  (the three real apps — /pilgrim, /field, /management — are unchanged)"],
    ["Runtime", "~3 min 40 s end to end, 20 scripted beats. Fully deterministic — no live model decides whether it proceeds."],
    ["Controls", "Run · Pause · Resume · Skip step · Restart · Exit demo, with a DEMO nn / 20 step counter and progress bar."],
    ["Data", "Every value is synthetic. Labelled \u201cData: Synthetic / Simulation\u201d; the pilgrim panel is labelled \u201cdemo scenario — not a real pilgrim.\u201d"],
    ["Branch", "feat/live-demo-mode (pushed). Not merged to main. main stays at the known-good build."],
]
t = Table([[P(k, cellb_s), P(v, cell_s)] for k, v in cover_facts], colWidths=[28*mm, 137*mm])
t.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LINEBELOW", (0,0), (-1,-2), 0.4, LINE),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("LEFTPADDING", (0,0), (-1,-1), 0),
]))
story += [t, PageBreak()]

# ======================================================================
# 1. THE STORY IN ONE BREATH
# ======================================================================
story += [P("1 · The story in one breath", h1_s)]
story += [P(
    "A Tamil-speaking pilgrim reports that her child is missing. The Kumbh Setu Assistant guides her in "
    "her own language. A volunteer nearby uses Setu AI to translate the situation and file a structured "
    "lost-child ground report — after a human confirmation. A second volunteer, independently, files a "
    "matching report. The control room sees two independent reports, corroborates them, and Kumbh Pulse "
    "raises one explainable emerging signal for Ghat 4. The operator opens the \u201cwhy is this zone at "
    "risk?\u201d breakdown, promotes the signal to a Critical incident, and asks Ops Copilot for a "
    "responder. Ops Copilot recommends V-233 — nearest, crowd-trained, with a Tamil translation bridge. "
    "The operator confirms the dispatch. V-233 accepts, arrives, and resolves — the child is reunited. "
    "The Event Log shows the entire chain, with an actor and a timestamp on every step.", body_s)]
story += [P("One incident. Three roles. One connected response loop.", quote_s)]

story += [P("The response loop", h2_s)]
loop = [
    ("Observe", "A pilgrim or volunteer reports something on the ground."),
    ("Corroborate", "Independent reports are cross-checked, not taken at face value."),
    ("Signal", "Kumbh Pulse raises one explainable signal worth a human's attention."),
    ("Decide", "The control room promotes it to an incident and chooses a responder."),
    ("Resolve", "A volunteer accepts, arrives and closes the loop on the ground."),
    ("Audit", "Every step is logged with actor and time in the Event Log."),
]
lt = Table([[P(f"<b>{a}</b>", cell_s), P(b, cell_s)] for a, b in loop], colWidths=[26*mm, 139*mm])
lt.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LINEBELOW", (0,0), (-1,-2), 0.4, LINE),
    ("TOPPADDING", (0,0), (-1,-1), 4), ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ("LEFTPADDING", (0,0), (-1,-1), 0),
    ("TEXTCOLOR", (0,0), (0,-1), SAFFRON),
]))
story += [lt]

story += [P("Two lines to land at the end", h2_s)]
story += [bullets([
    "\u201cSetu AI helps people understand and act.\u201d",
    "\u201cKumbh Pulse helps the control room understand what is happening.\u201d",
    "Close on: <b>KUMBH SETU — connected response infrastructure for mass gatherings.</b>",
])]
story += [PageBreak()]

# ======================================================================
# 2. FULL SCRIPT — 20 BEATS
# ======================================================================
story += [P("2 · Full script — 20 beats", h1_s)]
story += [P("Columns: beat, on-screen clock, active panel, what the audience sees, and the voiceover line "
            "to say over it. The clock is the story timeline shown in the control bar, not real elapsed time.", small_s)]
story += [Spacer(1, 3)]

SCRIPT = [
 (1, "0:00", "Intro",
  "Title card: three role cards (Pilgrim / Volunteer / Management) and the Observe->Corroborate->Signal->Decide->Resolve->Audit loop.",
  "\u201cKumbh Setu is one connected response platform for mass gatherings. One incident — watch it move across all three roles at once.\u201d"),
 (2, "0:20", "Pilgrim",
  "Pilgrim panel, labelled \u2018demo scenario \u2014 not a real pilgrim\u2019. Tamil message \u201c" + TA + "\u201d with the gloss \u201cMy child is missing.\u201d",
  "\u201cA pilgrim reports, in Tamil, that her child is missing. She does not have to switch languages to ask for help.\u201d"),
 (3, "0:35", "Pilgrim",
  "Kumbh Setu Assistant replies (emergency styling): stay where you are, nearest Help Desk is Ghat 4 Control, asks age and clothing, says a volunteer is being alerted. Provenance line: \u2018Powered by Sarvam \u00b7 Grounded in Kumbh Setu data\u2019.",
  "\u201cThe assistant answers in her language, gives lost-child guidance, and stays with her while help is arranged.\u201d"),
 (4, "0:50", "Volunteer",
  "Volunteer panel activates. \u201cHelp me talk to a Tamil-speaking pilgrim\u201d -> Setu translates: \u201cMy 6-year-old son is missing. He was near the Ramkund steps about ten minutes ago. He is wearing a red shirt.\u201d (Tamil->English \u00b7 phrasebook \u00b7 96%).",
  "\u201cA volunteer nearby bridges the language gap. Setu translates the situation both ways.\u201d"),
 (5, "1:05", "Volunteer",
  "Volunteer: \u201cLog this as a lost child report: 6-year-old boy in a red shirt, missing near Ramkund.\u201d Setu AI shows a structured report (category, zone, description, severity High, source). Amber card: \u2018Setu proposed: File ground report \u2014 high-impact action \u00b7 human confirmation required\u2019.",
  "\u201cSetu structures the report — but it does not file anything on its own. A human has to confirm.\u201d"),
 (6, "1:20", "Volunteer",
  "The proposal flips to \u2018Confirmed by a human \u2014 action executed\u2019. Green card: GR-4001 submitted to the control room.",
  "\u201cThe volunteer confirms. Report GR-4001 goes to the control room.\u201d"),
 (7, "1:35", "Volunteer",
  "Second volunteer (R. Kamble \u00b7 V-241): \u201cI also have a report \u2014 a lost boy about 6 near Ramkund. Someone found a child crying by Gate 3.\u201d Another \u2018Setu proposed: File ground report\u2019.",
  "\u201cIndependently, a second volunteer has the same picture from a different spot.\u201d"),
 (8, "1:50", "Volunteer",
  "Confirmed. Green card: GR-4002 submitted \u2014 control room now has two.",
  "\u201cTwo independent reports, filed separately, now sit in the control room.\u201d"),
 (9, "2:05", "Management",
  "Management panel activates. Field reports list: GR-4001 and GR-4002, same area, same description.",
  "\u201cThe control room isn\u2019t reacting to one shout. It has two independent accounts.\u201d"),
 (10, "2:20", "Management",
  "GR-4001 marked \u2018corroborated\u2019. Chain: 2 independent reports -> Corroboration -> Emerging signal. Amber card: \u2018Multiple lost-person reports \u2014 Ghat 4\u2019, confidence 69%, \u2018Kumbh Pulse decision support \u00b7 synthetic\u2019.",
  "\u201cThe two reports corroborate each other. Kumbh Pulse raises one emerging signal \u2014 not fifty alerts, one.\u201d"),
 (11, "2:35", "Management",
  "Kumbh Pulse panel: Ghat 4, score 84/100, band RED, forecast Critical in 10\u201320 min, narrative about a missing child on the Ramkund approach during pre-aarti density.",
  "\u201cGhat 4 moves into the red band. This is decision support \u2014 it never acts by itself.\u201d"),
 (12, "2:45", "Management",
  "\u2018Why is this zone at risk?\u2019 breakdown opens: Crowd Activity 42%, Movement Change 26%, Checkpoint Reports 18%, Historical Pattern 14%; supporting signals listed; active incident noted; \u2018Data: Synthetic / Simulation\u2019.",
  "\u201cAnd it shows its working: the four factors behind the score, and the signals behind those. Explainable, not a black-box number.\u201d"),
 (13, "3:00", "Management",
  "Operator promotes the corroborated signal. Incident created: KS-1003 \u00b7 Lost Person \u00b7 Critical \u00b7 Ghat 4 (triaged).",
  "\u201cThe operator promotes it to a Critical incident \u2014 one deliberate action, fully logged.\u201d"),
 (14, "3:20", "Management",
  "Ops Copilot: prompt \u2018Recommend a responder \u2014 the family only speaks Tamil.\u2019 Reasoning: V-233 available, ~120 m, crowd-trained, shortest ETA; Tamil bridge needed; hold V-218 for medical. Recommendation, then \u2018Setu proposed: Assign volunteer \u2014 human confirmation required\u2019.",
  "\u201cOps Copilot reasons over the operational picture and recommends V-233, with a translation bridge for the family. It proposes \u2014 it doesn\u2019t dispatch.\u201d"),
 (15, "3:45", "Management",
  "Operator confirms. Green: V-233 dispatched \u2014 task created, volunteer notified. Incident card shows Responder V-233 \u00b7 ETA ~4 min.",
  "\u201cThe operator confirms the dispatch.\u201d"),
 (16, "4:00", "Volunteer",
  "Volunteer panel switches to the task view: Ghat 4 \u00b7 KS-1003 \u00b7 CRITICAL -> Accepted \u2014 en route. Progress checklist: Dispatched done, Accepted done.",
  "\u201cV-233 gets a critical task and accepts \u2014 en route.\u201d"),
 (17, "4:15", "Volunteer",
  "Arrived on site \u2014 checklist advances.",
  "\u201cArrives on site at Ghat 4.\u201d"),
 (18, "4:30", "Volunteer",
  "Resolved \u2014 \u2018Child reunited \u2014 loop closed\u2019. All four checklist states done. Management incident shows Resolved.",
  "\u201cResolved. The child is reunited with the family, and the incident closes.\u201d"),
 (19, "4:40", "Management",
  "Event Log \u2014 audited chain, ten rows, each with actor and time: report created \u00d72, corroborated, promoted, incident reported, triaged, dispatched, accepted, arrived, resolved.",
  "\u201cAnd here is the whole chain \u2014 every step, who did it, and when. That is the audit trail a real operation needs.\u201d"),
 (20, "4:55", "Outro",
  "Closing card: the full loop, then \u2018One incident. Three roles. One connected response loop.\u2019 / \u2018Setu AI helps people understand and act.\u2019 / \u2018Kumbh Pulse helps the control room understand what is happening.\u2019 / KUMBH SETU.",
  "\u201cOne incident, three roles, one connected loop. Setu AI helps people understand and act; Kumbh Pulse helps the control room understand what\u2019s happening. Kumbh Setu \u2014 connected response infrastructure for mass gatherings.\u201d"),
]

rows = [[P("#", cellb_s), P("Clock", cellb_s), P("Panel", cellb_s), P("On screen", cellb_s), P("Voiceover", cellb_s)]]
for n, clk, panel, screen, vo in SCRIPT:
    rows.append([P(str(n), cellb_s), P(clk, cellsoft_s), P(panel, cellsoft_s), P(screen, cell_s), P(vo, S("vo", parent=cell_s, textColor=NIGHT))])
st = Table(rows, colWidths=[7*mm, 11*mm, 17*mm, 76*mm, 54*mm], repeatRows=1)
st.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("BACKGROUND", (0,0), (-1,0), BG),
    ("LINEBELOW", (0,0), (-1,0), 0.6, SAFFRON),
    ("LINEBELOW", (0,1), (-1,-1), 0.35, LINE),
    ("TOPPADDING", (0,0), (-1,-1), 4), ("BOTTOMPADDING", (0,0), (-1,-1), 4),
    ("LEFTPADDING", (0,0), (-1,-1), 3), ("RIGHTPADDING", (0,0), (-1,-1), 3),
]))
story += [st, PageBreak()]

# ======================================================================
# 3. PITCH-DECK OUTLINE
# ======================================================================
story += [P("3 · Pitch-deck outline (maps to the demo)", h1_s)]
story += [P("A 10-slide spine. Slides 4\u20138 are the live demo itself; if the demo runs, those slides are just holding frames.", small_s)]
DECK = [
 ("1", "Title", "Kumbh Setu \u2014 connected response infrastructure for mass gatherings. One line, one image."),
 ("2", "The problem", "At Kumbh scale, reports come from everywhere in many languages; the gap is not data, it's a connected, corroborated, auditable response. Name the failure mode: crowd crush from uncoordinated response."),
 ("3", "The idea", "Three roles, one loop: Observe -> Corroborate -> Signal -> Decide -> Resolve -> Audit. Setu AI for people; Kumbh Pulse for the control room."),
 ("4", "Demo \u2014 Pilgrim", "Tamil lost-child report + assistant guidance in-language. (Demo beats 2\u20133.)"),
 ("5", "Demo \u2014 Volunteer", "Translate -> structured ground report -> human confirm -> GR filed. A second independent report. (Beats 4\u20138.)"),
 ("6", "Demo \u2014 Corroboration &amp; Pulse", "Two reports -> one explainable emerging signal -> Ghat 4 red -> \u2018why is this zone at risk?\u2019 factor breakdown. (Beats 9\u201312.)"),
 ("7", "Demo \u2014 Decide &amp; Dispatch", "Promote to Critical incident -> Ops Copilot recommends a responder -> human confirm -> dispatch. (Beats 13\u201315.)"),
 ("8", "Demo \u2014 Resolve &amp; Audit", "Accept -> arrive -> resolve; Event Log shows the full chain with actor + time. (Beats 16\u201319.)"),
 ("9", "How it's built / what's real", "Sarvam is genuinely integrated (chat 105B, Mayura translate, Bulbul TTS, native tool-calling) in the real apps. The demo is deterministic and offline-safe. No database; human confirmation gates on every high-impact action."),
 ("10", "Ask / close", "One incident, three roles, one loop. What we need next (pilot zone, data partners). Close on the wordmark."),
]
dt = Table([[P(a, cellb_s), P(b, cellb_s), P(c, cell_s)] for a, b, c in DECK], colWidths=[8*mm, 34*mm, 123*mm])
dt.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LINEBELOW", (0,0), (-1,-1), 0.35, LINE),
    ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("LEFTPADDING", (0,0), (-1,-1), 0),
    ("TEXTCOLOR", (1,0), (1,-1), SAFFRON),
]))
story += [dt, PageBreak()]

# ======================================================================
# 4. RUNBOOK
# ======================================================================
story += [P("4 · Demo-day runbook", h1_s)]

story += [P("Before you present", h2_s)]
story += [bullets([
    "Open <b>/demo</b> in a full browser window on the projector display. Nothing else needs to be open.",
    "Do a full dry run once (Run -> let it finish). Then leave it on the pre-start title card.",
    "Have the three real apps ready in separate tabs only as a backup: /pilgrim, /field?tab=tasks, /management.",
    "Confirm network: Sarvam status at <b>/api/setu/status</b> should return all true. The demo still runs fully if it doesn't \u2014 it never calls Sarvam.",
])]

story += [P("Driving it", h2_s)]
story += [bullets([
    "<b>Run Live Demo</b> \u2014 starts the 20-beat timeline; it advances on its own (~3 min 40 s).",
    "<b>Pause / Resume</b> \u2014 freezes on the current beat; everything on screen stays put. Use it to talk over a beat.",
    "<b>Skip step</b> \u2014 jumps to the next beat immediately (useful if you're short on time). Works whether running or paused.",
    "<b>Restart</b> \u2014 resets to seed data and starts again from beat 1.",
    "<b>Exit demo</b> \u2014 returns to the pre-start title card and clears the scripted incident. Auth and the real apps are untouched.",
    "Top-right links (Pilgrim / Volunteer / Management) open the real manual product in a new view if a judge asks to \u2018drive it yourself\u2019.",
])]

story += [P("If something looks off", h2_s)]
story += [bullets([
    "Nothing is advancing \u2014 check it isn't Paused (control bar says \u00b7 Paused). Hit Resume, or Skip step.",
    "Panels look stale \u2014 hit Restart; it re-seeds from scratch.",
    "You reloaded mid-run \u2014 the timer chain can't survive a reload; hit Run Live Demo again (it resets first).",
    "Projector cut out \u2014 Pause, fix the display, Resume. The current beat is still on screen.",
])]

story += [P("Timing", h2_s)]
story += [P("Full auto run is about 3 min 40 s. With a 30-second intro talk and a 20-second close you are just under 5 minutes. "
            "If you must trim live: after beat 12 (the \u2018why is this zone at risk?\u2019 breakdown), use <b>Skip step</b> through "
            "13\u201315 while narrating the decision, then let 16\u201320 play.", body_s)]
story += [PageBreak()]

# ======================================================================
# 5. WHAT'S REAL vs SCRIPTED  +  SAFETY
# ======================================================================
story += [P("5 · What is real, what is scripted", h1_s)]
REAL = [
 ("Genuinely real", GREEN,
  "Sarvam integration in the real apps: chat (Sarvam-M 105B) with native tool-calling, Mayura translation, "
  "Bulbul TTS, STT, and the existing fallback. The whole product architecture \u2014 ground reports, corroboration, "
  "Kumbh Pulse signal model, red-zone explainability, incident lifecycle, dispatch, task lifecycle, Event Log, "
  "offline behaviour, role permissions and the human-confirmation gates."),
 ("Scripted for the demo", AMBER,
  "The /demo timeline itself. Each of the 20 beats is a fixed call on the same store actions the real apps use, "
  "so the walkthrough always tells the same story in the same order. The AI text shown in /demo (assistant reply, "
  "translation line, Ops Copilot reasoning) is fixed copy, labelled \u2018scripted demo narration \u2014 deterministic, "
  "not a live generation\u2019. The demo never calls Sarvam, so it can't stall, diverge, or fail on a network drop."),
 ("Never claimed", RED,
  "No real CCTV, live crowd counts, government feeds, emergency deployment, or real Kumbh incident data. "
  "Every operational number in /demo is synthetic and labelled \u2018Data: Synthetic / Simulation\u2019. The pilgrim "
  "in the story is explicitly \u2018demo scenario \u2014 not a real pilgrim\u2019."),
]
rt = Table([[P(f"<b>{a}</b>", S("rl", parent=cell_s, textColor=col)), P(b, cell_s)] for a, col, b in REAL],
           colWidths=[30*mm, 135*mm])
rt.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LINEBELOW", (0,0), (-1,-2), 0.4, LINE),
    ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING", (0,0), (-1,-1), 0),
]))
story += [rt]

story += [P("Honesty lines to have ready", h2_s)]
story += [bullets([
    "\u201cThe demo is scripted so it's reliable on stage. The AI and the workflow underneath it are the real ones \u2014 open any of the three apps and drive it yourself.\u201d",
    "\u201cEvery number here is synthetic. We are not claiming a live feed from the Kumbh.\u201d",
    "\u201cSarvam is genuinely integrated \u2014 105B chat with tool-calling, Mayura translate, Bulbul TTS. We just don't put a live model call on the critical path of a stage demo.\u201d",
])]
story += [PageBreak()]

# ======================================================================
# 6. JUDGE Q&A
# ======================================================================
story += [P("6 · Judge Q&amp;A prep", h1_s)]
QA = [
 ("Is this AI making the decisions?",
  "No. Every high-impact action \u2014 filing a report, promoting a signal, dispatching a volunteer \u2014 is behind a "
  "human confirmation. Setu and Ops Copilot propose; a person confirms. Kumbh Pulse is decision support and never "
  "triggers an automated action."),
 ("Why should we trust the risk score?",
  "Because it shows its inputs. The \u2018why is this zone at risk?\u2019 panel breaks the score into four weighted "
  "factors \u2014 crowd activity, movement change, checkpoint reports, historical pattern \u2014 and lists the field "
  "signals behind them. It's explainable, not a black-box number."),
 ("Is the Sarvam integration real or a mock?",
  "Real. The three apps use Sarvam-M 105B for chat with native tool-calling, Mayura for translation and Bulbul for "
  "TTS, with a graceful fallback. The /demo screen is deliberately scripted so a stage run can't fail on a bad "
  "network \u2014 that's a demo-reliability choice, not a capability gap."),
 ("What happens with no connectivity?",
  "The pilgrim SOS path has an offline SMS fallback with cached first-response SOPs; ground reports queue offline "
  "and sync later. The /demo walkthrough runs entirely offline."),
 ("Where is the data stored? Is this multi-user?",
  "For the prototype it's an in-memory store per browser, with optional cross-tab sync so the three roles stay "
  "in step when opened side by side. No database, no accounts \u2014 by design for the pitch. The data-access layer "
  "is a single module, so swapping in a real backend doesn't touch the screens."),
 ("How is a lost child handled specifically?",
  "In-language guidance to stay put and go to the nearest Help Desk; a structured lost-person report; corroboration "
  "with other field reports and any found-child reports; a Critical incident with a language-matched responder and "
  "a translation bridge; and a full audit trail for reunification."),
 ("Could two reports be the same person double-counted?",
  "That's the point of the corroboration step \u2014 the operator sees both source reports and decides. The signal "
  "raises it for a human; it doesn't auto-merge or auto-escalate."),
 ("What's the difference between Setu AI and Ops Copilot?",
  "Same reasoning layer, different surface and role. Setu AI is for pilgrims and volunteers on the ground "
  "(guidance, translation, structuring a report). Ops Copilot is for the control room (recommend a responder, "
  "reason over the operational picture). Both propose; humans confirm."),
]
for q, a in QA:
    story += [P(f"<b>{q}</b>", S("q2", parent=body_s, textColor=INK, spaceAfter=2))]
    story += [P(a, S("a2", parent=body_s, textColor=SOFT, spaceAfter=8))]

story += [PageBreak()]

# ======================================================================
# 7. FACTS & FIGURES  +  TECH
# ======================================================================
story += [P("7 · Facts, figures and IDs used in the demo", h1_s)]
FACTS = [
 ("Scenario", "Lost child \u2014 6-year-old boy, red shirt, last seen near the Ramkund steps, Ghat 4 (Trimbakeshwar temple perimeter)."),
 ("Pilgrim language", "Tamil. Message: \u201c" + TA + "\u201d = \u201cMy child is missing.\u201d"),
 ("Ground reports", "GR-4001 (V-218, M. Joshi, severity High) and GR-4002 (V-241, R. Kamble, severity Moderate)."),
 ("Emerging signal", "\u2018Multiple lost-person reports \u2014 Ghat 4\u2019, confidence 69%, Kumbh Pulse decision support (synthetic)."),
 ("Zone risk", "Ghat 4 \u2014 score 84 / 100, band RED, forecast Critical in 10\u201320 min. Factors: Crowd Activity 42%, Movement Change 26%, Checkpoint Reports 18%, Historical Pattern 14%. Model pulse-rule-v0.3."),
 ("Incident", "KS-1003 \u00b7 Lost Person \u00b7 Critical \u00b7 Ghat 4 (promoted from GR-4001, then triaged)."),
 ("Responder", "V-233 \u2014 K. Bhosale, available, crowd-marshal trained, ~120 m from Ramkund, ETA ~4 min; Tamil translation bridged for the family."),
 ("Event Log chain", "report created \u00d72 -> corroborated -> promoted to incident -> incident reported -> triaged -> volunteer dispatched -> task accepted -> arrived -> resolved."),
]
ft = Table([[P(k, cellb_s), P(v, cell_s)] for k, v in FACTS], colWidths=[28*mm, 137*mm])
ft.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LINEBELOW", (0,0), (-1,-2), 0.4, LINE),
    ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("LEFTPADDING", (0,0), (-1,-1), 0),
]))
story += [ft]

story += [P("Technical notes for the team", h2_s)]
story += [bullets([
    "Branch <b>feat/live-demo-mode</b>, pushed to origin. Two commits. <b>Not merged to main.</b>",
    "New files: src/lib/demoScript.ts (all scripted copy + the 20-beat table), src/components/demo/DemoShared.tsx, "
    "src/components/demo/DemoStage.tsx. Rewired: DemoApp / DemoControls / the three demo panes.",
    "Engine: a deterministic step-runner in the store (runDemoStep / advanceDemo) that calls existing actions. "
    "New store actions: pauseDemo, resumeDemo, skipDemoStep, restartDemo, exitDemo.",
    "One core change, backward-compatible: dispatchIncident takes an optional forceVolunteerId so the control room "
    "(and the demo) can assign a named responder. Default behaviour unchanged.",
    "Gates green: tsc clean; eslint clean (no new warnings); npm run eval:setu 41/41; next build passes.",
    "Verified in-browser: all 20 beats; Pause / Resume / Skip / Restart / Exit; unattended auto-advance; "
    "no console or hydration errors; Sarvam status still all-true; login / auth flow untouched.",
])]

story += [Spacer(1, 6*mm), hr()]
story += [P("Kumbh Setu \u2014 Live Demo master document. Generated for the team. All operational values are synthetic.", small_s)]

# ---- build ------------------------------------------------------------
import os
os.makedirs(os.path.dirname(OUT), exist_ok=True)

def footer(canv, doc_):
    canv.saveState()
    canv.setFont("Helvetica", 7.5)
    canv.setFillColor(SOFT)
    canv.drawString(20*mm, 12*mm, "Kumbh Setu \u2014 Live Demo \u2014 Master Document")
    canv.drawRightString(190*mm, 12*mm, "Page %d" % doc_.page)
    canv.restoreState()

doc = SimpleDocTemplate(OUT, pagesize=A4,
                        leftMargin=20*mm, rightMargin=20*mm,
                        topMargin=18*mm, bottomMargin=20*mm,
                        title="Kumbh Setu \u2014 Live Demo \u2014 Master Document",
                        author="Kumbh Setu team")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print("WROTE", OUT)
