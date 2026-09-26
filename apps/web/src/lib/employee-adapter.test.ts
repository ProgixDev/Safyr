import { test } from "node:test";
import assert from "node:assert/strict";
import {
  dateVersChamp,
  estDateRenseignee,
  formatDateFr,
} from "./employee-adapter";

test("affiche une naissance avant 1970 (Khelifi 1961, Komlan 1966, Houara 1967)", () => {
  for (const [iso, attendu] of [
    ["1961-12-16T00:00:00.000Z", "16/12/1961"],
    ["1966-11-23T00:00:00.000Z", "23/11/1966"],
    ["1967-08-29T00:00:00.000Z", "29/08/1967"],
  ] as const) {
    const d = new Date(iso);
    assert.equal(estDateRenseignee(d), true);
    assert.equal(formatDateFr(d), attendu);
    assert.equal(dateVersChamp(d), iso.slice(0, 10));
  }
});

test("traite l'époque exacte et les dates invalides comme absentes", () => {
  assert.equal(formatDateFr(new Date(0)), "—");
  assert.equal(dateVersChamp(new Date(0)), "");
  assert.equal(formatDateFr(new Date("n'importe quoi")), "—");
  assert.equal(formatDateFr(undefined), "—");
});
