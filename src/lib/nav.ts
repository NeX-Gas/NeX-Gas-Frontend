import { Bell, ClipboardList, Home, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/riwayat", label: "Riwayat", icon: ClipboardList },
  { href: "/notifikasi", label: "Notifikasi", icon: Bell },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];

export const pageTitles: Record<string, string> = {
  "/": "Home",
  "/riwayat": "Riwayat",
  "/purifikasi": "Purifikasi",
  "/notifikasi": "Notifikasi",
  "/pengaturan": "Pengaturan",
};
