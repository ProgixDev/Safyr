"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Calendar,
  Wallet,
  Building2,
  MapPin,
  ClipboardCheck,
  UserCircle,
  Eye,
  Landmark,
  Receipt,
  Package,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SendEmailProvider } from "@/contexts/SendEmailContext";
import { useUiStore } from "@/lib/stores/uiStore";
import { AgendaModal } from "@/components/modals/AgendaModal";
import { LiensUtilesModal } from "@/components/modals/LiensUtilesModal";
import { SessionGuard } from "@/components/session-guard";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface Module {
  name: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
}

const modules: Module[] = [
  {
    name: "RH",
    href: "/dashboard/hr",
    icon: Users,
  },
  {
    name: "Planning",
    href: "/dashboard/planning",
    icon: Calendar,
    disabled: false,
  },
  {
    name: "Main Courante",
    href: "/dashboard/logbook",
    icon: BookOpen,
    disabled: false,
  },
  {
    name: "Géolocalisation",
    href: "/dashboard/geolocation",
    icon: MapPin,
    disabled: false,
  },
  {
    name: "Paie",
    href: "/dashboard/payroll",
    icon: Wallet,
    disabled: false,
  },
  {
    name: "Comptabilité",
    href: "/dashboard/accounting",
    icon: Landmark,
    disabled: false,
  },
  {
    name: "Banque",
    href: "/dashboard/banking",
    icon: Building2,
    disabled: false,
  },
  {
    name: "Facturation",
    href: "/dashboard/billing",
    icon: Receipt,
    disabled: false,
  },
  {
    name: "Stock",
    href: "/dashboard/stock",
    icon: Package,
    disabled: false,
  },
  {
    name: "OCR",
    href: "/dashboard/ocr",
    icon: ClipboardCheck,
    disabled: false,
  },
  {
    name: "Portail Agent",
    href: "/dashboard/agent-portal",
    icon: UserCircle,
    disabled: true,
  },
  {
    name: "Portail Client",
    href: "/dashboard/client-portal",
    icon: Eye,
    disabled: true,
  },
];

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const {
    sidebarMode,
    setSidebarMode,
    sidebarHidden: isHidden,
    setIsHidden,
  } = useUiStore();

  const isExpandedDisplay = sidebarMode === "expanded";

  return (
    <div className="flex h-screen bg-background font-display">
      {/* Floating Show Sidebar Button */}
      {isHidden && (
        <button
          onClick={() => setIsHidden(false)}
          className="fixed bottom-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border bg-card shadow-lg ring-1 ring-border hover:bg-accent hover:scale-105 transition-all"
          aria-label="Show sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Fixed Module Selector Sidebar */}
      <aside
        className={cn(
          "border-r bg-card shrink-0 transition-all duration-300 relative",
          isHidden
            ? "w-0 overflow-hidden"
            : sidebarMode === "expanded"
              ? "w-64"
              : "w-20",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div
            className={cn(
              "flex h-20 border-b relative px-4",
              isExpandedDisplay
                ? "items-center justify-between"
                : "items-center justify-center",
            )}
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image
                src="/favicon.png"
                alt="Safyr"
                width={32}
                height={32}
                className="transition-transform hover:scale-110"
              />
              {isExpandedDisplay && (
                <span className="font-serif text-xl font-light">Safyr</span>
              )}
            </Link>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={() =>
              setSidebarMode(
                sidebarMode === "expanded" ? "collapsed" : "expanded",
              )
            }
            className="absolute -right-3 top-20 z-20 flex h-6 w-6 items-center justify-center rounded-full border bg-card shadow-md hover:bg-accent transition-colors"
            aria-label={
              sidebarMode === "expanded" ? "Collapse sidebar" : "Expand sidebar"
            }
          >
            {sidebarMode === "expanded" ? (
              <ChevronLeft className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>

          {/* Module List */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-2 px-2">
              {modules.map((module) => {
                const Icon = module.icon;
                const isActive = pathname.startsWith(module.href);

                return (
                  <li key={module.name}>
                    {module.disabled ? (
                      <div
                        className={cn(
                          "flex items-center rounded-xl text-muted-foreground opacity-30 cursor-not-allowed transition-all",
                          isExpandedDisplay
                            ? "gap-3 px-4 py-3"
                            : "h-12 w-12 mx-auto justify-center",
                        )}
                        title={!isExpandedDisplay ? module.name : undefined}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {isExpandedDisplay && (
                          <span className="text-sm font-light">
                            {module.name}
                          </span>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={module.href}
                        className={cn(
                          "flex items-center rounded-xl transition-all relative group",
                          isExpandedDisplay
                            ? "gap-3 px-4 py-3"
                            : "h-12 w-12 mx-auto justify-center",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                        title={!isExpandedDisplay ? module.name : undefined}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {isExpandedDisplay && (
                          <span className="text-sm font-medium">
                            {module.name}
                          </span>
                        )}
                        {isActive && !isExpandedDisplay && (
                          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                        )}
                        {!isExpandedDisplay && (
                          <span className="absolute left-full ml-4 px-3 py-2 bg-popover text-popover-foreground text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border">
                            {module.name}
                          </span>
                        )}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t p-2 space-y-2">
            <ThemeToggle expanded={isExpandedDisplay} />
            <button
              onClick={() => setIsHidden(true)}
              className="flex h-6 w-6 mx-auto mt-2 items-center justify-center rounded-full border bg-card shadow-md hover:bg-accent transition-colors"
              aria-label="Hide sidebar"
            >
              <ChevronRight className="h-3 w-3 rotate-180" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area - This will contain the module-specific sidebar + content */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Modals */}
      <AgendaModal />
      <LiensUtilesModal />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGuard>
      <SendEmailProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </SendEmailProvider>
    </SessionGuard>
  );
}
