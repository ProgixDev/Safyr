"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, X, Users, Building, UserCog } from "lucide-react";
import { mockEmployees } from "@/data/employees";
import { mockEmailTemplates } from "@/data/email-templates";
import { sendCommunicationEmail } from "@safyr/api-client";

interface EmailRecipient {
  id: string;
  name: string;
  email: string;
  type: "employee" | "client" | "partner";
}

const mockClients: EmailRecipient[] = [
  {
    id: "c1",
    name: "Centre Commercial Rosny 2",
    email: "contact@rosny2.fr",
    type: "client",
  },
  {
    id: "c2",
    name: "Siège Social La Défense",
    email: "rh@ladefense-corp.fr",
    type: "client",
  },
  {
    id: "c3",
    name: "Hôpital Saint-Antoine",
    email: "securite@hopital-saint-antoine.fr",
    type: "client",
  },
];

const mockPartners: EmailRecipient[] = [
  {
    id: "p1",
    name: "Centre de Formation SSIAP",
    email: "contact@formation-ssiap.fr",
    type: "partner",
  },
  {
    id: "p2",
    name: "Médecine du Travail Paris",
    email: "contact@medecine-travail-paris.fr",
    type: "partner",
  },
  {
    id: "p3",
    name: "AKTO - Organisme de Formation",
    email: "contact@akto.fr",
    type: "partner",
  },
];

export default function SendEmailPage() {
  const [recipientType, setRecipientType] = useState<
    "employee" | "client" | "partner"
  >("employee");
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [saveInArchive, setSaveInArchive] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const getRecipientsList = (): EmailRecipient[] => {
    switch (recipientType) {
      case "employee":
        return mockEmployees.map((emp) => ({
          id: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          email: emp.email,
          type: "employee",
        }));
      case "client":
        return mockClients;
      case "partner":
        return mockPartners;
      default:
        return [];
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = mockEmailTemplates.find((t) => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  };

  const handleSelectAll = () => {
    if (selectedRecipients.length === getRecipientsList().length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(getRecipientsList().map((r) => r.id));
    }
  };

  const handleRecipientToggle = (recipientId: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(recipientId)
        ? prev.filter((id) => id !== recipientId)
        : [...prev, recipientId],
    );
  };

  const handleFileAttach = () => {
    // Simulate file upload
    const fileName = `Document_${Date.now()}.pdf`;
    setAttachments([...attachments, fileName]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSendEmail = async () => {
    if (selectedRecipients.length === 0) {
      alert("Veuillez sélectionner au moins un destinataire");
      return;
    }
    if (!subject || !body) {
      alert("Veuillez remplir l'objet et le corps du message");
      return;
    }

    // Résout les emails à partir de tous les destinataires possibles.
    const allRecipients: EmailRecipient[] = [
      ...mockEmployees.map((emp) => ({
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        type: "employee" as const,
      })),
      ...mockClients,
      ...mockPartners,
    ];
    const emails = allRecipients
      .filter((r) => selectedRecipients.includes(r.id))
      .map((r) => r.email)
      .filter(Boolean);

    if (emails.length === 0) {
      alert("Aucune adresse email valide pour les destinataires sélectionnés");
      return;
    }

    setIsSending(true);
    try {
      const result = await sendCommunicationEmail({
        recipients: emails,
        subject,
        body,
        saveInArchive,
      });

      alert(
        `Email envoyé à ${result.sent} destinataire(s)${saveInArchive ? " et archivé dans les dossiers" : ""}`,
      );

      // Reset form
      setSelectedRecipients([]);
      setSubject("");
      setBody("");
      setSelectedTemplate("");
      setAttachments([]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Échec de l'envoi de l'email : ${message}`);
    } finally {
      setIsSending(false);
    }
  };

  const recipients = getRecipientsList();
  const allSelected =
    selectedRecipients.length === recipients.length && recipients.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Envoi d&apos;Emails</h1>
        <p className="text-muted-foreground">
          Envoyez des emails depuis la plateforme aux employés, clients et
          partenaires
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Recipients Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Destinataires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type Selection */}
            <div>
              <Label>Type de destinataires</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  variant={recipientType === "employee" ? "default" : "outline"}
                  size="sm"
                  className="flex flex-col items-center gap-1 h-auto py-2"
                  onClick={() => {
                    setRecipientType("employee");
                    setSelectedRecipients([]);
                  }}
                >
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Employés</span>
                </Button>
                <Button
                  variant={recipientType === "client" ? "default" : "outline"}
                  size="sm"
                  className="flex flex-col items-center gap-1 h-auto py-2"
                  onClick={() => {
                    setRecipientType("client");
                    setSelectedRecipients([]);
                  }}
                >
                  <Building className="h-4 w-4" />
                  <span className="text-xs">Clients</span>
                </Button>
                <Button
                  variant={recipientType === "partner" ? "default" : "outline"}
                  size="sm"
                  className="flex flex-col items-center gap-1 h-auto py-2"
                  onClick={() => {
                    setRecipientType("partner");
                    setSelectedRecipients([]);
                  }}
                >
                  <UserCog className="h-4 w-4" />
                  <span className="text-xs">Partenaires</span>
                </Button>
              </div>
            </div>

            {/* Select All */}
            <div className="flex items-center space-x-2 pt-2 border-t">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
              <Label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer"
              >
                Tout sélectionner ({recipients.length})
              </Label>
            </div>

            {/* Recipients List */}
            <div className="space-y-2 max-h-100 overflow-y-auto">
              {recipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50"
                >
                  <Checkbox
                    id={recipient.id}
                    checked={selectedRecipients.includes(recipient.id)}
                    onCheckedChange={() => handleRecipientToggle(recipient.id)}
                  />
                  <Label
                    htmlFor={recipient.id}
                    className="text-sm cursor-pointer flex-1"
                  >
                    <div className="font-medium">{recipient.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {recipient.email}
                    </div>
                  </Label>
                </div>
              ))}
            </div>

            {/* Selected Count */}
            {selectedRecipients.length > 0 && (
              <div className="pt-2 border-t">
                <Badge variant="default">
                  {selectedRecipients.length} sélectionné(s)
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contenu de l&apos;email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Selection */}
            <div>
              <Label htmlFor="template">Utiliser un modèle (optionnel)</Label>
              <Select
                value={selectedTemplate}
                onValueChange={handleTemplateSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un modèle..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun modèle</SelectItem>
                  {mockEmailTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div>
              <Label htmlFor="subject">Objet *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet de l'email..."
              />
            </div>

            {/* Body */}
            <div>
              <Label htmlFor="body">Message *</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Votre message ici..."
                rows={12}
              />
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Pièces jointes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFileAttach}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Joindre un fichier
                </Button>
              </div>
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <span className="text-sm">{file}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAttachment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Archive Option */}
            <div className="flex items-center space-x-2 pt-4 border-t">
              <Checkbox
                id="archive"
                checked={saveInArchive}
                onCheckedChange={(checked) =>
                  setSaveInArchive(checked as boolean)
                }
              />
              <Label htmlFor="archive" className="text-sm cursor-pointer">
                Archiver cette communication dans les dossiers concernés
              </Label>
            </div>

            {/* Send Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSubject("");
                  setBody("");
                  setSelectedTemplate("");
                  setAttachments([]);
                  setSelectedRecipients([]);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleSendEmail} disabled={isSending}>
                <Send className="h-4 w-4 mr-2" />
                {isSending ? "Envoi en cours..." : "Envoyer l'email"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
