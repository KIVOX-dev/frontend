import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GdResultScreen, type GdRoundData } from "./GdResultScreen";

const result: GdRoundData = {
  overall_score: 6.4,
  parameter_scores: {
    content_relevance: 7, communication_clarity: 6, initiative: 8,
    listening_building: 5, leadership_collaboration: 6, time_management_conclusion: 7,
  },
  payload: {
    topic: "Remote work",
    metrics: {
      speaking_time_share: 24.5, student_turns: 3, interruptions_made: 1, interruptions_received: 2,
      references_to_others: 2, filler_words: 4, opened_discussion: true, concluded_discussion: false,
    },
    transcript: [
      { speaker: "You", is_student: true, text: "I will open with productivity." },
      { speaker: "Kiran", is_student: false, text: "I disagree completely.", interrupts: true },
      { speaker: "Ari", is_student: false, text: "Let us hear everyone." },
    ],
  },
};

describe("GdResultScreen", () => {
  it("shows the score per parameter out of 10 and the automatic metrics", () => {
    render(<GdResultScreen result={result} onContinue={() => undefined} />);
    expect(screen.getByText("6.4")).toBeTruthy();
    expect(screen.getByText("Content & relevance")).toBeTruthy();
    expect(screen.getByLabelText("Initiative: 8 out of 10")).toBeTruthy();
    expect(screen.getByLabelText("Listening & building on others: 5 out of 10")).toBeTruthy();
    expect(screen.getByText("24.5%")).toBeTruthy();
    expect(screen.getByText("Interruptions made")).toBeTruthy();
    expect(screen.getByText("Filler words")).toBeTruthy();
    expect(screen.getByText("You opened the discussion").nextSibling?.textContent).toBe("Yes");
    expect(screen.getByText("You concluded the discussion").nextSibling?.textContent).toBe("No");
  });

  it("shows the full transcript with the student's turns highlighted", () => {
    const { container } = render(<GdResultScreen result={result} onContinue={() => undefined} />);
    expect(screen.getByText("I will open with productivity.")).toBeTruthy();
    expect(screen.getByText(/Kiran \(cut in\)/)).toBeTruthy();
    expect(container.querySelectorAll('[data-student="true"]').length).toBe(1);
    expect(container.querySelectorAll('[data-student="false"]').length).toBe(2);
  });

  it("only shows scores and answers: no pass/fail, summary or suggestions", () => {
    const { container } = render(<GdResultScreen result={result} onContinue={() => undefined} />);
    expect(container.textContent).not.toMatch(/\b(pass|passed|fail|failed|ready|not ready)\b/i);
    expect(container.textContent).not.toMatch(/suggestion|improve|summary/i);
  });

  it("continues to Round 3 when the button is pressed", async () => {
    const onContinue = vi.fn();
    render(<GdResultScreen result={result} onContinue={onContinue} />);
    await userEvent.click(screen.getByRole("button", { name: "Continue to Round 3" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
