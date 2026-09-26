"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Eye, FileCheck2, Pencil, TriangleAlert } from "lucide-react";
import type { Contract, CreateContractPayload } from "@safyr/api-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Employee } from "@/lib/types";
import { useFichesEmploi } from "@/hooks/employees/use-fiche-emploi";
import { useOrganization } from "@/hooks/organization";
import { loadPdfBranding, type PdfBranding } from "@/lib/pdf-branding";
import { heuresMensuellesVersHebdo } from "@/lib/heures-contrat";
import {
  BASE_HEURES_MENSUELLE,
  salaireProrata,
  trouverLigne,
} from "@/lib/grille-salaires";
import {
  MOTIFS_CDD,
  choisirGabarit,
  formaterNombre,
  lireNombre,
  nomFichierContrat,
  rendreContrat,
  type DonneesContrat,
  type ParagrapheRendu,
} from "@/lib/contrats/generateur";
import { GABARITS } from "@/lib/contrats/templates";
import {
  donneesInitiales,
  essaiParDefaut,
} from "@/lib/contrats/donnees-initiales";
import { fichierPdfContrat } from "@/lib/contrats/contrat-pdf";

interface GenererContratDialogProps {
  employee: Employee;
  onClose: () => void;
  /** Crée la ligne de contrat et renvoie l'id attribué par le serveur. */
  creerContrat: (payload: CreateContractPayload) => Promise<string>;
  /** Rattache le PDF au contrat (même mécanisme que « Nouveau contrat »). */
  rattacherPdf: (contratId: string, fichier: File) => Promise<void>;
}

type Mode = "saisie" | "apercu" | "genere";

/** Coordonnées de l'entreprise : chargées avant d'afficher le formulaire. */
export function GenererContratDialog(props: GenererContratDialogProps) {
  const { ficheDe, isLoading: ficheEnCours } = useFichesEmploi();
  const { data: organisation, isLoading: orgEnCours } = useOrganization();
  const { data: branding, isLoading: brandingEnCours } = useQuery({
    queryKey: ["contrat-branding", organisation?.id ?? null],
    queryFn: loadPdfBranding,
    staleTime: 0,
    gcTime: 0,
    enabled: !orgEnCours,
  });

  if (ficheEnCours || orgEnCours || brandingEnCours || !branding) {
    return (
      <Modal
        open
        onOpenChange={(o) => !o && props.onClose()}
        type="form"
        size="lg"
        title="Générer un contrat"
        actions={{
          secondary: {
            label: "Annuler",
            variant: "outline",
            onClick: props.onClose,
          },
        }}
      >
        <p className="text-sm text-muted-foreground">
          Chargement des données du salarié et de l&apos;entreprise…
        </p>
      </Modal>
    );
  }

  return (
    <Contenu
      {...props}
      branding={branding}
      donneesDepart={donneesInitiales({
        employee: props.employee,
        fiche: ficheDe(props.employee.id),
        branding,
        qualiteRepresentant: organisation?.representative?.position,
      })}
    />
  );
}

function telecharger(fichier: File) {
  // Synchrone, dans le clic : Safari refuse un téléchargement lancé après un await.
  const url = URL.createObjectURL(fichier);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = fichier.name;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : "erreur inconnue";
}

function Contenu({
  employee,
  onClose,
  creerContrat,
  rattacherPdf,
  branding,
  donneesDepart,
}: GenererContratDialogProps & {
  branding: PdfBranding;
  donneesDepart: DonneesContrat;
}) {
  const [d, setD] = useState<DonneesContrat>(donneesDepart);
  const [mode, setMode] = useState<Mode>("saisie");
  const [salaireModifie, setSalaireModifie] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [generation, setGeneration] = useState(false);
  const [fichier, setFichier] = useState<File | null>(null);
  const [contratId, setContratId] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);

  const maj = (patch: Partial<DonneesContrat>) =>
    setD((p) => ({ ...p, ...patch }));
  const majSalarie = (patch: Partial<DonneesContrat["salarie"]>) =>
    setD((p) => ({ ...p, salarie: { ...p.salarie, ...patch } }));
  const majEntreprise = (patch: Partial<DonneesContrat["entreprise"]>) =>
    setD((p) => ({ ...p, entreprise: { ...p.entreprise, ...patch } }));
  const majEmploi = (patch: Partial<DonneesContrat["emploi"]>) =>
    setD((p) => ({ ...p, emploi: { ...p.emploi, ...patch } }));

  /** Salaire de la grille pour ces heures, tant qu'il n'a pas été saisi à la main. */
  const salairePourHeures = (
    courant: DonneesContrat,
    heures: string,
  ): Partial<DonneesContrat> => {
    if (salaireModifie) return {};
    const h = lireNombre(heures);
    const ligne = trouverLigne(
      courant.emploi.categorie,
      courant.emploi.niveau,
      courant.emploi.echelon,
    );
    if (!ligne || h === null || h <= 0) return {};
    const salaire =
      Math.abs(h - BASE_HEURES_MENSUELLE) < 0.005
        ? ligne.salaire
        : salaireProrata(ligne, h);
    return {
      salaireMensuel: formaterNombre(salaire, 2).replace(/ /g, ""),
    };
  };

  const changerHeures = (v: string) =>
    setD((p) => ({ ...p, heuresMensuelles: v, ...salairePourHeures(p, v) }));

  const changerTempsPartiel = (partiel: boolean) =>
    setD((p) => {
      let heures = p.heuresMensuelles;
      const h = lireNombre(heures);
      if (!partiel) heures = formaterNombre(BASE_HEURES_MENSUELLE, 2);
      else if (h !== null && Math.abs(h - BASE_HEURES_MENSUELLE) < 0.005)
        heures = "";
      return {
        ...p,
        tempsPartiel: partiel,
        heuresMensuelles: heures,
        ...salairePourHeures(p, heures),
      };
    });

  const changerType = (type: DonneesContrat["type"]) =>
    setD((p) => ({
      ...p,
      type,
      motifCdd: type === "CDD" ? p.motifCdd || MOTIFS_CDD[0] : p.motifCdd,
    }));

  const rendu = rendreContrat(d);
  const gabarit = GABARITS[choisirGabarit(d)];

  const generer = async () => {
    setErreur(null);
    setGeneration(true);
    try {
      const pdf = await fichierPdfContrat(
        rendu,
        branding,
        nomFichierContrat(d),
      );
      setFichier(pdf);
      setEnregistre(false);
      setMode("genere");
    } catch (e) {
      setErreur(`Échec de la génération du PDF : ${message(e)}`);
    } finally {
      setGeneration(false);
    }
  };

  const enregistrer = async () => {
    if (!fichier) return;
    setErreur(null);
    if (!d.emploi.poste.trim()) {
      setErreur("Le poste est obligatoire pour enregistrer le contrat.");
      return;
    }
    if (d.type === "CDD" && !d.dateFin) {
      setErreur("Un CDD doit comporter une date de fin pour être enregistré.");
      return;
    }
    const heures = lireNombre(d.heuresMensuelles);
    const salaire = lireNombre(d.salaireMensuel);
    const payload: CreateContractPayload = {
      type: d.type as Contract["type"],
      position: d.emploi.poste.trim(),
      startDate: d.dateDebut,
      // Brouillon : le contrat n'est actif qu'une fois signé.
      status: "draft",
      ...(d.type === "CDD" && d.dateFin ? { endDate: d.dateFin } : {}),
      ...(heures !== null && heures > 0
        ? { workingHours: heuresMensuellesVersHebdo(heures) }
        : {}),
      ...(salaire !== null ? { grossSalary: salaire } : {}),
      ...(d.essai.actif && d.essai.fin
        ? { trialPeriodEndDate: d.essai.fin }
        : {}),
      ...(d.type === "CDD" && d.motifCdd
        ? { notes: `Motif : ${d.motifCdd}` }
        : {}),
    };
    setEnregistrement(true);
    let id = contratId;
    try {
      // `creerContrat` renvoie l'id serveur : l'id local n'est pas utilisable.
      if (!id) {
        id = await creerContrat(payload);
        setContratId(id);
      }
      await rattacherPdf(id, fichier);
      setEnregistre(true);
    } catch (e) {
      setErreur(
        id
          ? `Le contrat a été créé mais le PDF n'a pas pu être rattaché : ${message(e)}. Cliquez à nouveau sur « Enregistrer dans le dossier » pour réessayer.`
          : `Échec de l'enregistrement : ${message(e)}`,
      );
    } finally {
      setEnregistrement(false);
    }
  };

  const nbManquants = rendu.manquants.length;

  const actions =
    mode === "genere"
      ? {
          primary: {
            label: enregistrement
              ? "Enregistrement…"
              : enregistre
                ? "Enregistré dans le dossier"
                : "Enregistrer dans le dossier",
            icon: <FileCheck2 className="h-4 w-4" />,
            onClick: () => void enregistrer(),
            disabled: enregistrement || enregistre,
          },
          secondary: {
            label: "Fermer",
            variant: "outline" as const,
            onClick: onClose,
          },
          tertiary: {
            label: "Télécharger",
            icon: <Download className="h-4 w-4" />,
            variant: "outline" as const,
            onClick: () => fichier && telecharger(fichier),
            disabled: !fichier,
          },
        }
      : {
          primary: {
            label: generation ? "Génération…" : "Générer le PDF",
            onClick: () => void generer(),
            disabled: generation,
          },
          secondary: {
            label: "Annuler",
            variant: "outline" as const,
            onClick: onClose,
          },
          tertiary:
            mode === "saisie"
              ? {
                  label: "Aperçu du texte",
                  icon: <Eye className="h-4 w-4" />,
                  variant: "outline" as const,
                  onClick: () => setMode("apercu"),
                }
              : {
                  label: "Modifier les paramètres",
                  icon: <Pencil className="h-4 w-4" />,
                  variant: "outline" as const,
                  onClick: () => setMode("saisie"),
                },
        };

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      type="form"
      size="lg"
      title={`Générer un contrat — ${employee.firstName} ${employee.lastName}`}
      description={`Modèle : ${gabarit.libelle}. Gabarit générique, à remplacer par le modèle du client.`}
      actions={actions}
    >
      <div className="space-y-4">
        {erreur && <p className="text-sm text-destructive">{erreur}</p>}

        {mode !== "saisie" && nbManquants > 0 && (
          <Manquants libelles={rendu.manquants} />
        )}

        {mode === "saisie" && (
          <Formulaire
            d={d}
            maj={maj}
            majSalarie={majSalarie}
            majEntreprise={majEntreprise}
            majEmploi={majEmploi}
            changerType={changerType}
            changerTempsPartiel={changerTempsPartiel}
            changerHeures={changerHeures}
            modifierSalaire={(v) => {
              setSalaireModifie(true);
              maj({ salaireMensuel: v });
            }}
            nbManquants={nbManquants}
          />
        )}

        {mode === "apercu" && <Apercu rendu={rendu} />}

        {mode === "genere" && fichier && (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="font-medium">Le contrat est prêt.</p>
            <p className="mt-1 text-muted-foreground">
              {fichier.name} ({Math.max(1, Math.round(fichier.size / 1024))}{" "}
              Ko). Téléchargez-le, ou enregistrez-le dans le dossier : une ligne
              « Brouillon » est créée dans l&apos;historique des contrats et le
              PDF y est rattaché.
            </p>
            {enregistre && (
              <p className="mt-2 text-emerald-600 dark:text-emerald-400">
                Contrat enregistré dans le dossier du salarié.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Manquants({ libelles }: { libelles: string[] }) {
  return (
    <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">
          {libelles.length} champ{libelles.length > 1 ? "s" : ""} à compléter
        </p>
        <p>
          {libelles.join(" · ")}. Dans le PDF, ces champs restent en pointillés
          à remplir à la main.
        </p>
      </div>
    </div>
  );
}

function ParagrapheAffiche({ p }: { p: ParagrapheRendu }) {
  return (
    <p
      className={
        p.style === "gras"
          ? "font-semibold"
          : p.style === "centre"
            ? "text-center font-semibold"
            : p.puce
              ? "pl-4"
              : undefined
      }
    >
      {p.puce && "• "}
      {p.segments.map((s, i) =>
        "t" in s ? (
          <span key={i}>{s.t}</span>
        ) : (
          <mark
            key={i}
            className="rounded bg-amber-200 px-1 text-amber-950 dark:bg-amber-800 dark:text-amber-50"
          >
            À compléter : {s.manquant}
          </mark>
        ),
      )}
    </p>
  );
}

function Apercu({ rendu }: { rendu: ReturnType<typeof rendreContrat> }) {
  return (
    <div className="max-h-[60vh] space-y-3 overflow-y-auto rounded-lg border bg-background p-4 text-sm leading-relaxed">
      <p className="text-center text-base font-bold">{rendu.titre}</p>
      <p className="text-center text-xs text-muted-foreground">
        {rendu.sousTitre}
      </p>
      {rendu.intro.map((p, i) => (
        <ParagrapheAffiche key={i} p={p} />
      ))}
      {rendu.articles.map((a) => (
        <section key={a.id} className="space-y-2">
          <h4 className="pt-2 font-semibold">
            Article {a.numero} – {a.titre}
          </h4>
          {a.paragraphes.map((p, i) => (
            <ParagrapheAffiche key={i} p={p} />
          ))}
        </section>
      ))}
      <div className="pt-3">
        <ParagrapheAffiche p={rendu.cloture} />
        <div className="mt-3 grid grid-cols-2 gap-4">
          {rendu.signataires.map((s) => (
            <div key={s.libelle}>
              <p className="font-semibold">{s.libelle}</p>
              <p className="text-xs text-muted-foreground">{s.mention}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Formulaire ─────────────────────────────────────────────────────────

function Champ({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  aide,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  aide?: string;
  inputMode?: "decimal" | "numeric";
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {aide && <p className="mt-1 text-xs text-muted-foreground">{aide}</p>}
    </div>
  );
}

function Section({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-semibold">{titre}</legend>
      {children}
    </fieldset>
  );
}

function Formulaire({
  d,
  maj,
  majSalarie,
  majEntreprise,
  majEmploi,
  changerType,
  changerTempsPartiel,
  changerHeures,
  modifierSalaire,
  nbManquants,
}: {
  d: DonneesContrat;
  maj: (p: Partial<DonneesContrat>) => void;
  majSalarie: (p: Partial<DonneesContrat["salarie"]>) => void;
  majEntreprise: (p: Partial<DonneesContrat["entreprise"]>) => void;
  majEmploi: (p: Partial<DonneesContrat["emploi"]>) => void;
  changerType: (t: DonneesContrat["type"]) => void;
  changerTempsPartiel: (p: boolean) => void;
  changerHeures: (v: string) => void;
  modifierSalaire: (v: string) => void;
  nbManquants: number;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Les champs sont pré-remplis depuis le dossier du salarié, sa fiche
        emploi et « Mon entreprise » ; tout reste modifiable.{" "}
        {nbManquants > 0
          ? `${nbManquants} champ${nbManquants > 1 ? "s" : ""} à compléter (voir l'aperçu).`
          : "Aucun champ manquant."}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="gc-type">Type de contrat</Label>
          <Select
            value={d.type}
            onValueChange={(v) => changerType(v as DonneesContrat["type"])}
          >
            <SelectTrigger id="gc-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CDI">CDI (durée indéterminée)</SelectItem>
              <SelectItem value="CDD">CDD (durée déterminée)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="gc-duree">Durée du travail</Label>
          <Select
            value={d.tempsPartiel ? "partiel" : "plein"}
            onValueChange={(v) => changerTempsPartiel(v === "partiel")}
          >
            <SelectTrigger id="gc-duree">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plein">Temps plein</SelectItem>
              <SelectItem value="partiel">Temps partiel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Section titre="Emploi et durée">
        <Champ
          id="gc-poste"
          label="Poste"
          value={d.emploi.poste}
          onChange={(v) => majEmploi({ poste: v })}
        />
        <div className="grid gap-3 sm:grid-cols-4">
          <Champ
            id="gc-cat"
            label="Catégorie"
            value={d.emploi.categorie}
            onChange={(v) => majEmploi({ categorie: v })}
          />
          <Champ
            id="gc-niv"
            label="Niveau"
            value={d.emploi.niveau}
            onChange={(v) => majEmploi({ niveau: v })}
          />
          <Champ
            id="gc-ech"
            label="Échelon"
            value={d.emploi.echelon}
            onChange={(v) => majEmploi({ echelon: v })}
          />
          <Champ
            id="gc-coef"
            label="Coefficient"
            value={d.emploi.coefficient}
            onChange={(v) => majEmploi({ coefficient: v })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Champ
            id="gc-debut"
            label="Date de début"
            type="date"
            value={d.dateDebut}
            onChange={(v) => maj({ dateDebut: v })}
          />
          {d.type === "CDD" && (
            <Champ
              id="gc-fin"
              label="Date de fin (terme)"
              type="date"
              value={d.dateFin}
              onChange={(v) => maj({ dateFin: v })}
            />
          )}
        </div>
        {d.type === "CDD" && (
          <>
            <div>
              <Label htmlFor="gc-motif">Motif de recours</Label>
              <Select
                value={d.motifCdd}
                onValueChange={(v) => maj({ motifCdd: v })}
              >
                <SelectTrigger id="gc-motif">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOTIFS_CDD.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gc-precision">Précisions sur le motif</Label>
              <Textarea
                id="gc-precision"
                value={d.precisionCdd}
                onChange={(e) => maj({ precisionCdd: e.target.value })}
                placeholder="Nom et qualification du salarié remplacé, nature de l'accroissement d'activité…"
              />
            </div>
          </>
        )}
        <div className="flex items-center gap-2">
          <Checkbox
            id="gc-essai"
            checked={d.essai.actif}
            onCheckedChange={(c) =>
              maj({
                essai: {
                  actif: c === true,
                  fin: d.essai.fin || (c === true ? essaiParDefaut(d) : ""),
                },
              })
            }
          />
          <Label htmlFor="gc-essai">Prévoir une période d&apos;essai</Label>
        </div>
        {d.essai.actif && (
          <Champ
            id="gc-essai-fin"
            label="Fin de la période d'essai (incluse)"
            type="date"
            value={d.essai.fin}
            onChange={(v) => maj({ essai: { actif: true, fin: v } })}
            aide="Pré-remplie depuis la fiche emploi, ou proposée selon le type de contrat."
          />
        )}
        <div>
          <Label htmlFor="gc-lieu">
            Lieu de travail / sites d&apos;affectation
          </Label>
          <Textarea
            id="gc-lieu"
            value={d.lieuTravail}
            onChange={(e) => maj({ lieuTravail: e.target.value })}
            placeholder="Ex. : centre commercial X, 75001 Paris ; site Y…"
          />
        </div>
        <Champ
          id="gc-heures"
          label="Heures par mois"
          inputMode="decimal"
          value={d.heuresMensuelles}
          onChange={changerHeures}
          aide="Saisies telles quelles (151,67 pour un temps plein de 35 h)."
        />
        {d.tempsPartiel ? (
          <div>
            <Label htmlFor="gc-repartition">
              Répartition de la durée du travail
            </Label>
            <Textarea
              id="gc-repartition"
              value={d.repartition}
              onChange={(e) => maj({ repartition: e.target.value })}
              placeholder="Jours de la semaine ou semaines du mois travaillés, plages horaires…"
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="gc-horaires">Horaires (facultatif)</Label>
            <Textarea
              id="gc-horaires"
              value={d.horaires}
              onChange={(e) => maj({ horaires: e.target.value })}
              placeholder="Ex. : alternance jour/nuit selon planning"
            />
          </div>
        )}
      </Section>

      <Section titre="Rémunération">
        <div className="grid gap-3 sm:grid-cols-2">
          <Champ
            id="gc-taux"
            label="Taux horaire brut (€)"
            inputMode="decimal"
            value={d.tauxHoraire}
            onChange={(v) => maj({ tauxHoraire: v })}
          />
          <Champ
            id="gc-salaire"
            label="Salaire mensuel brut (€)"
            inputMode="decimal"
            value={d.salaireMensuel}
            onChange={modifierSalaire}
          />
        </div>
      </Section>

      <Section titre="Clauses optionnelles">
        <div className="flex items-center gap-2">
          <Checkbox
            id="gc-tenue"
            checked={d.options.tenue}
            onCheckedChange={(c) =>
              maj({ options: { ...d.options, tenue: c === true } })
            }
          />
          <Label htmlFor="gc-tenue">Tenue de travail et équipements</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="gc-mobilite"
            checked={d.options.mobilite}
            onCheckedChange={(c) =>
              maj({ options: { ...d.options, mobilite: c === true } })
            }
          />
          <Label htmlFor="gc-mobilite">Clause de mobilité</Label>
        </div>
        {d.options.mobilite && (
          <Champ
            id="gc-mobilite-zone"
            label="Zone géographique de mobilité"
            value={d.mobiliteZone}
            onChange={(v) => maj({ mobiliteZone: v })}
          />
        )}
        <div className="flex items-center gap-2">
          <Checkbox
            id="gc-dedit"
            checked={d.options.dedit}
            onCheckedChange={(c) =>
              maj({ options: { ...d.options, dedit: c === true } })
            }
          />
          <Label htmlFor="gc-dedit">Clause de dédit-formation</Label>
        </div>
        {d.options.dedit && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Champ
              id="gc-dedit-formation"
              label="Formation"
              value={d.dedit.formation}
              onChange={(v) => maj({ dedit: { ...d.dedit, formation: v } })}
            />
            <Champ
              id="gc-dedit-duree"
              label="Engagement (mois)"
              inputMode="numeric"
              value={d.dedit.dureeMois}
              onChange={(v) => maj({ dedit: { ...d.dedit, dureeMois: v } })}
            />
            <Champ
              id="gc-dedit-cout"
              label="Coût réel (€)"
              inputMode="decimal"
              value={d.dedit.cout}
              onChange={(v) => maj({ dedit: { ...d.dedit, cout: v } })}
            />
          </div>
        )}
        <Champ
          id="gc-organismes"
          label="Organismes de retraite complémentaire et de prévoyance"
          value={d.organismes}
          onChange={(v) => maj({ organismes: v })}
          aide="Obligatoire dans un CDD (article L. 1242-12)."
        />
        <div>
          <Label htmlFor="gc-clauses">Clauses particulières</Label>
          <Textarea
            id="gc-clauses"
            value={d.clausesParticulieres}
            onChange={(e) => maj({ clausesParticulieres: e.target.value })}
            placeholder="Une clause par ligne (facultatif)"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Champ
            id="gc-sign-lieu"
            label="Fait à (facultatif)"
            value={d.signature.lieu}
            onChange={(v) => maj({ signature: { ...d.signature, lieu: v } })}
            aide="Laissez vide pour compléter à la main."
          />
          <Champ
            id="gc-sign-date"
            label="Le (facultatif)"
            type="date"
            value={d.signature.date}
            onChange={(v) => maj({ signature: { ...d.signature, date: v } })}
          />
        </div>
      </Section>

      <details className="rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-semibold">
          Identité du salarié et de l&apos;employeur
        </summary>
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="gc-civ">Civilité</Label>
              <Select
                value={d.salarie.civilite || "aucune"}
                onValueChange={(v) =>
                  majSalarie({ civilite: v === "aucune" ? "" : v })
                }
              >
                <SelectTrigger id="gc-civ">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aucune">Non renseignée</SelectItem>
                  <SelectItem value="Monsieur">Monsieur</SelectItem>
                  <SelectItem value="Madame">Madame</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Champ
              id="gc-prenom"
              label="Prénom"
              value={d.salarie.prenom}
              onChange={(v) => majSalarie({ prenom: v })}
            />
            <Champ
              id="gc-nom"
              label="Nom"
              value={d.salarie.nom}
              onChange={(v) => majSalarie({ nom: v })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Champ
              id="gc-naiss"
              label="Date de naissance"
              type="date"
              value={d.salarie.dateNaissance}
              onChange={(v) => majSalarie({ dateNaissance: v })}
            />
            <Champ
              id="gc-lieu-naiss"
              label="Lieu de naissance"
              value={d.salarie.lieuNaissance}
              onChange={(v) => majSalarie({ lieuNaissance: v })}
            />
            <Champ
              id="gc-nat"
              label="Nationalité"
              value={d.salarie.nationalite}
              onChange={(v) => majSalarie({ nationalite: v })}
            />
          </div>
          <Champ
            id="gc-adresse"
            label="Adresse du salarié"
            value={d.salarie.adresse}
            onChange={(v) => majSalarie({ adresse: v })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Champ
              id="gc-secu"
              label="N° de sécurité sociale"
              value={d.salarie.numSecu}
              onChange={(v) => majSalarie({ numSecu: v })}
            />
            <Champ
              id="gc-cartepro"
              label="N° de carte professionnelle"
              value={d.salarie.cartePro}
              onChange={(v) => majSalarie({ cartePro: v })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Champ
              id="gc-ent-nom"
              label="Entreprise"
              value={d.entreprise.nom}
              onChange={(v) => majEntreprise({ nom: v })}
            />
            <Champ
              id="gc-ent-capital"
              label="Capital"
              value={d.entreprise.capital}
              onChange={(v) => majEntreprise({ capital: v })}
            />
          </div>
          <Champ
            id="gc-ent-adresse"
            label="Siège social"
            value={d.entreprise.adresse}
            onChange={(v) => majEntreprise({ adresse: v })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Champ
              id="gc-ent-siret"
              label="SIRET"
              value={d.entreprise.siret}
              onChange={(v) => majEntreprise({ siret: v })}
            />
            <Champ
              id="gc-ent-cnaps"
              label="N° d'autorisation CNAPS"
              value={d.entreprise.cnaps}
              onChange={(v) => majEntreprise({ cnaps: v })}
            />
            <Champ
              id="gc-ent-rep"
              label="Représentant de l'employeur"
              value={d.entreprise.representant}
              onChange={(v) => majEntreprise({ representant: v })}
            />
            <Champ
              id="gc-ent-qualite"
              label="En qualité de"
              value={d.entreprise.qualite}
              onChange={(v) => majEntreprise({ qualite: v })}
            />
          </div>
        </div>
      </details>
    </div>
  );
}
