import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sheet, Field, inputCls, primaryBtn } from "@/components/app/Sheet";
import { PERF_DEVICES, PERF_PAGES, MAX_SYMPTOM_LEN, type PerfMetrics } from "@/lib/perf-ai";
import { diagnosePerformance } from "@/lib/perf-ai.functions";

function readMetrics(): PerfMetrics {
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const res = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  const n = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string } };
  return {
    loadMs: nav && nav.loadEventEnd > 0 ? nav.loadEventEnd : undefined,
    domReadyMs: nav ? nav.domContentLoadedEventEnd : undefined,
    resources: res.length,
    transferKb: Math.round(res.reduce((s, r) => s + (r.transferSize || 0), nav?.transferSize ?? 0) / 1024),
    connection: n.connection?.effectiveType,
    memoryGb: n.deviceMemory,
    cores: navigator.hardwareConcurrency,
  };
}

export function PerfDiagnosis({ open, onClose }: { open: boolean; onClose: () => void }) {
  const run = useServerFn(diagnosePerformance);
  const [page, setPage] = useState<string>(PERF_PAGES[0]);
  const [device, setDevice] = useState<string>(PERF_DEVICES[0]);
  const [symptoms, setSymptoms] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true); setError(""); setResult("");
    try {
      const r = await run({ data: { page, device, symptoms, metrics: readMetrics() } });
      if (r.ok) setResult(r.text); else setError(r.error);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Yavaşlık Teşhisi (AI)">
      <div className="space-y-3">
        <Field label="Yavaş açılan sayfa">
          <select className={inputCls} value={page} onChange={(e) => setPage(e.target.value)}>{PERF_PAGES.map((p) => <option key={p}>{p}</option>)}</select>
        </Field>
        <Field label="Cihaz">
          <select className={inputCls} value={device} onChange={(e) => setDevice(e.target.value)}>{PERF_DEVICES.map((d) => <option key={d}>{d}</option>)}</select>
        </Field>
        <Field label="Ne gözlemlediniz?">
          <textarea className={`${inputCls} min-h-24`} maxLength={MAX_SYMPTOM_LEN} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Örn. ilk açılışta 5-6 saniye beyaz ekran kalıyor, sonra açılıyor." />
        </Field>
        <p className="text-xs text-muted-foreground">Bu cihazın açılış ölçümleri de otomatik eklenir.</p>
        <button className={primaryBtn} onClick={submit} disabled={busy || !symptoms.trim()}>{busy ? "İnceleniyor…" : "Nedenleri ve çözümü bul"}</button>
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        {result && <div className="whitespace-pre-wrap rounded-xl border border-border bg-surface p-3 text-sm">{result}</div>}
      </div>
    </Sheet>
  );
}
