/**
 * Volunteer programme — shared constants for the self sign-up flow.
 *
 * ▶ TO GO LIVE: paste your real WhatsApp group invite link below.
 *   In WhatsApp open the group → Group info → "Invite via link" → Copy link.
 *   It looks like:  https://chat.whatsapp.com/AbCdEf0123456789
 *   Until you do, the QR / button point at the placeholder and simply won't
 *   open a real group.
 */
export const VOLUNTEER_WHATSAPP_INVITE =
  "https://chat.whatsapp.com/REPLACE_WITH_REAL_INVITE_CODE";

export const VOLUNTEER_GROUP_NAME = "Kumbh Setu · Volunteers";

/** True once a real invite link has been configured. */
export const HAS_VOLUNTEER_GROUP =
  !VOLUNTEER_WHATSAPP_INVITE.includes("REPLACE_WITH_REAL_INVITE_CODE");

/** A short warm line shown on the "you're enrolled" screen. */
export const VOLUNTEER_WELCOME_LINE =
  "Welcome to the seva team. Scan to join the volunteer group — that is where shift calls, zone briefings and safety notices go out.";
