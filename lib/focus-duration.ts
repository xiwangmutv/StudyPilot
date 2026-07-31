import type { Locale } from "@/lib/i18n";
import type { UserProfile } from "@/src/core";
export function firstFocusMinutes(settings: Pick<UserProfile, "starterMinutes">): UserProfile["starterMinutes"] { return settings.starterMinutes; }
export function firstFocusSeconds(settings: Pick<UserProfile, "starterMinutes">): number { return firstFocusMinutes(settings) * 60; }
export function firstFocusLabel(settings: Pick<UserProfile, "starterMinutes">, locale: Locale = "zh"): string { const minutes = firstFocusMinutes(settings); return locale === "en" ? `${minutes} min` : `${minutes} 分钟`; }
export function alignInstructionDuration(instruction: string, settings: Pick<UserProfile, "starterMinutes">, locale: Locale = "zh"): string { const pattern = locale === "en" ? /(?:about|approximately|for)?\s*\d+\s*(?:minutes?|mins?)/gi : /(?:约|大约|预计|先)?\s*(?:\d+|[一二两三四五六七八九十]+)\s*分钟/g; return instruction.replace(pattern, ` ${firstFocusLabel(settings, locale)}`).trim(); }
