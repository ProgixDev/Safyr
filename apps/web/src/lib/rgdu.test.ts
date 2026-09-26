import { test } from "node:test";
import assert from "node:assert/strict";
import { calculerCoefficientRGDU } from "./rgdu";
import { calculerCout } from "./cout-salarie";
import {
  heuresHebdoVersMensuelles,
  heuresMensuellesVersHebdo,
} from "./heures-contrat";

test("RGDU : exemple du client (brut 1 985,60 €)", () => {
  const r = calculerCoefficientRGDU({ brutMensuel: 1985.6 });
  assert.equal(r.coefficient, 0.3221);
  assert.equal(r.reduction, 639.56);
});

test("RGDU : nul à partir de 3 SMIC, plafonné à Tmin + Tdelta", () => {
  assert.equal(
    calculerCoefficientRGDU({ brutMensuel: 5469.09 }).coefficient,
    0,
  );
  assert.equal(calculerCoefficientRGDU({ brutMensuel: 1000 }).coefficient, 0.4);
  assert.equal(
    calculerCoefficientRGDU({ brutMensuel: 1000, effectifMoins50: false })
      .coefficient,
    0.4021,
  );
  assert.equal(calculerCoefficientRGDU({ brutMensuel: 0 }).reduction, 0);
});

test("RGDU : temps partiel, SMIC proratisé aux heures", () => {
  // 20 h/semaine = 86,67 h/mois : même rapport brut/SMIC qu'à temps plein.
  const partiel = calculerCoefficientRGDU({
    brutMensuel: 1985.6 / 2,
    heuresMois: 151.67 / 2,
  });
  assert.equal(partiel.coefficient, 0.3221);
});

test("Coût : charges après réduction plafonnées à 0", () => {
  const base = {
    brut: 1985.6,
    heures: 151.67,
    tauxPatronal: 20,
    tauxSalarial: 22,
    effectifMoins50: true,
  };
  const avec = calculerCout({ ...base, appliquerRgdu: true });
  assert.equal(avec.chargesPatronales, 397.12);
  assert.equal(avec.reductionRgdu, 639.56);
  assert.equal(avec.chargesPatronalesApresReduction, 0);
  assert.equal(avec.coutTotal, 1985.6);
  assert.equal(avec.net, 1548.77);
  const sans = calculerCout({ ...base, appliquerRgdu: false });
  assert.equal(sans.reductionRgdu, 0);
  assert.equal(sans.coutTotal, 2382.72);
});

test("Heures : 108 h → 108 h après aller-retour (pas 107,99)", () => {
  assert.equal(heuresHebdoVersMensuelles(heuresMensuellesVersHebdo(108)), 108);
  assert.equal(
    heuresHebdoVersMensuelles(heuresMensuellesVersHebdo(107.5)),
    107.5,
  );
  assert.equal(heuresHebdoVersMensuelles(35), 151.67);
  // Contrat déjà enregistré avec l'ancien arrondi (24,92 h/semaine).
  assert.equal(heuresHebdoVersMensuelles(24.92), 108);
});

test("Heures : aller-retour exact pour toute saisie au centième", () => {
  for (let c = 0; c <= 30000; c++) {
    const h = c / 100;
    const retour = heuresHebdoVersMensuelles(heuresMensuellesVersHebdo(h));
    assert.equal(retour, h, `${h} → ${retour}`);
  }
});
