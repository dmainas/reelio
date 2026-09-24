import { isRecord } from "@/lib/guards";
import { NextResponse } from "next/server";

type OrganizePost = {
  id: string;
  account: string;
  caption: string;
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: "The organizer request was not valid JSON." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "The organizer request was not valid JSON." }, { status: 400 });
  }

  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Add an API key in settings to use a remote model. Offline grouping still works without one.",
      },
      { status: 400 },
    );
  }

  const baseUrl = (typeof body.baseUrl === "string" ? body.baseUrl.trim() : "") || "https://api.openai.com/v1";
  if (!/^https?:\/\//i.test(baseUrl)) {
    return NextResponse.json(
      { error: "The base URL needs to start with http:// or https://." },
      { status: 400 },
    );
  }

  const posts = readPosts(body.posts);
  if (posts.length === 0) {
    return NextResponse.json({ error: "There are no posts to organize." }, { status: 400 });
  }

  const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : "gpt-4o-mini";
  const endpoint = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You group saved social posts. Reply with JSON only, no markdown: {\"results\":[{\"id\":\"...\",\"category\":\"Travel\",\"tags\":[\"coast\"]}]}. Use a short title-case category. Tags are 1 to 3 lowercase keywords taken from the caption. Include every id.",
          },
          {
            role: "user",
            content: JSON.stringify(posts),
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `The model endpoint returned ${response.status}. Offline groups were left as they are.`,
        },
        { status: 502 },
      );
    }

    const data = (await response.json()) as unknown;
    const content = readContent(data);
    if (!content) {
      return NextResponse.json(
        { error: "The model response had no message. Offline groups were left as they are." },
        { status: 502 },
      );
    }

    return NextResponse.json({ content });
  } catch {
    return NextResponse.json(
      {
        error: "Couldn’t reach that model endpoint. Check the base URL. Offline groups were left as they are.",
      },
      { status: 502 },
    );
  }
}

function readPosts(value: unknown): OrganizePost[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 80).flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.id !== "string") return [];
    return [
      {
        id: entry.id,
        account: typeof entry.account === "string" ? entry.account.slice(0, 80) : "",
        caption: typeof entry.caption === "string" ? entry.caption.slice(0, 500) : "",
      },
    ];
  });
}

function readContent(data: unknown): string {
  if (!isRecord(data) || !Array.isArray(data.choices)) return "";
  const choice = data.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) return "";
  return typeof choice.message.content === "string" ? choice.message.content : "";
}
