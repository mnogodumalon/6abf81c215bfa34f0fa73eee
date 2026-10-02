import type { EnrichedAnmeldungen, EnrichedKurse } from '@/types/enriched';
import type { Anmeldungen, Kurse, Kursleiter, Teilnehmer } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface KurseMaps {
  kursleiterMap: Map<string, Kursleiter>;
}

export function enrichKurse(
  kurse: Kurse[],
  maps: KurseMaps
): EnrichedKurse[] {
  return kurse.map(r => ({
    ...r,
    kursleiterName: resolveDisplay(r.fields.kursleiter, maps.kursleiterMap, 'vorname', 'nachname'),
  }));
}

interface AnmeldungenMaps {
  teilnehmerMap: Map<string, Teilnehmer>;
  kurseMap: Map<string, Kurse>;
}

export function enrichAnmeldungen(
  anmeldungen: Anmeldungen[],
  maps: AnmeldungenMaps
): EnrichedAnmeldungen[] {
  return anmeldungen.map(r => ({
    ...r,
    teilnehmerName: resolveDisplay(r.fields.teilnehmer, maps.teilnehmerMap, 'vorname', 'nachname'),
    kursName: resolveDisplay(r.fields.kurs, maps.kurseMap, 'kurstitel'),
  }));
}
