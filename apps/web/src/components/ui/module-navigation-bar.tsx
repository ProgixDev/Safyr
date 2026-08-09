"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Grid3x3, ChevronDown } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUiStore } from "@/lib/stores/uiStore";

export interface NavItem {
  label: string;
  /**
   * Libellé court affiché en dessous de 1700 px.
   *
   * Mesuré dans le navigateur sur le build de production : avec les libellés
   * complets les neuf menus RH réclament 1 508 px, ce qui ne rentre qu'à
   * partir de ~1 700 px de fenêtre (la barre latérale en consomme 80). Les
   * libellés courts ramènent le besoin à 1 033 px, et tiennent donc sur une
   * seule ligne jusqu'à 1 150 px.
   */
  shortLabel?: string;
  href?: string;
  icon: React.ElementType;
  disabled?: boolean;
  children?: {
    label: string;
    href: string;
    disabled?: boolean;
    isNew?: boolean;
    section?: string;
  }[];
}

export interface ModuleNavigationBarProps {
  moduleIcon: React.ElementType;
  dashboardHref: string;
  navItems: NavItem[];
  showNav?: boolean;
}

/**
 * Style commun des entrées de la barre de module.
 *
 * La barre défilait horizontalement quand les menus ne tenaient pas : il
 * fallait faire glisser de gauche à droite pour les voir tous. Elle est
 * désormais compacte et passe à la ligne — tous les menus restent visibles
 * d'un seul coup d'œil, quelle que soit la largeur de l'écran.
 *
 * `whitespace-nowrap` empêche de couper un libellé en deux ; le padding, la
 * police et les icônes se resserrent sur les écrans étroits pour tenir sur une
 * seule ligne le plus longtemps possible.
 */
const NAV_ITEM_BASE =
  "flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium whitespace-nowrap transition-all sm:text-xs lg:gap-1.5 lg:px-2 xl:px-2.5 2xl:px-3 2xl:text-sm";

/**
 * Icônes de la barre : réduites jusqu'au très grand écran. Le passage à
 * `text-sm` n'intervient qu'en 2xl (≥ 1536 px) — le faire dès 1280 px suffisait
 * à faire déborder les neuf menus RH sur une seconde ligne.
 */
const NAV_ICON = "h-3.5 w-3.5 shrink-0 2xl:h-4 2xl:w-4";

/** Libellé court en dessous de 1700 px, libellé complet au-delà. */
function NavLabel({ item }: { item: NavItem }) {
  if (!item.shortLabel) return <span>{item.label}</span>;
  return (
    <>
      <span className="min-[1700px]:hidden">{item.shortLabel}</span>
      <span className="hidden min-[1700px]:inline">{item.label}</span>
    </>
  );
}

const NAV_ITEM_ACTIVE = "bg-primary text-primary-foreground shadow-sm";
const NAV_ITEM_IDLE = "text-foreground hover:bg-accent hover:text-foreground";
const NAV_ITEM_DISABLED = "text-muted-foreground opacity-50 cursor-not-allowed";

export function ModuleNavigationBar({
  moduleIcon: ModuleIcon,
  dashboardHref,
  navItems,
  showNav = true,
}: ModuleNavigationBarProps) {
  const pathname = usePathname();
  const isNavExpanded = useUiStore((s) => s.isNavExpanded);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<NavItem | null>(null);
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

  const shouldExpand = isNavExpanded;

  const isActiveItem = (item: NavItem) => {
    if (item.href && pathname === item.href) return true;
    if (item.children) {
      return item.children.some((child) => pathname === child.href);
    }
    return false;
  };

  const getActiveItem = () => {
    return navItems.find((item) => isActiveItem(item));
  };

  const activeItem = getActiveItem();
  const isDashboardActive = pathname === dashboardHref;

  return (
    <div className="border-t bg-muted/30">
      {showNav && (
        <nav className="flex flex-wrap items-center gap-x-1 gap-y-1 px-2 py-1.5 lg:gap-x-1.5 xl:gap-x-2 xl:px-4">
          {!shouldExpand ? (
            <>
              {/* Active Menu Item Name */}
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-primary 2xl:text-sm">
                {isDashboardActive ? (
                  <>
                    <ModuleIcon className={NAV_ICON} />
                    <span>Tableau de bord</span>
                  </>
                ) : activeItem ? (
                  <>
                    <activeItem.icon className={NAV_ICON} />
                    <span>{activeItem.label}</span>
                  </>
                ) : null}
              </div>

              {/* Module Items Modal Trigger */}
              <Button
                variant="outline"
                size="sm"
                className="flex h-7 items-center gap-1.5 px-2 text-xs"
                onClick={() => setIsModalOpen(true)}
              >
                <Grid3x3 className={NAV_ICON} />
                <span>Menu</span>
              </Button>
            </>
          ) : (
            <>
              {/* Dashboard Link */}
              <Link
                href={dashboardHref}
                className={cn(
                  NAV_ITEM_BASE,
                  isDashboardActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE,
                )}
              >
                <ModuleIcon className={NAV_ICON} />
                <span className="min-[1700px]:hidden">Accueil</span>
                <span className="hidden min-[1700px]:inline">
                  Tableau de bord
                </span>
              </Link>

              <div className="h-5 w-px shrink-0 bg-border" />

              {/* All Navigation Items */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveItem(item);

                if (item.disabled) {
                  return (
                    <div
                      key={item.label}
                      className={cn(NAV_ITEM_BASE, NAV_ITEM_DISABLED)}
                    >
                      <Icon className={NAV_ICON} />
                      <NavLabel item={item} />
                    </div>
                  );
                }

                if (item.children) {
                  return (
                    <DropdownMenu
                      key={item.label}
                      open={openDropdown === item.label}
                      onOpenChange={(open) =>
                        setOpenDropdown(open ? item.label : null)
                      }
                    >
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            NAV_ITEM_BASE,
                            isActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE,
                          )}
                        >
                          <Icon className={NAV_ICON} />
                          <NavLabel item={item} />
                          <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {item.children.map((child, index) => {
                          const prevSection =
                            index > 0
                              ? item.children![index - 1].section
                              : undefined;
                          const showSectionHeader =
                            child.section && child.section !== prevSection;

                          const node = child.disabled ? (
                            <DropdownMenuItem
                              key={child.href}
                              disabled
                              className="opacity-50"
                            >
                              {child.label}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem key={child.href} asChild>
                              <Link
                                href={child.href}
                                className={cn(
                                  "w-full cursor-pointer",
                                  pathname === child.href && "bg-accent",
                                )}
                              >
                                <span className="text-[15px]">
                                  {child.label}
                                </span>
                                {child.isNew && (
                                  <span className="ml-auto px-1.5 py-0.5 text-xs font-semibold rounded-full bg-green-500 text-white">
                                    Nouveau
                                  </span>
                                )}
                              </Link>
                            </DropdownMenuItem>
                          );

                          if (showSectionHeader) {
                            return (
                              <div key={`${child.href}-with-header`}>
                                {index > 0 && (
                                  <div className="my-1 h-px bg-border" />
                                )}
                                <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  {child.section}
                                </div>
                                {node}
                              </div>
                            );
                          }
                          return node;
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                if (item.href) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        NAV_ITEM_BASE,
                        isActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE,
                      )}
                    >
                      <Icon className={NAV_ICON} />
                      <NavLabel item={item} />
                    </Link>
                  );
                }

                return null;
              })}
            </>
          )}

          {/* Modules Modal */}
          <Modal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            type="details"
            title="Menu"
            size="lg"
            closable={true}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Dashboard Item */}
              <Link
                href={dashboardHref}
                onClick={() => setIsModalOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all hover:shadow-md",
                  isDashboardActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-accent",
                )}
              >
                <ModuleIcon className="h-8 w-8" />
                <span className="text-sm font-medium text-center">
                  Tableau de bord
                </span>
              </Link>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveItem(item);

                if (item.disabled) {
                  return (
                    <div
                      key={item.label}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border bg-muted/50 opacity-50 cursor-not-allowed"
                    >
                      <Icon className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                  );
                }

                if (item.children) {
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        setSelectedItem(item);
                        setIsModalOpen(false);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all hover:shadow-md",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card hover:bg-accent",
                      )}
                    >
                      <Icon className="h-8 w-8" />
                      <span className="text-sm font-medium text-center">
                        {item.label}
                      </span>
                    </button>
                  );
                }

                if (item.href) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsModalOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all hover:shadow-md",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card hover:bg-accent",
                      )}
                    >
                      <Icon className="h-8 w-8" />
                      <span className="text-sm font-medium text-center">
                        {item.label}
                      </span>
                    </Link>
                  );
                }

                return null;
              })}
            </div>
          </Modal>

          {/* Sub-items Modal */}
          {selectedItem && (
            <Modal
              open={!!selectedItem}
              onOpenChange={(open) => !open && setSelectedItem(null)}
              type="details"
              title={selectedItem.label}
              description="Sélectionnez une option"
              size="sm"
              closable={true}
            >
              <div className="flex flex-col gap-2">
                {selectedItem.children?.map((child) => {
                  if (child.disabled) {
                    return (
                      <div
                        key={child.href}
                        className="px-4 py-3 rounded-lg border bg-muted/50 opacity-50 cursor-not-allowed"
                      >
                        <span className="text-sm text-muted-foreground">
                          {child.label}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setSelectedItem(null)}
                      className={cn(
                        "px-4 py-3 rounded-lg border transition-all hover:shadow-sm",
                        pathname === child.href
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card hover:bg-accent",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {child.label}
                        </span>
                        {child.isNew && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-500 text-white">
                            Nouveau
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Modal>
          )}

          {/* Active Item's Children (Sub-items) */}
          {!shouldExpand && activeItem?.children && (
            <>
              <div className="h-5 w-px shrink-0 bg-border" />
              <div className="flex flex-1 flex-wrap items-center gap-1">
                {activeItem.children.map((child, index) => {
                  const prevSection =
                    index > 0
                      ? activeItem.children![index - 1].section
                      : undefined;
                  const showSectionHeader =
                    child.section && child.section !== prevSection;

                  const node = child.disabled ? (
                    <div
                      key={child.href}
                      className={cn(NAV_ITEM_BASE, NAV_ITEM_DISABLED)}
                    >
                      <span>{child.label}</span>
                    </div>
                  ) : (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        NAV_ITEM_BASE,
                        pathname === child.href
                          ? NAV_ITEM_ACTIVE
                          : NAV_ITEM_IDLE,
                      )}
                    >
                      <span>{child.label}</span>
                      {child.isNew && (
                        <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-green-500 text-white">
                          Nouveau
                        </span>
                      )}
                    </Link>
                  );

                  if (showSectionHeader) {
                    return (
                      <div
                        key={`${child.href}-with-header`}
                        className="flex items-center gap-1"
                      >
                        {index > 0 && (
                          <div className="h-6 w-px bg-border mx-1" />
                        )}
                        <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          {child.section}
                        </span>
                        {node}
                      </div>
                    );
                  }
                  return node;
                })}
              </div>
            </>
          )}
        </nav>
      )}
    </div>
  );
}
