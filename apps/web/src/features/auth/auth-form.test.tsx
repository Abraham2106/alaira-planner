import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Feature } from "./Feature.js";

afterEach(() => {
  cleanup();
  document.getElementById("feature-host")?.remove();
  window.location.hash = "#/";
});

describe("auth login", () => {
  it("renderiza organización, correo y contraseña cuando el hash es #/entrar", async () => {
    window.location.hash = "#/entrar";
    const host = document.createElement("div");
    host.id = "feature-host";
    document.body.appendChild(host);

    render(<Feature />);

    await waitFor(() => {
      expect(screen.getByLabelText("Organización")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Correo")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "password");
  });
});
