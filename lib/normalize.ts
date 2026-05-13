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
    li.city ||
    li.geoCountryName ||
    ig.location;

  // 1. Process LinkedIn experience
  const rawExperience = li.experience || li.positions || li.workExperience || [];
  const experience: PersonDossier["linkedin"]["experience"] = [];
  if (Array.isArray(rawExperience)) {
    rawExperience.slice(0, 8).forEach((item: any, idx: number) => {
      const title = item.title || item.role || item.position || "Professional";
      const company = item.companyName || item.company || item.subtitle || "Independent";
      const duration = item.duration || item.timePeriod || item.period;
      const description = trimText(item.description || item.summary, 600);

      experience.push({
        id: `LI-exp-${idx + 1}`,
        title,
        company,
        duration: duration ? String(duration) : undefined,
        description,
      });
    });
  }

  // 2. Process LinkedIn education
  const rawEducation = li.education || li.schools || [];
  const education: PersonDossier["linkedin"]["education"] = [];
  if (Array.isArray(rawEducation)) {
    rawEducation.slice(0, 4).forEach((item: any, idx: number) => {
      education.push({
        id: `LI-edu-${idx + 1}`,
        school: item.schoolName || item.school || item.title || "University",
        degree: item.degreeName || item.degree,
        field: item.fieldOfStudy || item.field,
      });
    });
  }

  // Skills
  const rawSkills = li.skills || [];
