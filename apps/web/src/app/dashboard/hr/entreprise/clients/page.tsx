"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { CompanySearch } from "@/components/ui/company-search";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import {
  Users,
  Plus,
  Building2,
  FileCheck,
  AlertTriangle,
  Gift,
} from "lucide-react";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { ClientContract, ClientGift } from "@/lib/types";
import type { Client } from "@safyr/api-client";
import { useClients, useCreateClient, useDeleteClient } from "@/hooks/clients";

export default function ClientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: clients = [] } = useClients();

  const [contracts] = useState<ClientContract[]>([
    {
      id: "1",
      clientId: "1",
      startDate: new Date("2024-01-15"),
      endDate: new Date("2025-01-15"),
      description: "Contrat de surveillance générale",
      status: "active",
    },
    {
      id: "2",
      clientId: "1",
      startDate: new Date("2023-06-01"),
      endDate: new Date("2024-05-31"),
      description: "Contrat événementiel",
      status: "expired",
    },
    {
      id: "3",
      clientId: "2",
      startDate: new Date("2024-03-01"),
      description: "Contrat de gardiennage permanent",
      status: "active",
    },
  ]);

  const [gifts] = useState<ClientGift[]>([
    {
      id: "1",
      clientId: "1",
      giftDescription: "Panier de Noël",
      date: new Date("2023-12-20"),
      valueHT: 125,
      tva: 25,
      valueTTC: 150,
      notes: "Remis au directeur général",
    },
    {
      id: "2",
      clientId: "2",
      giftDescription: "Bouteille de champagne",
      date: new Date("2024-01-15"),
      valueHT: 67,
      tva: 13,
      valueTTC: 80,
      notes: "Nouvel an - équipe dirigeante",
    },
  ]);

  // Ouvre directement le formulaire quand on arrive depuis l'action rapide
  // "Nouveau client" du tableau de bord (/...?new=1).
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(
    searchParams.get("new") === "1",
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const createClientMutation = useCreateClient();
  const deleteClientMutation = useDeleteClient();

  const [newClient, setNewClient] = useState({
    name: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    contactPerson: "",
    phone: "",
    email: "",
    siret: "",
    numTVA: "",
    sector: "",
  });

  const handleView = (client: Client) => {
    router.push(`/dashboard/hr/entreprise/clients/${client.id}`);
  };

  const handleEdit = (client: Client) => {
    router.push(`/dashboard/hr/entreprise/clients/${client.id}?edit=true`);
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClientMutation.mutateAsync(clientToDelete.id);
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Échec de la suppression : ${message}`);
    }
  };

  const handleNewClient = async () => {
    setFormError(null);

    if (!newClient.name.trim()) {
      setFormError("Le nom du client est obligatoire.");
      return;
    }

    // Le back-end rejette les chaînes vides sur les champs optionnels :
    // on ne transmet que les champs réellement renseignés.
    const payload = Object.fromEntries(
      Object.entries(newClient).filter(([, value]) => value.trim() !== ""),
    ) as typeof newClient;

    try {
      await createClientMutation.mutateAsync(payload);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inconnue";
      setFormError(`Échec de l'enregistrement du client : ${message}`);
      return;
    }
    setIsNewClientModalOpen(false);
    setNewClient({
      name: "",
      address: "",
      city: "",
      postalCode: "",
      country: "",
      contactPerson: "",
      phone: "",
      email: "",
      siret: "",
      numTVA: "",
      sector: "",
    });
  };

  const clientColumns: ColumnDef<Client>[] = [
    {
      key: "name",
      label: "Nom du client",
      icon: Building2,
      defaultVisible: true,
      sortable: true,
    },
    {
      key: "contactPerson",
      label: "Contact",
      icon: Users,
      defaultVisible: true,
      sortable: true,
      render: (client) => client.contactPerson || "-",
    },
    {
      key: "phone",
      label: "Téléphone",
      defaultVisible: true,
      sortable: false,
      render: (client) => client.phone || "-",
    },
    {
      key: "email",
      label: "Email",
      defaultVisible: true,
      sortable: false,
      render: (client) => client.email || "-",
    },
    {
      key: "sector",
      label: "Secteur",
      defaultVisible: true,
      sortable: true,
      render: (client) => client.sector || "-",
    },
    {
      key: "city",
      label: "Ville",
      icon: Building2,
      defaultVisible: false,
      sortable: true,
      render: (client) => client.city || "-",
    },
  ];

  const clientActions = (client: Client) => (
    <RowActionsMenu
      onView={() => handleView(client)}
      onEdit={() => handleEdit(client)}
      onDelete={() => handleDeleteClick(client)}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Gestion des dossiers clients, contrats et suivis cadeaux
          </p>
        </div>
        <Button onClick={() => setIsNewClientModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      <InfoCardContainer>
        <InfoCard
          icon={Users}
          title="Total clients"
          value={clients.length}
          color="gray"
        />
        <InfoCard
          icon={FileCheck}
          title="Contrats actifs"
          value={contracts.filter((c) => c.status === "active").length}
          color="green"
        />
        <InfoCard
          icon={AlertTriangle}
          title="Contrats expirés"
          value={contracts.filter((c) => c.status === "expired").length}
          color="red"
        />
        <InfoCard
          icon={Gift}
          title="Cadeaux cette année"
          value={
            gifts.filter(
              (g) =>
                new Date(g.date).getFullYear() === new Date().getFullYear(),
            ).length
          }
          color="purple"
        />
      </InfoCardContainer>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste des clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={clients}
            columns={clientColumns}
            searchKey="name"
            searchPlaceholder="Rechercher un client..."
            actions={clientActions}
            onRowClick={handleView}
          />
        </CardContent>
      </Card>

      <Modal
        open={isNewClientModalOpen}
        onOpenChange={setIsNewClientModalOpen}
        type="form"
        title="Nouveau client"
        actions={{
          primary: {
            label: createClientMutation.isPending
              ? "Enregistrement…"
              : "Ajouter",
            onClick: handleNewClient,
            disabled: createClientMutation.isPending,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsNewClientModalOpen(false),
            variant: "outline" as const,
          },
        }}
      >
        <div className="space-y-4">
          {formError && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </p>
          )}
          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
            <p className="mb-2 text-sm font-medium">
              Remplissage automatique (annuaire des entreprises)
            </p>
            <CompanySearch
              onSelect={(c) =>
                setNewClient((prev) => ({
                  ...prev,
                  name: c.name,
                  siret: c.siret,
                  numTVA: c.tva,
                  address: c.address,
                  city: c.city,
                  postalCode: c.postalCode,
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="name">Nom du client</Label>
            <Input
              id="name"
              value={newClient.name}
              onChange={(e) =>
                setNewClient({ ...newClient, name: e.target.value })
              }
              placeholder="Nom de l'entreprise"
            />
          </div>
          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={newClient.address}
              onChange={(e) =>
                setNewClient({ ...newClient, address: e.target.value })
              }
              placeholder="Adresse de l'entreprise"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={newClient.city}
                onChange={(e) =>
                  setNewClient({ ...newClient, city: e.target.value })
                }
                placeholder="Ville"
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Code postal</Label>
              <Input
                id="postalCode"
                value={newClient.postalCode}
                onChange={(e) =>
                  setNewClient({ ...newClient, postalCode: e.target.value })
                }
                placeholder="Code postal"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="country">Pays</Label>
            <Input
              id="country"
              value={newClient.country}
              onChange={(e) =>
                setNewClient({ ...newClient, country: e.target.value })
              }
              placeholder="Pays"
            />
          </div>
          <div>
            <Label htmlFor="contactPerson">Personne de contact</Label>
            <Input
              id="contactPerson"
              value={newClient.contactPerson}
              onChange={(e) =>
                setNewClient({ ...newClient, contactPerson: e.target.value })
              }
              placeholder="Nom de la personne de contact"
            />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={newClient.phone}
              onChange={(e) =>
                setNewClient({ ...newClient, phone: e.target.value })
              }
              placeholder="Numéro de téléphone"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={newClient.email}
              onChange={(e) =>
                setNewClient({ ...newClient, email: e.target.value })
              }
              placeholder="Adresse email"
            />
          </div>
          <div>
            <Label htmlFor="siret">SIRET</Label>
            <Input
              id="siret"
              value={newClient.siret}
              onChange={(e) =>
                setNewClient({ ...newClient, siret: e.target.value })
              }
              placeholder="Numéro SIRET"
            />
          </div>
          <div>
            <Label htmlFor="numTVA">Num TVA</Label>
            <Input
              id="numTVA"
              value={newClient.numTVA}
              onChange={(e) =>
                setNewClient({ ...newClient, numTVA: e.target.value })
              }
              placeholder="Numéro TVA"
            />
          </div>
          <div>
            <Label htmlFor="sector">Secteur</Label>
            <Input
              id="sector"
              value={newClient.sector}
              onChange={(e) =>
                setNewClient({ ...newClient, sector: e.target.value })
              }
              placeholder="Secteur d'activité"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        type="confirmation"
        title="Supprimer le client"
        actions={{
          primary: {
            label: "Supprimer",
            onClick: handleDeleteConfirm,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsDeleteModalOpen(false),
            variant: "outline" as const,
          },
        }}
      >
        <p>
          Êtes-vous sûr de vouloir supprimer le client{" "}
          <span className="font-semibold">{clientToDelete?.name}</span> ? Cette
          action est irréversible.
        </p>
      </Modal>
    </div>
  );
}
