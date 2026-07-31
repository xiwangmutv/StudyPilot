import type { UserProfile } from "@/src/core";

/** Single source of truth for the first-focus timer and all related UI copy. */
export function firstFocusMinutes(settings: Pick<UserProfile, "starterMinutes">): UserProfile["starterMinutes"] {
  return settings.starterMinutes;
}

export function firstFocusSeconds(settings: Pick<UserProfile, "starterMinutes">): number {
  return firstFocusMinutes(settings) * 60;
}

export function firstFocusLabel(settings: Pick<UserProfile, "starterMinutes">): string {
  return `${firstFocusMinutes(settings)} 分钟`;
}

/** Prevent an AI-supplied minute claim from disagreeing with the configured timer. */
export function alignInstructionDuration(instruction: string, settings: Pick<UserProfile, "starterMinutes">): string {
  return instruction.replace(/(?:约|大约|预计|先)?\s*(?:\d+|[一二两三四五六七八九十]+)\s*分钟/g, ` ${firstFocusLabel(settings)}`).trim();
}
