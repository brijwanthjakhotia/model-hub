// Registers jest-dom matchers (toHaveTextContent, toBeInTheDocument, …) on
// Vitest's expect. Safe to load in the node environment — matchers are only
// evaluated against DOM nodes inside jsdom test files.
import "@testing-library/jest-dom/vitest";
