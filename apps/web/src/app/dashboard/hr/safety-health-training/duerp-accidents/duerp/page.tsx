"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
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
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import {
  Plus,
  Trash2,
  FileDown,
  FileSpreadsheet,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ClipboardList,
  ListChecks,
  HardHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CADRES,
  TEINTES,
  type Teinte,
} from "@/components/safety-training/couleurs";
import {
  POINTS_GRAVITE,
  POINTS_PROBABILITE,
  exportDuerpToExcel,
  exportDuerpToPdf,
  niveauDeScore,
  niveauRisque,
  scoreRisque,
  type Niveau,
  type Poste,
  type Risk,
} from "@/lib/duerp-export";
import { useListePersistante } from "@/hooks/fiscal/use-liste-persistante";

const initialPostes: Poste[] = [
  {
    id: "1",
    title: "Agent SSIAP1 en ronde au Palais des Congrès",
    risks: [
      {
        risque: "Chute de plain-pied",
        cause: "Sols glissants ou encombrés",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures:
          "Formation à l'observation des risques, signalisation des zones dangereuses",
      },
      {
        risque: "Fatigue ou malaise",
        cause: "Travail de nuit ou longue station debout",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Organisation des rondes, pauses régulières",
      },
      {
        risque: "Agressions physiques",
        cause: "Rencontre avec des personnes malintentionnées",
        gravite: "Grave",
        probabilite: "Faible",
        mesures: "Équipement radio, formation à la gestion de conflits",
      },
      {
        risque: "Incendie",
        cause: "Détection ou gestion tardive",
        gravite: "Grave",
        probabilite: "Moyenne",
        mesures:
          "Formation SSIAP, vérification régulière des équipements incendie",
      },
    ],
  },
  {
    id: "2",
    title: "Agent SSIAP2 au PC Sécurité",
    risks: [
      {
        risque: "Fatigue visuelle",
        cause: "Travail prolongé sur écrans",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Aménagement ergonomique du poste, pauses visuelles",
      },
      {
        risque: "Stress",
        cause: "Gestion simultanée d'alarmes et de communications",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Formation à la gestion du stress, procédures claires",
      },
      {
        risque: "Incendie au PC sécurité",
        cause: "Équipement électrique ou erreur humaine",
        gravite: "Grave",
        probabilite: "Faible",
        mesures: "Vérification des installations électriques",
      },
      {
        risque: "Isolement",
        cause: "Absence de collègues",
        gravite: "Moyenne",
        probabilite: "Faible",
        mesures: "Surveillance à distance par supérieur",
      },
    ],
  },
  {
    id: "3",
    title: "Agent de sécurité dans un supermarché (Super U)",
    risks: [
      {
        risque: "Agression physique",
        cause: "Intervention lors d'un vol ou conflit client",
        gravite: "Grave",
        probabilite: "Moyenne",
        mesures:
          "Formation à la gestion de conflit, équipement de communication",
      },
      {
        risque: "TMS (troubles musculosquelettiques)",
        cause: "Surveillance prolongée debout",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Alterner surveillance et déplacements réguliers",
      },
      {
        risque: "Stress",
        cause: "Intervention répétée ou tension dans l'environnement",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Briefings réguliers et soutien psychologique",
      },
    ],
  },
  {
    id: "4",
    title: "Agent d'accueil parking",
    risks: [
      {
        risque: "Agression verbale ou physique",
        cause: "Mécontentement des utilisateurs",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Formation à la communication et gestion des conflits",
      },
      {
        risque: "Inhalation de gaz d'échappement",
        cause: "Zone confinée avec véhicules",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Ventilation efficace, port éventuel de masque",
      },
      {
        risque: "Accident de la circulation",
        cause: "Interaction avec les conducteurs",
        gravite: "Grave",
        probabilite: "Faible",
        mesures: "Zones piétonnes bien définies",
      },
      {
        risque: "Isolement",
        cause: "Travail seul en zone isolée",
        gravite: "Moyenne",
        probabilite: "Faible",
        mesures: "Surveillance vidéo et rondes régulières",
      },
    ],
  },
  {
    id: "5",
    title: "Agent de surveillance piscine",
    risks: [
      {
        risque: "Glissade ou chute",
        cause: "Sols mouillés autour des bassins",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Chaussures antidérapantes, signalisation",
      },
      {
        risque: "Risque de noyade",
        cause: "Intervention en cas d'accident",
        gravite: "Grave",
        probabilite: "Faible",
        mesures: "Formation sauvetage aquatique, PSC1 / PSE1",
      },
      {
        risque: "Agression physique ou verbale",
        cause: "Gestion de conflits avec usagers",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Formation gestion des conflits, équipement radio",
      },
      {
        risque: "Fatigue ou insolation",
        cause: "Environnement chaud",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Alternance des postes, hydratation, pauses",
      },
      {
        risque: "Troubles auditifs",
        cause: "Bruit ambiant élevé",
        gravite: "Faible",
        probabilite: "Moyenne",
        mesures: "Réduction exposition au bruit, pauses",
      },
      {
        risque: "Stress",
        cause: "Incidents imprévus",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Formation gestion du stress, débriefings",
      },
      {
        risque: "Contamination chimique",
        cause: "Produits de traitement de l'eau",
        gravite: "Grave",
        probabilite: "Faible",
        mesures: "Formation, port d'EPI",
      },
    ],
  },
  {
    id: "6",
    title: "Agent d'intervention sur alarme",
    risks: [
      {
        risque: "Agression physique",
        cause: "Présence d'intrus hostiles",
        gravite: "Grave",
        probabilite: "Moyenne",
        mesures: "Équipement de protection, formation conflits",
      },
      {
        risque: "Accident de la circulation",
        cause: "Déplacements en urgence",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Conduite défensive, vérification véhicules",
      },
      {
        risque: "Chute ou glissade",
        cause: "Site mal éclairé ou accidenté",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Lampe torche, chaussures adaptées",
      },
      {
        risque: "Stress",
        cause: "Interventions imprévues",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Formation gestion du stress, briefing",
      },
      {
        risque: "Risques électriques",
        cause: "Installations électriques",
        gravite: "Grave",
        probabilite: "Faible",
        mesures: "Formation risques électriques",
      },
    ],
  },
  {
    id: "7",
    title: "Agent événementiel",
    risks: [
      {
        risque: "Agression physique ou verbale",
        cause: "Foule ou individus alcoolisés",
        gravite: "Grave",
        probabilite: "Moyenne",
        mesures: "Formation conflits, binôme, radio",
      },
      {
        risque: "Fatigue ou épuisement",
        cause: "Longues heures debout",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Pauses régulières, hydratation",
      },
      {
        risque: "Écrasement ou blessure",
        cause: "Forte affluence",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Délimitation zones, équipement adapté",
      },
      {
        risque: "Stress",
        cause: "Situations d'urgence",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Briefing, soutien psychologique",
      },
      {
        risque: "Troubles auditifs",
        cause: "Environnement bruyant",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Bouchons d'oreilles",
      },
      {
        risque: "Incident d'évacuation",
        cause: "Mauvaise gestion de foule",
        gravite: "Grave",
        probabilite: "Faible",
        mesures: "Formation évacuation, reconnaissance des lieux",
      },
    ],
  },
  {
    id: "8",
    title: "Agent SSIAP de nuit sur site en bord de plage",
    risks: [
      {
        risque: "Chute ou glissade",
        cause: "Sols humides ou sableux",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Chaussures antidérapantes",
      },
      {
        risque: "Fatigue ou somnolence",
        cause: "Travail de nuit prolongé",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Pauses, repos avant prise de poste",
      },
      {
        risque: "Agression physique",
        cause: "Individus malintentionnés",
        gravite: "Grave",
        probabilite: "Faible",
        mesures: "Équipement radio, rondes en binôme",
      },
      {
        risque: "Exposition aux intempéries",
        cause: "Vent, froid, humidité",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "Vêtements adaptés",
      },
      {
        risque: "Risques incendie",
        cause: "Déchets inflammables",
        gravite: "Grave",
        probabilite: "Faible",
        mesures: "Inspection régulière",
      },
      {
        risque: "Stress",
        cause: "Isolement ou urgence",
        gravite: "Moyenne",
        probabilite: "Faible",
        mesures: "Communication avec PC sécurité",
      },
      {
        risque: "Noyade ou chute en mer",
        cause: "Déplacement près de l'eau",
        gravite: "Grave",
        probabilite: "Faible",
        mesures: "Éclairage puissant, zones interdites",
      },
    ],
  },
];

const NIVEAUX: {
  niveau: Niveau;
  teinte: Teinte;
  cadre: keyof typeof CADRES;
  icone: typeof ShieldCheck;
  aide: string;
}[] = [
  {
    niveau: "Faible",
    teinte: "vert",
    cadre: "vert",
    icone: ShieldCheck,
    aide: "Risque maîtrisé",
  },
  {
    niveau: "Moyen",
    teinte: "orange",
    cadre: "orange",
    icone: AlertTriangle,
    aide: "À surveiller",
  },
  {
    niveau: "Élevé",
    teinte: "rouge",
    cadre: "rouge",
    icone: ShieldAlert,
    aide: "Action à planifier",
  },
  {
    niveau: "Critique",
    teinte: "critique",
    cadre: "critique",
    icone: Flame,
    aide: "Action immédiate",
  },
];

const infosNiveau = (niveau: Niveau) =>
  NIVEAUX.find((n) => n.niveau === niveau)!;

/** Badge coloré : vert / orange / rouge, rouge foncé pour « critique ». */
function BadgeNiveau({
  teinte,
  children,
}: {
  teinte: Teinte;
  children: string;
}) {
  return (
    <Badge variant="outline" className={TEINTES[teinte]}>
      {children}
    </Badge>
  );
}

const teinteGravite = (g: string): Teinte =>
  g === "Grave" ? "rouge" : g === "Moyenne" ? "orange" : "vert";
const teinteProbabilite = (p: string): Teinte =>
  p === "Élevée" ? "rouge" : p === "Moyenne" ? "orange" : "vert";

export default function DUERPPage() {
  // Les postes livrés restent dans le code ; les ajouts et les évaluations
  // du client sont enregistrés en base.
  const [postes, setPostes] = useListePersistante<Poste>("duerp_poste", {
    reference: initialPostes,
    cle: (poste) => poste.title,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPosteTitle, setNewPosteTitle] = useState("");
  const [newRisks, setNewRisks] = useState<Risk[]>([]);

  const riskColumns: ColumnDef<Risk>[] = [
    {
      key: "risque",
      label: "Risque identifié",
      sortable: true,
      render: (risk) => <span className="font-medium">{risk.risque}</span>,
    },
    {
      key: "cause",
      label: "Cause potentielle",
      sortable: true,
    },
    {
      key: "gravite",
      label: "Gravité",
      sortable: true,
      sortValue: (risk) => POINTS_GRAVITE[risk.gravite],
      render: (risk) => (
        <BadgeNiveau teinte={teinteGravite(risk.gravite)}>
          {risk.gravite}
        </BadgeNiveau>
      ),
    },
    {
      key: "probabilite",
      label: "Probabilité",
      sortable: true,
      sortValue: (risk) => POINTS_PROBABILITE[risk.probabilite],
      render: (risk) => (
        <BadgeNiveau teinte={teinteProbabilite(risk.probabilite)}>
          {risk.probabilite}
        </BadgeNiveau>
      ),
    },
    {
      key: "niveau",
      label: "Niveau de risque",
      sortable: true,
      sortValue: scoreRisque,
      render: (risk) => {
        const info = infosNiveau(niveauRisque(risk));
        return <BadgeNiveau teinte={info.teinte}>{info.niveau}</BadgeNiveau>;
      },
    },
    {
      key: "mesures",
      label: "Mesures de prévention",
      sortable: true,
    },
  ];

  const handleAddRisk = () => {
    setNewRisks([
      ...newRisks,
      {
        risque: "",
        cause: "",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "",
      },
    ]);
  };

  const handleRemoveRisk = (index: number) => {
    if (newRisks.length > 1) {
      setNewRisks(newRisks.filter((_, i) => i !== index));
    }
  };

  const handleRiskChange = (
    index: number,
    field: keyof Risk,
    value: string,
  ) => {
    const updatedRisks = [...newRisks];
    updatedRisks[index] = { ...updatedRisks[index], [field]: value };
    setNewRisks(updatedRisks);
  };

  const handleSavePoste = () => {
    if (!newPosteTitle.trim()) {
      alert("Veuillez entrer un titre pour le poste");
      return;
    }

    const validRisks = newRisks.filter(
      (risk) => risk.risque.trim() && risk.cause.trim() && risk.mesures.trim(),
    );

    if (validRisks.length === 0) {
      alert("Veuillez ajouter au moins un risque complet");
      return;
    }

    const newPoste: Poste = {
      id: Date.now().toString(),
      title: newPosteTitle,
      risks: validRisks,
    };

    setPostes([...postes, newPoste]);
    setIsModalOpen(false);
    setNewPosteTitle("");
    setNewRisks([
      {
        risque: "",
        cause: "",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "",
      },
    ]);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setNewPosteTitle("");
    setNewRisks([
      {
        risque: "",
        cause: "",
        gravite: "Moyenne",
        probabilite: "Moyenne",
        mesures: "",
      },
    ]);
  };

  /** Les exports sont asynchrones (logo et société chargés à la volée). */
  const lancerExport = async (exporter: (p: Poste[]) => Promise<void>) => {
    try {
      await exporter(postes);
    } catch (e) {
      alert(
        `Export impossible : ${e instanceof Error ? e.message : "erreur inconnue"}`,
      );
    }
  };

  const tousLesRisques = postes.flatMap((poste) => poste.risks);
  const nombreParNiveau = (niveau: Niveau) =>
    tousLesRisques.filter((risk) => niveauRisque(risk) === niveau).length;
  const aTraiter = nombreParNiveau("Élevé") + nombreParNiveau("Critique");

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-tight">
            DUERP
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            Document Unique d&apos;Évaluation des Risques Professionnels
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void lancerExport(exportDuerpToPdf)}
            className="gap-2"
          >
            <FileDown className="h-4 w-4 text-red-600" />
            Exporter PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => void lancerExport(exportDuerpToExcel)}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Exporter Excel
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un poste
          </Button>
        </div>
      </div>

      {/* Synthèse : mêmes cartes colorées que « Analyse des coûts ». */}
      <InfoCardContainer>
        <InfoCard
          icon={HardHat}
          title="Postes évalués"
          value={postes.length}
          subtext="Postes couverts par le DUERP"
          color="blue"
        />
        <InfoCard
          icon={ClipboardList}
          title="Risques identifiés"
          value={tousLesRisques.length}
          subtext="Tous postes confondus"
          color="purple"
        />
        <InfoCard
          icon={ShieldAlert}
          title="À traiter en priorité"
          value={aTraiter}
          subtext="Risques élevés ou critiques"
          color="red"
        />
        <InfoCard
          icon={ListChecks}
          title="Risques maîtrisés"
          value={nombreParNiveau("Faible")}
          subtext="Niveau faible"
          color="green"
        />
      </InfoCardContainer>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="h-5 w-5" />
            Répartition par niveau de risque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {NIVEAUX.map(({ niveau, cadre, teinte, icone: Icone, aide }) => {
              const couleurs = CADRES[cadre];
              const nombre = nombreParNiveau(niveau);
              const part =
                tousLesRisques.length > 0
                  ? (nombre / tousLesRisques.length) * 100
                  : 0;
              return (
                <div
                  key={niveau}
                  className={cn(
                    "rounded-lg border p-4",
                    couleurs.bg,
                    couleurs.border,
                  )}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icone className={cn("h-4 w-4", couleurs.icon)} />
                      <h4 className={cn("font-semibold", couleurs.text)}>
                        {niveau}
                      </h4>
                    </div>
                    <BadgeNiveau teinte={teinte}>
                      {`${nombre} risque${nombre > 1 ? "s" : ""}`}
                    </BadgeNiveau>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Part des risques
                      </span>
                      <Badge variant="secondary" className="font-mono">
                        {part.toFixed(1)} %
                      </Badge>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-background/60">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          niveau === "Faible" && "bg-green-500",
                          niveau === "Moyen" && "bg-orange-500",
                          niveau === "Élevé" && "bg-red-500",
                          niveau === "Critique" && "bg-red-800",
                        )}
                        style={{ width: `${part}%` }}
                      />
                    </div>
                    <p className="border-t pt-2 text-sm text-muted-foreground">
                      {aide}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {postes.map((poste) => {
          // Le poste prend la couleur de son risque le plus grave.
          const pire = niveauDeScore(
            Math.max(0, ...poste.risks.map(scoreRisque)),
          );
          const infos = infosNiveau(pire);
          const couleurs = CADRES[infos.cadre];
          const Icone = infos.icone;
          return (
            <Card key={poste.id} className={cn("border-l-4", couleurs.border)}>
              <CardHeader className={cn("rounded-t-xl", couleurs.bg)}>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-xl font-medium">
                  <span className="flex items-center gap-2">
                    <Icone className={cn("h-5 w-5", couleurs.icon)} />
                    Poste : {poste.title}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="font-mono">
                      {poste.risks.length} risque
                      {poste.risks.length > 1 ? "s" : ""}
                    </Badge>
                    <BadgeNiveau teinte={infos.teinte}>
                      {`Niveau max. : ${pire}`}
                    </BadgeNiveau>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <DataTable
                  data={poste.risks}
                  columns={riskColumns}
                  searchKeys={["risque", "cause", "mesures"]}
                  searchPlaceholder="Rechercher un risque..."
                  itemsPerPage={10}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        type="form"
        title="Ajouter un nouveau poste"
        description="Créez un nouveau poste avec ses risques associés"
        actions={{
          primary: {
            label: "Enregistrer le poste",
            onClick: handleSavePoste,
          },
          secondary: {
            label: "Annuler",
            onClick: handleCancel,
          },
        }}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="poste-title">Titre du poste *</Label>
            <Input
              id="poste-title"
              value={newPosteTitle}
              onChange={(e) => setNewPosteTitle(e.target.value)}
              placeholder="Ex: Agent de sécurité..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Risques associés</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRisk}
                className="gap-2"
              >
                <Plus className="h-3 w-3" />
                Ajouter un risque
              </Button>
            </div>

            <div className="space-y-6">
              {newRisks.map((risk, index) => (
                <div
                  key={index}
                  className="space-y-4 rounded-lg border p-4"
                  data-state={newRisks.length > 1 ? "removable" : "single"}
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Risque #{index + 1}
                    </Label>
                    {newRisks.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRisk(index)}
                        className="h-8 gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                        Supprimer
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`risque-${index}`}>
                        Risque identifié *
                      </Label>
                      <Input
                        id={`risque-${index}`}
                        value={risk.risque}
                        onChange={(e) =>
                          handleRiskChange(index, "risque", e.target.value)
                        }
                        placeholder="Ex: Chute de plain-pied"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`cause-${index}`}>
                        Cause potentielle *
                      </Label>
                      <Input
                        id={`cause-${index}`}
                        value={risk.cause}
                        onChange={(e) =>
                          handleRiskChange(index, "cause", e.target.value)
                        }
                        placeholder="Ex: Sols glissants ou encombrés"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`gravite-${index}`}>Gravité *</Label>
                        <Select
                          value={risk.gravite}
                          onValueChange={(value) =>
                            handleRiskChange(
                              index,
                              "gravite",
                              value as Risk["gravite"],
                            )
                          }
                        >
                          <SelectTrigger id={`gravite-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Grave">Grave</SelectItem>
                            <SelectItem value="Moyenne">Moyenne</SelectItem>
                            <SelectItem value="Faible">Faible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`probabilite-${index}`}>
                          Probabilité *
                        </Label>
                        <Select
                          value={risk.probabilite}
                          onValueChange={(value) =>
                            handleRiskChange(
                              index,
                              "probabilite",
                              value as Risk["probabilite"],
                            )
                          }
                        >
                          <SelectTrigger id={`probabilite-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Élevée">Élevée</SelectItem>
                            <SelectItem value="Moyenne">Moyenne</SelectItem>
                            <SelectItem value="Faible">Faible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`mesures-${index}`}>
                        Mesures de prévention *
                      </Label>
                      <Textarea
                        id={`mesures-${index}`}
                        value={risk.mesures}
                        onChange={(e) =>
                          handleRiskChange(index, "mesures", e.target.value)
                        }
                        placeholder="Ex: Formation à l'observation des risques..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
