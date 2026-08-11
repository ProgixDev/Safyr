"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
import {
  Briefcase,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ShieldCheck,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Moon,
  RotateCcw,
  MapPin,
  ClipboardList,
  Wrench,
  Phone,
  CalendarClock,
  ChevronRight,
} from "lucide-react";
import type { Poste, PosteType } from "@/lib/types";
import { usePlanningSites } from "@/hooks/planning";
import {
  useCreateSitePost,
  useUpdateSitePost,
  useDeleteSitePost,
} from "@/hooks/sites";
import type { CertificationCode, PostDetails } from "@safyr/api-client";
import { SITE_COLOR_MAP } from "@/lib/site-colors";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  BREAK_DURATION_OPTIONS,
  SHIFT_DURATION_OPTIONS,
  EQUIPMENT_OPTIONS,
} from "@/lib/planning-constants";

const POSTE_TYPE_LABELS: Record<string, string> = {
  agent_securite: "Agent de Sécurité",
  ssiap1: "SSIAP 1",
  ssiap2: "SSIAP 2",
  ssiap3: "SSIAP 3",
  operateur_video: "Opérateur Vidéo",
  accueil: "Accueil",
  manager: "Manager",
  rh: "RH",
  comptable: "Comptable",
  rondier: "Rondier",
  agent_cynophile: "Agent Cynophile",
  chef_de_poste: "Chef de Poste",
  di: "DI",
  autres: "Autres",
};

/**
 * Correspondance entre les libelles affiches et les codes attendus par l'API.
 * Un libelle sans code (« Autres ») est conserve comme qualification libre.
 */
const CODES_CERTIFICATION: Record<string, CertificationCode> = {
  "CQP/APS": "CQP_APS",
  "CQP APS": "CQP_APS",
  "Carte Pro": "CNAPS",
  "Carte Professionnelle": "CNAPS",
  "SSIAP 1": "SSIAP1",
  "SSIAP 2": "SSIAP2",
  "SSIAP 3": "SSIAP3",
  SST: "SST",
  H0B0: "H0B0",
  "Visite médicale": "VM",
  Incendie: "FIRE",
};

const SAUT_DE_LIGNE = /\r?\n/;

const CERTIFICATIONS_OPTIONS = [
  "CQP/APS",
  "Carte Pro",
  "SSIAP 1",
  "SSIAP 2",
  "SSIAP 3",
  "SST",
  "H0B0",
  "Autres",
];

type PosteFormValues = {
  name: string;
  type: PosteType;
  description: string;
  requiredCertifications: string[];
  requiredQualifications: string[];
  defaultShiftDuration: number;
  breakDuration: number;
  nightShift: boolean;
  weekendWork: boolean;
  rotatingShift: boolean;
  minAgents: number;
  maxAgents: number;
  duties: string;
  procedures: string;
  equipment: string[];
  emergencyContactMode: "site" | "client" | "manual";
  emergencyContactName: string;
  emergencyContactPhone: string;
  status: "active" | "inactive";
  priority: "low" | "medium" | "high" | "critical";
  vacationStart: string;
  vacationEnd: string;
};

const DEFAULT_FORM: PosteFormValues = {
  name: "",
  type: "agent_securite" as PosteType,
  description: "",
  requiredCertifications: [],
  requiredQualifications: [],
  defaultShiftDuration: 8,
  breakDuration: 0,
  nightShift: false,
  weekendWork: false,
  rotatingShift: false,
  minAgents: 1,
  maxAgents: 1,
  duties: "",
  procedures: "",
  equipment: [],
  emergencyContactMode: "manual" as const,
  emergencyContactName: "",
  emergencyContactPhone: "",
  status: "active",
  priority: "medium",
  vacationStart: "08:00",
  vacationEnd: "16:00",
};

export default function PostesPage() {
  const {
    sites: mockSites,
    postes: mockPostes,
    clients: mockClients,
  } = usePlanningSites();

  const searchParams = useSearchParams();

  // Les postes arrivent de l'API : `useState` ne lit sa valeur initiale qu'une
  // fois, la liste serait donc restee vide. On la resynchronise pendant le
  // rendu des que la source change.
  const [postes, setPostes] = useState<Poste[]>([]);
  const [postesCharges, setPostesCharges] = useState<string | null>(null);
  const clePostes = mockPostes
    .map((p) => `${p.id}:${p.updatedAt?.getTime?.() ?? ""}`)
    .join(",");
  if (clePostes !== postesCharges) {
    setPostesCharges(clePostes);
    setPostes(mockPostes);
  }
  const creerPoste = useCreateSitePost();
  const modifierPoste = useUpdateSitePost();
  const supprimerPoste = useDeleteSitePost();
  const [erreurEnregistrement, setErreurEnregistrement] = useState<
    string | null
  >(null);
  const [selectedPoste, setSelectedPoste] = useState<Poste | null>(null);
  const [posteToDelete, setPosteToDelete] = useState<Poste | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [createSiteId, setCreateSiteId] = useState<string>("");
  const showCreateFromUrl = searchParams.get("create") === "true";

  const form = useForm({ defaultValues: DEFAULT_FORM });

  const activeSiteId = isEditModalOpen
    ? (selectedPoste?.siteId ?? createSiteId)
    : createSiteId;
  const activeSite = mockSites.find((s) => s.id === activeSiteId);
  const activeClient = activeSite
    ? mockClients.find((c) => c.id === activeSite.clientId)
    : undefined;

  const totalPostes = postes.length;
  const activePostes = postes.filter((p) => p.status === "active").length;
  const criticalPostes = postes.filter((p) => p.priority === "critical").length;
  const nightShiftPostes = postes.filter((p) => p.schedule.nightShift).length;

  const getStatusBadge = (status: Poste["status"]) =>
    status === "active" ? (
      <Badge variant="default">Actif</Badge>
    ) : (
      <Badge variant="secondary">Inactif</Badge>
    );

  const getPriorityBadge = (priority: Poste["priority"]) => {
    const map = {
      low: { variant: "secondary" as const, label: "Faible" },
      medium: { variant: "outline" as const, label: "Moyen" },
      high: { variant: "default" as const, label: "Élevé" },
      critical: { variant: "destructive" as const, label: "Critique" },
    };
    const c = map[priority] ?? map.medium;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getSiteById = (siteId: string) =>
    mockSites.find((s) => s.id === siteId);
  const getSiteNameById = (siteId: string) =>
    getSiteById(siteId)?.name ?? siteId;

  const columns: ColumnDef<Poste>[] = [
    {
      key: "name",
      label: "Poste",
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-medium text-sm">{p.name}</p>
          <p className="text-xs text-muted-foreground">
            {POSTE_TYPE_LABELS[p.type]}
          </p>
        </div>
      ),
    },
    {
      key: "priority",
      label: "Priorité",
      render: (p) => getPriorityBadge(p.priority),
    },
    {
      key: "status",
      label: "Statut",
      render: (p) => getStatusBadge(p.status),
    },
    {
      key: "capacity",
      label: "Capacité",
      render: (p) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span>
            {p.capacity.currentAgents ?? 0}/{p.capacity.maxAgents}
          </span>
        </div>
      ),
    },
    {
      key: "schedule",
      label: "Planning",
      render: (p) => (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {p.schedule.defaultShiftDuration}h
          </div>
          {p.schedule.nightShift && (
            <Moon className="h-3.5 w-3.5 text-indigo-500" />
          )}
          {p.schedule.rotatingShift && (
            <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
          )}
        </div>
      ),
    },
    {
      key: "requirements",
      label: "Certifications",
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.requirements.requiredCertifications.slice(0, 2).map((c) => (
            <Badge key={c} variant="outline" className="text-xs">
              {c}
            </Badge>
          ))}
          {p.requirements.requiredCertifications.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{p.requirements.requiredCertifications.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (s) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(s)}>
                <Eye className="h-4 w-4 mr-2" /> Voir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(s)}>
                <Pencil className="h-4 w-4 mr-2" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteClick(s)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const handleView = (p: Poste) => {
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedPoste(p);
    setIsViewModalOpen(true);
  };

  const handleEdit = (p: Poste) => {
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedPoste(p);
    form.reset({
      name: p.name,
      type: p.type,
      description: p.description ?? "",
      requiredCertifications: p.requirements.requiredCertifications,
      requiredQualifications: p.requirements.requiredQualifications ?? [],
      defaultShiftDuration: p.schedule.defaultShiftDuration,
      breakDuration: p.schedule.breakDuration ?? 0,
      nightShift: p.schedule.nightShift,
      weekendWork: p.schedule.weekendWork,
      rotatingShift: p.schedule.rotatingShift,
      minAgents: p.capacity.minAgents,
      maxAgents: p.capacity.maxAgents,
      duties: p.instructions?.duties.join("\n") ?? "",
      procedures: p.instructions?.procedures ?? "",
      equipment: p.instructions?.equipment ?? [],
      ...(() => {
        const existing = p.instructions?.emergencyContact ?? "";
        const pSite = mockSites.find((s) => s.id === p.siteId);
        const pClient = pSite
          ? mockClients.find((c) => c.id === pSite.clientId)
          : undefined;
        const siteStr = pSite
          ? `${pSite.contact.name} — ${pSite.contact.phone}`
          : null;
        const clientStr = pClient?.contactPerson
          ? `${pClient.contactPerson} — ${pClient.phone ?? ""}`
          : null;
        if (siteStr && existing === siteStr)
          return {
            emergencyContactMode: "site" as const,
            emergencyContactName: "",
            emergencyContactPhone: "",
          };
        if (clientStr && existing === clientStr)
          return {
            emergencyContactMode: "client" as const,
            emergencyContactName: "",
            emergencyContactPhone: "",
          };
        const parts = existing.split(" — ");
        return {
          emergencyContactMode: "manual" as const,
          emergencyContactName:
            parts.length >= 2 ? parts.slice(0, -1).join(" — ") : "",
          emergencyContactPhone:
            parts.length >= 2 ? parts[parts.length - 1] : existing,
        };
      })(),
      status: p.status,
      priority: p.priority,
      vacationStart:
        ((p.schedule as Record<string, unknown>).vacationStart as string) ??
        "08:00",
      vacationEnd:
        ((p.schedule as Record<string, unknown>).vacationEnd as string) ??
        "16:00",
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (p: Poste) => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setPosteToDelete(p);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!posteToDelete) return;
    setErreurEnregistrement(null);
    try {
      await supprimerPoste.mutateAsync({
        siteId: posteToDelete.siteId,
        postId: posteToDelete.id,
      });
      setIsDeleteModalOpen(false);
      setPosteToDelete(null);
    } catch (e) {
      setErreurEnregistrement(
        e instanceof Error ? e.message : "La suppression a échoué.",
      );
    }
  };

  const handleOpenCreate = () => {
    form.reset();
    setCreateSiteId(mockSites[0]?.id ?? "");
    setIsCreateModalOpen(true);
  };

  const resolveEmergencyContact = (
    values: PosteFormValues,
    siteId: string,
  ): string | undefined => {
    if (values.emergencyContactMode === "site") {
      const s = mockSites.find((x) => x.id === siteId);
      return s ? `${s.contact.name} — ${s.contact.phone}` : undefined;
    }
    if (values.emergencyContactMode === "client") {
      const s = mockSites.find((x) => x.id === siteId);
      const c = s ? mockClients.find((x) => x.id === s.clientId) : undefined;
      return c?.contactPerson
        ? `${c.contactPerson} — ${c.phone ?? ""}`
        : undefined;
    }
    if (values.emergencyContactName || values.emergencyContactPhone) {
      return values.emergencyContactName
        ? `${values.emergencyContactName} — ${values.emergencyContactPhone}`
        : values.emergencyContactPhone;
    }
    return undefined;
  };

  /** Decoupe un champ multi-lignes en liste de consignes. */
  const decouperLignes = (valeur: string): string[] =>
    valeur ? valeur.split(SAUT_DE_LIGNE).filter(Boolean) : [];

  /** Traduit le formulaire en charge utile API (colonnes + details JSON). */
  const construirePayload = (values: PosteFormValues, siteId: string) => {
    const codes: CertificationCode[] = [];
    const qualificationsLibres = [...values.requiredQualifications];
    for (const libelle of values.requiredCertifications) {
      const code = CODES_CERTIFICATION[libelle];
      if (code) codes.push(code);
      else if (!qualificationsLibres.includes(libelle))
        qualificationsLibres.push(libelle);
    }

    const details: PostDetails = {
      type: values.type,
      requiredQualifications: qualificationsLibres,
      defaultShiftDuration: values.defaultShiftDuration,
      breakDuration: values.breakDuration,
      nightShift: values.nightShift,
      weekendWork: values.weekendWork,
      rotatingShift: values.rotatingShift,
      minAgents: values.minAgents,
      maxAgents: values.maxAgents,
      duties: decouperLignes(values.duties),
      procedures: values.procedures || undefined,
      equipment: values.equipment,
      emergencyContactMode: values.emergencyContactMode,
      emergencyContactName:
        resolveEmergencyContact(values, siteId)?.split(" — ")[0] || undefined,
      emergencyContactPhone: values.emergencyContactPhone || undefined,
      priority: values.priority,
    };

    return {
      name: values.name,
      description: values.description || undefined,
      requiredCertifications: codes,
      defaultStartTime: values.vacationStart || undefined,
      defaultEndTime: values.vacationEnd || undefined,
      active: values.status === "active",
      details,
    };
  };

  const handleSave = async (isEdit: boolean) => {
    const values = form.state.values;
    setErreurEnregistrement(null);
    try {
      if (isEdit && selectedPoste) {
        await modifierPoste.mutateAsync({
          siteId: selectedPoste.siteId,
          postId: selectedPoste.id,
          data: construirePayload(values, selectedPoste.siteId),
        });
        setIsEditModalOpen(false);
      } else {
        if (!createSiteId) {
          setErreurEnregistrement("Sélectionnez un site pour ce poste.");
          return;
        }
        await creerPoste.mutateAsync({
          siteId: createSiteId,
          data: construirePayload(values, createSiteId),
        });
        setIsCreateModalOpen(false);
      }
    } catch (e) {
      setErreurEnregistrement(
        e instanceof Error ? e.message : "L'enregistrement a échoué.",
      );
    }
  };

  const messageErreur = erreurEnregistrement ? (
    <p className="mb-4 text-sm text-red-500">{erreurEnregistrement}</p>
  ) : null;

  const posteForm = (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="general" className="gap-2">
          <Briefcase className="h-4 w-4" />
          Général
        </TabsTrigger>
        <TabsTrigger value="planning" className="gap-2">
          <CalendarClock className="h-4 w-4" />
          Planning
        </TabsTrigger>
        <TabsTrigger value="instructions" className="gap-2">
          <ClipboardList className="h-4 w-4" />
          Instructions
        </TabsTrigger>
      </TabsList>

      {/* ── General ── */}
      <TabsContent value="general" className="space-y-5 mt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2">
            <Label className="text-base font-semibold">Nom du poste</Label>
            <form.Field name="name">
              {(field) => (
                <Input
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Ex: Agent de surveillance principale"
                  className="text-base"
                />
              )}
            </form.Field>
          </div>

          <div className="space-y-1.5">
            <Label className="text-base font-semibold">Type de poste</Label>
            <form.Field name="type">
              {(field) => (
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as PosteType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(POSTE_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </form.Field>
          </div>

          <div className="space-y-1.5">
            <Label className="text-base font-semibold">Priorité</Label>
            <form.Field name="priority">
              {(field) => (
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      { value: "low", label: "Faible", color: "bg-slate-500" },
                      { value: "medium", label: "Moyen", color: "bg-blue-500" },
                      { value: "high", label: "Élevé", color: "bg-amber-500" },
                      {
                        value: "critical",
                        label: "Critique",
                        color: "bg-red-500",
                      },
                    ] as {
                      value: Poste["priority"];
                      label: string;
                      color: string;
                    }[]
                  ).map(({ value, label, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field.handleChange(value)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                        field.state.value === value
                          ? "border-foreground shadow-sm"
                          : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full ${color}`} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

          <div className="space-y-1.5 col-span-2">
            <Label className="text-base font-semibold">Description</Label>
            <form.Field name="description">
              {(field) => (
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Description du poste..."
                  rows={3}
                />
              )}
            </form.Field>
          </div>

          <div className="space-y-1.5">
            <Label className="text-base font-semibold">Statut</Label>
            <form.Field name="status">
              {(field) => (
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "active", label: "Actif" },
                      { value: "inactive", label: "Inactif" },
                    ] as { value: "active" | "inactive"; label: string }[]
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field.handleChange(value)}
                      className={`p-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        field.state.value === value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </form.Field>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Certifications requises
          </Label>
          <form.Field name="requiredCertifications">
            {(field) => (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between font-normal h-9"
                    >
                      <span className="text-muted-foreground">
                        {field.state.value.length === 0
                          ? "Sélectionner des certifications"
                          : `${field.state.value.length} sélectionnée${field.state.value.length > 1 ? "s" : ""}`}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-2"
                    align="start"
                  >
                    <div className="space-y-1">
                      {CERTIFICATIONS_OPTIONS.map((cert) => (
                        <label
                          key={cert}
                          className="flex items-center gap-2 rounded px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                        >
                          <Checkbox
                            checked={field.state.value.includes(cert)}
                            onCheckedChange={(checked) =>
                              field.handleChange(
                                checked
                                  ? [...field.state.value, cert]
                                  : field.state.value.filter((c) => c !== cert),
                              )
                            }
                          />
                          {cert}
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {field.state.value.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {field.state.value.map((c) => (
                      <Badge key={c} variant="outline" className="gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )}
          </form.Field>
          <form.Field name="requiredQualifications">
            {(field) => (
              <Input
                value={(field.state.value ?? []).join(", ")}
                onChange={(e) =>
                  field.handleChange(
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                onBlur={field.handleBlur}
                placeholder="Qualifications — Ex: Permis B, Habilitation électrique"
              />
            )}
          </form.Field>
        </div>
      </TabsContent>

      {/* ── Planning ── */}
      <TabsContent value="planning" className="space-y-5 mt-0">
        <div>
          <Label className="text-base font-semibold mb-3 block">
            Durée de vacation
          </Label>
          <form.Field name="defaultShiftDuration">
            {(field) => (
              <Select
                value={String(field.state.value)}
                onValueChange={(v) => field.handleChange(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_DURATION_OPTIONS.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {h}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </form.Field>
        </div>

        <div>
          <Label className="text-base font-semibold mb-3 block">
            Durée de pause
          </Label>
          <form.Field name="breakDuration">
            {(field) => (
              <Select
                value={String(field.state.value ?? 0)}
                onValueChange={(v) => field.handleChange(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BREAK_DURATION_OPTIONS.map((min) => (
                    <SelectItem key={min} value={String(min)}>
                      {min === 0 ? "Aucune" : `${min} min`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </form.Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm">Début de vacation</Label>
            <form.Field name="vacationStart">
              {(field) => (
                <Input
                  type="time"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>
          </div>
          <div>
            <Label className="text-sm">Fin de vacation</Label>
            <form.Field name="vacationEnd">
              {(field) => (
                <Input
                  type="time"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            </form.Field>
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-base font-semibold mb-3 block">
            Capacité agents
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Minimum requis</Label>
              <form.Field name="minAgents">
                {(field) => (
                  <Input
                    type="number"
                    min={1}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    onBlur={field.handleBlur}
                    className="text-base"
                  />
                )}
              </form.Field>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Maximum autorisé</Label>
              <form.Field name="maxAgents">
                {(field) => (
                  <Input
                    type="number"
                    min={1}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    onBlur={field.handleBlur}
                    className="text-base"
                  />
                )}
              </form.Field>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-base font-semibold mb-3 block">
            Contraintes horaires
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                key: "nightShift" as const,
                label: "Shift de nuit",
                icon: Moon,
              },
              { key: "weekendWork" as const, label: "Week-end", icon: Users },
              {
                key: "rotatingShift" as const,
                label: "Tournant",
                icon: RotateCcw,
              },
            ].map(({ key, label, icon: Icon }) => (
              <form.Field key={key} name={key}>
                {(field) => (
                  <button
                    type="button"
                    onClick={() => field.handleChange(!field.state.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      field.state.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${field.state.value ? "text-primary" : "text-muted-foreground"}`}
                    />
                    {label}
                  </button>
                )}
              </form.Field>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* ── Instructions ── */}
      <TabsContent value="instructions" className="space-y-5 mt-0">
        <div className="space-y-1.5">
          <Label className="text-base font-semibold">Tâches & missions</Label>
          <form.Field name="duties">
            {(field) => (
              <>
                <Textarea
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Une tâche par ligne..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Une tâche par ligne
                </p>
              </>
            )}
          </form.Field>
        </div>

        <div className="space-y-1.5">
          <Label className="text-base font-semibold">
            Équipements nécessaires
          </Label>
          <form.Field name="equipment">
            {(field) => (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      <span className="text-muted-foreground">
                        {field.state.value.length === 0
                          ? "Sélectionner des équipements"
                          : `${field.state.value.length} sélectionné(s)`}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1">
                      {EQUIPMENT_OPTIONS.map((eq) => (
                        <label
                          key={eq}
                          className="flex items-center gap-2 rounded px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                        >
                          <Checkbox
                            checked={field.state.value.includes(eq)}
                            onCheckedChange={(checked) =>
                              field.handleChange(
                                checked
                                  ? [...field.state.value, eq]
                                  : field.state.value.filter((e) => e !== eq),
                              )
                            }
                          />
                          {eq}
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {field.state.value.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {field.state.value.map((eq) => (
                      <Badge
                        key={eq}
                        variant="outline"
                        className="gap-1 text-xs"
                      >
                        <Wrench className="h-3 w-3" />
                        {eq}
                      </Badge>
                    ))}
                  </div>
                )}
              </>
            )}
          </form.Field>
        </div>

        <div className="space-y-1.5">
          <Label className="text-base font-semibold">
            Procédures spécifiques
          </Label>
          <form.Field name="procedures">
            {(field) => (
              <Textarea
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Procédures à suivre en cas d'incident..."
                rows={4}
              />
            )}
          </form.Field>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-semibold">
            Contact d&apos;urgence
          </Label>
          <form.Field name="emergencyContactMode">
            {(modeField) => (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "site", label: "Contact site" },
                      { value: "client", label: "Contact client" },
                      { value: "manual", label: "Manuel" },
                    ] as {
                      value: "site" | "client" | "manual";
                      label: string;
                    }[]
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => modeField.handleChange(value)}
                      className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                        modeField.state.value === value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {modeField.state.value === "site" &&
                  (activeSite ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">
                          {activeSite.contact.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activeSite.contact.phone}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Aucun site sélectionné
                    </p>
                  ))}

                {modeField.state.value === "client" &&
                  (activeClient?.contactPerson ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">
                          {activeClient.contactPerson}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activeClient.phone ?? "—"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Aucun contact client disponible
                    </p>
                  ))}

                {modeField.state.value === "manual" && (
                  <div className="space-y-2">
                    <form.Field name="emergencyContactName">
                      {(nameField) => (
                        <Input
                          value={nameField.state.value}
                          onChange={(e) =>
                            nameField.handleChange(e.target.value)
                          }
                          onBlur={nameField.handleBlur}
                          placeholder="Nom du contact"
                        />
                      )}
                    </form.Field>
                    <form.Field name="emergencyContactPhone">
                      {(phoneField) => (
                        <PhoneInput
                          value={phoneField.state.value}
                          onChange={(v) => phoneField.handleChange(v)}
                          placeholder="6 12 34 56 78"
                        />
                      )}
                    </form.Field>
                  </div>
                )}
              </div>
            )}
          </form.Field>
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-serif text-3xl font-light tracking-tight">
              Gestion des Postes
            </h1>
            <p className="mt-1 text-sm font-light text-muted-foreground">
              Création et gestion des différents postes de sécurité
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau poste
        </Button>
      </div>

      {/* Stats */}
      <InfoCardContainer>
        <InfoCard
          icon={Briefcase}
          title="Total postes"
          value={totalPostes}
          color="blue"
        />
        <InfoCard
          icon={CheckCircle}
          title="Postes actifs"
          value={activePostes}
          subtext={`${totalPostes - activePostes} inactif(s)`}
          color="green"
        />
        <InfoCard
          icon={AlertCircle}
          title="Priorité critique"
          value={criticalPostes}
          color="red"
        />
        <InfoCard
          icon={Moon}
          title="Shifts de nuit"
          value={nightShiftPostes}
          color="indigo"
        />
      </InfoCardContainer>

      {/* Table */}
      <DataTable
        data={postes}
        columns={columns}
        searchKeys={["name", "type", "siteId"] as (keyof Poste)[]}
        getSearchValue={(p) =>
          `${p.name} ${POSTE_TYPE_LABELS[p.type]} ${getSiteNameById(p.siteId)}`
        }
        searchPlaceholder="Rechercher un poste..."
        filters={[
          {
            key: "status",
            label: "Statut",
            options: [
              { value: "active", label: "Actif" },
              { value: "inactive", label: "Inactif" },
            ],
          },
          {
            key: "type",
            label: "Type",
            options: (Object.keys(POSTE_TYPE_LABELS) as PosteType[]).map(
              (t) => ({ value: t, label: POSTE_TYPE_LABELS[t] }),
            ),
          },
        ]}
        groupBy="siteId"
        groupByLabel={(v) => {
          const site = getSiteById(v as string);
          const color = site?.color ?? "blue";
          const cls = SITE_COLOR_MAP[color as keyof typeof SITE_COLOR_MAP];
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold text-white ${cls.bg}`}
            >
              <MapPin className="h-3.5 w-3.5" />
              {getSiteNameById(v as string)}
            </span>
          );
        }}
        groupByRowClassName={() => ""}
        groupByOptions={mockSites.map((s) => ({ value: s.id, label: s.name }))}
        getRowId={(p) => p.id}
        onRowClick={handleView}
        itemsPerPage={20}
      />

      {/* Create Modal */}
      <Modal
        open={showCreateFromUrl || isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            window.history.pushState({}, "", window.location.pathname);
          }
        }}
        type="form"
        size="lg"
        title="Nouveau poste"
        description="Définissez les caractéristiques du poste de sécurité"
        actions={{
          primary: {
            label: "Créer le poste",
            onClick: () => handleSave(false),
            disabled: !form.state.values.name,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsCreateModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Site *</Label>
            <Select value={createSiteId} onValueChange={setCreateSiteId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un site" />
              </SelectTrigger>
              <SelectContent>
                {mockSites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {messageErreur}
          {posteForm}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        type="details"
        size="xl"
        title="Modifier le poste"
        description={selectedPoste?.name}
        actions={{
          primary: {
            label: "Enregistrer",
            onClick: () => handleSave(true),
            disabled: !form.state.values.name,
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsEditModalOpen(false),
            variant: "outline",
          },
        }}
      >
        {messageErreur}
        {posteForm}
      </Modal>

      {/* View Modal */}
      {selectedPoste && (
        <Modal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          type="details"
          size="xl"
          title={selectedPoste.name}
          description={`${POSTE_TYPE_LABELS[selectedPoste.type]} — ${getSiteNameById(selectedPoste.siteId)}`}
          actions={{
            primary: {
              label: "Modifier",
              onClick: () => {
                setIsViewModalOpen(false);
                handleEdit(selectedPoste);
              },
            },
            secondary: {
              label: "Fermer",
              onClick: () => setIsViewModalOpen(false),
              variant: "outline",
            },
          }}
        >
          <div className="space-y-5 text-sm">
            {/* Hero header */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/50">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(selectedPoste.status)}
                  {getPriorityBadge(selectedPoste.priority)}
                  <Badge variant="secondary">
                    {POSTE_TYPE_LABELS[selectedPoste.type]}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                    <MapPin className="h-3.5 w-3.5" />
                    {getSiteNameById(selectedPoste.siteId)}
                  </div>
                </div>
                {selectedPoste.description && (
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {selectedPoste.description}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Planning card */}
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" /> Planning
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vacation</span>
                    <span className="font-semibold">
                      {selectedPoste.schedule.defaultShiftDuration}h
                    </span>
                  </div>
                  {!!selectedPoste.schedule.breakDuration && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pause</span>
                      <span>{selectedPoste.schedule.breakDuration} min</span>
                    </div>
                  )}
                  <Separator className="my-1" />
                  <div className="flex flex-col gap-1.5">
                    {selectedPoste.schedule.nightShift && (
                      <span className="flex items-center gap-1.5 text-indigo-500">
                        <Moon className="h-3.5 w-3.5" /> Nuit
                      </span>
                    )}
                    {selectedPoste.schedule.weekendWork && (
                      <span className="flex items-center gap-1.5 text-amber-500">
                        <Users className="h-3.5 w-3.5" /> Week-end
                      </span>
                    )}
                    {selectedPoste.schedule.rotatingShift && (
                      <span className="flex items-center gap-1.5 text-emerald-500">
                        <RotateCcw className="h-3.5 w-3.5" /> Tournant
                      </span>
                    )}
                    {!selectedPoste.schedule.nightShift &&
                      !selectedPoste.schedule.weekendWork &&
                      !selectedPoste.schedule.rotatingShift && (
                        <span className="text-muted-foreground text-xs">
                          Modèle
                        </span>
                      )}
                  </div>
                </div>
              </div>

              {/* Capacité card */}
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Capacité
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actuels</span>
                    <span className="font-semibold">
                      {selectedPoste.capacity.currentAgents ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min</span>
                    <span>{selectedPoste.capacity.minAgents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max</span>
                    <span>{selectedPoste.capacity.maxAgents}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="w-full bg-border rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          ((selectedPoste.capacity.currentAgents ?? 0) /
                            selectedPoste.capacity.maxAgents) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {selectedPoste.capacity.currentAgents ?? 0} /{" "}
                    {selectedPoste.capacity.maxAgents} agents
                  </p>
                </div>
              </div>

              {/* Exigences card */}
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Exigences
                </p>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedPoste.requirements.requiredCertifications.map(
                      (c) => (
                        <Badge
                          key={c}
                          variant="outline"
                          className="text-xs gap-1"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {c}
                        </Badge>
                      ),
                    )}
                    {(
                      selectedPoste.requirements.requiredQualifications ?? []
                    ).map((q) => (
                      <Badge key={q} variant="secondary" className="text-xs">
                        {q}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            {selectedPoste.instructions &&
              (() => {
                const { duties, equipment, procedures, emergencyContact } =
                  selectedPoste.instructions;
                const hasDuties = duties.length > 0;
                const hasEquipment = equipment && equipment.length > 0;
                const hasAnything =
                  hasDuties || hasEquipment || procedures || emergencyContact;
                if (!hasAnything) return null;
                return (
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5" /> Instructions
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {hasDuties && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Tâches & missions
                          </p>
                          <ul className="space-y-1">
                            {duties.map((d, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-xs"
                              >
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="space-y-3">
                        {hasEquipment && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                              <Wrench className="h-3.5 w-3.5" /> Équipements
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {equipment!.map((eq) => (
                                <Badge
                                  key={eq}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {eq}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {emergencyContact && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" /> Contact urgence
                            </p>
                            <p className="text-xs">{emergencyContact}</p>
                          </div>
                        )}
                        {procedures && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              Procédures
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {procedures}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        type="warning"
        title="Supprimer le poste"
        description={`Êtes-vous sûr de vouloir supprimer le poste "${posteToDelete?.name}" ? Cette action est irréversible.`}
        actions={{
          primary: {
            label: "Supprimer",
            onClick: handleConfirmDelete,
            variant: "destructive",
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsDeleteModalOpen(false),
            variant: "outline",
          },
        }}
      >
        <div />
      </Modal>
    </div>
  );
}
