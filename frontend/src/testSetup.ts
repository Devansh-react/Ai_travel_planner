import { expect } from "vitest";

// Vitest runner mode needs expect on the global before jest-dom extends it.
globalThis.expect = expect;

await import("@testing-library/jest-dom");
