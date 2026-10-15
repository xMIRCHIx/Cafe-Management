import type { Order } from "./menu";
export type Dish = {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  price: number;
  veg: boolean;
  badge: string;
  minutes: number;
  available: boolean;
  archived: boolean;
  sort_order: number;
};
export type Seat = {
  id: string;
  number: number;
  label: string;
  code: string;
  active: boolean;
};
export type Settings = {
  id: number;
  cafe_name: string;
  tagline: string;
  announcement: string;
  accent_color: string;
  ordering_open: boolean;
  require_login: boolean;
  wifi_required: boolean;
  wifi_ssid: string;
  wifi_password: string;
  wifi_security: string;
  wifi_public_ips: string[];
  discount_percent: number;
  reward_item_id: string | null;
};
export type PublicSettings = Pick<
  Settings,
  | "cafe_name"
  | "tagline"
  | "announcement"
  | "accent_color"
  | "ordering_open"
  | "require_login"
  | "wifi_required"
  | "discount_percent"
  | "reward_item_id"
>;
export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  strikes: number;
  blocked_until: string | null;
  created_at: string;
};
export type CafeOrder = Order & {
  customer_id: string | null;
  subtotal: number;
  discount: number;
  paid: boolean;
  paid_at: string | null;
  seat_verified: boolean;
  rejection_reason: string;
  reward_id: string | null;
};
export type Track = {
  id: string;
  title: string;
  artist: string;
  video_id: string;
  status: "queued" | "playing" | "played" | "removed";
  created_at: string;
  votes: number;
  voted?: boolean;
};
export type Reward = {
  id: string;
  earned_at: string;
  expires_at: string;
  state: "available" | "reserved" | "redeemed";
};
export type Loyalty = {
  stamps: number;
  visits: number;
  rewards: Reward[];
  returning: boolean;
};
export type Account = {
  user: { id: string; email?: string; phone?: string } | null;
  profile: Customer | null;
  loyalty: Loyalty;
  methods: { email: boolean; phone: boolean; google: boolean };
};
export const emptyLoyalty: Loyalty = {
  stamps: 0,
  visits: 0,
  rewards: [],
  returning: false,
};
export const defaultSettings: PublicSettings = {
  cafe_name: "NOIRIC",
  tagline: "Your table. Your time.",
  announcement: "",
  accent_color: "#b3442d",
  ordering_open: true,
  require_login: true,
  wifi_required: false,
  discount_percent: 0,
  reward_item_id: null,
};
export const statusLabel: Record<string, string> = {
  received: "Awaiting confirmation",
  preparing: "In the kitchen",
  ready: "Ready to serve",
  served: "Served",
  cancelled: "Cancelled",
};
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await response
    .json()
    .catch(() => ({ error: "Something went wrong. Please try again." }));
  if (!response.ok)
    throw new Error(data.error || "Unable to complete your request.");
  return data;
}
