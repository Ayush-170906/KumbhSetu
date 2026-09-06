import { redirect } from "next/navigation";

/**
 * The volunteer experience was merged into /field (Setu AI / Tasks / Team as
 * tabs on one surface). This legacy route redirects so old links keep working.
 */
export default function VolunteerPage() {
  redirect("/field?tab=tasks");
}
