import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DataPresentation } from "@/components/learner/DataPresentation";
import { parseDataPresentation } from "./dataPresentation";

const dir = path.join(process.cwd(), "public");
const file = fs.readdirSync(dir).find((f) => f.startsWith("datainterpretation_json"));
const questions: { data_presentation: string }[] = file ? JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) : [];

describe("parseDataPresentation", () => {
  it("reads every Data Interpretation question in the bank", () => {
    expect(questions.length).toBeGreaterThan(0);
    const failed = questions.map((q) => q.data_presentation).filter((t) => parseDataPresentation(t) === null);
    expect(failed).toEqual([]);
  });

  it("parses label=value bar data", () => {
    expect(parseDataPresentation("Bar chart: Sales of products A, B, C in 2019: A=120, B=150, C=90.")).toMatchObject({
      kind: "bar", labels: ["A", "B", "C"], series: [{ values: [120, 150, 90] }],
    });
  });

  it("parses a bare list and numbers the rows", () => {
    expect(parseDataPresentation("Table: Number of hours worked per week: 40,45,38,42,50.")).toMatchObject({
      kind: "table", labels: ["1", "2", "3", "4", "5"], series: [{ values: [40, 45, 38, 42, 50] }],
    });
  });

  it("expands a year range and keeps 'k' values proportional", () => {
    expect(parseDataPresentation("Line graph: Population of a town from 2015-2020: 50k,55k,60k,65k,70k,75k.")).toMatchObject({
      labels: ["2015", "2016", "2017", "2018", "2019", "2020"], series: [{ values: [50, 55, 60, 65, 70, 75] }],
    });
  });

  it("separates a title from named series", () => {
    expect(parseDataPresentation("Table: Marks of 5 students in Math and Science. Math: 85,78,92,67,89; Science: 90,82,88,70,85.")).toMatchObject({
      title: "Marks of 5 students in Math and Science", series: [{ name: "Math" }, { name: "Science" }],
    });
  });

  it("reads a row-per-series matrix", () => {
    expect(parseDataPresentation("Table: Marks of 3 subjects for 2 students: Student1: Math=80, Sci=85, Eng=75; Student2: Math=70, Sci=90, Eng=80.")).toMatchObject({
      seriesAsRows: true, labels: ["Math", "Sci", "Eng"], series: [{ name: "Student1", values: [80, 85, 75] }, { name: "Student2", values: [70, 90, 80] }],
    });
  });

  it("returns null for text it cannot read", () => {
    expect(parseDataPresentation("Look at the figure below")).toBeNull();
    expect(parseDataPresentation("Venn diagram: A=5, B=3")).toBeNull();
    expect(parseDataPresentation("")).toBeNull();
  });
});

describe("DataPresentation", () => {
  it.each([
    ["bar", "Bar chart: Sales: A=120, B=150, C=90."],
    ["line", "Line graph: Visitors: Mon=120, Tue=150, Wed=130."],
    ["pie", "Pie chart: Spend: Rent=30%, Food=25%, Other=45%."],
    ["table", "Table: Employees: HR=12, IT=35, Sales=28."],
  ])("draws a %s", (kind, text) => {
    const html = renderToStaticMarkup(<DataPresentation text={text} />);
    expect(html).toContain("<figure");
    expect(html).toContain(kind === "table" ? "<table" : "<svg");
  });

  it("falls back to the original text when it cannot be parsed", () => {
    const html = renderToStaticMarkup(<DataPresentation text="Figure shows something odd" />);
    expect(html).toContain("Figure shows something odd");
    expect(html).not.toContain("<svg");
  });
});
