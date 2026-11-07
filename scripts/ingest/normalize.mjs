// Conversion des données ouvertes de Nantes Métropole vers le modèle de Buddy
// (types EventItem / Venue de src/data/types.ts). Fonctions pures, testées dans normalize.test.ts.

export const SOURCES = {
  metropole: {
    id: 'metropole',
    name: 'Agenda Nantes Métropole',
    dataset: '244400404_agenda-evenements-nantes-metropole_v2',
    url: 'https://data.nantesmetropole.fr/explore/dataset/244400404_agenda-evenements-nantes-metropole_v2/',
    license: 'Licence Ouverte 2.0',
  },
  bibliotheques: {
    id: 'bibliotheques',
    name: 'Bibliothèque municipale de Nantes',
    dataset: '244400404_agenda-animations-culturelles-bibliotheque-municipale-nantes',
    url: 'https://data.nantesmetropole.fr/explore/dataset/244400404_agenda-animations-culturelles-bibliotheque-municipale-nantes/',
    license: 'Licence Ouverte 2.0',
  },
};

// ---------- Texte ----------
export const normalize = (s = '') =>
  String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export const slug = (s = '') => normalize(s).replace(/\s+/g, '-').slice(0, 60);

const ACCENTS = {
  musee: 'musée', musees: 'musées', bibliotheque: 'bibliothèque', mediatheque: 'médiathèque', theatre: 'théâtre', cinema: 'cinéma',
  metropole: 'métropole', reze: 'rezé', ecole: 'école', eglise: 'église', association: 'association', cite: 'cité', ete: 'été',
  developpement: 'développement', culturel: 'culturel', departement: 'département', medecins: 'médecins', societe: 'société',
  creation: 'création', operation: 'opération', federation: 'fédération', comite: 'comité', education: 'éducation', espace: 'espace',
  centre: 'centre', loire: 'loire', etudiants: 'étudiants', universite: 'université', galerie: 'galerie', theatres: 'théâtres',
};
const SMALL = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'à', 'au', 'aux', 'en', 'sur', 'pour', 'd', 'l']);
/** « MUSEE JULES VERNE » → « Musée Jules Verne » (accents non restitués). */
export function titleCase(s = '') {
  const t = String(s).trim();
  if (!t) return '';
  if (t !== t.toUpperCase()) return t; // déjà en casse mixte : on garde
  return t
    .toLowerCase()
    .split(/(\s+|-|')/)
    .map((w) => ACCENTS[w] ?? w)
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('');
}

export const capFirst = (s = '') => {
  const t = String(s).trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Nettoie une description : espaces, mots collés (« internetProlonger »), longueur. */
export function cleanText(s, max = 700) {
  if (!s) return '';
  let t = String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/([a-zà-ÿ])([A-ZÀ-Ý][a-zà-ÿ]{2,})/g, '$1 $2')
    .replace(/([.!?…])([A-ZÀ-Ý])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length > max) t = t.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return t;
}

// ---------- Dates (fuseau Europe/Paris) ----------
const fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Paris', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
});
function parisOffsetMs(utcMs) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - utcMs;
}
/** "2026-11-12" + "20:30" (heure de Paris) → ISO UTC. */
export function parisToISO(date, hm = '00:00') {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = (hm || '00:00').split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h || 0, mi || 0);
  const off = parisOffsetMs(guess);
  return new Date(guess - off).toISOString();
}
const HM = /^\d{1,2}:\d{2}/;

// ---------- Prix ----------
/** Renvoie { price: number|null, priceText } ; null = payant mais montant inconnu. */
export function parsePrice(gratuit, text) {
  const t = (text || '').trim();
  const priceText = t ? cleanText(t, 140) : undefined;
  if (String(gratuit).toLowerCase() === 'oui') return { price: 0, priceText };
  const n = normalize(t);
  const amounts = [...t.matchAll(/(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?\b)/gi)].map((m) => parseFloat(m[1].replace(',', '.'))).filter((x) => x > 0 && x < 500);
  if (amounts.length) return { price: Math.min(...amounts), priceText };
  if (/\b(gratuit|entree libre|acces libre|prix libre|participation libre|au chapeau)\b/.test(n)) return { price: 0, priceText };
  return { price: null, priceText };
}

// ---------- Catégories ----------
// Ordre = priorité. Chaque règle teste les types, thèmes puis le titre (texte normalisé).
const RULES = [
  ['cinema', /\b(cinema|projection|film|ciné|documentaire)\b/],
  ['danse', /\b(danse|bal|salsa|tango|swing|hip hop|zumba|guinguette)\b/],
  ['concert', /\b(concert|musique|jazz|chanson|chorale|orchestre|dj|rap|rock|opera|recital|fanfare|electro)\b/],
  ['theatre', /\b(theatre|spectacle|impro|improvisation|cirque|marionnette|humour|conte|clown|one man|stand up|magie)\b/],
  ['marche', /\b(marche|vide grenier|brocante|braderie|bourse|troc|vente|foire|salon|epicerie)\b/],
  ['sport', /\b(sport|course|randonnee|rando|balade|velo|yoga|petanque|football|basket|marche nordique|tournoi sportif|piscine|gym|fitness|natation)\b/],
  ['jeux', /\b(jeu|jeux|ludotheque|quiz|blind test|escape|loto|belote|echecs|tournoi)\b/],
  ['rencontre', /\b(conference|debat|rencontre|lecture|dedicace|table ronde|causerie|cafe philo|forum|reunion publique|seance d information|permanence|apero)\b/],
  ['atelier', /\b(atelier|stage|initiation|cours|formation|activite a partager|repair|fabrication|bricolage|couture|cuisine|numerique|jardinage)\b/],
  ['expo', /\b(exposition|expo|vernissage|musee|galerie|installation|art)\b/],
  ['patrimoine', /\b(patrimoine|visite|histoire|historique|chateau|journees europeennes|memoire|archives)\b/],
  ['fete', /\b(fete|festival|carnaval|kermesse|animation|feu d artifice|marche de noel|celebration)\b/],
];

// pluriels acceptés : « expositions », « concerts »…
const RULES_PL = RULES.map(([c, re]) => [c, new RegExp(re.source.replace(/\)\\b$/, ')s?\\b'))]);

export function categorize({ types = [], themes = [], title = '', extra = [] }) {
  const fields = [types.join(' '), extra.join(' '), title, themes.join(' ')].map(normalize);
  for (const field of fields) {
    if (!field) continue;
    for (const [cat, re] of RULES_PL) if (re.test(field)) return cat;
  }
  return 'fete';
}

// ---------- Lieux ----------
export function venueFrom(rec) {
  const name = capFirst(rec.lieu || rec.adresse || 'Lieu à préciser');
  const cp = rec.code_postal ? String(rec.code_postal) : '';
  const city = rec.ville ? titleCase(rec.ville) : '';
  const street = (rec.adresse || '').replace(/\s+/g, ' ').trim();
  const address = [street, [cp, city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const geo = rec.location_latlong;
  return {
    id: `v-${slug(name)}-${cp || slug(city)}`,
    name,
    address,
    lat: geo && typeof geo.lat === 'number' ? geo.lat : NaN,
    lng: geo && typeof geo.lon === 'number' ? geo.lon : NaN,
    _query: [street, cp, city].filter(Boolean).join(' '),
    _postcode: cp,
  };
}

const yes = (v) => String(v || '').toLowerCase() === 'oui';
const asList = (v) => (Array.isArray(v) ? v.filter(Boolean) : v ? String(v).split(/[;,]/).map((x) => x.trim()).filter(Boolean) : []);

/** Une ligne du jeu de données (une date d'un événement) → { event, venue } ou null si inexploitable. */
export function eventFrom(rec, sourceId) {
  const src = SOURCES[sourceId];
  if (!rec || !rec.nom || !rec.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(rec.date))) return null;
  const venue = venueFrom(rec);
  const hasStart = HM.test(rec.heure_debut || '');
  const startHM = hasStart ? rec.heure_debut.slice(0, 5) : '00:00';
  const start = parisToISO(rec.date, startHM);
  let end;
  if (HM.test(rec.heure_fin || '')) {
    end = parisToISO(rec.date, rec.heure_fin.slice(0, 5));
    if (end <= start) end = new Date(new Date(end).getTime() + 86400000).toISOString();
  } else {
    end = hasStart ? new Date(new Date(start).getTime() + 2 * 3600000).toISOString() : parisToISO(rec.date, '23:59');
  }
  const types = asList(rec.types_libelles);
  const themes = asList(rec.themes_libelles);
  const extra = [rec.categorie_1, rec.categorie_2, rec.categorie_3, rec.categorie_4, rec.categorie_5, rec.rubrique].filter(Boolean);
  const { price, priceText } = parsePrice(rec.gratuit, rec.precisions_tarifs_evt ?? rec.precisions_tarifs);
  const status = yes(rec.annule) ? 'cancelled' : yes(rec.reporte) ? 'postponed' : yes(rec.complet) ? 'full' : undefined;
  const organizer = titleCase(rec.organisateurs || rec.emetteur || src.name);
  const event = {
    id: `${sourceId === 'metropole' ? 'nm' : 'bm'}-${rec.id_manif}-${rec.date.replace(/-/g, '')}${startHM.replace(':', '')}`,
    seriesId: `${rec.id_manif}`,
    title: cleanText(rec.nom, 120),
    organizer,
    category: categorize({ types, themes, title: rec.nom, extra }),
    start,
    end,
    ...(hasStart ? {} : { allDay: true }),
    venueId: venue.id,
    price,
    ...(priceText ? { priceText } : {}),
    pmr: yes(rec.h_moteur),
    ...(rec.media_url ? { image: rec.media_url } : {}),
    description: cleanText(rec.description_evt ?? rec.description) || 'Plus d’informations sur la page de l’événement.',
    attendees: [],
    attendeeCount: 0,
    ...(status ? { status } : {}),
    ...(yes(rec.accueil_enfant) ? { kids: true } : {}),
    source: sourceId,
    ...(rec.lien_agenda ? { sourceUrl: rec.lien_agenda } : {}),
  };
  return { event, venue };
}

/** Dédoublonnage : même série + même début, ou même début + titre identique normalisé. */
export function dedupe(events) {
  const seen = new Map();
  const out = [];
  for (const e of events) {
    const k1 = `${e.seriesId}|${e.start}`;
    const k2 = `${e.start}|${normalize(e.title).slice(0, 40)}`;
    if (seen.has(k1) || seen.has(k2)) continue;
    seen.set(k1, 1);
    seen.set(k2, 1);
    out.push(e);
  }
  return out;
}
