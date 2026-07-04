import { describe, it, expect } from "vitest";
import { isValidMessage, parseAIResponse } from "../utils.js";

describe("isValidMessage", () => {
  it("retorna true para un mensaje válido", () => {
    expect(isValidMessage("Hola Gandalf")).toBe(true);
  });

  it("retorna false para string vacío", () => {
    expect(isValidMessage("")).toBe(false);
  });

  it("retorna false para solo espacios", () => {
    expect(isValidMessage("   ")).toBe(false);
  });

  it("retorna false para null", () => {
    expect(isValidMessage(null)).toBe(false);
  });

  it("retorna false para un mensaje de más de 500 caracteres", () => {
    const largo = "a".repeat(501);
    expect(isValidMessage(largo)).toBe(false);
  });
});

describe("parseAIResponse", () => {
  it("extrae el texto de una respuesta válida", () => {
    expect(parseAIResponse({ reply: " Hola, soy Gandalf.  " })).toBe(
      "Hola, soy Gandalf.",
    );
  });

  it("retorna fallback si no hay reply", () => {
    expect(parseAIResponse({})).toBe(
      "No pude procesar la respuesta del personaje.",
    );
  });

  it("retorna fallback para null", () => {
    expect(parseAIResponse(null)).toBe(
      "No pude procesar la respuesta del personaje.",
    );
  });

  it("retorna fallback si reply no es string.", () => {
    expect(parseAIResponse({ reply: 123 })).toBe(
      "No pude procesar la respuesta del personaje.",
    );
  });
});
