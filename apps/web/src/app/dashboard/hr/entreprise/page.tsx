"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import {
  Building2,
  Upload,
  Download,
  AlertTriangle,
  ExternalLink,
  FileCheck,
  CheckCircle2,
  Calendar,
  Loader2,
  Pencil,
  Save,
  X,
  BellRing,
  ImagePlus,
  Clock,
} from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { ApiError, type UpdateOrganizationPayload } from "@safyr/api-client";
import { computeDocumentAlerts } from "@/lib/document-alerts";
import {
  useOrganization,
  useOrganizationCompliance,
  useUpdateOrganization,
  useCreateRepresentative,
  useUploadOrganizationDocument,
} from "@/hooks/organization";
import { getSignedUrl, uploadFile } from "@safyr/api-client";
import {
  UpdateOrganizationDto,
  UpdateOrganizationSchema,
} from "@safyr/schemas/organization";
import { FormFieldRow } from "@/components/ui/form-field-row";
import { CompanySearch } from "@/components/ui/company-search";
import { PhoneField } from "@/components/ui/phone-field";
import { formatDate, formatDateForInput } from "@/lib/date-utils";

export default function InformationEntreprisePage() {
  const { data: organization, isLoading: isOrgLoading } = useOrganization();
  const { data: compliance, isLoading: isComplianceLoading } =
    useOrganizationCompliance();

  if (isOrgLoading || isComplianceLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization)
    return <div>Erreur lors du chargement de l&apos;entreprise</div>;

  return (
    <EntrepriseContent
      key={organization.id}
      organization={organization}
      compliance={compliance ?? []}
    />
  );
}

type EntrepriseContentProps = {
  organization: NonNullable<ReturnType<typeof useOrganization>["data"]>;
  compliance: NonNullable<ReturnType<typeof useOrganizationCompliance>["data"]>;
};

function EntrepriseContent({
  organization,
  compliance,
}: EntrepriseContentProps) {
  const updateOrgMutation = useUpdateOrganization();
  const createRepMutation = useCreateRepresentative();

  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues = useMemo<UpdateOrganizationDto>(() => {
    const rep = organization.representative;
    return {
      ...organization,
      representative: rep
        ? {
            ...rep,
            birthDate: rep.birthDate
              ? formatDateForInput(rep.birthDate)
              : rep.birthDate,
            appointmentDate: rep.appointmentDate
              ? formatDateForInput(rep.appointmentDate)
              : rep.appointmentDate,
          }
        : rep,
    };
  }, [organization]);

  const form = useForm({
    defaultValues,
    validators: {
      onChange: UpdateOrganizationSchema,
    },
    onSubmit: async ({ value }) => {
      setFormError(null);
      const rep = value.representative;
      const payload: UpdateOrganizationPayload = {
        name: value.name,
        shareCapital: value.shareCapital,
        authorizationNumber: value.authorizationNumber,
        email: value.email,
        phone: value.phone,
        siret: value.siret,
        ape: value.ape,
        address: value.address,
        ...(rep
          ? {
              representative: {
                firstName: rep.firstName,
                lastName: rep.lastName,
                birthDate: rep.birthDate,
                birthPlace: rep.birthPlace,
                nationality: rep.nationality,
                address: rep.address,
                email: rep.email,
                phone: rep.phone,
                position: rep.position,
                appointmentDate: rep.appointmentDate,
                socialSecurityNumber: rep.socialSecurityNumber,
              },
            }
          : {}),
      };
      try {
        await updateOrgMutation.mutateAsync(payload);
        setIsEditing(false);
      } catch (error) {
        if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
          const details = error.details as { path: string; message: string }[];
          for (const detail of details) {
            form.setFieldMeta(detail.path as never, (prev) => ({
              ...prev,
              errors: [detail.message],
            }));
          }
          setFormError("Veuillez corriger les champs en rouge.");
        } else {
          setFormError("Une erreur est survenue lors de l'enregistrement.");
        }
      }
    },
  });

  const handleCancel = () => {
    form.reset();
    setFormError(null);
    setIsEditing(false);
  };

  const handleCreateRepresentative = () => {
    createRepMutation.mutate({
      firstName: "Prénom",
      lastName: "Nom",
    });
  };

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const uploadMutation = useUploadOrganizationDocument();

  const handleUpload = async (requirementId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setUploadingId(requirementId);
        setUploadErrors((prev) => {
          const next = { ...prev };
          delete next[requirementId];
          return next;
        });
        uploadMutation.mutate(
          { file, requirementId },
          {
            onError: (error: unknown) => {
              const message =
                error instanceof ApiError
                  ? error.message
                  : "Échec du téléversement";
              setUploadErrors((prev) => ({
                ...prev,
                [requirementId]: message,
              }));
            },
            onSettled: () => {
              setUploadingId(null);
            },
          },
        );
      }
    };
    input.click();
  };

  const handleDownload = async (key: string) => {
    const url = await getSignedUrl(key);
    window.open(url, "_blank");
  };

  // ── Logo ──────────────────────────────────────────────────────────
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (organization.logo) {
      getSignedUrl(organization.logo)
        .then((url) => active && setLogoUrl(url))
        .catch(() => active && setLogoUrl(null));
    } else {
      setLogoUrl(null);
    }
    return () => {
      active = false;
    };
  }, [organization.logo]);

  const handleLogoUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setLogoUploading(true);
      setLogoError(null);
      try {
        const { key } = await uploadFile(file);
        await updateOrgMutation.mutateAsync({ logo: key });
      } catch {
        setLogoError("Échec du téléversement du logo");
      } finally {
        setLogoUploading(false);
      }
    };
    input.click();
  };

  // ── Alertes de renouvellement ─────────────────────────────────────
  const alerts = useMemo(() => computeDocumentAlerts(compliance), [compliance]);

  const representative = organization.representative;
  const totalDocs = compliance.length;
  let validDocs = 0;
  let expiringDocs = 0;
  for (const c of compliance) {
    if (c.status === "valid") validDocs++;
    else if (c.status === "expiring") expiringDocs++;
  }

  const STATUS_META = {
    valid: { variant: "default", label: "Valide", dot: "bg-green-500" },
    expired: {
      variant: "destructive",
      label: "Expiré",
      dot: "bg-destructive",
    },
    expiring: {
      variant: "secondary",
      label: "Expire bientôt",
      dot: "bg-warning",
    },
    missing: { variant: "outline", label: "Manquant", dot: "bg-neutral-300" },
    optional: {
      variant: "outline",
      label: "Optionnel",
      dot: "bg-neutral-300",
    },
  } as const;
  type ComplianceStatus = keyof typeof STATUS_META;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-border bg-muted/30 flex items-center justify-center">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo de l'entreprise"
              className="h-full w-full object-contain"
            />
          ) : (
            <Building2 className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">Information Entreprise</h1>
          <p className="text-muted-foreground">
            Gestion des informations et documents administratifs de
            l&apos;entreprise
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            onClick={handleLogoUpload}
            disabled={logoUploading}
          >
            {logoUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-2 h-4 w-4" />
            )}
            {organization.logo ? "Changer le logo" : "Télécharger le logo"}
          </Button>
          {logoError && (
            <p className="mt-1 text-sm text-destructive">{logoError}</p>
          )}
        </div>
      </div>

      <InfoCardContainer>
        <InfoCard
          icon={Building2}
          title="Entreprise"
          value={organization.name}
          subtext={`SIRET: ${organization.siret || "Non renseigné"}`}
          color="blue"
        />
        <InfoCard
          icon={CheckCircle2}
          title="Documents valides"
          value={validDocs}
          subtext={`sur ${totalDocs} documents requis`}
          color="green"
        />
        <InfoCard
          icon={AlertTriangle}
          title="Expire bientôt"
          value={expiringDocs}
          subtext={expiringDocs > 0 ? "nécessite renouvellement" : "aucun"}
          color="orange"
        />
        <InfoCard
          icon={Calendar}
          title="Capital social"
          value={`${organization.shareCapital ? Number(organization.shareCapital).toLocaleString() : "0"} €`}
          subtext="capital déclaré"
          color="purple"
        />
      </InfoCardContainer>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="info" className="text-base">
            Informations
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-base">
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <CardTitle className="text-xl">
                    Informations de l&apos;entreprise
                  </CardTitle>
                </div>
                {!isEditing ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="mr-2 h-4 w-4 text-orange-500" />
                    Modifier
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={updateOrgMutation.isPending}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => form.handleSubmit()}
                      disabled={updateOrgMutation.isPending}
                    >
                      {updateOrgMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Enregistrer
                    </Button>
                  </div>
                )}
              </div>
              {formError && (
                <p className="text-sm text-destructive mt-2">{formError}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing && (
                <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
                  <p className="mb-2 text-sm font-medium">
                    Remplissage automatique (annuaire des entreprises)
                  </p>
                  <CompanySearch
                    onSelect={(c) => {
                      form.setFieldValue("name", c.name);
                      if (c.siret) form.setFieldValue("siret", c.siret);
                      if (c.ape) form.setFieldValue("ape", c.ape);
                      if (c.address) form.setFieldValue("address", c.address);
                    }}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Recherchez par nom ou SIREN pour pré-remplir nom, SIRET, code
                    APE et adresse.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field name="name">
                  {(field) => (
                    <FormFieldRow
                      field={field}
                      label="Nom de l'entreprise"
                      editing={isEditing}
                    >
                      <Input placeholder="Nom" />
                    </FormFieldRow>
                  )}
                </form.Field>
                <form.Field name="siret">
                  {(field) => (
                    <FormFieldRow
                      field={field}
                      label="SIRET"
                      editing={isEditing}
                    >
                      <Input placeholder="Numéro SIRET" />
                    </FormFieldRow>
                  )}
                </form.Field>
              </div>

              <form.Field name="address">
                {(field) => (
                  <FormFieldRow
                    field={field}
                    label="Adresse"
                    editing={isEditing}
                  >
                    <Textarea placeholder="Adresse complète" />
                  </FormFieldRow>
                )}
              </form.Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field name="shareCapital">
                  {(field) => (
                    <FormFieldRow
                      field={field}
                      label="Capital Social (€)"
                      className="flex-1"
                      editing={isEditing}
                    >
                      <Input placeholder="0" />
                    </FormFieldRow>
                  )}
                </form.Field>
                <form.Field name="authorizationNumber">
                  {(field) => (
                    <FormFieldRow
                      field={field}
                      label="N° Autorisation CNAPS"
                      className="flex-1"
                      editing={isEditing}
                    >
                      <Input placeholder="AUT-..." />
                    </FormFieldRow>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field name="email">
                  {(field) => (
                    <FormFieldRow
                      field={field}
                      label="Email de l'entreprise"
                      editing={isEditing}
                    >
                      <Input type="email" placeholder="email@entreprise.com" />
                    </FormFieldRow>
                  )}
                </form.Field>
                <form.Field name="phone">
                  {(field) => (
                    <FormFieldRow
                      field={field}
                      label="Téléphone de l'entreprise"
                      editing={isEditing}
                    >
                      <PhoneField placeholder="01 23 45 67 89" />
                    </FormFieldRow>
                  )}
                </form.Field>
              </div>

              <div className="border-t pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Informations du dirigeant
                  </h3>
                  {isEditing && !representative && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateRepresentative}
                      disabled={createRepMutation.isPending}
                    >
                      {createRepMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Ajouter un dirigeant
                    </Button>
                  )}
                </div>

                {representative ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <form.Field name="representative.lastName">
                        {(field) => (
                          <FormFieldRow
                            field={field}
                            label="Nom"
                            editing={isEditing}
                          >
                            <Input placeholder="Nom" />
                          </FormFieldRow>
                        )}
                      </form.Field>
                      <form.Field name="representative.firstName">
                        {(field) => (
                          <FormFieldRow
                            field={field}
                            label="Prénom"
                            editing={isEditing}
                          >
                            <Input placeholder="Prénom" />
                          </FormFieldRow>
                        )}
                      </form.Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <form.Field name="representative.position">
                        {(field) => (
                          <FormFieldRow
                            field={field}
                            label="Fonction"
                            editing={isEditing}
                          >
                            <Input placeholder="Fonction" />
                          </FormFieldRow>
                        )}
                      </form.Field>
                      <form.Field name="representative.appointmentDate">
                        {(field) => (
                          <FormFieldRow
                            field={field}
                            label="Date de nomination"
                            editing={isEditing}
                          >
                            <Input type="date" />
                          </FormFieldRow>
                        )}
                      </form.Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <form.Field name="representative.birthDate">
                        {(field) => (
                          <FormFieldRow
                            field={field}
                            label="Date de naissance"
                            editing={isEditing}
                          >
                            <Input type="date" />
                          </FormFieldRow>
                        )}
                      </form.Field>
                      <form.Field name="representative.birthPlace">
                        {(field) => (
                          <FormFieldRow
                            field={field}
                            label="Lieu de naissance"
                            editing={isEditing}
                          >
                            <Input placeholder="Ville, Pays" />
                          </FormFieldRow>
                        )}
                      </form.Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <form.Field name="representative.nationality">
                        {(field) => (
                          <FormFieldRow
                            field={field}
                            label="Nationalité"
                            editing={isEditing}
                          >
                            <Input placeholder="Nationalité" />
                          </FormFieldRow>
                        )}
                      </form.Field>
                      <form.Field name="representative.socialSecurityNumber">
                        {(field) => (
                          <FormFieldRow
                            field={field}
                            label="Numéro de sécurité sociale"
                            editing={isEditing}
                          >
                            <Input placeholder="1 00..." />
                          </FormFieldRow>
                        )}
                      </form.Field>
                    </div>

                    <form.Field name="representative.address">
                      {(field) => (
                        <FormFieldRow
                          field={field}
                          label="Adresse personnelle"
                          editing={isEditing}
                        >
                          <Textarea placeholder="Adresse complète" />
                        </FormFieldRow>
                      )}
                    </form.Field>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <form.Field name="representative.email">
                        {(field) => (
                          <FormFieldRow
                            field={field}
                            label="Email personnel"
                            editing={isEditing}
                          >
                            <Input type="email" placeholder="email@perso.com" />
                          </FormFieldRow>
                        )}
                      </form.Field>
                      <form.Field name="representative.phone">
                        {(field) => (
                          <FormFieldRow
                            field={field}
                            label="Téléphone personnel"
                            editing={isEditing}
                          >
                            <PhoneField placeholder="06 12 34 56 78" />
                          </FormFieldRow>
                        )}
                      </form.Field>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Aucun dirigeant configuré pour cette entreprise.
                  </p>
                )}
              </div>

              {isEditing && (
                <div className="flex items-center justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateOrgMutation.isPending}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    onClick={() => form.handleSubmit()}
                    disabled={updateOrgMutation.isPending}
                  >
                    {updateOrgMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Enregistrer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BellRing className="h-5 w-5 text-warning" />
                  Alertes de renouvellement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="flex items-center gap-2 text-base text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Aucune alerte — tous les documents sont à jour.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {alerts.map((a) => (
                      <div
                        key={a.id}
                        className={`flex items-center justify-between rounded-md border px-3 py-2.5 ${
                          a.level === "danger"
                            ? "border-destructive/30 bg-destructive/10"
                            : "border-warning/30 bg-warning/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {a.level === "danger" ? (
                            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                          ) : (
                            <Clock className="h-5 w-5 shrink-0 text-warning" />
                          )}
                          <div>
                            <p className="text-base font-medium">{a.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {a.message}
                              {a.date ? ` — échéance ${formatDate(a.date)}` : ""}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpload(a.id)}
                          disabled={uploadingId === a.id}
                        >
                          {uploadingId === a.id ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-1 h-4 w-4" />
                          )}
                          Téléverser
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Règles : attestations fiscale &amp; URSSAF tous les 6 mois ·
                  assurance tous les ans · Kbis tous les 3 mois · cartes pro à
                  l&apos;expiration.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ExternalLink className="h-4 w-4" />
                  Liens Rapides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {[
                    { name: "URSSAF", url: "https://urssaf.fr" },
                    { name: "Impôts", url: "https://impots.gouv.fr" },
                    { name: "Infogreffe", url: "https://infogreffe.fr" },
                  ].map((link) => (
                    <Button
                      key={link.name}
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 text-sm"
                      onClick={() => window.open(link.url, "_blank")}
                    >
                      {link.name}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileCheck className="h-5 w-5" />
                    Documents Administratifs
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {compliance.map((item) => {
                    const meta =
                      STATUS_META[item.status as ComplianceStatus] ??
                      STATUS_META.missing;
                    const containerCls =
                      item.status === "expired"
                        ? "border-destructive/20 bg-destructive/10"
                        : item.status === "expiring"
                          ? "border-warning/20 bg-warning/10"
                          : "hover:bg-accent";
                    return (
                      <div
                        key={item.requirement.id}
                        className={`flex flex-col py-3 px-3 border rounded-md ${containerCls}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-2 h-2 rounded-full ${meta.dot}`}
                            ></div>
                            <div>
                              <p className="font-medium text-base">
                                {item.requirement.name}
                                {item.requirement.isRequired && (
                                  <span className="text-destructive ml-1">
                                    *
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge
                                  variant={meta.variant}
                                  className="text-sm h-6"
                                >
                                  {meta.label}
                                </Badge>
                                {item.document?.expiryDate && (
                                  <span className="text-sm text-muted-foreground">
                                    Expire le{" "}
                                    {formatDate(item.document.expiryDate)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {item.document && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() =>
                                  handleDownload(item.document!.storageKey)
                                }
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleUpload(item.requirement.id)}
                              disabled={uploadingId === item.requirement.id}
                            >
                              {uploadingId === item.requirement.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {uploadErrors[item.requirement.id] && (
                          <p className="text-sm text-destructive mt-2">
                            {uploadErrors[item.requirement.id]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
