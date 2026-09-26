"use client";

import { useState } from "react";
import { ApiError, sendCommunicationEmail } from "@safyr/api-client";
import { cn } from "@/lib/utils";
import { useRegistre, useUpdateFiscalRecord } from "@/hooks/fiscal";
import { useOrganization } from "@/hooks/organization";
import { useMailboxStatus } from "@/hooks/mailbox";
import { downloadStoredFile, type StoredFile } from "@/lib/document-files";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoCard, InfoCardContainer } from "@/components/ui/info-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneField } from "@/components/ui/phone-field";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { RowActionsMenu } from "@/components/ui/row-actions-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  AlertTriangle,
  Building,
  Mail,
  Send,
  Plus,
  Trash2,
  Search,
  Users,
  Shield,
  Heart,
  Calculator,
  Phone,
  Landmark,
  CheckCircle2,
  Clock,
  Archive,
} from "lucide-react";

const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Message affiché quand l'envoi d'un e-mail échoue. Le serveur renvoie déjà un
 * texte français explicite (service non configuré, adresse refusée…) ; seuls
 * les échecs réseau, qui n'ont pas de réponse du serveur, sont traduits ici.
 */
function messageErreurEnvoi(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === "TIMEOUT") {
      return "Le serveur met trop de temps à répondre. Réessayez dans un instant.";
    }
    if (e.code === "NETWORK_ERROR") {
      return "Impossible de joindre le serveur. Vérifiez votre connexion internet.";
    }
    if (e.code === "INTERNAL_ERROR" || e.code === "HTTP_ERROR") {
      return "L'envoi d'e-mail a échoué côté serveur. Réessayez ou contactez le support.";
    }
    return e.message;
  }
  return e instanceof Error ? e.message : "Erreur inconnue.";
}

/** Ouvre la pièce réellement déposée ; explique si la ligne n'en a pas. */
function ouvrirPiece(piece: StoredFile | null | undefined, libelle: string) {
  if (!piece) {
    alert(`Aucun fichier n'a été déposé pour « ${libelle} ».`);
    return;
  }
  void downloadStoredFile(piece);
}

const DOC_STATUTS = [
  { value: "en_attente", label: "En attente" },
  { value: "en_cours", label: "En cours" },
  { value: "traite", label: "Traité" },
];

/** Un numéro ou une adresse, avec l'interlocuteur concerné (ex. « Mme Martin »). */
interface Contact {
  label?: string;
  value: string;
}

interface Organisme {
  id: string;
  nom: string;
  type: string;
  description: string;
  icon: string;
  couleur: string;
  code?: string;
  telephones?: Contact[];
  emails?: Contact[];
  /** Anciens champs à valeur unique, conservés pour la compatibilité. */
  telephone?: string;
  email?: string;
}

/** Coordonnées d'un organisme, en reprenant les anciens champs à valeur unique. */
function contactsDe(organisme: Organisme): {
  telephones: Contact[];
  emails: Contact[];
} {
  const propres = (
    liste: Contact[] | undefined,
    ancien: string | undefined,
  ) => {
    const lignes = (liste ?? []).filter((c) => c?.value?.trim());
    if (lignes.length > 0) return lignes;
    return ancien?.trim() ? [{ value: ancien.trim() }] : [];
  };
  return {
    telephones: propres(organisme.telephones, organisme.telephone),
    emails: propres(organisme.emails, organisme.email),
  };
}

/** « 0666666666 » → « 06 66 66 66 66 » ; toute autre saisie reste telle quelle. */
function formaterTelephone(valeur: string): string {
  return /^\d{10}$/.test(valeur)
    ? valeur.replace(/(\d{2})(?=\d)/g, "$1 ")
    : valeur;
}

interface FormulaireOrganisme {
  nom: string;
  type: string;
  description: string;
  code: string;
  telephones: Contact[];
  emails: Contact[];
}

const FORMULAIRE_ORGANISME_VIDE: FormulaireOrganisme = {
  nom: "",
  type: "",
  description: "",
  code: "",
  telephones: [{ label: "", value: "" }],
  emails: [{ label: "", value: "" }],
};

interface Document {
  id: string;
  organismeId: string;
  nom: string;
  type: string;
  dateAjout: string;
  dateModification: string;
  taille: string;
  tags: string[];
  description: string;
  urgent: boolean;
}

interface Courrier {
  id: string;
  organismeId: string;
  objet: string;
  type: "recu" | "envoye";
  date: string;
  expediteur: string;
  destinataire: string;
  statut: "lu" | "non_lu" | "traite" | "en_cours" | "archive";
  pieceJointe: string | null;
  /** Adresse email utilisée pour l'envoi réel, le cas échéant (courriers sortants). */
  emailDestinataire?: string;
  /** Corps du message envoyé par email. */
  message?: string;
  /** Document à l'origine de ce courrier, s'il a été créé depuis son menu. */
  documentId?: string;
}

/**
 * Organismes reconnus : logo (icône) et couleur cohérents à la création,
 * plutôt que la même icône "building" bleue pour tout le monde. Détection
 * sur le nom saisi, insensible à la casse/accents.
 */
const ORGANISMES_CONNUS: {
  motsCles: string[];
  icon: string;
  couleur: string;
}[] = [
  { motsCles: ["urssaf"], icon: "shield", couleur: "orange" },
  {
    motsCles: ["dgfip", "impot", "impots", "sie", "dgi"],
    icon: "landmark",
    couleur: "green",
  },
  { motsCles: ["akto", "opco"], icon: "users", couleur: "purple" },
  {
    motsCles: ["tresor", "trésor"],
    icon: "landmark",
    couleur: "teal",
  },
  {
    motsCles: ["mutuelle", "assurance", "prevoyance", "prévoyance"],
    icon: "heart",
    couleur: "red",
  },
  {
    motsCles: ["carsat", "retraite", "caisse"],
    icon: "calculator",
    couleur: "indigo",
  },
  {
    motsCles: ["pole emploi", "pôle emploi", "france travail"],
    icon: "phone",
    couleur: "blue",
  },
];

function normaliser(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function styleOrganisme(nom: string): { icon: string; couleur: string } {
  const nomNormalise = normaliser(nom);
  const connu = ORGANISMES_CONNUS.find((o) =>
    o.motsCles.some((mot) => nomNormalise.includes(mot)),
  );
  return connu ?? { icon: "building", couleur: "blue" };
}

/** Vrai logo (image) des organismes les plus courants, à la place de l'icône générique. */
const LOGOS_CONNUS: { motsCles: string[]; src: string; alt: string }[] = [
  { motsCles: ["urssaf"], src: "/logos/urssaf.png", alt: "URSSAF" },
  {
    motsCles: ["dgfip", "impot", "impots", "sie", "dgi"],
    src: "/logos/dgfip.png",
    alt: "DGFIP",
  },
  { motsCles: ["akto"], src: "/logos/akto.png", alt: "AKTO" },
  {
    motsCles: ["mutelios"],
    src: "/logos/mutelios.png",
    alt: "Mutélios",
  },
];

function logoOrganisme(nom: string): { src: string; alt: string } | null {
  const nomNormalise = normaliser(nom);
  return (
    LOGOS_CONNUS.find((o) =>
      o.motsCles.some((mot) => nomNormalise.includes(mot)),
    ) ?? null
  );
}

/**
 * Types de documents acceptés pour un organisme donné. URSSAF ne traite ici
 * que du courrier ; DGFIP/Impôts, du courrier et des attestations. Les
 * autres organismes gardent la liste complète.
 */
function typesDocumentsPour(nom: string): string[] {
  const nomNormalise = normaliser(nom);
  if (nomNormalise.includes("urssaf")) return ["courrier"];
  if (
    ["dgfip", "impot", "impots", "sie", "dgi"].some((mot) =>
      nomNormalise.includes(mot),
    )
  ) {
    return ["courrier", "attestation"];
  }
  return [
    "attestation",
    "contrat",
    "courrier",
    "releve",
    "facture",
    "devis",
    "convention",
  ];
}

/** Document d'organisme tel qu'enregistré : la pièce est un champ à part. */
type DocumentEnregistre = Document & { fichier?: StoredFile | null };
type CourrierEnregistre = Omit<Courrier, "pieceJointe"> & {
  piece?: StoredFile | null;
};

export default function DiversDocumentsPage() {
  // Organismes, documents et courriers enregistrés en base : cet écran ne
  // conservait rien, les dépôts disparaissaient à la reconnexion et les
  // boutons d'ajout n'étaient reliés à rien.
  const registreOrganismes = useRegistre<Organisme>("organisme", []);
  const registreDocuments = useRegistre<DocumentEnregistre>("divers", [
    "fichier",
  ]);
  const registreCourriers = useRegistre<CourrierEnregistre>(
    "courrier_organisme",
    ["piece"],
  );
  // Renomme "Document" → le nom réel une fois le fichier déposé (voir
  // handleAjouterDocument). Appel direct plutôt que registreDocuments.
  // enregistrer(...) : celui-ci s'appuie sur la liste "records" capturée au
  // rendu précédent pour savoir si la ligne existe déjà, or elle vient
  // d'être créée par le même appel — la liste est encore l'ancienne. Il
  // concluait donc à tort "ligne inconnue" et EN CRÉAIT UNE SECONDE, avec le
  // bon nom mais sans le fichier (resté attaché à la première, restée
  // nommée "Document"). Une mise à jour directe sur l'identifiant connu
  // n'a pas ce problème.
  const renommerDocument = useUpdateFiscalRecord();

  // Adresse du compte : c'est elle qui sert d'adresse d'envoi affichée (les
  // réponses arrivent dessus, voir CommunicationController côté serveur).
  const { data: organisation } = useOrganization();
  // Si la société a connecté sa boîte mail, c'est elle qui envoie (et reçoit
  // les réponses) : on l'affiche à la place de l'adresse de la fiche.
  const { data: boiteMail } = useMailboxStatus();
  const emailBoite = boiteMail?.connected ? (boiteMail.email ?? "") : "";
  const emailCompte = emailBoite || (organisation?.email?.trim() ?? "");

  const organismes = registreOrganismes.lignes;
  const documents = registreDocuments.lignes;
  const courriers = registreCourriers.lignes;
  const [erreurDepot, setErreurDepot] = useState<string | null>(null);

  const [selectedOrganisme, setSelectedOrganisme] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isAddingOrganisme, setIsAddingOrganisme] = useState(false);
  const [docStatuts, setDocStatuts] = useState<Record<string, string>>({});
  // Organisme visé par un dépôt, en attente du choix du type de document.
  const [organismeDocAAjouter, setOrganismeDocAAjouter] = useState<
    string | null
  >(null);
  const [typeDocAAjouter, setTypeDocAAjouter] = useState("attestation");
  const [isAddingCourrier, setIsAddingCourrier] = useState(false);
  // Document depuis lequel "Envoyer un courrier" a été déclenché, s'il y en a un.
  const [documentPourCourrier, setDocumentPourCourrier] = useState<
    string | null
  >(null);
  const [envoiCourrierEnCours, setEnvoiCourrierEnCours] = useState(false);
  const [erreurEnvoiCourrier, setErreurEnvoiCourrier] = useState<string | null>(
    null,
  );
  const [newCourrier, setNewCourrier] = useState({
    objet: "",
    type: "recu" as "recu" | "envoye",
    date: new Date().toISOString().split("T")[0],
    expediteur: "",
    destinataire: "",
    emailDestinataire: "",
    message: "",
  });
  // Formulaire d'organisme : sert à l'ajout comme à la modification
  // (`organismeEditeId` renseigné = modification de cet organisme).
  const [newOrganisme, setNewOrganisme] = useState<FormulaireOrganisme>(
    FORMULAIRE_ORGANISME_VIDE,
  );
  const [organismeEditeId, setOrganismeEditeId] = useState<string | null>(null);
  const [erreurOrganisme, setErreurOrganisme] = useState<string | null>(null);
  const [organismeVuId, setOrganismeVuId] = useState<string | null>(null);
  // Document / courrier en cours de modification ou de consultation.
  const [documentEdite, setDocumentEdite] = useState<DocumentEnregistre | null>(
    null,
  );
  const [courrierEdite, setCourrierEdite] = useState<CourrierEnregistre | null>(
    null,
  );
  const [courrierVu, setCourrierVu] = useState<CourrierEnregistre | null>(null);

  const getIconComponent = (iconName: string) => {
    const icons = {
      shield: Shield,
      users: Users,
      heart: Heart,
      calculator: Calculator,
      landmark: Landmark,
      phone: Phone,
      mail: Mail,
      building: Building,
    };
    return icons[iconName as keyof typeof icons] || Building;
  };

  const getCouleurClasses = (couleur: string) => {
    const couleurs = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      green: "bg-green-100 text-green-800 border-green-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      red: "bg-red-100 text-red-800 border-red-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
      teal: "bg-teal-100 text-teal-800 border-teal-200",
      gray: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return (
      couleurs[couleur as keyof typeof couleurs] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getOrganismeDocuments = (organismeId: string) => {
    let filtered = documents.filter((doc) => doc.organismeId === organismeId);

    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((doc) => doc.type === selectedType);
    }

    return filtered;
  };

  const getOrganismeCourriers = (organismeId: string) => {
    return courriers.filter((courrier) => courrier.organismeId === organismeId);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "lu":
      case "traite":
        return "bg-green-500";
      // Archivé = bleu, distinct de « Traité » (vert).
      case "archive":
        return "bg-blue-500";
      case "en_cours":
        return "bg-orange-500";
      case "non_lu":
        return "bg-red-500";
      case "en_attente":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatutText = (statut: string) => {
    switch (statut) {
      case "lu":
        return "Lu";
      case "non_lu":
        return "Non lu";
      case "traite":
        return "Traité";
      case "en_cours":
        return "En cours";
      case "en_attente":
        return "En attente";
      case "archive":
        return "Archivé";
      default:
        return "Inconnu";
    }
  };

  /**
   * Dépose un document pour l'organisme choisi : le fichier part dans le
   * stockage et la ligne est créée en base. Les deux boutons d'ajout de cette
   * page n'étaient reliés à rien.
   */
  const handleAjouterDocument = async (organismeId: string, type: string) => {
    setErreurDepot(null);
    const organisme = organismes.find((o) => o.id === organismeId);
    if (!organisme) {
      setErreurDepot("Sélectionnez d'abord un organisme.");
      return;
    }
    const aujourdhui = new Date().toISOString().split("T")[0];
    const brouillon: DocumentEnregistre = {
      id: `doc-${Date.now()}`,
      organismeId,
      nom: "Document",
      type,
      dateAjout: aujourdhui,
      dateModification: aujourdhui,
      taille: "",
      tags: [],
      description: "",
      urgent: false,
    };
    try {
      const depose = await registreDocuments.televerserPiece(
        brouillon,
        "fichier",
        { period: aujourdhui.slice(0, 4), label: organisme.nom },
      );
      if (!depose) return;
      // Le nom du fichier déposé devient le libellé de la ligne, sur la
      // ligne réellement créée par le dépôt ci-dessus.
      const { id: _brouillonId, ...champsMeta } = brouillon;
      await renommerDocument.mutateAsync({
        recordId: depose.id,
        payload: {
          period: aujourdhui.slice(0, 4),
          label: organisme.nom,
          meta: { ...champsMeta, nom: depose.nom },
        },
      });
    } catch (e) {
      setErreurDepot(
        e instanceof Error ? e.message : "Le dépôt du document a échoué.",
      );
    }
  };

  /** Supprime un organisme ainsi que ses documents et courriers. */
  const handleDeleteOrganisme = async (organisme: Organisme) => {
    if (
      !confirm(
        `Supprimer l'organisme « ${organisme.nom} » ? Ses documents et courriers seront également supprimés.`,
      )
    ) {
      return;
    }
    const docs = documents.filter((d) => d.organismeId === organisme.id);
    const lettres = courriers.filter((c) => c.organismeId === organisme.id);
    await Promise.all([
      ...docs.map((d) => registreDocuments.supprimerLigne(d.id)),
      ...lettres.map((c) => registreCourriers.supprimerLigne(c.id)),
    ]);
    await registreOrganismes.supprimerLigne(organisme.id);
    if (selectedOrganisme === organisme.id) setSelectedOrganisme("");
  };

  const ouvrirAjoutOrganisme = () => {
    setOrganismeEditeId(null);
    setNewOrganisme(FORMULAIRE_ORGANISME_VIDE);
    setErreurOrganisme(null);
    setIsAddingOrganisme(true);
  };

  /** Même formulaire que l'ajout, pré-rempli avec les coordonnées connues. */
  const ouvrirModifOrganisme = (organisme: Organisme) => {
    const { telephones, emails } = contactsDe(organisme);
    setOrganismeEditeId(organisme.id);
    setNewOrganisme({
      nom: organisme.nom,
      type: organisme.type,
      description: organisme.description ?? "",
      code: organisme.code ?? "",
      telephones: telephones.length
        ? telephones.map((t) => ({ label: t.label ?? "", value: t.value }))
        : [{ label: "", value: "" }],
      emails: emails.length
        ? emails.map((m) => ({ label: m.label ?? "", value: m.value }))
        : [{ label: "", value: "" }],
    });
    setErreurOrganisme(null);
    setIsAddingOrganisme(true);
  };

  const majContact = (
    champ: "telephones" | "emails",
    index: number,
    changes: Partial<Contact>,
  ) =>
    setNewOrganisme((f) => ({
      ...f,
      [champ]: f[champ].map((c, i) => (i === index ? { ...c, ...changes } : c)),
    }));

  const ajouterContact = (champ: "telephones" | "emails") =>
    setNewOrganisme((f) => ({
      ...f,
      [champ]: [...f[champ], { label: "", value: "" }],
    }));

  const retirerContact = (champ: "telephones" | "emails", index: number) =>
    setNewOrganisme((f) => ({
      ...f,
      [champ]: f[champ].filter((_, i) => i !== index),
    }));

  const handleSaveOrganisme = async () => {
    if (!newOrganisme.nom.trim() || !newOrganisme.type) {
      setErreurOrganisme("Le nom et le type de l'organisme sont obligatoires.");
      return;
    }
    // On écarte les lignes vides ; le libellé d'interlocuteur reste facultatif.
    const nettoyer = (liste: Contact[]): Contact[] =>
      liste
        .map((c) => ({ label: c.label?.trim() ?? "", value: c.value.trim() }))
        .filter((c) => c.value)
        .map((c) => (c.label ? c : { value: c.value }));
    const telephones = nettoyer(newOrganisme.telephones);
    const emails = nettoyer(newOrganisme.emails);
    const invalide = emails.find((m) => !EMAIL_VALIDE.test(m.value));
    if (invalide) {
      setErreurOrganisme(
        `L'adresse e-mail « ${invalide.value} » n'est pas valide (exemple : contact@organisme.fr).`,
      );
      return;
    }
    const existant = organismeEditeId
      ? organismes.find((o) => o.id === organismeEditeId)
      : undefined;
    const nom = newOrganisme.nom.trim();
    // Le style (logo, couleur) suit le nom ; on ne le recalcule que s'il change.
    const style =
      existant && existant.nom === nom
        ? { icon: existant.icon, couleur: existant.couleur }
        : styleOrganisme(nom);
    const organisme: Organisme = {
      id: existant?.id ?? Date.now().toString(),
      nom,
      type: newOrganisme.type,
      description: newOrganisme.description,
      ...style,
      code: newOrganisme.code.trim(),
      telephones,
      emails,
      // Anciens champs : premier numéro / première adresse, pour les lecteurs
      // qui ne connaissent pas encore les listes.
      telephone: telephones[0]?.value ?? "",
      email: emails[0]?.value ?? "",
    };
    setErreurOrganisme(null);
    try {
      await registreOrganismes.enregistrer(organisme, {
        period: String(new Date().getFullYear()),
        label: organisme.nom,
      });
    } catch (e) {
      setErreurOrganisme(
        e instanceof Error ? e.message : "L'enregistrement a échoué.",
      );
      return;
    }
    setNewOrganisme(FORMULAIRE_ORGANISME_VIDE);
    setOrganismeEditeId(null);
    setIsAddingOrganisme(false);
  };

  /** Enregistre les modifications d'un document (le fichier déposé est conservé). */
  const handleSaveDocument = async () => {
    if (!documentEdite) return;
    const organisme = organismes.find(
      (o) => o.id === documentEdite.organismeId,
    );
    const nom = documentEdite.nom.trim() || "Document";
    await registreDocuments.enregistrer(
      {
        ...documentEdite,
        nom,
        dateModification: new Date().toISOString().split("T")[0],
      },
      {
        period: (documentEdite.dateAjout ?? "").slice(0, 4),
        label: organisme?.nom ?? nom,
      },
    );
    setDocumentEdite(null);
  };

  const handleSaveCourrierEdite = async () => {
    if (!courrierEdite || !courrierEdite.objet.trim()) return;
    await registreCourriers.enregistrer(courrierEdite, {
      period: (courrierEdite.date ?? "").slice(0, 4),
      label: courrierEdite.objet,
      status: courrierEdite.statut,
    });
    setCourrierEdite(null);
  };

  /**
   * Enregistre le courrier et, s'il est "Envoyé" avec une adresse email,
   * l'envoie réellement via le centre de communication (même API que
   * l'envoi d'emails RH) plutôt que de se contenter d'archiver une ligne.
   */
  const handleCreerCourrier = async () => {
    if (!selectedOrganisme || !newCourrier.objet) return;
    setErreurEnvoiCourrier(null);
    const emailSaisi = newCourrier.emailDestinataire.trim();
    const envoyer = newCourrier.type === "envoye" && emailSaisi !== "";
    if (envoyer && !EMAIL_VALIDE.test(emailSaisi)) {
      setErreurEnvoiCourrier(
        "L'adresse e-mail du destinataire n'est pas valide (exemple : contact@organisme.fr).",
      );
      return;
    }
    setEnvoiCourrierEnCours(true);
    try {
      let statutInitial: CourrierEnregistre["statut"] = "non_lu";
      if (envoyer) {
        try {
          await sendCommunicationEmail({
            recipients: [emailSaisi],
            subject: newCourrier.objet,
            body: newCourrier.message || newCourrier.objet,
          });
          statutInitial = "traite";
        } catch (e) {
          // On reste dans le formulaire : rien n'est enregistré comme
          // « envoyé » alors que le message n'est pas parti, et l'utilisateur
          // peut corriger l'adresse, réessayer, ou vider le champ e-mail pour
          // n'archiver que le courrier.
          setErreurEnvoiCourrier(
            `L'e-mail n'a pas pu être envoyé. ${messageErreurEnvoi(e)}`,
          );
          return;
        }
      }
      const ligne: CourrierEnregistre = {
        id: `courrier-${Date.now()}`,
        organismeId: selectedOrganisme,
        objet: newCourrier.objet,
        type: newCourrier.type,
        date: newCourrier.date,
        // Courrier sortant : l'expéditeur par défaut est l'adresse du compte.
        expediteur:
          newCourrier.expediteur ||
          (newCourrier.type === "envoye"
            ? emailCompte || (organisation?.name ?? "")
            : ""),
        destinataire: newCourrier.destinataire,
        emailDestinataire: emailSaisi || undefined,
        message: newCourrier.message || undefined,
        documentId: documentPourCourrier ?? undefined,
        statut: statutInitial,
        piece: null,
      };
      await registreCourriers.enregistrer(ligne, {
        period: newCourrier.date.slice(0, 7),
        label: newCourrier.objet,
      });
      setIsAddingCourrier(false);
      setDocumentPourCourrier(null);
      setNewCourrier({
        objet: "",
        type: "recu",
        date: new Date().toISOString().split("T")[0],
        expediteur: "",
        destinataire: "",
        emailDestinataire: "",
        message: "",
      });
    } finally {
      setEnvoiCourrierEnCours(false);
    }
  };

  const typesDocuments = [
    "all",
    "attestation",
    "contrat",
    "courrier",
    "releve",
    "facture",
    "devis",
    "convention",
  ];
  const typesOrganismes = [
    "organisme_social",
    "assurance",
    "professionnel",
    "financier",
    "organisme_officiel",
  ];

  const organismeVu = organismeVuId
    ? (organismes.find((o) => o.id === organismeVuId) ?? null)
    : null;
  const contactsVu = organismeVu
    ? contactsDe(organismeVu)
    : { telephones: [], emails: [] };
  const documentsVus = organismeVu
    ? documents.filter((d) => d.organismeId === organismeVu.id)
    : [];
  const courriersVus = organismeVu
    ? courriers.filter((c) => c.organismeId === organismeVu.id)
    : [];
  // Adresses de l'organisme sélectionné, proposées à l'envoi d'un courrier.
  const emailsOrganismeChoisi = (() => {
    const o = organismes.find((org) => org.id === selectedOrganisme);
    return o ? contactsDe(o).emails : [];
  })();

  return (
    <div className="space-y-6">
      {erreurDepot && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {erreurDepot}
        </p>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Divers Documents</h1>
          <p className="text-muted-foreground">
            Organisation des documents et courriers par organisme
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={ouvrirAjoutOrganisme}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter Organisme
          </Button>
        </div>
      </div>

      {!selectedOrganisme ? (
        <div className="space-y-6">
          {/* Statistiques */}
          <InfoCardContainer className="md:grid-cols-4">
            <InfoCard
              icon={Building}
              title="Organismes"
              value={organismes.length}
              color="blue"
            />
            <InfoCard
              icon={FileText}
              title="Documents"
              value={documents.length}
              color="green"
            />
            <InfoCard
              icon={AlertTriangle}
              title="Urgents"
              value={documents.filter((doc) => doc.urgent).length}
              color="red"
            />
            <InfoCard
              icon={Mail}
              title="Courriers"
              value={courriers.length}
              color="orange"
            />
          </InfoCardContainer>

          {/* Liste des organismes */}
          <Card>
            <CardHeader>
              <CardTitle>Organismes</CardTitle>
              <CardDescription>
                Cliquez sur un organisme pour accéder à ses documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {organismes.map((organisme) => {
                  const Icon = getIconComponent(organisme.icon);
                  const logo = logoOrganisme(organisme.nom);
                  const docsCount = documents.filter(
                    (doc) => doc.organismeId === organisme.id,
                  ).length;
                  const courriersCount = courriers.filter(
                    (courrier) => courrier.organismeId === organisme.id,
                  ).length;

                  return (
                    <Card
                      key={organisme.id}
                      className="cursor-pointer hover:shadow-md transition-shadow relative"
                      onClick={() => setSelectedOrganisme(organisme.id)}
                    >
                      <div className="absolute right-2 top-2">
                        <RowActionsMenu
                          triggerLabel={`Actions pour ${organisme.nom}`}
                          onView={() => setOrganismeVuId(organisme.id)}
                          onEdit={() => ouvrirModifOrganisme(organisme)}
                          onDelete={() => void handleDeleteOrganisme(organisme)}
                        />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4 pr-8">
                          <div
                            className={cn(
                              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                              !logo &&
                                `${getCouleurClasses(organisme.couleur).split(" ")[0]} ${getCouleurClasses(organisme.couleur).split(" ")[1]}`,
                              logo && "bg-white border",
                            )}
                          >
                            {logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={logo.src}
                                alt={logo.alt}
                                className="h-9 w-9 rounded-full object-contain"
                              />
                            ) : (
                              <Icon className="h-6 w-6" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{organisme.nom}</h3>
                            <Badge
                              variant="outline"
                              className={getCouleurClasses(organisme.couleur)}
                            >
                              {organisme.type.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">
                          {organisme.description}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-center">
                            <p className="font-medium">{docsCount}</p>
                            <p className="text-muted-foreground">Documents</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{courriersCount}</p>
                            <p className="text-muted-foreground">Courriers</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Vue détaillée d'un organisme */
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setSelectedOrganisme("")}>
              ← Retour
            </Button>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {organismes.find((org) => org.id === selectedOrganisme)?.nom}
              </h2>
              <p className="text-muted-foreground">
                {
                  organismes.find((org) => org.id === selectedOrganisme)
                    ?.description
                }
              </p>
            </div>
          </div>

          {/* Filtres et recherche */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Rechercher dans les documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {typesDocuments
                      .filter((type) => type !== "all")
                      .map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Une seule liste "Documents" : les courriers y apparaissent
              comme n'importe quel autre document, avec leur propre rendu
              (icône enveloppe, statut lu/traité…). Chaque document propose
              en plus une action "Envoyer un courrier" dans son menu, plutôt
              que d'avoir un onglet Courriers séparé et un bouton "Nouveau
              document" redondant. */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Documents
                <span className="text-sm font-normal text-muted-foreground">
                  ({getOrganismeDocuments(selectedOrganisme).length} document
                  {getOrganismeDocuments(selectedOrganisme).length > 1
                    ? "s"
                    : ""}{" "}
                  · {getOrganismeCourriers(selectedOrganisme).length} courrier
                  {getOrganismeCourriers(selectedOrganisme).length > 1
                    ? "s"
                    : ""}
                  )
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getOrganismeDocuments(selectedOrganisme).map((document) => (
                  <div key={document.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">
                              {document.nom}
                            </h3>
                            <Badge
                              className={getStatutColor(
                                docStatuts[document.id] ?? "en_attente",
                              )}
                            >
                              {getStatutText(
                                docStatuts[document.id] ?? "en_attente",
                              )}
                            </Badge>
                            {document.urgent && (
                              <Badge className="bg-red-500">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Urgent
                              </Badge>
                            )}
                            <Badge variant="outline">{document.type}</Badge>
                          </div>
                          <p className="text-base text-muted-foreground mt-1">
                            {document.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                            <span>
                              Ajouté le{" "}
                              {new Date(document.dateAjout).toLocaleDateString(
                                "fr-FR",
                              )}
                            </span>
                            <span>Taille: {document.taille}</span>
                            <div className="flex gap-1">
                              {document.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={docStatuts[document.id] ?? "en_attente"}
                          onValueChange={(v) =>
                            setDocStatuts((prev) => ({
                              ...prev,
                              [document.id]: v,
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 w-[150px] text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOC_STATUTS.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <RowActionsMenu
                          // « Voir » ouvre directement le fichier déposé,
                          // sans passer par la fenêtre de détail.
                          onView={() =>
                            ouvrirPiece(document.fichier, document.nom)
                          }
                          onEdit={() => setDocumentEdite({ ...document })}
                          onDownload={() =>
                            ouvrirPiece(document.fichier, document.nom)
                          }
                          onDelete={() =>
                            void registreDocuments.supprimerLigne(document.id)
                          }
                          extraItems={[
                            {
                              label: "Envoyer un courrier",
                              icon: Send,
                              tone: "send" as const,
                              onClick: () => {
                                setDocumentPourCourrier(document.id);
                                setNewCourrier({
                                  objet: document.nom,
                                  type: "envoye",
                                  date: new Date().toISOString().split("T")[0],
                                  expediteur: "",
                                  destinataire: "",
                                  emailDestinataire: "",
                                  message: "",
                                });
                                setIsAddingCourrier(true);
                              },
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {getOrganismeCourriers(selectedOrganisme).map((courrier) => (
                  <div key={courrier.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            courrier.type === "recu"
                              ? "bg-blue-100"
                              : "bg-green-100"
                          }`}
                        >
                          <Mail
                            className={`h-4 w-4 ${
                              courrier.type === "recu"
                                ? "text-blue-500"
                                : "text-green-500"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">
                              {courrier.objet}
                            </h3>
                            <Badge
                              variant="outline"
                              className={
                                courrier.type === "recu"
                                  ? "border-blue-200"
                                  : "border-green-200"
                              }
                            >
                              {courrier.type === "recu" ? "Reçu" : "Envoyé"}
                            </Badge>
                          </div>
                          <div className="text-base text-muted-foreground mt-1">
                            <p>
                              De: {courrier.expediteur} → À:{" "}
                              {courrier.destinataire}
                              {courrier.emailDestinataire
                                ? ` (${courrier.emailDestinataire})`
                                : ""}
                            </p>
                            <p>
                              {new Date(courrier.date).toLocaleDateString(
                                "fr-FR",
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatutColor(courrier.statut)}>
                          {getStatutText(courrier.statut)}
                        </Badge>
                        {courrier.piece && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              ouvrirPiece(courrier.piece, courrier.objet)
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <RowActionsMenu
                          onView={() => setCourrierVu(courrier)}
                          onEdit={() => setCourrierEdite({ ...courrier })}
                          onDelete={() =>
                            void registreCourriers.supprimerLigne(courrier.id)
                          }
                          extraItems={[
                            {
                              label: "Marquer en cours",
                              icon: Clock,
                              tone: "history" as const,
                              onClick: () =>
                                void registreCourriers.enregistrer(
                                  { ...courrier, statut: "en_cours" },
                                  {
                                    period: (courrier.date ?? "").slice(0, 4),
                                    label: courrier.objet,
                                    status: "en_cours",
                                  },
                                ),
                            },
                            {
                              label: "Archiver",
                              icon: Archive,
                              tone: "upload" as const,
                              onClick: () =>
                                void registreCourriers.enregistrer(
                                  { ...courrier, statut: "archive" },
                                  {
                                    period: (courrier.date ?? "").slice(0, 4),
                                    label: courrier.objet,
                                    status: "archive",
                                  },
                                ),
                            },
                            {
                              label: "Marquer comme traité",
                              icon: CheckCircle2,
                              tone: "validate" as const,
                              onClick: () =>
                                void registreCourriers.enregistrer(
                                  { ...courrier, statut: "traite" },
                                  {
                                    period: (courrier.date ?? "").slice(0, 4),
                                    label: courrier.objet,
                                    status: "traite",
                                  },
                                ),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {getOrganismeDocuments(selectedOrganisme).length === 0 &&
                  getOrganismeCourriers(selectedOrganisme).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Aucun document ni courrier pour cet organisme.
                    </p>
                  )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  className="flex-1"
                  onClick={() => {
                    const typesAutorises = typesDocumentsPour(
                      organismes.find((o) => o.id === selectedOrganisme)?.nom ??
                        "",
                    );
                    setTypeDocAAjouter(typesAutorises[0] ?? "attestation");
                    setOrganismeDocAAjouter(selectedOrganisme);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un document
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDocumentPourCourrier(null);
                    setIsAddingCourrier(true);
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Nouveau courrier
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ajout / modification d'un organisme (même formulaire) */}
      <Modal
        open={isAddingOrganisme}
        onOpenChange={(o) => {
          setIsAddingOrganisme(o);
          if (!o) setErreurOrganisme(null);
        }}
        type="form"
        title={
          organismeEditeId
            ? "Modifier l'organisme"
            : "Ajouter un nouvel organisme"
        }
        description={
          organismeEditeId
            ? "Mettez à jour les coordonnées et les interlocuteurs de l'organisme"
            : "Créez un nouvel organisme pour organiser vos documents"
        }
        size="md"
        actions={{
          primary: {
            label: organismeEditeId ? "Enregistrer" : "Ajouter",
            onClick: () => void handleSaveOrganisme(),
          },
          secondary: {
            label: "Annuler",
            onClick: () => setIsAddingOrganisme(false),
            variant: "outline",
          },
        }}
      >
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom de l&apos;organisme</Label>
            <Input
              id="nom"
              value={newOrganisme.nom}
              onChange={(e) =>
                setNewOrganisme({ ...newOrganisme, nom: e.target.value })
              }
              placeholder="Ex: Nouvelle Mutuelle"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type d&apos;organisme</Label>
              <Select
                value={newOrganisme.type}
                onValueChange={(value) =>
                  setNewOrganisme({ ...newOrganisme, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  {typesOrganismes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace("_", " ").charAt(0).toUpperCase() +
                        type.replace("_", " ").slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organisme-code">Code organisme</Label>
              <Input
                id="organisme-code"
                value={newOrganisme.code}
                onChange={(e) =>
                  setNewOrganisme({ ...newOrganisme, code: e.target.value })
                }
                placeholder="Ex : 117"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Téléphone (TPH)</Label>
            {newOrganisme.telephones.map((tel, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  aria-label="Interlocuteur (optionnel)"
                  className="w-2/5"
                  value={tel.label ?? ""}
                  onChange={(e) =>
                    majContact("telephones", index, { label: e.target.value })
                  }
                  placeholder="Contact : Mme Martin"
                />
                <PhoneField
                  aria-label="Numéro de téléphone"
                  value={tel.value}
                  onChange={(e) =>
                    majContact("telephones", index, { value: e.target.value })
                  }
                  placeholder="06 66 66 66 66"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-red-500 hover:text-red-500"
                  title="Retirer ce numéro"
                  disabled={newOrganisme.telephones.length <= 1}
                  onClick={() => retirerContact("telephones", index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => ajouterContact("telephones")}
            >
              <Plus className="mr-1 h-4 w-4" />
              Ajouter un téléphone
            </Button>
          </div>

          <div className="space-y-2">
            <Label>E-mail</Label>
            {newOrganisme.emails.map((mail, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  aria-label="Interlocuteur (optionnel)"
                  className="w-2/5"
                  value={mail.label ?? ""}
                  onChange={(e) =>
                    majContact("emails", index, { label: e.target.value })
                  }
                  placeholder="Contact : Mme Martin"
                />
                <Input
                  aria-label="Adresse e-mail"
                  type="email"
                  value={mail.value}
                  onChange={(e) =>
                    majContact("emails", index, { value: e.target.value })
                  }
                  placeholder="contact@organisme.fr"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-red-500 hover:text-red-500"
                  title="Retirer cette adresse"
                  disabled={newOrganisme.emails.length <= 1}
                  onClick={() => retirerContact("emails", index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => ajouterContact("emails")}
            >
              <Plus className="mr-1 h-4 w-4" />
              Ajouter une adresse e-mail
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newOrganisme.description}
              onChange={(e) =>
                setNewOrganisme({
                  ...newOrganisme,
                  description: e.target.value,
                })
              }
              placeholder="Description de l'organisme..."
            />
          </div>

          {erreurOrganisme && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {erreurOrganisme}
            </p>
          )}
        </div>
      </Modal>

      {/* Organisme — consultation en lecture seule */}
      <Modal
        open={!!organismeVu}
        onOpenChange={(o) => !o && setOrganismeVuId(null)}
        type="details"
        size="md"
        title={organismeVu ? organismeVu.nom : "Organisme"}
        description={organismeVu?.description || undefined}
        actions={{
          primary: { label: "Fermer", onClick: () => setOrganismeVuId(null) },
          secondary: {
            label: "Modifier",
            variant: "outline" as const,
            onClick: () => {
              if (!organismeVu) return;
              setOrganismeVuId(null);
              ouvrirModifOrganisme(organismeVu);
            },
          },
        }}
      >
        {organismeVu && (
          <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <p className="text-muted-foreground">
                  {organismeVu.type.replace("_", " ")}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Code organisme</Label>
                <p className="text-muted-foreground">
                  {organismeVu.code || "—"}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Téléphones</Label>
              {contactsVu.telephones.length === 0 ? (
                <p className="text-muted-foreground">Non renseigné</p>
              ) : (
                <ul className="space-y-1">
                  {contactsVu.telephones.map((t, i) => (
                    <li key={i} className="text-muted-foreground">
                      {t.label ? `${t.label} : ` : ""}
                      <a
                        href={`tel:${t.value}`}
                        className="text-foreground underline-offset-2 hover:underline"
                      >
                        {formaterTelephone(t.value)}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">Adresses e-mail</Label>
              {contactsVu.emails.length === 0 ? (
                <p className="text-muted-foreground">Non renseigné</p>
              ) : (
                <ul className="space-y-1">
                  {contactsVu.emails.map((m, i) => (
                    <li key={i} className="text-muted-foreground">
                      {m.label ? `${m.label} : ` : ""}
                      <a
                        href={`mailto:${m.value}`}
                        className="text-foreground underline-offset-2 hover:underline"
                      >
                        {m.value}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">
                Documents liés ({documentsVus.length})
              </Label>
              {documentsVus.length === 0 ? (
                <p className="text-muted-foreground">Aucun document</p>
              ) : (
                <ul className="space-y-1">
                  {documentsVus.map((d) => (
                    <li key={d.id} className="text-muted-foreground">
                      {d.nom} <span className="text-xs">({d.type})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">
                Courriers liés ({courriersVus.length})
              </Label>
              {courriersVus.length === 0 ? (
                <p className="text-muted-foreground">Aucun courrier</p>
              ) : (
                <ul className="space-y-1">
                  {courriersVus.map((c) => (
                    <li key={c.id} className="text-muted-foreground">
                      {c.objet}{" "}
                      <span className="text-xs">
                        ({c.type === "recu" ? "reçu" : "envoyé"} le{" "}
                        {new Date(c.date).toLocaleDateString("fr-FR")})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Document — modification */}
      <Modal
        open={!!documentEdite}
        onOpenChange={(o) => !o && setDocumentEdite(null)}
        type="form"
        size="md"
        title="Modifier le document"
        actions={{
          primary: {
            label: "Enregistrer",
            onClick: () => void handleSaveDocument(),
          },
          secondary: {
            label: "Annuler",
            variant: "outline" as const,
            onClick: () => setDocumentEdite(null),
          },
        }}
      >
        {documentEdite && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="doc-edit-nom">Nom</Label>
              <Input
                id="doc-edit-nom"
                value={documentEdite.nom}
                onChange={(e) =>
                  setDocumentEdite({ ...documentEdite, nom: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="doc-edit-type">Type de document</Label>
              <Select
                value={documentEdite.type}
                onValueChange={(v) =>
                  setDocumentEdite({ ...documentEdite, type: v })
                }
              >
                <SelectTrigger id="doc-edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    new Set([
                      documentEdite.type,
                      ...typesDocuments.filter((t) => t !== "all"),
                    ]),
                  ).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="doc-edit-description">Description</Label>
              <Textarea
                id="doc-edit-description"
                value={documentEdite.description ?? ""}
                onChange={(e) =>
                  setDocumentEdite({
                    ...documentEdite,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={documentEdite.urgent}
                onChange={(e) =>
                  setDocumentEdite({
                    ...documentEdite,
                    urgent: e.target.checked,
                  })
                }
              />
              Document urgent
            </label>
          </div>
        )}
      </Modal>

      {/* Courrier — consultation en lecture seule */}
      <Modal
        open={!!courrierVu}
        onOpenChange={(o) => !o && setCourrierVu(null)}
        type="details"
        size="md"
        title={courrierVu ? courrierVu.objet : "Courrier"}
        actions={{
          primary: { label: "Fermer", onClick: () => setCourrierVu(null) },
          secondary: courrierVu?.piece
            ? {
                label: "Ouvrir la pièce jointe",
                variant: "outline" as const,
                onClick: () => ouvrirPiece(courrierVu.piece, courrierVu.objet),
              }
            : undefined,
        }}
      >
        {courrierVu && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Type</Label>
                <p className="text-muted-foreground">
                  {courrierVu.type === "recu" ? "Reçu" : "Envoyé"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Date</Label>
                <p className="text-muted-foreground">
                  {new Date(courrierVu.date).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Expéditeur</Label>
                <p className="text-muted-foreground">
                  {courrierVu.expediteur || "—"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Destinataire</Label>
                <p className="text-muted-foreground">
                  {courrierVu.destinataire || "—"}
                  {courrierVu.emailDestinataire
                    ? ` (${courrierVu.emailDestinataire})`
                    : ""}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Statut</Label>
                <p className="text-muted-foreground">
                  {getStatutText(courrierVu.statut)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Pièce jointe</Label>
                <p className="text-muted-foreground">
                  {courrierVu.piece?.name ?? "Aucune"}
                </p>
              </div>
            </div>
            {courrierVu.message && (
              <div>
                <Label className="text-sm font-medium">Message</Label>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {courrierVu.message}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Courrier — modification */}
      <Modal
        open={!!courrierEdite}
        onOpenChange={(o) => !o && setCourrierEdite(null)}
        type="form"
        size="md"
        title="Modifier le courrier"
        actions={{
          primary: {
            label: "Enregistrer",
            disabled: !courrierEdite?.objet.trim(),
            onClick: () => void handleSaveCourrierEdite(),
          },
          secondary: {
            label: "Annuler",
            variant: "outline" as const,
            onClick: () => setCourrierEdite(null),
          },
        }}
      >
        {courrierEdite && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="courrier-edit-objet">Objet</Label>
              <Input
                id="courrier-edit-objet"
                value={courrierEdite.objet}
                onChange={(e) =>
                  setCourrierEdite({ ...courrierEdite, objet: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="courrier-edit-date">Date</Label>
                <Input
                  id="courrier-edit-date"
                  type="date"
                  value={courrierEdite.date}
                  onChange={(e) =>
                    setCourrierEdite({ ...courrierEdite, date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="courrier-edit-statut">Statut</Label>
                <Select
                  value={courrierEdite.statut}
                  onValueChange={(v) =>
                    setCourrierEdite({
                      ...courrierEdite,
                      statut: v as CourrierEnregistre["statut"],
                    })
                  }
                >
                  <SelectTrigger id="courrier-edit-statut">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non_lu">Non lu</SelectItem>
                    <SelectItem value="lu">Lu</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="traite">Traité</SelectItem>
                    <SelectItem value="archive">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="courrier-edit-expediteur">Expéditeur</Label>
                <Input
                  id="courrier-edit-expediteur"
                  value={courrierEdite.expediteur}
                  onChange={(e) =>
                    setCourrierEdite({
                      ...courrierEdite,
                      expediteur: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="courrier-edit-destinataire">Destinataire</Label>
                <Input
                  id="courrier-edit-destinataire"
                  value={courrierEdite.destinataire}
                  onChange={(e) =>
                    setCourrierEdite({
                      ...courrierEdite,
                      destinataire: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Choix du type avant dépôt : tout partait auparavant en "attestation". */}
      <Modal
        open={!!organismeDocAAjouter}
        onOpenChange={(o) => !o && setOrganismeDocAAjouter(null)}
        type="form"
        title="Type de document"
        description="Choisissez le type avant de sélectionner le fichier."
        size="sm"
        actions={{
          primary: {
            label: "Choisir le fichier",
            onClick: () => {
              if (!organismeDocAAjouter) return;
              const organismeId = organismeDocAAjouter;
              setOrganismeDocAAjouter(null);
              void handleAjouterDocument(organismeId, typeDocAAjouter);
            },
          },
          secondary: {
            label: "Annuler",
            onClick: () => setOrganismeDocAAjouter(null),
            variant: "outline" as const,
          },
        }}
      >
        <div>
          <Label htmlFor="type-doc-a-ajouter">Type de document</Label>
          <Select value={typeDocAAjouter} onValueChange={setTypeDocAAjouter}>
            <SelectTrigger id="type-doc-a-ajouter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(organismeDocAAjouter
                ? typesDocumentsPour(
                    organismes.find((o) => o.id === organismeDocAAjouter)
                      ?.nom ?? "",
                  )
                : typesDocuments.filter((t) => t !== "all")
              ).map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Modal>

      {/* Création d'un courrier : le bouton "Nouveau courrier" n'était relié
          à rien. */}
      <Modal
        open={isAddingCourrier}
        onOpenChange={(o) => {
          setIsAddingCourrier(o);
          setErreurEnvoiCourrier(null);
          if (!o) setDocumentPourCourrier(null);
        }}
        type="form"
        title="Nouveau courrier"
        size="md"
        actions={{
          primary: {
            label: envoiCourrierEnCours ? "Envoi…" : "Créer",
            disabled: !newCourrier.objet || envoiCourrierEnCours,
            onClick: () => void handleCreerCourrier(),
          },
          secondary: {
            label: "Annuler",
            onClick: () => {
              setIsAddingCourrier(false);
              setErreurEnvoiCourrier(null);
            },
            variant: "outline" as const,
          },
        }}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="courrier-objet">Objet</Label>
            <Input
              id="courrier-objet"
              value={newCourrier.objet}
              onChange={(e) =>
                setNewCourrier({ ...newCourrier, objet: e.target.value })
              }
              placeholder="Ex : Relance déclaration TVA"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="courrier-type">Type</Label>
              <Select
                value={newCourrier.type}
                onValueChange={(v: "recu" | "envoye") =>
                  setNewCourrier({ ...newCourrier, type: v })
                }
              >
                <SelectTrigger id="courrier-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recu">Reçu</SelectItem>
                  <SelectItem value="envoye">Envoyé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="courrier-date">Date</Label>
              <Input
                id="courrier-date"
                type="date"
                value={newCourrier.date}
                onChange={(e) =>
                  setNewCourrier({ ...newCourrier, date: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="courrier-expediteur">Expéditeur</Label>
              <Input
                id="courrier-expediteur"
                value={newCourrier.expediteur}
                onChange={(e) =>
                  setNewCourrier({
                    ...newCourrier,
                    expediteur: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="courrier-destinataire">Destinataire</Label>
              <Input
                id="courrier-destinataire"
                value={newCourrier.destinataire}
                onChange={(e) =>
                  setNewCourrier({
                    ...newCourrier,
                    destinataire: e.target.value,
                  })
                }
              />
            </div>
          </div>
          {newCourrier.type === "envoye" && (
            <>
              <div>
                <Label>De (adresse d&apos;envoi)</Label>
                <p className="rounded-md border px-3 py-2 text-sm">
                  {emailCompte ? (
                    <>
                      {organisation?.name ? `${organisation.name} — ` : ""}
                      {emailCompte}
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      Aucune adresse e-mail renseignée
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {emailBoite
                    ? "Le courrier part de la boîte mail connectée de votre société ; les réponses y arriveront. Elle se gère dans « Mon entreprise »."
                    : emailCompte
                      ? "Les réponses du destinataire arriveront sur l'adresse de votre compte. Elle se modifie dans « Mon entreprise »."
                      : "Renseignez l'e-mail de l'entreprise dans « Mon entreprise » pour recevoir les réponses à ce courrier."}
                </p>
              </div>
              <div>
                <Label htmlFor="courrier-email">
                  Email du destinataire (optionnel — envoie réellement le
                  courrier)
                </Label>
                {emailsOrganismeChoisi.length > 0 && (
                  <Select
                    value={
                      emailsOrganismeChoisi.some(
                        (m) => m.value === newCourrier.emailDestinataire,
                      )
                        ? newCourrier.emailDestinataire
                        : ""
                    }
                    onValueChange={(v) => {
                      const choisie = emailsOrganismeChoisi.find(
                        (m) => m.value === v,
                      );
                      setNewCourrier({
                        ...newCourrier,
                        emailDestinataire: v,
                        // L'interlocuteur renseigné devient le destinataire s'il est vide.
                        destinataire:
                          newCourrier.destinataire || (choisie?.label ?? ""),
                      });
                    }}
                  >
                    <SelectTrigger className="mb-2">
                      <SelectValue placeholder="Choisir une adresse de l'organisme" />
                    </SelectTrigger>
                    <SelectContent>
                      {emailsOrganismeChoisi.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label ? `${m.label} — ${m.value}` : m.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Input
                  id="courrier-email"
                  type="email"
                  value={newCourrier.emailDestinataire}
                  onChange={(e) =>
                    setNewCourrier({
                      ...newCourrier,
                      emailDestinataire: e.target.value,
                    })
                  }
                  placeholder="contact@organisme.fr"
                />
              </div>
              <div>
                <Label htmlFor="courrier-message">Message</Label>
                <Textarea
                  id="courrier-message"
                  value={newCourrier.message}
                  onChange={(e) =>
                    setNewCourrier({
                      ...newCourrier,
                      message: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Corps de l'email envoyé…"
                />
              </div>
            </>
          )}
          {erreurEnvoiCourrier && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {erreurEnvoiCourrier}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
