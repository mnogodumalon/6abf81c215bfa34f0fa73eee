// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Kursleiter {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    nachname?: string;
    email?: string;
    telefon?: string;
    stilrichtungen?: LookupValue[];
    kurzbeschreibung?: string;
    vorname?: string;
  };
}

export interface Teilnehmer {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    erfahrung?: LookupValue;
    gesundheitliche_hinweise?: string;
  };
}

export interface Kurse {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    yoga_stil?: LookupValue;
    niveau?: LookupValue;
    beschreibung?: string;
    kursleiter?: string; // applookup -> URL zu 'Kursleiter' Record
    startdatum?: string; // Format: YYYY-MM-DD oder ISO String
    dauer_minuten?: number;
    anzahl_termine?: number;
    wochentag?: LookupValue;
    ort?: string;
    max_teilnehmer?: number;
    preis?: number;
    kursstatus?: LookupValue;
    kurstitel?: string;
  };
}

export interface Anmeldungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    teilnehmer?: string; // applookup -> URL zu 'Teilnehmer' Record
    kurs?: string; // applookup -> URL zu 'Kurse' Record
    anmeldedatum?: string; // Format: YYYY-MM-DD oder ISO String
    anmeldestatus?: LookupValue;
    zahlungsstatus?: LookupValue;
    bemerkung?: string;
  };
}

export const APP_IDS = {
  KURSLEITER: '6abf81a487ca6e2d98591819',
  TEILNEHMER: '6abf81a93f5063fd61de9826',
  KURSE: '6abf81aa672363357804ecaa',
  ANMELDUNGEN: '6abf81aae81d8ad02efba372',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'kursleiter': {
    stilrichtungen: [{ key: "hatha", label: "Hatha" }, { key: "vinyasa", label: "Vinyasa" }, { key: "yin", label: "Yin Yoga" }, { key: "ashtanga", label: "Ashtanga" }, { key: "kundalini", label: "Kundalini" }, { key: "pilates_yoga", label: "Pilates-Yoga" }],
  },
  'teilnehmer': {
    erfahrung: [{ key: "anfaenger", label: "Anfänger" }, { key: "fortgeschritten", label: "Fortgeschritten" }, { key: "profi", label: "Profi" }],
  },
  'kurse': {
    yoga_stil: [{ key: "vinyasa", label: "Vinyasa" }, { key: "yin", label: "Yin Yoga" }, { key: "ashtanga", label: "Ashtanga" }, { key: "kundalini", label: "Kundalini" }, { key: "pilates_yoga", label: "Pilates-Yoga" }, { key: "hatha", label: "Hatha" }],
    niveau: [{ key: "anfaenger", label: "Anfänger" }, { key: "mittelstufe", label: "Mittelstufe" }, { key: "fortgeschritten", label: "Fortgeschritten" }, { key: "alle_level", label: "Alle Level" }],
    wochentag: [{ key: "montag", label: "Montag" }, { key: "dienstag", label: "Dienstag" }, { key: "mittwoch", label: "Mittwoch" }, { key: "donnerstag", label: "Donnerstag" }, { key: "freitag", label: "Freitag" }, { key: "samstag", label: "Samstag" }, { key: "sonntag", label: "Sonntag" }],
    kursstatus: [{ key: "geplant", label: "Geplant" }, { key: "anmeldung_offen", label: "Anmeldung offen" }, { key: "ausgebucht", label: "Ausgebucht" }, { key: "laufend", label: "Laufend" }, { key: "abgeschlossen", label: "Abgeschlossen" }, { key: "abgesagt", label: "Abgesagt" }],
  },
  'anmeldungen': {
    anmeldestatus: [{ key: "angemeldet", label: "Angemeldet" }, { key: "warteliste", label: "Warteliste" }, { key: "storniert", label: "Storniert" }],
    zahlungsstatus: [{ key: "offen", label: "Offen" }, { key: "bezahlt", label: "Bezahlt" }, { key: "erstattet", label: "Erstattet" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'kursleiter': {
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
    'stilrichtungen': 'multiplelookup/checkbox',
    'kurzbeschreibung': 'string/textarea',
    'vorname': 'string/text',
  },
  'teilnehmer': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
    'geburtsdatum': 'date/date',
    'erfahrung': 'lookup/radio',
    'gesundheitliche_hinweise': 'string/textarea',
  },
  'kurse': {
    'yoga_stil': 'lookup/select',
    'niveau': 'lookup/radio',
    'beschreibung': 'string/textarea',
    'kursleiter': 'applookup/select',
    'startdatum': 'date/datetimeminute',
    'dauer_minuten': 'number',
    'anzahl_termine': 'number',
    'wochentag': 'lookup/select',
    'ort': 'string/text',
    'max_teilnehmer': 'number',
    'preis': 'number',
    'kursstatus': 'lookup/select',
    'kurstitel': 'string/text',
  },
  'anmeldungen': {
    'teilnehmer': 'applookup/select',
    'kurs': 'applookup/select',
    'anmeldedatum': 'date/date',
    'anmeldestatus': 'lookup/radio',
    'zahlungsstatus': 'lookup/select',
    'bemerkung': 'string/textarea',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateKursleiter = StripLookup<Kursleiter['fields']>;
export type CreateTeilnehmer = StripLookup<Teilnehmer['fields']>;
export type CreateKurse = StripLookup<Kurse['fields']>;
export type CreateAnmeldungen = StripLookup<Anmeldungen['fields']>;