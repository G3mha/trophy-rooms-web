// Shared by the profile page and the profile editor. Order is display order.
export const SOCIAL_NETWORKS = [
  { network: "PSN", label: "PlayStation Network", placeholder: "PSN ID" },
  { network: "XBOX", label: "Xbox", placeholder: "Gamertag" },
  { network: "NINTENDO", label: "Nintendo", placeholder: "SW-1234-5678-9012" },
  { network: "STEAM", label: "Steam", placeholder: "Custom URL name" },
  { network: "DISCORD", label: "Discord", placeholder: "Username" },
  { network: "TWITCH", label: "Twitch", placeholder: "Username" },
  { network: "YOUTUBE", label: "YouTube", placeholder: "@handle" },
  { network: "X", label: "X", placeholder: "@handle" },
  { network: "BLUESKY", label: "Bluesky", placeholder: "name.bsky.social" },
  { network: "INSTAGRAM", label: "Instagram", placeholder: "@handle" },
  { network: "TIKTOK", label: "TikTok", placeholder: "@handle" },
] as const;

export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number]["network"];

export const SHOWCASE_LISTS = [
  { list: "ALL_TIME", key: "allTime", title: "Favorite Games of All Time" },
  { list: "PLATINUMS", key: "platinums", title: "Top Platinums" },
  { list: "COLLECTION", key: "collection", title: "Collection Favorites" },
] as const;

export type ShowcaseKey = (typeof SHOWCASE_LISTS)[number]["key"];

export const SHOWCASE_MAX_GAMES = 10;
export const BIO_MAX_LENGTH = 300;
export const NAME_MAX_LENGTH = 50;

export interface ShowcaseGame {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
}

export interface SocialLink {
  id: string;
  network: SocialNetwork;
  handle: string;
  url?: string | null;
}

export type Profile = {
  bio?: string | null;
  avatarUrl?: string | null;
  socialLinks?: SocialLink[];
} & Partial<Record<ShowcaseKey, ShowcaseGame[]>>;

export function socialLabel(network: SocialNetwork): string {
  return SOCIAL_NETWORKS.find((n) => n.network === network)?.label ?? network;
}
