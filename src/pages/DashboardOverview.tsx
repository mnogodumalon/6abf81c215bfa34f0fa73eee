import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichKurse, enrichAnmeldungen } from '@/lib/enrich';
import type { EnrichedKurse, EnrichedAnmeldungen } from '@/types/enriched';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordId } from '@/services/livingAppsService';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { KurseDialog } from '@/components/dialogs/KurseDialog';
import { AnmeldungenDialog } from '@/components/dialogs/AnmeldungenDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconPencil, IconTrash, IconUsers, IconCalendar,
  IconClock, IconMapPin, IconUser, IconChartBar, IconSchool,
} from '@tabler/icons-react';

const APPGROUP_ID = '6abf81c215bfa34f0fa73eee';
const REPAIR_ENDPOINT = '/claude/build/repair';

const STATUS_COLUMNS = [
  { key: 'geplant', label: 'Geplant', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { key: 'anmeldung_offen', label: 'Anmeldung offen', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'ausgebucht', label: 'Ausgebucht', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'laufend', label: 'Laufend', color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'abgeschlossen', label: 'Abgeschlossen', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'abgesagt', label: 'Abgesagt', color: 'bg-red-100 text-red-700 border-red-200' },
];

const STATUS_HEADER_COLOR: Record<string, string> = {
  geplant: 'border-t-slate-400',
  anmeldung_offen: 'border-t-blue-500',
  ausgebucht: 'border-t-amber-500',
  laufend: 'border-t-green-500',
  abgeschlossen: 'border-t-purple-500',
  abgesagt: 'border-t-red-500',
};

export default function DashboardOverview() {
  const {
    kursleiter, teilnehmer, kurse, anmeldungen,
    kursleiterMap, teilnehmerMap, kurseMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const [kurseDialogOpen, setKurseDialogOpen] = useState(false);
  const [editKurs, setEditKurs] = useState<EnrichedKurse | null>(null);
  const [deleteKurs, setDeleteKurs] = useState<EnrichedKurse | null>(null);
  const [anmeldungDialogOpen, setAnmeldungDialogOpen] = useState(false);
  const [selectedKursId, setSelectedKursId] = useState<string | null>(null);
  const [expandedKursId, setExpandedKursId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const enrichedKurse = useMemo(() => enrichKurse(kurse, { kursleiterMap }), [kurse, kursleiterMap]);
  const enrichedAnmeldungen = useMemo(() => enrichAnmeldungen(anmeldungen, { teilnehmerMap, kurseMap }), [anmeldungen, teilnehmerMap, kurseMap]);

  const anmeldungenByKurs = useMemo(() => {
    const map = new Map<string, EnrichedAnmeldungen[]>();
    for (const a of enrichedAnmeldungen) {
      const id = extractRecordId(a.fields.kurs);
      if (!id) continue;
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(a);
    }
    return map;
  }, [enrichedAnmeldungen]);

  const totalUmsatz = useMemo(() => {
    return enrichedAnmeldungen
      .filter(a => a.fields.zahlungsstatus?.key === 'bezahlt')
      .reduce((sum, a) => {
        const id = extractRecordId(a.fields.kurs);
        if (!id) return sum;
        const kursRecord = kurseMap.get(id);
        return sum + (kursRecord?.fields.preis ?? 0);
      }, 0);
  }, [enrichedAnmeldungen, kurseMap]);

  const offenAnmeldungen = useMemo(
    () => enrichedAnmeldungen.filter(a => a.fields.zahlungsstatus?.key === 'offen').length,
    [enrichedAnmeldungen]
  );

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const displayColumns = filterStatus
    ? STATUS_COLUMNS.filter(c => c.key === filterStatus)
    : STATUS_COLUMNS;

  const kurseByStatus = (statusKey: string) =>
    enrichedKurse.filter(k => (k.fields.kursstatus?.key ?? 'geplant') === statusKey);

  const handleDeleteKurs = async () => {
    if (!deleteKurs) return;
    await LivingAppsService.deleteKurseEntry(deleteKurs.record_id);
    setDeleteKurs(null);
    fetchAll();
  };

  return (
    <div className="space-y-6">
      {/* KPI Zeile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Kurse gesamt"
          value={String(kurse.length)}
          description="Alle Kurse"
          icon={<IconSchool size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Teilnehmer"
          value={String(teilnehmer.length)}
          description="Registriert"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Anmeldungen offen"
          value={String(offenAnmeldungen)}
          description="Ausstehende Zahlung"
          icon={<IconChartBar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Umsatz bezahlt"
          value={formatCurrency(totalUmsatz)}
          description="Bezahlte Kursgebühren"
          icon={<IconCalendar size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Header + Aktionen */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Kursübersicht</h2>
          <p className="text-sm text-muted-foreground">Kurse nach Status verwalten</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-1">
            <Button
              variant={filterStatus === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(null)}
              className="text-xs"
            >
              Alle
            </Button>
            {STATUS_COLUMNS.map(s => (
              <Button
                key={s.key}
                variant={filterStatus === s.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(filterStatus === s.key ? null : s.key)}
                className="text-xs"
              >
                {s.label}
                <span className="ml-1 text-xs opacity-70">
                  ({kurseByStatus(s.key).length})
                </span>
              </Button>
            ))}
          </div>
          <Button size="sm" onClick={() => { setEditKurs(null); setKurseDialogOpen(true); }}>
            <IconPlus size={15} className="shrink-0 mr-1" />
            Kurs anlegen
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className={`grid gap-4 min-w-[320px] ${displayColumns.length === 1 ? 'grid-cols-1 max-w-sm' : `grid-cols-${Math.min(displayColumns.length, 3)} lg:grid-cols-${displayColumns.length}`}`}
          style={{ gridTemplateColumns: `repeat(${displayColumns.length}, minmax(260px, 1fr))` }}
        >
          {displayColumns.map(col => {
            const colKurse = kurseByStatus(col.key);
            return (
              <div key={col.key} className={`rounded-2xl border-t-4 border border-border bg-card shadow-sm flex flex-col min-h-[200px] ${STATUS_HEADER_COLOR[col.key]}`}>
                <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{col.label}</span>
                  <Badge variant="secondary" className="text-xs">{colKurse.length}</Badge>
                </div>
                <div className="flex flex-col gap-2 px-3 pb-4 flex-1">
                  {colKurse.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/60">
                      <IconSchool size={28} stroke={1.5} />
                      <span className="text-xs mt-2">Keine Kurse</span>
                    </div>
                  )}
                  {colKurse.map(kurs => {
                    const kursAnmeldungen = anmeldungenByKurs.get(kurs.record_id) ?? [];
                    const aktiveAnmeldungen = kursAnmeldungen.filter(a => a.fields.anmeldestatus?.key !== 'storniert');
                    const maxTN = kurs.fields.max_teilnehmer ?? 0;
                    const fillPercent = maxTN > 0 ? Math.min(100, (aktiveAnmeldungen.length / maxTN) * 100) : 0;
                    const isExpanded = expandedKursId === kurs.record_id;

                    return (
                      <div
                        key={kurs.record_id}
                        className="bg-background rounded-xl border border-border p-3 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setExpandedKursId(isExpanded ? null : kurs.record_id)}
                      >
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {kurs.fields.kurstitel ?? '(Kein Titel)'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {kurs.fields.yoga_stil?.label ?? '—'} · {kurs.fields.niveau?.label ?? '—'}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                              onClick={e => { e.stopPropagation(); setEditKurs(kurs); setKurseDialogOpen(true); }}
                              title="Bearbeiten"
                            >
                              <IconPencil size={13} className="text-muted-foreground" />
                            </button>
                            <button
                              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                              onClick={e => { e.stopPropagation(); setDeleteKurs(kurs); }}
                              title="Löschen"
                            >
                              <IconTrash size={13} className="text-destructive/70" />
                            </button>
                          </div>
                        </div>

                        {/* Infos */}
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {kurs.fields.startdatum && (
                            <span className="flex items-center gap-1">
                              <IconCalendar size={11} className="shrink-0" />
                              {formatDate(kurs.fields.startdatum)}
                            </span>
                          )}
                          {kurs.fields.wochentag && (
                            <span className="flex items-center gap-1">
                              <IconClock size={11} className="shrink-0" />
                              {kurs.fields.wochentag.label}
                            </span>
                          )}
                          {kurs.fields.ort && (
                            <span className="flex items-center gap-1 truncate max-w-[120px]">
                              <IconMapPin size={11} className="shrink-0" />
                              <span className="truncate">{kurs.fields.ort}</span>
                            </span>
                          )}
                          {kurs.kursleiterName && (
                            <span className="flex items-center gap-1 truncate max-w-[120px]">
                              <IconUser size={11} className="shrink-0" />
                              <span className="truncate">{kurs.kursleiterName}</span>
                            </span>
                          )}
                        </div>

                        {/* Auslastungsbalken */}
                        {maxTN > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span className="flex items-center gap-1">
                                <IconUsers size={11} className="shrink-0" />
                                {aktiveAnmeldungen.length}/{maxTN}
                              </span>
                              {kurs.fields.preis != null && (
                                <span className="font-medium text-foreground">{formatCurrency(kurs.fields.preis)}</span>
                              )}
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${fillPercent >= 100 ? 'bg-amber-500' : fillPercent >= 80 ? 'bg-green-500' : 'bg-primary'}`}
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Ausgeklappt: Anmeldungen */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-foreground">Anmeldungen</span>
                              <button
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedKursId(kurs.record_id);
                                  setAnmeldungDialogOpen(true);
                                }}
                              >
                                <IconPlus size={11} />
                                Neu
                              </button>
                            </div>
                            {kursAnmeldungen.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Noch keine Anmeldungen</p>
                            ) : (
                              <div className="space-y-1">
                                {kursAnmeldungen.map(a => (
                                  <div key={a.record_id} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="truncate min-w-0 text-foreground">{a.teilnehmerName || '—'}</span>
                                    <div className="flex gap-1 shrink-0">
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] px-1.5 py-0 ${
                                          a.fields.anmeldestatus?.key === 'angemeldet' ? 'bg-green-50 text-green-700 border-green-200' :
                                          a.fields.anmeldestatus?.key === 'warteliste' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                          'bg-red-50 text-red-700 border-red-200'
                                        }`}
                                      >
                                        {a.fields.anmeldestatus?.label ?? '—'}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] px-1.5 py-0 ${
                                          a.fields.zahlungsstatus?.key === 'bezahlt' ? 'bg-green-50 text-green-700 border-green-200' :
                                          a.fields.zahlungsstatus?.key === 'erstattet' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                          'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}
                                      >
                                        {a.fields.zahlungsstatus?.label ?? '—'}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Neuen Kurs in dieser Spalte anlegen */}
                  <button
                    className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary rounded-xl px-3 py-2 transition-colors w-full"
                    onClick={() => {
                      const opt = LOOKUP_OPTIONS['kurse']?.kursstatus?.find(o => o.key === col.key);
                      setEditKurs(null);
                      setKurseDialogOpen(true);
                    }}
                  >
                    <IconPlus size={13} className="shrink-0" />
                    Kurs hinzufügen
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kursleiter Übersicht */}
      {kursleiter.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-foreground mb-3">Kursleiter</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {kursleiter.map(kl => {
              const klKurse = enrichedKurse.filter(k => {
                const id = extractRecordId(k.fields.kursleiter);
                return id === kl.record_id;
              });
              return (
                <div key={kl.record_id} className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {(kl.fields.vorname?.[0] ?? '') + (kl.fields.nachname?.[0] ?? '')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {kl.fields.vorname} {kl.fields.nachname}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{kl.fields.email ?? '—'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(kl.fields.stilrichtungen ?? []).map(s => (
                      <Badge key={s.key} variant="secondary" className="text-[10px] px-1.5 py-0">{s.label}</Badge>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <IconSchool size={12} className="shrink-0" />
                    <span>{klKurse.length} Kurs{klKurse.length !== 1 ? 'e' : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialoge */}
      <KurseDialog
        open={kurseDialogOpen}
        onClose={() => { setKurseDialogOpen(false); setEditKurs(null); }}
        onSubmit={async (fields) => {
          if (editKurs) {
            await LivingAppsService.updateKurseEntry(editKurs.record_id, fields);
          } else {
            await LivingAppsService.createKurseEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editKurs?.fields}
        kursleiterList={kursleiter}
        enablePhotoScan={AI_PHOTO_SCAN['Kurse']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Kurse']}
      />

      <AnmeldungenDialog
        open={anmeldungDialogOpen}
        onClose={() => { setAnmeldungDialogOpen(false); setSelectedKursId(null); }}
        onSubmit={async (fields) => {
          await LivingAppsService.createAnmeldungenEntry(fields);
          fetchAll();
        }}
        defaultValues={selectedKursId ? { kurs: createRecordUrl(APP_IDS.KURSE, selectedKursId) } : undefined}
        teilnehmerList={teilnehmer}
        kurseList={kurse}
        enablePhotoScan={AI_PHOTO_SCAN['Anmeldungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Anmeldungen']}
      />

      <ConfirmDialog
        open={!!deleteKurs}
        title="Kurs löschen"
        description={`Kurs "${deleteKurs?.fields.kurstitel ?? ''}" wirklich löschen? Alle Anmeldungen bleiben erhalten.`}
        onConfirm={handleDeleteKurs}
        onClose={() => setDeleteKurs(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, minmax(260px, 1fr))' }}>
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);

    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });

    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });

      if (!resp.ok || !resp.body) {
        setRepairing(false);
        setRepairFailed(true);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          if (content.startsWith('[DONE]')) { setRepairDone(true); setRepairing(false); }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) setRepairFailed(true);
        }
      }
    } catch {
      setRepairing(false);
      setRepairFailed(true);
    }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte lade die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktiere den Support.</p>}
    </div>
  );
}
