"use client";

import {
  ModuleNavigationBar,
  NavItem,
} from "@/components/ui/module-navigation-bar";
import {
  MapPin,
  Navigation,
  Square,
  CheckCircle,
  FileText,
  History,
} from "lucide-react";

const navItems: NavItem[] = [
  {
    label: "Live Tracking",
    href: "/dashboard/geolocation/live",
    icon: MapPin,
  },
  {
    label: "Live (réel)",
    href: "/dashboard/geolocation/live-api",
    icon: MapPin,
  },
  {
    label: "Zone Géolocalisée",
    href: "/dashboard/geolocation/zones",
    icon: Square,
  },
  {
    label: "Pointage",
    href: "/dashboard/geolocation/pointage",
    icon: CheckCircle,
  },
  {
    label: "Rondes",
    href: "/dashboard/geolocation/rounds",
    icon: Navigation,
  },
  {
    label: "Historique",
    href: "/dashboard/geolocation/historique",
    icon: History,
  },
  {
    label: "Rapports",
    href: "/dashboard/geolocation/reports",
    icon: FileText,
  },
];

interface GeolocationNavigationBarProps {
  showNav?: boolean;
}

export function GeolocationNavigationBar({
  showNav = true,
}: GeolocationNavigationBarProps) {
  return (
    <ModuleNavigationBar
      moduleIcon={MapPin}
      dashboardHref="/dashboard/geolocation"
      navItems={navItems}
      showNav={showNav}
    />
  );
}
