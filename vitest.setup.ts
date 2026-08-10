import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Not using vitest.config.ts's `globals: true` (deliberately — this project
// doesn't want ambient describe/it/expect elsewhere), so RTL's own
// auto-cleanup-on-global-afterEach never registers itself. Without this,
// each test's rendered DOM piles up across the whole file instead of
// resetting, and later `getBy*` queries start matching more than one
// element.
afterEach(() => {
  cleanup();
});
