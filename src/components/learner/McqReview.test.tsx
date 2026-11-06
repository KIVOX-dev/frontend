import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
vi.mock("@/lib/api", () => ({ api: { post: (...a: unknown[]) => post(...a) } }));

import { McqReview, oneLine } from "./McqReview";

const questions = [
  { id: 1, section: "Quantitative", question: "2 + 2?", options: ["3", "4", "5", "6"], correct_answer: "4" },
  { id: 2, section: "Verbal", question: "Pick the synonym of big", options: ["tiny", "huge", "red", "slow"], correct_answer: "huge" },
  { id: 3, section: "Logical", question: "Next in 2, 4, 6?", options: ["7", "8", "9", "10"], correct_answer: "8" },
];

describe("McqReview", () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({
      data: {
        explanations: [
          { text: "Adding two and two gives four. It is basic arithmetic.", disputed: false, suggested_answer: null },
          { text: "Huge means very large, the same as big in size.", disputed: false, suggested_answer: null },
          { text: "The sequence adds two each time, so eight is next. Check the pattern.", disputed: false, suggested_answer: null },
        ],
      },
    });
  });

  it("shows missed questions by default with correct, wrong and unanswered options marked", async () => {
    render(<McqReview questions={questions} answers={{ 1: "4", 2: "tiny" }} />);
    expect(screen.getByText("Missed (2)")).toBeTruthy();
    expect(screen.queryByText("2 + 2?")).toBeNull(); // answered correctly: hidden in the Missed view
    expect(screen.getByText("Pick the synonym of big")).toBeTruthy();
    expect(screen.getByText("✗ Your answer")).toBeTruthy(); // tiny
    expect(screen.getByText("Wrong")).toBeTruthy();
    expect(screen.getByText("Not answered")).toBeTruthy(); // Q3
    expect(screen.getAllByText("✓ Correct answer").length).toBe(2);
    await waitFor(() => expect(screen.getAllByText(/Why/).length).toBe(2));
  });

  it("shows only a one-line explanation, expandable with More", async () => {
    render(<McqReview questions={questions} answers={{ 1: "4", 2: "tiny" }} />);
    await waitFor(() => expect(screen.getByText(/Huge means very large, the same as big in size\./)).toBeTruthy());
    expect(screen.queryByText(/It is basic arithmetic/)).toBeNull();
    await userEvent.click(screen.getAllByText("More")[0]);
    expect(screen.getAllByText("Less").length).toBe(1);
  });

  it("lists every question under All and reports the one-line explanations to the parent", async () => {
    const onExplained = vi.fn();
    render(<McqReview questions={questions} answers={{ 1: "4", 2: "tiny" }} onExplained={onExplained} />);
    await userEvent.click(screen.getByText("All (3)"));
    expect(screen.getByText("2 + 2?")).toBeTruthy();
    expect(screen.getByText("Correct")).toBeTruthy();
    await waitFor(() => expect(onExplained).toHaveBeenLastCalledWith({
      1: "Adding two and two gives four.",
      2: "Huge means very large, the same as big in size.",
      3: "The sequence adds two each time, so eight is next.",
    }));
  });

  it("says so when nothing was missed", () => {
    render(<McqReview questions={[questions[0]]} answers={{ 1: "4" }} />);
    expect(screen.getByText("All (1)")).toBeTruthy();
    expect(screen.getByText("Correct")).toBeTruthy();
  });
});

describe("oneLine", () => {
  it("returns the first sentence and caps long text", () => {
    expect(oneLine("First sentence is long enough here. Second one.")).toBe("First sentence is long enough here.");
    expect(oneLine("x".repeat(400)).length).toBeLessThanOrEqual(220);
  });
});
