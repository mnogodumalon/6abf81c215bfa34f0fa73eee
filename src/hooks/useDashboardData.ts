import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Kursleiter, Teilnehmer, Kurse, Anmeldungen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [kursleiter, setKursleiter] = useState<Kursleiter[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [kursleiterData, teilnehmerData, kurseData, anmeldungenData] = await Promise.all([
        LivingAppsService.getKursleiter(),
        LivingAppsService.getTeilnehmer(),
        LivingAppsService.getKurse(),
        LivingAppsService.getAnmeldungen(),
      ]);
      setKursleiter(kursleiterData);
      setTeilnehmer(teilnehmerData);
      setKurse(kurseData);
      setAnmeldungen(anmeldungenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [kursleiterData, teilnehmerData, kurseData, anmeldungenData] = await Promise.all([
          LivingAppsService.getKursleiter(),
          LivingAppsService.getTeilnehmer(),
          LivingAppsService.getKurse(),
          LivingAppsService.getAnmeldungen(),
        ]);
        setKursleiter(kursleiterData);
        setTeilnehmer(teilnehmerData);
        setKurse(kurseData);
        setAnmeldungen(anmeldungenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const kursleiterMap = useMemo(() => {
    const m = new Map<string, Kursleiter>();
    kursleiter.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kursleiter]);

  const teilnehmerMap = useMemo(() => {
    const m = new Map<string, Teilnehmer>();
    teilnehmer.forEach(r => m.set(r.record_id, r));
    return m;
  }, [teilnehmer]);

  const kurseMap = useMemo(() => {
    const m = new Map<string, Kurse>();
    kurse.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kurse]);

  return { kursleiter, setKursleiter, teilnehmer, setTeilnehmer, kurse, setKurse, anmeldungen, setAnmeldungen, loading, error, fetchAll, kursleiterMap, teilnehmerMap, kurseMap };
}