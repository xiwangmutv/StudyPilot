/** One compact prompt, with no questions or coaching loop before focus. */
export function getSuggestion(locale: "zh" | "en" = "en") {
  return locale === "zh" ? "先读一段，然后开始。" : "Read one paragraph first, then begin.";
}
