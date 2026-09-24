import type { RemoteSuggestion } from "@/lib/library";
import { parseModelContent } from "@/lib/model-response";
import type { SavedPost, Settings } from "@/lib/types";

export async function requestRemoteOrganize(
  settings: Settings,
  posts: SavedPost[],
): Promise<RemoteSuggestion[]> {
  let response: Response;
  try {
    response = await fetch("/api/organize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: settings.openaiApiKey,
        baseUrl: settings.openaiBaseUrl,
        model: settings.openaiModel,
        posts: posts.map((post) => ({
          id: post.id,
          account: post.account,
          caption: post.caption.slice(0, 500),
        })),
      }),
    });
  } catch {
    throw new Error("Couldn’t reach the organizer. Offline groups were left as they are.");
  }

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    throw new Error("The organizer returned an unreadable response. Offline groups were left as they are.");
  }

  const record = payload && typeof payload === "object" ? (payload as { error?: unknown; content?: unknown; results?: unknown }) : {};
  if (!response.ok) {
    const message = typeof record.error === "string" ? record.error : "The model organizer didn’t respond.";
    throw new Error(message);
  }

  if (typeof record.content === "string") {
    return parseModelContent(record.content);
  }

  if (Array.isArray(record.results)) {
    return parseModelContent(JSON.stringify({ results: record.results }));
  }

  throw new Error("The model response didn’t include groups. Offline suggestions were left as they are.");
}
