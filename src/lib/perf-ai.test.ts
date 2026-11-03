import { describe, expect, it } from "vitest";
import { buildPerfPrompt, validatePerfInput } from "./perf-ai";

describe("perf diagnosis input", () => {
  it("requires page, device and symptoms", () => {
    expect(() => validatePerfInput({ device: "iPhone", symptoms: "yavaş" })).toThrow("sayfayı");
    expect(() => validatePerfInput({ page: "Yoklama", symptoms: "yavaş" })).toThrow("cihazı");
    expect(() => validatePerfInput({ page: "Yoklama", device: "iPhone", symptoms: " " })).toThrow("gözlemlediğinizi");
  });
  it("drops invalid metrics and includes valid ones in the prompt", () => {
    const v = validatePerfInput({ page: "Yoklama", device: "iPhone", symptoms: "beyaz ekran", metrics: { loadMs: 2400.4, resources: -1 } });
    const p = buildPerfPrompt(v);
    expect(p).toContain("Tam açılış süresi: 2400 ms");
    expect(p).not.toContain("dosya sayısı");
  });
});
