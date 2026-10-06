import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PracticeResults, type ResultItem } from "./PracticeResults";

const items: ResultItem[] = [
  { question: "What is the range?", options: ["10", "11", "12", "13"], correct: "12", picked: "12", data_presentation: "Table: Number of hours worked per week: 40,45,38,42,50.", explanation: "Max 50 - min 38 = 12." },
  { question: "Which year had the highest sales?", options: ["2018", "2019"], correct: "2019", picked: "2018", data_presentation: "Bar chart: Sales: 2018=10, 2019=20." },
  { question: "Share of rent?", options: ["30%", "25%"], correct: "30%", picked: null, data_presentation: "Pie chart: Spend: Rent=30%, Food=25%, Other=45%." },
];

const render = (previous: number[]) =>
  renderToStaticMarkup(
    <PracticeResults title="Data Interpretation" accent="#D97706" items={items} timeUsedSeconds={95} timeBudgetSeconds={270} previousAttempts={previous} onBack={() => {}} onRetry={() => {}} onRetryMissed={() => {}} />,
  );

describe("PracticeResults", () => {
  it("shows the score, breakdown and the full answer review with diagrams and explanations", () => {
    const html = render([40, 55]);
    expect(html).toContain("33%"); // 1 of 3 correct
    expect(html).toContain("Answer breakdown");
    expect(html).toContain("Accuracy by diagram type");
    expect(html).toContain("Accuracy trend");
    expect(html).toContain("1:35"); // time taken
    expect(html).toContain("Max 50 - min 38 = 12.");
    expect(html).toContain("Correct answer");
    expect(html).toContain("Your answer");
    expect(html).toContain("Retry 2 missed");
    expect(html).toContain("<table"); // diagram redrawn in the review
    expect((html.match(/<figure/g) || []).length).toBe(3);
  });

  it("invites a second attempt instead of drawing a one-point trend", () => {
    const html = render([]);
    expect(html).toContain("unlock your trend line");
    expect(html).toContain("first attempt here");
  });
});
