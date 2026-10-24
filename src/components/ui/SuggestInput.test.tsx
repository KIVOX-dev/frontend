import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SuggestInput } from "./SuggestInput";

const CITIES = ["Bengaluru, Karnataka", "Chennai, Tamil Nadu", "Coimbatore, Tamil Nadu", "Remote"];

function setup(initial = "") {
  const onChange = vi.fn();
  render(<SuggestInput value={initial} onChange={onChange} suggestions={CITIES} placeholder="Location" />);
  return { onChange, input: screen.getByPlaceholderText("Location") };
}

describe("SuggestInput", () => {
  it("offers matches as you type, names that start with the text first", () => {
    const { input } = setup("c");
    fireEvent.focus(input);
    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Chennai, Tamil Nadu", "Coimbatore, Tamil Nadu", "Bengaluru, Karnataka"].slice(0, options.length));
    expect(options[0]).toBe("Chennai, Tamil Nadu");
  });

  it("fills the field when a suggestion is chosen", () => {
    const { input, onChange } = setup("ben");
    fireEvent.focus(input);
    fireEvent.mouseDown(screen.getByRole("option", { name: "Bengaluru, Karnataka" }));
    expect(onChange).toHaveBeenCalledWith("Bengaluru, Karnataka");
  });

  it("supports the keyboard: arrows to move, Enter to choose, Escape to close", () => {
    const { input, onChange } = setup("");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("Chennai, Tamil Nadu");

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("never blocks text that isn't in the list", () => {
    const { input, onChange } = setup("");
    fireEvent.change(input, { target: { value: "Smalltown" } });
    expect(onChange).toHaveBeenCalledWith("Smalltown");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
