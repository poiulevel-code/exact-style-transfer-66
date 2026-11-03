import { localIso } from "@/lib/utils";
import { Link, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useRef, useState } from "react";
import { Download, Upload, FileDown, UserPlus, Sparkles, Mail, Gauge } from "@/components/app/icons";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/app/Sheet";
import { StudentForm, emptyStudent } from "@/components/app/StudentForm";
import { useStore, type State } from "@/lib/store";
import { exportFiles, importFiles } from "@/lib/attachments";
import { trialPrefix, withTrialStudents } from "@/lib/trial-students";
import { groupLabel } from "@/lib/groups";

// Heavy sheets load only when opened, so the Menu page opens instantly.
const EmailReports = lazy(() => import("@/components/app/EmailReports").then((m) => ({ default: m.EmailReports })));
const ReportSheet = lazy(() => import("@/components/app/ReportSheet").then((m) => ({ default: m.ReportSheet })));
const BlankAttendanceSheet = lazy(() => import("@/components/app/BlankAttendanceSheet").then((m) => ({ default: m.BlankAttendanceSheet })));
const PhotoNamesImport = lazy(() => import("@/components/app/PhotoNamesImport").then((m) => ({ default: m.PhotoNamesImport })));
const PerfDiagnosis = lazy(() => import("@/components/app/PerfDiagnosis").then((m) => ({ default: m.PerfDiagnosis })));

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menü — Kur'an Kursu" },
      { name: "description", content: "Kur'an kursu verilerini yedekleyin ve geri yükleyin." },
      { property: "og:title", content: "Menü — Kur'an Kursu" },
      { property: "og:description", content: "Kur'an kursu verilerini yedekleyin ve geri yükleyin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Menu,
});

function Menu() {
  const { students, tutanaklar, attendance, importAll, addStudent, all, replaceAll, group } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [blankOpen, setBlankOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const [perfOpen, setPerfOpen] = useState(false);

  // Backups always hold both groups.
  const exportData = async () => {
    const ids = all.tutanaklar.flatMap((t) => [t.photoId, t.docId]).filter((x): x is string => Boolean(x));
    const files = ids.length ? await exportFiles(ids).catch(() => ({})) : {};
    const blob = new Blob([JSON.stringify({ ...all, files }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kuran-kursu-yedek-${localIso()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importData = async (f?: File) => {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text()) as State & { files?: Parameters<typeof importFiles>[0] };
      await importFiles(data.files).catch(() => undefined);
      replaceAll(data);
      setMsg("Yedek geri yüklendi.");
    } catch {
      setMsg("Dosya okunamadı.");
    }
  };
  const btn = "flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left text-sm";

  return (
    <>
      <h2 className="mt-7 font-serif text-3xl font-bold">Menü</h2>
      <p className="mt-1 text-sm text-muted-foreground">{groupLabel(group)} Grubu</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[["Talebe", students.length], ["Yoklama", attendance.length], ["Tutanak", tutanaklar.length]].map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-surface p-3"><p className="font-serif text-2xl font-bold">{v}</p><p className="text-xs text-muted-foreground">{l}</p></div>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        <button onClick={() => setAddOpen(true)} className={`${btn} border-primary bg-primary text-primary-foreground`}><UserPlus className="h-5 w-5" /> Talebe Ekle</button>
        <Sheet open={addOpen} onClose={() => setAddOpen(false)} title={`Yeni Talebe · ${groupLabel(group)}`}>
          {addOpen && <Suspense fallback={null}><PhotoNamesImport onDone={(n) => { setAddOpen(false); setMsg(`${n} talebe eklendi.`); }} /></Suspense>}
          <StudentForm initial={emptyStudent} onSubmit={(s) => { addStudent(s); setAddOpen(false); setMsg(`${s.name} eklendi.`); }} />
        </Sheet>
        <Button variant="outline" onClick={() => {
          const next = withTrialStudents(students, group);
          importAll({ students: next, attendance, tutanaklar });
          setMsg(`${next.length - students.length} deneme talebesi eklendi; mevcut kayıtlar korundu.`);
        }} disabled={students.filter((student) => student.id.startsWith(trialPrefix(group))).length === 55} className="h-auto w-full justify-start whitespace-normal py-4">
          <UserPlus className="text-primary" /> 55 deneme talebesi ekle
        </Button>
        <Link to="/ai-tutanak" className={btn}><Sparkles className="h-5 w-5 text-primary" /> AI ile Tutanak Hazırla</Link>
        <button onClick={() => setReportOpen(true)} className={btn}><FileDown className="h-5 w-5 text-primary" /> Yoklama Raporu İndir (PDF / Excel)</button>
        <button onClick={() => setMailOpen(true)} className={btn}><Mail className="h-5 w-5 text-primary" /> Otomatik Rapor E-postası</button>
        <Suspense fallback={null}>
          {mailOpen && <EmailReports open onClose={() => setMailOpen(false)} />}
          {reportOpen && <ReportSheet open onClose={() => setReportOpen(false)} />}
          {blankOpen && <BlankAttendanceSheet open onClose={() => setBlankOpen(false)} />}
          {perfOpen && <PerfDiagnosis open onClose={() => setPerfOpen(false)} />}
        </Suspense>
        <Button variant="outline" onClick={() => setBlankOpen(true)} className="h-auto w-full justify-start whitespace-normal py-4"><FileDown className="text-primary" /> Boş Yoklama Çizelgesi İndir (PDF / Excel)</Button>
        <button onClick={exportData} className={btn}><Download className="h-5 w-5 text-primary" /> Verileri Yedekle (indir)</button>
        <button onClick={() => fileRef.current?.click()} className={btn}><Upload className="h-5 w-5 text-primary" /> Yedeği Geri Yükle</button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => importData(e.target.files?.[0])} />
        <button onClick={() => setPerfOpen(true)} className={btn}><Gauge className="h-5 w-5 text-primary" /> Yavaşlık Teşhisi (AI)</button>
        {msg && <p className="text-center text-sm text-primary">{msg}</p>}
        <p className="text-center text-xs text-muted-foreground">Veriler bu cihazda saklanır.</p>
      </div>
    </>
  );
}
