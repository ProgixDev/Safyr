"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import {
  BellRing,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Upload,
  Loader2,
} from "lucide-react";
import { ApiError } from "@safyr/api-client";
import {
  useOrganizationCompliance,
  useUploadOrganizationDocument,
} from "@/hooks/organization";
import { computeDocumentAlerts } from "@/lib/document-alerts";
import { formatDate } from "@/lib/date-utils";

export default function AlertesEntreprisePage() {
  const { data: compliance, isLoading } = useOrganizationCompliance();
  const uploadMutation = useUploadOrganizationDocument();
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const alerts = useMemo(
    () => computeDocumentAlerts(compliance ?? []),
    [compliance],
  );

  const dangerCount = alerts.filter((a) => a.level === "danger").length;
  const warningCount = alerts.filter((a) => a.level === "warning").length;

  const handleUpload = (requirementId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploadingId(requirementId);
      uploadMutation.mutate(
        { file, requirementId },
        {
          onError: (error: unknown) => {
            const message =
              error instanceof ApiError
                ? error.message
                : "Échec du téléversement";
            console.error(message);
          },
          onSettled: () => setUploadingId(null),
        },
      );
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BellRing className="h-7 w-7" />
          Alertes
        </h1>
        <p className="text-muted-foreground">
          Documents administratifs à renouveler ou à téléverser
        </p>
      </div>

      <InfoCardContainer>
        <InfoCard
          icon={BellRing}
          title="Alertes actives"
          value={alerts.length}
          subtext={alerts.length === 0 ? "tout est à jour" : "à traiter"}
          color="blue"
        />
        <InfoCard
          icon={AlertTriangle}
          title="Critiques"
          value={dangerCount}
          subtext="expirés / dépassés / manquants"
          color="red"
        />
        <InfoCard
          icon={Clock}
          title="À surveiller"
          value={warningCount}
          subtext="expirent / à renouveler bientôt"
          color="orange"
        />
      </InfoCardContainer>

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
    </div>
  );
}
