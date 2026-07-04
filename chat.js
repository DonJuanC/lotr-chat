import { isValidMessage, parseAIResponse } from "./utils.js";
import { CHARACTERS } from "./characters.js";
let messages = [];
let activeCharacterId = "gandalf";

export function setActiveCharacter(characterId) {
  activeCharacterId = characterId;
  messages = [];
}

export function getActiveCharacterId() {
  return activeCharacterId;
}

export function appendMessageToDOM(role, content, container) {
  const p = document.createElement("p");
  p.className = `message message--${role}`;
  p.textContent = content;
  container.appendChild(p);
  container.scrollTop = container.scrollHeight;
}

export function renderExistingMessages(container) {
  messages.forEach((msg) => {
    const role = msg.role === "user" ? "user" : "ai";
    appendMessageToDOM(role, msg.content, container);
  });
}

export async function handleSendMessage(text, container) {
  if (!isValidMessage(text)) return;
  const trimmed = text.trim();

  messages.push({ role: "user", content: trimmed });
  appendMessageToDOM("user", trimmed, container);

  const typingEl = showTypingIndicator(container);

  try {
    const data = await sendToAI(messages);
    hideTypingIndicator(typingEl);

    const replyText = parseAIResponse(data);
    messages.push({ role: "ai", content: replyText });
    appendMessageToDOM("ai", replyText, container);
  } catch (error) {
    hideTypingIndicator(typingEl);
    appendMessageToDOM("ai", `⚠️ ${error.message}`, container);
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
  const response = await fetch("/api/functions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messagesToSend,
      characterId: activeCharacterId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Error HTTP ${response.status}`);
  }

  return data;
}
