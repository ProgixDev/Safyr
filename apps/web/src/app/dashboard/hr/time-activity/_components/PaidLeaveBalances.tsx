"use client";

import { useState } from "react";
import { Calendar, Download, FileText, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/modal";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import { useEmployeeOptions } from "@/hooks/employees";
import { useRegistre } from "@/hooks/fiscal";
import { exporterCsvExcel } from "@/lib/export-table";
import {
  AUCUN_FICHIER,
  STATUTS,
  formaterDate,
  messageErreur,
  type DemandeTemps,
} from "./temps";

/** Solde de congés payés d'un salarié : une ligne par salarié en base. */
interface SoldeConges {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  cpN2Acquired: number;
  cpN2Taken: number;
  cpN2Balance: number;
  cpN1Acquired: number;
  cpN1Taken: number;
  cpN1Balance: number;
  cpNAcquired: number;
  cpNTaken: number;
  cpNBalance: number;
  totalBalance: number;
}

type ChampsSaisis = Pick<
  SoldeConges,
  | "cpN2Acquired"
  | "cpN2Taken"
  | "cpN1Acquired"
  | "cpN1Taken"
  | "cpNAcquired"
  | "cpNTaken"
>;

const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;

/** Les soldes se déduisent toujours des acquis et des pris. */
function calculerSoldes(
  base: Pick<SoldeConges, "id" | "employeeId" | "employeeName" | "position"> &
    ChampsSaisis,
): SoldeConges {
  const cpN2Balance = base.cpN2Acquired - base.cpN2Taken;
  const cpN1Balance = base.cpN1Acquired - base.cpN1Taken;
  const cpNBalance = base.cpNAcquired - base.cpNTaken;
  return {
    ...base,
    cpN2Balance,
    cpN1Balance,
    cpNBalance,
    totalBalance: cpN2Balance + cpN1Balance + cpNBalance,
  };
}

const arrondi = (n: number) => Math.round(n * 100) / 100;

export function PaidLeaveBalances() {
  // Chaque salarié du dossier du personnel apparaît, avec un solde à 0 tant
  // qu'il n'a pas été renseigné : la liste ne dépend donc d'aucun exemple.
  const salaries = useEmployeeOptions();
  const registre = useRegistre<SoldeConges>("solde_conges", AUCUN_FICHIER);
  const demandes = useRegistre<DemandeTemps>("conge", AUCUN_FICHIER).lignes;

  const soldesParSalarie = new Map(
    registre.lignes.map((l) => [l.employeeId, l]),
  );
  const donnees: SoldeConges[] = salaries.map((s) => {
    const existant = soldesParSalarie.get(s.id);
    return calculerSoldes({
      id: existant?.id ?? `solde-${s.id}`,
      employeeId: s.id,
      employeeName: s.name,
      position: s.poste,
      cpN2Acquired: num(existant?.cpN2Acquired),
      cpN2Taken: num(existant?.cpN2Taken),
      cpN1Acquired: num(existant?.cpN1Acquired),
      cpN1Taken: num(existant?.cpN1Taken),
      cpNAcquired: num(existant?.cpNAcquired),
      cpNTaken: num(existant?.cpNTaken),
    });
  });

  const anneeCourante = new Date().getFullYear();
  const [choisi, setChoisi] = useState<SoldeConges | null>(null);
  const [detailOuvert, setDetailOuvert] = useState(false);
  const [editOuvert, setEditOuvert] = useState(false);
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
  const [saisie, setSaisie] = useState<Record<keyof ChampsSaisis, string>>({
    cpN2Acquired: "",
    cpN2Taken: "",
    cpN1Acquired: "",
    cpN1Taken: "",
    cpNAcquired: "",
    cpNTaken: "",
  });
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const periodes = [
    { cle: "cpN2", libelle: `CP N-2 (${anneeCourante - 2})` },
    { cle: "cpN1", libelle: `CP N-1 (${anneeCourante - 1})` },
    { cle: "cpN", libelle: `CP N (${anneeCourante})` },
  ] as const;

  // Toujours relu dans la liste à jour (après un enregistrement).
  const courant = choisi
    ? (donnees.find((d) => d.employeeId === choisi.employeeId) ?? choisi)
    : null;

  const ouvrirDetail = (s: SoldeConges) => {
    setChoisi(s);
    setDetailOuvert(true);
  };

  const ouvrirEdition = (s: SoldeConges) => {
    setChoisi(s);
    setSaisie({
      cpN2Acquired: String(s.cpN2Acquired),
      cpN2Taken: String(s.cpN2Taken),
      cpN1Acquired: String(s.cpN1Acquired),
      cpN1Taken: String(s.cpN1Taken),
      cpNAcquired: String(s.cpNAcquired),
      cpNTaken: String(s.cpNTaken),
    });
    setErreur(null);
    setDetailOuvert(false);
    setEditOuvert(true);
  };

  const valeurs = (): ChampsSaisis => ({
    cpN2Acquired: Number(saisie.cpN2Acquired) || 0,
    cpN2Taken: Number(saisie.cpN2Taken) || 0,
    cpN1Acquired: Number(saisie.cpN1Acquired) || 0,
    cpN1Taken: Number(saisie.cpN1Taken) || 0,
    cpNAcquired: Number(saisie.cpNAcquired) || 0,
    cpNTaken: Number(saisie.cpNTaken) || 0,
  });

  const enregistrer = async () => {
    if (!courant) return;
    setEnCours(true);
    setErreur(null);
    try {
      const ligne = calculerSoldes({ ...courant, ...valeurs() });
      await registre.enregistrer(ligne, {
        period: String(anneeCourante),
        label: ligne.employeeName,
      });
      setEditOuvert(false);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  const exporter = () =>
    exporterCsvExcel(
      "soldes-conges-payes",
      [
        { titre: "Salarié", valeur: (s: SoldeConges) => s.employeeName },
        { titre: "Poste", valeur: (s) => s.position },
        {
          titre: `CP N-2 (${anneeCourante - 2})`,
          valeur: (s) => s.cpN2Balance,
        },
        {
          titre: `CP N-1 (${anneeCourante - 1})`,
          valeur: (s) => s.cpN1Balance,
        },
        { titre: `CP N (${anneeCourante})`, valeur: (s) => s.cpNBalance },
        { titre: "Solde total", valeur: (s) => s.totalBalance },
      ],
      donnees,
    );

  // Jours de congés payés déjà approuvés dans les demandes, par salarié et
  // pour l'année en cours : affichés à titre de repère à côté de la saisie.
  const joursApprouves = (employeeId: string) =>
    demandes
      .filter(
        (d) =>
          d.employeeId === employeeId &&
          d.type === "vacation" &&
          d.status === "approved" &&
          d.startDate.startsWith(String(anneeCourante)),
      )
      .reduce((somme, d) => somme + (d.totalDays || 0), 0);

  const historique = demandes
    .filter(
      (d) =>
        d.type === "vacation" &&
        d.employeeId === courant?.employeeId &&
        d.status !== "cancelled",
    )
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const totalAcquis = donnees.reduce((s, d) => s + d.cpNAcquired, 0);
  const totalPris = donnees.reduce((s, d) => s + d.cpNTaken, 0);
  const totalSolde = donnees.reduce((s, d) => s + d.totalBalance, 0);

  const colonnes: ColumnDef<SoldeConges>[] = [
    {
      key: "employeeName",
      label: "Salarié",
      sortable: true,
      render: (d) => (
        <div className="min-w-0">
          <p className="truncate font-semibold">{d.employeeName}</p>
          <p className="truncate text-sm text-muted-foreground">{d.position}</p>
        </div>
      ),
    },
    ...periodes.map((p) => ({
      key: `${p.cle}Balance`,
      label: p.libelle,
      sortable: true,
      render: (d: SoldeConges) => (
        <span className="font-semibold">
          {arrondi(d[`${p.cle}Balance` as keyof SoldeConges] as number)} j
        </span>
      ),
    })),
    {
      key: "totalBalance",
      label: "CP total",
      sortable: true,
      render: (d) => (
        <span className="text-lg font-bold text-primary">
          {arrondi(d.totalBalance)} j
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={exporter}
          disabled={donnees.length === 0}
        >
          <Download className="mr-2 h-4 w-4 text-violet-500" />
          Exporter
        </Button>
      </div>

      <InfoCardContainer>
        <InfoCard
          icon={Calendar}
          title="Salariés"
          value={donnees.length}
          subtext="Dans le dossier du personnel"
          color="gray"
        />
        <InfoCard
          icon={TrendingUp}
          title="CP acquis (N)"
          value={`${arrondi(totalAcquis)} j`}
          subtext={`Année ${anneeCourante}`}
          color="blue"
        />
        <InfoCard
          icon={Calendar}
          title="CP pris (N)"
          value={`${arrondi(totalPris)} j`}
          subtext={`Année ${anneeCourante}`}
          color="green"
        />
        <InfoCard
          icon={TrendingUp}
          title="Solde total"
          value={`${arrondi(totalSolde)} j`}
          subtext="Tous salariés"
          color="orange"
        />
      </InfoCardContainer>

      <Card>
        <CardHeader>
          <CardTitle>Soldes de congés payés</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={donnees}
            columns={colonnes}
            onRowClick={ouvrirDetail}
            searchKeys={["employeeName", "position"]}
            searchPlaceholder="Rechercher un salarié..."
            getRowId={(d) => d.employeeId}
            actions={(d) => (
              <RowActionsMenu
                onView={() => ouvrirDetail(d)}
                onEdit={() => ouvrirEdition(d)}
                extraItems={[
                  {
                    label: "Historique",
                    icon: FileText,
                    tone: "history",
                    onClick: () => {
                      setChoisi(d);
                      setHistoriqueOuvert(true);
                    },
                  },
                ]}
              />
            )}
          />
          {donnees.length === 0 && (
            <p className="pt-2 text-center text-sm text-muted-foreground">
              Aucun salarié dans l&apos;entreprise : créez d&apos;abord un
              dossier salarié.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Détail */}
      <Modal
        open={detailOuvert}
        onOpenChange={setDetailOuvert}
        type="details"
        title={`Congés payés — ${courant?.employeeName ?? ""}`}
        description={courant?.position}
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setDetailOuvert(false),
            variant: "outline",
          },
          primary: {
            label: "Modifier",
            onClick: () => courant && ouvrirEdition(courant),
          },
        }}
      >
        {courant && (
          <div className="space-y-6">
            {periodes.map((p) => (
              <div key={p.cle} className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  {p.libelle}
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Acquis</p>
                    <p className="text-xl font-bold">
                      {courant[`${p.cle}Acquired` as keyof SoldeConges]} j
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Pris</p>
                    <p className="text-xl font-bold">
                      {courant[`${p.cle}Taken` as keyof SoldeConges]} j
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-3">
                    <p className="text-xs text-muted-foreground">Solde</p>
                    <p className="text-xl font-bold text-primary">
                      {arrondi(
                        courant[
                          `${p.cle}Balance` as keyof SoldeConges
                        ] as number,
                      )}{" "}
                      j
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-lg border-2 border-primary/40 bg-primary/20 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Solde total</span>
                <span className="text-3xl font-bold text-primary">
                  {arrondi(courant.totalBalance)} j
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Demandes de congés payés approuvées en {anneeCourante} :{" "}
              <strong>{joursApprouves(courant.employeeId)} j</strong> (repère, à
              reporter dans « Pris » si besoin).
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setDetailOuvert(false);
                setHistoriqueOuvert(true);
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Voir l&apos;historique
            </Button>
          </div>
        )}
      </Modal>

      {/* Modification */}
      <Modal
        open={editOuvert}
        onOpenChange={setEditOuvert}
        type="form"
        size="lg"
        title="Modifier les congés payés"
        actions={{
          secondary: {
            label: "Annuler",
            onClick: () => setEditOuvert(false),
            variant: "outline",
          },
          primary: {
            label: "Enregistrer",
            onClick: () => void enregistrer(),
            disabled: enCours,
            loading: enCours,
          },
        }}
      >
        {courant && (
          <div className="space-y-6">
            {erreur && (
              <div
                role="alert"
                className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
              >
                {erreur}
              </div>
            )}
            <div className="rounded-lg bg-muted/30 p-4">
              <h4 className="font-medium">{courant.employeeName}</h4>
              <p className="text-sm text-muted-foreground">
                {courant.position}
              </p>
            </div>

            {periodes.map((p) => {
              const acquis = `${p.cle}Acquired` as keyof ChampsSaisis;
              const pris = `${p.cle}Taken` as keyof ChampsSaisis;
              const solde =
                (Number(saisie[acquis]) || 0) - (Number(saisie[pris]) || 0);
              return (
                <div key={p.cle} className="space-y-4">
                  <h4 className="font-medium">{p.libelle}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={acquis}>Acquis (jours)</Label>
                      <Input
                        id={acquis}
                        type="number"
                        step="0.5"
                        value={saisie[acquis]}
                        onChange={(e) =>
                          setSaisie((s) => ({ ...s, [acquis]: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={pris}>Pris (jours)</Label>
                      <Input
                        id={pris}
                        type="number"
                        step="0.5"
                        value={saisie[pris]}
                        onChange={(e) =>
                          setSaisie((s) => ({ ...s, [pris]: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Solde</Label>
                      <div className="flex h-10 items-center justify-center text-lg font-bold">
                        {arrondi(solde)} j
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Historique */}
      <Modal
        open={historiqueOuvert}
        onOpenChange={setHistoriqueOuvert}
        type="details"
        size="lg"
        title="Historique des congés payés"
        description={
          courant
            ? `${courant.employeeName} — dates de prise des congés payés`
            : ""
        }
        actions={{
          secondary: {
            label: "Fermer",
            onClick: () => setHistoriqueOuvert(false),
            variant: "outline",
          },
        }}
      >
        {historique.length > 0 ? (
          <div className="space-y-2">
            {historique.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {formaterDate(d.startDate)} - {formaterDate(d.endDate)}
                  </p>
                  <p className="text-muted-foreground">
                    {d.totalDays} jour{d.totalDays > 1 ? "s" : ""}
                  </p>
                </div>
                <Badge variant="outline" className={STATUTS[d.status]?.classe}>
                  {STATUTS[d.status]?.label ?? d.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Aucune demande de congés payés pour ce salarié.
          </div>
        )}
      </Modal>
    </div>
  );
}
