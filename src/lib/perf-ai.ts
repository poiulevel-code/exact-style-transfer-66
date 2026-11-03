// Pure prompt building/validation for the AI slow-page diagnosis (tested).

export const PERF_PAGES = ["Talebeler (ana sayfa)", "Yoklama", "Tutanak / Kâğıt", "AI Tutanak", "Menü", "Talebe detayı", "Uygulamanın ilk açılışı"] as const;
export const PERF_DEVICES = ["Android telefon", "iPhone", "Tablet", "Bilgisayar"] as const;

export const MAX_SYMPTOM_LEN = 2000;

export type PerfMetrics = { loadMs?: number | undefined; domReadyMs?: number | undefined; resources?: number | undefined; transferKb?: number | undefined; connection?: string | undefined; memoryGb?: number | undefined; cores?: number | undefined };
export type PerfInput = { page: string; device: string; symptoms: string; metrics?: PerfMetrics };

export const PERF_INSTRUCTIONS = `Sen bir web performans uzmanısın. Bir Kur'an kursu yoklama uygulamasının yöneticisi yavaşlık bildiriyor.
Uygulama hakkında bilinenler: React ile yazılmış bir web uygulaması; veriler cihazın tarayıcı hafızasında tutulur; PDF/Excel kütüphaneleri sadece rapor indirilirken yüklenir; fotoğraflar cihazda saklanır.
Kurallar:
- Türkçe, sade ve teknik olmayan bir dille yaz; yönetici programcı değildir.
- Önce "Olası nedenler" başlığıyla en olasıdan başlayarak 2-4 madde yaz.
- Sonra "Şimdi deneyin" başlığıyla kullanıcının hemen yapabileceği 3-5 numaralı adım yaz (ör. sekmeleri kapatmak, uygulamayı ana ekrana eklemek, eski yedekleri silmek, internet bağlantısını kontrol etmek).
- Son olarak "Geliştiriciye iletin" başlığıyla 1-3 kısa madde yaz.
- Ölçümler verildiyse onları yorumla; verilmeyen bilgileri uydurma.
- Toplam 200 kelimeyi geçme. Markdown işaretleri olarak yalnızca başlık için düz satır ve "-" / "1." kullan.`;

export function validatePerfInput(input: Partial<PerfInput> | undefined): PerfInput {
  const page = String(input?.page ?? "").trim().slice(0, 80);
  const device = String(input?.device ?? "").trim().slice(0, 80);
  const symptoms = String(input?.symptoms ?? "").trim();
  if (!page) throw new Error("Yavaş açılan sayfayı seçin.");
  if (!device) throw new Error("Kullandığınız cihazı seçin.");
  if (!symptoms) throw new Error("Ne gözlemlediğinizi kısaca yazın.");
  if (symptoms.length > MAX_SYMPTOM_LEN) throw new Error(`Açıklama en fazla ${MAX_SYMPTOM_LEN} karakter olabilir.`);
  const m = input?.metrics ?? {};
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : undefined);
  return {
    page, device, symptoms,
    metrics: { loadMs: num(m.loadMs), domReadyMs: num(m.domReadyMs), resources: num(m.resources), transferKb: num(m.transferKb), memoryGb: num(m.memoryGb), cores: num(m.cores), connection: m.connection ? String(m.connection).slice(0, 20) : undefined },
  };
}

export function buildPerfPrompt(input: PerfInput): string {
  const m = input.metrics ?? {};
  const lines = [
    m.loadMs !== undefined && `Tam açılış süresi: ${m.loadMs} ms`,
    m.domReadyMs !== undefined && `Sayfa iskeleti hazır: ${m.domReadyMs} ms`,
    m.resources !== undefined && `Yüklenen dosya sayısı: ${m.resources}`,
    m.transferKb !== undefined && `İndirilen veri: ${m.transferKb} KB`,
    m.connection && `Bağlantı türü: ${m.connection}`,
    m.memoryGb !== undefined && `Cihaz belleği: ~${m.memoryGb} GB`,
    m.cores !== undefined && `İşlemci çekirdeği: ${m.cores}`,
  ].filter(Boolean);
  return `Yavaş sayfa: ${input.page}\nCihaz: ${input.device}\nGözlemlenen belirtiler:\n${input.symptoms}\n\nCihazdan otomatik ölçümler:\n${lines.length ? lines.join("\n") : "(ölçüm yok)"}`;
}
