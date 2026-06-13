"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Edit3,
  Eye,
  Trash2,
  MoreVertical,
  Building2,
  FileCheck,
  AlertTriangle,
  Gift,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Client, ClientContract, ClientGift } from "@/lib/types";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([
    {
      id: "1",
      name: "Société ABC Industries",
      address: "123 Rue de l'Industrie",
      city: "Paris",
      postalCode: "75001",
      country: "France",
      contactPerson: "Jean Dupont",
      phone: "01 23 45 67 89",
      email: "contact@abcindustries.fr",
      siret: "12345678901234",
      numTVA: "FR12345678901",
      sector: "Industrie",
      dirigeant: {
        nom: "Dupont",
        prenom: "Jean",
        dateNaissance: "1975-05-15",
        lieuNaissance: "Paris, France",
        nationalite: "Française",
        adresse: "15 Avenue Victor Hugo, 75016 Paris",
        email: "jean.dupont@abcindustries.fr",
        telephone: "06 12 34 56 78",
        fonction: "PDG",
        dateNomination: "2010-03-01",
        numeroSecuriteSociale: "1 75 05 75 123 456 78",
      },
      contracts: [],
      gifts: [],
    },
    {
      id: "2",
      name: "Entreprise XYZ Services",
      address: "456 Avenue des Services",
      city: "Lyon",
      postalCode: "69000",
      country: "France",
      contactPerson: "Marie Martin",
      phone: "04 56 78 90 12",
      email: "contact@xyzservices.fr",
      siret: "56789012345678",
      numTVA: "FR98765432109",
      sector: "Services",
      dirigeant: {
        nom: "Martin",
        prenom: "Marie",
        dateNaissance: "1980-08-22",
        lieuNaissance: "Lyon, France",
        nationalite: "Française",
        adresse: "78 Cours Gambetta, 69003 Lyon",
        email: "marie.martin@xyzservices.fr",
        telephone: "06 98 76 54 32",
        fonction: "Directrice Générale",
        dateNomination: "2015-06-15",
        numeroSecuriteSociale: "2 80 08 69 234 567 89",
      },
      contracts: [],
      gifts: [],
    },
    {
      id: "3",
      name: "Groupe DEF Solutions",
      address: "789 Boulevard des Solutions",
      city: "Marseille",
      postalCode: "13000",
      country: "France",
      contactPerson: "Pierre Durand",
      phone: "04 91 23 45 67",
      email: "contact@defsolutions.fr",
      siret: "90123456789012",
      numTVA: "FR11223344556",
      sector: "Technologie",
      dirigeant: {
        nom: "Durand",
        prenom: "Pierre",
        dateNaissance: "1972-11-30",
        lieuNaissance: "Marseille, France",
        nationalite: "Française",
        adresse: "23 Rue Paradis, 13001 Marseille",
        email: "pierre.durand@defsolutions.fr",
        telephone: "06 45 67 89 01",
        fonction: "Président",
        dateNomination: "2012-09-01",
        numeroSecuriteSociale: "1 72 11 13 345 678 90",
      },
      contracts: [],
      gifts: [],
    },
  ]);

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

  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

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

  const handleDeleteConfirm = () => {
    if (clientToDelete) {
      setClients(clients.filter((c) => c.id !== clientToDelete.id));
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
    }
  };

  const handleNewClient = () => {
    console.log("Nouveau client:", newClient);
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleView(client)}>
          <Eye className="mr-2 h-4 w-4" />
          Voir
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEdit(client)}>
          <Edit3 className="mr-2 h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleDeleteClick(client)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
            rowClassName={() =>
              "cursor-pointer transition-colors hover:bg-accent"
            }
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
            label: "Ajouter",
            onClick: handleNewClient,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsNewClientModalOpen(false),
            variant: "outline" as const,
          },
        }}
      >
        <div className="space-y-4">
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
