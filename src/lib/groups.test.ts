import { describe, expect, it } from "vitest";
import { groupOf, replaceGroup, sliceGroup } from "./groups";
import type { State, Student } from "./store";

const st = (id: string, sinif?: "ibtidai" | "ihzari"): Student => ({
  id, name: id, age: "", group: "", city: "", startDate: "", guardian: "", phone: "", status: "İyi", ...(sinif ? { sinif } : {}),
});
const row = (studentId: string) => ({ id: `r-${studentId}`, studentId, date: "2026-11-02", vakitler: [], ders: false, durum: "normal" as const });
const tut = (studentId: string) => ({ id: `t-${studentId}`, studentId, title: "", tag: "", date: "2026-11-02", body: "", positive: true, signed: false });

const state: State = {
  students: [st("old"), st("a", "ibtidai"), st("z", "ihzari")],
  attendance: [row("old"), row("a"), row("z")],
  tutanaklar: [tut("a"), tut("z")],
};

describe("groups", () => {
  it("puts students saved before groups existed into İbtidai", () => {
    expect(groupOf(st("old"))).toBe("ibtidai");
  });

  it("shows İhzari only its own students, attendance and tutanak", () => {
    const g = sliceGroup(state, "ihzari");
    expect(g.students.map((s) => s.id)).toEqual(["z"]);
    expect(g.attendance.map((r) => r.studentId)).toEqual(["z"]);
    expect(g.tutanaklar.map((t) => t.studentId)).toEqual(["z"]);
  });

  it("shows İbtidai its own students including old ones", () => {
    expect(sliceGroup(state, "ibtidai").students.map((s) => s.id)).toEqual(["old", "a"]);
  });

  it("changing one group's data never touches the other group", () => {
    const next = replaceGroup(state, "ibtidai", { students: [st("new")], attendance: [row("new")], tutanaklar: [] });
    expect(sliceGroup(next, "ihzari")).toEqual(sliceGroup(state, "ihzari"));
    expect(sliceGroup(next, "ibtidai").students.map((s) => s.id)).toEqual(["new"]);
    expect(next.attendance.some((r) => r.studentId === "a")).toBe(false);
  });
});

describe("download heading", () => {
  it("names HARAR 5 and the group on every çizelge", async () => {
    const { chartHeading } = await import("./groups");
    expect(chartHeading("ihzari")).toBe("HARAR 5 İHZARİ GRUP YOKLAMA TAKİP ÇİZELGESİ");
    expect(chartHeading("ibtidai")).toBe("HARAR 5 İBTİDAİ GRUP YOKLAMA TAKİP ÇİZELGESİ");
  });
});
