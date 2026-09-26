/**
 * Écrivain ZIP minimal, sans dépendance (méthode « stored », sans compression).
 * Suffisant pour les conteneurs Office Open XML (.xlsx) et les archives de
 * quelques fichiers. Limites : pas de ZIP64 (< 4 Go et < 65 535 entrées).
 */

export interface ZipEntry {
  /** Chemin dans l'archive, avec « / » (ex. « xl/workbook.xml »). */
  name: string;
  data: Uint8Array;
}

const TABLE_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = TABLE_CRC[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** Date/heure MS-DOS (résolution 2 s, année ≥ 1980). */
function dateDos(d: Date): { time: number; date: number } {
  const annee = Math.max(1980, d.getFullYear());
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((annee - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

export function createZip(entries: ZipEntry[]): Uint8Array {
  const encodeur = new TextEncoder();
  const { time, date } = dateDos(new Date());
  const noms = entries.map((e) => encodeur.encode(e.name));

  // Taille totale : en-têtes locaux + données + répertoire central + fin.
  let taille = 22;
  entries.forEach((e, i) => {
    taille += 30 + noms[i].length + e.data.length;
    taille += 46 + noms[i].length;
  });

  const out = new Uint8Array(taille);
  const vue = new DataView(out.buffer);
  let pos = 0;
  const offsets: number[] = [];
  const crcs: number[] = [];

  entries.forEach((e, i) => {
    const crc = crc32(e.data);
    crcs.push(crc);
    offsets.push(pos);
    vue.setUint32(pos, 0x04034b50, true); // signature en-tête local
    vue.setUint16(pos + 4, 20, true); // version nécessaire
    vue.setUint16(pos + 6, 0x0800, true); // bit 11 : nom en UTF-8
    vue.setUint16(pos + 8, 0, true); // méthode 0 = stored
    vue.setUint16(pos + 10, time, true);
    vue.setUint16(pos + 12, date, true);
    vue.setUint32(pos + 14, crc, true);
    vue.setUint32(pos + 18, e.data.length, true); // taille compressée
    vue.setUint32(pos + 22, e.data.length, true); // taille d'origine
    vue.setUint16(pos + 26, noms[i].length, true);
    vue.setUint16(pos + 28, 0, true); // pas de champ « extra »
    out.set(noms[i], pos + 30);
    out.set(e.data, pos + 30 + noms[i].length);
    pos += 30 + noms[i].length + e.data.length;
  });

  const debutCentral = pos;
  entries.forEach((e, i) => {
    vue.setUint32(pos, 0x02014b50, true); // signature répertoire central
    vue.setUint16(pos + 4, 20, true); // créé par
    vue.setUint16(pos + 6, 20, true); // version nécessaire
    vue.setUint16(pos + 8, 0x0800, true);
    vue.setUint16(pos + 10, 0, true);
    vue.setUint16(pos + 12, time, true);
    vue.setUint16(pos + 14, date, true);
    vue.setUint32(pos + 16, crcs[i], true);
    vue.setUint32(pos + 20, e.data.length, true);
    vue.setUint32(pos + 24, e.data.length, true);
    vue.setUint16(pos + 28, noms[i].length, true);
    // extra, commentaire, disque, attributs internes/externes : 0
    vue.setUint32(pos + 42, offsets[i], true);
    out.set(noms[i], pos + 46);
    pos += 46 + noms[i].length;
  });

  const tailleCentral = pos - debutCentral;
  vue.setUint32(pos, 0x06054b50, true); // fin de répertoire central
  vue.setUint16(pos + 8, entries.length, true);
  vue.setUint16(pos + 10, entries.length, true);
  vue.setUint32(pos + 12, tailleCentral, true);
  vue.setUint32(pos + 16, debutCentral, true);
  return out;
}
