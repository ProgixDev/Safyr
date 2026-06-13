"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { CompanySearch } from "@/components/ui/company-search";
import { Textarea } from "@/components/ui/textarea";
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
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DirigeantInfo {
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  adresse: string;
  email: string;
  telephone: string;
  fonction: string;
  dateNomination: string;
  numeroSecuriteSociale: string;
}

interface SousTraitant {
  id: string;
  name: string;
  siret: string;
  address: string;
  dirigeant: DirigeantInfo;
  email: string;
  telephone: string;
  capitalSocial: string;
  numeroAutorisation: string;
  dateDebut: string;
  statut: "actif" | "inactif" | "suspendu";
  prochainRenouvellement: string;
}

export default function SousTraitantsPage() {
  const router = useRouter();
  const [sousTraitants, setSousTraitants] = useState<SousTraitant[]>([
    {
      id: "1",
      name: "Gardiennage Plus",
      siret: "12345678901234",
      address: "456 Avenue de la Garde, 69001 Lyon",
      dirigeant: {
        nom: "Martin",
        prenom: "Marie",
        dateNaissance: "1985-03-20",
        lieuNaissance: "Lyon, France",
        nationalite: "Française",
        adresse: "12 Rue de la Paix, 69002 Lyon",
        email: "marie.martin@gardiennage-plus.fr",
        telephone: "06 11 22 33 44",
        fonction: "Gérante",
        dateNomination: "2020-06-01",
        numeroSecuriteSociale: "2 85 03 69 123 456 78",
      },
      email: "contact@gardiennage-plus.fr",
      telephone: "04 78 12 34 56",
      capitalSocial: "25000",
      numeroAutorisation: "AUT-654321-CNAPS",
      dateDebut: "2023-01-15",
      statut: "actif",
      prochainRenouvellement: "2025-06-15",
    },
    {
      id: "2",
      name: "SecuriTech Solutions",
      siret: "98765432109876",
      address: "789 Rue de la Sécurité, 13001 Marseille",
      dirigeant: {
        nom: "Dubois",
        prenom: "Pierre",
        dateNaissance: "1978-11-15",
        lieuNaissance: "Marseille, France",
        nationalite: "Française",
        adresse: "98 Avenue du Prado, 13008 Marseille",
        email: "pierre.dubois@securitech.fr",
        telephone: "06 55 66 77 88",
        fonction: "Président",
        dateNomination: "2019-03-15",
        numeroSecuriteSociale: "1 78 11 13 234 567 89",
      },
      email: "info@securitech.fr",
      telephone: "04 91 23 45 67",
      capitalSocial: "75000",
      numeroAutorisation: "AUT-987654-CNAPS",
      dateDebut: "2022-08-20",
      statut: "actif",
      prochainRenouvellement: "2025-03-20",
    },
    {
      id: "3",
      name: "Protection Services",
      siret: "11223344556677",
      address: "321 Boulevard Sécurité, 33000 Bordeaux",
      dirigeant: {
        nom: "Bernard",
        prenom: "Sophie",
        dateNaissance: "1982-07-10",
        lieuNaissance: "Bordeaux, France",
        nationalite: "Française",
        adresse: "45 Cours de l'Intendance, 33000 Bordeaux",
        email: "sophie.bernard@protection-services.fr",
        telephone: "06 99 88 77 66",
        fonction: "Directrice Générale",
        dateNomination: "2021-01-10",
        numeroSecuriteSociale: "2 82 07 33 345 678 90",
      },
      email: "contact@protection-services.fr",
      telephone: "05 56 78 90 12",
      capitalSocial: "50000",
      numeroAutorisation: "AUT-112233-CNAPS",
      dateDebut: "2023-03-10",
      statut: "suspendu",
      prochainRenouvellement: "2025-01-10",
    },
  ]);

  const [isNewSousTraitantModalOpen, setIsNewSousTraitantModalOpen] =
    useState(false);
  const [newSousTraitant, setNewSousTraitant] = useState<
    Omit<SousTraitant, "id">
  >({
    name: "",
    siret: "",
    address: "",
    dirigeant: {
      nom: "",
      prenom: "",
      dateNaissance: "",
      lieuNaissance: "",
      nationalite: "Française",
      adresse: "",
      email: "",
      telephone: "",
      fonction: "",
      dateNomination: "",
      numeroSecuriteSociale: "",
    },
    email: "",
    telephone: "",
    capitalSocial: "",
    numeroAutorisation: "",
    dateDebut: "",
    statut: "actif",
    prochainRenouvellement: "",
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "actif":
        return "bg-success text-success-foreground";
      case "inactif":
        return "bg-neutral text-neutral-foreground";
      case "suspendu":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-neutral text-neutral-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "actif":
        return "Actif";
      case "inactif":
        return "Inactif";
      case "suspendu":
        return "Suspendu";
      default:
        return "Inconnu";
    }
  };

  const handleRowClick = (sousTraitant: SousTraitant) => {
    router.push(`/dashboard/hr/entreprise/sous-traitants/${sousTraitant.id}`);
  };

  const handleView = (sousTraitant: SousTraitant) => {
    router.push(`/dashboard/hr/entreprise/sous-traitants/${sousTraitant.id}`);
  };

  const handleEdit = (sousTraitant: SousTraitant) => {
    router.push(
      `/dashboard/hr/entreprise/sous-traitants/${sousTraitant.id}?edit=true`,
    );
  };

  const handleDelete = (sousTraitant: SousTraitant) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${sousTraitant.name} ?`)) {
      setSousTraitants((prev) =>
        prev.filter((st) => st.id !== sousTraitant.id),
      );
      console.log("Deleted:", sousTraitant.id);
    }
  };

  const handleNewSousTraitantClick = () => {
    setNewSousTraitant({
      name: "",
      siret: "",
      address: "",
      dirigeant: {
        nom: "",
        prenom: "",
        dateNaissance: "",
        lieuNaissance: "",
        nationalite: "Française",
        adresse: "",
        email: "",
        telephone: "",
        fonction: "",
        dateNomination: "",
        numeroSecuriteSociale: "",
      },
      email: "",
      telephone: "",
      capitalSocial: "",
      numeroAutorisation: "",
      dateDebut: "",
      statut: "actif",
      prochainRenouvellement: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    });
    setIsNewSousTraitantModalOpen(true);
  };

  const handleSaveNewSousTraitant = () => {
    // Here you would typically save to a database
    console.log("Saving new sous-traitant:", newSousTraitant);
    alert("Sous-traitant créé avec succès!");
    setIsNewSousTraitantModalOpen(false);
  };

  const sousTraitantColumns: ColumnDef<SousTraitant>[] = [
    {
      key: "name",
      label: "Entreprise",
      sortable: true,
      render: (st) => (
        <div>
          <p className="font-semibold">{st.name}</p>
          <p className="text-sm text-muted-foreground">{st.address}</p>
        </div>
      ),
    },
    {
      key: "dirigeant",
      label: "Dirigeant",
      sortable: true,
      sortValue: (st) => `${st.dirigeant.prenom} ${st.dirigeant.nom}`,
      render: (st) => `${st.dirigeant.prenom} ${st.dirigeant.nom}`,
    },
    {
      key: "siret",
      label: "SIRET",
      sortable: true,
      render: (st) => <span className="font-mono text-sm">{st.siret}</span>,
    },
    {
      key: "statut",
      label: "Statut",
      sortable: true,
      render: (st) => (
        <Badge className={getStatusColor(st.statut)}>
          {getStatusText(st.statut)}
        </Badge>
      ),
    },
    {
      key: "prochainRenouvellement",
      label: "Prochain renouvellement",
      sortable: true,
      render: (st) =>
        new Date(st.prochainRenouvellement).toLocaleDateString("fr-FR"),
    },
    {
      key: "email",
      label: "Contact",
      render: (st) => (
        <div className="text-sm">
          <p>{st.email}</p>
          <p className="text-muted-foreground">{st.telephone}</p>
        </div>
      ),
    },
  ];

  const totalSousTraitants = sousTraitants.length;
  const actifCount = sousTraitants.filter((st) => st.statut === "actif").length;
  const inactifCount = sousTraitants.filter(
    (st) => st.statut === "inactif",
  ).length;
  const suspenduCount = sousTraitants.filter(
    (st) => st.statut === "suspendu",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sous-traitants</h1>
          <p className="text-muted-foreground">
            Gestion des sous-traitants et de leurs documents administratifs
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={handleNewSousTraitantClick}
        >
          <Plus className="h-4 w-4" />
          Nouveau sous-traitant
        </Button>
      </div>

      {/* Statistics Overview */}
      <InfoCardContainer>
        <InfoCard
          icon={Users}
          title="Total"
          value={totalSousTraitants}
          subtext="sous-traitants"
          color="blue"
        />
        <InfoCard
          icon={CheckCircle2}
          title="Actifs"
          value={actifCount}
          subtext={`${((actifCount / totalSousTraitants) * 100).toFixed(0)}% du total`}
          color="green"
        />
        <InfoCard
          icon={AlertTriangle}
          title="Suspendus"
          value={suspenduCount}
          subtext={suspenduCount > 0 ? "nécessite attention" : "aucun"}
          color="orange"
        />
        <InfoCard
          icon={XCircle}
          title="Inactifs"
          value={inactifCount}
          subtext="archivés"
          color="red"
        />
      </InfoCardContainer>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste des sous-traitants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={sousTraitants}
            columns={sousTraitantColumns}
            searchKeys={["name", "siret"]}
            getSearchValue={(st) =>
              `${st.name} ${st.siret} ${st.dirigeant.prenom} ${st.dirigeant.nom} ${st.email}`
            }
            searchPlaceholder="Rechercher un sous-traitant..."
            itemsPerPage={10}
            onRowClick={handleRowClick}
            getRowId={(st) => st.id}
            actions={(st) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleView(st)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Voir les détails
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(st)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(st)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          />
        </CardContent>
      </Card>

      {/* New Sous-traitant Modal */}
      <Modal
        open={isNewSousTraitantModalOpen}
        onOpenChange={setIsNewSousTraitantModalOpen}
        type="form"
        size="xl"
        title="Nouveau sous-traitant"
        icon={<Plus className="h-5 w-5" />}
        actions={{
          primary: {
            label: "Créer",
            onClick: handleSaveNewSousTraitant,
            disabled:
              !newSousTraitant.name ||
              !newSousTraitant.siret ||
              !newSousTraitant.dirigeant.nom ||
              !newSousTraitant.dirigeant.prenom,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsNewSousTraitantModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-6">
          <h3 className="text-lg font-medium">
            Informations de l&apos;entreprise
          </h3>
          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
            <p className="mb-2 text-sm font-medium">
              Remplissage automatique (annuaire des entreprises)
            </p>
            <CompanySearch
              onSelect={(c) =>
                setNewSousTraitant((prev) => ({
                  ...prev,
                  name: c.name,
                  siret: c.siret,
                  address: c.address,
                }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-name">Nom de l&apos;entreprise *</Label>
                <Input
                  id="new-name"
                  value={newSousTraitant.name}
                  onChange={(e) =>
                    setNewSousTraitant((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Ex: Gardiennage Plus"
                />
              </div>
              <div>
                <Label htmlFor="new-siret">SIRET *</Label>
                <Input
                  id="new-siret"
                  value={newSousTraitant.siret}
                  onChange={(e) =>
                    setNewSousTraitant((prev) => ({
                      ...prev,
                      siret: e.target.value,
                    }))
                  }
                  placeholder="Ex: 12345678901234"
                />
              </div>
              <div>
                <Label htmlFor="new-address">
                  Adresse de l&apos;entreprise
                </Label>
                <Textarea
                  id="new-address"
                  value={newSousTraitant.address}
                  onChange={(e) =>
                    setNewSousTraitant((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder="Ex: 456 Avenue de la Garde, 69001 Lyon"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-capitalSocial">Capital social (€)</Label>
                <Input
                  id="new-capitalSocial"
                  type="number"
                  value={newSousTraitant.capitalSocial}
                  onChange={(e) =>
                    setNewSousTraitant((prev) => ({
                      ...prev,
                      capitalSocial: e.target.value,
                    }))
                  }
                  placeholder="Ex: 25000"
                />
              </div>
              <div>
                <Label htmlFor="new-numeroAutorisation">
                  N° Autorisation CNAPS
                </Label>
                <Input
                  id="new-numeroAutorisation"
                  value={newSousTraitant.numeroAutorisation}
                  onChange={(e) =>
                    setNewSousTraitant((prev) => ({
                      ...prev,
                      numeroAutorisation: e.target.value,
                    }))
                  }
                  placeholder="Ex: AUT-654321-CNAPS"
                />
              </div>
              <div>
                <Label htmlFor="new-email">Email de l&apos;entreprise</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newSousTraitant.email}
                  onChange={(e) =>
                    setNewSousTraitant((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="Ex: contact@gardiennage-plus.fr"
                />
              </div>
              <div>
                <Label htmlFor="new-telephone">
                  Téléphone de l&apos;entreprise
                </Label>
                <Input
                  id="new-telephone"
                  value={newSousTraitant.telephone}
                  onChange={(e) =>
                    setNewSousTraitant((prev) => ({
                      ...prev,
                      telephone: e.target.value,
                    }))
                  }
                  placeholder="Ex: 04 78 12 34 56"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations du dirigeant
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-dirigeant-nom">Nom *</Label>
                  <Input
                    id="new-dirigeant-nom"
                    value={newSousTraitant.dirigeant.nom}
                    onChange={(e) =>
                      setNewSousTraitant((prev) => ({
                        ...prev,
                        dirigeant: { ...prev.dirigeant, nom: e.target.value },
                      }))
                    }
                    placeholder="Ex: Martin"
                  />
                </div>
                <div>
                  <Label htmlFor="new-dirigeant-prenom">Prénom *</Label>
                  <Input
                    id="new-dirigeant-prenom"
                    value={newSousTraitant.dirigeant.prenom}
                    onChange={(e) =>
                      setNewSousTraitant((prev) => ({
                        ...prev,
                        dirigeant: {
                          ...prev.dirigeant,
                          prenom: e.target.value,
                        },
                      }))
                    }
                    placeholder="Ex: Marie"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-dirigeant-fonction">Fonction</Label>
                  <Input
                    id="new-dirigeant-fonction"
                    value={newSousTraitant.dirigeant.fonction}
                    onChange={(e) =>
                      setNewSousTraitant((prev) => ({
                        ...prev,
                        dirigeant: {
                          ...prev.dirigeant,
                          fonction: e.target.value,
                        },
                      }))
                    }
                    placeholder="Ex: Gérante"
                  />
                </div>
                <div>
                  <Label htmlFor="new-dirigeant-date-nomination">
                    Date de nomination
                  </Label>
                  <Input
                    id="new-dirigeant-date-nomination"
                    type="date"
                    value={newSousTraitant.dirigeant.dateNomination}
                    onChange={(e) =>
                      setNewSousTraitant((prev) => ({
                        ...prev,
                        dirigeant: {
                          ...prev.dirigeant,
                          dateNomination: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-dirigeant-date-naissance">
                    Date de naissance
                  </Label>
                  <Input
                    id="new-dirigeant-date-naissance"
                    type="date"
                    value={newSousTraitant.dirigeant.dateNaissance}
                    onChange={(e) =>
                      setNewSousTraitant((prev) => ({
                        ...prev,
                        dirigeant: {
                          ...prev.dirigeant,
                          dateNaissance: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="new-dirigeant-lieu-naissance">
                    Lieu de naissance
                  </Label>
                  <Input
                    id="new-dirigeant-lieu-naissance"
                    value={newSousTraitant.dirigeant.lieuNaissance}
                    onChange={(e) =>
                      setNewSousTraitant((prev) => ({
                        ...prev,
                        dirigeant: {
                          ...prev.dirigeant,
                          lieuNaissance: e.target.value,
                        },
                      }))
                    }
                    placeholder="Ex: Lyon, France"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-dirigeant-nationalite">Nationalité</Label>
                  <Input
                    id="new-dirigeant-nationalite"
                    value={newSousTraitant.dirigeant.nationalite}
                    onChange={(e) =>
                      setNewSousTraitant((prev) => ({
                        ...prev,
                        dirigeant: {
                          ...prev.dirigeant,
                          nationalite: e.target.value,
                        },
                      }))
                    }
                    placeholder="Ex: Française"
                  />
                </div>
                <div>
                  <Label htmlFor="new-dirigeant-secu">
                    Numéro de sécurité sociale
                  </Label>
                  <Input
                    id="new-dirigeant-secu"
                    value={newSousTraitant.dirigeant.numeroSecuriteSociale}
                    onChange={(e) =>
                      setNewSousTraitant((prev) => ({
                        ...prev,
                        dirigeant: {
                          ...prev.dirigeant,
                          numeroSecuriteSociale: e.target.value,
                        },
                      }))
                    }
                    placeholder="Ex: 2 85 03 69 123 456 78"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="new-dirigeant-adresse">
                  Adresse personnelle
                </Label>
                <Textarea
                  id="new-dirigeant-adresse"
                  value={newSousTraitant.dirigeant.adresse}
                  onChange={(e) =>
                    setNewSousTraitant((prev) => ({
                      ...prev,
                      dirigeant: { ...prev.dirigeant, adresse: e.target.value },
                    }))
                  }
                  placeholder="Ex: 12 Rue de la Paix, 69002 Lyon"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-dirigeant-email">Email personnel</Label>
                  <Input
                    id="new-dirigeant-email"
                    type="email"
                    value={newSousTraitant.dirigeant.email}
                    onChange={(e) =>
                      setNewSousTraitant((prev) => ({
                        ...prev,
                        dirigeant: { ...prev.dirigeant, email: e.target.value },
                      }))
                    }
                    placeholder="Ex: marie.martin@email.fr"
                  />
                </div>
                <div>
                  <Label htmlFor="new-dirigeant-telephone">
                    Téléphone personnel
                  </Label>
                  <Input
                    id="new-dirigeant-telephone"
                    value={newSousTraitant.dirigeant.telephone}
                    onChange={(e) =>
                      setNewSousTraitant((prev) => ({
                        ...prev,
                        dirigeant: {
                          ...prev.dirigeant,
                          telephone: e.target.value,
                        },
                      }))
                    }
                    placeholder="Ex: 06 11 22 33 44"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Dates de contrat</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="new-dateDebut">Date de début de contrat</Label>
                <Input
                  id="new-dateDebut"
                  type="date"
                  value={newSousTraitant.dateDebut}
                  onChange={(e) =>
                    setNewSousTraitant((prev) => ({
                      ...prev,
                      dateDebut: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="new-prochainRenouvellement">
                  Prochain renouvellement
                </Label>
                <Input
                  id="new-prochainRenouvellement"
                  type="date"
                  value={newSousTraitant.prochainRenouvellement}
                  onChange={(e) =>
                    setNewSousTraitant((prev) => ({
                      ...prev,
                      prochainRenouvellement: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
