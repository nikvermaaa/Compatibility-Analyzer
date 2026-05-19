const APIFY_BASE = "https://api.apify.com/v2";

export function validateLinkedInUrl(url: string): { valid: boolean; normalized?: string; error?: string } {
  if (!url) return { valid: false, error: "LinkedIn URL is required" };
  const trimmed = url.trim();
  const match = trimmed.match(/^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/([A-Za-z0-9\-_%]+)\/?/i);
  if (!match) {
    return {
      valid: false,
      error: "Invalid LinkedIn URL. Must be in the format: https://www.linkedin.com/in/username",
    };
  }
  const handle = match[2];
  return { valid: true, normalized: `https://www.linkedin.com/in/${handle}/` };
}

export function validateInstagramUrl(url: string): { valid: boolean; username?: string; error?: string } {
  if (!url) return { valid: false, error: "Instagram URL is required" };
  const trimmed = url.trim();
  if (/\/(p|reel|stories|explore)\//i.test(trimmed)) {
    return {
      valid: false,
      error: "Please provide a profile link (e.g. instagram.com/username), not a specific post, reel, or story.",
    };
  }
  const match = trimmed.match(/^https?:\/\/(www\.)?instagram\.com\/([A-Za-z0-9._]+)\/?/i);
  if (!match) {
    return {
      valid: false,
      error: "Invalid Instagram URL. Must be in the format: https://www.instagram.com/username",
