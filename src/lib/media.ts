import type { MediaType } from "@/lib/types";

export function mediaLabel(mediaType: MediaType): string {
  switch (mediaType) {
    case "photo":
      return "Photo";
    case "reel":
      return "Reel";
    case "carousel":
      return "Carousel";
    case "video":
      return "Video";
    default: {
      const neverType: never = mediaType;
      return neverType;
    }
  }
}

export function normalizeMediaType(
  value: unknown,
  url: string,
): { mediaType: MediaType; explicit: boolean } {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, "");
    switch (normalized) {
      case "photo":
      case "image":
      case "picture":
      case "graphimage":
        return { mediaType: "photo", explicit: true };
      case "reel":
      case "reels":
      case "clip":
      case "clips":
        return { mediaType: "reel", explicit: true };
      case "carousel":
      case "album":
      case "sidecar":
      case "graphsidecar":
        return { mediaType: "carousel", explicit: true };
      case "video":
      case "graphvideo":
      case "igtv":
        return { mediaType: "video", explicit: true };
      case "":
        break;
      default:
        break;
    }
  }

  if (/\/reels?\//i.test(url)) return { mediaType: "reel", explicit: false };
  return { mediaType: "photo", explicit: false };
}
