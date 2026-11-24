import { Bell, ClipboardList, Home, Settings, Wind, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/riwayat", label: "Riwayat", icon: ClipboardList },
  { href: "/purifikasi", label: "Purifikasi", icon: Wind },
  { href: "/kalibrasi", label: "Kalibrasi", icon: Wrench },
  { href: "/notifikasi", label: "Notifikasi", icon: Bell },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
];

export const pageTitles: Record<string, string> = {
  "/": "Beranda",
  "/riwayat": "Riwayat",
  "/purifikasi": "Purifikasi",
  "/kalibrasi": "Kalibrasi",
  "/notifikasi": "Notifikasi",
  "/pengaturan": "Pengaturan",
};
