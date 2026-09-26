import type { Metadata } from "next";

// Page à lien personnel : ni indexée, ni référencée.
export const metadata: Metadata = {
  title: "Confirmation de remise de matériel — Safyr",
  robots: { index: false, follow: false },
};

export default function ConfirmationEquipementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
