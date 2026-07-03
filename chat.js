let messages = [];

export function appendMessageToDOM(role, content, container) {
  const p = document.createElement("p");
  p.className = `message message--${role}`;
  p.textContent = content;
  container.appendChild(p);
  container.scrollTop = container.scrollHeight;
}

export function handleSendMessage(text, container) {
  const trimmed = text.trim();
  if (!trimmed) return;

  messages.push({ role: "user", content: trimmed });
  appendMessageToDOM("user", trimmed, container);

  // Esta es una respuesta tremporal - se reempplaza por la AI real en otro paso
  const fakeReply =
    "Aún no puedo responderte de verdad, pequeño. Eso lo conectamos pronto.";
  messages.push({ role: "ai", content: fakeReply });
  appendMessageToDOM("ai", fakeReply, container);
}
