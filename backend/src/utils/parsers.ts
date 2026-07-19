import { VAGUE_MARKER_PATTERN } from "../config/constants";

export function parsePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.replace(/(?!^\+)[^\d]/g, "");
  const digits = normalized.startsWith("+") ? normalized.slice(1) : normalized;
  if (!/^\d{7,15}$/.test(digits)) {
    return null;
  }
  return normalized.startsWith("+") ? `+${digits}` : digits;
}

export function parseBudget(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return raw;
  }

  if (/[0-9]/.test(trimmed) && !/\b(rs|inr|usd|eur|gbp|rupees|dollars|euros|pounds)\b/i.test(trimmed)) {
    return `Rs ${trimmed}`;
  }

  return trimmed;
}

export function parseTravellerCount(raw: string): number | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }

  const numericMatch = trimmed.match(/\b(\d+)\b/);
  if (numericMatch) {
    const count = Number(numericMatch[1]);
    return Number.isInteger(count) && count > 0 ? count : null;
  }

  const wordCounts: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10
  };

  for (const [word, count] of Object.entries(wordCounts)) {
    if (new RegExp(`\\b${word}\\b`, "i").test(trimmed) && /(adult|traveller|traveler|person|people|guest|passenger)/i.test(trimmed)) {
      return count;
    }
  }

  if (trimmed.includes("a couple") || trimmed.includes("couple")) {
    return 2;
  }
  if (trimmed.includes("solo") || trimmed.includes("just me") || trimmed.includes("myself") || trimmed.includes("alone")) {
    return 1;
  }
  const familyMatch = trimmed.match(/family of (\d+)/);
  if (familyMatch) {
    return Number(familyMatch[1]);
  }

  return null;
}

export function isVagueText(raw: string | null | undefined): boolean {
  if (!raw) {
    return false;
  }
  return VAGUE_MARKER_PATTERN.test(raw);
}
