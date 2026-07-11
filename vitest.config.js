import { defineConfig } from "vitest/config";

// jsdom simula un DOM (document, localStorage, etc.) dentro de Node para que
// los tests puedan correr. chat.js ya no depende de esto para poder
// importarse (ver initChat() en chat.js), pero funciones como
// appendMessageToDOM sí tocan `document`, y este entorno es lo que las hace
// testeables a futuro sin config adicional.
export default defineConfig({
  test: {
    environment: "jsdom",
  },
});
