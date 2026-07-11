import { isValidMessage, parseAIResponse } from "./utils.js";
import { CHARACTERS } from "./characters.js";

const ACTIVE_CHARACTER_KEY = "lotr-chat-active-character";

function getStorageKey(characterId) {
  return `lotr-chat-history-${characterId}`;
}

export function saveHistoryToStorage() {
  try {
    localStorage.setItem(
      getStorageKey(activeCharacterId),
      JSON.stringify(messages),
    );
  } catch (e) {
    console.warn("[chat] No se pudo guardar el historial.", e.message);
  }
}

export function loadHistoryFromStorage(characterId) {
  try {
    const stored = localStorage.getItem(getStorageKey(characterId));
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("[chat] Error leyendo localStorage:", e.message);
    return [];
  }
}

export function hasStoredHistory(characterId) {
  try {
    return !!localStorage.getItem(getStorageKey(characterId));
  } catch {
    return false;
  }
}

export function clearHistory() {
  messages = [];
  try {
    localStorage.removeItem(getStorageKey(activeCharacterId));
  } catch (e) {
    console.warn("[chat] No se puede borrar el historial:", e.message);
  }
}

// Arrancan con un valor por defecto, no leyendo localStorage todavía: eso
// pasaba antes al cargar el módulo, lo que rompía cualquier test (o
// cualquier otro contexto sin DOM) que solo quisiera importar una función
// de acá, como sendToAI, sin tener localStorage disponible.
let activeCharacterId = "gandalf";
let messages = [];

// Inicialización explícita: recién acá se toca localStorage. app.js la
// llama una sola vez al arrancar, antes del primer render.
export function initChat() {
  activeCharacterId = localStorage.getItem(ACTIVE_CHARACTER_KEY) || "gandalf";
  messages = loadHistoryFromStorage(activeCharacterId);
}

export function setActiveCharacter(characterId) {
  activeCharacterId = characterId;
  localStorage.setItem(ACTIVE_CHARACTER_KEY, characterId);
  messages = loadHistoryFromStorage(characterId);
}

export function getActiveCharacterId() {
  return activeCharacterId;
}

export function appendMessageToDOM(role, content, container, timestamp) {
  const messageEl = document.createElement("div");
  messageEl.className = `message message--${role}`;

  const textEl = document.createElement("p");
  textEl.className = "message__text";
  textEl.textContent = content;
  messageEl.appendChild(textEl);

  const meta = document.createElement("div");
  meta.className = "message__meta";

  if (timestamp) {
    const time = document.createElement("span");
    time.className = "message__time";
    time.textContent = new Date(timestamp).toLocaleTimeString("es", {
      hour: "2-digit",
      minute: "2-digit",
    });
    meta.appendChild(time);
  }

  if (role === "ai") {
    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "message__copy";
    copyBtn.textContent = "📋";
    copyBtn.setAttribute("aria-label", "Copiar respuesta");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(content).then(() => {
        copyBtn.textContent = "✅";
        copyBtn.setAttribute("aria-label", "Copiado");
        setTimeout(() => {
          copyBtn.textContent = "📋";
          copyBtn.setAttribute("aria-label", "Copiar respuesta");
        }, 1500);
      });
    });
    meta.appendChild(copyBtn);
  }

  messageEl.appendChild(meta);
  container.appendChild(messageEl);
  container.scrollTop = container.scrollHeight;
}

export function renderExistingMessages(container) {
  messages.forEach((msg) => {
    const role = msg.role === "user" ? "user" : "ai";
    appendMessageToDOM(role, msg.content, container, msg.timestamp);
  });
}

export async function handleSendMessage(text, container) {
  if (!isValidMessage(text)) return;
  const trimmed = text.trim();

  messages.push({ role: "user", content: trimmed, timestamp: Date.now() });
  appendMessageToDOM("user", trimmed, container, Date.now());

  const typingEl = showTypingIndicator(container);

  try {
    const data = await sendToAI(messages);
    hideTypingIndicator(typingEl);

    const replyText = parseAIResponse(data);
    messages.push({ role: "ai", content: replyText, timestamp: Date.now() });
    appendMessageToDOM("ai", replyText, container, Date.now());
    saveHistoryToStorage();
  } catch (error) {
    hideTypingIndicator(typingEl);
    // error.status solo existe si la falla vino de una respuesta HTTP no-ok
    // (ver sendToAI); un error de red (sin conexión, etc.) no tiene código.
    const code = error.status ? ` [${error.status}]` : "";
    appendMessageToDOM(
      "ai",
      `🔮 El Palantír no está viendo con claridad ahora mismo${code} (${error.message})`,
      container,
    );
    messages.pop();
  }
}

function showTypingIndicator(container) {
  const character = CHARACTERS.find((c) => c.id === activeCharacterId);
  const p = document.createElement("p");
  p.className = "message message--ai";
  p.id = "typing-indicator";
  p.textContent = `${character.name} está escribiendo...`;
  container.appendChild(p);
  container.scrollTop = container.scrollHeight;
  return p;
}

function hideTypingIndicator(el) {
  if (el) el.remove();
}

export async function sendToAI(messagesToSend) {
  const payload = {
    messages: messagesToSend,
    characterId: activeCharacterId,
  };

  const response = await fetch("/api/functions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || `Error HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return data;
}
