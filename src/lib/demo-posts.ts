import { withOfflineSuggestion } from "@/lib/library";
import type { MediaType, SavedPost } from "@/lib/types";

type DemoSeed = {
  id: string;
  account: string;
  caption: string;
  mediaType: MediaType;
  art: string;
  savedAt: string;
  url: string;
  tags?: string[];
};

const SEEDS: DemoSeed[] = [
  {
    id: "demo-sourdough",
    account: "weekdayoven",
    caption:
      "Saturday sourdough with a stiffer starter than I meant to keep. The crumb is wide open and a little wild.",
    mediaType: "carousel",
    art: "loaf",
    savedAt: "2026-03-02T15:10:00.000Z",
    url: "https://www.instagram.com/p/reelioSourdough/",
    tags: ["baking"],
  },
  {
    id: "demo-coast",
    account: "saltandlatitude",
    caption:
      "Three ferry rides and a paper map. The coast road outside Cinque Terre still smells like lemon groves after rain.",
    mediaType: "reel",
    art: "coast",
    savedAt: "2026-02-18T09:40:00.000Z",
    url: "https://www.instagram.com/reel/reelioCoast/",
  },
  {
    id: "demo-coat",
    account: "slowwardrobe",
    caption:
      "A navy coat for a third winter. The tailor took in the shoulders and would not discuss the outfit.",
    mediaType: "photo",
    art: "coat",
    savedAt: "2026-02-02T18:05:00.000Z",
    url: "https://www.instagram.com/p/reelioCoat/",
  },
  {
    id: "demo-coffee",
    account: "lateespresso",
    caption:
      "Counter seat, single-origin coffee, and a fern in the cup that collapsed immediately. Still worth the stop.",
    mediaType: "photo",
    art: "cup",
    savedAt: "2026-01-21T08:15:00.000Z",
    url: "https://www.instagram.com/p/reelioCoffee/",
  },
  {
    id: "demo-poster",
    account: "gridandgrain",
    caption:
      "A poster study with one typeface and too much margin. A quiet layout, and the red is doing all the talking.",
    mediaType: "photo",
    art: "poster",
    savedAt: "2026-01-09T16:30:00.000Z",
    url: "https://www.instagram.com/p/reelioPoster/",
  },
  {
    id: "demo-run",
    account: "morningmiles",
    caption: "Easy run along the river before email. A heron showed up around kilometer six.",
    mediaType: "photo",
    art: "river",
    savedAt: "2025-12-14T07:05:00.000Z",
    url: "https://www.instagram.com/p/reelioRun/",
    tags: ["river"],
  },
  {
    id: "demo-museum",
    account: "windowseatclub",
    caption:
      "A layover museum: one hour between flights, one room of Dutch still lifes, then back to the gate.",
    mediaType: "photo",
    art: "museum",
    savedAt: "2025-11-28T13:20:00.000Z",
    url: "https://www.instagram.com/p/reelioMuseum/",
  },
  {
    id: "demo-pasta",
    account: "pastamidnight",
    caption: "Cacio e pepe for two. A weeknight pasta recipe with pepper toasted in the pan and no cream.",
    mediaType: "reel",
    art: "pasta",
    savedAt: "2025-11-03T20:45:00.000Z",
    url: "https://www.instagram.com/reel/reelioPasta/",
  },
  {
    id: "demo-hike",
    account: "trailnotes",
    caption:
      "The ridge above Queenstown before the clouds dropped. The hike started with wet boots and a folded map.",
    mediaType: "carousel",
    art: "ridge",
    savedAt: "2025-10-19T04:50:00.000Z",
    url: "https://www.instagram.com/p/reelioHike/",
  },
  {
    id: "demo-gym",
    account: "irongarage",
    caption: "Deadlift day at the gym. The bar was loud. Three sets, then leave.",
    mediaType: "video",
    art: "gym",
    savedAt: "2025-09-30T17:00:00.000Z",
    url: "https://www.instagram.com/p/reelioGym/",
  },
  {
    id: "demo-shirt",
    account: "marketstitch",
    caption:
      "A striped shirt from a pile of tablecloths. The sleeves are too long, and it is now part of the slow wardrobe.",
    mediaType: "reel",
    art: "stripe",
    savedAt: "2025-09-12T11:25:00.000Z",
    url: "https://www.instagram.com/reel/reelioShirt/",
  },
  {
    id: "demo-plant",
    account: "plantledger",
    caption: "Repotted the fiddle-leaf plant I have been apologizing to since March. New pot, same attitude.",
    mediaType: "photo",
    art: "plant",
    savedAt: "2025-08-22T14:10:00.000Z",
    url: "https://www.instagram.com/p/reelioPlant/",
  },
  {
    id: "demo-linen",
    account: "sundaytable",
    caption: "Linen on the table, one ceramic bowl, a few lemons. The room can do without a centerpiece.",
    mediaType: "carousel",
    art: "linen",
    savedAt: "2025-07-18T12:00:00.000Z",
    url: "https://www.instagram.com/p/reelioLinen/",
  },
  {
    id: "demo-film",
    account: "portrafridge",
    caption: "Portra 400, shot on film, because the stairwell was kinder than the street.",
    mediaType: "photo",
    art: "film",
    savedAt: "2025-06-09T19:40:00.000Z",
    url: "https://www.instagram.com/p/reelioFilm/",
  },
  {
    id: "demo-jazz",
    account: "cratedigging",
    caption: "A jazz trio in a small room. The concert was forty people and sounded like four hundred.",
    mediaType: "video",
    art: "stage",
    savedAt: "2025-05-02T22:15:00.000Z",
    url: "https://www.instagram.com/p/reelioJazz/",
  },
  {
    id: "demo-apartment",
    account: "roomedit",
    caption:
      "The apartment before the sofa arrives. Afternoon light on the oak floor is the whole interior.",
    mediaType: "carousel",
    art: "apartment",
    savedAt: "2025-04-11T16:05:00.000Z",
    url: "https://www.instagram.com/p/reelioApartment/",
  },
  {
    id: "demo-journal",
    account: "notebookhour",
    caption: "Ten minutes of journaling that turned into a grocery list. A short meditation still counts.",
    mediaType: "photo",
    art: "notebook",
    savedAt: "2025-03-08T06:55:00.000Z",
    url: "https://www.instagram.com/p/reelioJournal/",
  },
  {
    id: "demo-market",
    account: "nightstall",
    caption: "Pepper buns and grilled scallions from a stall in the rain. The plastic stool was the best seat.",
    mediaType: "reel",
    art: "market",
    savedAt: "2025-02-14T13:35:00.000Z",
    url: "https://www.instagram.com/reel/reelioMarket/",
  },
  {
    id: "demo-later",
    account: "inboxlater",
    caption: "Saving this for a day when I have more time.",
    mediaType: "photo",
    art: "later",
    savedAt: "2025-01-19T10:00:00.000Z",
    url: "https://www.instagram.com/p/reelioLater/",
  },
];

export function createDemoLibrary(): SavedPost[] {
  return SEEDS.map((seed) =>
    withOfflineSuggestion({
      id: seed.id,
      url: seed.url,
      savedAt: seed.savedAt,
      caption: seed.caption,
      account: seed.account,
      mediaType: seed.mediaType,
      art: seed.art,
      tags: seed.tags ?? [],
      source: "demo",
    }),
  );
}
