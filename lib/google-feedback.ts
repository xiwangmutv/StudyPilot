import type { FeedbackSubmission } from "@/lib/feedback";

const googleFormFields = {
  type: "entry.1065377403",
  message: "entry.1229165353",
  almostQuit: "entry.476723113",
  satisfaction: "entry.2070303933",
  contact: "entry.684873970",
} as const;

const feedbackTypeLabels = {
  bug: "🐞 Bug Report",
  feature: "💡 Feature Request",
  general: "❤️ General Feedback",
} as const;

export function getGoogleFormResponseUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "docs.google.com" || !/^\/forms\/d\/e\/[^/]+\/viewform\/?$/.test(url.pathname)) {
    throw new Error("Invalid Google Form URL");
  }
  url.pathname = url.pathname.replace(/\/viewform\/?$/, "/formResponse");
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function createGoogleFormPayload(submission: FeedbackSubmission) {
  const payload = new URLSearchParams();
  payload.set(googleFormFields.type, feedbackTypeLabels[submission.type]);
  payload.set(googleFormFields.message, submission.message);
  payload.set(googleFormFields.almostQuit, submission.almostQuit);
  payload.set(googleFormFields.satisfaction, String(submission.satisfaction));
  payload.set(googleFormFields.contact, submission.contact);
  return payload;
}
