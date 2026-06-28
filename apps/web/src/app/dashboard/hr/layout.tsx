"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ProfileModal } from "@/components/layout/ProfileModal";
import { useSendEmail } from "@/contexts/SendEmailContext";
import { SendEmailModal } from "@/components/modals/SendEmailModal";
import { mockEmailTemplates } from "@/data/email-templates";
import { HRNavigationBar } from "@/components/layout/HRNavigationBar";
import { ModuleTopBar } from "@/components/ui/module-top-bar";
import { Users } from "lucide-react";
import { sendCommunicationEmail } from "@safyr/api-client";

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [profileModalOpen, setProfileModalOpen] = React.useState(false);

  const { isOpen, selectedEmployees, closeEmailModal, handleSendSuccess } =
    useSendEmail();

  const isEmployeeDetails =
    pathname.startsWith("/dashboard/hr/collaborators/") &&
    !["personnel-register", "contracts", "interviews", "discipline"].some(
      (path) => pathname.includes(path),
    );

  const handleSendEmail = async (emailData: {
    subject: string;
    body: string;
  }) => {
    const emails = selectedEmployees
      .map((e) => e.email)
      .filter((email): email is string => Boolean(email));

    handleSendSuccess();

    if (emails.length === 0) {
      alert("Aucun destinataire avec une adresse email valide");
      return;
    }

    try {
      const result = await sendCommunicationEmail({
        recipients: emails,
        subject: emailData.subject,
        body: emailData.body,
        saveInArchive: true,
      });
      alert(`Email envoyé à ${result.sent} destinataire(s)`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Échec de l'envoi de l'email : ${message}`);
    }
  };

  return (
    <>
      <div className="flex h-screen flex-col">
        <ModuleTopBar
          moduleTitle="Ressources Humaines"
          moduleIcon={Users}
          onProfileClick={() => setProfileModalOpen(true)}
          userAvatar="/avatars/admin.jpg"
          showConteurs={true}
        />
        {!isEmployeeDetails && <HRNavigationBar showNav={!isEmployeeDetails} />}
        <main
          className={`flex-1 overflow-auto relative ${isEmployeeDetails ? "p-0" : "p-6"}`}
        >
          {children}
        </main>
      </div>

      <ProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />

      <SendEmailModal
        open={isOpen}
        onOpenChange={closeEmailModal}
        selectedEmployees={selectedEmployees}
        templates={mockEmailTemplates}
        onSend={handleSendEmail}
      />
    </>
  );
}
