"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/PhoneInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  CheckCircle,
  Calendar,
  AlertTriangle,
  Shield,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Phone,
  Mail,
  Clock,
  Briefcase,
  Award,
  User,
  ArrowRight,
} from "lucide-react";
import { PlanningAgent } from "@/data/planning-agents";
import { usePlanningAgents } from "@/hooks/planning";

export default function PlanningAgentsPage() {
  const searchParams = useSearchParams();

  // Source unique : les dossiers salariés du module RH. La page partait
  // auparavant d'une liste de démonstration, si bien qu'un salarié créé dans
  // les RH n'apparaissait jamais dans le planning.
  const { agents: agentsFromApi, isLoading } = usePlanningAgents();
  const [agents, setAgents] = useState<PlanningAgent[]>([]);
  const [syncedIds, setSyncedIds] = useState<string | null>(null);

  const apiIds = agentsFromApi.map((a) => a.id).join(",");
  if (apiIds !== syncedIds) {
    setSyncedIds(apiIds);
    setAgents(agentsFromApi);
  }
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const showCreateFromUrl = searchParams.get("create") === "true";
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<PlanningAgent | null>(
    null,
  );
  const [agentToDelete, setAgentToDelete] = useState<PlanningAgent | null>(
    null,
  );
  const [formData, setFormData] = useState<
    Omit<Partial<PlanningAgent>, "qualifications"> & {
      qualifications?: string;
      hasCqpAps?: boolean;
      hasSsiap?: boolean;
      ssiapLevel?: "1" | "2" | "3";
      hasSst?: boolean;
      hasProCard?: boolean;
    }
  >({});

  const columns: ColumnDef<PlanningAgent>[] = [
    {
      key: "name",
      label: "Nom",
      sortable: true,
    },
    {
      key: "contractType",
      label: "Type Contrat",
      render: (agent) => (
        <Badge
          variant={
            agent.contractType === "CDI"
              ? "default"
              : agent.contractType === "CDD"
                ? "secondary"
                : "outline"
          }
        >
          {agent.contractType}
        </Badge>
      ),
    },
    {
      key: "contractHours",
      label: "Heures Contrat",
      render: (agent) => `${agent.contractHours}h`,
    },
    {
      key: "availabilityStatus",
      label: "Disponibilité",
      render: (agent) => (
        <Badge
          variant={
            agent.availabilityStatus === "Disponible"
              ? "default"
              : agent.availabilityStatus === "En mission"
                ? "secondary"
                : "outline"
          }
        >
          {agent.availabilityStatus}
        </Badge>
      ),
    },
    {
      key: "weeklyHours",
      label: "Heures Semaine",
      render: (agent) => `${agent.weeklyHours}h`,
    },
    {
      key: "qualifications",
      label: "Qualifications",
      render: (agent) => (
        <div className="flex flex-wrap gap-1">
          {agent.qualifications.slice(0, 2).map((qual, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {qual}
            </Badge>
          ))}
          {agent.qualifications.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{agent.qualifications.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (agent) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleView(agent);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleEditFromDropdown(agent);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(agent);
              }}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleSave = () => {
    // Build qualifications array from toggles
    const qualifications: string[] = [];
    if (formData.hasCqpAps) qualifications.push("CQP APS");
    if (formData.hasSsiap && formData.ssiapLevel) {
      qualifications.push(`SSIAP ${formData.ssiapLevel}`);
    }
    if (formData.hasSst) qualifications.push("SST");
    if (formData.hasProCard) qualifications.push("Carte Professionnelle");

    if (formData.id) {
      // Edit
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { qualifications: _qualifications, ...rest } = formData;
      setAgents(
        agents.map((a) =>
          a.id === formData.id ? { ...a, ...rest, qualifications } : a,
        ),
      );
    } else {
      // Create
      const newAgent: PlanningAgent = {
        id: (agents.length + 1).toString(),
        name: formData.name || "",
        contractType: formData.contractType || "CDI",
        contractHours: formData.contractHours || 35,
        qualifications,
        availabilityStatus: "Disponible",
        weeklyHours: formData.weeklyHours || 35,
        maxAmplitude: formData.maxAmplitude || 12,
        lastActivity: new Date().toISOString().split("T")[0],
        phone: formData.phone || "",
        email: formData.email || "",
      };
      setAgents([...agents, newAgent]);
    }
    setIsCreateModalOpen(false);
    setFormData({});
  };

  const handleView = (agent: PlanningAgent) => {
    setSelectedAgent(agent);
    setIsViewModalOpen(true);
  };

  const openEditModal = (agent: PlanningAgent) => {
    const ssiapQual = agent.qualifications.find((q) => q.includes("SSIAP"));
    setFormData({
      ...agent,
      qualifications: agent.qualifications.join(", "),
      hasCqpAps: agent.qualifications.some((q) => q.includes("CQP APS")),
      hasSsiap: !!ssiapQual,
      ssiapLevel: ssiapQual
        ? (ssiapQual.match(/\d+/)?.[0] as "1" | "2" | "3") || "1"
        : "1",
      hasSst: agent.qualifications.some((q) => q.includes("SST")),
      hasProCard: agent.qualifications.some((q) =>
        q.includes("Carte Professionnelle"),
      ),
    });
    setIsCreateModalOpen(true);
  };

  const handleEditFromDropdown = (agent: PlanningAgent) => {
    setSelectedAgent(agent);
    openEditModal(agent);
  };

  const handleEdit = () => {
    if (selectedAgent) {
      setIsViewModalOpen(false);
      openEditModal(selectedAgent);
    }
  };

  const handleDeleteClick = (agent: PlanningAgent) => {
    setAgentToDelete(agent);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (agentToDelete) {
      setAgents(agents.filter((a) => a.id !== agentToDelete.id));
      setAgentToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Calculate statistics
  const totalAgents = agents.length;
  const availableAgents = agents.filter(
    (a) => a.availabilityStatus === "Disponible",
  ).length;
  const onMission = agents.filter(
    (a) => a.availabilityStatus === "En mission",
  ).length;
  const onLeave = agents.filter((a) => a.availabilityStatus === "Congé").length;
  const cdiAgents = agents.filter((a) => a.contractType === "CDI").length;
  const qualifiedAgents = agents.filter(
    (a) => a.qualifications.length > 0,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Agents</h1>
          <p className="text-muted-foreground">
            Consultation et gestion des fiches agents
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({});
            setIsCreateModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvel Agent
        </Button>
      </div>

      <InfoCardContainer className="lg:grid-cols-3">
        <InfoCard
          icon={Users}
          title="Total Agents"
          value={totalAgents}
          subtext="Agents dans le système"
          color="slate"
        />
        <InfoCard
          icon={CheckCircle}
          title="Agents Disponibles"
          value={availableAgents}
          subtext="Prêts pour affectation"
          color="green"
        />
        <InfoCard
          icon={Calendar}
          title="En Mission"
          value={onMission}
          subtext="Actuellement affectés"
          color="blue"
        />
        <InfoCard
          icon={AlertTriangle}
          title="En Congé"
          value={onLeave}
          subtext="Indisponibles"
          color="orange"
        />
        <InfoCard
          icon={Shield}
          title="Contrats CDI"
          value={cdiAgents}
          subtext={`${((cdiAgents / totalAgents) * 100).toFixed(0)}% du total`}
          color="purple"
        />
        <InfoCard
          icon={CheckCircle}
          title="Qualifiés"
          value={qualifiedAgents}
          subtext="Avec certifications"
          color="teal"
        />
      </InfoCardContainer>

      <DataTable
        data={agents}
        isLoading={isLoading}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Rechercher un agent..."
        onRowClick={handleView}
      />

      {/* Create/Edit Modal */}
      <Modal
        open={showCreateFromUrl || isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            window.history.pushState({}, "", window.location.pathname);
          }
        }}
        type="form"
        title={formData.id ? "Modifier l'agent" : "Nouvel agent"}
        size="lg"
        actions={{
          primary: {
            label: formData.id ? "Enregistrer" : "Créer",
            onClick: handleSave,
            className: formData.id
              ? "bg-cyan-500 hover:bg-cyan-600 text-white"
              : undefined,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="mb-2">
                Nom complet
              </Label>
              <Input
                id="name"
                className="w-full"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <Label htmlFor="contractType" className="mb-2">
                Type de contrat
              </Label>
              <Select
                value={formData.contractType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    contractType: value as "CDI" | "CDD" | "Intérim",
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDI">CDI</SelectItem>
                  <SelectItem value="CDD">CDD</SelectItem>
                  <SelectItem value="Intérim">Intérim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="contractHours" className="mb-2">
                Heures contractuelles
              </Label>
              <Input
                id="contractHours"
                type="text"
                className="w-full"
                value={formData.contractHours || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(",", ".");
                  const parsed = parseFloat(value);
                  setFormData({
                    ...formData,
                    contractHours: isNaN(parsed) ? undefined : parsed,
                  });
                }}
                placeholder="151,67"
              />
            </div>

            <div>
              <Label htmlFor="weeklyHours" className="mb-2">
                Heures hebdomadaires
              </Label>
              <Input
                id="weeklyHours"
                type="text"
                className="w-full"
                value={formData.weeklyHours || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(",", ".");
                  const parsed = parseFloat(value);
                  setFormData({
                    ...formData,
                    weeklyHours: isNaN(parsed) ? undefined : parsed,
                  });
                }}
                placeholder="35"
              />
            </div>

            <div>
              <Label htmlFor="maxAmplitude" className="mb-2">
                Amplitude maximale (h)
              </Label>
              <Input
                id="maxAmplitude"
                type="text"
                className="w-full"
                value={formData.maxAmplitude || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(",", ".");
                  const parsed = parseFloat(value);
                  setFormData({
                    ...formData,
                    maxAmplitude: isNaN(parsed) ? undefined : parsed,
                  });
                }}
                placeholder="12"
              />
            </div>

            {formData.id && (
              <div>
                <Label htmlFor="availabilityStatus" className="mb-2">
                  Disponibilité
                </Label>
                <Select
                  value={formData.availabilityStatus}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      availabilityStatus:
                        value as PlanningAgent["availabilityStatus"],
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponible">Disponible</SelectItem>
                    <SelectItem value="En mission">En mission</SelectItem>
                    <SelectItem value="Congé">Congé</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="phone" className="mb-2">
                Téléphone
              </Label>
              <PhoneInput
                id="phone"
                className="w-full"
                value={formData.phone || ""}
                onChange={(value) => setFormData({ ...formData, phone: value })}
              />
            </div>

            <div>
              <Label htmlFor="email" className="mb-2">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                className="w-full"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="agent@example.com"
              />
            </div>

            <div className="col-span-2">
              <Label className="mb-2">Qualifications</Label>
              <div className="space-y-4 mt-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cqpAps" className="cursor-pointer">
                    CQP APS
                  </Label>
                  <Switch
                    id="cqpAps"
                    checked={formData.hasCqpAps || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, hasCqpAps: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ssiap" className="cursor-pointer">
                      SSIAP
                    </Label>
                    <Switch
                      id="ssiap"
                      checked={formData.hasSsiap || false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, hasSsiap: checked })
                      }
                    />
                  </div>
                  {formData.hasSsiap && (
                    <div className="ml-4">
                      <Select
                        value={formData.ssiapLevel || "1"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            ssiapLevel: value as "1" | "2" | "3",
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Niveau SSIAP" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">SSIAP 1</SelectItem>
                          <SelectItem value="2">SSIAP 2</SelectItem>
                          <SelectItem value="3">SSIAP 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sst" className="cursor-pointer">
                    SST (Sauveteur Secouriste du Travail)
                  </Label>
                  <Switch
                    id="sst"
                    checked={formData.hasSst || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, hasSst: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="proCard" className="cursor-pointer">
                    Carte Professionnelle
                  </Label>
                  <Switch
                    id="proCard"
                    checked={formData.hasProCard || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, hasProCard: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        type="details"
        title="Détails de l'agent"
        size="lg"
        actions={{
          primary: {
            label: "Modifier",
            onClick: handleEdit,
          },
          secondary: {
            label: "Fermer",
            onClick: () => setIsViewModalOpen(false),
          },
        }}
      >
        {selectedAgent && (
          <div className="space-y-6">
            {/* Agent Header */}
            <Link
              href={`/dashboard/hr/employees/${selectedAgent.id}`}
              className="block"
            >
              <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {selectedAgent.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="default" className="text-xs">
                      {selectedAgent.contractType}
                    </Badge>
                    <Badge
                      variant={
                        selectedAgent.availabilityStatus === "Disponible"
                          ? "default"
                          : selectedAgent.availabilityStatus === "En mission"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {selectedAgent.availabilityStatus}
                    </Badge>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Link>

            {/* Contract Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Informations contractuelles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {selectedAgent.contractHours}h
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Heures contractuelles
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {selectedAgent.weeklyHours}h
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Heures hebdomadaires
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {selectedAgent.maxAmplitude}h
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Amplitude maximale
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Coordonnées
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">
                      {selectedAgent.phone}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Téléphone
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">
                      {selectedAgent.email}
                    </div>
                    <div className="text-xs text-muted-foreground">Email</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">
                      {new Date(selectedAgent.lastActivity).toLocaleDateString(
                        "fr-FR",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Dernière activité
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Qualifications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAgent.qualifications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.qualifications.map((qual, idx) => (
                      <Badge key={idx} variant="outline" className="px-3 py-1">
                        <Award className="w-3 h-3 mr-1" />
                        {qual}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    Aucune qualification enregistrée
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        type="warning"
        title="Confirmer la suppression"
        description={`Êtes-vous sûr de vouloir supprimer l'agent ${agentToDelete?.name} ? Cette action est irréversible.`}
        actions={{
          primary: {
            label: "Supprimer",
            onClick: handleDeleteConfirm,
            variant: "destructive",
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsDeleteDialogOpen(false),
            variant: "outline",
          },
        }}
        closable={false}
      >
        <div className="text-sm text-muted-foreground">
          Cette action supprimera définitivement toutes les données associées à
          cet agent.
        </div>
      </Modal>
    </div>
  );
}
