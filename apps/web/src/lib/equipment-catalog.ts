import type { Equipment } from "@/lib/types";

/**
 * Catalogue des dotations proposées à l'attribution dans la fiche salarié.
 *
 * Il s'agit de contenu produit — la liste des matériels et avantages qu'une
 * société de sécurité remet à ses agents — et non de données de test : c'est
 * ce catalogue qui alimente les menus « Équipement disponible » et
 * « Avantage disponible ». Le numéro de série et l'état sont saisis au moment
 * de l'attribution.
 */
export interface ArticleCatalogue {
  id: string;
  name: string;
  type: Equipment["type"];
  description?: string;
  consumable?: boolean;
}

export const CATALOGUE_EQUIPEMENTS: ArticleCatalogue[] = [
  {
    id: "eq-gilet",
    name: "Gilet pare-balles",
    type: "PPE",
    description: "Protection balistique niveau IIIA",
  },
  { id: "eq-chaussures", name: "Chaussures de sécurité", type: "PPE" },
  { id: "eq-gants", name: "Gants de protection", type: "PPE" },
  { id: "eq-casque", name: "Casque de protection", type: "PPE" },
  {
    id: "eq-radio",
    name: "Radio portative",
    type: "RADIO",
    description: "Émetteur-récepteur avec oreillette",
  },
  { id: "eq-talkie", name: "Talkie-walkie", type: "RADIO" },
  { id: "eq-lampe", name: "Lampe torche", type: "OTHER" },
  { id: "eq-detecteur", name: "Détecteur de métaux", type: "OTHER" },
  { id: "eq-menottes", name: "Menottes", type: "OTHER" },
  { id: "eq-matraque", name: "Matraque télescopique", type: "OTHER" },
  { id: "eq-uniforme", name: "Tenue d'uniforme complète", type: "UNIFORM" },
  { id: "eq-parka", name: "Parka de service", type: "UNIFORM" },
  { id: "eq-polo", name: "Polo de service", type: "UNIFORM" },
  {
    id: "eq-badge",
    name: "Badge d'accès",
    type: "BADGE",
    description: "Badge RFID nominatif",
  },
  { id: "eq-cles", name: "Trousseau de clés", type: "KEYS" },
  { id: "eq-vehicule", name: "Véhicule de patrouille", type: "VEHICLE" },
  { id: "eq-telephone", name: "Téléphone de service", type: "OTHER" },
  {
    id: "eq-carnet",
    name: "Carnet de main courante",
    type: "OTHER",
    consumable: true,
  },
  {
    id: "eq-trousse",
    name: "Trousse de premiers secours",
    type: "OTHER",
    consumable: true,
  },
  { id: "eq-extincteur", name: "Extincteur portatif", type: "OTHER" },
];

export const CATALOGUE_AVANTAGES: ArticleCatalogue[] = [
  {
    id: "av-cheques-vacances",
    name: "Chèques vacances",
    type: "VACATION_VOUCHER",
    consumable: true,
  },
  {
    id: "av-titres-restaurant",
    name: "Titres restaurant",
    type: "MEAL_VOUCHER",
    consumable: true,
  },
  {
    id: "av-carte-cadeau",
    name: "Carte cadeau",
    type: "GIFT_CARD",
    consumable: true,
  },
  { id: "av-cesu", name: "CESU préfinancé", type: "CESU", consumable: true },
  { id: "av-carte-carburant", name: "Carte carburant", type: "FUEL_CARD" },
  { id: "av-mutuelle", name: "Mutuelle famille", type: "OTHER" },
  {
    id: "av-transport",
    name: "Abonnement transport",
    type: "OTHER",
    consumable: true,
  },
  { id: "av-vehicule-fonction", name: "Véhicule de fonction", type: "VEHICLE" },
];

/** Article du catalogue présenté comme une dotation attribuable. */
export function versDotation(article: ArticleCatalogue): Equipment {
  return {
    id: article.id,
    name: article.name,
    type: article.type,
    description: article.description,
    consumable: article.consumable ?? false,
    quantity: 1,
    assignedAt: new Date(),
    assignedBy: "",
    condition: "new",
    status: "assigned",
  } as Equipment;
}
