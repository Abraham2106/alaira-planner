export type SlackIntentKind = "complete_work_item" | "ambiguous" | "unknown";

export type ClassifiedIntent =
  | {
      kind: "complete_work_item";
      projectHint: string;
      workItemHint: string;
    }
  | { kind: "ambiguous"; reason: string }
  | { kind: "unknown" };

const COMPLETE_PATTERNS = [
  /\b(?:mark|marca|complete|completar)\s+(.+?)\s+(?:as\s+)?(?:complete|completado|done|terminad[oa])\s+(?:in|en)\s+(.+?)\.?$/i,
  /\b(?:mark|marca)\s+(.+?)\s+(?:in|en)\s+(.+?)\s+(?:as\s+)?(?:complete|completado|done)\.?$/i,
];

function stripBotMention(text: string): string {
  return text.replace(/<@[A-Z0-9]+>/gi, "").trim();
}

/** Classify user text from an app_mention (synthetic / heuristic for M1). */
export function classifySlackIntent(rawText: string): ClassifiedIntent {
  const text = stripBotMention(rawText).replace(/\s+/g, " ").trim();
  if (!text) {
    return { kind: "ambiguous", reason: "empty_message" };
  }

  for (const pattern of COMPLETE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const workItemHint = match[1]?.trim() ?? "";
      const projectHint = match[2]?.trim() ?? "";
      if (!workItemHint || !projectHint) {
        return { kind: "ambiguous", reason: "missing_project_or_work_item" };
      }
      if (workItemHint.toLowerCase() === projectHint.toLowerCase()) {
        return { kind: "ambiguous", reason: "homonymous_hints" };
      }
      return { kind: "complete_work_item", projectHint, workItemHint };
    }
  }

  if (/\b(?:complete|completar|mark|marca)\b/i.test(text)) {
    return { kind: "ambiguous", reason: "unparsed_complete_phrase" };
  }

  return { kind: "unknown" };
}
