import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WorkHub } from "./WorkHub.js";

afterEach(() => {
  cleanup();
});

describe("WorkHub example", () => {
  it("stays an isolated illustration with its own views", () => {
    render(<WorkHub />);
    expect(screen.getByText(/ESPACIO DE EJEMPLO/i)).toBeTruthy();
    expect(screen.getByText(/8 de 8 tareas/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tablero" }));
    expect(screen.getByRole("button", { name: "Tablero" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/8 de 8 tareas/)).toBeTruthy();
  });
});
