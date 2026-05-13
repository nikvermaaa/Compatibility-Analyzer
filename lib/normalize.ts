import { PersonDossier } from "./schemas";

function trimText(text?: string | null, maxLen: number = 500): string | undefined {
  if (!text) return undefined;
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen) + "...";
}

export function normalizeDossier(
  rawLinkedIn: any,
  rawInstagram: any,
  fallbackName?: string
): PersonDossier {
  const li = Array.isArray(rawLinkedIn) ? rawLinkedIn[0] || {} : rawLinkedIn || {};
  const ig = Array.isArray(rawInstagram) ? rawInstagram[0] || {} : rawInstagram || {};

  const name =
    li.fullName ||
    li.name ||
    ig.fullName ||
    (li.firstName ? `${li.firstName} ${li.lastName || ""}`.trim() : "") ||
    fallbackName ||
    ig.username ||
    "Candidate";

  const photoUrl =
    ig.profilePicUrlHD ||
    ig.profilePicUrl ||
    li.profilePicture ||
    li.photo ||
    li.pictureUrl;

  const location =
    li.location ||
