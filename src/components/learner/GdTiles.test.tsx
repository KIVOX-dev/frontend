import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ParticipantTile } from "./GdTiles";

const props = { slot: "bot0", name: "Kiran", role: "Dominator", active: false, levelRef: { current: 0 } };

describe("ParticipantTile bot avatar", () => {
  it("asks for the bot's photo first", () => {
    const { container } = render(<ParticipantTile {...props} />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/gd-avatars/bot0.jpg");
  });

  it("falls back to the drawn face when the photo file is missing", () => {
    const { container } = render(<ParticipantTile {...props} />);
    fireEvent.error(container.querySelector("img") as HTMLImageElement);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
