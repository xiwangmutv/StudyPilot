import type { UserProfile } from "@/src/core";

/**
 * The only breathing preference used by the Action Loop.
 * A breath is offered only when the AI selected it and the user allows it.
 */
export function shouldOfferBreathing(instruction: string | undefined, settings: Pick<UserProfile, "breathingAssist">) {
  return Boolean(instruction && /呼吸/.test(instruction) && settings.breathingAssist === "allow");
}
