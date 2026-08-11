"use client";

import { useState } from "react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ArchivedEmail {
  id: string;
  date: string;
  sender: string;
  recipients: string[];
  recipientType: "employee" | "client" | "partner";
  subject: string;
  body: string;
  attachments?: string[];
  status: "Envoyé" | "Échec" | "En attente";
}

const mockArchivedEmails: ArchivedEmail[] = [];

export default function CommunicationArchivesPage() {
  const [emails] = useState<ArchivedEmail[]>(mockArchivedEmails);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<ArchivedEmail | null>(
    null,
  );
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredEmails = emails.filter((email) => {
    const typeMatch =
      filterType === "all" || email.recipientType === filterType;
    const statusMatch = filterStatus === "all" || email.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const columns: ColumnDef<ArchivedEmail>[] = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (email) =>
        new Date(email.date).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      key: "subject",
      label: "Objet",
      render: (email) => <span className="font-medium">{email.subject}</span>,
    },
    {
      key: "recipientType",
      label: "Type",
      render: (email) => {
        const variants: Record<string, "default" | "secondary" | "outline"> = {
          employee: "default",
          client: "secondary",
          partner: "outline",
        };
        const labels = {
          employee: "Employé",
          client: "Client",
          partner: "Partenaire",
        };
        return (
          <Badge variant={variants[email.recipientType]}>
            {labels[email.recipientType]}
          </Badge>
        );
      },
    },
    {
      key: "recipients",
      label: "Destinataires",
      render: (email) => (
        <span className="text-sm">{email.recipients.join(", ")}</span>
      ),
    },
    {
      key: "attachments",
      label: "PJ",
      render: (email) => (
        <span className="text-sm text-muted-foreground">
          {email.attachments?.length || 0}
        </span>
      ),
    },
    {
      key: "status",
      label: "Statut",
      render: (email) => {
        const variants: Record<
          string,
          "default" | "secondary" | "outline" | "destructive"
        > = {
          Envoyé: "default",
          Échec: "destructive",
          "En attente": "secondary",
        };
        return <Badge variant={variants[email.status]}>{email.status}</Badge>;
      },
    },
  ];

  const handleRowClick = (email: ArchivedEmail) => {
    setSelectedEmail(email);
    setIsViewModalOpen(true);
  };

  const handleExport = () => {
    alert("Export des communications archivées en cours...");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Archives des Communications</h1>
          <p className="text-muted-foreground">
            Historique complet de toutes les communications envoyées depuis la
            plateforme
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="w-48">
          <Label>Type de destinataire</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="employee">Employés</SelectItem>
              <SelectItem value="client">Clients</SelectItem>
              <SelectItem value="partner">Partenaires</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Label>Statut</Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="Envoyé">Envoyé</SelectItem>
              <SelectItem value="Échec">Échec</SelectItem>
              <SelectItem value="En attente">En attente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={filteredEmails}
        columns={columns}
        searchKey="subject"
        searchPlaceholder="Rechercher un email..."
        onRowClick={handleRowClick}
      />

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de la communication"
        size="lg"
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {selectedEmail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date d&apos;envoi</Label>
                <p className="text-sm font-medium">
                  {new Date(selectedEmail.date).toLocaleString("fr-FR")}
                </p>
              </div>
              <div>
                <Label>Expéditeur</Label>
                <p className="text-sm font-medium">{selectedEmail.sender}</p>
              </div>
            </div>

            <div>
              <Label>Destinataires</Label>
              <p className="text-sm font-medium">
                {selectedEmail.recipients.join(", ")}
              </p>
              <Badge variant="secondary" className="mt-1">
                {selectedEmail.recipientType}
              </Badge>
            </div>

            <div>
              <Label>Objet</Label>
              <p className="text-sm font-medium">{selectedEmail.subject}</p>
            </div>

            <div>
              <Label>Message</Label>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">
                  {selectedEmail.body}
                </p>
              </div>
            </div>

            {selectedEmail.attachments &&
              selectedEmail.attachments.length > 0 && (
                <div>
                  <Label>Pièces jointes</Label>
                  <div className="space-y-2 mt-2">
                    {selectedEmail.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <span className="text-sm">{file}</span>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div>
              <Label>Statut</Label>
              <Badge
                variant={
                  selectedEmail.status === "Envoyé"
                    ? "default"
                    : selectedEmail.status === "Échec"
                      ? "destructive"
                      : "secondary"
                }
              >
                {selectedEmail.status}
              </Badge>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
