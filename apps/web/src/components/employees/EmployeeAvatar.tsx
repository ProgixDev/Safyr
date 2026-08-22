"use client";

import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEmployeePhotoUrl } from "@/hooks/employees";
import { cn } from "@/lib/utils";

interface EmployeeAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  /** Clé de stockage de la photo, ou URL pour les anciens enregistrements. */
  photo?: string | null;
  className?: string;
  loading?: boolean;
}

/**
 * Vignette d'un salarié : sa photo si elle a été déposée, ses initiales sinon.
 *
 * Les listes affichaient `employee.photo` directement dans `<AvatarImage>` ;
 * or ce champ contient une clé du bucket privé, pas une URL — l'image ne
 * s'affichait donc jamais. La résolution en URL signée passe par un hook, d'où
 * ce petit composant.
 */
export function EmployeeAvatar({
  firstName,
  lastName,
  photo,
  className,
  loading = false,
}: EmployeeAvatarProps) {
  const url = useEmployeePhotoUrl(photo);
  const initiales =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <Avatar className={cn("h-10 w-10", className)}>
      {loading ? (
        <AvatarFallback>
          <Loader2 className="h-4 w-4 animate-spin" />
        </AvatarFallback>
      ) : (
        <>
          {url && <AvatarImage src={url} alt={initiales} />}
          <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
            {initiales || "?"}
          </AvatarFallback>
        </>
      )}
    </Avatar>
  );
}
