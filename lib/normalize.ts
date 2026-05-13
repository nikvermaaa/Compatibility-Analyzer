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
  const skills: string[] = Array.isArray(rawSkills)
    ? rawSkills.map((s: any) => (typeof s === "string" ? s : s.name || s.title)).filter(Boolean).slice(0, 15)
    : [];

  // 3. Process Instagram Posts
  const rawPosts = ig.latestPosts || ig.posts || ig.media || [];
  const posts: PersonDossier["instagram"]["posts"] = [];
  if (Array.isArray(rawPosts)) {
    rawPosts.slice(0, 12).forEach((p: any, idx: number) => {
      const caption = trimText(p.caption || p.text || p.title, 400);
      const hashtags = Array.isArray(p.hashtags)
        ? p.hashtags
        : (caption?.match(/#[a-zA-Z0-9_]+/g) || []).map((h: string) => h.replace("#", ""));

      let type: "image" | "video" | "carousel" = "image";
      if (p.isVideo || p.type === "Video" || p.productType === "clips") type = "video";
      else if (p.type === "Sidecar" || Array.isArray(p.images)) type = "carousel";

      posts.push({
        id: `IG-post-${idx + 1}`,
        caption,
        hashtags: hashtags.slice(0, 8),
        location: p.locationName || p.location?.name,
        type,
        likes: typeof p.likesCount === "number" ? p.likesCount : p.likes,
        date: p.timestamp || p.date,
        imageUrl: p.displayUrl || p.imageUrl || p.url,
      });
    });
  }
