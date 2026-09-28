import type { LearningEventDetail, LearningEventValue } from "./types";

const BLOCKED_DETAIL_KEYS = /^(child|name|email|phone|drawing|tracePath|rawAnswer)$/i;

function sanitize(detail: LearningEventDetail): LearningEventDetail {
  const safe: LearningEventDetail = {};
  for (const [key, value] of Object.entries(detail)) {
    if (BLOCKED_DETAIL_KEYS.test(key)) continue;
    safe[key] =
      typeof value === "string"
        ? value.slice(0, 80)
        : (value as LearningEventValue);
  }
  return safe;
}

export function dispatchLearningEvent({
  channel,
  game,
  name,
  detail = {},
  version = 1,
  timeField = "timestamp",
}: {
  channel: "skylora:game" | "skylora:learning";
  game: string;
  name: string;
  detail?: LearningEventDetail;
  version?: number;
  timeField?: "timestamp" | "time";
}) {
  if (typeof window === "undefined") return;

  const payload: Record<string, LearningEventValue> = {
    game,
    version,
    name,
    [timeField]: Date.now(),
    ...sanitize(detail),
  };

  window.dispatchEvent(new CustomEvent(channel, { detail: payload }));
}
