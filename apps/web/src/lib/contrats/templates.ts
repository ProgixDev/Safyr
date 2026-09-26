/**
 * Gabarits de contrat de travail (sécurité privée, IDCC 1351).
 *
 * GABARIT GÉNÉRIQUE, À REMPLACER PAR LE MODÈLE DU CLIENT : le modèle réel n'a
 * pas été transmis. Tout le texte vit ici, sous forme de données : pour
 * substituer le modèle du client, il suffit de réécrire ce fichier, sans
 * toucher à la mise en page (`contrat-pdf.ts`) ni à la fusion des données
 * (`generateur.ts`). Ce texte doit être relu par un juriste avant usage.
 *
 * Syntaxe :
 * - `{{variable}}` : remplacée par la donnée ; vide, elle s'affiche « À
 *   compléter » (aperçu) ou en pointillés (PDF).
 * - `{{variable?}}` : facultative ; vide, elle laisse des pointillés à remplir
 *   à la main (lieu et date de signature).
 * - `{{art.identifiant}}` : numéro de l'article portant cet identifiant.
 * - `si` : condition d'affichage sur un indicateur (voir `generateur.ts`),
 *   `!x` pour la négation, `a|b` pour « a ou b ».
 * - Un paragraphe commençant par « - » est rendu en liste à puces.
 */

export type TypeGabarit =
  | "CDI_TEMPS_PLEIN"
  | "CDI_TEMPS_PARTIEL"
  | "CDD_TEMPS_PLEIN"
  | "CDD_TEMPS_PARTIEL";

export interface ParagrapheGabarit {
  texte: string;
  si?: string;
  style?: "gras" | "centre";
}

export interface ArticleGabarit {
  id: string;
  titre: string;
  si?: string;
  paragraphes: (string | ParagrapheGabarit)[];
}

export interface GabaritContrat {
  libelle: string;
  /** Titre encadré en tête du document. */
  titre: string;
  sousTitre: string;
  /** Comparution des parties, avant le premier article. */
  intro: (string | ParagrapheGabarit)[];
  articles: ArticleGabarit[];
  /** Phrase de clôture au-dessus des signatures. */
  cloture: string;
  signataires: { libelle: string; mention: string }[];
}

// ─── Parties ────────────────────────────────────────────────────────────

const INTRO: GabaritContrat["intro"] = [
  { texte: "ENTRE LES SOUSSIGNÉS :", style: "gras" },
  "La société {{entreprise.nom}}, {{entreprise.capital}}, dont le siège social est situé {{entreprise.adresse}}, immatriculée sous le numéro SIRET {{entreprise.siret}}, titulaire de l'autorisation d'exercer n° {{entreprise.cnaps}} délivrée par le Conseil national des activités privées de sécurité (CNAPS), représentée par {{entreprise.representant}}, agissant en qualité de {{entreprise.qualite}},",
  "ci-après dénommée « l'Employeur », d'une part,",
  { texte: "ET", style: "centre" },
  "{{salarie.civilite}} {{salarie.prenom}} {{salarie.nom}}, {{salarie.ne}} le {{salarie.dateNaissance}} à {{salarie.lieuNaissance}}, de nationalité {{salarie.nationalite}}, demeurant {{salarie.adresse}}, immatriculé(e) à la sécurité sociale sous le numéro {{salarie.numSecu}},",
  "ci-après dénommé « le Salarié », d'autre part,",
  { texte: "IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :", style: "gras" },
];

// ─── Articles communs ───────────────────────────────────────────────────

const ENGAGEMENT: ArticleGabarit = {
  id: "engagement",
  titre: "Engagement et convention collective",
  paragraphes: [
    "L'Employeur engage le Salarié, qui accepte, dans les conditions fixées par le présent contrat, par le Code du travail, par le livre VI du Code de la sécurité intérieure et par la convention collective nationale des entreprises de prévention et de sécurité du 15 février 1985 (IDCC 1351) et ses avenants (ci-après « la convention collective »). Le Salarié reconnaît avoir été informé qu'un exemplaire de la convention collective est tenu à sa disposition dans l'entreprise.",
    "Le présent engagement est subordonné à la validité de la carte professionnelle mentionnée à l'article {{art.carte}} et, le cas échéant, de l'autorisation de travail du Salarié, ainsi qu'à la production des pièces justificatives demandées par l'Employeur.",
  ],
};

const FONCTIONS: ArticleGabarit = {
  id: "fonctions",
  titre: "Fonctions et qualification",
  paragraphes: [
    "Le Salarié est engagé en qualité de {{emploi.poste}}, {{emploi.classification}} de la grille de classification de la convention collective.",
    "Il exerce ses fonctions de prévention et de sécurité (notamment surveillance, gardiennage, contrôle d'accès) telles que définies par sa fiche de poste et par les consignes propres à chaque site d'affectation, dans le respect du livre VI du Code de la sécurité intérieure.",
    "Le Salarié exerce ses fonctions sous l'autorité et selon les instructions de l'Employeur ou de son représentant, auquel il rend compte de l'exécution de sa mission. Toute modification substantielle de ses fonctions ou de sa qualification requiert son accord préalable, formalisé par avenant.",
  ],
};

const CARTE: ArticleGabarit = {
  id: "carte",
  titre: "Carte professionnelle et conditions d'exercice",
  paragraphes: [
    "L'exercice des fonctions est subordonné à la détention d'une carte professionnelle en cours de validité, délivrée par le CNAPS (article L. 612-20 du Code de la sécurité intérieure). Le Salarié déclare être titulaire de la carte professionnelle n° {{salarie.cartePro}}.",
    "Le Salarié s'engage à informer immédiatement l'Employeur de tout retrait, suspension ou non-renouvellement de sa carte professionnelle, ainsi que de toute évolution de sa situation l'empêchant d'exercer son activité. L'Employeur pourra alors en tirer les conséquences prévues par la loi, y compris la rupture du contrat de travail dans les conditions légales.",
    "Le Salarié s'engage à présenter sa carte professionnelle à toute demande des autorités de contrôle et à la porter de façon visible lorsque la réglementation l'exige.",
  ],
};

const DUREE_CDI: ArticleGabarit = {
  id: "duree",
  titre: "Date d'effet et durée du contrat",
  paragraphes: [
    "Le présent contrat est conclu pour une durée indéterminée. Il prend effet le {{contrat.dateDebut}}.",
  ],
};

const DUREE_CDD: ArticleGabarit = {
  id: "duree",
  titre: "Durée du contrat et motif de recours",
  paragraphes: [
    "Le présent contrat est conclu à durée déterminée, à terme précis, en application des articles L. 1242-1 et suivants du Code du travail. Il prend effet le {{contrat.dateDebut}} et prend fin de plein droit le {{contrat.dateFin}}, sans autre formalité.",
    "Motif de recours : le contrat est conclu pour le motif suivant : {{cdd.motif}}. Précisions : {{cdd.precision}}.",
    "Le contrat ne peut avoir ni pour objet ni pour effet de pourvoir durablement un emploi lié à l'activité normale et permanente de l'entreprise.",
    "Le contrat pourra être renouvelé, ou son terme reporté, dans les limites et conditions fixées par la loi et par la convention collective, par avenant signé des deux parties avant l'échéance du terme en cours.",
  ],
};

const ESSAI_CDI: ArticleGabarit = {
  id: "essai",
  titre: "Période d'essai",
  si: "essai",
  paragraphes: [
    "Le contrat est conclu sous réserve d'une période d'essai qui débute le {{contrat.dateDebut}} et s'achève le {{essai.fin}} inclus ({{essai.duree}}). Pendant cette période, chacune des parties peut mettre fin au contrat librement, dans le respect du délai de prévenance prévu par le Code du travail.",
    "La période d'essai pourra être renouvelée une fois, dans les conditions prévues par la convention collective et sous réserve de l'accord exprès et écrit des deux parties.",
  ],
};

const ESSAI_CDD: ArticleGabarit = {
  id: "essai",
  titre: "Période d'essai",
  si: "essai",
  paragraphes: [
    "Le contrat est conclu avec une période d'essai qui débute le {{contrat.dateDebut}} et s'achève le {{essai.fin}} inclus ({{essai.duree}}), conformément à l'article L. 1242-10 du Code du travail. Pendant cette période, chacune des parties peut mettre fin au contrat dans le respect du délai de prévenance prévu par le Code du travail.",
  ],
};

const LIEU: ArticleGabarit = {
  id: "lieu",
  titre: "Lieu de travail",
  paragraphes: [
    "Le Salarié exercera ses fonctions sur le ou les sites suivants : {{travail.lieu}}.",
    "Compte tenu de la nature de l'activité de l'Employeur, le Salarié pourra être affecté à d'autres sites clients situés dans le même secteur géographique. Un changement d'affectation dans ce secteur relève du pouvoir de direction de l'Employeur et ne constitue pas une modification du contrat de travail.",
    {
      texte:
        "Clause de mobilité : le Salarié accepte que son lieu de travail soit modifié dans la zone géographique suivante : {{mobilite.zone}}. Cette modification lui sera notifiée par écrit avec un délai de prévenance raisonnable. La clause devra être mise en œuvre de bonne foi, dans l'intérêt de l'entreprise, et sans porter une atteinte disproportionnée à la vie personnelle et familiale du Salarié.",
      si: "mobilite",
    },
    "Le Salarié est informé qu'en cas de perte d'un marché ou de changement de prestataire, son contrat pourra être transféré dans les conditions prévues par la convention collective en matière de reprise du personnel et de garantie d'emploi.",
  ],
};

const HORAIRES_PLEIN: ArticleGabarit = {
  id: "horaires",
  titre: "Durée et organisation du travail",
  paragraphes: [
    "Le Salarié est engagé à temps complet, pour une durée de travail de {{duree.mensuelle}} heures par mois.",
    {
      texte:
        "Cette durée correspond à la durée légale du travail de 35 heures par semaine, lissée sur le mois (151,67 heures).",
      si: "duree35",
    },
    { texte: "Répartition et horaires : {{duree.horaires}}.", si: "horaires" },
    "Les horaires de travail sont fixés par l'Employeur en fonction des besoins des sites et communiqués au Salarié par planning, dans le respect des délais de prévenance légaux et conventionnels. Le Salarié est informé qu'il pourra travailler de jour comme de nuit, les dimanches et les jours fériés ; ces sujétions ouvrent droit aux majorations et contreparties prévues par la convention collective.",
    "Les heures supplémentaires effectuées à la demande de l'Employeur ou avec son accord exprès sont rémunérées ou compensées dans les conditions légales et conventionnelles. Le Salarié respecte les durées maximales de travail et les temps de repos légaux.",
    "Le Salarié respecte strictement ses horaires, ne quitte pas son poste sans avoir été relevé et signale sans délai toute absence ou tout retard.",
  ],
};

const HORAIRES_PARTIEL: ArticleGabarit = {
  id: "horaires",
  titre: "Durée et organisation du travail à temps partiel",
  paragraphes: [
    "Le Salarié est engagé à temps partiel, conformément à l'article L. 3123-6 du Code du travail. La durée mensuelle de travail est fixée à {{duree.mensuelle}} heures.",
    "Répartition de la durée du travail entre les jours de la semaine ou les semaines du mois : {{duree.repartition}}.",
    "Les horaires sont communiqués au Salarié par planning. La répartition de la durée du travail pourra être modifiée dans les cas suivants : absence ou empêchement d'un autre salarié, modification ou suspension de la prestation demandée par le client, changement des horaires ou des consignes du site, circonstances exceptionnelles. Toute modification est notifiée au Salarié dans le délai de prévenance prévu par la convention collective, qui ne peut être inférieur à trois jours ouvrés.",
    "Le Salarié peut être amené à effectuer des heures complémentaires, dans la limite prévue par la loi et la convention collective, majorées dans les conditions prévues par ces textes. Les heures complémentaires ne peuvent avoir pour effet de porter la durée du travail au niveau de la durée légale ou conventionnelle du travail à temps complet.",
    "Le Salarié bénéficie de la priorité d'attribution des emplois à temps complet de sa catégorie professionnelle, dans les conditions prévues par la loi et la convention collective. Il conserve la faculté d'exercer une autre activité, sous réserve de respecter les durées maximales de travail et son devoir de loyauté envers l'Employeur.",
    "Le Salarié respecte strictement ses horaires, ne quitte pas son poste sans avoir été relevé et signale sans délai toute absence ou tout retard.",
  ],
};

const REMUNERATION: ArticleGabarit = {
  id: "remuneration",
  titre: "Rémunération",
  paragraphes: [
    "En contrepartie de son travail, le Salarié perçoit une rémunération mensuelle brute de {{remu.salaireMensuel}} pour {{duree.mensuelle}} heures de travail, sur la base d'un taux horaire brut de {{remu.tauxHoraire}}.",
    "Cette rémunération ne peut être inférieure au minimum conventionnel correspondant à la classification du Salarié définie à l'article {{art.fonctions}}.",
    "S'y ajoutent, le cas échéant, les majorations, indemnités et primes prévues par la loi et la convention collective (notamment pour heures de nuit, dimanches, jours fériés, heures supplémentaires ou complémentaires), qui figurent sur des lignes distinctes du bulletin de paie.",
    "La rémunération est versée mensuellement par virement bancaire. Un bulletin de paie est remis au Salarié chaque mois.",
  ],
};

const CONGES: ArticleGabarit = {
  id: "conges",
  titre: "Congés payés",
  paragraphes: [
    "Le Salarié bénéficie des congés payés dans les conditions prévues par le Code du travail et la convention collective, à raison de 2,5 jours ouvrables par mois de travail effectif. Les dates de congés sont fixées par l'Employeur, après consultation du Salarié, en fonction des nécessités du service.",
  ],
};

const TENUE: ArticleGabarit = {
  id: "tenue",
  titre: "Tenue de travail et équipements",
  si: "tenue",
  paragraphes: [
    "L'Employeur met à la disposition du Salarié la tenue de travail et les équipements individuels nécessaires à l'exercice de ses fonctions. Leur remise fait l'objet d'un état signé par le Salarié.",
    "Le Salarié s'engage à porter la tenue pendant le service, à en prendre soin, à ne l'utiliser que dans le cadre professionnel et à la restituer en bon état à la fin du contrat ou à première demande de l'Employeur.",
    "Le temps d'habillage et de déshabillage est traité dans les conditions prévues par la convention collective.",
  ],
};

const PROTECTION: ArticleGabarit = {
  id: "protection",
  titre: "Retraite complémentaire, prévoyance et frais de santé",
  paragraphes: [
    "Le Salarié est affilié, dès son embauche, aux régimes de retraite complémentaire et de prévoyance auxquels l'Employeur adhère, ainsi qu'au régime collectif et obligatoire de remboursement de frais de santé en vigueur dans l'entreprise, dans les conditions prévues par la convention collective et sous réserve des dispenses d'affiliation prévues par la loi.",
    {
      texte:
        "Organisme(s) de retraite complémentaire et de prévoyance : {{protection.organismes}}.",
      si: "cdd|organismes",
    },
  ],
};

const OBLIGATIONS: ArticleGabarit = {
  id: "obligations",
  titre: "Obligations professionnelles et confidentialité",
  paragraphes: [
    "Le Salarié s'engage à exercer ses fonctions avec loyauté, probité, dignité et courtoisie, dans le respect du code de déontologie des activités privées de sécurité prévu par le Code de la sécurité intérieure.",
    "Le Salarié est tenu à une obligation de discrétion et de confidentialité pour toutes les informations relatives à l'Employeur, à ses clients et aux sites protégés (plans, dispositifs de sécurité, consignes, horaires de ronde, codes d'accès) dont il a connaissance dans l'exercice de ses fonctions. Cette obligation subsiste après la fin du contrat.",
    "Le Salarié s'engage à respecter le règlement intérieur, les consignes de sécurité et les procédures de l'entreprise ainsi que les consignes propres à chaque site, et à tenir avec exactitude la main courante et les rapports qui lui sont demandés.",
    "Le Salarié informe sans délai l'Employeur de tout changement de sa situation (adresse, état civil, coordonnées bancaires).",
  ],
};

const DEDIT: ArticleGabarit = {
  id: "dedit",
  titre: "Clause de dédit-formation",
  si: "dedit",
  paragraphes: [
    "L'Employeur finance au bénéfice du Salarié la formation suivante, qui excède l'obligation légale d'adaptation au poste de travail : {{dedit.formation}}, pour un coût réel de {{dedit.cout}}.",
    "En contrepartie, le Salarié s'engage à rester au service de l'Employeur pendant {{dedit.duree}} à compter de la fin de la formation. En cas de démission avant ce terme, il remboursera à l'Employeur les frais de formation réellement engagés, au prorata de la durée de présence restant à accomplir. Le remboursement ne peut excéder le coût réel de la formation.",
    "La présente clause ne s'applique pas en cas de rupture du contrat à l'initiative de l'Employeur, sauf licenciement pour faute lourde.",
  ],
};

const PARTICULIERES: ArticleGabarit = {
  id: "particulieres",
  titre: "Clauses particulières",
  si: "particulieres",
  paragraphes: ["{{clauses.particulieres}}"],
};

const FIN_CDI: ArticleGabarit = {
  id: "rupture",
  titre: "Rupture du contrat",
  paragraphes: [
    "Le contrat peut être rompu à l'initiative de l'Employeur ou du Salarié dans le respect des dispositions légales et conventionnelles, notamment de la procédure applicable et du préavis fixé par la loi et par la convention collective selon l'ancienneté et la catégorie du Salarié, sauf faute grave ou lourde ou force majeure.",
    "À l'expiration du contrat, l'Employeur remet au Salarié un certificat de travail, un reçu pour solde de tout compte et l'attestation destinée à France Travail. Le Salarié restitue tout matériel, badge, clé, tenue et document appartenant à l'Employeur ou à ses clients.",
  ],
};

const FIN_CDD: ArticleGabarit = {
  id: "rupture",
  titre: "Rupture anticipée et fin du contrat",
  paragraphes: [
    "Sauf accord des parties, le contrat ne peut être rompu avant l'échéance du terme qu'en cas de faute grave, de force majeure, d'inaptitude constatée par le médecin du travail ou, à l'initiative du Salarié, lorsqu'il justifie d'une embauche en contrat à durée indéterminée.",
    "Lorsqu'elle est due, une indemnité de fin de contrat égale à 10 % de la rémunération totale brute versée au Salarié est payée au terme du contrat (article L. 1243-8 du Code du travail), sauf dans les cas d'exclusion prévus par la loi. Le Salarié perçoit en outre, à défaut de prise effective des congés, l'indemnité compensatrice de congés payés.",
    "À l'expiration du contrat, l'Employeur remet au Salarié un certificat de travail, un reçu pour solde de tout compte et l'attestation destinée à France Travail. Le Salarié restitue tout matériel, badge, clé, tenue et document appartenant à l'Employeur ou à ses clients.",
  ],
};

const DONNEES: ArticleGabarit = {
  id: "donnees",
  titre: "Données personnelles",
  paragraphes: [
    "Les données à caractère personnel du Salarié sont traitées par l'Employeur pour la gestion du personnel, la paie et le respect de ses obligations légales, conformément au règlement (UE) 2016/679 (RGPD) et à la loi du 6 janvier 1978 modifiée. Le Salarié dispose d'un droit d'accès, de rectification, d'effacement, de limitation et d'opposition, qu'il exerce auprès de l'Employeur.",
  ],
};

const DISPOSITIONS: ArticleGabarit = {
  id: "dispositions",
  titre: "Dispositions générales",
  paragraphes: [
    "Le présent contrat est régi par le droit français. Toute modification fera l'objet d'un avenant écrit et signé des deux parties. Pour tout ce qui n'est pas prévu au présent contrat, les parties se réfèrent au Code du travail et à la convention collective.",
  ],
};

// ─── Gabarits ───────────────────────────────────────────────────────────

const CLOTURE =
  "Fait à {{signature.lieu?}}, le {{signature.date?}}, en deux exemplaires originaux, dont un remis au Salarié.";

const SIGNATAIRES: GabaritContrat["signataires"] = [
  {
    libelle: "Le Salarié",
    mention: "(signature précédée de la mention « Lu et approuvé »)",
  },
  {
    libelle: "L'Employeur",
    mention: "(nom, qualité, signature et cachet)",
  },
];

const SOUS_TITRE =
  "Convention collective nationale des entreprises de prévention et de sécurité (IDCC 1351)";

function articles(
  duree: ArticleGabarit,
  essai: ArticleGabarit,
  horaires: ArticleGabarit,
  fin: ArticleGabarit,
): ArticleGabarit[] {
  return [
    ENGAGEMENT,
    FONCTIONS,
    CARTE,
    duree,
    essai,
    LIEU,
    horaires,
    REMUNERATION,
    CONGES,
    TENUE,
    PROTECTION,
    OBLIGATIONS,
    DEDIT,
    PARTICULIERES,
    fin,
    DONNEES,
    DISPOSITIONS,
  ];
}

export const GABARITS: Record<TypeGabarit, GabaritContrat> = {
  CDI_TEMPS_PLEIN: {
    libelle: "CDI à temps plein",
    titre: "CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE",
    sousTitre: SOUS_TITRE,
    intro: INTRO,
    articles: articles(DUREE_CDI, ESSAI_CDI, HORAIRES_PLEIN, FIN_CDI),
    cloture: CLOTURE,
    signataires: SIGNATAIRES,
  },
  CDI_TEMPS_PARTIEL: {
    libelle: "CDI à temps partiel",
    titre: "CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE À TEMPS PARTIEL",
    sousTitre: SOUS_TITRE,
    intro: INTRO,
    articles: articles(DUREE_CDI, ESSAI_CDI, HORAIRES_PARTIEL, FIN_CDI),
    cloture: CLOTURE,
    signataires: SIGNATAIRES,
  },
  CDD_TEMPS_PLEIN: {
    libelle: "CDD à temps plein",
    titre: "CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE",
    sousTitre: SOUS_TITRE,
    intro: INTRO,
    articles: articles(DUREE_CDD, ESSAI_CDD, HORAIRES_PLEIN, FIN_CDD),
    cloture: CLOTURE,
    signataires: SIGNATAIRES,
  },
  CDD_TEMPS_PARTIEL: {
    libelle: "CDD à temps partiel",
    titre: "CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE À TEMPS PARTIEL",
    sousTitre: SOUS_TITRE,
    intro: INTRO,
    articles: articles(DUREE_CDD, ESSAI_CDD, HORAIRES_PARTIEL, FIN_CDD),
    cloture: CLOTURE,
    signataires: SIGNATAIRES,
  },
};
