import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendToAI } from "../chat.js";

global.fetch = vi.fn();

describe("sendToAI", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it("llama a /api/functions con POST y el historial", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: "Hola, pequeño." }),
    });

    await sendToAI([{ role: "user", content: "Hola" }]);

    expect(fetch).toHaveBeenCalledWith(
      "/api/functions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("retorna los datos cuando la respuesta es exitosa", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: "Elemental." }),
    });

    const result = await sendToAI([{ role: "user", content: "Hola" }]);
    expect(result.reply).toBe("Elemental.");
  });

  it("lanza error cuando response.ok es false", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: "Límite alcanzado." }),
    });

    await expect(sendToAI([{ role: "user", content: "Hola" }])).rejects.toThrow(
      "Límite alcanzado.",
    );
  });

  it("propaga errores de red", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));
    await expect(sendToAI([{ role: "user", content: "Hola" }])).rejects.toThrow(
      "Network error",
    );
  });
});
