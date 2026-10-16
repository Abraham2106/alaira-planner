import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppShell } from "./AppShell.js";

afterEach(() => {
  cleanup();
  window.location.hash = "";
});

describe("AppShell", () => {
  it("supports skip link and in-shell navigation with aria-current", () => {
    render(<AppShell />);
    expect(screen.getByRole("link", { name: /Saltar al contenido principal/i })).toHaveAttribute(
      "href",
      "#main-content",
    );
    const myWork = screen.getByRole("link", { name: /Mi trabajo/i });
    fireEvent.click(myWork);
    expect(myWork).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { level: 1, name: /Mi trabajo/i })).toBeTruthy();
  });
});
