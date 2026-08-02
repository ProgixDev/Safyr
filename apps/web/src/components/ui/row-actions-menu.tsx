"use client";

import * as React from "react";
import {
  Eye,
  Pencil,
  Trash2,
  Upload,
  Download,
  MoreVertical,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Palette unique des menus "actions" (3 points) du logiciel.
 * Chaque intention a une couleur d'icône réservée : voir = vert,
 * modifier = orange, supprimer = rouge, téléverser = bleu,
 * télécharger = violet, historique = bleu (icône horloge), etc.
 */
export const ROW_ACTION_TONES = {
  view: "text-green-600 dark:text-green-500",
  edit: "text-orange-500",
  delete: "text-red-600 dark:text-red-500",
  upload: "text-blue-500",
  download: "text-violet-500",
  history: "text-blue-500",
  validate: "text-emerald-500",
  send: "text-sky-500",
  neutral: "text-muted-foreground",
} as const;

export type RowActionTone = keyof typeof ROW_ACTION_TONES;

export interface RowActionItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  /** Couleur de l'icône. Par défaut : neutral. */
  tone?: RowActionTone;
  disabled?: boolean;
  /** Met le libellé en rouge (utilisé pour les actions destructives). */
  destructive?: boolean;
  /** Insère un séparateur avant cette entrée. */
  separatorBefore?: boolean;
}

export interface RowActionsMenuProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onUpload?: () => void;
  onDownload?: () => void;

  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  uploadLabel?: string;
  downloadLabel?: string;

  /** Entrées supplémentaires propres à la page, insérées avant "Supprimer". */
  extraItems?: RowActionItem[];
  align?: "start" | "center" | "end";
  label?: string;
  disabled?: boolean;
  className?: string;
  /** Libellé accessible du bouton déclencheur. */
  triggerLabel?: string;
}

function ActionEntry({ item }: { item: RowActionItem }) {
  const Icon = item.icon;
  return (
    <DropdownMenuItem
      onClick={item.onClick}
      disabled={item.disabled}
      variant={item.destructive ? "destructive" : "default"}
      className="cursor-pointer"
    >
      <Icon
        className={cn("mr-2 h-4 w-4", ROW_ACTION_TONES[item.tone ?? "neutral"])}
      />
      {item.label}
    </DropdownMenuItem>
  );
}

/**
 * Menu "actions" standard (3 points) utilisé sur toutes les pages du logiciel.
 *
 * Ordre imposé : Voir · Modifier · [actions spécifiques à la page] ·
 * Téléverser · Télécharger · Supprimer.
 */
export function RowActionsMenu({
  onView,
  onEdit,
  onDelete,
  onUpload,
  onDownload,
  viewLabel = "Voir",
  editLabel = "Modifier",
  deleteLabel = "Supprimer",
  uploadLabel = "Téléverser",
  downloadLabel = "Télécharger",
  extraItems = [],
  align = "end",
  label = "Actions",
  disabled = false,
  className,
  triggerLabel = "Ouvrir le menu d'actions",
}: RowActionsMenuProps) {
  const items: RowActionItem[] = [];

  if (onView) {
    items.push({ label: viewLabel, icon: Eye, tone: "view", onClick: onView });
  }
  if (onEdit) {
    items.push({
      label: editLabel,
      icon: Pencil,
      tone: "edit",
      onClick: onEdit,
    });
  }

  items.push(...extraItems);

  if (onUpload) {
    items.push({
      label: uploadLabel,
      icon: Upload,
      tone: "upload",
      onClick: onUpload,
    });
  }
  if (onDownload) {
    items.push({
      label: downloadLabel,
      icon: Download,
      tone: "download",
      onClick: onDownload,
    });
  }

  const hasDelete = Boolean(onDelete);

  if (items.length === 0 && !hasDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0", className)}
          disabled={disabled}
          aria-label={triggerLabel}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="min-w-44"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item, index) => (
          <React.Fragment key={`${item.label}-${index}`}>
            {item.separatorBefore && <DropdownMenuSeparator />}
            <ActionEntry item={item} />
          </React.Fragment>
        ))}
        {hasDelete && (
          <>
            {items.length > 0 && <DropdownMenuSeparator />}
            <ActionEntry
              item={{
                label: deleteLabel,
                icon: Trash2,
                tone: "delete",
                destructive: true,
                onClick: onDelete!,
              }}
            />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Variante "documents" : Voir · Téléverser · Télécharger · Supprimer.
 * Demandée par le client sur les pages documents (entreprise, impôts,
 * dossiers salariés, AKTO/OPCO, appels d'offre).
 */
export function DocumentActionsMenu({
  onView,
  onUpload,
  onDownload,
  onDelete,
  extraItems,
  align = "end",
  disabled,
}: Pick<
  RowActionsMenuProps,
  | "onView"
  | "onUpload"
  | "onDownload"
  | "onDelete"
  | "extraItems"
  | "align"
  | "disabled"
>) {
  return (
    <RowActionsMenu
      onView={onView}
      onUpload={onUpload}
      onDownload={onDownload}
      onDelete={onDelete}
      extraItems={extraItems}
      align={align}
      disabled={disabled}
    />
  );
}
